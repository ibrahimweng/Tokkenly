/* Two things the marketing promises that the product has to actually say:
   that some of these are funds and not companies, and that you can lose
   money. Both are only worth anything where a decision is being made. */
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
const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400) }
const text = () => p.evaluate(() => document.body.innerText)

console.log('ETFs  a fund is not a company')
await at('/invest?cat=ETFs')
ok('the category is called ETFs', /ETFs/.test(await text()))
ok('and they are named the way the site names them',
   /S&P 500 ETF/.test(await text()) && /Nasdaq-100 ETF/.test(await text()))
ok('every row in it is tagged',
   (await p.evaluate(() => document.querySelectorAll('.table tbody .tag').length)) === 2,
   (await p.evaluate(() => document.querySelectorAll('.table tbody .tag').length)) + ' tags')
await at('/invest?cat=Everything')
const mixed = await p.evaluate(() => ({
  count: [...document.querySelectorAll('.card-head')].map((e) => e.innerText).find((t) => /compan|ETF/.test(t)),
  tags: document.querySelectorAll('.table tbody .tag').length,
  rows: document.querySelectorAll('.table tbody tr').length,
}))
ok('a mixed list does not call a fund a company', /ETF/.test(mixed.count ?? ''), mixed.count ?? '')
// Thirteen now: METAc joined the catalogue as one of the four launch assets.
// Still two funds, which is the thing being checked.
ok('and only the funds are tagged', mixed.tags === 2 && mixed.rows === 13,
   `${mixed.tags} tags of ${mixed.rows} rows`)
ok('the column is Name, not Company',
   /NAME/.test(await p.evaluate(() => document.querySelector('.table thead')?.innerText ?? '')))

await at('/invest/voo')
ok('a fund says so on its own page', /ETF/.test(await text()))
await at('/invest/aapl')
ok('and a company says company', /Company/.test(await text()))

console.log('RISK  where the decision is, not in a drawer')
await at('/invest/voo/invest')
ok('the fund buy screen says it is a fund, and what can happen',
   /fund, not a company/.test(await text()) && /less than you put in/.test(await text()))
await at('/invest/aapl/invest')
ok('the share buy screen says what can happen', /fall as well as rise/.test(await text()))
await p.locator('.amount-box input').fill('50')
await p.locator('.amount-box input').dispatchEvent('input')
await p.waitForTimeout(250)
await p.locator('.content .btn-primary').last().click(); await p.waitForTimeout(450)
ok('and the review carries it, last thing before the money moves',
   /less than you put in/.test(await p.evaluate(() => document.querySelector('.scrim')?.innerText ?? '')))
await p.keyboard.press('Escape'); await p.waitForTimeout(300)

console.log('THE LONG VERSION')
await at('/invest')
ok('the market says it once, at the foot', /Prices go down as well as up/.test(await text()))
await at('/disclosures')
const d = await text()
for (const [what, re] of [
  ['what you actually own', /token that tracks one real share/i],
  ['that you do not get votes', /do not get a vote/i],
  ['the custodian risk', /custodian/i],
  ['that funds are not companies', /Funds are not companies/i],
  ['the currency risk', /naira gets stronger/i],
  ['what it costs', /0\.5% of the amount/],
  ['eligibility', /eighteen or over/i],
  ['where to complain', /regulator/i],
]) ok('it covers ' + what, re.test(d))
await at('/account')
ok('Account lists it as a group', /Risk and legal/.test(await text()))
await at('/account/legal')
ok('and the group links to it', /Read the disclosures/.test(await text()))
await at('/all')
ok('and the index lists it', /Risk and disclosures/.test(await text()))

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
