/* Handing a share to another person.

   The rule this suite exists to hold: a share can go to a verified Tokkenly
   account and to nobody else. The refusal was built before the transfer, so it
   is tested first — a refusal nobody can reach is a refusal nobody has
   tested, which is why two of the four people in the list have no account. */
import { chromium } from 'playwright'
import { seen, verify, settled } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const page = async (w = 1440, h = 1024) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(6000)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return p
}
const at = async (p, r) => {
  await p.goto(B + r, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(400)
}
const money = (s) => Number(String(s).replace(/[^0-9.]/g, '')) || 0
const holdingOf = (p) => p.evaluate(() =>
  [...document.querySelectorAll('.kv')].find((e) => /^You hold/.test(e.textContent))?.textContent ?? '')

console.log('IT STARTS ON THE HOLDING')
{
  const p = await page()
  await at(p, '/invest/aapl')
  const btns = await p.evaluate(() => [...document.querySelectorAll('.col-side .btn')].map((e) => e.textContent))
  ok('the action sits beside Buy and Sell, on the position it moves',
     btns.join(' | ') === 'Buy AAPL | Sell AAPL | Send AAPL to someone', btns.join(' | '))
  // MSFT is on the watchlist and not held.
  await at(p, '/invest/msft')
  ok('and is not offered on a company you do not hold',
     !(await p.evaluate(() => document.body.innerText)).includes('Send MSFT to someone'))
  await at(p, '/invest/msft/send')
  ok('the address still answers, with the thing you would have to do first',
     /do not hold any MSFT/i.test(await p.evaluate(() => document.body.innerText)) &&
     (await p.getByRole('button', { name: 'Buy MSFT' }).count()) === 1)
  await p.close()
}

console.log('WHO CAN RECEIVE ONE, AND WHO CANNOT')
{
  const p = await page()
  await at(p, '/invest/aapl/send')
  const cols = await p.evaluate(() => [...document.querySelectorAll('.stack.grow .card')].map((c) => ({
    head: c.querySelector('h2')?.textContent,
    names: [...c.querySelectorAll('.sheet-row .t-body-strong')].map((e) => e.textContent),
  })))
  ok('the people who can are listed', cols[0]?.names.length === 2, JSON.stringify(cols[0]))
  ok('and the people who cannot are listed too, not hidden',
     cols[1]?.names.length === 2 && /Not on Tokkenly/i.test(cols[1].head ?? ''), JSON.stringify(cols[1]))
  ok('a row that cannot receive says so before it is pressed',
     (await p.locator('.stack.grow .pill.warn').count()) === 2)
  await p.close()
}

console.log('THE REFUSAL  built first, because it is the part that has to be right')
{
  const p = await page()
  await at(p, '/invest/aapl')
  const before = await holdingOf(p)
  await at(p, '/invest/aapl/send?to=Chidi%20Nwosu')
  const said = await p.evaluate(() => document.querySelector('.col-compose')?.innerText.replace(/\n/g, ' ') ?? '')
  ok('it names the person rather than failing quietly',
     /Chidi Nwosu does not hold a Tokkenly account/.test(said), said.slice(0, 60))
  ok('and says why, in the product’s own terms',
     /security, not a payment/.test(said))
  ok('there is no amount to type', (await p.locator('.amount-box').count()) === 0)
  ok('and the way out is the same gift as cash',
     (await p.getByRole('button', { name: /Send Chidi cash instead/ }).count()) === 1)
  await p.getByRole('button', { name: /Send Chidi cash instead/ }).click()
  await p.waitForTimeout(400)
  ok('which goes to Send money, with them already in it',
     decodeURIComponent(await p.evaluate(() => location.hash)) === '#/send?to=Chidi Nwosu',
     decodeURIComponent(await p.evaluate(() => location.hash)))
  await at(p, '/invest/aapl')
  ok('and nothing left the holding on the way', (await holdingOf(p)) === before, before)
  await p.close()
}

console.log('SENDING ONE')
{
  const p = await page()
  await at(p, '/transfer')
  const cashBefore = money(await settled(p, '.hero-figure'))
  await at(p, '/invest/aapl/send?to=Tunde%20Bakare')
  const summary = await p.evaluate(() => document.querySelector('.summary')?.innerText.replace(/\n/g, ' · ') ?? '')
  ok('it opens at one share, and says what that is in shares',
     /They receive · 1.00 AAPL/.test(summary), summary.slice(0, 60))
  ok('with no fee on either side', /Fee · None, either side/.test(summary))
  ok('and what you are left holding', /You keep · 22.42 AAPL/.test(summary), summary)
  ok('the button names what goes, not what it is worth',
     (await p.locator('.col-compose .btn-primary').textContent()) === 'Send 1.00 AAPL')
  await p.locator('.col-compose .btn-primary').click(); await p.waitForTimeout(500)
  const rev = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' · ') ?? '')
  ok('the review states the shares, the company and the price',
     /1.00 AAPL/.test(rev) && /Apple/.test(rev) && /\$224.10 a share/.test(rev), rev.slice(0, 80))
  ok('and warns that it cannot be recalled', /cannot be recalled/.test(rev))
  await p.locator('.scrim .btn-primary').click(); await p.waitForTimeout(900)
  ok('the outcome says who holds them now',
     /1.00 AAPL now belong to Tunde Bakare/.test(
       await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' ') ?? '')))
  await p.getByRole('button', { name: 'See the record' }).click(); await p.waitForTimeout(700)
  const rec = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' · ') ?? '')
  // The receipt for a share that moved is a receipt about the share, not a
  // line of dollars with a name beside it.
  ok('the receipt names the company it was about',
     /AAPL · Apple/.test(rec) && /SHARES · 1.00 AAPL/.test(rec), rec.slice(0, 120))
  ok('and states the price it went at, not the price now',
     /PRICE EACH · \$224.10/.test(rec) && /WORTH THEN/.test(rec))
  ok('and that it is gone', /cannot be recalled/.test(rec))
  ok('it opened in place, on the screen the send was made from',
     (await p.evaluate(() => location.hash)).startsWith('#/invest/aapl/send'),
     await p.evaluate(() => location.hash))
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  await at(p, '/invest/aapl')
  ok('the holding fell by exactly what was sent',
     (await holdingOf(p)).includes('22.42'), await holdingOf(p))
  // The whole difference between this and selling.
  await at(p, '/transfer')
  ok('and the wallet did not move, because nothing was sold',
     Math.abs(money(await settled(p, '.hero-figure')) - cashBefore) < 0.005,
     `${cashBefore} → ${money(await settled(p, '.hero-figure'))}`)
  await at(p, '/activity?filter=trades')
  const row = await p.evaluate(() => document.querySelector('.table tbody tr')?.innerText.replace(/\s+/g, ' ') ?? '')
  ok('the activity row says what moved, not just that something did',
     /Tunde Bakare/.test(row) && /Sent 1.00 AAPL/.test(row), row)
  await p.close()
}

