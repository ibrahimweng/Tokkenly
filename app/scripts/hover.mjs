/* Every hover in the product, measured rather than eyeballed.
   For each target: the surface at rest, the surface under the pointer, the
   lightness step between them, and whether the text on the hovered surface
   still clears AA. A hover nobody can see is not a hover. */
import { B, launch, check, teardown } from './lib/harness.mjs'
import { seen } from './lib/seen.mjs'

const b = await launch()
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await seen(page, { homeView: 'detailed' })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.setDefaultTimeout(4000)


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
await probe('quick-action tile',    '/',     'a.card.tile')
await probe('primary button',     '/invest/aapl', '.btn-primary')
await probe('secondary button',   '/invest/aapl', '.btn-secondary')
await probe('quiet button',       '/activity?q=zzzz', '.btn-quiet')
await probe('chip, unselected',   '/',        ".chip[aria-pressed='false']")
await probe('chip, selected',     '/',        ".chip[aria-pressed='true']")
await probe('icon button',        '/',        '.icon-btn')
await probe('jump-open',          '/',        '.jump-open')
await probe('crumb',              '/invest/aapl', 'a.crumb')
await probe('sortable header',    '/invest',  '.th-sort')
await probe('table row',          '/invest',  '.table tbody tr', '.table tbody tr td:first-child', '.table tbody tr td:first-child')
await probe('table row mark',     '/activity', '.table tbody tr .mark', '.table tbody tr td:first-child', '.table tbody tr .mark')
await probe('all-row',            '/all',     '.all-row')
await probe('label.field',        '/all',     'label.field')
await probe('link',               '/transfer',  '.link')

/* a hero band holds while the others fall back */
await page.goto(B + '/transfer', { waitUntil: 'networkidle' }); await page.waitForTimeout(150)
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
const tp = await touch.newPage(); await seen(tp, { homeView: 'detailed' })
await tp.goto(B + '/invest', { waitUntil: 'networkidle' }); await tp.waitForTimeout(200)
const coarse = await tp.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)
await tp.tap('.table tbody tr td:first-child').catch(() => {})
await tp.waitForTimeout(300)
const stuck = await tp.evaluate(() =>
  [...document.querySelectorAll('.table tbody td, .sheet-row, .nav-row')]
    .filter((e) => getComputedStyle(e).backgroundColor === 'rgb(32, 32, 36)').length)
console.log('\ntouch: pointer is fine?', coarse, ' rows left lit after a tap:', stuck)

/* Reduced motion keeps the answer and drops the travel. */
const rm = await b.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
const rp = await rm.newPage(); await seen(rp, { homeView: 'detailed' })
await rp.goto(B + '/', { waitUntil: 'networkidle' }); await rp.waitForTimeout(200)
await rp.hover('a.card.tile'); await rp.waitForTimeout(250)
const rmState = await rp.$eval('a.card.tile', (e) => {
  const s = getComputedStyle(e)
  return { transform: s.transform, bg: s.backgroundColor, dur: s.transitionDuration }
})
console.log('reduced motion:', JSON.stringify(rmState))

