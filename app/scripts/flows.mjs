import { chromium } from 'playwright'
import { seen, settled } from './seen.mjs'
const base = 'http://localhost:4173/#'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
// The balance this suite reads lives on the Detailed home; Simple became
// the default and the selector went with it. And the ask-again PIN gate now
// stands in front of anything over $500, which flow 2 crosses — this suite is
// about whether the money moves, and the gate has lock.mjs and settings.mjs.
await seen(page, { homeView: 'detailed', confirmOver: 0 })
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))

const log = []
const step = async (msg) => log.push('  ' + msg)
const text = async (sel) => (await page.locator(sel).first().textContent()) ?? ''
/** The value of a labelled row, found by its label. The stock page grew a
 *  "The token itself" card above the position, so "the first .kv in the side
 *  column" started reading Liquidity — a number this suite then reported as
 *  the holding, unchanged, twice, without failing. */
const rowValue = async (label) =>
  (await page.locator('.kv', { hasText: label }).first().locator('span').last().textContent()) ?? ''

async function clickText(t, opts = {}) {
  await page.getByText(t, { exact: opts.exact ?? true }).first().click()
  await page.waitForTimeout(140)
}

/* ---- flow 1: borrow, end to end, and check the money actually moved ---- */
log.push('FLOW 1  Borrow & Lend → Borrow → review → confirm → receipt')
await page.goto(base + '/transfer', { waitUntil: 'networkidle' })
const cashBefore = (await settled(page, '.hero-figure')).trim()
await step('wallet cash before: ' + cashBefore.trim())

await page.goto(base + '/grow', { waitUntil: 'networkidle' })
// The card's button opens the position rather than the composer (11g.43):
// somebody with an open loan came to look at it, not to take another one. So
// the journey is one step longer, and the step is part of what is being
// checked — this is the walk a person actually takes. It says what it opens
// now rather than promising an action it does not perform (11g.58).
await clickText('See your borrowing')
await step('on ' + page.url().split('#')[1])
await clickText('Borrow more')
await step('then on ' + page.url().split('#')[1])
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
await page.locator('.sheet .btn-secondary').click()   // See the record
await page.waitForTimeout(250)
// In place: the record opens over the screen you were on rather than
// navigating you to Activity to read it.
await step('record opened on ' + page.url().split('#')[1].split('?')[0] + ', still: ' + (await text('.sheet-head h2')).trim())
await page.keyboard.press('Escape')
await page.waitForTimeout(150)

await page.goto(base + '/transfer', { waitUntil: 'networkidle' })
// The wallet's figure travels to its new value, so a read taken a fixed
// moment after arriving is a read of the animation. This suite reports rather
// than asserts, so it printed the old balance and nothing failed.
await step('wallet cash after: ' + (await settled(page, '.hero-figure')).trim())

/* ---- flow 2: repay it back ---- */
log.push('')
log.push('FLOW 2  Borrow & Lend → Repay → confirm')
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
await page.goto(base + '/invest/aapl', { waitUntil: 'networkidle' })
const heldBefore = await rowValue('You hold')
await step('holding before: ' + heldBefore.trim())
await clickText('Buy AAPLc')
await page.locator('.amount-box input').fill('250')
await page.locator('.amount-box input').blur()
await page.waitForTimeout(120)
await page.locator('.card .btn-primary').click()
await page.waitForTimeout(600)
await page.locator('.sheet .btn-primary').click()
await page.waitForTimeout(600)
await step('outcome: ' + (await text('.sheet .t-title')).trim() + ' — ' + (await text('.sheet .figure .muted')).trim())
await page.keyboard.press('Escape')
await page.goto(base + '/invest/aapl', { waitUntil: 'networkidle' })
await step('holding after:  ' + (await rowValue('You hold')).trim())

/* ---- flow 4: the sheets that are not flows ---- */
log.push('')
log.push('FLOW 4  sheets reachable from a click')
for (const [start, label, expect] of [
  ['/security', 'Recovery phrase', 'Your recovery phrase'],
  ['/security', 'App PIN', 'Change your PIN'],
  ['/account/legal', 'Close my account', 'Close your account'],
  ['/account/details', 'Change', 'Change your mobile number'],
  ['/support', 'Email us', 'Email us'],
  // /withdraw is the bank way of Send now and goes straight to the composer
  // for your first bank; the list of banks, and Add a bank with it, is the way
  // itself (11g.60).
  ['/send/bank', 'Add a bank', 'Your banks'],
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
for (const place of ['Home', 'Wallet', 'Invest', 'Borrow & Lend', 'Activity', 'Account']) {
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.locator('.nav-row', { hasText: place }).first().click()
  await page.waitForTimeout(180)
  const lit = await page.locator('.nav-row[aria-current="page"]').first().textContent()
  await step(`${place.padEnd(8)} → ${page.url().split('#')[1].padEnd(10)} lit: ${lit?.trim()}`)
}

console.log(log.join('\n'))
console.log('\nPAGE ERRORS: ' + (errs.length ? errs.join('\n') : 'none'))
await browser.close()
