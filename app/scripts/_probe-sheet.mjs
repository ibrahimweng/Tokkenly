import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
const p = await c.newPage()
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await seen(p, {})
for (const r of process.argv.slice(2)) {
  await p.goto(B + r, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  const d = await p.evaluate(() => {
    const el = document.querySelector('#app dialog, #app [role=dialog], #app .sheet')
    return el ? (el.querySelector('h2,h3,h1')?.innerText ?? '(dialog, no heading)').trim() : null
  })
  console.log((d ? '  DIALOG ' : '  none   ') + r.padEnd(36) + (d ?? ''))
}
await b.close()
