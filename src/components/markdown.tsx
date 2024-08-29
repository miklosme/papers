import React from 'react'
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
          className={`${className} text-md w-[80dvw] md:max-w-[500px] overflow-x-scroll my-4 rounded mt-2`}
        >
          <SyntaxHighlighter PreTag="div" language={match[1]} style={oneDark}>
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </pre>
      ) : (
        <code
          className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded`}
          {...props}
        >
          {children}
        </code>
      )
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="list-decimal ml-8" {...props}>
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
        <ul className="list-decimal ml-8" {...props}>
          {children}
        </ul>
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
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )
}

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
)