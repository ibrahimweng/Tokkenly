import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 1150 } })
await seen(p)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await p.goto('http://localhost:4173/#/grow', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(700)
console.log(JSON.stringify(await p.evaluate(() => {
  const out = {}
  for (const k of ['lend', 'borrow']) {
    const c = document.querySelector('.prod-' + k)
    const r = c.getBoundingClientRect()
    out[k] = {
      cardTop: Math.round(r.top), cardH: Math.round(r.height),
      parts: [...c.children].map((e) => e.className.split(' ')[0] + '=' + Math.round(e.getBoundingClientRect().height)),
      btnTop: Math.round(c.querySelector('.btn').getBoundingClientRect().top - r.top),
      gap: Math.round((c.querySelector('.spacer')?.getBoundingClientRect().height) ?? 0),
    }
  }
  return out
}), null, 1))
await b.close()
