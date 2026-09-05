/* Every hover in the product, measured rather than eyeballed.
   For each target: the surface at rest, the surface under the pointer, the
   lightness step between them, and whether the text on the hovered surface
   still clears AA. A hover nobody can see is not a hover. */
import { chromium } from 'playwright'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.setDefaultTimeout(4000)

/* The webfont is fetched from a host this sandbox cannot reach, and a page
   that never stops loading never settles. Colour does not need it. */
const noFonts = (pg) => pg.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await noFonts(page)

const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const L = (s) => { const [r, g, bl] = rgb(s); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl) }
/* CIE L*, which is what an eye counts in, not raw luminance */
const star = (s) => { const y = L(s); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y }
const ratio = (a, c) => { const [x, y] = [L(a), L(c)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

const look = async (sel) => page.$eval(sel, (el) => {
  const s = getComputedStyle(el)
  /* the painted surface, walking up through anything transparent */
  let n = el, bg = s.backgroundColor
  while (n && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) { n = n.parentElement; if (n) bg = getComputedStyle(n).backgroundColor }
  return { bg, fg: s.color, transform: s.transform, shadow: s.boxShadow, deco: s.textDecorationLine }
})

const rows = []
async function probe(label, route, sel, hoverSel = sel, readSel = sel) {
 try {
  /* about:blank between routes so a same-hash goto is still a real render,
     and so the pointer never carries a hover across from the last screen */
  await page.goto('about:blank')
  await page.goto(B + route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(150)
  if (!(await page.$(sel))) { rows.push({ label, note: 'NOT FOUND' }); return }
  /* longer than the 110ms transition, or "rest" is read mid-fade */
  await page.mouse.move(4, 4); await page.waitForTimeout(250)
  const rest = await look(readSel)
  await page.hover(hoverSel); await page.waitForTimeout(200)
  const hov = await look(readSel)
  const step = Math.abs(star(hov.bg) - star(rest.bg))
  rows.push({
    label,
    bg: rest.bg === hov.bg ? '—' : `${rest.bg} → ${hov.bg}`,
    step: +step.toFixed(1),
    fg: rest.fg === hov.fg ? '' : `${rest.fg} → ${hov.fg}`,
    moves: hov.transform !== rest.transform && hov.transform !== 'none',
    lifts: hov.shadow !== rest.shadow && hov.shadow !== 'none',
    underline: hov.deco !== rest.deco,
    aa: +ratio(hov.fg, hov.bg).toFixed(2),
  })
 } catch (e) { rows.push({ label, note: 'ERROR ' + String(e).split('\n')[0] }) }
}

await probe('sidebar nav row',    '/',        '.nav-row:not([aria-current])')
await probe('sidebar lit row',    '/',        ".nav-row[aria-current='page']")
await probe('whoami',             '/',        '.whoami')
await probe('gateway tile (a.card)', '/',     'a.card.tile')
await probe('primary button',     '/market/aapl', '.btn-primary')
await probe('secondary button',   '/market/aapl', '.btn-secondary')
await probe('quiet button',       '/history?q=zzzz', '.btn-quiet')
await probe('chip, unselected',   '/',        ".chip[aria-pressed='false']")
await probe('chip, selected',     '/',        ".chip[aria-pressed='true']")
await probe('icon button',        '/',        '.icon-btn')
await probe('jump-open',          '/',        '.jump-open')
await probe('crumb',              '/market/aapl', 'a.crumb')
await probe('sortable header',    '/market',  '.th-sort')
await probe('table row',          '/market',  '.table tbody tr', '.table tbody tr td:first-child', '.table tbody tr td:first-child')
await probe('table row mark',     '/history', '.table tbody tr .mark', '.table tbody tr td:first-child', '.table tbody tr .mark')
await probe('all-row',            '/all',     '.all-row')
await probe('label.field',        '/all',     'label.field')
await probe('link',               '/wallet',  '.link')

/* a hero band holds while the others fall back */
await page.goto(B + '/wallet', { waitUntil: 'networkidle' }); await page.waitForTimeout(150)
await page.mouse.move(0, 0); await page.waitForTimeout(60)
const restOp = await page.$$eval('.hero-bar .seg', (n) => n.map((e) => +getComputedStyle(e).opacity))
await page.hover('.hero-bar .seg.b'); await page.waitForTimeout(200)
const hovOp = await page.$$eval('.hero-bar .seg', (n) => n.map((e) => +getComputedStyle(e).opacity))
const tip = await page.getAttribute('.hero-bar .seg.b', 'title')


console.log('target'.padEnd(22), 'L*   aa    move lift undr  surface / ink')
for (const r of rows) {
  if (r.note) { console.log(r.label.padEnd(22), r.note); continue }
  console.log(
    r.label.padEnd(22),
    String(r.step).padStart(4),
    '  ', String(r.aa).padStart(5),
    ' ', r.moves ? 'yes ' : '  . ',
    ' ', r.lifts ? 'yes' : ' . ',
    ' ', r.underline ? 'yes' : ' . ',
    ' ', r.bg === '—' ? (r.fg || '—') : r.bg)
}
console.log('\nhero bands  rest', JSON.stringify(restOp), ' hovering B', JSON.stringify(hovOp))
console.log('hero tooltip:', JSON.stringify(tip))


/* A pointer is the premise. On a touch screen :hover latches after a tap, so
   none of it may apply. */
const touch = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
const tp = await touch.newPage(); await noFonts(tp)
await tp.goto(B + '/market', { waitUntil: 'networkidle' }); await tp.waitForTimeout(200)
const coarse = await tp.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)
await tp.tap('.table tbody tr td:first-child').catch(() => {})
await tp.waitForTimeout(300)
const stuck = await tp.evaluate(() =>
  [...document.querySelectorAll('.table tbody td, .sheet-row, .nav-row')]
    .filter((e) => getComputedStyle(e).backgroundColor === 'rgb(32, 32, 36)').length)
console.log('\ntouch: pointer is fine?', coarse, ' rows left lit after a tap:', stuck)

/* Reduced motion keeps the answer and drops the travel. */
const rm = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
const rp = await rm.newPage(); await noFonts(rp)
await rp.goto(B + '/', { waitUntil: 'networkidle' }); await rp.waitForTimeout(200)
await rp.hover('a.card.tile'); await rp.waitForTimeout(250)
const rmState = await rp.$eval('a.card.tile', (e) => {
  const s = getComputedStyle(e)
  return { transform: s.transform, bg: s.backgroundColor, dur: s.transitionDuration }
})
console.log('reduced motion:', JSON.stringify(rmState))

const faint = rows.filter((r) => !r.note && r.step < 2 && !r.underline && !r.fg && !r.moves && !r.lifts)
const lowAa = rows.filter((r) => !r.note && r.aa < 4.5)
console.log('\nfaint (no visible answer):', faint.length ? faint.map((r) => r.label).join(', ') : 'none')
console.log('below AA on the hovered surface:', lowAa.length ? lowAa.map((r) => `${r.label} ${r.aa}`).join(', ') : 'none')
console.log('page errors:', errors.length ? errors : 'none')
await b.close()
