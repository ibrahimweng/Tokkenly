/* Where the money comes from, and where it goes.

   Two questions the product could not answer. Adding money credited the wallet
   the instant the button was pressed, from a bank nobody had told; and Send
   and Withdraw were two screens for one errand, which hid the fact that a
   payout into naira is a conversion and the other rails are not.

   So this suite asks the awkward version of both. Does the wallet stay put
   while the naira is genuinely in flight? Is the money somewhere real in the
   meantime? Does one Send actually reach all three destinations, and does the
   one that turns dollars into naira say so? */
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
const money = (s) => Number(String(s ?? '').replace(/[^0-9.-]/g, '')) || 0
const cash = async () => { await at('/transfer'); return money(await settled(p, '.hero-figure')) }
const amount = async (v) => {
  const i = p.locator('.amount-box input')
  await i.fill(String(v)); await i.dispatchEvent('input'); await p.waitForTimeout(220)
}
/** Every account balance the statement shows, by name. */
const books = async () => {
  await at('/statement')
  return p.evaluate(() => ({
    sums: [...document.querySelectorAll('.trial-sum')].map((e) => e.classList.contains('off')),
    balances: Object.fromEntries([...document.querySelectorAll('.col-side .kv')]
      .map((e) => [...e.children].map((c) => c.textContent))),
    posts: [...document.querySelectorAll('.post h2')].map((e) => e.textContent),
  }))
}
await verify(p)

console.log('TWO WAYS IN, AND NEITHER OF THEM IS INSTANT')
{
  await at('/addmoney')
  const rails = await p.evaluate(() => [...document.querySelectorAll('.rail')].map((e) => ({
    text: e.innerText.replace(/\n/g, ' · '), on: e.classList.contains('on'),
  })))
  ok('the two rails are on the screen, not behind a dropdown', rails.length === 2,
     rails.map((r) => r.text).join(' | '))
  ok('and the transfer says what it costs and how long it takes',
     /Free/.test(rails[0].text) && /minute/.test(rails[0].text))
  ok('a transfer is the default', rails[0].on)
  // The card rail ships switched off, so this is also the first proof that
  // the console is not decoration: what operations sets is what a customer
  // meets, on the same render.
  ok('a rail operations has switched off reads as off rather than vanishing',
     /Paused/.test(rails[1].text) && !rails[1].on, rails[1].text)

  // The account is dedicated, so there is no reference to quote.
  const va = await p.evaluate(() => document.querySelector('.va-number')?.textContent?.trim())
  ok('and it names a naira account to pay into', /^\d{10}$/.test(va ?? ''), va ?? 'none')
}

console.log('THE WALLET DOES NOT MOVE UNTIL THE NAIRA DOES')
{
  const before = await cash()
  await at('/addmoney')
  await amount(300)
  await p.locator('.col-compose .btn-primary, .card .btn-primary').first().click()
  await p.waitForTimeout(500)
  const said = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' '))
  ok('the review hands over the account rather than confirming a credit',
     /I have sent it/.test(said ?? '') && /\d{10}/.test(said ?? ''))
  await p.locator('.scrim .btn-primary').first().click()
  await p.waitForTimeout(400)                      // in flight, not landed
  const waiting = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' '))
  ok('and then says it is on its way, not that it arrived',
     /On its way|Waiting for/.test(waiting ?? ''), (waiting ?? '').slice(0, 60))
  const mid = await p.evaluate(() =>
    document.querySelector('.hero-figure')?.textContent ?? '')
  void mid
  const bk = await books()
  ok('the naira is in an account that is neither yours nor ours to spend',
     !!bk.balances['On its way to us'], bk.balances['On its way to us'] ?? 'nothing in flight')
  ok('the wallet has not moved', money(bk.balances['Your wallet']) === before,
     `${before} → ${money(bk.balances['Your wallet'])}`)
  ok('and the books are still level', bk.sums.every((off) => !off))

  await p.waitForTimeout(2800)                     // the transfer lands
  const after = await cash()
  ok('and when it lands the wallet goes up by exactly what was bought',
     Math.abs(after - before - 300) < 0.01, `${before} → ${after}`)
  const bk2 = await books()
  ok('with nothing left in flight', !bk2.balances['On its way to us'],
     bk2.balances['On its way to us'] ?? 'empty')
  ok('and every step of it named', bk2.posts.some((t) => /reached your Tokkenly naira account/.test(t)) &&
     bk2.posts.some((t) => /went to the currency desk/.test(t)) &&
     bk2.posts.some((t) => /paid to your wallet/.test(t)))
}

