/* A preference that changes nothing is a preference that lies. Every switch in
   Account is followed to the thing it claims to change. */
import { chromium } from 'playwright'
import { seen, verify } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } })
await seen(p)
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(6000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
// Every control lives in its own group now, so a helper per group rather
// than one /account that held all twenty-five.
const group = async (g) => { await p.goto(B + '/account/' + g, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400) }
const acct = () => group('preferences')
const notifs = () => group('notifications')
const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400) }
const text = () => p.evaluate(() => document.body.innerText)

// out of the way of the limits, so the ceiling under test is the one meant
await verify(p)

console.log('IT REMEMBERS')
await acct()
await p.getByRole('button', { name: 'Detailed', exact: true }).click(); await p.waitForTimeout(300)
await at('/')
ok('home screen follows the setting', /PORTFOLIO OVER TIME/i.test(await text()), 'detailed')
await acct()
await p.getByRole('button', { name: 'Simple', exact: true }).click(); await p.waitForTimeout(300)
await at('/')
ok('and back again', /Buy Stocks/.test(await text()), 'simple')

console.log('THEME')
await acct()
await p.getByRole('button', { name: 'Light', exact: true }).click(); await p.waitForTimeout(300)
await at('/invest')
ok('the theme survives leaving the screen',
   (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light')
await acct()
await p.getByRole('button', { name: 'Dark', exact: true }).click(); await p.waitForTimeout(300)

console.log('NAIRA BESIDE DOLLARS')
await at('/transfer')
ok('naira is there by default', /About \u20a6[\d,]+/.test(await text()))
await acct()
await p.getByRole('button', { name: /Show naira beside dollars/ }).click(); await p.waitForTimeout(300)
await at('/transfer')
ok('turning it off removes it', !/About \u20a6[\d,]+/.test(await text()))
await at('/withdraw')
ok('but Convert still shows naira, because that is what it is about',
   /₦/.test(await text()))
await acct()
await p.getByRole('button', { name: /Show naira beside dollars/ }).click(); await p.waitForTimeout(300)

console.log('NOTIFICATIONS')
await at('/')
const before = await p.evaluate(() => document.querySelector('.bell .dot')?.textContent ?? '0')
await notifs()
await p.getByRole('button', { name: /Money landing/ }).click(); await p.waitForTimeout(300)
await at('/')
const after = await p.evaluate(() => document.querySelector('.bell .dot')?.textContent ?? '0')
ok('turning one off changes what reaches you', before !== after, `${before} → ${after}`)
await p.locator('.bell').click(); await p.waitForTimeout(400)
ok('and the panel agrees with the bell',
   !/Received|payment/i.test(await p.evaluate(() => document.querySelector('.scrim')?.innerText ?? '')),
   (await p.evaluate(() => document.querySelector('.scrim')?.innerText?.replace(/\n/g, ' ').slice(0, 60) ?? '')))
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
await notifs()
await p.getByRole('button', { name: /Money landing/ }).click(); await p.waitForTimeout(300)

console.log('ASK FOR THE PIN ABOVE')
await at('/invest/aapl/invest')
let i = p.locator('.amount-box input')
await i.fill('100'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
ok('under the figure, nothing extra to do',
   await p.evaluate(() => !document.querySelector('.pinpad') && !!document.querySelector('.scrim .btn-primary')))
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
await at('/invest/aapl/invest')
i = p.locator('.amount-box input')
await i.fill('900'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
const big = await p.evaluate(() => ({
  pad: !!document.querySelector('.pinpad'),
  button: !!document.querySelector('.scrim .btn-primary'),
  says: document.querySelector('.pin-note')?.textContent ?? '',
}))
// A tickbox proves nothing about who is holding the phone, so above the
// figure there is no button to press at all until four digits arrive.
ok('over it, the PIN stands where the button was',
   big.pad && !big.button, big.says || 'no pad')
const tap = (d) => p.locator('.pin-keypad .key', { hasText: new RegExp('^' + d + '$') }).first().click()
for (const d of ['9', '9', '9', '9']) await tap(d)
await p.waitForTimeout(400)
ok('a wrong PIN says how many tries are left',
   /tries left/.test(await p.evaluate(() => document.querySelector('.pin-note')?.textContent ?? '')),
   await p.evaluate(() => document.querySelector('.pin-note')?.textContent ?? ''))
for (const d of ['4', '1', '9', '3']) await tap(d)
await p.waitForTimeout(400)
ok('and the right one hands back the button that names the amount',
   /900/.test(await p.evaluate(() => document.querySelector('.scrim .btn-primary')?.textContent ?? '')),
   await p.evaluate(() => document.querySelector('.scrim .btn-primary')?.textContent ?? 'still gated'))
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
await acct()
await p.getByRole('button', { name: 'Never', exact: true }).click(); await p.waitForTimeout(300)
await at('/invest/aapl/invest')
i = p.locator('.amount-box input')
await i.fill('2000'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
ok('and "Never" means never', await p.evaluate(() => !document.querySelector('.agree')))

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
