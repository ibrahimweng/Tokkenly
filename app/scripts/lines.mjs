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
import { B, launch, check, teardown } from './lib/harness.mjs'
import { seen } from './lib/seen.mjs'

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

/* The phone has chrome the desktop does not — the floating rail and the
   panel it becomes — so it is walked too, at the routes that draw it. */
const PHONE = ['/', '/?sheet=more', '/invest', '/activity', '/signin']

const b = await launch()
let bad = 0
for (const [width, routes] of [[1440, ROUTES], [390, PHONE]])
for (const theme of ['dark', 'light']) {
  const p = await b.newPage({ viewport: { width, height: width < 900 ? 844 : 900 } })
  await seen(p, { theme })
  for (const route of routes) {
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
        // A focus ring is a ring, and nothing has focus during a walk — but
        // the active element can, so it is excused by name rather than by luck.
        if (el === document.activeElement) continue
        const what = el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ').join('.') : '')
        if (sides.length) out.push({ what, sides: 'border on ' + sides.join('') })

        // The two other ways a line gets drawn without a border, both of
        // which this suite used to walk straight past.
        //
        // A hairline made of a box: an element (or its ::before/::after) one
        // or two pixels thick in one direction, long in the other, painted.
        // That is a divider whatever it is called — `.rule`, `.rail-rule`,
        // `.chip-split` were all this.
        const painted = (cs) => cs.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
          cs.backgroundColor !== 'transparent' && cs.backgroundImage === 'none'
        const thin = (w, hgt) => (hgt > 0 && hgt <= 2 && w >= 12) || (w > 0 && w <= 2 && hgt >= 12)
        const r = el.getBoundingClientRect()
        if (painted(s) && s.display !== 'none' && s.visibility !== 'hidden' && thin(r.width, r.height))
          out.push({ what, sides: `a ${Math.round(r.width)}x${Math.round(r.height)} painted box, which is a divider` })
        for (const pseudo of ['::before', '::after']) {
          const ps = getComputedStyle(el, pseudo)
          if (ps.content === 'none' || ps.display === 'none' || !painted(ps)) continue
          const pw = parseFloat(ps.width), ph = parseFloat(ps.height)
          if (thin(pw, ph)) out.push({ what: what + pseudo, sides: `a ${pw}x${ph} painted pseudo-element` })
        }

        // A ring made of a shadow: no blur, no offset, only spread. An inset
        // one is an outline drawn inside the box, and `.rail-pill`,
        // `.rail-more` and `.rail-panel` each carried a 1px one. The only
        // rings the rule allows are 2px — the focus ring and the error ring —
        // so a 2px ring passes on a field in error or on whatever holds focus,
        // and nothing else passes at all.
        for (const one of s.boxShadow === 'none' ? [] : s.boxShadow.split(/,(?![^(]*\))/)) {
          if (/rgba\([^)]*,\s*0\)|transparent/.test(one)) continue
          const n = (one.replace(/rgba?\([^)]*\)/g, '').match(/-?[\d.]+px/g) ?? []).map(parseFloat)
          const [x = 0, y = 0, blur = 0, spread = 0] = n
          if (x || y || blur || spread <= 0) continue
          const excused = spread === 2 &&
            (el.matches('.field.error') || el.contains(document.activeElement))
          if (!excused) out.push({ what, sides: `a ${spread}px ${/inset/.test(one) ? 'inset ' : ''}shadow ring` })
        }
      }
      return out
    }, ALLOWED)
    for (const f of found) {
      bad++
      check(`${width} ${theme} ${route}  ${f.what}`, false, f.sides)
    }
  }
  await p.close()
}
console.log(bad ? `total strokes drawn: ${bad}` : 'nothing draws a line')
console.log('allowed, and only these:')
for (const [sel, why] of ALLOWED) console.log(`  ${sel}  —  ${why}`)
await teardown(b)
