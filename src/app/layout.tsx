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
          'flex min-h-screen bg-background font-sans antialiased',
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
          <main className="flex-1 py-5 px-8 ml-[280px]">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
