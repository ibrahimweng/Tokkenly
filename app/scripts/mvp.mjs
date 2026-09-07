/* The half of a money product that is not the happy path.

   Everything here is something the MVP spec asks for and the prototype used to
   assert rather than show: that a trade is checked against a price the venue
   did not supply, that a token is not a share, that a portfolio knows what it
   cost, that permission to trade is a different fact from identity, and that
   there is a console which can stop any of it — and that stopping it changes
   what a customer meets rather than a boolean in a dashboard. */
import { chromium } from 'playwright'
import { seen, verify, settled } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1300 } })
await seen(p, { homeView: 'detailed' })
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(8000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500) }
const text = () => p.evaluate(() => document.querySelector('.content')?.innerText.replace(/\n/g, ' · ') ?? '')
const rows = () => p.evaluate(() => Object.fromEntries(
  [...document.querySelectorAll('.summary .kv')].map((e) => [...e.children].map((c) => c.textContent))))

console.log('A TOKEN IS NOT A SHARE, AND THE PRODUCT SAYS WHICH')
{
  await at('/invest/aapl')
  const said = await text()
  ok('the thing you hold carries the suffix', /AAPLc/.test(said))
  ok('and the share it tracks is named beside it', /1\.0043 × AAPL/.test(said), (said.match(/[\d.]+ × [A-Z]+/) ?? ['missing'])[0])
  ok('the multiplier is explained rather than left as a number',
     /dividends and corporate actions accrue into the multiplier/i.test(said))
  ok('with a reference price that did not come from the venue',
     /Chainlink/.test(said) && /Reference price/i.test(said))
  // The history behind the number, folded until somebody asks why it is not 1.
  await p.locator('.panel-more', { hasText: 'corporate action' }).first().click()
  await p.waitForTimeout(250)
  ok('and every corporate action that moved it', /Quarterly dividend/.test(await text()))
}

console.log('AND ONLY SOME OF THEM ARE OPEN')
{
  await at('/invest/aapl')
  ok('an approved asset says so', /Open for trading/i.test(await text()))
  await at('/invest/ko')
  const shut = await text()
  ok('one that is not says that instead', /Not open yet/i.test(shut))
  ok('and offers no way to buy it', !(await p.locator('.btn-primary', { hasText: 'Buy KOc' }).count()))
  await at('/invest/ko/invest')
  const said = await text()
  ok('the composer refuses it and says why',
     /Not open for trading yet/i.test(said) && /approved launch set/i.test(said))
  ok('with the button taken away rather than left to be pressed',
     await p.evaluate(() => !!document.querySelector('.col-compose .btn-primary')?.hasAttribute('disabled')))
}

console.log('A TRADE IS CHECKED BEFORE IT IS TAKEN')
{
  await verify(p)
  await at('/invest/aapl/invest')
  const i = p.locator('.amount-box input')
  await i.fill('200'); await i.dispatchEvent('input'); await p.waitForTimeout(250)
  const r = await rows()
  ok('the composer states what you get at worst, not only at best',
     /AAPLc/.test(r['At least'] ?? ''), r['At least'] ?? 'missing')
  ok('and what this order does to the price', !!r['Price impact'], r['Price impact'] ?? 'missing')
  await p.locator('.col-compose .btn-primary').click(); await p.waitForTimeout(500)
  const review = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' · ') ?? '')
  // One independent price, named by its source and its age, on the row that
  // compares the venue to it — not a second row repeating the number.
  ok('and the review names the independent price it was checked against',
     /Chainlink/i.test(review) && /\d+s ago/.test(review),
     (review.match(/(above|below) chainlink · [^·]+·[^·]+/i) ?? ['missing'])[0])
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)

  // An order that is large against a thin book is refused, with the arithmetic
  // shown. This is the one a prototype normally cannot demonstrate at all.
  // METAc is in the launch set and has the thinnest book of the four, which
  // is what a newly listed token looks like. An order that is a real fraction
  // of it is refused with the arithmetic shown.
  // METAc is switched off in the seed, so turn it on from the console first —
  // which also proves the two kinds of refusal are distinguishable: a pause is
  // not the same sentence as a thin book, and a person told the wrong one goes
  // away and does the wrong thing.
  await at('/admin/switches')
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.sw-row')].find((e) => /^METAc/m.test(e.innerText))
    row?.querySelector('button')?.click()
  })
  await p.waitForTimeout(350)
  await at('/invest/meta/invest')
  const j = p.locator('.amount-box input')
  await j.fill('2400'); await j.dispatchEvent('input'); await p.waitForTimeout(300)
  const big = await text()
  ok('an order too big for the book is refused before the button',
     /too big for the book/i.test(big), (big.match(/would move the price [\d.]+%/) ?? ['missing'])[0])
  ok('and the button is gone rather than disabled-looking',
     await p.evaluate(() => !!document.querySelector('.col-compose .btn-primary')?.hasAttribute('disabled')))
}

