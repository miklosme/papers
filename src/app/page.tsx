import { Markdown } from '@/components/markdown'
import fs from 'fs'
import path from 'path'

export default async function Page() {
  const markdownPath = path.join(process.cwd(), 'src/app/home.md')
  const content = await fs.promises.readFile(markdownPath, 'utf8')

  return <Markdown>{content}</Markdown>
}
