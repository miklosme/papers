import { Fragment } from 'react'
import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { format } from 'date-fns'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { MenuIcon, XIcon as CloseIcon } from 'lucide-react'

export const dynamic = 'force-static'

function formatArxivDate(arxivId: string): string {
  const year = parseInt(`20${arxivId.slice(0, 2)}`, 10)
  const month = parseInt(arxivId.slice(2, 4), 10) - 1 // Months are 0-indexed in JavaScript
  const date = new Date(year, month)
  return format(date, 'MMMM yyyy')
}

type Article = {
  arxivId: string
  summary: string
  title: string
  timestamp: string
  simpleQuestion: string
  pseudocode: string
}

export async function SideMenu() {
  const dataDirectory = path.join(process.cwd(), 'data')
  const filenames = await fs.promises.readdir(dataDirectory)

  const articles: Article[] = []

  for await (const filename of filenames) {
    const filePath = path.join(dataDirectory, filename)
    const content = await fs.promises.readFile(filePath, 'utf8')
    const data = JSON.parse(content) as Article

    articles.push(data)
  }

  articles.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return (
    <>
      <input type="checkbox" id="menu-toggle" className="hidden peer" />
      <label
        htmlFor="menu-toggle"
        className="fixed top-4 left-4 z-50 md:hidden cursor-pointer flex peer-checked:hidden"
      >
        <MenuIcon className="w-6 h-6 mr-2" />
      </label>
      <label
        htmlFor="menu-toggle"
        className="fixed top-4 left-4 z-50 cursor-pointer hidden peer-checked:flex peer-checked:md:hidden md:hidden"
      >
        <CloseIcon className="w-6 h-6 mr-2" />
        Close
      </label>
      <div
        className={`fixed flex flex-col border-r border-border h-screen 
          w-[280px] transition-transform duration-300 z-40
          md:translate-x-0 -translate-x-full
          peer-checked:translate-x-0`}
      >
        {/* <label
          htmlFor="menu-toggle"
          className="absolute top-4 right-4 md:hidden cursor-pointer"
        >
          Close
        </label> */}
        <ScrollArea className="flex-grow bg-muted p-4">
          <div className="flex justify-between items-center mb-8 mt-10 md:mt-0">
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/">
                <h1 className="text-lg font-bold">Multi-agent papers</h1>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
          <div className="flex flex-col gap-2">
            {articles.map((article, index) => {
              const isDifferentMonth =
                index === 0 ||
                formatArxivDate(article.arxivId) !==
                  formatArxivDate(articles[index - 1]!.arxivId)

              return (
                <Fragment key={article.arxivId}>
                  {isDifferentMonth ? (
                    <span className="text-sm text-muted-foreground">
                      {formatArxivDate(article.arxivId)}
                    </span>
                  ) : null}

                  <Link
                    className="w-[248px] text-sm text-primary underline-offset-4 hover:underline text-left truncate"
                    href={`/${article.arxivId}`}
                  >
                    {article.simpleQuestion}
                  </Link>
                </Fragment>
              )
            })}
          </div>
          {/* <span>Generated at {new Date().toISOString()}</span> */}
        </ScrollArea>
        <div className="flex flex-col items-center justify-center bg-muted w-full h-auto p-4 border-t border-border">
          <p className="mb-2 text-sm text-muted-foreground">
            Made by{' '}
            <a
              href="https://x.com/miklosme"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline inline-flex items-center"
            >
              @miklosme
              <XIcon className="ml-2 h-4 w-4" />
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Open source on{' '}
            <a
              href="https://github.com/miklosme/papers"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline inline-flex items-center"
            >
              GitHub
              <GitHubIcon className="ml-2 h-4 w-4" />
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

function XIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24px"
      height="24px"
      viewBox="0 0 24 24"
      xmlSpace="preserve"
      {...props}
    >
      <path
        fill="currentColor"
        d="M14.095 10.316L22.286 1h-1.94L13.23 9.088 7.551 1H1l8.59 12.231L1 23h1.94l7.51-8.543L16.45 23H23l-8.905-12.684zm-2.658 3.022l-.872-1.218L3.64 2.432h2.98l5.59 7.821.869 1.219 7.265 10.166h-2.982l-5.926-8.3z"
      />
    </svg>
  )
}

function GitHubIcon(props: any) {
  return (
    <svg
      height="32px"
      viewBox="0 0 32 32"
      width="32px"
      xmlSpace="preserve"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        clipRule="evenodd"
        fill="currentColor"
        d="M16.003 0C7.17 0 .008 7.162.008 15.997c0 7.067 4.582 13.063 10.94 15.179.8.146 1.052-.328 1.052-.752 0-.38.008-1.442 0-2.777-4.449.967-5.371-2.107-5.371-2.107-.727-1.848-1.775-2.34-1.775-2.34-1.452-.992.109-.973.109-.973 1.605.113 2.451 1.649 2.451 1.649 1.427 2.443 3.743 1.737 4.654 1.329.146-1.034.56-1.739 1.017-2.139-3.552-.404-7.286-1.776-7.286-7.906 0-1.747.623-3.174 1.646-4.292-.165-.404-.715-2.031.157-4.234 0 0 1.343-.43 4.398 1.641a15.31 15.31 0 014.005-.538c1.359.006 2.727.183 4.005.538 3.055-2.07 4.396-1.641 4.396-1.641.872 2.203.323 3.83.159 4.234 1.023 1.118 1.644 2.545 1.644 4.292 0 6.146-3.74 7.498-7.304 7.893C19.479 23.548 20 24.508 20 26v4.428c0 .428.258.901 1.07.746C27.422 29.055 32 23.062 32 15.997 32 7.162 24.838 0 16.003 0z"
        fillRule="evenodd"
      />
    </svg>
  )
}
