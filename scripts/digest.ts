import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

async function generateDailyDigest() {
  // Get the list of new JSON files in the last 24 hours
  const command = `git log --diff-filter=A --name-only --pretty=format: --since="24 hours ago" | grep '^data/.*\\.json$' | sort -u | xargs -I {} sh -c 'if [ -f "{}" ]; then echo "{}"; fi'`
  const newFiles = execSync(command)
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean)

  const digest = []

  const x = newFiles.slice(0, 4)

  for (const file of x) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(content)
      digest.push(data)
    } catch (error) {
      console.error(`Error processing file ${file}:`, error)
    }
  }

  if (digest.length > 0) {
    const digestContent = `# Daily Digest (${
      new Date().toISOString().split('T')[0]
    })

${digest
  .map(
    (item) => `
## ${item.simpleQuestion.trim()} (${item.arxivId.trim()})
`,
  )
  .join('\n')}
`

    // console.log(digestContent)

    const context = digest
      .map(
        (item) => `
<paper>
  <title>
    ${item.simpleQuestion.trim()}
  </title>
  <abstract>
    ${item.abstract.trim()}
  </abstract>
  <summary>
    ${item.summary.trim()}
  </summary>
  <url>
    /${item.arxivId.trim()}
  </url>
</paper>
`,
      )
      .join('\n')

    const { text } = await generateText({
      // model: openai('gpt-4o-mini'),
      model: anthropic('claude-3-5-sonnet-20240620'),
      // model: anthropic('claude-3-opus-20240229'),
      prompt: `
You are an editor for a newsletter about AI.

You are given a list of papers that were added to the database in the last 24 hours.

Your job is to write an engaging digest of these papers in a form that a busy AI researcher might read.

Use copywriting hooks and use teh style of an energetic radio host. Don't use emojis. No small talk, get on the point right away.

At key terms, inject the URL of the paper. Use markdown links.

${context}
`,
    })

    console.log(text)

    // const digestPath = path.join(
    //   process.cwd(),
    //   'digests',
    //   `${new Date().toISOString().split('T')[0]}.md`,
    // )
    // await fs.mkdir(path.dirname(digestPath), { recursive: true })
    // await fs.writeFile(digestPath, digestContent)

    // console.log(`Daily digest generated: ${digestPath}`)
  } else {
    console.log('No new papers to digest today.')
  }
}

generateDailyDigest().catch(console.error)
