/* Every piece of text the product actually renders, against the surface it
   actually lands on, at rest and under the pointer. Alpha is composited the
   way a screen composites it rather than assumed away. AA is 4.5:1, or 3:1
   for text at 24px, or 18.66px carrying 600. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const ROUTES = ['/', '/transfer', '/invest', '/invest/aapl', '/grow', '/activity',
  '/all', '/send', '/receive', '/bucket', '/verify', '/disclosures', '/signin',
  // Account is eight screens now, and the two locks are sheets over one of
  // them. '/settings' was in this list and has never been a route.
  '/account', '/account/details', '/account/preferences', '/account/notifications',
  '/account/security', '/account/payments', '/account/verification',
  '/account/support', '/account/legal',
  '/account/security?sheet=pin', '/account/security?sheet=password',
  '/invest/aapl/invest']

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await seen(page)
page.setDefaultTimeout(8000)

/* The webfont is fetched from a host this sandbox cannot reach, and a page
   that never stops loading never settles. Colour and layout do not need it. */
const noFonts = (pg) => pg.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await noFonts(page)

const MEASURE = () => {
  const num = (s) => (s.match(/[-\d.]+/g) || []).map(Number)
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  const over = (fg, bg) => { const a = fg[3] ?? 1; return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)) }

  /* the painted colour behind an element, compositing every translucent
     layer between it and the page, and folding in element opacity */
  const behind = (el) => {
    let acc = [10, 10, 12], stack = []
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n)
      const c = num(s.backgroundColor)
      const o = parseFloat(s.opacity)
      if (c.length >= 3 && (c[3] ?? 1) > 0) stack.push([c[0], c[1], c[2], (c[3] ?? 1) * (isNaN(o) ? 1 : o)])
    }
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc)
    return acc
  }

  const out = []
  for (const el of document.querySelectorAll('*')) {
    const t = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ')
    if (!t) continue
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none') continue
    // WCAG 1.4.3 exempts text that is part of an inactive control, and the
    // product dims disabled buttons to 0.4 on purpose (design.md 11f.7) —
    // the dimness is the signal. Measuring them reports the convention as a
    // failure on every screen that opens with a button waiting for input.
    if (el.closest('[disabled]')) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    /* element opacity fades the text as much as the ground */
    let fade = 1
    for (let n = el; n; n = n.parentElement) { const o = parseFloat(getComputedStyle(n).opacity); if (!isNaN(o)) fade *= o }
    const bg = behind(el)
    const fgc = num(s.color)
    const fg = over([fgc[0], fgc[1], fgc[2], (fgc[3] ?? 1) * fade], bg)
    const [hi, lo] = [lum(fg), lum(bg)].sort((a, c) => c - a)
    const ratio = (hi + 0.05) / (lo + 0.05)
    const px = parseFloat(s.fontSize), w = parseInt(s.fontWeight, 10) || 400
    const large = px >= 24 || (px >= 18.66 && w >= 600)
    out.push({ text: t.slice(0, 40), sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : ''), px, ratio: +ratio.toFixed(2), need: large ? 3 : 4.5 })
  }
  return out
}
const sweep = (pg = page) => pg.evaluate(MEASURE)

const bad = []
/* Both themes. A light palette is not a dark one inverted, so it has to be
   measured on its own ground rather than assumed to follow. */
const THEMES = ['dark', 'light']
for (const theme of THEMES)
for (const r of ROUTES) {
  await page.goto(B + r, { waitUntil: 'domcontentloaded' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
  await page.waitForTimeout(250)
  for (const t of await sweep()) if (t.ratio < t.need) bad.push({ route: theme + ' ' + r, ...t })

  /* and again with a row under the pointer, because the wash moves the ground.
     Not on a route that opens a sheet: the scrim is over the row, the hover
     never lands, and the suite times out rather than reporting anything. */
  const row = await page.$('.scrim') ? null : await page.$('.table tbody tr td')
  if (row) {
    await row.hover(); await page.waitForTimeout(250)
    for (const t of await sweep()) if (t.ratio < t.need) bad.push({ route: theme + ' ' + r + ' (row hovered)', ...t })
  }

  /* The three doors on Home wash green from the bottom edge under the pointer,
     so the ground under their words is a gradient that only exists on hover.
     A gradient has to be checked where the text really sits — walking up the
     tree for the nearest solid fill skips straight past it and reports a pass
     that was never true. Each door in turn, because they are different heights
     of the same gradient. */
  for (const g of await page.$$('.gate')) {
    await g.hover(); await page.waitForTimeout(300)
    for (const t of await sweep()) if (t.ratio < t.need) bad.push({ route: theme + ' ' + r + ' (door hovered)', ...t })
  }
}

/* The lock is the one screen `seen()` cannot reach, since seeding a returning
   visitor is exactly what unlocks it. Both of its states, on its own page. */
for (const theme of THEMES)
for (const [label, wrong] of [['/lock', 0], ['/lock (locked out)', 5]]) {
  const lp = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await lp.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await lp.addInitScript(`try {
    localStorage.setItem('tokkenly.prefs.v1', JSON.stringify({
      seenIntro: true, prefs: { theme: '${theme}' }, security: { wrongPin: ${wrong} } }))
    sessionStorage.removeItem('tokkenly.unlocked')
  } catch {}`)
  await lp.goto(B + '/', { waitUntil: 'domcontentloaded' })
  await lp.waitForTimeout(300)
  for (const t of await sweep(lp)) if (t.ratio < t.need) bad.push({ route: theme + ' ' + label, ...t })
  await lp.close()
}

/* The intro is the other screen seen() cannot reach, for the same reason: it
   is what a returning visitor is seeded past. It has never been measured, and
   it is the one part of the product that puts text on a green gradient — and
   now three pressable cards on it too. */
for (const theme of THEMES)
for (const step of [0, 1, 2, 3]) {
  const wp = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await wp.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await wp.addInitScript(`try {
    localStorage.setItem('tokkenly.prefs.v1', JSON.stringify({
      seenIntro: false, prefs: { theme: '${theme}' }, security: {} }))
    sessionStorage.setItem('tokkenly.unlocked', '1')
  } catch {}`)
  await wp.goto(B + '/welcome/' + step, { waitUntil: 'domcontentloaded' })
  await wp.waitForTimeout(300)
  for (const t of await sweep(wp)) if (t.ratio < t.need) bad.push({ route: theme + ' /welcome/' + step, ...t })
  const card = await wp.$('.welcome-pick')
  if (card) {
    await card.hover(); await wp.waitForTimeout(250)
    for (const t of await sweep(wp)) if (t.ratio < t.need) bad.push({ route: theme + ' /welcome/' + step + ' (hovered)', ...t })
  }
  await wp.close()
}

const already = new Set()
const uniq = bad.filter((x) => { const k = x.route.split(' ')[0] + x.sel + x.ratio; if (already.has(k)) return false; already.add(k); return true })
console.log(uniq.length ? 'BELOW AA:' : 'BELOW AA: none')
for (const x of uniq.sort((a, c) => a.ratio - c.ratio))
  console.log(`  ${String(x.ratio).padStart(5)} / ${x.need}  ${String(x.px).padStart(4)}px  ${x.route.padEnd(22)} ${x.sel.slice(0, 44).padEnd(45)} ${JSON.stringify(x.text)}`)
console.log('total below AA:', uniq.length)
await b.close()