/* The three doors on Home used to answer with the field: several hundred
   circles that parted around the pointer. The field is gone (11g.79) and so is
   the effect, which was only ever possible because the picture was made of
   several hundred separately-positioned things. What a door answers with now
   is what every other clickable card in the product answers with — the surface
   goes up a rung — so the three readings here are: the door does answer, the
   drawing does not move while it answers, and the drawing's own ground moves
   with the card so it does not read as a hole punched in it. */
{
  const ok = check
  console.log('\nTHE DOORS ANSWER, AND THE DRAWING HOLDS STILL')
  // Its own page: the one this suite has been using is seeded on Detailed,
  // and the doors are Simple's.
  const door = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(door)
  door.on('pageerror', (e) => errors.push(String(e)))
  await door.goto(B + '/', { waitUntil: 'networkidle' }); await door.waitForTimeout(250)

  // What the drawing looks like with the pointer away, down to the numbers in
  // every path: if any of it moves on hover, this string changes.
  const shape = (pg) => pg.evaluate(() =>
    [...document.querySelectorAll('.gate-art svg path, .gate-art svg ellipse')]
      .map((n) => n.getAttribute('d') || `${n.getAttribute('cx')},${n.getAttribute('cy')}`)
      .join('|'))
  const surface = (pg) => pg.evaluate(() =>
    getComputedStyle(document.querySelector('.gate')).backgroundColor)

  await door.mouse.move(0, 0); await door.waitForTimeout(300)
  const restShape = await shape(door)
  const restBg = await surface(door)
  const box = await door.locator('.gate').first().boundingBox()
  await door.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await door.waitForTimeout(320)
  const overShape = await shape(door)
  const overBg = await surface(door)
  const ground = await door.evaluate(() => {
    const g = getComputedStyle(document.querySelector('.gate')).getPropertyValue('--art-ground')
    const bg = getComputedStyle(document.querySelector('.gate')).backgroundColor
    // Resolve the token the same way a fill does, by painting with it.
    const d = document.createElement('div')
    d.style.background = g.trim(); document.querySelector('.gate').appendChild(d)
    const out = getComputedStyle(d).backgroundColor
    d.remove()
    return { out, bg }
  })
  console.log('door  at rest', restBg, ' hovered', overBg)
  ok('the drawing is there at all', restShape.length > 200, `${restShape.length} chars of path`)
  ok('a door still answers the pointer', restBg !== overBg, `${restBg} to ${overBg}`)
  ok('and not one line of the drawing moves while it does',
     restShape === overShape, restShape === overShape ? '' : 'the drawing shifted')
  ok('and the ground it is filled with is the card it is on',
     ground.out === ground.bg, `${ground.out} vs ${ground.bg}`)
  // The green is gone, and nothing put another colour in its place.
  const wash = await door.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.gate'), '::before')
    return s.content !== 'none' && s.backgroundImage !== 'none'
  })
  ok('and no gradient came back to do the job instead', !wash)
  await door.close()
}

const faint = rows.filter((r) => !r.note && r.step < 2 && !r.underline && !r.fg && !r.moves && !r.lifts)
const lowAa = rows.filter((r) => !r.note && r.aa < 4.5)
console.log('\nfaint (no visible answer):', faint.length ? faint.map((r) => r.label).join(', ') : 'none')
console.log('below AA on the hovered surface:', lowAa.length ? lowAa.map((r) => `${r.label} ${r.aa}`).join(', ') : 'none')
console.log('page errors:', errors.length ? errors : 'none')

/* The fields carried three palettes — the text greys, green for lending, amber
   for borrowing, and a purple cell inside the first — with a top rung at text
   white and one flat opacity chosen against a near-black card. Behind a
   heading and a sentence you are meant to read, that is a second foreground.
   The drawings that replaced them have no palette at all: every stroke is
   `currentColor` and the holder sets the colour, so this now reads what the
   holder is set to rather than what several hundred cells were painted. */
console.log('\nTHE DRAWINGS ARE GROUND, NOT FOREGROUND')
const ok = check
for (const theme of ['dark', 'light']) {
  const fp = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(fp, { theme })
  for (const r of ['/', '/grow']) {
    await fp.goto(B + r, { waitUntil: 'domcontentloaded' }); await fp.waitForTimeout(800)
    const m = await fp.evaluate(() => {
      const strokes = new Set()
      let paths = 0
      for (const n of document.querySelectorAll('.gate-art svg *, .prod-art svg *')) {
        const s2 = getComputedStyle(n).stroke
        if (s2 && s2 !== 'none') { strokes.add(s2); paths++ }
      }
      const holder = document.querySelector('.gate-art, .prod-art')
      return {
        strokes: [...strokes], paths,
        veil: holder ? Number(getComputedStyle(holder).opacity) : null,
      }
    })
    const rgb = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number)
    // A hue, not the house neutral. Every grey in this product is slightly
    // cool — --ink is #dcdce0 and --muted is #a6a6ad — so a drawing painted to
    // match them carries the same few points of blue. What this is looking for
    // is the green, the amber and the purple, which are a hundred points wide.
    const coloured = m.strokes.filter((f) => {
      const [r2, g, b2] = rgb(f)
      return Math.max(r2, g, b2) - Math.min(r2, g, b2) > 14
    })
    ok(`${theme} ${r}: the whole drawing is one grey`,
       m.paths > 8 && m.strokes.length === 1 && coloured.length === 0,
       `${m.paths} strokes, ${m.strokes.length} tone(s)${coloured.length ? ' ' + coloured.join(' ') : ''}`)
    ok(`  and the veil is the theme's own`, m.veil !== null && m.veil !== 0.34,
       'opacity ' + m.veil)
  }
  await fp.close()
}

await teardown(b)
