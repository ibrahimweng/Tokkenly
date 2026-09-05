/* The chart at every width it has to survive, and the two things the comb
   never had: a value you can read off it, and a hover that names the point. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 1440, height: 1000 } })
// the chart lives on the detailed Home; Simple is the gateway
await seen(page, { homeView: 'detailed' })
page.setDefaultTimeout(6000)
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())

const read = () => page.evaluate(() => {
  const bars = [...document.querySelectorAll('.ch-bar')]
  const w = bars.map((e) => e.getBoundingClientRect().width)
  const plot = document.querySelector('.ch-plot').getBoundingClientRect()
  const last = bars[bars.length - 1].getBoundingClientRect()
  return {
    bars: bars.length,
    pitch: +(w.reduce((a, c) => a + c, 0) / w.length).toFixed(2),
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
  console.log(`  ${String(w).padStart(4)}  bars ${String(r.bars).padStart(3)}  pitch ${String(r.pitch).padStart(6)}  ` +
    `axis ${r.axis.length} [${r.axis.join(' ')}]  fits ${r.fits}  overflowX ${r.overflowX}`)
}

await page.setViewportSize({ width: 1440, height: 1000 })
await page.goto(B + '/', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(400)
const base = await read()
console.log('\nAXIS   ', base.ticks.join('  '))
console.log('CAPTION', base.caption)
console.log('A11Y   ', base.label)

console.log('\nRANGES')
for (const k of ['1D', '1W', '1M', '3M', '1Y', 'ALL']) {
  await page.getByRole('button', { name: k, exact: true }).first().click()
  await page.waitForTimeout(300)
  const r = await read()
  console.log(`  ${k.padEnd(4)} ${String(r.bars).padStart(3)} bars  ticks [${r.ticks.join(' ')}]  ${r.caption}`)
}

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
    return { text: tip.innerText.replace(/\n/g, ' · '), lit: document.querySelectorAll('.ch-bar.on').length,
      inside: r.left >= p.left - 1 && r.right <= p.right + 1 }
  })
  console.log(`  at ${(f * 100).toFixed(0)}%  ${t ? `${t.text}  lit ${t.lit}  inside ${t.inside}` : 'NO TIP'}`)
}
await page.mouse.move(10, 10)
await page.waitForTimeout(200)
console.log('  leaving hides it:', await page.evaluate(() => document.querySelector('.ch-tip').hidden))

console.log('\nSTOCK PAGE')
await page.goto(B + '/market/aapl', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(400)
const st = await read()
console.log(`  bars ${st.bars}  ticks [${st.ticks.join(' ')}]  ${st.caption}`)
console.log('  ' + st.label)

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