console.log('AND SAYS SO, ON THE ONE SCREEN THAT WAS NOT LOOKING')
{
  // The product had never written a notification: the five in the list were
  // seeded, and the switch in Preferences filtered a fixed set. A transfer
  // landing while somebody is on another screen is the only genuinely
  // asynchronous event here, so it is the one that has to speak.
  await at('/activity?filter=alerts')
  const top = await p.evaluate(() => {
    const row = document.querySelector('.alert-list > .set-row')
    return row ? row.innerText.replace(/\n/g, ' · ') : ''
  })
  ok('the wallet going up while you were elsewhere is told to you',
     /landed in your wallet/.test(top), top.slice(0, 80))
  ok('and it names both currencies and the rate it went at',
     /₦[\d,]+/.test(top) && /to the dollar/.test(top))

  // The document somebody keeps has to carry the half that is not in dollars.
  const ref = (top.match(/TKN-[A-Z0-9]+/) ?? [])[0]
  await at('/activity')
  const receipt = await p.evaluate(async () => {
    const row = [...document.querySelectorAll('tbody tr, .row-hit')]
      .find((e) => /Bought dollars|GTBank/.test(e.textContent))
    row?.click()
    await new Promise((r) => setTimeout(r, 400))
    document.querySelector('.panel-more')?.click()
    await new Promise((r) => setTimeout(r, 200))
    return document.querySelector('.scrim > .sheet')?.innerText.replace(/\n/g, ' · ') ?? ''
  })
  void ref
  // innerText applies text-transform, so every caps label in this product
  // comes back uppercased whatever the DOM holds. Match case-insensitively or
  // match nothing.
  ok('the receipt for money that changed currency states both figures',
     /you paid · ₦[\d,]+/i.test(receipt), (receipt.match(/you paid · ₦[\d,]+/i) ?? ['missing'])[0])
  ok('and the rate it was honoured at, not this morning\u2019s',
     /rate · 1 dollar = ₦[\d,]+/i.test(receipt), (receipt.match(/rate · 1 dollar = ₦[\d,]+/i) ?? ['missing'])[0])
  await p.keyboard.press('Escape'); await p.waitForTimeout(250)
}

console.log('A CARD IS THE OTHER RAIL, AND IT COSTS SOMETHING')
{
  // Turn it back on from the console, which is the only way it can be turned
  // on — and the point: the switch that hid the rail is the switch that brings
  // it back, and no code path exists to do it any other way.
  await at('/admin/switches')
  await p.evaluate(() => {
    const row = [...document.querySelectorAll('.sw-row')].find((e) => /Card funding/.test(e.textContent))
    row?.querySelector('button')?.click()
  })
  await p.waitForTimeout(400)
  const back = await p.evaluate(() => {
    const row = [...document.querySelectorAll('.sw-row')].find((e) => /Card funding/.test(e.textContent))
    return row?.querySelector('button')?.textContent
  })
  ok('the console can turn the card rail back on', back === 'On', back ?? 'no switch')
  await at('/addmoney')
  const rails = await p.evaluate(() => [...document.querySelectorAll('.rail')].map((e) => ({
    text: e.innerText.replace(/\n/g, ' · '), off: e.classList.contains('off'),
  })))
  ok('and the customer screen shows it on the very next render',
     !rails[1].off && /%/.test(rails[1].text) && /[Ss]econd/.test(rails[1].text), rails[1].text)

  const before = await cash()
  await at('/addmoney?via=card')
  await amount(100)
  const shown = await p.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll('.summary .kv')].map((e) => [...e.children].map((c) => c.textContent))))
  ok('the card fee is a figure on the composer, not a footnote',
     /₦/.test(shown['Fee'] ?? '') && /%/.test(shown['Fee'] ?? ''), shown['Fee'] ?? 'missing')
  await p.locator('.col-compose .btn-primary, .card .btn-primary').first().click()
  await p.waitForTimeout(700)
  await p.locator('.scrim .btn-primary').first().click({ timeout: 8000 })
  await p.waitForTimeout(2200)
  const after = await cash()
  ok('and the wallet still gets exactly the dollars asked for',
     Math.abs(after - before - 100) < 0.01, `${before} → ${after}`)
  const bk = await books()
  ok('the fee is charged in the currency the card charged it in',
     !!bk.balances['Tokkenly fees, naira'], bk.balances['Tokkenly fees, naira'] ?? 'missing')
  ok('and the books are still level', bk.sums.every((off) => !off))
}

