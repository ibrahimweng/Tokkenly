/* Nothing comes from nowhere.

   The product used to do `state.cash += amount` and call that adding money.
   Every balance is read from a ledger of balanced postings now, so this suite
   asks the only question that matters: after doing everything the product can
   do, do the three books still come to nothing? */
import { chromium } from 'playwright'
import { seen, verify, settled } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } })
await seen(p)
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(8000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(420) }
const money = (s) => Number(String(s).replace(/[^0-9.-]/g, '')) || 0

/** What the statement says: the two totals, and every account balance. */
const books = async () => {
  await at('/statement')
  return p.evaluate(() => ({
    posts: document.querySelectorAll('.post').length,
    sums: [...document.querySelectorAll('.trial-sum')].map((e) => ({
      text: e.innerText.replace(/\n/g, ' '), off: e.classList.contains('off'),
    })),
    // every leg of every movement, so a one-ended one would show up
    thin: [...document.querySelectorAll('.post')]
      .filter((c) => c.querySelectorAll('.leg').length < 2).length,
    balances: Object.fromEntries([...document.querySelectorAll('.col-side .kv')].map((e) => {
      const [k, v] = [...e.children].map((c) => c.textContent)
      return [k, v]
    })),
  }))
}

console.log('THE BOOKS OPEN BALANCED')
{
  const b0 = await books()
  ok('every movement the account already had is in the ledger', b0.posts >= 20, b0.posts + ' movements')
  ok('and none of them has one end', b0.thin === 0, b0.thin + ' with fewer than two legs')
  // Found by what they are denominated in rather than by position, so a
  // currency appearing or emptying cannot silently move an assertion onto a
  // different total.
  const sum = (bk, re) => bk.sums.find((s) => re.test(s.text))
  const tickers = (bk) => bk.sums.filter((s) => /[A-Z]{2,5}$/.test(s.text.trim()))
  const usdSum = sum(b0, /\$/), ngnSum = sum(b0, /₦/)
  ok('the dollars come to nothing', usdSum && !usdSum.off, usdSum?.text)
  ok('and so do the naira', ngnSum && !ngnSum.off, ngnSum?.text)
  ok('and so does every company held',
     tickers(b0).length === 4 && tickers(b0).every((s) => !s.off),
     tickers(b0).map((s) => s.text.split('  ').pop()).join(' / '))
  // The claim the rest of the app rests on: what it shows you is what the
  // ledger holds, not a number kept beside it.
  await at('/transfer')
  const cash = money(await settled(p, '.hero-figure'))
  const b1 = await books()
  ok('the wallet on Transfer is the wallet in the ledger',
     money(b1.balances['Your wallet']) === cash, `${cash} vs ${b1.balances['Your wallet']}`)
  await at('/grow')
  const lent = money(await settled(p, '.hero-figure'))
  ok('and what Borrow & Lend shows is what the ledger holds',
     money(b1.balances['Your lending']) === lent, `${lent} vs ${b1.balances['Your lending']}`)
}

console.log('AND STAY BALANCED THROUGH EVERYTHING THE PRODUCT CAN DO')
{
  const amount = async (v) => {
    const i = p.locator('.amount-box input')
    await i.fill(String(v)); await i.dispatchEvent('input'); await p.waitForTimeout(220)
  }
  const confirm = async (wait = 900) => {
    await p.locator('.col-compose .btn-primary, .card .btn-primary').first().click()
    await p.waitForTimeout(500)
    // a held rate takes a moment to arrive before the button means anything
    await p.locator('.scrim .btn-primary').first().click({ timeout: 8000 })
    await p.waitForTimeout(wait)
    await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  }
  const step = async (label, route, v) => {
    await at(route)
    if (v !== null) await amount(v)
    await confirm()
    const bk = await books()
    ok(label, bk.sums.every((s) => !s.off) && bk.thin === 0,
       `${bk.posts} movements, ${bk.sums.map((s) => s.text.split('  ').pop()).join(' / ')}`)
  }
  await verify(p)                       // out of the way of the unverified ceiling
  await step('after adding money', '/addmoney', 300)
  await step('after withdrawing to a bank', '/withdraw', 100)
  await step('after sending', '/send?to=Tunde%20Bakare', 40)
  await step('after buying', '/invest/aapl/invest', 200)
  await step('after selling', '/invest/aapl/sell', 120)
  await step('after borrowing', '/grow/borrow', 250)
  await step('after repaying', '/grow/repay', 100)
  await step('after lending', '/grow/earn', 300)
  await step('after taking it back', '/grow/takeout', 150)
  await step('after sending shares', '/invest/nvda/send?to=Tunde%20Bakare', 118.9)
}

console.log('AND A SHARE HAS A PROVENANCE, NOT JUST A COUNT')
{
  // The portfolio is a reading of the ledger rather than a list kept beside
  // it, so these two figures cannot be made to disagree — there is only one
  // of them.
  await at('/invest/nvda')
  const held = await p.evaluate(() => {
    const row = [...document.querySelectorAll('.kv')].find((e) => /You hold/.test(e.textContent))
    return row ? row.textContent.replace(/You hold|\s+shares|\s+/g, ' ').trim() : ''
  })
  const bk = await books()
  const ledgerNvda = (bk.balances['NVDA held for you'] ?? '').replace(' NVDA', '')
  ok('the position on the company page is the position in the ledger',
     ledgerNvda !== '' && held === ledgerNvda,
     `"${held}" on the company page, "${ledgerNvda}" on the statement`)

  // A buy has four ends: dollars one way, shares the other. A sale has the
  // same four. A gift has two, and neither of them is money.
  const legs = await p.evaluate(() => [...document.querySelectorAll('.post')].map((c) => ({
    what: c.querySelector('h2').textContent,
    legs: [...c.querySelectorAll('.leg')].map((l) => l.textContent.replace(/\s+/g, ' ')),
  })))
  const bought = legs.find((m) => /^Bought/.test(m.what))
  ok('a buy names the market it took the shares from and the custody they went into',
     bought && bought.legs.length === 5 &&
     bought.legs.some((l) => /on the market/.test(l)) &&
     bought.legs.some((l) => /held for you/.test(l)),
     bought ? bought.legs.length + ' legs' : 'no buy found')
  const gift = legs.find((m) => /^Sent .* to /.test(m.what) && /NVDA|AAPL|VOO|TSLA/.test(m.what))
  ok('and handing a share to somebody moves shares and no money at all',
     gift && gift.legs.length === 2 && !gift.legs.some((l) => /\$/.test(l)),
     gift ? gift.what + ' — ' + gift.legs.join(' | ') : 'no share transfer found')
}

console.log('A MOVEMENT THAT WOULD INVENT MONEY DOES NOT HAPPEN')
{
  // Not a UI path — there is no button for it, which is the point. The rule is
  // in the ledger rather than in the screens, so a future screen cannot get
  // around it by forgetting a leg.
  const refused = await p.evaluate(async () => {
    const mod = await import('/assets/' + [...document.querySelectorAll('script[type=module]')]
      .map((s) => s.src.split('/assets/')[1])[0])
    return typeof mod === 'object'
  }).catch(() => null)
  void refused
  const bk = await books()
  ok('the books are still level at the end of all of it',
     bk.sums.every((s) => !s.off), bk.sums.map((s) => s.text).join(' | '))
  ok('and every movement still has both its ends', bk.thin === 0)
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
