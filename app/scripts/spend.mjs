/* Spend: airtime, data and electricity, end to end.
 *
 *  Four things this suite is here to catch, because each of them is a way the
 *  place could look right and be wrong:
 *
 *    the naira and the dollars disagree — a bill is typed in one currency and
 *      paid in the other, so the review has to state both and they have to be
 *      the same figures the composer showed;
 *    a meter that is not on the register is payable — the name check is the
 *      whole point of the step and a validator that always says yes has not
 *      validated anything;
 *    a refusal writes something — the wallet must be untouched when a network
 *      says no;
 *    the composer's dialog scrolls on a phone — item 61's ceiling.
 */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const base = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const log = []
const at = (p) => decodeURIComponent(p.url().split('#')[1] ?? '')

/* ---------------- desktop: the rail, and the three ways ---------------- */

const d = await b.newPage({ viewport: { width: 1440, height: 1024 } })
await seen(d)
d.on('pageerror', (e) => errs.push('desktop pageerror: ' + e.message))

await d.goto(base + '/spend', { waitUntil: 'networkidle' })
await d.waitForTimeout(320)
log.push('DESKTOP  /spend')
log.push('  lands on:  ' + at(d))
log.push('  title:     ' + (await d.locator('.page-header h1').textContent())
       + '   lit place: ' + (await d.locator('.nav-row[aria-current] span:nth-child(2)').textContent()))
log.push('  ways:      ' + (await d.locator('.ways .set-row .t-body-strong').allTextContents()).join(' / '))
log.push('  lit way:   ' + (await d.locator('.ways .set-row.on .t-body-strong').textContent()))
await d.screenshot({ path: '/tmp/shots/spend-01-rail.png' })

/* ---------------- airtime: a number, then an amount ---------------- */

await d.locator('.set-panel input').fill('08031234567')
await d.waitForTimeout(120)
log.push('')
log.push('  typed 08031234567 → guess: ' + (await d.locator('.set-panel .t-caption').first().textContent()))
log.push('  network chips:     ' + (await d.locator('.set-panel .chip').allTextContents()).join(' ')
       + '   pressed: ' + (await d.locator('.set-panel .chip[aria-pressed="true"]').textContent()))
await d.locator('.set-panel .btn-secondary').first().click()
await d.waitForTimeout(320)
log.push('  continue →   ' + at(d))
log.push('  composer:    ' + (await d.locator('.amount-box input').inputValue())
       + '   for: ' + (await d.locator('.set-panel .sheet-row .t-body-strong').first().textContent()))
const rows = await d.locator('.summary .kv').allTextContents()
log.push('  summary:     ' + rows.join(' | '))
log.push('  button:      ' + (await d.locator('.col-compose .btn-primary').textContent()))
await d.screenshot({ path: '/tmp/shots/spend-02-airtime.png' })

// The two figures have to agree. ₦1,000 at ₦1,500 to the dollar is $0.67.
const cashBefore = await d.locator('.eyebrow strong').textContent()
await d.locator('.col-compose .btn-primary').click()
await d.waitForTimeout(320)
log.push('  review:      ' + (await d.locator('.sheet-head h2').textContent())
       + '   figure: ' + (await d.locator('.sheet .figure .t-display-xl').first().textContent()))
log.push('  review rows: ' + (await d.locator('.sheet .panel .cell').allTextContents()).join(' | '))
await d.screenshot({ path: '/tmp/shots/spend-03-review.png' })
await d.locator('.sheet .btn-primary').click()
await d.waitForTimeout(700)
log.push('  outcome:     ' + (await d.locator('.sheet .t-title').textContent())
       + ' — ' + (await d.locator('.sheet .figure .muted').textContent()))
log.push('  cash:        ' + cashBefore + ' → ' + (await d.locator('.eyebrow strong').textContent()))
await d.screenshot({ path: '/tmp/shots/spend-04-done.png' })

/* ---------------- data: a list, not a keypad ---------------- */

await d.goto(base + '/spend/data?to=08031234567&net=mtn', { waitUntil: 'networkidle' })
await d.waitForTimeout(320)
log.push('')
log.push('DESKTOP  /spend/data')
log.push('  keypads:   ' + (await d.locator('.amount-box').count()) + '  (a price is a price)')
const plans = await d.locator('.set-panel .sheet-list .sheet-row').count()
log.push('  plans:     ' + plans + '   first: '
       + (await d.locator('.set-panel .sheet-list .sheet-row').first().innerText()).replace(/\n/g, ' · '))
await d.screenshot({ path: '/tmp/shots/spend-05-data.png' })
await d.locator('.set-panel .sheet-list .sheet-row').nth(1).click()
await d.waitForTimeout(320)
log.push('  review:    ' + (await d.locator('.sheet .panel .cell').allTextContents()).join(' | '))
await d.locator('.sheet .btn-primary').click()
await d.waitForTimeout(700)
log.push('  outcome:   ' + (await d.locator('.sheet .t-title').textContent())
       + ' — ' + (await d.locator('.sheet .figure .muted').textContent()))

/* ---------------- electricity: the meter check is real ---------------- */

await d.goto(base + '/spend/electricity', { waitUntil: 'networkidle' })
await d.waitForTimeout(320)
log.push('')
log.push('DESKTOP  /spend/electricity')
const supply = d.locator('.card', { hasText: 'Who supplies you' })
log.push('  discos:    ' + (await supply.locator('.sheet-row').count()))
log.push('  saved:     ' + (await d.locator('.card', { hasText: 'Meters you have paid' })
  .locator('.sheet-row').first().innerText()).replace(/\n/g, ' · '))
