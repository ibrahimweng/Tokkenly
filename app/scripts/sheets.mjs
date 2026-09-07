/* How tall every dialog in the product is.

   Two of them used to be the tallest things in the app: the review where money
   is agreed to, and the receipt that is the record of it. Both scrolled on a
   phone, which on those two screens is the worst place in the product to put a
   line below a fold. The rule this holds: no dialog scrolls on a 390 x 844
   phone, and none of them is more than about four fifths of that screen. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)

const ROUTES = [
  ['/?sheet=jump', 'jump'], ['/?sheet=more', 'more'], ['/?sheet=card', 'card'],
  ['/?sheet=put-away&task=verify', 'put-away'], ['/?sheet=pick-who', 'pick-who'],
  ['/activity?sheet=receipt&ref=TKN-8E4J77', 'receipt of a trade'],
  ['/activity?sheet=receipt&ref=TKN-8F2K90', 'receipt of a payment'],
  ['/activity?sheet=export', 'export'],
  ['/account/support?sheet=contact', 'contact'],
  ['/account/details?sheet=edit&field=email', 'edit'],
  ['/account/security?sheet=pin', 'pin'],
  ['/account/security?sheet=password', 'password'],
  ['/account/security?sheet=phrase', 'phrase'],
  ['/account/legal?sheet=close', 'close'],
  ['/transfer?sheet=banks', 'banks'],
  ['/send?to=Tunde%20Bakare&sheet=send-review&v=120', 'send-review'],
  // The same review, on the rail that changes currency. It holds a rate and
  // states one, which the other two do not, so it is a different dialog in
  // everything but its name and has to be measured as one.
  ['/send?rail=bank&to=gt&sheet=send-review&v=200', 'send-review to a bank'],
  ['/addmoney?sheet=transfer-review&v=200', 'transfer-review'],
  ['/addmoney?via=card&sheet=card-review&v=200', 'card-review'],
  ['/addmoney?sheet=add-waiting&ref=TKN-6C9H77', 'add-waiting'],
  ['/transfer?sheet=cards', 'cards'],
  ['/invest/aapl/invest?sheet=invest-review&v=200&t=AAPL', 'invest-review'],
  ['/invest/aapl/sell?sheet=sell-review&v=200&t=AAPL', 'sell-review'],
  ['/invest/aapl/send?to=Tunde%20Bakare&sheet=shares-review&v=224.1&t=AAPL', 'shares-review'],
  ['/grow/borrow?sheet=borrow-review&v=300', 'borrow-review'],
  ['/grow/repay?sheet=repay-review&v=100', 'repay-review'],
  ['/grow/earn?sheet=earn-review&v=300', 'earn-review'],
  ['/grow/takeout?sheet=takeout-review&v=300', 'takeout-review'],
]

for (const [w, hh, tag] of [[1440, 1000, 'DESKTOP'], [390, 844, 'PHONE']]) {
  const p = await b.newPage({ viewport: { width: w, height: hh } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(6000)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const out = []
  for (const [r, name] of ROUTES) {
    await p.goto(B + r, { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(400)
    const d = await p.evaluate(() => {
      const s = document.querySelector('.scrim > .sheet')
      if (!s) return null
      return { h: Math.round(s.getBoundingClientRect().height), scrolls: s.scrollHeight - s.clientHeight > 2 }
    })
    out.push({ name, ...(d ?? { h: 0, scrolls: false, missing: true }) })
  }
  console.log(tag + '  ' + w + ' x ' + hh)
  ok('every dialog opens', !out.some((o) => o.missing),
     out.filter((o) => o.missing).map((o) => o.name).join(', ') || 'all ' + out.length)
  const scroll = out.filter((o) => o.scrolls)
  ok('none of them scrolls', scroll.length === 0,
     scroll.map((o) => `${o.name} ${o.h}`).join(', ') || 'none')
  const cap = Math.round(hh * 0.82)
  const tall = out.filter((o) => o.h > cap)
  ok(`none is over ${cap} tall`, tall.length === 0,
     tall.map((o) => `${o.name} ${o.h}`).join(', ') || 'tallest ' +
       Math.max(...out.map((o) => o.h)) + ' (' + out.slice().sort((a, c) => c.h - a.h)[0].name + ')')
  await p.close()
}

console.log('WHAT FOLDS AND WHAT DOES NOT')
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(420) }

  await at('/activity?sheet=receipt&ref=TKN-8E4J77')
  const shown = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' · ') ?? '')
  // What somebody opens a receipt to check, and nothing else.
  ok('a record shows the four facts it is opened for',
     /TO/.test(shown) && /SHARES/.test(shown) && /TOTAL/.test(shown) && /REFERENCE/.test(shown))
  ok('and folds the arithmetic behind them',
     !/PRICE EACH/.test(shown) && !/YOU HOLD NOW/.test(shown) &&
     (await p.locator('.panel-more').count()) === 1, shown.slice(0, 100))
  await p.locator('.panel-more').click(); await p.waitForTimeout(300)
  const all = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' · ') ?? '')
  ok('one press brings the rest back', /PRICE EACH/.test(all) && /FEE/.test(all) && /YOU HOLD NOW/.test(all))
  ok('and says which way it is pointing',
     (await p.locator('.panel-more').getAttribute('aria-expanded')) === 'true')

  // A review is agreed to, not read. Every term it asks agreement to is on it.
  await at('/invest/aapl/invest?sheet=invest-review&v=200&t=AAPL')
  const rev = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' · ') ?? '')
  ok('a review folds nothing', (await p.locator('.panel-more').count()) === 0)
  ok('and still states every term',
     /INVESTMENT/.test(rev) && /FEE/.test(rev) && /TOTAL/.test(rev) &&
     // "Above/Below Chainlink" now, because the product stopped carrying two
     // independent prices and started naming the one it has.
     /YOU RECEIVE/.test(rev) && /CHAINLINK/.test(rev) && /AT LEAST/.test(rev) &&
     /PRICE IMPACT/.test(rev), rev.slice(0, 90))
  // Past four facts the rows pair up, which is what bought the height back.
  ok('past four facts the rows pair up',
     (await p.locator('.panel.pairs').count()) === 1)
  await p.close()
}

console.log('THE OUTCOME  a coin, and only when there is something to celebrate')
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const buy = async (amount) => {
    await p.goto(B + '/invest/aapl/invest', { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(400)
    const i = p.locator('.amount-box input')
    await i.fill(String(amount)); await i.dispatchEvent('input'); await p.waitForTimeout(250)
    await p.locator('.col-compose .btn-primary').first().click(); await p.waitForTimeout(400)
    await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
  }
  await buy(200)
  ok('a trade that settled turns a coin',
     (await p.locator('.coin canvas').count()) === 1 && (await p.locator('.tick').count()) === 0)
  ok('and the gradient it replaced is gone',
     (await p.evaluate(() => getComputedStyle(document.querySelector('.sheet-done'), '::before').content)) === 'none')
  ok('the coin is not read out to anybody',
     (await p.locator('.coin').getAttribute('aria-hidden')) === 'true')
  // Sampled over a turn and taken at its widest: read at one arbitrary moment
  // the coin is as likely to be edge on, which is nineteen dots in a column.
  const lit = async () => p.evaluate(() => {
    const c = document.querySelector('.coin canvas')
    const g = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    let on = 0
    for (let i = 3; i < g.length; i += 4) if (g[i] > 8) on++
    return on
  })
  const seen2 = []
  for (let k = 0; k < 9; k++) { seen2.push(await lit()); await p.waitForTimeout(160) }
  const wide = Math.max(...seen2)
  ok('and it is actually turning', wide > 1200 && Math.min(...seen2) < wide * 0.6,
     `${Math.min(...seen2)} to ${wide} lit pixels across a turn`)
  // .98 goes unanswered, and a coin turning over "Still settling" would be the
  // product celebrating its own failure.
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  await buy(200.98)
  const said = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' ') ?? '')
  ok('one that did not come back confirmed does not', /Still settling/.test(said) &&
     (await p.locator('.coin').count()) === 0 && (await p.locator('.tick').count()) === 1, said.slice(0, 46))
  await p.close()
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
