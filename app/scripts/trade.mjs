/* Buying and selling, walked the way a person walks them, on both surfaces.
   Every step asks the same three questions: can I tell what will happen, can
   I get out, and does the number that lands match the number I agreed to. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
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
  ok('and the summary follows it', after.summary.some((s) => /sh|share/i.test(s)), after.summary[0] ?? '')

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
    tick: !!document.querySelector('.tick'),
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
    await p.goto(B + '/transfer', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(350)
    return money(await p.$eval('.hero-figure', (e) => e.textContent))
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
  // Coca-Cola is in the catalogue and not in the opening holdings
  await p.goto(B + '/invest/ko/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const i = p.locator('.amount-box input')
  await i.fill('100'); await i.dispatchEvent('input'); await p.waitForTimeout(250)
  await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
  await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
  const said = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '')
  ok('it says how many shares arrived', /[\d.]+ shares of Coca-Cola/.test(said) && !/undefined/.test(said),
     said.slice(0, 70))
  await p.goto(B + '/invest/ko', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const held = await p.evaluate(() => document.body.innerText.match(/You hold[^\n]*/)?.[0] ?? 'no row')
  ok('and the position exists afterwards', !/None yet|no row/.test(held), held)
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const home = await p.evaluate(() => document.body.innerText)
  ok('the home screen opens on Simple', /Buy Stocks|Convert Cash/.test(home),
     /Buy Stocks/.test(home) ? 'gateway' : 'detailed')
  await p.close()
}

console.log('PHONE  the same two flows at 390')
for (const route of ['/invest/aapl/invest', '/invest/aapl/sell']) {
  const p = await page(390, 844)
  await p.goto(B + route, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(400)
  const m = await p.evaluate(() => {
    const btn = document.querySelector('.btn-primary')
    const r = btn?.getBoundingClientRect()
    return {
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      keypad: !!document.querySelector('.keypad'),
      buttonReachable: r ? r.bottom <= window.innerHeight + 1 : false,
      buttonBottom: r ? Math.round(r.bottom) : null,
    }
  })
  ok(route + ' does not overflow', m.overflowX === 0, 'overflowX ' + m.overflowX)
  ok(route + ' has the keypad', m.keypad)
  ok(route + ' keeps the button on screen', m.buttonReachable, 'bottom ' + m.buttonBottom)
  await p.close()
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
