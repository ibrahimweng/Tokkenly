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
  '/verify', '/verify/number', '/verify/details', '/verify/done',
  '/all', '/disclosures', '/statement',
  '/admin', '/admin/switches', '/admin/people', '/admin/money', '/admin/breaks',
  '/admin/audit', '/admin/launch',
  '/invest/aapl/invest', '/invest/aapl/sell', '/invest/aapl/send',
]

/* The screens that draw their own shell rather than a page header, named here
   rather than left out silently. They are full-bleed by design — a sign-in
   form and an onboarding card are not pages in the frame — and naming them is
   the difference between an exception and an omission. If one of them ever
   grows a `.page-header`, the count below stops matching and this has to be
   thought about again. */
const OWN_SHELL = ['/signin', '/signup', '/lock', '/welcome/0', '/welcome/1', '/welcome/2', '/welcome/3']

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

/* And the exceptions really are exceptions. */
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(p)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const has = []
  for (const r of OWN_SHELL) {
    await p.goto('about:blank')
    await p.goto(B + r, { waitUntil: 'networkidle' })
    await p.waitForTimeout(180)
    if (await p.$('.page-header')) has.push(r)
  }
  console.log('\nOWN SHELL')
  ok(`the ${OWN_SHELL.length} full-bleed screens still draw no page header`,
     has.length === 0, has.join(' ') || 'none of them do')
  await p.close()
}

console.log('\nerrors: ' + (errs.length ? errs.join('\n') : 'none'))
await b.close()
