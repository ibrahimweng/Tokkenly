/* Filling a bucket from the places you would fill it, and paying for it once. */
import { chromium } from 'playwright'
import { seen, settled } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1024 } })
await seen(p)
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(6000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
const money = (s) => Number(String(s).replace(/[^0-9.]/g, '')) || 0
const count = () => p.evaluate(() => document.querySelector('.nav-bucket .count')?.textContent ?? '0')

console.log('FILLING IT')
await p.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
ok('an empty bucket says so and offers a way on',
   await p.evaluate(() => /Nothing in the bucket/.test(document.body.innerText)))
ok('the sidebar carries it on every screen', await p.evaluate(() => !!document.querySelector('.nav-bucket')))

await p.goto(B + '/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.locator('.table tbody tr').first().locator('.icon-btn').click()
await p.waitForTimeout(400)
ok('a row adds without navigating away', (await p.evaluate(() => location.hash)).includes('invest'), await p.evaluate(() => location.hash))
ok('and the count goes up', (await count()) === '1', 'count ' + (await count()))

await p.goto(B + '/invest/nvda', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.getByRole('button', { name: /Add .+ to your bucket/ }).click(); await p.waitForTimeout(500)
await p.goto(B + '/invest/googl', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.getByRole('button', { name: /Add .+ to your bucket/ }).click(); await p.waitForTimeout(500)
ok('a stock page adds too', (await count()) === '3', 'count ' + (await count()))

// The bucket buys through the same door as a single trade, so it is closed to
// the same companies. It was not: the composer refused Coca-Cola and the
// bucket bought it anyway, which made the bucket a way round every check in
// the product.
console.log('WHAT IT WILL NOT TAKE')
await p.goto(B + '/invest/ko', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const shut = await p.evaluate(() => ({
  // By accessible name, not by text. The control is a plus icon on this screen
  // now (11g.63) and prints nothing at all, so a textContent search finds
  // nothing whether the button is there or not — a check that passes by being
  // unable to see the thing it is about.
  add: [...document.querySelectorAll('button')].some((x) =>
    /Add .+ to your bucket|Add to bucket/.test((x.getAttribute('aria-label') ?? '') + ' ' + (x.textContent ?? ''))),
  said: /Not open yet/.test(document.body.innerText),
}))
ok('a company outside the launch set has no way into the bucket', !shut.add)
ok('and the page says why the button is missing', shut.said)
await p.goto(B + '/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const rowState = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('.table tbody tr')]
  const shut = rows.find((r) => /MSFTc/.test(r.textContent ?? ''))
  const open = rows.find((r) => /AAPLc/.test(r.textContent ?? ''))
  return {
    shutBtn: !!shut?.querySelector('.icon-btn'),
    shutSays: !!shut?.querySelector('.shut'),
    // A state is not a category: `.tag` is the ETF mark and nothing else, and
    // etf.mjs counts them.
    shutTagged: !!shut?.querySelector('.tag'),
    openBtn: !!open?.querySelector('.icon-btn'),
  }
})
ok('the list carries the state where the button was',
   !rowState.shutBtn && rowState.shutSays && !rowState.shutTagged, JSON.stringify(rowState))
ok('and the companies you can buy still have theirs', rowState.openBtn)
ok('nothing went in', (await count()) === '3', 'count ' + (await count()))

console.log('THE BUCKET ITSELF')
await p.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const view = await p.evaluate(() => ({
  rows: document.querySelectorAll('.bucket-row').length,
  total: [...document.querySelectorAll('.kv')].find((e) => /Total/.test(e.textContent))?.textContent,
  left: [...document.querySelectorAll('.kv')].find((e) => /Left after/.test(e.textContent))?.textContent,
  action: document.querySelector('.btn-primary')?.textContent,
}))
ok('every pick is listed', view.rows === 3, view.rows + ' rows')
ok('it says what it comes to', /\$/.test(view.total ?? ''), view.total ?? '')
ok('and what is left afterwards', /\$/.test(view.left ?? ''), view.left ?? '')

const f = p.locator('.bucket-amount').first()
await f.fill('300'); await f.dispatchEvent('change'); await p.waitForTimeout(500)
// Total now means all-in; Investment is the figure the amounts add up to.
const invested = () => p.evaluate(() =>
  [...document.querySelectorAll('.kv')].find((e) => /^Investment/.test(e.textContent))?.textContent ?? '')
ok('an amount can be changed in place', money(await invested()) === 400, await invested())

await p.locator('.bucket-row').last().locator('.icon-btn').click(); await p.waitForTimeout(500)
ok('and a pick can be taken out', (await p.evaluate(() => document.querySelectorAll('.bucket-row').length)) === 2)

console.log('OVER WHAT YOU HAVE')
const g = p.locator('.bucket-amount').first()
await g.fill('99999'); await g.dispatchEvent('change'); await p.waitForTimeout(500)
const over = await p.evaluate(() => ({
  said: document.querySelector('.field-error')?.innerText.replace(/\n/g, ' ') ?? null,
  action: document.querySelector('.btn-primary')?.textContent,
}))
ok('it says you are short rather than letting you try', over.said !== null, over.said ?? 'nothing')
ok('and offers the fix', /Add \$/.test(over.action ?? ''), over.action ?? '')
await g.fill('100'); await g.dispatchEvent('change'); await p.waitForTimeout(500)

console.log('PAYING ONCE')
const cash = async () => {
  await p.goto(B + '/transfer', { waitUntil: 'domcontentloaded' })
  return money(await settled(p, '.hero-figure'))
}
const cashBefore = await cash()
await p.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
// the all-in figure, which is what the wallet will actually be charged
const total = money(await p.evaluate(() =>
  [...document.querySelectorAll('.kv')].find((e) => /^Total/.test(e.textContent))?.textContent))
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(500)
const rev = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '')
ok('review lists every company before anything happens', /apple/i.test(rev) && /nvidia/i.test(rev), rev.slice(0, 80))
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
const doneText = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '')
ok('it confirms what arrived, company by company', /shares/.test(doneText), doneText.slice(0, 90))
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(600)
ok('the bucket empties', (await count()) === '0', 'count ' + (await count()))
const cashAfter = await cash()
ok('and cash went down by the total, once', Math.abs((cashBefore - cashAfter) - total) < 0.05,
   `${cashBefore} → ${cashAfter}, total ${total}`)
await p.goto(B + '/activity?filter=trades', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const hist = await p.evaluate(() => document.body.innerText)
ok('each company has its own receipt', /Apple/.test(hist) && /Nvidia/.test(hist))

// A bucket outlives a visit and the launch set does not. META is in the
// launch set and paused by legal in the seed, which is exactly the company
// that can be put by this morning and refused this afternoon.
console.log('PAUSED WHILE IT SAT THERE')
await p.goto(B + '/invest/meta', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.getByRole('button', { name: /Add .+ to your bucket/ }).click(); await p.waitForTimeout(500)
ok('a paused company can still be put by for later', (await count()) === '1', 'count ' + (await count()))
await p.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const held = await p.evaluate(() => ({
  said: document.querySelector('.field-error')?.innerText.replace(/\n/g, ' ') ?? null,
  row: document.querySelector('.bucket-row .warn')?.textContent ?? null,
  action: document.querySelector('.col-side .btn-primary')?.textContent,
}))
ok('the bucket says which one is in the way, on the row', /paused/i.test(held.row ?? ''), held.row ?? 'nothing')
ok('and in the summary', /paused/i.test(held.said ?? ''), held.said ?? 'nothing')
ok('and the button is the way out of it', /^Take out/.test(held.action ?? ''), held.action ?? '')

// The floor under the screen. Nothing offers this address, and pressing the
// button on the screen before it cannot reach it — which is the point.
await p.goto(B + '/bucket?sheet=bucket-review', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500)
const till = await p.evaluate(() => ({
  text: document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '',
  confirm: [...document.querySelectorAll('.scrim button')].map((x) => x.textContent ?? ''),
}))
ok('the payment itself refuses a basket it cannot buy', /Not taking this payment|Not this basket/i.test(till.text),
   till.text.slice(0, 90))
ok('and there is no confirm button in it at all',
   !till.confirm.some((t) => /^Buy all/.test(t)), till.confirm.join(' | '))
await p.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.locator('.col-side .btn-primary').click(); await p.waitForTimeout(500)
ok('taking it out leaves an empty bucket', (await count()) === '0', 'count ' + (await count()))

// A button that looks ready and refuses on press is a button that made
// somebody commit to something the product had already decided against.
console.log('NO CONNECTION')
await p.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.getByRole('button', { name: /Add .+ to your bucket/ }).click(); await p.waitForTimeout(500)
// After the navigation, not before it: `online` is read back from the browser
// on every load, so a reload would put the connection straight back.
await p.goto(B + '/bucket?sheet=bucket-review', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500)
ok('the review offers a confirm while there is a connection',
   await p.evaluate(() => [...document.querySelectorAll('.scrim button')].some((x) => /^Buy all/.test(x.textContent ?? ''))))
await p.evaluate(() => window.dispatchEvent(new Event('offline'))); await p.waitForTimeout(400)
const dark = await p.evaluate(() => ({
  text: document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '',
  buttons: [...document.querySelectorAll('.scrim button')].map((x) => x.textContent ?? ''),
}))
ok('the review says there is no connection before you press anything',
   /No connection/.test(dark.text), dark.text.slice(0, 120))
ok('and the button that cannot work is not there',
   !dark.buttons.some((t) => /^Buy all/.test(t)), dark.buttons.join(' | '))
await p.evaluate(() => window.dispatchEvent(new Event('online'))); await p.waitForTimeout(300)
const back = await p.evaluate(() =>
  [...document.querySelectorAll('.scrim button')].map((x) => x.textContent ?? ''))
ok('and it comes back when the connection does', back.some((t) => /^Buy all/.test(t)), back.join(' | '))

console.log('PHONE')
const m = await b.newPage({ viewport: { width: 390, height: 844 } })
await seen(m)
await m.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await m.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(400)
// A company page used to carry two pills and three buttons beside its name,
// which does not fit across 390 pixels — so the phone kept Buy and put the rest
// behind an overflow menu, and filling the bucket from here took two presses.
// The header is a name now and the bucket is a plus beside the price (11g.63),
// so it is one press, in the open, above the fold.
const reach = await m.evaluate(() => {
  const b = document.querySelector('.price-acts .icon-btn')
  const r = b?.getBoundingClientRect()
  return { there: !!b, onScreen: r ? r.bottom <= window.innerHeight + 1 : false,
           menu: !!document.querySelector('.head-more, .pop-row'),
           top: r ? Math.round(r.top) : null }
})
ok('the bucket is one press from a company page, in the open', reach.there && reach.onScreen,
   JSON.stringify(reach))
ok('and there is no overflow menu left to hide it in', !reach.menu)
await m.locator('.price-acts .icon-btn').click(); await m.waitForTimeout(500)
await m.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(400)
ok('the phone top bar carries the bucket', await m.evaluate(() => !!document.querySelector('.bucket-btn')))
ok('and the bucket screen does not overflow',
   (await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0)

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
