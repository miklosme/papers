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
        className="mt-12 p-0 text-blue-500 hover:text-blue-400 h-auto"
        asChild
      >
        <Link href="/">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Return home
        </Link>
      </Button>
    </>
  )
}
