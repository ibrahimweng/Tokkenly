/* Three balances, three networks, and a default that decides what a price says.
 *
 *  Five things this suite is here to catch, because each is a way the model
 *  could look right and be wrong:
 *
 *    the two dollar balances are one balance wearing two labels — they have to
 *      be separate accounts in the ledger and a payment has to move the one it
 *      named;
 *    naira is a conversion of the dollars rather than money of its own — a
 *      bill paid from naira must strike no rate and touch no desk;
 *    an address is shown beside a network it is not on;
 *    a wrong-network paste gets past the field it was typed in;
 *    the default currency changes a balance but not a price, or the other way
 *      round — it is one setting and it has to move both.
 */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const base = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const log = []
let fails = 0
const ok = (what, cond, detail = '') => {
  if (!cond) fails += 1
  log.push(`  ${cond ? 'ok  ' : 'FAIL'}  ${what}${detail ? '  ' + detail : ''}`)
}
const at = (p) => decodeURIComponent(p.url().split('#')[1] ?? '')

const d = await b.newPage({ viewport: { width: 1440, height: 1100 } })
await seen(d)
d.on('pageerror', (e) => errs.push('pageerror: ' + e.message))

/* ---------------- the wallet holds three things ---------------- */

log.push('THREE BALANCES, NOT ONE')
await d.goto(base + '/transfer', { waitUntil: 'networkidle' })
await d.waitForTimeout(350)
// The card is a figure and a bar now; the rows moved into the dialog behind it
// (11g.77). Pressing the card is the path a phone and a keyboard take, so it is
// the path this walks.
const openHold = async () => {
  if (!(await d.locator('.sheet').count())) {
    await d.locator('.hero-cash').click(); await d.waitForTimeout(450)
  }
}
await openHold()
const names = await d.locator('.sheet .sheet-row .t-body-strong').allTextContents()
ok('the wallet lists all three, and what is lent',
   names.join(' ') === 'USDC $1,680.00 USDT $800.00 Naira ₦145,000 Lent out $1,240.00 Including what you lent',
   names.join(' · '))
await d.keyboard.press('Escape'); await d.waitForTimeout(300)
// And the bar is still the same four, said as widths rather than as figures.
const segs = await d.locator('.hero-bar .seg').count()
ok('and the bar is made of the same four', segs === 4, segs + ' segments')
await d.screenshot({ path: '/tmp/shots/assets-01-wallet.png', fullPage: true })

/* ---------------- the statement keeps them apart ---------------- */

await d.goto(base + '/statement', { waitUntil: 'networkidle' })
await d.waitForTimeout(450)
const trial = (await d.locator('main').innerText())
ok('the books still come to nothing in dollars', /DOLLARS[\s\S]{0,40}Balanced/i.test(trial))
ok('and in naira', /NAIRA[\s\S]{0,40}Balanced/i.test(trial))
ok('and the three purses are named separately',
   /Your USDC/.test(trial) && /Your USDT/.test(trial) && /Your naira/.test(trial))
// Only the networks money has actually moved over are listed, because the
// statement lists accounts with postings in them. Base is the seeded one.
ok('and a network is an account rather than "the chain"', /Base network/.test(trial))

/* ---------------- a payment moves the balance it named ---------------- */

log.push('')
log.push('A PAYMENT MOVES THE ONE IT NAMED')
const balances = async () => {
  await d.goto(base + '/transfer', { waitUntil: 'networkidle' })
  await d.waitForTimeout(350)
  await d.locator('.hero-cash').click(); await d.waitForTimeout(450)
  const rows = await d.locator('.sheet .sheet-row').allInnerTexts()
  await d.keyboard.press('Escape'); await d.waitForTimeout(250)
  return rows.map((r) => r.split('\n').filter(Boolean))
}
const before = await balances()
await d.goto(base + '/spend/airtime?to=08024319087&net=airtel', { waitUntil: 'networkidle' })
await d.waitForTimeout(400)
await d.locator('.pay-pill', { hasText: 'USDT' }).click()
await d.waitForTimeout(200)
log.push('  picked USDT, summary: '
  + (await d.locator('.summary .kv').allTextContents()).join(' | '))
await d.locator('.col-compose .btn-primary').click()
await d.waitForTimeout(350)
log.push('  review: ' + (await d.locator('.sheet .panel .cell').allTextContents()).join(' | '))
await d.locator('.sheet .btn-primary').click()
await d.waitForTimeout(800)
const afterUsdt = await balances()
ok('the USDT balance moved', afterUsdt[1][2] !== before[1][2],
   before[1][2] + ' → ' + afterUsdt[1][2])
