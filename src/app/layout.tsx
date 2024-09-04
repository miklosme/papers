import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'
import { cn } from '@/lib/utils'
import PlausibleProvider from 'next-plausible'
import { ThemeProvider } from './theme-provider'
import { SideMenu } from './sidemenu'
import './globals.css'

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Multi-agent papers',
  description: 'Always up to date with the latest papers in multi-agent AI',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <PlausibleProvider domain="papers.miklos.dev" />
      </head>
      <body
        className={cn(
          'flex h-screen bg-background font-sans antialiased',
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SideMenu />
          <main className="flex flex-1 flex-col overflow-y-auto p-4 pt-14 md:px-8 md:py-5">
            <div className="max-w-2xl">{children}</div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
