/* The frame every page is drawn in.

   The complaint was that walking between pages moved the page: the title
   landed at six different heights across twenty-five routes and the first card
   at seven, so Invest sat 48px higher than Home and a company page 32px lower
   than the list it came from. None of it was visible in a screenshot of one
   screen, which is why nothing caught it — it is only visible in the
   navigation, and only a measurement across routes can see it.

   So: at each width, every page must agree on where the title sits, how tall
   the header is, and where the body starts. One value each, no exceptions. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const errs = []

/* Every place and every screen that draws a page header. The composers and the
   position pages are in here because a back link is exactly the thing that
   used to change the geometry. */
const ROUTES = [
  '/', '/invest', '/invest/aapl', '/invest/nvda', '/transfer', '/grow',
  '/grow/lending', '/grow/borrowing', '/grow/borrow', '/grow/repay', '/grow/earn',
  '/grow/takeout', '/activity', '/activity?filter=alerts', '/account',
  '/account/preferences', '/account/security', '/account/details', '/account/payments',
  '/security', '/support', '/bucket', '/send', '/receive', '/addmoney', '/withdraw',
  '/verify', '/all', '/disclosures', '/statement', '/admin', '/admin/switches',
  '/invest/aapl/invest', '/invest/aapl/sell', '/invest/aapl/send',
]

for (const [w, tag] of [[1440, 'desktop'], [1100, 'tablet'], [390, 'phone']]) {
  console.log(`\n${tag.toUpperCase()}  ${w}px`)
  const p = await b.newPage({ viewport: { width: w, height: 1000 } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(8000)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())

  const read = []
  for (const r of ROUTES) {
    // about:blank between routes, so a same-hash goto is still a real render
    await p.goto('about:blank')
    await p.goto(B + r, { waitUntil: 'networkidle' })
    await p.waitForTimeout(180)
    read.push({ r, ...await p.evaluate(() => {
      const hd = document.querySelector('.page-header')
      const h1 = document.querySelector('.page-header h1')
      const first = document.querySelector('main > *:not(.page-header)')
      const box = (e) => (e ? e.getBoundingClientRect() : null)
      const a = box(hd), t = box(h1), f = box(first)
      return {
        header: a ? Math.round(a.height) : null,
        titleTop: t ? Math.round(t.top) : null,
        titleBottom: t ? Math.round(t.bottom) : null,
        titleLeft: t ? Math.round(t.left) : null,
        body: f ? Math.round(f.top) : null,
      }
    }) })
  }

  // It has to have looked at something: a selector that matches nothing agrees
  // with itself on every page in the product.
  ok('it read a header on every route',
     read.every((d) => d.header !== null && d.titleTop !== null),
     `${read.filter((d) => d.header === null).map((d) => d.r).join(' ') || read.length + ' routes'}`)

  for (const key of ['header', 'titleTop', 'titleBottom', 'titleLeft', 'body']) {
    const vals = [...new Set(read.map((d) => d[key]))]
    const odd = vals.length > 1
      ? vals.map((v) => `${v}: ${read.filter((d) => d[key] === v).length === 1
          ? read.find((d) => d[key] === v).r : read.filter((d) => d[key] === v).length + ' routes'}`).join(' | ')
      : String(vals[0])
    ok(`  ${key} is the same on all ${read.length}`, vals.length === 1, odd)
  }
  await p.close()
}

console.log('\nerrors: ' + (errs.length ? errs.join('\n') : 'none'))
await b.close()
