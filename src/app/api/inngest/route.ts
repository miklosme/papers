import { Inngest } from 'inngest'
import { serve } from 'inngest/next'
import { Octokit } from 'octokit'
import * as cheerio from 'cheerio'

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

const owner = 'miklosme'
const repo = 'papers'
const branch = 'master'

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

export const inngest = new Inngest({ id: 'arxiv-papers-web-scraper' })

export const runScrape = inngest.createFunction(
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

    for await (const href of hrefList) {
      await step.sendEvent('send-pdf-to-be-processed', {
        name: 'scraper/process-pdf',
        data: { href },
      })
    }
  },
)

export const processPdf = inngest.createFunction(
  { id: 'process-pdf' },
  { event: 'scraper/process-pdf' },
  async ({ event, step }) => {
    const { href } = event.data

    const arxivId = href.match(/(\d+\.\d+)/)?.[1]
    if (!arxivId) {
      throw new Error(`Unable to extract arXiv ID from href: ${href}`)
    }

    const filename = `data/${arxivId}.json`

    const fileExistsResult = await step.run('check-file-exists', async () => {
      // TODO
      // const exists = await fileExists(filename)
      const exists = false

      return { exists, arxivId }
    })

    if (fileExistsResult.exists) {
      console.log(`Already processed ${arxivId}`)
      return { skipped: true, arxivId }
    }

    const data = {
      arxivId,
      // TODO
    }

    await step.run('save-data', async () => {
      await createOrUpdateFile(
        filename,
        JSON.stringify(data, null, 2),
        `Add scraped data for ${arxivId}`,
      )

      return { success: true, arxivId }
    })
  },
)

export const scheduledScrape = inngest.createFunction(
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
  functions: [scheduledScrape, runScrape, processPdf],
})
