import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const base = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
await seen(p)
const errs = []
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
const log = []
const text = async (s) => (await p.locator(s).first().textContent().catch(() => '')) ?? ''

log.push('FLOW  Borrow & Lend → Borrow with the keypad → review → confirm → History')
await p.goto(base + '/transfer', { waitUntil: 'networkidle' })
log.push('  wallet before: ' + (await text('.card .t-display-xl')).trim())

await p.goto(base + '/grow', { waitUntil: 'networkidle' })
await p.getByText('See your borrowing', { exact: true }).first().click()
await p.waitForTimeout(250)
// One more step since 11g.43: the card opens the position, and the position is
// where you borrow more.
await p.getByText('Borrow more', { exact: true }).first().click()
await p.waitForTimeout(250)
log.push('  sheet opened: ' + (await text('.sheet-head h2')).trim())

// clear then type 750 on the keypad
for (let i = 0; i < 10; i++) await p.locator('.key[aria-label="Delete"]').click()
for (const d of ['7', '5', '0', '0', '0']) await p.getByRole('button', { name: d, exact: true }).first().click()
await p.waitForTimeout(120)
log.push('  keypad typed: ' + (await p.locator('.amount-box input').inputValue()))
log.push('  button says:  ' + (await text('.sheet .btn-primary')).trim())

await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(600)
log.push('  review:  ' + (await text('.sheet-head h2')).trim() + ' / ' + (await text('.sheet .figure .t-display-xl')).trim())
const reviewFits = await p.evaluate(() => {
  const btn = document.querySelector('.sheet .btn-primary')
  const r = btn.getBoundingClientRect()
  return r.bottom <= window.innerHeight + 1
})
log.push('  review button on screen: ' + reviewFits)

await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(600)
log.push('  outcome: ' + (await text('.sheet .t-title')).trim() + ' — ' + (await text('.sheet .figure .muted')).trim())
await p.locator('.sheet .btn-secondary').click()
await p.waitForTimeout(250)
log.push('  landed:  ' + p.url().split('#')[1].split('?')[0] + ' with ' + (await text('.sheet-head h2')).trim())
await p.keyboard.press('Escape')
await p.goto(base + '/transfer', { waitUntil: 'networkidle' })
log.push('  wallet after:  ' + (await text('.card .t-display-xl')).trim())

log.push('')
log.push('RAIL  four tabs, and the capsule that becomes the rest')
await p.goto(base + '/', { waitUntil: 'networkidle' })
log.push('  tabs: ' + (await p.locator('.rail-tab').count()) + ', more button: ' + (await p.locator('.rail-more').count()))
// It is not a sheet down here any more (11g.54). The capsule itself becomes
// the list, in place, and the button that opened it stays where the thumb
// left it and turns into the way out.
await p.locator('.rail-more').click()
await p.waitForTimeout(300)
log.push('  the capsule is gone: ' + !(await p.locator('.rail-pill').isVisible()) +
         ', no dialog over the screen: ' + ((await p.locator('.scrim').count()) === 0))
const rows = await p.locator('.rail-cell-label').allTextContents()
log.push('  it reveals: ' + rows.join(', '))
await p.locator('.rail-cell', { hasText: 'Security' }).click()
await p.waitForTimeout(260)
log.push('  tapped Security → ' + p.url().split('#')[1] + ', title ' + (await text('.page-header h1')).trim())

log.push('')
log.push('BREAKPOINT  the same route at both widths')
for (const w of [1440, 390]) {
  await p.setViewportSize({ width: w, height: 900 })
  await p.goto(base + '/grow', { waitUntil: 'networkidle' })
  await p.waitForTimeout(200)
  const shape = await p.evaluate(() => ({
    sidebar: !!document.querySelector('.sidebar') && getComputedStyle(document.querySelector('.sidebar')).display !== 'none',
    rail: !!document.querySelector('.railbar') && getComputedStyle(document.querySelector('.railbar')).display !== 'none',
  }))
  log.push(`  ${w}px → sidebar ${shape.sidebar}, floating rail ${shape.rail}`)
}
console.log(log.join('\n'))
console.log('\nERRORS: ' + (errs.length ? errs.join('\n') : 'none'))
await b.close()
