/* Five flows clicked through, and what the money did.

   This is the suite the README calls the one that matters, and for a long time
   it asserted nothing: it printed what it saw and exited 0. It typed 600 into
   Borrow, the button read "Borrow $250.00", the wallet moved by 250, and the
   run was green. The 250 was the unverified single-payment ceiling doing its
   job (state.ts, movementCeiling): drawing on the credit line answers to the
   same cap as any other money crossing into the account. So the account is
   verified first, the way fees.mjs does it, and every step below states what
   it expects the money to have done. */
import { B, launch, check, teardown } from './lib/harness.mjs'
import { seen, settled, verify } from './lib/seen.mjs'

const browser = await launch()
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

const text = async (sel) => ((await page.locator(sel).first().textContent()) ?? '').trim()
/** The first figure in a string, in dollars: "$2,576.67" is 2576.67. */
const money = (s) => Number((String(s ?? '').match(/-?[\d,]+\.?\d*/) ?? ['NaN'])[0].replace(/,/g, ''))
const cents = (n) => Math.round(n * 100)
/** The value of a labelled row, found by its label. The stock page grew a
 *  "The token itself" card above the position, so "the first .kv in the side
 *  column" started reading Liquidity — a number this suite then reported as
 *  the holding, unchanged, twice, without failing. */
const rowValue = async (label) =>
  ((await page.locator('.kv', { hasText: label }).first().locator('span').last().textContent()) ?? '').trim()
/** The wallet's cash, once its figure has stopped counting towards it. */
const wallet = async () => {
  await page.goto(B + '/transfer', { waitUntil: 'networkidle' })
  return money(await settled(page, '.hero-figure'))
}
const type = async (amount) => {
  await page.locator('.amount-box input').fill(String(amount))
  await page.locator('.amount-box input').blur()
  await page.waitForTimeout(120)
}

// Out of the way of the limits, so an amount typed is the amount moved.
await verify(page)

/* ---- flow 1: borrow, end to end, and check the money actually moved ---- */
console.log('FLOW 1  Borrow & Lend → Borrow → review → confirm → receipt')
const BORROW = 600
const cash0 = await wallet()
await page.goto(B + '/grow', { waitUntil: 'networkidle' })
// The card's button opens the position rather than the composer (11g.43):
// somebody with an open loan came to look at it, not to take another one. So
// the journey is one step longer, and the step is part of what is being
// checked — this is the walk a person actually takes.
await page.getByText('See your borrowing', { exact: true }).first().click()
await page.waitForTimeout(140)
check('the card opens the position', page.url().includes('/grow/borrowing'), page.url().split('#')[1])
await page.getByText('Borrow more', { exact: true }).first().click()
await page.waitForTimeout(140)
check('and the position opens the composer', page.url().includes('/grow/borrow'), page.url().split('#')[1])
await type(BORROW)
const borrowLabel = await text('.card .btn-primary')
check('the button says the amount typed', borrowLabel === 'Borrow $600.00', borrowLabel)
await page.locator('.card .btn-primary').click()
await page.waitForTimeout(600)
const reviewed = await text('.figure .t-display-xl')
check('the review states the same amount', money(reviewed) === BORROW, reviewed)
await page.locator('.sheet .btn-primary').click()
await page.waitForTimeout(600)
const borrowed = await text('.sheet .t-title')
check('the outcome says it is borrowed', borrowed === 'Borrowed', borrowed + ' — ' + (await text('.sheet .figure .muted')))
await page.locator('.sheet .btn-secondary').click() // See the record
await page.waitForTimeout(250)
// In place: the record opens over the screen you were on rather than
// navigating you to Activity to read it.
check('the record opens over the screen you were on',
  page.url().includes('/grow/borrow') && (await text('.sheet-head h2')) === 'Receipt',
  page.url().split('#')[1].split('?')[0] + ', ' + (await text('.sheet-head h2')))
