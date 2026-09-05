import { chromium } from 'playwright'
const base = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
const errs = []
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
const log = []
const text = async (s) => (await p.locator(s).first().textContent().catch(() => '')) ?? ''

log.push('FLOW  Grow → Borrow with the keypad → review → confirm → History')
await p.goto(base + '/wallet', { waitUntil: 'networkidle' })
log.push('  wallet before: ' + (await text('.card .t-display-xl')).trim())

await p.goto(base + '/grow', { waitUntil: 'networkidle' })
await p.getByText('Borrow money', { exact: true }).first().click()
await p.waitForTimeout(200)
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
await p.goto(base + '/wallet', { waitUntil: 'networkidle' })
log.push('  wallet after:  ' + (await text('.card .t-display-xl')).trim())

log.push('')
log.push('RAIL  four tabs and More')
await p.goto(base + '/', { waitUntil: 'networkidle' })
log.push('  tabs: ' + (await p.locator('.rail-tab').count()) + ', more button: ' + (await p.locator('.rail-more').count()))
await p.locator('.rail-more').click()
await p.waitForTimeout(200)
const rows = await p.locator('.sheet-row .t-body-strong').allTextContents()
log.push('  More reveals: ' + rows.join(', '))
await p.locator('.sheet-row', { hasText: 'Security' }).click()
await p.waitForTimeout(220)
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
