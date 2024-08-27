import { Inngest } from 'inngest'
import { serve } from 'inngest/next'
import { Octokit } from 'octokit'

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

export const inngest = new Inngest({ id: 'Web Scraper' })

export const runScrape = inngest.createFunction(
  { id: 'Run Scrape' },
  { event: 'scraper/run' },
  async ({ event, step }) => {
    const { url } = event.data

    if (!url) {
      throw new Error('URL is required for manual scraping')
    }

    const filename = `data/${encodeURIComponent(url)}.json`

    const fileExistsResult = await step.run('check-file-exists', async () => {
      const exists = await fileExists(filename)
      return { exists, url }
    })

    if (fileExistsResult.exists) {
      console.log(`Already processed ${url}`)
      return { skipped: true, url }
    }

    const scrapedData = await step.run('scrape-data', async () => {
      // const response = await fetch(url, {})

      return {
        url,
        timestamp: new Date().toISOString(),
      }
    })

    await step.run('save-data', async () => {
      await createOrUpdateFile(
        filename,
        JSON.stringify(scrapedData, null, 2),
        `Add scraped data for ${url}`,
      )

      return { success: true, url }
    })
  },
)

export const scheduledScrape = inngest.createFunction(
  { id: 'Scheduled Scrape' },
  { cron: 'TZ=Europe/Budapest 0 9 * * *' },
  async ({ event, step }) => {
    const url = 'https://arxiv.org/list/cs.MA/recent'

    await step.sendEvent('run-scrape', {
      name: 'scraper/run',
      data: { url },
    })
  },
)

export default serve({
  client: inngest,
  functions: [scheduledScrape, runScrape],
})
