/* Buying and selling, walked the way a person walks them, on both surfaces.
   Every step asks the same three questions: can I tell what will happen, can
   I get out, and does the number that lands match the number I agreed to. */
import { chromium } from 'playwright'
import { seen, settled } from './seen.mjs'
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
const money = (s) => Number(String(s).replace(/[^0-9.]/g, '')) || 0

for (const [flow, route, verb] of [['BUY', '/invest/aapl/invest', 'Buy'], ['SELL', '/invest/aapl/sell', 'Sell']]) {
  console.log(flow + '  ' + route)
  const p = await page()
  await p.goto(B + route, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(400)

  const shape = await p.evaluate(() => ({
    title: document.querySelector('h1,.sheet-head h2')?.textContent,
    amount: document.querySelector('.amount-box input')?.value,
    quick: [...document.querySelectorAll('.chip-row .chip')].map((e) => e.textContent),
    summary: [...document.querySelectorAll('.kv')].map((e) => e.textContent).slice(0, 6),
    action: document.querySelector('.btn-primary')?.textContent,
    canLeave: !!document.querySelector('.close, .crumb, .btn-quiet'),
    keypad: !!document.querySelector('.keypad'),
  }))
  ok('the screen says what it is', !!shape.title, shape.title ?? '')
  ok('it opens with an amount already in', money(shape.amount) > 0, shape.amount ?? '')
  ok('there are quick amounts', shape.quick.length >= 3, shape.quick.join(' '))
  ok('the button names the action and the figure', /\$/.test(shape.action ?? ''), shape.action ?? '')
  ok('there is a way out', shape.canLeave)

  /* the number you type is the number the button offers */
  const input = p.locator('.amount-box input')
  await input.fill('75')
  await input.dispatchEvent('input')
  await p.waitForTimeout(250)
  const after = await p.evaluate(() => ({
    action: document.querySelector('.btn-primary')?.textContent,
    summary: [...document.querySelectorAll('.summary .kv')].map((e) => e.textContent),
  }))
  ok('typing an amount moves the button', /75/.test(after.action ?? ''), after.action ?? '')
// The summary names the token you end up holding rather than "shares": what
// arrives in the wallet is AAPLc, and the review says so.
  ok('and the summary follows it', after.summary.some((s) => /[A-Z]{2,5}c\b/.test(s)),
     after.summary.join(' | ').slice(0, 90))

  /* over the limit */
  await input.fill('999999')
  await input.dispatchEvent('input')
  await p.waitForTimeout(250)
  const over = await p.evaluate(() => ({
    // what the button offers is the figure that will actually be used
    action: document.querySelector('.btn-primary')?.textContent,
    disabled: document.querySelector('.btn-primary')?.hasAttribute('disabled'),
    said: document.querySelector('.field-error:not([hidden])')?.innerText.replace(/\n/g, ' ') ?? null,
  }))
  ok('asking for more than you have is capped', money(over.action) < 999999, over.action ?? '')
  ok('and it says so rather than shrinking in silence', over.said !== null, over.said ?? 'nothing said')

  /* zero */
  await input.fill('0')
  await input.dispatchEvent('input')
  await p.waitForTimeout(250)
  const zero = await p.evaluate(() => ({
    disabled: document.querySelector('.btn-primary')?.hasAttribute('disabled'),
    action: document.querySelector('.btn-primary')?.textContent,
  }))
  ok('nothing is not an order', zero.disabled === true, `disabled ${zero.disabled}, "${zero.action}"`)

  /* the real thing, end to end */
  await input.fill('120')
  await input.dispatchEvent('input')
  await p.waitForTimeout(250)
  await p.locator('.btn-primary').first().click()
  await p.waitForTimeout(400)
  const rev = await p.evaluate(() => ({
    open: !!document.querySelector('.scrim'),
    rows: [...document.querySelectorAll('.scrim .kv, .scrim .panel .cell')].map((e) => e.innerText.replace(/\n/g, ' ')),
    confirm: document.querySelector('.scrim .btn-primary')?.textContent,
    back: !!document.querySelector('.scrim .close, .scrim .btn-quiet'),
  }))
  ok('review opens before anything happens', rev.open)
  ok('review restates the figure', rev.rows.join(' ').includes('120') || (rev.confirm ?? '').includes('120'),
     rev.rows.slice(0, 3).join(' | '))
  ok('review can be backed out of', rev.back)

  const before = await p.evaluate(() => document.body.innerText)
  await p.locator('.scrim .btn-primary').first().click()
  await p.waitForTimeout(900)
  const done = await p.evaluate(() => ({
    open: !!document.querySelector('.scrim'),
    // A settled outcome celebrates with the coin; the tick is what an
    // unsettled one keeps, because a coin turning happily over "Still
    // settling" would be the product cheering its own failure.
    tick: !!document.querySelector('.coin, .tick'),
    text: document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ').slice(0, 90),
    toast: document.querySelector('.toast')?.textContent,
    url: location.hash,
  }))
  ok('it confirms it happened', done.tick || !!done.toast, done.text ?? done.toast ?? 'nothing')
  ok('no error thrown', errs.length === 0, errs[0] ?? '')
  await p.close()
}

console.log('AFTER THE TRADE  the ledger has to agree')
{
  const p = await page()
  const cash = async () => {
    await p.goto(B + '/transfer', { waitUntil: 'domcontentloaded' })
    return money(await settled(p, '.hero-figure'))
  }
  const before = await cash()
  await p.goto(B + '/invest/nvda/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const i = p.locator('.amount-box input')
  await i.fill('200'); await i.dispatchEvent('input'); await p.waitForTimeout(250)
  await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
  await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
  const after = await cash()
  // 200 invested plus the 0.5% fee: the ledger charges the total, not the amount
  ok('cash went down by the investment and its fee', Math.abs((before - after) - 201) < 0.02,
     `${before} → ${after}, expected −201.00`)
  await p.goto(B + '/activity?filter=trades', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const rows = await p.evaluate(() => document.body.innerText)
  ok('the trade is in history at what it cost', /Nvidia|NVDA/.test(rows) && /201\.00/.test(rows))
  await p.close()
}

console.log('A FIRST BUY  the one the whole product is for')
{
  const p = await page()
  // Alphabet is in the launch set, not paused, and not in the opening
  // holdings, which is what a first buy needs: a company the account can
  // actually buy and has never held. Coca-Cola was none of those — it is
  // listed but outside the launch set, so the button was rightly disabled and
  // this suite had been dead for tiers.
  await p.goto(B + '/invest/googl/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const i = p.locator('.amount-box input')
  await i.fill('100'); await i.dispatchEvent('input'); await p.waitForTimeout(250)
  await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
  await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
  const said = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '')
  ok('it says how many shares arrived', /[\d.]+ shares of Alphabet/.test(said) && !/undefined/.test(said),
     said.slice(0, 70))
  await p.goto(B + '/invest/googl', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const held = await p.evaluate(() => document.body.innerText.match(/You hold[^\n]*/)?.[0] ?? 'no row')
  ok('and the position exists afterwards', !/None yet|no row/.test(held), held)
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const home = await p.evaluate(() => document.body.innerText)
  // The doors carry the names of the places they open now (11g.45), so the
  // gateway is recognised by those rather than by the action labels it used
  // to wear.
  ok('the home screen opens on Simple', /Invest[\s\S]*Wallet[\s\S]*Borrow & Lend/.test(home),
     /Invest/.test(home) ? 'gateway' : 'detailed')
  await p.close()
}

console.log('PHONE  the same two flows at 390')
for (const route of ['/invest/aapl/invest', '/invest/aapl/sell']) {
  const p = await page(390, 844)
  await p.goto(B + route, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(400)
  const m = await p.evaluate(() => {
    // The composer's own button, not the first primary in the document. On a
    // phone the composer is a dialog over the company page, and that page has
    // primaries of its own — so this read `.btn-primary` and got the *page's*
    // Buy, which used to sit in the header at bottom 164 and passed happily
    // while the button this check is named after sat below the fold. A check
    // that measures the wrong element agrees with itself forever. Rule 146.
    const sheet = document.querySelector('.scrim .sheet')
    const btn = (sheet ?? document).querySelector('.btn-primary')
    const r = btn?.getBoundingClientRect()
    const s = sheet
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      keypad: !!document.querySelector('.keypad'),
      buttonReachable: r ? r.bottom <= window.innerHeight + 1 : false,
      buttonBottom: r ? Math.round(r.bottom) : null,
      buttonIs: btn?.textContent?.trim().slice(0, 24) ?? null,
      dialogOverflow: s ? s.scrollHeight - s.clientHeight : 0,
    }
  })
  ok(route + ' does not hide its action inside a scroll', m.dialogOverflow <= 2,
     m.dialogOverflow + 'px of the dialog is below its own fold')
  ok(route + ' does not overflow', m.overflowX === 0, 'overflowX ' + m.overflowX)
  ok(route + ' has the keypad', m.keypad)
  ok(route + ' keeps the button on screen', m.buttonReachable,
     (m.buttonIs ?? 'no button') + ' at bottom ' + m.buttonBottom)
  await p.close()
}

/* A COMPANY PAGE  a name, the market beside it, and one Buy
   -----------------------------------------------------------------------
   The header carried a kind, a trading state, Follow, Add to bucket and Buy:
   five things beside a name, two of which were never controls. It is a name
   now, and each of the five is where it belongs — 11g.63. */
console.log('A COMPANY PAGE  a name, the market beside it, and one Buy')
{
  const p = await page(1280, 1000)
  await p.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const m = await p.evaluate(() => {
    const head = document.querySelector('.page-header')
    const token = [...document.querySelectorAll('.col-main section.card')][1]
    return {
      headControls: [...head.querySelectorAll('button, a')]
        .filter((e) => !e.closest('.crumbs')).map((e) => e.textContent.trim()),
      priceActs: [...document.querySelectorAll('.price-acts > *')]
        .map((e) => e.textContent.trim() || e.getAttribute('aria-label')),
      plusIsIcon: !!document.querySelector('.price-acts .icon-btn')
        && !document.querySelector('.price-acts .icon-btn').textContent.trim(),
      tokenRows: [...token.querySelectorAll('.kv')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
      pills: [...document.querySelectorAll('.page-header .pill')].map((e) => e.textContent.trim()),
      cells: document.querySelectorAll('.co-cell').length,
      sparks: document.querySelectorAll('.co-cell .spark svg').length,
      lit: document.querySelector('.co-cell.on')?.textContent?.replace(/\s+/g, ' ').trim(),
      buys: [...document.querySelectorAll('main .btn-primary')]
        .map((e) => e.textContent.trim()).filter((t) => /^Buy /.test(t)),
    }
  })
  ok('the header is a name and nothing else', m.headControls.length === 0, m.headControls.join(' | '))
  ok('and the two states are not pills up there any more', m.pills.length === 0, m.pills.join(' | '))
  ok('they are rows in the card that explains the token',
     m.tokenRows.some((r) => /^Kind/.test(r)) && m.tokenRows.some((r) => /^TradingOpen for trading/.test(r)),
     m.tokenRows.slice(0, 3).join(' | '))
  ok('Follow and the bucket sit beside the price',
     m.priceActs.length === 2 && /Follow/.test(m.priceActs[0]) && /bucket/.test(m.priceActs[1] ?? ''),
     m.priceActs.join(' | '))
  // The same control the list carries. A labelled button here was a second
  // call to action standing next to the purchase.
  ok('and the bucket is a plus, with its name said out loud rather than printed',
     m.plusIsIcon, m.priceActs[1])
  ok('the market comes with you, all thirteen', m.cells === 13, m.cells + ' cells')
  ok('each with its own year drawn beside it', m.sparks === 13, m.sparks + ' sparklines')
  ok('and the one you are on is lit', /Apple/.test(m.lit ?? ''), m.lit)
  // Buy was on this screen twice: once in the header and once on the position.
  ok('Buy is on the screen exactly once', m.buys.length === 1, m.buys.join(' | '))

  // Left and right page between companies, which is what makes the strip a
  // way through the market rather than a decoration.
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(420)
  const fwd = await p.evaluate(() => location.hash)
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(420)
  const back = await p.evaluate(() => location.hash)
  ok('the arrows page between companies, one press at a time',
     fwd === '#/invest/nvda' && back === '#/invest/aapl', fwd + ' then ' + back)
  // A dialog owns the keyboard while it is open.
  await p.goto(B + '/invest/aapl?sheet=jump'); await p.waitForTimeout(500)
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400)
  ok('and a dialog keeps them while it is open',
     (await p.evaluate(() => location.hash)).startsWith('#/invest/aapl'),
     await p.evaluate(() => location.hash))
  await p.close()
}
{
  const p = await page(390, 844)
  await p.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const m = await p.evaluate(() => {
    const bar = document.querySelector('.buy-bar')
    const r = bar?.getBoundingClientRect()
    return {
      bar: !!bar, onScreen: r ? r.bottom <= window.innerHeight + 1 : false,
      buys: [...document.querySelectorAll('main .btn-primary')]
        .map((e) => e.textContent.trim()).filter((t) => /^Buy /.test(t)),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  // The position card is the last of six on a phone and its button landed
  // 2,876 pixels down. The bar is that button, moved to where a thumb is —
  // and the card gives it up, so Buy is in one place at either width.
  ok('a phone stands Buy at the foot of the screen', m.bar && m.onScreen, JSON.stringify(m))
  ok('and still only once', m.buys.length === 1, m.buys.join(' | '))
  ok('the strip does not push the page sideways', m.overflowX === 0, 'overflowX ' + m.overflowX)
  await p.close()
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
