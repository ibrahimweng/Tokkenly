/* The chart at every width it has to survive, and the two things the comb
   never had: a value you can read off it, and a hover that names the point. */
import { B, launch, check, teardown } from './lib/harness.mjs'
import { seen } from './lib/seen.mjs'
const b = await launch()
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } })
// the chart lives on the detailed Home; Simple is the gateway
await seen(page, { homeView: 'detailed' })
page.setDefaultTimeout(6000)
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

// Home draws a line now and the stock page draws candles, so the reader has to
// know which it is looking at rather than assuming bars and throwing when there
// are none. The width checks below apply either way.
const read = () => page.evaluate(() => {
  const bars = [...document.querySelectorAll('.ch-candle')]
  const area = document.querySelector('.ch-svg')
  const w = bars.map((e) => e.getBoundingClientRect().width)
  const plot = document.querySelector('.ch-plot').getBoundingClientRect()
  const last = (bars.length ? bars[bars.length - 1] : area).getBoundingClientRect()
  return {
    shape: bars.length ? 'candles' : 'area',
    bars: bars.length,
    pitch: bars.length ? +(w.reduce((a, c) => a + c, 0) / w.length).toFixed(2) : 0,
    ticks: [...document.querySelectorAll('.ch-tick')].map((e) => e.textContent),
    axis: [...document.querySelectorAll('.ch-axis span')].map((e) => e.textContent),
    caption: document.querySelector('.chart .t-caption').textContent,
    /* does the last bar sit inside the plot, or over its edge? */
    fits: last.right <= plot.right + 1 && last.left >= plot.left - 1,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    label: document.querySelector('.ch-plot').getAttribute('aria-label'),
  }
})

console.log('WIDTHS')
for (const w of [1440, 1200, 1024, 900, 768, 540, 390, 320]) {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(B + '/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(400)
  const r = await read()
  console.log(`  ${String(w).padStart(4)}  ${r.shape.padEnd(7)} marks ${String(r.bars).padStart(3)}  pitch ${String(r.pitch).padStart(6)}  ` +
    `axis ${r.axis.length} [${r.axis.join(' ')}]  fits ${r.fits}  overflowX ${r.overflowX}`)
  // What the table above was for, stated: the marks stay inside the plot, the
  // page does not scroll sideways, and there is an axis to read a date off.
  check(`${w}: inside its plot, nothing sideways, an axis`, r.fits && r.overflowX <= 0 && r.axis.length >= 2)
}

await page.setViewportSize({ width: 1440, height: 1000 })
await page.goto(B + '/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(400)
const base = await read()
console.log('\nAXIS   ', base.ticks.join('  '))
console.log('CAPTION', base.caption)
console.log('A11Y   ', base.label)
check('a value can be read off it', base.ticks.length >= 2 && /\$/.test(base.ticks[0] ?? ''), base.ticks.join(' '))
check('and a screen reader is told what it shows', /over time/.test(base.label ?? ''))

console.log('\nRANGES')
const ranges = new Set()
for (const k of ['1D', '1W', '1M', '3M', '1Y', 'ALL']) {
  await page.getByRole('button', { name: k, exact: true }).first().click()
  await page.waitForTimeout(300)
  const r = await read()
  console.log(`  ${k.padEnd(4)} ${String(r.bars).padStart(3)} bars  ticks [${r.ticks.join(' ')}]  ${r.caption}`)
  ranges.add(r.caption)
}
check('every range says something different', ranges.size === 6, `${ranges.size} captions`)

console.log('\nHOVER')
await page.getByRole('button', { name: '1Y', exact: true }).first().click()
await page.waitForTimeout(300)
const box = await page.locator('.ch-bars').boundingBox()
for (const f of [0.15, 0.5, 0.95]) {
  await page.mouse.move(box.x + box.width * f, box.y + box.height * 0.7)
  await page.waitForTimeout(150)
  const t = await page.evaluate(() => {
    const tip = document.querySelector('.ch-tip')
    if (tip.hidden) return null
    const r = tip.getBoundingClientRect(), p = document.querySelector('.ch-plot').getBoundingClientRect()
    return { text: tip.innerText.replace(/\n/g, ' · '), lit: document.querySelectorAll('.ch-candle.on').length,
      inside: r.left >= p.left - 1 && r.right <= p.right + 1 }
  })
  console.log(`  at ${(f * 100).toFixed(0)}%  ${t ? `${t.text}  lit ${t.lit}  inside ${t.inside}` : 'NO TIP'}`)
  check(`hover at ${(f * 100).toFixed(0)}% names the point, inside the plot`, !!t && /\$/.test(t.text) && t.inside, t?.text ?? 'no tip')
}
await page.mouse.move(10, 10)
await page.waitForTimeout(200)
check('leaving hides it', await page.evaluate(() => document.querySelector('.ch-tip').hidden))

console.log('\nSTOCK PAGE')
await page.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(400)
const st = await read()
console.log(`  bars ${st.bars}  ticks [${st.ticks.join(' ')}]  ${st.caption}`)
console.log('  ' + st.label)
check('the stock page draws candles, inside the plot', st.shape === 'candles' && st.bars > 0 && st.fits, `${st.bars} bars`)

check('no page errors', !errs.length, errs.join(' | '))
await teardown(b)
