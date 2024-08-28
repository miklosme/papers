import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'

export async function generateStaticParams() {
  // This function ensures the page is generated at build time
  return [{}]
}

export default async function Default() {
  const dataDirectory = path.join(process.cwd(), 'data')
  const filenames = await fs.promises.readdir(dataDirectory)

  return (
    <ScrollArea className="bg-muted border-r border-border p-4 h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-lg font-bold">Multi-agent papers</h1>
        <ThemeToggle />
      </div>
      <ul>
        {filenames.map((filename) => (
          <li key={filename}>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link
                href={`/${path.basename(filename, path.extname(filename))}`}
              >
                {path.basename(filename, path.extname(filename))}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
