import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const c = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })
const p = await c.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(e.message))
await seen(p, {})
for (const [n, r] of [['X-home', '/'], ['X-grow', '/grow'], ['X-welcome', '/welcome']]) {
  await p.goto(B + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
  await p.screenshot({ path: `/tmp/shots/${n}.png`, fullPage: true })
  console.log(n.padEnd(12), 'svg count', await p.locator('.gate-art svg, .prod-art svg, .step-art svg, svg').count())
}
console.log('errors', errs.join(' | ') || 'none')
await b.close()
