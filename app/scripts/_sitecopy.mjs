/* The words on the marketing site against the words the client wrote.
 *
 *  site/copy.txt is the landing page copy as delivered. The brief was to use
 *  it as written, so this reads the rendered page and checks that every line
 *  of the document is in it, rather than trusting that nobody tidied a
 *  sentence on the way past.
 *
 *    node scripts/_sitecopy.mjs            # site served on :4321
 */
import { chromium } from 'playwright'
import { readFileSync } from 'fs'

const copy = readFileSync(new URL('../../site/copy.txt', import.meta.url), 'utf8')

/* Headings in the document that name a section rather than print on the page. */
const STRUCTURE = new Set([
  'Tokkenly: Landing Page Copy', 'Navigation', 'Hero', 'Why Tokkenly',
  'Money movement', 'Getting started', 'Closing call to action', 'Footer',
])
/* Prefixes the document uses to say what a piece of copy is, not copy itself. */
const LABEL = /^(?:Primary button|Secondary button|Secondary link|Button|Link|Products dropdown|Products|Company|Support|Legal):\s*/i

const norm = (s) => s
  .normalize('NFKC')
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[ ]/g, ' ')
  .replace(/▾/g, '')
  .replace(/\s+/g, ' ')
  .trim()

/* Six product headings the document writes as "Name: sentence". Asked for
 *  explicitly: each card heading has to read as one complete phrase and sit on
 *  a single line. These six are therefore the only places the page departs
 *  from the document, and they are listed here rather than dropped, so the
 *  deviation stays visible and everything else is still checked as written. */
const REWRITTEN = new Map([
  ['Receive: Make room for money coming in.', 'Receive money from anyone'],
  ['Send: For the people and plans that matter.', 'Send money home'],
  ['Pay bills: Life keeps moving. Keep it connected.', 'Pay your bills'],
  ['Earn: Give your spare money something to do.', 'Earn on idle money'],
  ['Borrow: A little room for your next move.', 'Borrow, then repay'],
  ['Convert: Naira or stablecoins. Move between them.', 'Convert Naira to USD'],
])

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' })
const page = norm(await p.evaluate(() => {
  document.querySelectorAll('details').forEach((d) => { d.open = true })
  document.getElementById('products-menu').hidden = false
  document.getElementById('mobile-menu').hidden = false
  /* innerText honours text-transform and every eyebrow is uppercased in CSS.
     Turn it off, so what is read back is what was written. */
  const off = document.createElement('style')
  off.textContent = '*{text-transform:none!important}'
  document.head.appendChild(off)
  return document.body.innerText
}))
await browser.close()

const missing = []
let checked = 0
let rewritten = 0
for (const raw of copy.split('\n')) {
  let line = norm(raw.replace(/^﻿/, ''))
  if (!line || STRUCTURE.has(line)) continue
  line = line.replace(LABEL, '').replace(/^\d+\.\s*/, '')
  /* A "·"-separated run is a list of separate items; a sentence is not. */
  const parts = line.includes('·') ? line.split('·').map((s) => s.trim()) : [line]
  for (const part of parts) {
    if (!part) continue
    checked++
    const swap = REWRITTEN.get(part)
    if (swap !== undefined) {
      rewritten++
      if (!page.includes(norm(swap))) missing.push(`${part}  ->  ${swap}`)
      continue
    }
    if (!page.includes(norm(part))) missing.push(part)
  }
}

console.log(`checked ${checked} pieces of copy from site/copy.txt`)
console.log(`${rewritten} of them are the product headings rewritten to one line`)
if (missing.length) {
  console.log(`\nNOT FOUND ON THE PAGE (${missing.length}):`)
  for (const m of missing) console.log('  - ' + m.slice(0, 130))
  process.exit(1)
}
console.log('every one of them appears on the page, as written')
