import { Markdown } from '@/components/markdown'
import fs from 'fs'
import path from 'path'

export default async function Page() {
  const markdownPath = path.join(process.cwd(), 'src/app/home.md')
  const content = await fs.promises.readFile(markdownPath, 'utf8')

  return (
    <div className="flex flex-col gap-4 max-w-2xl mt-10 md:mt-0">
      <Markdown>{content}</Markdown>
    </div>
  )
}