ok('and the USDC balance did not', afterUsdt[0][2] === before[0][2], afterUsdt[0][2])
await d.screenshot({ path: '/tmp/shots/assets-02-paid-usdt.png', fullPage: true })

/* ---------------- naira out of naira strikes no rate ---------------- */

log.push('')
log.push('NAIRA OUT OF NAIRA IS NOT A CONVERSION')
await d.goto(base + '/spend/airtime?to=08024319087&net=airtel', { waitUntil: 'networkidle' })
await d.waitForTimeout(400)
await d.locator('.pay-pill', { hasText: 'Naira' }).click()
await d.waitForTimeout(250)
const sum = (await d.locator('.summary .kv').allTextContents()).join(' | ')
ok('the composer quotes no rate', !/Rate/.test(sum), sum)
await d.locator('.col-compose .btn-primary').click()
await d.waitForTimeout(350)
const rows = (await d.locator('.sheet .panel .cell').allTextContents()).join(' | ')
ok('and neither does the review', !/Rate/.test(rows) && /Converted\s*Nothing/.test(rows), rows)
await d.screenshot({ path: '/tmp/shots/assets-03-from-naira.png' })
const nairaBefore = (await balances())[2][2]
await d.goto(base + '/spend/airtime?to=08024319087&net=airtel', { waitUntil: 'networkidle' })
await d.waitForTimeout(350)
await d.locator('.pay-pill', { hasText: 'Naira' }).click()
await d.waitForTimeout(200)
await d.locator('.col-compose .btn-primary').click()
await d.waitForTimeout(300)
await d.locator('.sheet .btn-primary').click()
await d.waitForTimeout(800)
const afterNaira = await balances()
ok('the naira balance moved and the dollars did not',
   afterNaira[2][2] !== nairaBefore && afterNaira[0][2] === before[0][2],
   nairaBefore + ' → ' + afterNaira[2][2] + ', USDC ' + afterNaira[0][2])

/* ---------------- receive: the address follows the network ---------------- */

log.push('')
log.push('AN ADDRESS IS AN ADDRESS ON ONE NETWORK')
await d.goto(base + '/addmoney/base', { waitUntil: 'networkidle' })
await d.waitForTimeout(400)
const headOf = () => d.locator('.set-panel .card-head h3').first().innerText()
const addrOf = () => d.locator('.set-panel .field .t-body-strong').first().innerText()
const h1 = await headOf(); const a1 = await addrOf()
ok('it says the asset and the network, in that order', h1 === 'RECEIVE USDC — NETWORK: BASE', h1)
await d.locator('.pay-pill', { hasText: 'USDT' }).click()
await d.waitForTimeout(300)
const h2 = await headOf(); const a2 = await addrOf()
ok('changing the token changes both the heading and the address',
   h2 === 'RECEIVE USDT — NETWORK: TRON' && a2 !== a1, h2 + '  ' + a1 + ' → ' + a2)
ok('and a TRON address looks like one', a2.startsWith('T'), a2)
await d.locator('.pay-pill', { hasText: 'Ethereum' }).click()
await d.waitForTimeout(300)
ok('and so does an Ethereum one', (await addrOf()).startsWith('0x'), await addrOf())
ok('the warning names what it is warning about',
   /USDT on Ethereum only/.test(await d.locator('.set-panel .callout').innerText()))
await d.screenshot({ path: '/tmp/shots/assets-04-receive.png', fullPage: true })

/* ---------------- send: the wrong network does not get past ---------------- */

log.push('')
log.push('AND THE WRONG ONE DOES NOT GET PAST THE FIELD')
await d.goto(base + '/send/base', { waitUntil: 'networkidle' })
await d.waitForTimeout(400)
const addr = d.locator('.set-panel .field input')
await addr.fill('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE')
await d.waitForTimeout(250)
ok('a TRON address against Base is refused, by name',
   /is a TRON address/.test(await d.locator('.set-panel .field-error').innerText()))
ok('and the button is not there to press',
   await d.locator('.set-panel .btn-secondary').isDisabled())
ok('and the standing warning stands down for the specific one',
   await d.locator('.set-panel .callout').isHidden())
