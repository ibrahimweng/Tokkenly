/* Every piece of text the product actually renders, against the surface it
   actually lands on, at rest and under the pointer. Alpha is composited the
   way a screen composites it rather than assumed away. AA is 4.5:1, or 3:1
   for text at 24px, or 18.66px carrying 600. */
import { chromium } from 'playwright'

const B = 'http://localhost:4173/#'
const ROUTES = ['/', '/wallet', '/market', '/market/aapl', '/grow', '/history',
  '/settings', '/all', '/send', '/receive']

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } })
page.setDefaultTimeout(8000)

/* The webfont is fetched from a host this sandbox cannot reach, and a page
   that never stops loading never settles. Colour and layout do not need it. */
const noFonts = (pg) => pg.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await noFonts(page)

const sweep = async () => page.evaluate(() => {
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
})

const bad = []
for (const r of ROUTES) {
  await page.goto(B + r, { waitUntil: 'domcontentloaded' })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(250)
  for (const t of await sweep()) if (t.ratio < t.need) bad.push({ route: r, ...t })

  /* and again with a row under the pointer, because the wash moves the ground */
  const row = await page.$('.table tbody tr td')
  if (row) {
    await row.hover(); await page.waitForTimeout(250)
    for (const t of await sweep()) if (t.ratio < t.need) bad.push({ route: r + ' (row hovered)', ...t })
  }
}

const seen = new Set()
const uniq = bad.filter((x) => { const k = x.sel + x.ratio; if (seen.has(k)) return false; seen.add(k); return true })
console.log(uniq.length ? 'BELOW AA:' : 'BELOW AA: none')
for (const x of uniq.sort((a, c) => a.ratio - c.ratio))
  console.log(`  ${String(x.ratio).padStart(5)} / ${x.need}  ${String(x.px).padStart(4)}px  ${x.route.padEnd(22)} ${x.sel.slice(0, 44).padEnd(45)} ${JSON.stringify(x.text)}`)
console.log('total below AA:', uniq.length)
await b.close()
