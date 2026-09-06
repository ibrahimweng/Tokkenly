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

console.log('HIDE MY BALANCES  the switch, and where it sits')
{
  const MASK = '\u2022\u2022\u2022\u2022\u2022\u2022'
  // Every screen with a headline balance carries the switch, on the figure's
  // own line rather than in the header three hundred pixels away. Grow is the
  // reason this is a test: it masked a balance and offered no way to uncover
  // it short of four taps into Preferences.
  // The figure is whichever element the switch was paired with, which is the
  // point: the test cannot name one without naming the other.
  const sel = '.figure-eye > :first-child'
  for (const route of ['/', '/transfer', '/grow']) {
    await at(route)
    const where = await p.evaluate(() => {
      const e = document.querySelector('.eye-btn')
      if (!e) return null
      return { figure: !!e.closest('.figure-eye'), header: !!e.closest('.page-header'),
               n: document.querySelectorAll('.eye-btn').length }
    })
    ok(`${route} carries it, beside the figure`,
       !!where && where.figure && !where.header && where.n === 1,
       where ? `${where.n} eye, in ${where.figure ? 'the figure' : 'the header'}` : 'no eye')
    // and the button next to the number covers that number
    const read = () => p.evaluate((q) => document.querySelector(q)?.textContent ?? '', sel)
    const shown = await read()
    await p.locator('.eye-btn').first().click(); await p.waitForTimeout(350)
    const hidden = await read()
    await p.locator('.eye-btn').first().click(); await p.waitForTimeout(350)
    const back = await read()
    ok(`  and it covers the figure it sits on`,
       hidden === MASK && back === shown, `${shown} → ${hidden} → ${back}`)
  }
  // One switch, one setting: covering on Home covers everywhere.
  await at('/')
  await p.locator('.eye-btn').first().click(); await p.waitForTimeout(350)
  await at('/grow')
  ok('one switch, not one per screen',
     (await p.evaluate(() => document.querySelector('.hero-figure')?.textContent)) === MASK)
  ok('and it says which way it is pointing',
     (await p.evaluate(() => document.querySelector('.eye-btn')?.getAttribute('aria-pressed'))) === 'true')
  await p.locator('.eye-btn').first().click(); await p.waitForTimeout(350)
  // Preferences still has it, because a control found by accident once is a
  // control you cannot find again on purpose.
  await acct()
  ok('Preferences still holds it too',
     (await p.getByRole('button', { name: /Hide my balances/ }).count()) === 1)
}

console.log('NOTIFICATIONS')
await at('/')
const before = await p.evaluate(() => document.querySelector('.bell .dot')?.textContent ?? '0')
await notifs()
await p.getByRole('button', { name: /Money landing/ }).click(); await p.waitForTimeout(300)
await at('/')
const after = await p.evaluate(() => document.querySelector('.bell .dot')?.textContent ?? '0')
ok('turning one off changes what reaches you', before !== after, `${before} → ${after}`)
await p.locator('.bell').click(); await p.waitForTimeout(500)
ok('the bell goes to the section rather than floating a panel',
   (await p.evaluate(() => location.hash)) === '#/activity?filter=alerts' &&
   (await p.locator('.scrim').count()) === 0,
   await p.evaluate(() => location.hash))
// The two money ones. "paid you" would also catch Earn's daily interest,
// which is a grow notification and is meant to still be here.
ok('and the section agrees with the bell',
   !/Adaeze|Payroll/i.test(await p.evaluate(() => document.querySelector('.alert-list')?.innerText ?? '')),
   (await p.evaluate(() => document.querySelector('.alert-list')?.innerText?.replace(/\n/g, ' ').slice(0, 60) ?? '')))
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
