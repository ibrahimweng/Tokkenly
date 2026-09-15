import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [w, routes] of [[1440, ['/invest', '/bucket', '/spend', '/verify/what']],
                           [390, ['/', '/invest', '/spend', '/verify/what', '/activity', '/account']]]) {
  const c = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 1000 } })
  const p = await c.newPage()
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await seen(p, {})
  for (const r of routes) {
    await p.goto(B + r, { waitUntil: 'networkidle' })
    await p.waitForTimeout(400)
    const got = await p.evaluate(() => {
      const bar = document.querySelector('.sidebar, .railbar')
      if (!bar) return { bar: 'none' }
      const cur = [...bar.querySelectorAll('[aria-current]')].map((e) => ((e.innerText || '').replace(/\n/g, '/').trim() || '[' + (e.getAttribute('aria-label') || e.className) + ']'))
      const tabs = [...bar.querySelectorAll('.nav-row, .tab')].map((e) => ((e.innerText || '').replace(/\n/g, '/').trim() || '[' + (e.getAttribute('aria-label') || e.className) + ']'))
      return { bar: bar.className, cur, tabs }
    })
    console.log(`${w}  ${r.padEnd(14)} current=[${(got.cur||[]).join(' | ')}]   tabs=[${(got.tabs||[]).join(', ')}]`)
  }
  await c.close()
}
await b.close()
