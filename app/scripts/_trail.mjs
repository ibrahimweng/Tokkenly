import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
const p = await c.newPage()
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await seen(p, {})
for (const r of ['/invest/aapl', '/invest/aapl/invest', '/invest/aapl/sell', '/invest/aapl/send', '/invest/dis/invest']) {
  await p.goto(B + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(350)
  const t = await p.evaluate(() =>
    [...document.querySelectorAll('.crumbs .crumb')].map((e) => e.textContent.trim()).join(' > ') || '(none)')
  console.log(r.padEnd(24), t)
}
await b.close()
