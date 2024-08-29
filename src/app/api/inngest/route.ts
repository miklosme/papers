import { Inngest } from 'inngest'
import { serve } from 'inngest/next'
import { Octokit } from 'octokit'
import * as cheerio from 'cheerio'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  FileState,
  GoogleAICacheManager,
  GoogleAIFileManager,
} from '@google/generative-ai/server'
import fs from 'fs/promises'
import path from 'path'

export const maxDuration = 60

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

const owner = 'miklosme'
const repo = 'papers'
const branch = 'master'

function getFileName(arxivId: string) {
  return `data/${arxivId}.json`
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })
    return true
  } catch (error) {
    if (error.status === 404) {
      return false
    }
    throw error
  }
}

async function createOrUpdateFile(
  path: string,
  content: string,
  message: string,
) {
  try {
    const existingFile = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })

    if ('content' in existingFile.data) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha: existingFile.data.sha,
        branch,
      })
    }
  } catch (error) {
    if (error.status === 404) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
      })
    } else {
      throw error
    }
  }
}

const inngest = new Inngest({ id: 'arxiv-papers-web-scraper' })

const runScrape = inngest.createFunction(
  { id: 'run-scrape' },
  { event: 'scraper/run' },
  async ({ event, step }) => {
    const { url } = event.data

    if (!url) {
      throw new Error('URL is required to be scraped')
    }

    const { hrefList } = await step.run('scrape-data', async () => {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const text = await resp.text()

      const $ = cheerio.load(text)

      const newPdfs = $('dl#articles:first-of-type a[title="Download PDF"]')

      const hrefList: string[] = []

      newPdfs.each((index, element) => {
        const href = $(element).attr('href')
        if (href) {
          hrefList.push(href)
        }
      })

      return {
        hrefList,
      }
    })

    const { unprocessedArxivIdList } = await step.run(
      'collect-arxiv-ids',
      async () => {
        const unprocessedArxivIdList = []

        for await (const href of hrefList) {
          const arxivId = href.match(/(\d+\.\d+)/)?.[1]

          if (!arxivId) {
            continue
          }

          const exists = await fileExists(getFileName(arxivId))
          if (!exists) {
            unprocessedArxivIdList.push(arxivId)
          }
        }

        return { unprocessedArxivIdList }
      },
    )

    for await (const arxivId of unprocessedArxivIdList) {
      await step.sendEvent('send-pdf-to-be-processed', {
        name: 'scraper/process-pdf',
        data: { arxivId },
      })
    }
  },
)

const processArxivPdf = inngest.createFunction(
  { id: 'process-arxiv-pdf' },
  { event: 'scraper/process-arxiv-pdf' },
  async ({ event, step }) => {
    const { arxivId } = event.data

    const file = await step.run('upload-to-file-manager', async () => {
      const fileManager = new GoogleAIFileManager(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      )

      const url = `https://arxiv.org/pdf/${arxivId}`

      // Download the PDF file
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Save the file to /tmp directory
      const tmpFilePath = path.join('/tmp', `${arxivId}.pdf`)
      await fs.writeFile(tmpFilePath, buffer)

      // Upload the file from the temporary location
      const fileResult = await fileManager.uploadFile(tmpFilePath, {
        displayName: `${arxivId}.pdf`,
        mimeType: 'application/pdf',
      })
      const { name, uri } = fileResult.file

      // Delete the temporary file
      await fs.unlink(tmpFilePath)

      let file = await fileManager.getFile(name)
      while (file.state === FileState.PROCESSING) {
        await new Promise((resolve) => setTimeout(resolve, 2_000))
        file = await fileManager.getFile(name)
      }

      return fileResult.file
    })

    const title = await step.run('extract-title', async () => {
      const ai = new GoogleGenerativeAI(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      )

      const model = ai.getGenerativeModel({
        model: 'gemini-1.5-flash',
      })

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: 'application/pdf',
            fileUri: file.uri,
          },
        },
        {
          text: `Extract the title of this research paper. Only return the title, no smalltalk.`,
        },
      ])

      return result.response.text()
    })

    const summary = await step.run('summarize', async () => {
      const ai = new GoogleGenerativeAI(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      )

      const model = ai.getGenerativeModel({
        model: 'gemini-1.5-pro',
      })

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: 'application/pdf',
            fileUri: file.uri,
          },
        },
        {
          text: `I'm an experienced software engineer interested in building multi-agent AI applications. I came across this research paper, that I believe somewhat related to my interest, but I don't understand it, maybe because there are too many unfamiliar terms. Please answer these three questions: (1) summarize the topic of this paper with simple words, (2) list the key points it makes, (3) tell me what can I learn from it that helps me with my software projects. Only return the summary, no smalltalk.`,
        },
      ])

      return result.response.text()
    })

    await step.run('save-data', async () => {
      const data = {
        arxivId,
        title,
        summary,
        timestamp: new Date().toISOString(),
      }

      await createOrUpdateFile(
        getFileName(arxivId),
        JSON.stringify(data, null, 2),
        `Add scraped data for ${arxivId}`,
      )

      return { success: true, arxivId }
    })
  },
)

const scheduledScrape = inngest.createFunction(
  { id: 'scheduled-scrape' },
  { cron: 'TZ=Europe/Budapest 0 9 * * *' },
  async ({ event, step }) => {
    const url = 'https://arxiv.org/list/cs.MA/recent'

    await step.sendEvent('run-scrape', {
      name: 'scraper/run',
      data: { url },
    })
  },
)

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scheduledScrape, runScrape, processArxivPdf],
})