console.log('ONE SEND, THREE PLACES FOR IT TO GO')
{
  await at('/send')
  const groups = await p.evaluate(() =>
    [...document.querySelectorAll('.card-head h2')].map((e) => e.textContent))
  ok('the screen asks where before it asks how much',
     ['Someone on Tokkenly', 'Your own bank', 'Somebody else’s account', 'A Base address']
       .every((g) => groups.includes(g)), groups.join(' | '))
  ok('and there is no separate Withdraw screen to drift from it',
     await p.evaluate(async () => {
       location.hash = '#/withdraw'
       await new Promise((r) => setTimeout(r, 500))
       return document.querySelector('h1')?.textContent === 'Send money'
     }))
}

console.log('AND THE ONE THAT CHANGES CURRENCY SAYS SO')
{
  const before = await cash()
  await at('/send?rail=bank&to=gt')
  await amount(120)
  const shown = await p.evaluate(() => Object.fromEntries(
    [...document.querySelectorAll('.summary .kv')].map((e) => [...e.children].map((c) => c.textContent))))
  ok('a payout states the rate and what they get in naira',
     /₦/.test(shown['They get'] ?? '') && /dollar/.test(shown['Rate'] ?? ''),
     `${shown['Rate'] ?? '?'} / ${shown['They get'] ?? '?'}`)
  await p.locator('.col-compose .btn-primary, .card .btn-primary').first().click()
  await p.waitForTimeout(700)
  await p.locator('.scrim .btn-primary').first().click({ timeout: 8000 })
  await p.waitForTimeout(900)
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  const after = await cash()
  ok('and it takes dollars out of the same wallet a payment does',
     Math.abs(before - after - 120) < 0.01, `${before} → ${after}`)
  const bk = await books()
  // Not the naira figure: a held quote steps the rate on every ask, so the
  // exact number depends on how many quotes this run has taken. What is being
  // checked is the shape — dollars out of the wallet on one posting, naira
  // into the bank on another, which is what makes it a conversion rather than
  // one entry pretending to be denominated twice.
  ok('as a conversion: two postings, one in each currency',
     bk.posts.some((t) => /Took \$120\.00 from your wallet/.test(t)) &&
     bk.posts.some((t) => /^₦[\d,]+ queued for GTBank$/.test(t)),
     bk.posts.slice(0, 2).join(' | '))
  // And in two stages. The dollars have gone; the naira are in our payout
  // account, not the customer's bank, and nothing calls it done until they are.
  ok('the naira wait in an account of ours rather than being called delivered',
     !!bk.balances['Tokkenly payout account'], bk.balances['Tokkenly payout account'] ?? 'nothing queued')
  await p.waitForTimeout(3600)
  const bk2 = await books()
  ok('and the second stage lands them, with nothing left queued',
     bk2.posts.some((t) => /^₦[\d,]+ reached GTBank$/.test(t)) && !bk2.balances['Tokkenly payout account'],
     bk2.posts[0])
  ok('and the books are still level after both stages', bk2.sums.every((off) => !off))
  ok('and the books are still level', bk.sums.every((off) => !off))
}

console.log('A NAME BEFORE A NUMBER')
{
  await at('/send')
  const acct = p.locator('input[placeholder*="10-digit"]')
  await acct.fill('0123456783'); await p.waitForTimeout(300)
  const found = await p.evaluate(() => document.querySelector('.found:not([hidden])')?.innerText.replace(/\n/g, ' '))
  ok('ten digits come back with a name', /[A-Z]{3,} [A-Z]{3,}/.test(found ?? ''), found ?? 'nothing')
  await acct.fill('0123456799'); await p.waitForTimeout(300)
  const refused = await p.evaluate(() => ({
    err: document.querySelector('.field-error:not([hidden])')?.textContent?.trim(),
    name: !!document.querySelector('.found:not([hidden])'),
    go: !!document.querySelector('.btn-primary:not([hidden])'),
  }))
  ok('one that resolves to nobody says so, and offers no way on',
     /could not find/i.test(refused.err ?? '') && !refused.name, JSON.stringify(refused))
}

console.log('BOTH WAYS IN ARE NAMED WHERE SOMEBODY WOULD LOOK FOR THEM')
{
  // Dollars reach a Base address and naira reach a virtual account. Two
  // inbound rails described on two screens, neither mentioning the other, is
  // the same fault as one errand wearing two names.
  await at('/receive')
  const said = await p.evaluate(() => document.body.innerText.replace(/\n/g, ' · '))
  ok('Receive names the naira account as well as the address',
     /or be paid in naira/i.test(said) && /9902847713/.test(said))
  ok('and still leads with the address it is for', /your address/i.test(said))
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
