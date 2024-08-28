import fs from 'fs'
import path from 'path'
import Link from 'next/link'

export async function generateStaticParams() {
  // This function ensures the page is generated at build time
  return [{}]
}

export default async function Default() {
  const dataDirectory = path.join(process.cwd(), 'data')
  const filenames = await fs.promises.readdir(dataDirectory)

  return (
    <ul>
      {filenames.map((filename) => (
        <li key={filename}>
          <Link href={`/${path.basename(filename, path.extname(filename))}`}>
            {path.basename(filename, path.extname(filename))}
          </Link>
        </li>
      ))}
    </ul>
  )
}
