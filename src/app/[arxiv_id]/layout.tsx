import React from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="max-w-2xl mt-10 md:mt-0">{children}</div>
}
