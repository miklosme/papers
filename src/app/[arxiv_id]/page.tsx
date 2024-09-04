import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/markdown'
import { ExternalLinkIcon } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'

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
  const filePath = path.join(process.cwd(), 'data', `${params.arxiv_id}.json`)

  try {
    const content = await fs.promises.readFile(filePath, 'utf8')
    const data = JSON.parse(content) as {
      arxivId: string
      summary: string
      title: string
      timestamp: string
      abstract: string
      takeaways: string
      pseudocode: string
      simpleQuestion: string
    }

    return (
      <>
        <h2 className="text-2xl font-bold">{data.simpleQuestion}</h2>
        <h3 className="text-lg text-muted-foreground">{data.title}</h3>
        <div className="flex flex-row gap-2">
          <span className="text-sm text-muted-foreground">
            {format(new Date(data.timestamp), 'MMMM d, yyyy')}
          </span>
        </div>
        <Button
          variant="link"
          className="pl-0 text-blue-500 hover:text-blue-400"
          asChild
        >
          <Link
            href={`https://arxiv.org/pdf/${params.arxiv_id}`}
            target="_blank"
          >
            {`https://arxiv.org/pdf/${params.arxiv_id}`}
            <ExternalLinkIcon className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="group flex items-center text-lg font-semibold">
            <ChevronDown className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
            Summary
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="-mx-4 my-2 flex flex-col gap-4 bg-muted p-4 md:mx-0 md:rounded-md">
              <Markdown>{data.summary}</Markdown>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="group flex items-center text-lg font-semibold">
            <ChevronDown className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
            Title and Abstract
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="-mx-4 my-2 flex flex-col gap-4 bg-muted p-4 md:mx-0 md:rounded-md">
              <p className="font-semibold">{data.title}</p>
              <p>{data.abstract}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="group flex items-center text-lg font-semibold">
            <ChevronDown className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
            Takeaways
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="-mx-4 my-2 flex flex-col gap-4 bg-muted p-4 md:mx-0 md:rounded-md">
              <Markdown>{data.takeaways}</Markdown>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {data.pseudocode.includes('No pseudocode block found') ? null : (
          <Collapsible>
            <CollapsibleTrigger className="group flex items-center text-lg font-semibold">
              <ChevronDown className="mr-2 h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
              Pseudocode
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="-mx-4 my-2 flex flex-col gap-4 bg-muted p-4 md:mx-0 md:rounded-md">
                <Markdown>{data.pseudocode}</Markdown>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </>
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      notFound()
    }
    throw error
  }
}
