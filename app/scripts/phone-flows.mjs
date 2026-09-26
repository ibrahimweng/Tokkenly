import { B, launch, check, teardown } from './lib/harness.mjs'
import { seen, settled, verify } from './lib/seen.mjs'
const b = await launch()
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
await seen(p)
const errs = []
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
const text = async (s) => ((await p.locator(s).first().textContent().catch(() => '')) ?? '').trim()
const money = (s) => Number((String(s ?? '').match(/-?[\d,]+\.?\d*/) ?? ['NaN'])[0].replace(/,/g, ''))
const wallet = async () => {
  await p.goto(B + '/transfer', { waitUntil: 'networkidle' })
  return money(await settled(p, '.hero-figure'))
}
// Out of the way of the limits: unverified, the single-payment ceiling turns
// the 750 typed below into 250, and this suite printed that as a pass.
await verify(p)

console.log('FLOW  Borrow & Lend → Borrow with the keypad → review → confirm → History')
const before = await wallet()

await p.goto(B + '/grow', { waitUntil: 'networkidle' })
await p.getByText('See your borrowing', { exact: true }).first().click()
await p.waitForTimeout(250)
// One more step since 11g.43: the card opens the position, and the position is
// where you borrow more.
await p.getByText('Borrow more', { exact: true }).first().click()
await p.waitForTimeout(250)
check('Borrow more opens the composer as a sheet', (await text('.sheet-head h2')) === 'Borrow', await text('.sheet-head h2'))

// clear then type 750 on the keypad
for (let i = 0; i < 10; i++) await p.locator('.key[aria-label="Delete"]').click()
for (const d of ['7', '5', '0', '0', '0']) await p.getByRole('button', { name: d, exact: true }).first().click()
await p.waitForTimeout(120)
const typed = await p.locator('.amount-box input').inputValue()
check('the keypad typed $750.00', money(typed) === 750, typed)
check('and the button says so', (await text('.sheet .btn-primary')) === 'Borrow $750.00', await text('.sheet .btn-primary'))

await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(600)
check('the review states $750.00',
  (await text('.sheet-head h2')) === 'Review' && money(await text('.sheet .figure .t-display-xl')) === 750,
  (await text('.sheet-head h2')) + ' / ' + (await text('.sheet .figure .t-display-xl')))
const reviewFits = await p.evaluate(() => {
  const btn = document.querySelector('.sheet .btn-primary')
  const r = btn.getBoundingClientRect()
  return r.bottom <= window.innerHeight + 1
})
check('the review button is on screen', reviewFits)

await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(600)
check('the outcome says it is borrowed', (await text('.sheet .t-title')) === 'Borrowed',
  (await text('.sheet .t-title')) + ' — ' + (await text('.sheet .figure .muted')))
await p.locator('.sheet .btn-secondary').click()
await p.waitForTimeout(250)
check('See the record opens the receipt in place', (await text('.sheet-head h2')) === 'Receipt',
  p.url().split('#')[1].split('?')[0] + ' with ' + (await text('.sheet-head h2')))
await p.keyboard.press('Escape')
const after = await wallet()
check('the wallet went up by $750', Math.round((after - before) * 100) === 75000, `${before} → ${after}`)

console.log('\nRAIL  four tabs, and the capsule that becomes the rest')
await p.goto(B + '/', { waitUntil: 'networkidle' })
check('four tabs and a More button',
  (await p.locator('.rail-tab').count()) === 4 && (await p.locator('.rail-more').count()) === 1,
  `${await p.locator('.rail-tab').count()} tabs, ${await p.locator('.rail-more').count()} more`)
// It is not a sheet down here any more (11g.54). The capsule itself becomes
// the list, in place, and the button that opened it stays where the thumb
// left it and turns into the way out.
await p.locator('.rail-more').click()
await p.waitForTimeout(300)
check('More turns the capsule into the list, with no dialog over the screen',
  !(await p.locator('.rail-pill').isVisible()) && (await p.locator('.scrim').count()) === 0)
const rows = await p.locator('.rail-cell-label').allTextContents()
check('and the list has Security in it', rows.includes('Security'), rows.join(', '))
await p.locator('.rail-cell', { hasText: 'Security' }).click()
await p.waitForTimeout(260)
check('tapping Security goes there', p.url().split('#')[1] === '/security' && (await text('.page-header h1')) === 'Security',
  p.url().split('#')[1] + ', title ' + (await text('.page-header h1')))

console.log('\nBREAKPOINT  the same route at both widths')
for (const w of [1440, 390]) {
  await p.setViewportSize({ width: w, height: 900 })
  await p.goto(B + '/grow', { waitUntil: 'networkidle' })
  await p.waitForTimeout(200)
  const shape = await p.evaluate(() => ({
    sidebar: !!document.querySelector('.sidebar') && getComputedStyle(document.querySelector('.sidebar')).display !== 'none',
    rail: !!document.querySelector('.railbar') && getComputedStyle(document.querySelector('.railbar')).display !== 'none',
  }))
  const wide = w > 900
  check(`${w}px has the ${wide ? 'sidebar' : 'floating rail'} and not the other`,
    shape.sidebar === wide && shape.rail === !wide, JSON.stringify(shape))
}
check('no page errors', !errs.length, errs.join(' | '))
await teardown(b)
