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
  // The rails are tabs now, and there are three: a bank transfer, a Base
  // address and a card. Card funding is switched off in the seeded console, so
  // two of them show — which is the switch working, not a missing tab.
  const rails = await p.evaluate(() => [...document.querySelectorAll('.content > .chip-row .chip')].map((e) => ({
    text: e.textContent.trim(), on: e.getAttribute('aria-pressed') === 'true',
  })))
  ok('the ways in are tabs on the screen, not behind a dropdown', rails.length >= 2,
     rails.map((r) => r.text).join(' | '))
  ok('and a bank transfer is one of them, first',
     rails[0].text === 'Bank transfer' && rails[0].on)
  ok('and the Base address is another', rails.some((r) => r.text === 'Base'))
  // Neither of the two asks how much before it says where. The bank tab does
  // carry an amount further down — "I have sent it", which is how a naira
  // transfer gets matched to a dollar credit — but it sits under the account
  // number rather than in front of it, and the Base tab has none at all. So
  // the question is document order, not presence.
  const gated = () => p.evaluate(() => {
    const box = document.querySelector('.amount-box')
    if (!box) return false
    const details = document.querySelector('.va-number, .qr, .addr')
    return !details || !!(box.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  const bankGated = await gated()
  await at('/addmoney?tab=base')
  const baseGated = await gated()
  ok('and neither of them asks for an amount before it says where to pay',
     !bankGated && !baseGated, `bank ${bankGated}, base ${baseGated}`)
  await at('/addmoney')
  // The card rail ships switched off, so this is also the first proof that
  // the console is not decoration: what operations sets is what a customer
  // meets, on the same render.
  // By name rather than by index: the rails were two and are three, and a test
  // that counts positions breaks every time one is added.
  const cardTab = rails.find((r) => /^Card/.test(r.text))
  ok('a rail operations has switched off reads as off rather than vanishing',
     !!cardTab && /Paused/.test(cardTab.text) && !cardTab.on,
     cardTab ? cardTab.text : 'the card tab is not on the screen at all')

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
  // Notices are rows in the one feed now (11g.48), reached by its own filter
  // rather than by a list of their own. Newest first, so the transfer that
  // just landed is the row on top.
  await at('/activity?filter=alerts')
  const top = await p.evaluate(() => {
    const row = document.querySelector('.feed-row')
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
    const row = [...document.querySelectorAll('.feed-row')]
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
  // The rails are tabs rather than cards now, so the proof that the switch
  // reached the customer is the tab losing its Paused label and becoming
  // pressable, on the same render.
  const tabs = await p.evaluate(() => [...document.querySelectorAll('.content > .chip-row .chip')].map((e) => ({
    text: e.textContent.trim(), off: e.classList.contains('off'), dead: e.hasAttribute('disabled'),
  })))
  const cardTab2 = tabs.find((t) => /^Card/.test(t.text))
  ok('and the customer screen shows it on the very next render',
     !!cardTab2 && !cardTab2.off && !cardTab2.dead && !/Paused/.test(cardTab2.text),
     cardTab2 ? cardTab2.text : 'no card tab')

  const before = await cash()
  await at('/addmoney?tab=card')
  await amount(100)
  // Every cost in money, once (rule 10): the fee is naira on the composer,
  // beside the naira it is added to, and the two come to the figure on the
  // button. A percentage belongs on the row that describes the rail, not on
  // the thing you are about to pay.
  const paying = await p.evaluate(() => ({
    text: document.querySelector('.content')?.innerText.replace(/\n/g, ' · ') ?? '',
    action: document.querySelector('.card .btn-primary')?.textContent ?? '',
  }))
  const naira = (re) => Number((paying.text.match(re) ?? ['', '0'])[1].replace(/,/g, ''))
  const forDollars = naira(/₦([\d,]+) for the dollars/)
  const fee = naira(/₦([\d,]+) card fee/)
  ok('the card fee is a figure on the composer, not a footnote',
     fee > 0, (paying.text.match(/₦[\d,]+ card fee/) ?? ['missing'])[0])
  ok('and what you press is the two of them added up',
     forDollars > 0 && Math.abs(Number(paying.action.replace(/[^\d]/g, '')) - (forDollars + fee)) < 1,
     `${forDollars} + ${fee} vs ${paying.action}`)
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
  // inbound rails described on two screens, neither mentioning the other, was
  // the same fault as one errand wearing two names. They are three tabs on one
  // screen now (11g.47), so the other ways in are not referred to in a
  // sentence — they are on the screen, named and one press away. /receive is
  // that screen opened on its Base tab.
  await at('/receive')
  const said = await p.evaluate(() => document.body.innerText.replace(/\n/g, ' · '))
  ok('Receive names the other ways in rather than describing them',
     /Bank transfer/.test(said) && /Card/.test(said) && /Naira from any Nigerian bank/.test(said))
  ok('and still leads with the address it is for', /your address/i.test(said))
  // One screen, one name. The trail said "Receive money" over a title reading
  // "Add money" until 11g.50 — two names for a place a person is standing in.
  const named = await p.evaluate(() => ({
    crumbs: [...document.querySelectorAll('.crumbs .crumb')].map((e) => e.textContent.trim()),
    h1: document.querySelector('h1')?.textContent?.trim(),
  }))
  ok('and the trail above it does not call it something else',
     named.h1 === 'Add money' && !named.crumbs.includes('Receive money'),
     named.crumbs.join(' > ') + ' / ' + named.h1)
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
