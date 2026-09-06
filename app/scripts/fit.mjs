import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const base = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
await seen(p)
const rows = []
// '/send' on the phone is the list of people, not a composer — measuring it
// reported 'no sheet' and checked nothing. The sheet is one step further in,
// once somebody is picked, so that is the route with a button to fit.
for (const hash of ['/grow/borrow','/grow/repay','/grow/earn','/grow/takeout','/send?to=Tunde Bakare','/addmoney','/withdraw','/invest/aapl/invest','/invest/aapl/sell']) {
  await p.goto(base + hash, { waitUntil: 'networkidle' })
  // Past the 200ms slideup. Measuring at 160 caught the sheet mid-travel and
  // reported the button below the fold about one run in three, which is worse
  // than not checking: a gate that cries wolf gets ignored.
  await p.waitForTimeout(320)
  const r = await p.evaluate(() => {
    const sheet = document.querySelector('.sheet')
    const btn = sheet && sheet.querySelector('.btn-primary')
    if (!sheet || !btn) return null
    const sb = sheet.getBoundingClientRect(), bb = btn.getBoundingClientRect()
    return { sheetH: Math.round(sb.height), scrollH: sheet.scrollHeight,
      buttonVisible: bb.bottom <= window.innerHeight + 1 && bb.top >= 0 }
  })
  rows.push(hash.padEnd(26) + (r ? `sheet ${String(r.sheetH).padStart(3)}  content ${String(r.scrollH).padStart(3)}  button on screen: ${r.buttonVisible}` : 'no sheet'))
}
console.log(rows.join('\n'))
await b.close()