await d.screenshot({ path: '/tmp/shots/assets-05-wrongnet.png' })
await addr.fill('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
await d.waitForTimeout(250)
ok('a Base address against Base is not', await d.locator('.set-panel .field-error').isHidden())
await d.locator('.pay-pill', { hasText: 'USDT' }).click()
await d.waitForTimeout(250)
const netNames = await d.locator('.pay-block').nth(1).locator('.pay-pill .t-body-strong').allTextContents()
ok('switching to USDT switches the networks with it',
   netNames.join(' ') === 'TRON Ethereum', netNames.join(' '))
// And the address that was fine a moment ago is not any more, because the
// network under it changed. That is the whole point of checking against the
// network rather than against "an address".
ok('and the address that was valid on Base is refused on TRON',
   await d.locator('.set-panel .btn-secondary').isDisabled())
await addr.fill('TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE')
await d.waitForTimeout(250)
await d.locator('.set-panel .btn-secondary').click()
await d.waitForTimeout(400)
ok('and the composer carries both into the address', /a=usdt/.test(at(d)) && /net=/.test(at(d)), at(d))
await d.locator('.col-compose .btn-primary').click()
await d.waitForTimeout(350)
const sendRows = (await d.locator('.sheet .panel .cell').allTextContents()).join(' | ')
ok('the review names the token and the network', /USDT/.test(sendRows) && /Network/.test(sendRows),
   sendRows)
await d.screenshot({ path: '/tmp/shots/assets-06-send-review.png' })
await d.locator('.sheet .close').click()
await d.waitForTimeout(250)

/* ---------------- the default moves prices and balances together ---------- */

log.push('')
log.push('ONE SETTING, AND IT MOVES EVERYTHING IT SHOULD')
await d.goto(base + '/invest', { waitUntil: 'networkidle' })
await d.waitForTimeout(400)
const priceCell = () => d.locator('table tbody tr').first().locator('td').nth(1).innerText()
const priceUsd = await priceCell()
await d.goto(base + '/account/preferences', { waitUntil: 'networkidle' })
await d.waitForTimeout(350)
await d.locator('.chip', { hasText: 'Naira' }).click()
await d.waitForTimeout(400)
await d.goto(base + '/invest', { waitUntil: 'networkidle' })
await d.waitForTimeout(450)
const priceNgn = await priceCell()
ok('a price follows the setting',
   /^\$[\d,.]+$/.test(priceUsd.trim()) && /^₦[\d,]+$/.test(priceNgn.trim()),
   priceUsd.trim() + ' → ' + priceNgn.trim())
await d.goto(base + '/', { waitUntil: 'networkidle' })
await d.waitForTimeout(450)
const home = await d.locator('.headline, .page-header').first().innerText().catch(() => '')
const fig = await d.locator('.t-figure, .t-display-xl').first().innerText()
ok('and so does the balance on Home', fig.startsWith('₦'), fig)
await d.screenshot({ path: '/tmp/shots/assets-07-naira-home.png', fullPage: true })
// And a composer defaults to it without being told twice.
await d.goto(base + '/spend/airtime?to=08024319087&net=airtel', { waitUntil: 'networkidle' })
await d.waitForTimeout(450)
const pressed = await d.locator('.pay-pill[aria-pressed="true"] .t-body-strong').first().innerText()
ok('and a composer opens on it', pressed === 'Naira', pressed)

/* ---------------- the phone still fits ---------------- */

const p = await b.newPage({ viewport: { width: 390, height: 844 } })
await seen(p)
p.on('pageerror', (e) => errs.push('phone pageerror: ' + e.message))
log.push('')
log.push('AND THE DIALOG STILL FITS ON A PHONE')
for (const [what, path] of [
  ['airtime', '/spend/airtime?to=08024319087&net=airtel'],
  ['send', '/send/tokkenly?to=Tunde%20Bakare'],
]) {
  await p.goto(base + path, { waitUntil: 'networkidle' })
  await p.waitForTimeout(450)
  const fit = await p.evaluate(() => {
    const s = document.querySelector('.sheet')
    const btn = s && s.querySelector('.btn-primary')
    if (!s || !btn) return null
    const bb = btn.getBoundingClientRect()
    return { h: Math.round(s.clientHeight), content: s.scrollHeight,
             button: bb.bottom <= window.innerHeight + 1 && bb.top >= 0,
             pills: s.querySelectorAll('.pay-pill').length }
  })
  ok(`${what}: the picker is there and nothing scrolls`,
     !!fit && fit.pills > 0 && fit.content <= fit.h && fit.button,
     fit ? `${fit.pills} pills, sheet ${fit.h}, content ${fit.content}` : 'no sheet')
  await p.screenshot({ path: `/tmp/shots/assets-08-phone-${what}.png` })
}

console.log(log.join('\n'))
console.log('\nfailures: ' + fails)
console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no page errors')
await b.close()