console.log('A PORTFOLIO KNOWS WHAT IT COST')
{
  await at('/')
  const said = await text()
  ok('every position states what it paid, on average',
     (said.match(/at \$[\d,.]+ average/g) ?? []).length >= 4,
     (said.match(/at \$[\d,.]+ average/g) ?? []).join(' · '))
  ok('and whether it is up or down, in money and in percent',
     /[+−]\$[\d,]+ · [+−][\d.]+%/.test(said))
  await at('/invest/tsla')
  const one = await text()
  ok('a losing position is not dressed up as a winning one', /−\$/.test(one) || /-\$/.test(one))
  await at('/invest/aapl/sell')
  const k = p.locator('.amount-box input')
  await k.fill('500'); await k.dispatchEvent('input'); await p.waitForTimeout(250)
  const sell = await text()
  ok('and selling says what this sale realises against what it cost',
     /It cost you/i.test(sell) && /You realise/i.test(sell))
}

console.log('IDENTITY AND PERMISSION ARE TWO DIFFERENT FACTS')
{
  await at('/account/verification')
  const before = await text()
  ok('five checks, not one badge',
     ['Who you are', 'Eighteen or over', 'Resident in Nigeria', 'Sanctions', 'May hold tokenised shares']
       .every((w) => new RegExp(w, 'i').test(before)))
  ok('and the screener is named', /Didit/.test(before))
  // The ending nobody builds: known, and still not allowed.
  await p.locator('.link', { hasText: 'Show a refused eligibility check' }).click()
  await p.waitForTimeout(400)
  const after = await text()
  ok('somebody can be verified and still not be allowed to hold this',
     /Identity checked/i.test(after) && /not passed/i.test(after), '')
  ok('and the product says which check, in words a person can repeat',
     /outside the pilot/i.test(after))
}

console.log('THE WALLET IS THEIRS, AND THE PRODUCT SAYS SO OUT LOUD')
{
  await at('/account/wallet')
  const said = await text()
  ok('who holds the key is a fact on the screen', /Who holds the key/i.test(said) && /You do/i.test(said))
  ok('and what Tokkenly can sign is stated as nothing',
     /Tokkenly can sign · Nothing/i.test(said))
  ok('the wallet can be taken elsewhere', /Take the wallet elsewhere/i.test(said))
  ok('gas is sponsored, with a ceiling named', /Sponsored/i.test(said) && /of \$5\.00/.test(said))
  ok('and the invite that let them in is on the record', /TKN-PILOT-/.test(said))
}

console.log('AND THERE IS A CONSOLE THAT CAN STOP ANY OF IT')
{
  await at('/admin')
  const status = await text()
  ok('it opens on what is not working', /Switch/.test(status) && /not responding|Down/i.test(status))
  ok('and says what a customer meets while it is like that',
     /Naira funding and bank payouts both stop/i.test(status))
  ok('it states that staff cannot move customer money',
     /Nothing here can move customer money/i.test(status))

  await at('/admin/switches')
  ok('every switch names its consequence in customer words',
     /buy button is replaced/i.test(await text()))
  await at('/admin/breaks')
  ok('reconciliation is a place with differences in it, not a claim',
     /We say/i.test(await text()))
  await at('/admin/audit')
  ok('and what staff did is written down', /Turned off card funding/i.test(await text()))
  await at('/admin/launch')
  const launch = await text()
  ok('the launch gates are a screen rather than a paragraph in a document',
     /Before external users are invited/i.test(launch) && /Not started/i.test(launch))
  ok('and the eight-step journey is walkable end to end', /Walkable/.test(launch))
}

console.log('A SWITCH CHANGES THE PRODUCT, NOT A DASHBOARD')
{
  await at('/admin/switches')
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.sw-row')].find((e) => /^Buying/m.test(e.innerText))
    row?.querySelector('button')?.click()
  })
  await p.waitForTimeout(400)
  await at('/invest/aapl/invest')
  const said = await text()
  ok('turning off buying stops the buy screen, in the customer’s words',
     /Trading is paused/i.test(said), said.slice(0, 100))
  ok('and says the holdings are untouched and selling still works',
     /holdings are untouched/i.test(said) && /selling still works/i.test(said))
  // Put it back, so the rest of the demo is not left broken by a test.
  await at('/admin/switches')
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.sw-row')].find((e) => /^Buying/m.test(e.innerText))
    row?.querySelector('button')?.click()
  })
  await p.waitForTimeout(400)
  await at('/invest/aapl/invest')
  ok('and turning it back on restores it',
     !/Trading is paused/i.test(await text()))
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
