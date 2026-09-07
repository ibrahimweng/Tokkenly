/* A door says where it goes.

   Home had a door reading "Convert Cash" that opened a page called Transfer,
   which the code calls the wallet: three names for one place, and "Convert"
   named an operation that had stopped having a page two tiers earlier. Nobody
   caught it because nothing in here had ever compared a label to its
   destination — every suite tests a screen, and this fault lives in the gap
   between two screens.

   So: every label that leads somewhere is read, followed, and checked against
   the name the destination gives itself. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } })
await seen(p)
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())

/* Home's greeting is the one heading that is not a page name, and it is not
   one on purpose: nothing navigates to "Good afternoon, Chinaza". Named here
   so it is an exception rather than an omission. */
const NOT_A_NAME = ['/']

const at = async (r) => {
  await p.goto('about:blank')
  await p.goto(B + r, { waitUntil: 'networkidle' })
  await p.waitForTimeout(200)
}

console.log('THE DOORS ON HOME')
await at('/')
const doors = await p.evaluate(() =>
  [...document.querySelectorAll('.card.gate')].map((e) => ({
    label: e.querySelector('.t-title')?.textContent?.trim(),
    to: (e.getAttribute('href') || '').replace(/^#/, ''),
  })))
ok('there are three of them', doors.length === 3, doors.map((d) => d.label).join(' | '))

console.log('THE RAIL')
await at('/')
const rail = await p.evaluate(() =>
  [...document.querySelectorAll('.nav-row')].map((e) => ({
    label: e.textContent.trim(), to: (e.getAttribute('href') || '').replace(/^#/, ''),
  })))
ok('it read the rail', rail.length >= 5, rail.map((r) => r.label).join(' | '))

console.log('THE QUICK ACTIONS, AND THE WALLET DOORS')
/* Its own page, seeded on Detailed. `seen` is an init script, so a click on
   the preference is undone by the next navigation. */
const d = await b.newPage({ viewport: { width: 1440, height: 1200 } })
await seen(d, { homeView: 'detailed' })
await d.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await d.goto(B + '/', { waitUntil: 'networkidle' }); await d.waitForTimeout(300)
const quick = await d.evaluate(() =>
  [...document.querySelectorAll('.row.tiles > *')].map((e) => ({
    label: e.querySelector('.t-title, .t-body-strong')?.textContent?.trim(),
    to: (e.getAttribute('href') || '').replace(/^#/, ''),
  })).filter((d) => d.label && d.to))
ok('it read the quick actions', quick.length === 3, quick.map((q) => q.label).join(' | '))
await d.close()
await at('/transfer')
const ways = await p.evaluate(() =>
  [...document.querySelectorAll('.row.equal > .card')].map((e) => ({
    label: e.querySelector('.t-title')?.textContent?.trim(), to: null, click: true,
  })))
// Two: money in and money out. Receive was a third, and it asked the same
// question as Add money — how does money get into this wallet — so it is a tab
// inside that one now.
ok('and the two doors on the wallet', ways.length === 2, ways.map((d) => d.label).join(' | '))

console.log('EVERY LABEL AGAINST THE PAGE IT OPENS')
const seenTo = new Set()
let checked = 0
for (const d of [...doors, ...rail, ...quick]) {
  if (!d.to || NOT_A_NAME.includes(d.to)) continue
  const key = d.label + ' ' + d.to
  if (seenTo.has(key)) continue
  seenTo.add(key)
  await at(d.to)
  const h1 = await p.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '(none)')
  checked += 1
  // The label may be the page's name, or may contain it — "Your bucket" for a
  // rail row reading "Bucket" is the same word doing the same job. What it may
  // not be is a different word.
  const a = d.label.toLowerCase(), c = h1.toLowerCase()
  ok(`${d.label} -> ${d.to}`, a === c || c.includes(a) || a.includes(c), `page says "${h1}"`)
}
ok('and it checked something', checked >= 7, `${checked} labels`)

console.log('\nerrors: ' + (errs.length ? errs.join('\n') : 'none'))
await b.close()
