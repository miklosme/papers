import { Markdown } from './markdown'
import fs from 'fs'
import path from 'path'

export async function generateStaticParams() {
  const dataDirectory = path.join(process.cwd(), 'data')
  const filenames = await fs.promises.readdir(dataDirectory)

  return filenames.map((filename) => {
    const arxivId = path.basename(filename, path.extname(filename))
    return { arxiv_id: arxivId }
  })
}

export default async function Page({
  params,
}: {
  params: { arxiv_id: string }
}) {
  const content = await fs.promises.readFile(
    path.join(process.cwd(), 'data', `${params.arxiv_id}.json`),
    'utf8',
  )
  const data = JSON.parse(content) as {
    arxivId: string
    summary: string
    title: string
    timestamp: string
  }

  return (
    <>
      <h1>{params.arxiv_id}</h1>
      <div className="flex flex-col gap-4 max-w-2xl">
        <Markdown>{data.summary}</Markdown>
      </div>
    </>
  )
}
