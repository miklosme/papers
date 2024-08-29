import Link from 'next/link'

export default function NotFound() {
  return (
    <>
      <h2>Not Found</h2>
      <p>Could not find this paper</p>
      <Link href="/">Return Home</Link>
    </>
  )
}
