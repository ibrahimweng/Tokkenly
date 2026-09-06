/* An identity check is only worth building if something is actually different
   on either side of it. This walks it and then checks the two numbers that
   were supposed to move. */
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
const money = (s) => Number((String(s ?? '').match(/[\d,]+\.?\d*/) ?? ['0'])[0].replace(/,/g, '')) || 0
const text = () => p.evaluate(() => document.body.innerText)

console.log('BEFORE  an unverified account says so, and says what it costs')
await at('/account')
ok('the header does not claim verified', /Not verified/.test(await text()))
// The index states the cost of not verifying; the group states the lift.
ok('the index banner names both ceilings',
   /\$250 a payment and \$1,000 a month/.test((await text()).replace(/\n/g, ' ')))
await at('/account/verification')
ok('the card says what verifying lifts', /\$1,000\s*→\s*\$10,000/.test((await text()).replace(/\n/g, ' ')),
   ((await text()).match(/Monthly limit[^\n]*/) ?? [''])[0])
await at('/transfer')
ok('Transfer states the low limit', /\$1,000/.test(await text()))
ok('and offers the way to lift it', await p.evaluate(() => !!document.body.innerText.match(/Verify to lift/)))

console.log('THE CEILING BITES  before the balance does')
await at('/send')
const capped = await p.evaluate(() => {
  const i = document.querySelector('.amount-box input')
  return { max: i?.value }
})
await p.locator('.amount-box input').fill('900')
await p.locator('.amount-box input').dispatchEvent('input')
await p.waitForTimeout(300)
// /send is a dialog over Transfer, and Transfer now has a primary button of
// its own underneath, so the action has to be read inside the dialog.
const said = await p.evaluate(() => ({
  action: (document.querySelector('.scrim .btn-primary') ?? document.querySelector('.content .btn-primary'))?.textContent,
  msg: document.querySelector('.field-error:not([hidden])')?.innerText.replace(/\n/g, ' '),
}))
ok('a send over the single limit is capped at the limit, not the balance',
   money(said.action) === 250, `offers ${said.action}, balance is $2,480`)
ok('and the message names the limit, not the money',
   /verify/i.test(said.msg ?? ''), said.msg ?? 'nothing said')

console.log('WALKING IT')
await at('/verify')
ok('step one says what is needed and why', /NIN or a BVN/.test(await text()))
ok('and warns about the thing scammers ask for', /never ask for your PIN/i.test(await text()))
await p.getByRole('button', { name: 'Start' }).click(); await p.waitForTimeout(400)
const i = p.locator('.field input')
await i.fill('123'); await i.dispatchEvent('input'); await p.waitForTimeout(250)
const short = await p.evaluate(() => ({
  err: !document.querySelector('.field-error')?.hidden,
  blocked: document.querySelector('.btn-primary')?.hasAttribute('disabled'),
}))
ok('a short number is refused where it was typed', short.err && short.blocked === true)
await i.fill(''); await i.dispatchEvent('input'); await p.waitForTimeout(250)
ok('an empty field does not nag', await p.evaluate(() => !!document.querySelector('.field-error')?.hidden))
await i.fill('12345678901'); await i.dispatchEvent('input'); await p.waitForTimeout(250)
ok('eleven digits releases it',
   (await p.evaluate(() => document.querySelector('.btn-primary')?.hasAttribute('disabled'))) === false)
await p.getByRole('button', { name: 'Check this number' }).click(); await p.waitForTimeout(400)
ok('it checks the details it already holds', /Chinaza Okoro/.test(await text()))
ok('and shows only the last four of the number', /ending 8901/.test(await text()), 'ending 8901')
await p.getByRole('button', { name: 'Yes, check it' }).click(); await p.waitForTimeout(500)
ok('the end says what changed, not just "submitted"',
   /\$1,000\s*→\s*\$10,000/.test((await text()).replace(/\n/g, ' ')))

console.log('AFTER  the numbers actually moved')
await at('/account')
ok('the header says verified', /Verified/.test(await text()) && !/Not verified/.test(await text()))
await at('/transfer')
ok('Transfer shows the lifted limit', /\$10,000/.test(await text()))
await at('/send')
await p.locator('.amount-box input').fill('900')
await p.locator('.amount-box input').dispatchEvent('input')
await p.waitForTimeout(300)
ok('and a $900 send now goes through',
   money(await p.evaluate(() => (document.querySelector('.scrim .btn-primary') ?? document.querySelector('.content .btn-primary'))?.textContent)) === 900,
   await p.evaluate(() => (document.querySelector('.scrim .btn-primary') ?? document.querySelector('.content .btn-primary'))?.textContent))

console.log('IT COUNTS  a limit that never fills is not a limit')
const used = async () => {
  await at('/transfer')
  return money(await p.evaluate(() =>
    [...document.querySelectorAll('.kv')].find((e) => /Used this month/.test(e.textContent))?.textContent))
}
const before = await used()
await at('/invest/nvda/invest')
const j = p.locator('.amount-box input')
await j.fill('100'); await j.dispatchEvent('input'); await p.waitForTimeout(250)
await p.locator('.content .btn-primary').last().click(); await p.waitForTimeout(400)
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
const after = await used()
ok('buying counts against the month too', Math.abs((after - before) - 100.5) < 0.05,
   `${before} → ${after}, expected +100.50`)

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
