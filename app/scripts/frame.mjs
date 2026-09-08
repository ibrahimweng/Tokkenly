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

/* The page ends where it ends.
   The document is the scroller, so a rubber band at either end drags the app
   off its own edge and shows the canvas behind it — against a sidebar that is
   a different colour, which is the band that started this. Sideways there is
   nothing to overscroll and the gesture is still live, and on a trackpad it
   walks backwards through history. Both axes, both widths, every route. */
console.log('\nNO OVERSCROLL, EITHER WAY')
{
  for (const w of [1440, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } })
    await seen(p)
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
    const loose = []
    for (const r of ROUTES) {
      await p.goto('about:blank')
      await p.goto(B + r, { waitUntil: 'networkidle' })
      await p.waitForTimeout(120)
      const said = await p.evaluate(() => {
        const h = getComputedStyle(document.documentElement)
        return {
          x: h.overscrollBehaviorX, y: h.overscrollBehaviorY, bg: h.backgroundColor,
          wide: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }
      })
      if (said.x !== 'none' || said.y !== 'none' || said.wide !== 0) loose.push(`${r} ${JSON.stringify(said)}`)
    }
    ok(`at ${w} nothing bounces and nothing runs off sideways`,
       loose.length === 0, loose.slice(0, 3).join(' | '))
    // And the gutter is painted, so a browser that ignores the rule above
    // still has the right colour behind the page rather than a system grey.
    const bg = await p.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
    const canvas = await p.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim())
    ok(`  and at ${w} the page is painted on the canvas colour, not on nothing`,
       bg !== 'rgba(0, 0, 0, 0)', `${bg} against ${canvas}`)
    await p.close()
  }
}

/* A TABLET HELD UPRIGHT
   768, 810 and 834 are every iPad in portrait and all three are under
   MOBILE_MAX, so the shell stays the phone's — a finger is still a finger at
   834. The layout does not: 834 is twice 390, and none of the decisions made
   for 390 survive being stretched. The last two of these are the ones that
   are easy to get wrong, because the band a tablet held upright occupies is
   the same band a phone lying on its side occupies, and they want opposite
   answers. */
console.log('\nA TABLET HELD UPRIGHT')
{
  const look = (p) => p.evaluate(() => {
    const box = (s) => { const e = document.querySelector(s); if (!e) return null
      const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) } }
    const shown = (s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' }
    return {
      rail: shown('.railbar'), sidebar: shown('.sidebar'),
      gate: box('.gate'), art: shown('.gate-art'), glyph: shown('.gate-ic'),
      pair: (() => { const e = document.querySelector('.upright-pair'); return e ? getComputedStyle(e).display : null })(),
      wide: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })

  for (const [w, hh] of [[768, 1024], [834, 1194]]) {
    const p = await b.newPage({ viewport: { width: w, height: hh } })
    await seen(p)
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
    const said = await look(p)
    ok(`at ${w} the shell is still the one a finger uses`,
       said.rail && !said.sidebar, `rail ${said.rail}, sidebar ${said.sidebar}`)
    ok(`  and the doors have their pictures back rather than a glyph in a letterbox`,
       said.art && !said.glyph && !!said.gate && said.gate.h >= 240,
       said.gate ? `${said.gate.w}x${said.gate.h}, art ${said.art}, glyph ${said.glyph}` : 'no door')
    ok('  and what splits in two is in two columns', said.pair === 'grid', String(said.pair))

    // Every route, for the one fault that a width change causes most often.
    const spills = []
    for (const r of ROUTES) {
      await p.goto(B + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(90)
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (over) spills.push(`${r}:${over}`)
    }
    ok(`  and nothing on any of the ${ROUTES.length} routes runs off the side`,
       spills.length === 0, spills.slice(0, 4).join(' '))

    await p.goto(B + '/grow', { waitUntil: 'networkidle' }); await p.waitForTimeout(220)
    const pair = await p.evaluate(() => {
      const c = document.querySelectorAll('.card.prod')
      if (c.length < 2) return null
      const a = c[0].getBoundingClientRect(), d = c[1].getBoundingClientRect()
      return { side: Math.round(d.left) >= Math.round(a.right) - 1, top: Math.abs(a.top - d.top) < 2 }
    })
    ok('  and both products are beside each other, level',
       !!pair && pair.side && pair.top, JSON.stringify(pair))
    await p.close()
  }

  // The trap. A phone on its side is 844 wide, which is inside the band, and
  // 390 tall, which is why the query asks about the height as well.
  const flat = await b.newPage({ viewport: { width: 844, height: 390 } })
  await seen(flat)
  await flat.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await flat.goto(B + '/', { waitUntil: 'networkidle' }); await flat.waitForTimeout(250)
  const lying = await look(flat)
  ok('a phone lying on its side is not a tablet',
     !lying.art && lying.glyph && lying.pair === 'block' && !!lying.gate && lying.gate.h < 140,
     lying.gate ? `${lying.gate.w}x${lying.gate.h}, art ${lying.art}` : 'no door')
  await flat.close()
}

console.log('\nerrors: ' + (errs.length ? errs.join('\n') : 'none'))
await b.close()
