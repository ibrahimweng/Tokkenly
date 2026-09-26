/* Every composer sheet on a phone: there is one, its button is on screen, and
   nothing in it is hidden below the sheet's own edge.

   It used to print a table and assert nothing, so "/addmoney no sheet" and
   "/withdraw content 766 > sheet 743" sat in green runs. Each is a check now. */
import { B, launch, check, teardown } from './lib/harness.mjs'
import { seen } from './lib/seen.mjs'
const b = await launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
await seen(p)
// '/send' on the phone is the list of people, not a composer — measuring it
// reported 'no sheet' and checked nothing. The sheet is one step further in,
// once somebody is picked, so that is the route with a button to fit.
// '/addmoney' on the phone is the question of how (bank, crypto wallet, card),
// asked in a sheet with no button of its own: each way is a row to tap. So it
// is checked for a sheet that fits, and not for a button it never had.
for (const hash of ['/grow/borrow', '/grow/repay', '/grow/earn', '/grow/takeout', '/send?to=Tunde Bakare',
  '/addmoney', '/withdraw', '/invest/aapl/invest', '/invest/aapl/sell']) {
  await p.goto(B + hash, { waitUntil: 'networkidle' })
  // Past the 200ms slideup. Measuring at 160 caught the sheet mid-travel and
  // reported the button below the fold about one run in three, which is worse
  // than not checking: a gate that cries wolf gets ignored.
  await p.waitForTimeout(320)
  const r = await p.evaluate(() => {
    const sheet = document.querySelector('.sheet')
    if (!sheet) return null
    const btn = sheet.querySelector('.btn-primary')
    const sb = sheet.getBoundingClientRect()
    const bb = btn?.getBoundingClientRect()
    return { sheetH: Math.round(sb.height), scrollH: sheet.scrollHeight, button: !!btn,
      buttonVisible: !!bb && bb.bottom <= window.innerHeight + 1 && bb.top >= 0 }
  })
  if (!check(`${hash} opens as a sheet`, !!r)) continue
  if (hash !== '/addmoney') check(`${hash} has its button on screen`, r.button && r.buttonVisible, r.button ? '' : 'no button')
  check(`${hash} holds everything without scrolling`, r.scrollH <= r.sheetH + 1,
    `sheet ${r.sheetH}, content ${r.scrollH}`)
}
await teardown(b)
