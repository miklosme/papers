import React from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <pre
          {...props}
          className={`${className} text-md my-4 mt-2 w-full overflow-x-scroll rounded`}
        >
          <SyntaxHighlighter PreTag="div" language={match[1]} style={oneDark}>
            {String(children).trim()}
          </SyntaxHighlighter>
        </pre>
      ) : (
        <code
          className={`${className} rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800`}
          {...props}
        >
          {children}
        </code>
      )
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="ml-6 list-decimal" {...props}>
          {children}
        </ol>
      )
    },
    li: ({ node, children, ...props }: any) => {
      return (
        <li className="py-1" {...props}>
          {children}
        </li>
      )
    },
    ul: ({ node, children, ...props }: any) => {
      return (
        <ul className="ml-6 list-decimal" {...props}>
          {children}
        </ul>
      )
    },
    a: ({ node, children, ...props }: any) => {
      return (
        <Link
          href={props.href}
          className="text-blue-500 underline hover:text-blue-400"
        >
          {children}
        </Link>
      )
    },
    h1: ({ node, children, ...props }: any) => {
      return (
        <h1 className="text-2xl font-bold" {...props}>
          {children}
        </h1>
      )
    },
    h2: ({ node, children, ...props }: any) => {
      return (
        <h1 className="text-xl font-bold" {...props}>
          {children}
        </h1>
      )
    },
    h3: ({ node, children, ...props }: any) => {
      return (
        <h1 className="text-lg font-bold" {...props}>
          {children}
        </h1>
      )
    },
    h4: ({ node, children, ...props }: any) => {
      return (
        <h1 className="font-bold" {...props}>
          {children}
        </h1>
      )
    },
    h5: ({ node, children, ...props }: any) => {
      return (
        <h1 className="font-bold" {...props}>
          {children}
        </h1>
      )
    },
    h6: ({ node, children, ...props }: any) => {
      return (
        <h1 className="font-bold" {...props}>
          {children}
        </h1>
      )
    },
  }

  return (
    <div className="flex flex-col gap-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
)
