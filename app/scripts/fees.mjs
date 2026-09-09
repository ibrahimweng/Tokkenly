/* "Every transaction shows the amount, the rate, the fee, and exactly what you
   receive, before you confirm." That is a promise about arithmetic, so it is
   checked as arithmetic: what the review says must be what the ledger does. */
import { chromium } from 'playwright'
import { seen, verify, settled } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1024 } })
await seen(p)
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(6000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
/* the first figure in a string: "$0.50 · 0.5%" is fifty cents, not 0.500.5 */
const money = (s) => Number((String(s ?? '').match(/[\d,]+\.?\d*/) ?? ['0'])[0].replace(/,/g, '')) || 0
const cash = async () => {
  await p.goto(B + '/transfer', { waitUntil: 'domcontentloaded' })
  return money(await settled(p, '.hero-figure'))
}
/* the review panel renders each row as .cell with a caps label over a value,
   and the label is uppercased by CSS, so match on the text the DOM holds */
const rows = () => p.evaluate(() =>
  Object.fromEntries([...document.querySelectorAll('.scrim .panel .cell')]
    .map((e) => [...e.children].map((c) => c.textContent.trim()))
    .filter((x) => x.length >= 2).map(([k, v]) => [k, v])))

// out of the way of the limits, so the ceiling under test is the one meant
await verify(p)

console.log('BUYING  the amount, the fee, the total, and what you receive')
const before = await cash()
await p.goto(B + '/invest/nvda/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const i = p.locator('.amount-box input')
await i.fill('50'); await i.dispatchEvent('input'); await p.waitForTimeout(250)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(450)
const r = await rows()
ok('the investment is stated', money(r['Investment']) === 50, JSON.stringify(r['Investment']))
ok('the fee is stated, with its rate', /0\.5%/.test(r['Fee'] ?? ''), r['Fee'] ?? 'missing')
ok('the fee is the rate applied to the amount', money(r['Fee']) === 0.25, r['Fee'] ?? '')
ok('the total is amount plus fee', money(r['Total']) === 50.25, r['Total'] ?? '')
// "0.4205 NVDAc" rather than "0.4205 shares of Nvidia": the review names the
// token you end up holding, which is the thing that arrives in the wallet.
ok('and what you receive is spelled out', /[\d.]+ [A-Z]+c$/.test(r['You receive'] ?? ''), r['You receive'] ?? '')
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
const after = await cash()
ok('the ledger charges the total, not the amount', Math.abs((before - after) - 50.25) < 0.01,
   `${before} → ${after}, expected −50.25`)

console.log('SELLING  the fee comes out of what you get')
await p.goto(B + '/invest/nvda/sell', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const j = p.locator('.amount-box input')
await j.fill('100'); await j.dispatchEvent('input'); await p.waitForTimeout(250)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(450)
const r2 = await rows()
ok('the sale is stated', money(r2['Sale']) === 100, r2['Sale'] ?? '')
ok('you receive the sale less the fee', money(r2['You receive']) === 99.5, r2['You receive'] ?? '')
const beforeSell = await cash()
await p.goto(B + '/invest/nvda/sell', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const k = p.locator('.amount-box input')
await k.fill('100'); await k.dispatchEvent('input'); await p.waitForTimeout(250)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(450)
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
const afterSell = await cash()
ok('and the wallet gets exactly that', Math.abs((afterSell - beforeSell) - 99.5) < 0.01,
   `${beforeSell} → ${afterSell}, expected +99.50`)

console.log('THE CEILING  the fee has to fit too')
await p.goto(B + '/invest/aapl/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const l = p.locator('.amount-box input')
await l.fill('999999'); await l.dispatchEvent('input'); await p.waitForTimeout(300)
const capped = await p.evaluate(() => ({
  action: document.querySelector('.btn-primary')?.textContent,
  said: document.querySelector('.field-error:not([hidden])')?.innerText.replace(/\n/g, ' '),
}))
const have = await (async () => { const c = await cash(); return c })()
ok('"all in" leaves room for the fee',
   money(capped.action) * 1.005 <= have + 0.02,
   `offers ${capped.action}, cash ${have}`)
// Whichever of the three ceilings binds, the message names that one and
// states its figure — that is the thing being checked, not which one it is.
ok('and the ceiling names itself, with its figure',
   /\$[\d,]+/.test(capped.said ?? '') && /(fee included|in one go|monthly limit|until you verify)/.test(capped.said ?? ''),
   capped.said ?? '')

console.log('NAIRA  no fee, and it says so rather than saying nothing')
await p.goto(B + '/addmoney', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(450)
const r3 = await rows()
ok('add money states a fee line', !!r3['Fee'], r3['Fee'] ?? 'missing')
// "No fee" rather than "None — the rate above is the rate you get": the row
// above already states the rate, so the fee row only has to answer its own
// question. What is being checked is that it answers it at all.
ok('and it is none, not silence', /No fee|None/.test(r3['Fee'] ?? ''), r3['Fee'] ?? '')
ok('with the rate on screen', !!r3['Rate'], r3['Rate'] ?? 'missing')

console.log('THE BUCKET  one payment, one fee')
await p.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.getByRole('button', { name: /Add .+ to your bucket/ }).click(); await p.waitForTimeout(400)
// Alphabet rather than Coca-Cola: this is about one fee on a basket, and a
// company outside the launch set can no longer be put in one (11g.57).
await p.goto(B + '/invest/googl', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.getByRole('button', { name: /Add .+ to your bucket/ }).click(); await p.waitForTimeout(400)
await p.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const sum = await p.evaluate(() => Object.fromEntries(
  [...document.querySelectorAll('.kv')].map((e) => [...e.children].map((c) => c.textContent.trim()))
    .filter((x) => x.length >= 2)))
ok('the bucket charges one fee on the whole thing', money(sum['Fee']) === 0.5,
   `investment ${sum['Investment']}, fee ${sum['Fee']}, total ${sum['Total']}`)
const cashBefore = await cash()
await p.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(450)
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(1000)
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
const cashAfterB = await cash()
ok('and the ledger agrees', Math.abs((cashBefore - cashAfterB) - 100.5) < 0.02,
   `${cashBefore} → ${cashAfterB}, expected −100.50`)

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
