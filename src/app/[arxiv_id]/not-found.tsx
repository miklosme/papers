import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from 'lucide-react'

export default function NotFound() {
  return (
    <>
      <h2 className="text-2xl font-bold">Not Found</h2>
      <p>Could not find this paper</p>
      <Button
        variant="link"
        className="mt-12 h-auto p-0 text-blue-500 hover:text-blue-400"
        asChild
      >
        <Link href="/">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Return home
        </Link>
      </Button>
    </>
  )
}