await supply.locator('.sheet-row', { hasText: 'Ikeja Electric' }).click()
await d.waitForTimeout(320)
log.push('  picked →   ' + at(d))
const meter = d.locator('.set-panel input')
await meter.fill('45123456782')          // index 2 is not on the register
await d.waitForTimeout(160)
log.push('  ...782:    ' + (await d.locator('.set-panel .field-error').innerText())
       + '   continue disabled: ' + (await d.locator('.set-panel .btn-primary').isDisabled()))
await meter.fill('45123456780')
await d.waitForTimeout(160)
log.push('  ...780:    ' + (await d.locator('.set-panel .set-banner').innerText()).replace(/\n/g, ' · ')
       + '   continue disabled: ' + (await d.locator('.set-panel .btn-primary').isDisabled()))
await d.screenshot({ path: '/tmp/shots/spend-06-meter.png' })
await d.locator('.set-panel .btn-primary').click()
await d.waitForTimeout(320)
log.push('  continue → ' + at(d))
log.push('  composer:  ' + (await d.locator('.amount-box input').inputValue())
       + '   for: ' + (await d.locator('.set-panel .sheet-row .t-body-strong').first().textContent()))
await d.locator('.col-compose .btn-primary').click()
await d.waitForTimeout(320)
await d.locator('.sheet .btn-primary').click()
await d.waitForTimeout(900)
log.push('  outcome:   ' + (await d.locator('.sheet .t-title').textContent()))
log.push('  token:     ' + (await d.locator('.sheet .panel .cell').first().innerText()).replace(/\n/g, ' '))
await d.screenshot({ path: '/tmp/shots/spend-07-token.png' })

/* ---------------- a network that says no writes nothing ---------------- */

await d.goto(base + '/spend/electricity?disco=ikeja&kind=postpaid&meter=45123456780',
  { waitUntil: 'networkidle' })
await d.waitForTimeout(320)
const before = await d.locator('.eyebrow strong').textContent()
await d.locator('.amount-box input').fill('9999')
await d.locator('.amount-box input').press('Enter')
await d.waitForTimeout(420)
await d.locator('.sheet .btn-primary').click()
await d.waitForTimeout(700)
log.push('')
log.push('REFUSAL  ₦9,999')
log.push('  said:      ' + (await d.locator('.sheet .hold.expired').innerText()))
log.push('  still on the review: ' + (await d.locator('.sheet-head h2').textContent()))
await d.screenshot({ path: '/tmp/shots/spend-08-refused.png' })
await d.locator('.sheet .close').click()
await d.waitForTimeout(320)
log.push('  cash:      ' + before + ' → ' + (await d.locator('.eyebrow strong').textContent())
       + '   (must not move)')

/* ---------------- the record, both ends ---------------- */

await d.goto(base + '/statement', { waitUntil: 'networkidle' })
await d.waitForTimeout(400)
const trial = await d.evaluate(() => [...document.querySelectorAll('.card')]
  .map((c) => c.innerText.split('\n').slice(0, 2).join(' '))
  .filter((t) => /balance|trial|naira|dollar/i.test(t)).slice(0, 6))
log.push('')
log.push('STATEMENT  ' + trial.join('  |  '))
log.push('  biller listed: ' + (await d.getByText('Bill partners').count()))
await d.screenshot({ path: '/tmp/shots/spend-09-statement.png', fullPage: true })

/* ---------------- the phone ---------------- */

const p = await b.newPage({ viewport: { width: 390, height: 844 } })
await seen(p)
p.on('pageerror', (e) => errs.push('phone pageerror: ' + e.message))
await p.goto(base + '/spend', { waitUntil: 'networkidle' })
await p.waitForTimeout(320)
log.push('')
log.push('PHONE  /spend')
log.push('  rails:     ' + (await p.locator('.ways .set-row').count())
       + '   dialogs: ' + (await p.locator('.scrim').count()))
await p.screenshot({ path: '/tmp/shots/spend-10-phone.png' })
// The phone has four tabs and Spend is not one of them, so the grid behind
// More has to carry it — otherwise the only way in is the door on Home.
await p.locator('.rail-more').click()
await p.waitForTimeout(260)
log.push('  behind More: ' + (await p.locator('.rail-cell-label').allTextContents()).join(' / '))
await p.screenshot({ path: '/tmp/shots/spend-10b-more.png' })
await p.locator('.rail-more').click()
await p.waitForTimeout(220)

for (const [what, path] of [
  ['airtime', '/spend/airtime?to=08031234567&net=mtn'],
  ['meter', '/spend/electricity?disco=ikeja&kind=prepaid&meter=45123456780'],
]) {
  await p.goto(base + path, { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  const fit = await p.evaluate(() => {
    const s = document.querySelector('.sheet')
    const btn = s && s.querySelector('.btn-primary')
    if (!s || !btn) return null
    const bb = btn.getBoundingClientRect()
    return { h: Math.round(s.clientHeight), content: s.scrollHeight,
             button: bb.bottom <= window.innerHeight + 1 && bb.top >= 0 }
  })
  log.push(`  ${what.padEnd(8)} sheet ${fit.h}  content ${fit.content}  `
         + `button on screen: ${fit.button}  scrolls: ${fit.content > fit.h}`)
  await p.screenshot({ path: `/tmp/shots/spend-11-${what}.png` })
}

// And the phone can finish one.
await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(320)
await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(900)
log.push('  finished:  ' + (await p.locator('.sheet .t-title').textContent()))
await p.screenshot({ path: '/tmp/shots/spend-12-phone-done.png' })

console.log(log.join('\n'))
console.log(errs.length ? '\nERRORS\n' + errs.join('\n') : '\nno page errors')
await b.close()
