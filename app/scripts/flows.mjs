import { chromium } from 'playwright'
const base = 'http://localhost:4173/#'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))

const log = []
const step = async (msg) => log.push('  ' + msg)
const text = async (sel) => (await page.locator(sel).first().textContent()) ?? ''

async function clickText(t, opts = {}) {
  await page.getByText(t, { exact: opts.exact ?? true }).first().click()
  await page.waitForTimeout(140)
}

/* ---- flow 1: borrow, end to end, and check the money actually moved ---- */
log.push('FLOW 1  Grow → Borrow → review → confirm → receipt')
await page.goto(base + '/wallet', { waitUntil: 'networkidle' })
const cashBefore = await text('.t-display-xl')
await step('wallet cash before: ' + cashBefore.trim())

await page.goto(base + '/grow', { waitUntil: 'networkidle' })
await clickText('Borrow money')
await step('on ' + page.url().split('#')[1])
await page.locator('.amount-box input').fill('600')
await page.locator('.amount-box input').blur()
await page.waitForTimeout(120)
await step('typed 600, button now says: ' + (await text('.card .btn-primary')).trim())
await page.locator('.card .btn-primary').click()
await page.waitForTimeout(600)
await step('sheet: ' + (await text('.sheet-head h2')).trim() + ' / ' + (await text('.figure .t-display-xl')).trim())
await page.locator('.sheet .btn-primary').click()
await page.waitForTimeout(600)
await step('outcome: ' + (await text('.sheet .t-title')).trim() + ' — ' + (await text('.sheet .figure .muted')).trim())
await page.locator('.sheet .btn-secondary').click()   // View in History
await page.waitForTimeout(250)
await step('landed on ' + page.url().split('#')[1].split('?')[0] + ' with sheet ' + (await text('.sheet-head h2')).trim())
await page.keyboard.press('Escape')
await page.waitForTimeout(150)

await page.goto(base + '/wallet', { waitUntil: 'networkidle' })
await step('wallet cash after: ' + (await text('.t-display-xl')).trim())

/* ---- flow 2: repay it back ---- */
log.push('')
log.push('FLOW 2  Grow → Repay → confirm')
await page.goto(base + '/grow/repay', { waitUntil: 'networkidle' })
await page.locator('.amount-box input').fill('600')
await page.locator('.amount-box input').blur()
await page.waitForTimeout(120)
await page.locator('.card .btn-primary').click()
await page.waitForTimeout(600)
await page.locator('.sheet .btn-primary').click()
await page.waitForTimeout(600)
await step('outcome: ' + (await text('.sheet .t-title')).trim() + ' — ' + (await text('.sheet .figure .muted')).trim())
await page.keyboard.press('Escape')

/* ---- flow 3: buy a stock and see the holding change ---- */
log.push('')
log.push('FLOW 3  Market → Apple → Invest → confirm')
await page.goto(base + '/market/aapl', { waitUntil: 'networkidle' })
const heldBefore = await text('.col-side .card .kv span:last-child')
await step('holding before: ' + heldBefore.trim())
await clickText('Buy AAPL')
await page.locator('.amount-box input').fill('250')
await page.locator('.amount-box input').blur()
await page.waitForTimeout(120)
await page.locator('.card .btn-primary').click()
await page.waitForTimeout(600)
await page.locator('.sheet .btn-primary').click()
await page.waitForTimeout(600)
await step('outcome: ' + (await text('.sheet .t-title')).trim() + ' — ' + (await text('.sheet .figure .muted')).trim())
await page.keyboard.press('Escape')
await page.goto(base + '/market/aapl', { waitUntil: 'networkidle' })
await step('holding after:  ' + (await text('.col-side .card .kv span:last-child')).trim())

/* ---- flow 4: the sheets that are not flows ---- */
log.push('')
log.push('FLOW 4  sheets reachable from a click')
for (const [start, label, expect] of [
  ['/security', 'Recovery phrase', 'Your recovery phrase'],
  ['/security', 'App PIN', 'Change your PIN'],
  ['/account', 'Close my account', 'Close your account'],
  ['/account', 'Change', 'Change your mobile number'],
  ['/support', 'Email us', 'Email us'],
  ['/convert', 'Add a bank', 'Your banks'],
]) {
  await page.goto(base + start, { waitUntil: 'networkidle' })
  await page.getByText(label, { exact: true }).first().click()
  await page.waitForTimeout(180)
  const got = (await text('.sheet-head h2')).trim()
  await step(`${start.padEnd(11)} "${label}" → ${got}   ${got === expect ? 'ok' : 'EXPECTED ' + expect}`)
  await page.keyboard.press('Escape')
}

/* ---- flow 5: every nav place, and the deepest link on each ---- */
log.push('')
log.push('FLOW 5  the rail')
for (const place of ['Home', 'Wallet', 'Market', 'Grow', 'History', 'Account']) {
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.locator('.nav-row', { hasText: place }).first().click()
  await page.waitForTimeout(180)
  const lit = await page.locator('.nav-row[aria-current="page"]').first().textContent()
  await step(`${place.padEnd(8)} → ${page.url().split('#')[1].padEnd(10)} lit: ${lit?.trim()}`)
}

console.log(log.join('\n'))
console.log('\nPAGE ERRORS: ' + (errs.length ? errs.join('\n') : 'none'))
await browser.close()
