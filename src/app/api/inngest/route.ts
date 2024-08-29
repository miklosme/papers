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

const SYSTEM_INSTRUCTION = `You are an expert in computer science research, specializing in translating complex academic concepts for software engineers using JavaScript and interested in LLM-based multi-agent app development. Your role involves:

1. Analyzing research papers on multi-agent AI systems, focusing on their relevance to web development.

2. Distilling complex concepts into clear explanations for JavaScript developers.

3. Bridging theoretical multi-agent AI research with practical web application development.

4. Using JavaScript terminology, frameworks, and scenarios to illustrate multi-agent AI concepts.

5. Highlighting potential impacts of multi-agent AI research on web development practices.

6. Addressing common questions about implementing multi-agent systems in web applications.

7. Providing concise summaries emphasizing the relevance of multi-agent AI to JavaScript development.

8. Suggesting ways to experiment with multi-agent AI concepts using JavaScript and web technologies.

Your explanations should be clear, engaging, and directly applicable to JavaScript developers working on LLM-based multi-agent systems. Aim to inspire curiosity and demonstrate the practical value of multi-agent AI research in advancing web technologies.`

async function generateText({
  model,
  prompt,
  fileUri,
  systemInstruction = SYSTEM_INSTRUCTION,
}: {
  model: string
  prompt: string
  fileUri: string
  systemInstruction?: string
}) {
  const ai = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)

  const generativeModel = ai.getGenerativeModel({
    model,
    systemInstruction,
  })

  const result = await generativeModel.generateContent([
    {
      fileData: {
        mimeType: 'application/pdf',
        fileUri,
      },
    },
    {
      text: prompt,
    },
  ])

  return result.response.text()
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
        name: 'scraper/process-arxiv-pdf',
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
      return await generateText({
        model: 'gemini-1.5-flash',
        prompt: `Extract the title of this research paper. Only return the title, no smalltalk.`,
        fileUri: file.uri,
      })
    })

    const abstract = await step.run('extract-abstract', async () => {
      return await generateText({
        model: 'gemini-1.5-flash',
        prompt: `Extract the abstract of this research paper. Only return the abstract, no smalltalk.`,
        fileUri: file.uri,
      })
    })

    const summary = await step.run('summarize', async () => {
      return await generateText({
        model: 'gemini-1.5-pro',
        prompt: `Summarize this research paper on multi-agent AI, focusing on:

1. The main topic in simple terms.
2. Key points relevant to LLM-based multi-agent systems.

Please provide a concise summary without any preamble.`,
        fileUri: file.uri,
      })
    })

    const takeaways = await step.run('extract-takeaways', async () => {
      return await generateText({
        model: 'gemini-1.5-pro',
        prompt: `Provide practical examples of how a JavaScript developer could apply this paper's insights to LLM-based multi-agent AI projects. Focus on web development scenarios and relevant JavaScript frameworks or libraries.`,
        fileUri: file.uri,
      })
    })

    const pseudocode = await step.run('extract-pseudocode', async () => {
      return await generateText({
        model: 'gemini-1.5-pro',
        //         prompt: `Please examine this paper for any "pseudocode blocks" describing algorithms. If present:
        // 1. Convert each pseudocode block to JavaScript.
        // 2. Use good JavaScript practives: use descriptive variable names, use modern JavaScript syntax, etc.
        // 3. Provide a brief explanation of each algorithm and its purpose.
        // 4. If multiple pseudocode blocks exist, repeat steps 1-2 for each.

        // If no pseudocode blocks are found, simply respond with "No pseudocode block found".`,
        prompt: `Please examine this paper for any "pseudocode blocks" describing algorithms. If present, convert each pseudocode block to JavaScript, and provide a brief explanation of each algorithm and its purpose.

If no pseudocode blocks are found, simply respond with "No pseudocode block found".`,
        fileUri: file.uri,
      })
    })

    const simpleQuestion = await step.run('simple-question', async () => {
      const ai = new GoogleGenerativeAI(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      )

      const generativeModel = ai.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
      })

      const result = await generativeModel.generateContent(
        `Rephrase the paper's title and abstract as a single, concise question that an LLM multi-agent application developer might ask. Only use a few words, maximum 10.
        
<title>${title}</title>
<abstract>${abstract}</abstract>`,
      )

      return result.response.text()
    })

    await step.run('save-data', async () => {
      const data = {
        arxivId,
        title,
        abstract,
        summary,
        takeaways,
        pseudocode,
        simpleQuestion,
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
