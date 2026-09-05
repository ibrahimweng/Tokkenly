/* A preference that changes nothing is a preference that lies. Every switch in
   Account is followed to the thing it claims to change. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } })
await seen(p)
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(6000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
const acct = async () => { await p.goto(B + '/account', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400) }
const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400) }
const text = () => p.evaluate(() => document.body.innerText)

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
await at('/market')
ok('the theme survives leaving the screen',
   (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light')
await acct()
await p.getByRole('button', { name: 'Dark', exact: true }).click(); await p.waitForTimeout(300)

console.log('NAIRA BESIDE DOLLARS')
await at('/wallet')
ok('the aside is there by default', /indicative rate/.test(await text()))
await acct()
await p.getByRole('button', { name: /Show naira beside dollars/ }).click(); await p.waitForTimeout(300)
await at('/wallet')
ok('turning it off removes it', !/indicative rate/.test(await text()))
await at('/convert')
ok('but Convert still shows naira, because that is what it is about',
   /₦/.test(await text()))
await acct()
await p.getByRole('button', { name: /Show naira beside dollars/ }).click(); await p.waitForTimeout(300)

console.log('NOTIFICATIONS')
await at('/')
const before = await p.evaluate(() => document.querySelector('.bell .dot')?.textContent ?? '0')
await acct()
await p.getByRole('button', { name: /Money landing/ }).click(); await p.waitForTimeout(300)
await at('/')
const after = await p.evaluate(() => document.querySelector('.bell .dot')?.textContent ?? '0')
ok('turning one off changes what reaches you', before !== after, `${before} → ${after}`)
await p.locator('.bell').click(); await p.waitForTimeout(400)
ok('and the panel agrees with the bell',
   !/Received|payment/i.test(await p.evaluate(() => document.querySelector('.scrim')?.innerText ?? '')),
   (await p.evaluate(() => document.querySelector('.scrim')?.innerText?.replace(/\n/g, ' ').slice(0, 60) ?? '')))
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
await acct()
await p.getByRole('button', { name: /Money landing/ }).click(); await p.waitForTimeout(300)

console.log('ASK AGAIN ABOVE')
await at('/market/aapl/invest')
let i = p.locator('.amount-box input')
await i.fill('100'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
ok('under the figure, nothing extra to do',
   await p.evaluate(() => !document.querySelector('.agree') && !document.querySelector('.scrim .btn-primary')?.hasAttribute('disabled')))
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
await at('/market/aapl/invest')
i = p.locator('.amount-box input')
await i.fill('900'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
const big = await p.evaluate(() => ({
  tick: !!document.querySelector('.agree'),
  blocked: document.querySelector('.scrim .btn-primary')?.hasAttribute('disabled'),
  says: document.querySelector('.agree')?.innerText.replace(/\n/g, ' '),
}))
ok('over it, the button waits', big.tick && big.blocked === true, big.says ?? 'no tick')
await p.locator('.agree').click(); await p.waitForTimeout(300)
ok('and the tick releases it',
   (await p.evaluate(() => document.querySelector('.scrim .btn-primary')?.hasAttribute('disabled'))) === false)
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
await acct()
await p.getByRole('button', { name: 'Never', exact: true }).click(); await p.waitForTimeout(300)
await at('/market/aapl/invest')
i = p.locator('.amount-box input')
await i.fill('2000'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
ok('and "Never" means never', await p.evaluate(() => !document.querySelector('.agree')))

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
