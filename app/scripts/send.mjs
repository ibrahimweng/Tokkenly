import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const base = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const log = []

// phone: who first, then how much
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
await seen(p)
p.on('pageerror', (e) => errs.push('phone pageerror: ' + e.message))
await p.goto(base + '/send', { waitUntil: 'networkidle' })
await p.waitForTimeout(200)
log.push('PHONE  /send')
log.push('  title:  ' + (await p.locator('.page-header h1').textContent()))
log.push('  sheet:  ' + (await p.locator('.sheet').count()) + '  people listed: ' + (await p.locator('.sheet-row').count()))
log.push('  first:  ' + (await p.locator('.sheet-row .t-body-strong').first().textContent())
       + ' — ' + (await p.locator('.sheet-row small').first().textContent()))
await p.screenshot({ path: '/tmp/shots/p24-send-who.png' })

await p.locator('.sheet-row', { hasText: 'Tunde Bakare' }).click()
await p.waitForTimeout(220)
log.push('  tapped Tunde → ' + decodeURIComponent(p.url().split('#')[1]))
log.push('  sheet now: ' + (await p.locator('.sheet-head h2').textContent())
       + ', to row: ' + (await p.locator('.sheet .kv').first().textContent()))
await p.screenshot({ path: '/tmp/shots/p25-send-amount.png' })

await p.goBack(); await p.waitForTimeout(220)
log.push('  back →   ' + (await p.locator('.page-header h1').textContent()) + ' (sheets: ' + (await p.locator('.sheet').count()) + ')')

// and it still completes
await p.locator('.sheet-row', { hasText: 'Adaeze' }).click()
await p.waitForTimeout(200)
await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(600)
log.push('  review:  ' + (await p.locator('.sheet-head h2').textContent()))
await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(600)
log.push('  outcome: ' + (await p.locator('.sheet .t-title').textContent()))

// desktop: one screen, the amount on the left and who on the right
const d = await b.newPage({ viewport: { width: 1440, height: 1024 } })
await seen(d)
d.on('pageerror', (e) => errs.push('desktop pageerror: ' + e.message))
await d.goto(base + '/send', { waitUntil: 'networkidle' })
await d.waitForTimeout(200)
log.push('')
log.push('DESKTOP  /send')
log.push('  title:  ' + (await d.locator('.page-header h1').textContent()))
log.push('  composer on page: ' + (await d.locator('.card .amount-box').count())
       + ', people beside it: ' + (await d.locator('.stack.grow .sheet-row').count())
       + ', dialogs: ' + (await d.locator('.scrim').count()))
log.push('  paying:  ' + (await d.locator('.col-compose .sheet-row .t-body-strong').first().textContent()))
log.push('  and an address field for anyone not listed: '
       + (await d.locator('.stack.grow input[placeholder*="address"]').count()))

console.log(log.join('\n'))
console.log('\nERRORS: ' + (errs.length ? errs.join('\n') : 'none'))
await b.close()
