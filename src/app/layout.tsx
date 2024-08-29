import type { Metadata } from 'next'
import { Inter as FontSans } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ThemeProvider } from './theme-provider'
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
  sidemenu,
}: Readonly<{
  children: React.ReactNode
  sidemenu: React.ReactNode
}>) {
  return (
    <html lang="en">
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
          {sidemenu}
          <main className="flex-1 p-8 ml-[280px]">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
