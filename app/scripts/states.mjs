/* Every state the product claims to have, exercised in a real browser.
   Figma 02 Components: Button, Icon button, Text field, Empty state, Toast. */
import { chromium } from 'playwright'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errors = []
const page = await b.newPage({ viewport: { width: 1440, height: 1024 } })
page.on('pageerror', (e) => errors.push(String(e)))

const bg = (h) => page.evaluate((el) => getComputedStyle(el).backgroundColor, h)
const go = async (r, w = 1440) => {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(B + r, { waitUntil: 'networkidle' })
  await page.waitForTimeout(150)
}
const ok = (label, pass, detail = '') =>
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)

console.log('HOVER')
await go('/')
const filled = page.locator('.btn-filled').first()
const rest = await bg(await filled.elementHandle())
await filled.hover(); await page.waitForTimeout(80)
const hov = await bg(await filled.elementHandle())
ok('filled button changes on hover', rest !== hov, `${rest} → ${hov}`)
ok('hover is the token, not a hex', hov === 'rgb(236, 236, 237)', hov)

console.log('FOCUS')
await page.keyboard.press('Tab')
const outline = await page.evaluate(() => {
  const el = document.activeElement
  const s = getComputedStyle(el)
  return { tag: el.tagName.toLowerCase(), width: s.outlineWidth, color: s.outlineColor }
})
ok('keyboard focus draws a ring', outline.width === '2px', JSON.stringify(outline))

console.log('PRESSED')
const box = await filled.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down(); await page.waitForTimeout(60)
const pressedOpacity = await page.evaluate(
  (el) => getComputedStyle(el).opacity, await filled.elementHandle())
await page.mouse.up()
ok('pressing sinks the button', pressedOpacity === '0.88', pressedOpacity)

console.log('DISABLED')
await go('/grow/borrow')
await page.locator('.amount-box input').fill('0')
await page.locator('.amount-box input').dispatchEvent('input')
await page.waitForTimeout(120)
const dis = await page.evaluate(() => {
  const el = document.querySelector('.card .btn-filled')
  const s = getComputedStyle(el)
  return { disabled: el.hasAttribute('disabled'), opacity: s.opacity, pe: s.pointerEvents }
})
ok('a zero amount disables the action', dis.disabled && dis.opacity === '0.4' && dis.pe === 'none',
   JSON.stringify(dis))

console.log('LOADING')
await go('/grow/borrow?sheet=borrow-review&v=500')
await page.locator('.sheet .btn-filled').click()
await page.waitForTimeout(80)
const busy = await page.locator('.sheet .btn-filled.is-busy').count()
ok('confirming shows a spinner', busy === 1, `is-busy nodes: ${busy}`)
await page.waitForTimeout(700)
const outcomeTitle = await page.locator('.sheet .figure .t-title').first().textContent()
ok('and then the outcome arrives', /Borrowed/.test(outcomeTitle ?? ''), outcomeTitle ?? '')

console.log('EMPTY')
for (const [route, expect] of [
  ['/history?q=zzzzz', 'Nothing matches that'],
  ['/market?q=zzzzz', 'Nothing matches that'],
  ['/support?q=zzzzz', 'Nothing matches that'],
]) {
  await go(route)
  const t = await page.locator('.empty h3').first().textContent().catch(() => null)
  ok(route, t === expect, t ?? 'no empty state')
}
await go('/history?q=zzzzz')
await page.locator('.empty .btn').click(); await page.waitForTimeout(150)
ok('the empty state clears the search', page.url().endsWith('#/history'), page.url().split('#')[1])

console.log('EMPTY, on a phone')
await go('/send?q=zzzzz', 390)
const t2 = await page.locator('.empty h3').first().textContent().catch(() => null)
ok('the picker search finds nobody', t2 === 'Nobody by that name', t2 ?? 'no empty state')
await go('/send?q=tunde', 390)
const n = await page.locator('.sheet-row').count()
ok('the picker search filters', n === 1, `${n} row(s)`)

console.log('ERROR')
await go('/send', 390)
await page.locator('input[placeholder="Paste a Base address"]').fill('0x12')
await page.locator('.btn-quiet', { hasText: 'Continue' }).click()
await page.waitForTimeout(120)
const err = await page.evaluate(() => {
  const f = document.querySelector('.field.error')
  const m = document.querySelector('.field-error')
  return { ringed: !!f, message: m && !m.hidden ? m.textContent.trim() : null }
})
ok('a bad address is marked where it was typed', err.ringed && !!err.message, JSON.stringify(err))
await page.locator('input[placeholder="Paste a Base address"]').fill('0x22b1A7c04fa0')
await page.waitForTimeout(100)
const cleared = await page.locator('.field.error').count()
ok('and the error clears as you fix it', cleared === 0, `${cleared} ringed`)

console.log('\nERRORS: ' + (errors.length ? errors.join(' | ') : 'none'))
await b.close()
