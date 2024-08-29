import * as cheerio from 'cheerio'

const prefix = 'https://arxiv.org'
const url = 'https://arxiv.org/list/cs.MA/recent'

const resp = await fetch(url, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})

const text = await resp.text()

const $ = cheerio.load(text)

const newPdfs = $('dl#articles:first-of-type a[title="Download PDF"]')

const hrefList: string[] = []

newPdfs.each((index, element) => {
  const href = $(element).attr('href')
  if (href) {
    if (href.startsWith(prefix)) {
      hrefList.push(href)
    } else {
      hrefList.push(`${prefix}${href}`)
    }
  }
})

console.log(hrefList)
