/* The two nav bugs, before and after, from two real builds on two ports. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const SHOTS = [
  ['bucket-rail', 4173, '/bucket', 1440, { clip: { x: 0, y: 0, width: 260, height: 500 } }],
  ['spend-bar', 4173, '/spend', 390, { clip: { x: 0, y: 760, width: 390, height: 84 } }],
]
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [name, _p, route, w, opt] of SHOTS) {
  for (const [side, port] of [['before', 4174], ['after', 4173]]) {
    const c = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 1000 }, deviceScaleFactor: 2 })
    const p = await c.newPage()
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
    await seen(p, {})
    await p.goto(`http://localhost:${port}/#${route}`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(600)
    await p.screenshot({ path: `/tmp/${name}-${side}.png`, ...opt })
    await c.close()
  }
  console.log('shot ' + name)
}
await b.close()
