import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './theme-toggle'

export const dynamic = 'force-static'

export async function SideMenu() {
  const dataDirectory = path.join(process.cwd(), 'data')
  const filenames = await fs.promises.readdir(dataDirectory)

  return (
    <ScrollArea className="!fixed bg-muted border-r border-border p-4 h-screen w-[280px]">
      <div className="flex justify-between items-center mb-8">
        <Button variant="link" className="p-0 h-auto" asChild>
          <Link href="/">
            <h1 className="text-lg font-bold">Multi-agent papers</h1>
          </Link>
        </Button>
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
      <span>Generated at {new Date().toISOString()}</span>
    </ScrollArea>
  )
}