await page.keyboard.press('Escape')
await page.waitForTimeout(150)
const cash1 = await wallet()
check(`the wallet went up by $${BORROW}`, cents(cash1 - cash0) === cents(BORROW), `${cash0} → ${cash1}`)

/* ---- flow 2: repay it back ---- */
console.log('\nFLOW 2  Borrow & Lend → Repay → confirm')
await page.goto(B + '/grow/repay', { waitUntil: 'networkidle' })
await type(BORROW)
const repayLabel = await text('.card .btn-primary')
check('the button says the amount typed', money(repayLabel) === BORROW, repayLabel)
await page.locator('.card .btn-primary').click()
await page.waitForTimeout(600)
await page.locator('.sheet .btn-primary').click()
await page.waitForTimeout(600)
const repaid = await text('.sheet .t-title')
check('the outcome says it is repaid', repaid === 'Repaid', repaid + ' — ' + (await text('.sheet .figure .muted')))
await page.keyboard.press('Escape')
const cash2 = await wallet()
check(`the wallet went down by $${BORROW}`, cents(cash1 - cash2) === cents(BORROW), `${cash1} → ${cash2}`)

/* ---- flow 3: buy a stock and see the holding change ---- */
console.log('\nFLOW 3  Market → Apple → Invest → confirm')
const BUY = 250
await page.goto(B + '/invest/aapl', { waitUntil: 'networkidle' })
const held0 = money(await rowValue('You hold'))
await page.getByText('Buy AAPLc', { exact: true }).first().click()
await page.waitForTimeout(140)
await type(BUY)
const buyLabel = await text('.card .btn-primary')
check('the button says the amount typed', money(buyLabel) === BUY, buyLabel)
await page.locator('.card .btn-primary').click()
await page.waitForTimeout(600)
await page.locator('.sheet .btn-primary').click()
await page.waitForTimeout(600)
const bought = await text('.sheet .t-title')
const said = await text('.sheet .figure .muted')
check('the outcome says it is bought', bought === 'Bought', bought + ' — ' + said)
const got = money((said.match(/([\d.]+) shares/) ?? [])[1])
await page.keyboard.press('Escape')
await page.goto(B + '/invest/aapl', { waitUntil: 'networkidle' })
const held1 = money(await rowValue('You hold'))
check('the holding grew by the shares the outcome named',
  got > 0 && Math.abs(held1 - held0 - got) < 0.00015, `${held0} + ${got} → ${held1}`)
const cash3 = await wallet()
// A purchase carries its fee on top (fees.mjs checks the rate), so the wallet
// pays at least the amount and not much over it.
check(`the wallet paid $${BUY} and its fee`,
  cash2 - cash3 >= BUY && cash2 - cash3 < BUY * 1.02, `${cash2} → ${cash3}`)

/* ---- flow 4: the sheets that are not flows ---- */
console.log('\nFLOW 4  sheets reachable from a click')
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
  await page.goto(B + start, { waitUntil: 'networkidle' })
  await page.getByText(label, { exact: true }).first().click()
  await page.waitForTimeout(180)
  const got = await text('.sheet-head h2')
  check(`${start} "${label}" opens ${expect}`, got === expect, got)
  await page.keyboard.press('Escape')
}

/* ---- flow 5: every nav place, and the deepest link on each ---- */
console.log('\nFLOW 5  the rail')
for (const [place, route] of [['Home', '/'], ['Wallet', '/transfer'], ['Invest', '/invest'],
  ['Borrow & Lend', '/grow'], ['Activity', '/activity'], ['Account', '/account']]) {
  await page.goto(B + '/', { waitUntil: 'networkidle' })
  await page.locator('.nav-row', { hasText: place }).first().click()
  await page.waitForTimeout(180)
  const lit = ((await page.locator('.nav-row[aria-current="page"]').first().textContent()) ?? '').trim()
  const at = page.url().split('#')[1]
  check(`${place} goes to ${route} and lights itself`, at === route && lit === place, `${at}, lit: ${lit}`)
}

check('no page errors', !errs.length, errs.join(' | '))
await teardown(browser)
