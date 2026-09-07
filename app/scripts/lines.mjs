/* Rule 13, made checkable.

   "Never draw a line. No card outline, no field outline, no list divider, no
   chip edge, no rule under a heading. Outside a chart the only strokes are a
   2px green focus ring, a 2px error ring, and the glyphs themselves."

   It was written in the design record and then broken eight times, in three
   different ways, over four tiers: hairlines between preference rows and
   bucket rows, a boxed and divided strip of percentages, outlines around two
   floating panels, a fenced command palette, and a key cap with an edge. None
   of it looked wrong on its own, which is exactly why a rule needs something
   that can count.

   So this walks the real DOM at every route and reports any element carrying a
   visible stroke. The exceptions are named here rather than tolerated: a chart
   may draw, a PIN dot is a glyph and its empty state is the drawing, and a
   focus ring is a ring. Everything else separates by space or by a step in the
   surface. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const ROUTES = ['/', '/invest', '/invest/aapl', '/invest/aapl/invest', '/transfer',
  '/addmoney', '/send', '/withdraw', '/grow', '/grow/borrow', '/activity',
  '/statement', '/bucket', '/account', '/account/preferences', '/account/security',
  '/account/payments', '/signin', '/lock']

/* Named, so an exception has to be argued for rather than added quietly. */
const ALLOWED = [
  ['.chart, .chart *, svg, svg *', 'a chart is the rule’s own exception'],
  ['.pin-dot', 'an empty PIN dot is a glyph, and its outline is the drawing'],
  ['.btn.is-busy', 'the spinner is a glyph on a pseudo-element'],
]

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let bad = 0
for (const theme of ['dark', 'light']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
  await seen(p, { theme })
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  for (const route of ROUTES) {
    await p.goto(B + route, { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(240)
    const found = await p.evaluate((allowed) => {
      const out = []
      for (const el of document.querySelectorAll('*')) {
        if (allowed.some(([sel]) => el.matches(sel))) continue
        const s = getComputedStyle(el)
        const sides = ['Top', 'Right', 'Bottom', 'Left'].filter((d) => {
          const w = parseFloat(s['border' + d + 'Width'])
          const c = s['border' + d + 'Color']
          return w > 0 && s['border' + d + 'Style'] !== 'none' &&
            c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'
        })
        if (!sides.length) continue
        // A focus ring is a ring, and nothing has focus during a walk — but
        // the active element can, so it is excused by name rather than by luck.
        if (el === document.activeElement) continue
        out.push({
          what: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').join('.') : ''),
          sides: sides.join(''),
        })
      }
      return out
    }, ALLOWED)
    for (const f of found) {
      bad++
      console.log(`  FAIL  ${theme} ${route}  ${f.what}  border on ${f.sides}`)
    }
  }
  await p.close()
}
await b.close()
console.log(bad ? `total strokes drawn: ${bad}` : 'nothing draws a line')
console.log('allowed, and only these:')
for (const [sel, why] of ALLOWED) console.log(`  ${sel}  —  ${why}`)
