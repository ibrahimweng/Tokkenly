/* The things a tokenised share needs said that a real one does not: what it
   costs against the thing it tracks, how thin the book is, who else is in it,
   and which token this actually is. Plus the chart that shows the first of
   those over time rather than only as of now. */
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
const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500) }
const num = (s) => Number((String(s ?? '').match(/-?[\d,]+\.?\d*/) ?? ['0'])[0].replace(/,/g, ''))

console.log('THE CANDLES')
await at('/invest/nke')
const c = await p.evaluate(() => ({
  candles: document.querySelectorAll('.ch-candle').length,
  wicks: document.querySelectorAll('.ch-wick').length,
  bodies: document.querySelectorAll('.ch-body').length,
  up: document.querySelectorAll('.ch-candle.up').length,
  down: document.querySelectorAll('.ch-candle.down').length,
}))
ok('every candle has a wick and a body', c.wicks === c.candles && c.bodies === c.candles,
   `${c.candles} candles`)
ok('and they run both ways', c.up > 0 && c.down > 0, `${c.up} up, ${c.down} down`)

const o = await p.evaluate(() => document.querySelector('.ch-ohlc')?.innerText.replace(/\n/g, ' ') ?? '')
ok('open, high, low and close are stated', /O\s*\$/.test(o) && /H\s*\$/.test(o) && /L\s*\$/.test(o) && /C\s*\$/.test(o), o)
const ohlc = (o.match(/\$[\d,.]+/g) ?? []).map((x) => num(x))
ok('the high is the highest of the four and the low the lowest',
   ohlc[1] === Math.max(...ohlc.slice(0, 4)) && ohlc[2] === Math.min(...ohlc.slice(0, 4)),
   ohlc.slice(0, 4).join(' / '))

const edges = await p.evaluate(() => [...document.querySelectorAll('.ch-edge')].map((e) => e.innerText))
ok('the period high and low are on the axis', edges.length === 2 && /High/.test(edges[0]), edges.join(' | '))
// the mark can sit outside the candles, and reporting it as the high would be
// reporting the wrong instrument
const markV = num(await p.evaluate(() => document.querySelector('.ch-mark-tag')?.innerText))
const highV = num(edges[0])
ok('the high is the price high, not the mark', highV !== markV || markV === 0, `high ${highV}, mark ${markV}`)
ok('the real price is drawn as its own line', await p.evaluate(() => !!document.querySelector('.ch-mark')))

console.log('THE READOUT FOLLOWS THE POINTER')
const box = await p.locator('.ch-bars').boundingBox()
await p.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5); await p.waitForTimeout(250)
const a = await p.evaluate(() => document.querySelector('.ch-ohlc')?.innerText.replace(/\n/g, ' '))
await p.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5); await p.waitForTimeout(250)
const bb = await p.evaluate(() => document.querySelector('.ch-ohlc')?.innerText.replace(/\n/g, ' '))
ok('two candles give two readouts', a !== bb, `${a}  vs  ${bb}`)
await p.mouse.move(10, 10); await p.waitForTimeout(250)
ok('and it goes back to the last candle when you leave',
   (await p.evaluate(() => document.querySelector('.ch-ohlc')?.innerText.replace(/\n/g, ' '))) === o)

console.log('WHAT IT COSTS AGAINST THE REAL SHARE')
const t = await p.evaluate(() => document.body.innerText)
ok('the stock page states the gap and the real price', /the real Nike price/.test(t) && /\$80\.33/.test(t))
const tf = await p.evaluate(() => [...document.querySelectorAll('.tf')].map((e) => e.innerText.replace(/\n/g, ' ')))
ok('four windows, not one', tf.length === 4, tf.join(' | '))
ok('and they are all different', new Set(tf.map((x) => x.split(' ')[1])).size > 1)

console.log('THE BOOK, AND THE TOKEN')
ok('liquidity is stated', /Liquidity/.test(t) && /\$61,000/.test(t))
ok('and what it means for an order', /move the price against you|fills at the price you see/.test(t),
   (t.match(/(Thin|Deep)[^\n]*/) ?? [''])[0])
ok('holders and their change', /Holders/.test(t) && /4,260/.test(t) && /\+2\.9%/.test(t))
const addr = await p.evaluate(() => document.querySelector('.addr')?.innerText.replace(/\n/g, ' ').trim())
ok('the token address is shown, middle-elided', /^\w{6}…\w{4}$/.test(addr ?? ''), addr ?? 'missing')

console.log('IN THE LIST, AND BEFORE YOU BUY')
await at('/invest')
const head = await p.evaluate(() => document.querySelector('.table thead')?.innerText.replace(/\s+/g, ' '))
ok('the list carries vs real and holders', /VS REAL/.test(head ?? '') && /HOLDERS/.test(head ?? ''), head ?? '')
await p.getByRole('button', { name: 'Sort by vs real' }).click(); await p.waitForTimeout(400)
ok('and you can order by it', (await p.evaluate(() => location.hash)).includes('sort=disc'),
   await p.evaluate(() => location.hash))
await at('/invest/nke/invest')
ok('the buy screen states it', /the real price/i.test(await p.evaluate(() => document.body.innerText)))
// Nike is listed but outside the launch set, so its button is refused — which
// is the product working, and why the review has to be reached on a company
// that can actually be bought. Alphabet is in the launch set and trades below
// the real share, so the gap is there to be carried.
await at('/invest/googl/invest')
await p.locator('.amount-box input').fill('50')
await p.locator('.amount-box input').dispatchEvent('input')
await p.waitForTimeout(250)
await p.locator('.content .btn-primary').last().click(); await p.waitForTimeout(450)
const rev = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '')
ok('and the review carries it beside the fee', /real price/i.test(rev) && /\$166\.77/.test(rev),
   (rev.match(/(BELOW|ABOVE) THE REAL PRICE[^%]*%/i) ?? [''])[0].trim())

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
