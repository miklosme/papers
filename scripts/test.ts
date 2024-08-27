import { inngest } from '@/app/api/inngest'

const url = ''

await inngest.send({
  name: 'scraper/manual.trigger',
  data: { url },
})

console.log('Manual trigger sent')
