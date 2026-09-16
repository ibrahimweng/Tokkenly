/* Money that changes shape without going anywhere.

   Six ordered pairs across three balances, and the same four questions of each
   of them: did the right balance go down, did the right one come up, did the
   books still come to nothing, and did anything get counted against a limit it
   has no business answering to.

   The last of those is the one worth a suite of its own. A conversion is the
   only movement in this product that touches two balances and crosses no
   boundary, and the easy mistake — the one every other money screen here makes
   correctly and this one could quietly get wrong — is to cap it like a payment.
   An account that could not turn its own naira into its own dollars because it
   had already sent $800 to a landlord would be a product that had confused a
   safety rail with a lock. */
import { chromium } from 'playwright'
import { seen, settled } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
let bad = 0
const ok = (l, pass, d = '') => { if (!pass) bad++; console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`) }
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } })
await seen(p)
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(9000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())

const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(420) }
const num = (s) => Number(String(s).replace(/[^0-9.-]/g, '')) || 0

/** Both trial balances, and whether either is off. */
const trial = async () => {
  await at('/statement')
  return p.evaluate(() => [...document.querySelectorAll('.trial-sum')].map((e) => ({
    text: e.innerText.replace(/\n/g, ' '), off: e.classList.contains('off'),
  })))
}

/** What the wallet says you hold, which is the figure a person actually
 *  reads. Off the hero's own rows rather than the headline, because the
 *  headline sums all three and a conversion never changes the sum. */
const heldOnWallet = async () => {
  await at('/transfer')
  await settled(p, '.hero-figure')
  return p.evaluate(() => {
    const out = {}
    for (const r of document.querySelectorAll('.hero-read .read')) {
      const k = r.querySelector('.t-body-strong')?.textContent?.trim()
      const v = r.querySelector('.muted')?.textContent?.trim()
      if (k) out[k] = v
    }
    return out
  })
}

/** Walk one conversion end to end, through the screens a person uses. */
async function walk(from, to, chips = 0) {
  await at(`/convert/${from}/${to}`)
  // The quick chip rather than typing: it is a real control and it keeps the
  // figure out of this file, so the suite does not encode the rate.
  const chip = p.locator('.quick button, .chip-row button').nth(chips)
  if (await chip.count()) await chip.click()
  await p.waitForTimeout(200)
  const action = p.locator('.btn-primary').filter({ hasText: /^Convert/ }).first()
  if (!(await action.count())) return { opened: false }
  await action.click()
  await p.waitForTimeout(700)
  // A pair that crosses currencies is quoted, and the quote has to land before
  // the button says anything.
  const confirm = p.locator('.sheet .btn-primary').filter({ hasText: /^Convert/ }).first()
  await confirm.waitFor({ state: 'visible', timeout: 9000 })
  await p.waitForTimeout(250)
  await confirm.click()
  await p.waitForTimeout(500)
  const staged = await p.evaluate(() => document.body.innerText.includes('At the currency desk'))
  // Then the second leg. Longer than CONVERT_MS, which is 2,800.
  await p.waitForTimeout(3400)
  const text = await p.evaluate(() => document.body.innerText)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(300)
  return { opened: true, staged, text }
}

console.log('CONVERT  six pairs, two legs each')

/* ---- the doors ---- */
await at('/transfer')
const doors = await p.$$eval('.way .t-title', (n) => n.map((x) => x.textContent))
ok('the wallet has three doors', doors.join(',') === 'Add money,Send,Convert', doors.join(' / '))
const spans = await p.evaluate(() => {
  const row = document.querySelector('.row.equal')
  const main = document.querySelector('.col-main')
  if (!row || !main) return null
  return { row: Math.round(row.getBoundingClientRect().width),
           main: Math.round(main.getBoundingClientRect().width) }
})
ok('the doors row is wider than the column beside it', !!spans && spans.row > spans.main + 100,
   spans ? `${spans.row} vs ${spans.main}` : 'not found')

/* ---- the address holds both halves ---- */
await at('/convert')
ok('/convert lands on a whole pair', (await p.evaluate(() => location.hash)).match(/#\/convert\/\w+\/\w+/) !== null,
   await p.evaluate(() => location.hash))
await at('/convert/usdc/usdc')
ok('a pair of one thing is normalised away',
   !(await p.evaluate(() => location.hash)).includes('usdc/usdc'),
   await p.evaluate(() => location.hash))
await at('/convert/usdc/ngn')
const crumbs = await p.$$eval('.crumb', (n) => n.map((x) => x.textContent.trim()))
ok('the trail names the pair once', crumbs.join(' › ') === 'Wallet › Convert › USDC to Naira', crumbs.join(' › '))

/* ---- the limit is not touched ---- */
await at('/transfer')
const leftBefore = await p.evaluate(() => {
  const m = document.body.innerText.match(/\$([\d,.]+)\s*\n?\s*left of your/)
  return m ? m[1] : null
})

const before = await heldOnWallet()
console.log('  balances before:', JSON.stringify(before))

/* ---- pair 1: USDC to naira, a rate in the middle ---- */
const r1 = await walk('usdc', 'ngn', 0)
ok('USDC to naira opens and confirms', r1.opened === true)
ok('USDC to naira shows the desk stage', r1.staged === true)
ok('USDC to naira lands', /is now|Converted/.test(r1.text ?? ''))

const afterUsdcNgn = await heldOnWallet()
ok('USDC went down', num(afterUsdcNgn.USDC) < num(before.USDC),
   `${before.USDC} -> ${afterUsdcNgn.USDC}`)
ok('naira went up', num(afterUsdcNgn.Naira) > num(before.Naira),
   `${before.Naira} -> ${afterUsdcNgn.Naira}`)

await at('/transfer')
const leftAfter = await p.evaluate(() => {
  const m = document.body.innerText.match(/\$([\d,.]+)\s*\n?\s*left of your/)
  return m ? m[1] : null
})
ok('the monthly limit is untouched', leftBefore === leftAfter, `${leftBefore} -> ${leftAfter}`)

/* ---- pair 2: naira back to USDC ---- */
const r2 = await walk('ngn', 'usdc', 0)
ok('naira to USDC opens and confirms', r2.opened === true)
const afterNgnUsdc = await heldOnWallet()
ok('naira went down again', num(afterNgnUsdc.Naira) < num(afterUsdcNgn.Naira),
   `${afterUsdcNgn.Naira} -> ${afterNgnUsdc.Naira}`)
ok('USDC came back up', num(afterNgnUsdc.USDC) > num(afterUsdcNgn.USDC),
   `${afterUsdcNgn.USDC} -> ${afterNgnUsdc.USDC}`)

/* ---- pair 3: USDT to USDC, no rate ---- */
await at('/convert/usdt/usdc')
ok('a stablecoin pair says one for one',
   await p.evaluate(() => document.body.innerText.includes('One for one')))
const r3 = await walk('usdt', 'usdc', 0)
ok('USDT to USDC opens and confirms', r3.opened === true)
const afterUsdtUsdc = await heldOnWallet()
ok('USDT went down', num(afterUsdtUsdc.USDT) < num(afterNgnUsdc.USDT),
   `${afterNgnUsdc.USDT} -> ${afterUsdtUsdc.USDT}`)
ok('USDC went up by the same dollars',
   Math.abs((num(afterUsdtUsdc.USDC) - num(afterNgnUsdc.USDC))
            - (num(afterNgnUsdc.USDT) - num(afterUsdtUsdc.USDT))) < 0.02,
   `${afterNgnUsdc.USDC} -> ${afterUsdtUsdc.USDC}`)

/* ---- the other three pairs open at all ---- */
for (const [f, t] of [['usdc', 'usdt'], ['usdt', 'ngn'], ['ngn', 'usdt']]) {
  await at(`/convert/${f}/${t}`)
  const h1 = await p.$eval('h1', (e) => e.textContent).catch(() => '')
  const has = await p.locator('.btn-primary').filter({ hasText: /^Convert/ }).count()
  ok(`${f} to ${t} is a screen with a button`, h1 === 'Convert' && has > 0, `${h1} / ${has}`)
}

/* ---- the card ----
   Two rows that are one amount. The pair reads off the two fields now, so the
   two fields are what this checks: that they disagree in unit and agree in
   value, that either end solves the other, and that the ruler and the rail
   that used to be here are gone rather than merely hidden. */
await at('/convert/usdc/ngn')
const shape = await p.evaluate(() => ({
  rows: document.querySelectorAll('.swap-row').length,
  fields: [...document.querySelectorAll('.swap-amount input')].map((i) => i.value),
  tokens: [...document.querySelectorAll('.swap-token')].map((t) => t.innerText.trim()),
  balances: [...document.querySelectorAll('.swap-bal')].map((b) => b.innerText.replace(/\n/g, ' ')),
  flip: !!document.querySelector('.swap-flip'),
  ruler: !!document.querySelector('.ruler'),
  rail: !!document.querySelector('.set-split'),
  maxes: document.querySelectorAll('.swap-max').length,
}))
ok('the card is two rows and a flip', shape.rows === 2 && shape.flip, JSON.stringify(shape.rows))
ok('each field counts in its own unit',
   shape.fields[0]?.startsWith('$') && shape.fields[1]?.startsWith('\u20a6'),
   shape.fields.join(' / '))
ok('each row names its token', shape.tokens.join(',') === 'USDC,Naira', shape.tokens.join(' / '))
ok('each row carries its balance', shape.balances.length === 2
   && shape.balances[0].includes('$') && shape.balances[1].includes('\u20a6'),
   shape.balances.join(' | '))
ok('only the paying row offers Max', shape.maxes === 1, String(shape.maxes))
ok('the ruler is gone', !shape.ruler)
ok('the rail is gone', !shape.rail)

const top = p.locator('.swap-amount input').first()
const bot = p.locator('.swap-amount input').nth(1)
const both = () => p.$$eval('.swap-amount input', (n) => n.map((i) => i.value))

await top.fill('250'); await top.dispatchEvent('input'); await p.waitForTimeout(200)
ok('typing the top solves the bottom', (await both())[1] === '\u20a6375,000', (await both()).join(' / '))
await bot.fill('75000'); await bot.dispatchEvent('input'); await p.waitForTimeout(200)
ok('typing the bottom solves the top', (await both())[0] === '$50.00', (await both()).join(' / '))
// The ceiling is whatever the paying row says it is. Read it rather than
// writing it down: this suite spends USDC six times before it gets here, so a
// hardcoded $1,680.00 tests only that nothing above ran.
const ceiling = () => p.$eval('.swap-bal .muted', (e) => e.textContent.trim())

// Asking the receiving end for more than the paying end can cover settles at
// what it can, rather than showing a pair that is not a rate.
await bot.fill('9000000'); await bot.dispatchEvent('input'); await p.waitForTimeout(200)
ok('the bottom cannot ask past the ceiling', (await both())[0] === (await ceiling()),
   (await both())[0] + ' vs ' + (await ceiling()))

await at('/convert/usdc/ngn')
await p.locator('.swap-max').click(); await p.waitForTimeout(200)
ok('Max fills the paying row', (await both())[0] === (await ceiling()),
   (await both())[0] + ' vs ' + (await ceiling()))

/* ---- the flip ---- */
await at('/convert/usdc/ngn')
await top.fill('50'); await top.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.swap-flip').click(); await p.waitForTimeout(600)
ok('the flip turns the address over',
   (await p.evaluate(() => location.hash)) === '#/convert/ngn/usdc',
   await p.evaluate(() => location.hash))
ok('and the amount survives the turn', (await both())[0] === '\u20a675,000', (await both()).join(' / '))

/* ---- the token pickers ---- */
await at('/convert/usdc/ngn')
await p.locator('.swap-token').nth(1).click(); await p.waitForTimeout(500)
ok('the receiving token opens a picker that says so',
   (await p.$eval('.sheet h2', (e) => e.textContent).catch(() => '')) === 'Convert into what?')
await p.locator('.sheet .set-row').first().click(); await p.waitForTimeout(600)
// USDC is already the paying side, so asking to receive it is asking to turn
// the pair over — not to convert a thing into itself.
ok('picking the other side\u2019s token flips instead of pairing a thing with itself',
   (await p.evaluate(() => location.hash)) === '#/convert/ngn/usdc',
   await p.evaluate(() => location.hash))

/* ---- the books ---- */
const sums = await trial()
ok('both trial balances still come to nothing', sums.length > 0 && sums.every((s) => !s.off),
   sums.map((s) => s.text).join(' | '))

/* ---- where a conversion shows up afterwards ---- */
await at('/activity?filter=converted')
const rows = await p.$$eval('.feed-row .t-body-strong', (n) => n.map((x) => x.textContent))
ok('Activity has a Conversions filter with the conversions in it', rows.length >= 3,
   `${rows.length} rows`)
ok('a conversion row names both figures',
   rows.some((t) => /Converted .+ to .+/.test(t)), rows[0] ?? '')

await at('/activity?filter=payments')
const pay = await p.$$eval('.feed-row .t-body-strong', (n) => n.map((x) => x.textContent))
ok('conversions stay out of Payments', !pay.some((t) => /^Converted /.test(t)),
   pay.slice(0, 3).join(' | '))

/* ---- the receipt ---- */
await at('/activity?filter=converted')
await p.locator('.feed-row').first().click()
await p.waitForTimeout(500)
const receipt = await p.evaluate(() => document.querySelector('.sheet')?.innerText ?? '')
ok('the receipt does not sign the figure', !/^\+|\n\+\$/.test(receipt), receipt.slice(0, 40))
ok('the receipt says nothing left the account', receipt.includes('Nothing left your account'))
ok('the receipt states the rate', /rate/i.test(receipt))

/* ---- the phone ---- */
const ph = await b.newPage({ viewport: { width: 390, height: 844 } })
await seen(ph)
await ph.goto(B + '/transfer', { waitUntil: 'domcontentloaded' })
await ph.waitForTimeout(500)
const phoneDoors = await ph.$$eval('.way .t-title', (n) => n.map((x) => x.textContent))
ok('the phone has the three doors too', phoneDoors.join(',') === 'Add money,Send,Convert',
   phoneDoors.join(' / '))
// It used to come up as a sheet over the wallet, because the screen behind it
// was a rail and an empty panel. It is a card now, and a card is a page at
// every width.
await ph.goto(B + '/convert', { waitUntil: 'domcontentloaded' })
await ph.waitForTimeout(700)
const phoneCard = await ph.evaluate(() => ({
  sheet: !!document.querySelector('.sheet'),
  rows: document.querySelectorAll('.swap-row').length,
  hash: location.hash,
}))
ok('/convert on a phone is the card, not a sheet', !phoneCard.sheet && phoneCard.rows === 2,
   JSON.stringify(phoneCard))
ok('and it has landed on a whole pair', /#\/convert\/\w+\/\w+/.test(phoneCard.hash), phoneCard.hash)
const phoneFits = await ph.evaluate(() => {
  const btn = [...document.querySelectorAll('.btn-primary')]
    .find((b) => /^Convert/.test(b.textContent ?? ''))
  return btn ? Math.round(btn.getBoundingClientRect().bottom) : -1
})
ok('the button is above the fold on a phone', phoneFits > 0 && phoneFits <= 844, String(phoneFits))

console.log(errs.length ? 'ERRORS ' + errs.slice(0, 4).join(' | ') : 'no page errors')
console.log(bad ? `${bad} FAILED` : 'all passed')
await b.close()
process.exit(bad || errs.length ? 1 : 0)
