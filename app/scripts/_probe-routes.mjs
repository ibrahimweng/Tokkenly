import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const R = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
const p = await c.newPage()
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await seen(p, {})
for (const r of R) {
  await p.goto(B + r, { waitUntil: 'networkidle' })
  await p.waitForTimeout(450)
  const info = await p.evaluate(() => {
    const h1 = document.querySelector('h1')
    const bad = /No screen at that address/.test(document.body.innerText)
    return { h1: h1 ? h1.innerText.trim().slice(0, 44) : '(no h1)', bad,
      h: document.getElementById('app').getBoundingClientRect().height }
  })
  console.log((info.bad ? 'MISSING ' : '   ok   ') + r.padEnd(38) + String(Math.round(info.h)).padStart(6) + '  ' + info.h1)
}
await b.close()