console.log('ONE LIMIT POLICY FOR EVERY OUTFLOW  a share leaving is an outflow')
{
  const p = await page()
  await at(p, '/invest/aapl/send?to=Tunde%20Bakare')
  // Unverified: $250 a payment, and $5,248 of Apple in the account.
  ok('unverified, the ceiling is the limit and not the holding',
     /Up to \$250\.00/.test(await p.evaluate(() => document.querySelector('.hint')?.textContent ?? '')),
     await p.evaluate(() => document.querySelector('.hint')?.textContent))
  const i = p.locator('.amount-box input')
  await i.fill('4000'); await i.dispatchEvent('input'); await p.waitForTimeout(400)
  const why = await p.evaluate(() => {
    const e = document.querySelector('.field-error')
    return e && !e.hidden ? e.innerText.replace(/\n/g, ' ') : ''
  })
  ok('asking for more says which ceiling stopped it', /limit/i.test(why), why || 'nothing said')
  await verify(p)
  await at(p, '/invest/aapl/send?to=Tunde%20Bakare')
  ok('verifying raises it', /Up to \$2,500\.00/.test(
     await p.evaluate(() => document.querySelector('.hint')?.textContent ?? '')),
     await p.evaluate(() => document.querySelector('.hint')?.textContent))
  const chips = await p.evaluate(() => [...document.querySelectorAll('.col-compose .chip')].map((c) => c.textContent))
  // $5,248 of Apple against a $2,500 ceiling: "All" would be a lie.
  ok('and the last chip says which ceiling it reaches',
     chips[chips.length - 1] === 'The most', chips.join(' | '))
  await p.close()
}

console.log('THE PIN STANDS IN FRONT OF IT TOO')
{
  const p = await page()
  await verify(p)
  await at(p, '/invest/tsla/send?to=Tunde%20Bakare')
  await p.locator('.col-compose .chip', { hasText: 'All' }).click(); await p.waitForTimeout(350)
  await p.locator('.col-compose .btn-primary').click(); await p.waitForTimeout(500)
  ok('over the ask-again figure, the PIN comes first',
     (await p.locator('.scrim .pinpad').count()) === 1)
  for (const d of ['4', '1', '9', '3']) {
    await p.locator('.pin-keypad .key', { hasText: new RegExp('^' + d + '$') }).first().click()
    await p.waitForTimeout(120)
  }
  await p.waitForTimeout(500)
  await p.locator('.scrim .btn-primary').click(); await p.waitForTimeout(1000)
  ok('and the whole holding can go', /4.80 TSLA now belong to/.test(
     await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' ') ?? '')))
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  await at(p, '/invest/tsla')
  ok('leaving no position behind, and no way to send from it',
     /You do not own any yet/.test(await p.evaluate(() => document.body.innerText)) &&
     !(await p.evaluate(() => document.body.innerText)).includes('Send TSLA to someone'))
  await p.close()
}

console.log('PHONE  who first, then how much, as a sheet')
{
  const m = await page(390, 844)
  await at(m, '/invest/aapl/send')
  ok('who comes first, as a screen', (await m.locator('.scrim').count()) === 0 &&
     (await m.locator('.sheet-row').count()) === 4)
  await m.locator('.sheet-row', { hasText: 'Tunde' }).click(); await m.waitForTimeout(500)
  ok('then the amount, as a sheet with a keypad',
     (await m.locator('.scrim .sheet').count()) === 1 && (await m.locator('.keypad').count()) === 1)
  await at(m, '/invest/aapl/send?to=Ngozi%20Eze')
  ok('and the refusal carries the way back to the list',
     (await m.getByRole('button', { name: /Choose somebody else/ }).count()) === 1)
  ok('nothing overflows',
     (await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0)
  await m.close()
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
