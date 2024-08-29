import { Markdown } from './markdown'
import fs from 'fs'
import path from 'path'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLinkIcon } from 'lucide-react'

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
      <h2 className="text-2xl font-bold">{data.title}</h2>
      <div className="flex flex-row gap-2">
        <span className="text-sm text-muted-foreground">
          {new Date(data.timestamp).toLocaleDateString()}
        </span>
      </div>
      <Button
        variant="link"
        className="text-blue-500 hover:text-blue-400 pl-0"
        asChild
      >
        <Link href={`https://arxiv.org/pdf/${params.arxiv_id}`} target="_blank">
          {`https://arxiv.org/pdf/${params.arxiv_id}`}
          <ExternalLinkIcon className="w-4 h-4 ml-2" />
        </Link>
      </Button>
      <div className="flex flex-col gap-4 max-w-2xl">
        <Markdown>{data.summary}</Markdown>
      </div>
    </>
  )
}
