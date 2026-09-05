import { chromium } from 'playwright'
const base = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const log = []

// phone: who first, then how much
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
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
await p.locator('.sheet .btn-filled').click()
await p.waitForTimeout(600)
log.push('  review:  ' + (await p.locator('.sheet-head h2').textContent()))
await p.locator('.sheet .btn-filled').click()
await p.waitForTimeout(600)
log.push('  outcome: ' + (await p.locator('.sheet .t-title').textContent()))

// desktop is unchanged: one screen, picker on the right
const d = await b.newPage({ viewport: { width: 1440, height: 1024 } })
d.on('pageerror', (e) => errs.push('desktop pageerror: ' + e.message))
await d.goto(base + '/send', { waitUntil: 'networkidle' })
await d.waitForTimeout(200)
log.push('')
log.push('DESKTOP  /send')
log.push('  title:  ' + (await d.locator('.page-header h1').textContent()))
log.push('  composer on page: ' + (await d.locator('.card .amount-box').count())
       + ', picker rows: ' + (await d.locator('.col-side .kv, .stack.grow .kv').count()))

console.log(log.join('\n'))
console.log('\nERRORS: ' + (errs.length ? errs.join('\n') : 'none'))
await b.close()
