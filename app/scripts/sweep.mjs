/* Nothing may push the page sideways. Twelve routes at every width the product
   is asked to survive, in both themes, and the element that did it if one does.
   320 is below the phone tier but real devices have it, so it is in the list. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const WIDTHS = [1600, 1440, 1280, 1024, 900, 768, 540, 390, 320]
const ROUTES = ['/', '/invest', '/invest/aapl', '/invest/voo', '/invest/aapl/invest',
  '/wallet', '/transfer', '/grow', '/activity', '/bucket',
  '/account', '/account/details', '/account/preferences', '/account/notifications',
  '/account/security', '/account/payments', '/account/verification',
  '/account/support', '/account/legal',
  // The auth screens had never been swept, which is how a 480px card on a
  // 390px phone went unnoticed for as long as it did.
  '/signin', '/signup']

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let bad = 0
for (const theme of ['dark', 'light']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
  await seen(p, { homeView: 'detailed', theme })
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  for (const w of WIDTHS) {
    await p.setViewportSize({ width: w, height: 900 })
    for (const route of ROUTES) {
      await p.goto(B + route, { waitUntil: 'domcontentloaded' })
      await p.waitForTimeout(260)
      const r = await p.evaluate((vw) => {
        const over = document.documentElement.scrollWidth - document.documentElement.clientWidth
        if (over <= 0) return { over: 0, who: '' }
        for (const el of document.querySelectorAll('body *')) {
          const box = el.getBoundingClientRect()
          if (box.right > vw + 0.5 && box.width > 0 && !el.querySelector('*')) {
            return { over, who: el.tagName.toLowerCase() + '.' + String(el.className).trim() }
          }
        }
        return { over, who: 'unattributed' }
      }, w)
      if (r.over > 0) { bad++; console.log(`  OVERFLOW ${theme} ${w} ${route}  by ${r.over}px  ${r.who}`) }
    }
  }
  await p.close()
}
console.log(bad ? `total overflowing: ${bad}` : 'no overflow anywhere')
await b.close()
