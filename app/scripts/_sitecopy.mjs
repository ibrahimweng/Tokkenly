/* The words on the marketing site against the words the client wrote.
 *
 *  site/copy.txt is the landing page copy as delivered. The brief was to use
 *  it as written, so this reads the rendered page and checks that every line
 *  of the document is in it, rather than trusting that nobody tidied a
 *  sentence on the way past.
 *
 *    node scripts/_sitecopy.mjs            # site served on SITE_URL
 *
 *  copy.txt started as the document as delivered and now carries the page as
 *  it was deliberately changed since — its header says which commits did
 *  that. A line starting with # is a note in it, not copy.
 */
import { readFileSync } from 'fs'
import { BASE, launch, open } from './_sitelib.mjs'

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

const browser = await launch()
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await open(p, '/', { waitUntil: 'networkidle' })
const page = norm(await p.evaluate(() => {
  document.querySelectorAll('details').forEach((d) => { d.open = true })
  document.getElementById('products-menu').hidden = false
  document.getElementById('mobile-menu').hidden = false
  /* innerText honours text-transform and every eyebrow is uppercased in CSS.
     Turn it off, so what is read back is what was written. */
  const off = document.createElement('style')
  off.textContent = '*{text-transform:none!important}'
  document.head.appendChild(off)
  /* The gifting card shows one of its two states at a time and innerText
     skips the one that is not drawn, so both panels' words are added. */
  return document.body.innerText + '\n' +
    [...document.querySelectorAll('.gr-panel')].map((el) => el.textContent).join('\n')
}))
await browser.close()

const missing = []
let checked = 0
for (const raw of copy.split('\n')) {
  let line = norm(raw.replace(/^﻿/, ''))
  if (!line || line.startsWith('#') || STRUCTURE.has(line)) continue
  line = line.replace(LABEL, '').replace(/^\d+\.\s*/, '')
  /* A "·"-separated run is a list of separate items; a sentence is not. */
  const parts = line.includes('·') ? line.split('·').map((s) => s.trim()) : [line]
  for (const part of parts) {
    if (!part) continue
    checked++
    if (!page.includes(norm(part))) missing.push(part)
  }
}

console.log(`checked ${checked} pieces of copy from site/copy.txt`)
if (missing.length) {
  console.log(`\nNOT FOUND ON THE PAGE (${missing.length}):`)
  for (const m of missing) console.log('  - ' + m.slice(0, 130))
  process.exitCode = 1
} else {
  console.log('every one of them appears on the page, as written')
}
