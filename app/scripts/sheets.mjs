/* How tall every dialog in the product is.

   Two of them used to be the tallest things in the app: the review where money
   is agreed to, and the receipt that is the record of it. Both scrolled on a
   phone, which on those two screens is the worst place in the product to put a
   line below a fold. The rule this holds: no dialog scrolls on a 390 x 844
   phone, and none of them is more than about four fifths of that screen. */
import { B, launch, check, teardown } from './lib/harness.mjs'
import { seen } from './lib/seen.mjs'

const b = await launch()
const errs = []
const ok = check

/* "more" is not on this list. It is a dialog on a desktop and it is not one on
   a phone: down there the nav bar's own capsule becomes the list, in place,
   with no scrim over the screen (11g.54). A list that is a dialog at one width
   and a menu at another cannot be checked by a sweep that asserts a dialog at
   both, so it is checked where it lives — phone-flows walks it open, into a
   place and shut again. */
const ROUTES = [
  ['/?sheet=jump', 'jump'], ['/?sheet=card', 'card'],
  ['/?sheet=put-away&task=verify', 'put-away'], ['/?sheet=pick-who', 'pick-who'],
  ['/activity?sheet=receipt&ref=TKN-8E4J77', 'receipt of a trade'],
  ['/activity?sheet=receipt&ref=TKN-8F2K90', 'receipt of a payment'],
  ['/activity?sheet=export', 'export'],
  ['/account/support?sheet=contact', 'contact'],
  ['/account/details?sheet=edit&field=email', 'edit'],
  ['/account/security?sheet=pin', 'pin'],
  ['/account/security?sheet=password', 'password'],
  ['/account/security?sheet=phrase', 'phrase'],
  ['/account/legal?sheet=close', 'close'],
  ['/transfer?sheet=banks', 'banks'],
  // Add money, a tab at a time. The Base tab is the tall one — a code, an
  // address, a warning and what has already arrived — and it is the one that
  // decides how much of any of that the dialog can hold.
  // `add-money` was two rows here. It is not a dialog any more (11g.80): it
  // had no caller, and 11g.61 had already settled that Add money asks which of
  // three ways before it answers, which is a page. The three ways are covered
  // at /addmoney/bank, /addmoney/base and /addmoney/card by `inflow.mjs`.
  ['/send?to=Tunde%20Bakare&sheet=send-review&v=120', 'send-review'],
  // The same review, on the rail that changes currency. It holds a rate and
  // states one, which the other two do not, so it is a different dialog in
  // everything but its name and has to be measured as one.
  ['/send?rail=bank&to=gt&sheet=send-review&v=200', 'send-review to a bank'],
  ['/addmoney?sheet=transfer-review&v=200', 'transfer-review'],
  ['/addmoney?via=card&sheet=card-review&v=200', 'card-review'],
  ['/addmoney?sheet=add-waiting&ref=TKN-6C9H77', 'add-waiting'],
  ['/transfer?sheet=cards', 'cards'],
  ['/invest/aapl/invest?sheet=invest-review&v=200&t=AAPL', 'invest-review'],
  ['/invest/aapl/sell?sheet=sell-review&v=200&t=AAPL', 'sell-review'],
  ['/invest/aapl/send?to=Tunde%20Bakare&sheet=shares-review&v=224.1&t=AAPL', 'shares-review'],
  ['/grow/borrow?sheet=borrow-review&v=300', 'borrow-review'],
  ['/grow/repay?sheet=repay-review&v=100', 'repay-review'],
  ['/grow/earn?sheet=earn-review&v=300', 'earn-review'],
  ['/grow/takeout?sheet=takeout-review&v=300', 'takeout-review'],
]

for (const [w, hh, tag] of [[1440, 1000, 'DESKTOP'], [390, 844, 'PHONE']]) {
  const p = await b.newPage({ viewport: { width: w, height: hh } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(6000)
  const out = []
  for (const [r, name] of ROUTES) {
    await p.goto(B + r, { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(400)
    const d = await p.evaluate(() => {
      // A descendant, not a direct child. A confirmation that is glad about
      // itself is wrapped so its beam has somewhere outside the panel to
      // breathe (11g.62), which puts the panel one level down — and a check
      // that insists on the old depth reports the dialog as missing when it is
      // sitting right there. `.sheet` is the panel's own class either way; a
      // scrim holds nothing else wearing it.
      const s = document.querySelector('.scrim .sheet')
      if (!s) return null
      return { h: Math.round(s.getBoundingClientRect().height), scrolls: s.scrollHeight - s.clientHeight > 2 }
    })
    out.push({ name, ...(d ?? { h: 0, scrolls: false, missing: true }) })
  }
  console.log(tag + '  ' + w + ' x ' + hh)
  ok('every dialog opens', !out.some((o) => o.missing),
     out.filter((o) => o.missing).map((o) => o.name).join(', ') || 'all ' + out.length)
  const scroll = out.filter((o) => o.scrolls)
  ok('none of them scrolls', scroll.length === 0,
     scroll.map((o) => `${o.name} ${o.h}`).join(', ') || 'none')
  const cap = Math.round(hh * 0.82)
  const tall = out.filter((o) => o.h > cap)
  ok(`none is over ${cap} tall`, tall.length === 0,
     tall.map((o) => `${o.name} ${o.h}`).join(', ') || 'tallest ' +
       Math.max(...out.map((o) => o.h)) + ' (' + out.slice().sort((a, c) => c.h - a.h)[0].name + ')')
  await p.close()
}

console.log('WHAT FOLDS AND WHAT DOES NOT')
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(420) }

  await at('/activity?sheet=receipt&ref=TKN-8E4J77')
  const shown = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' · ') ?? '')
  // What somebody opens a receipt to check, and nothing else.
  ok('a record shows the four facts it is opened for',
     /TO/.test(shown) && /SHARES/.test(shown) && /TOTAL/.test(shown) && /REFERENCE/.test(shown))
  ok('and folds the arithmetic behind them',
     !/PRICE EACH/.test(shown) && !/YOU HOLD NOW/.test(shown) &&
     (await p.locator('.panel-more').count()) === 1, shown.slice(0, 100))
  await p.locator('.panel-more').click(); await p.waitForTimeout(300)
  const all = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' · ') ?? '')
  ok('one press brings the rest back', /PRICE EACH/.test(all) && /FEE/.test(all) && /YOU HOLD NOW/.test(all))
  ok('and says which way it is pointing',
     (await p.locator('.panel-more').getAttribute('aria-expanded')) === 'true')

  // A review is agreed to, not read. Every term it asks agreement to is on it.
  await at('/invest/aapl/invest?sheet=invest-review&v=200&t=AAPL')
  const rev = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' · ') ?? '')
  ok('a review folds nothing', (await p.locator('.panel-more').count()) === 0)
  ok('and still states every term',
     /INVESTMENT/.test(rev) && /FEE/.test(rev) && /TOTAL/.test(rev) &&
     // "Above/Below the real price" — the same words the composer behind this
     // dialog uses, because the product stopped carrying two independent
     // prices and stopped giving the one it has two names. The source is
     // still named, in the value rather than the label.
     /YOU RECEIVE/.test(rev) && /THE REAL PRICE/.test(rev) && /Chainlink/.test(rev) &&
     /AT LEAST/.test(rev) &&
     /PRICE IMPACT/.test(rev), rev.slice(0, 90))
  // Past four facts the rows pair up, which is what bought the height back.
  ok('past four facts the rows pair up',
     (await p.locator('.panel.pairs').count()) === 1)
  await p.close()
}

console.log('THE OUTCOME  a coin, and only when there is something to celebrate')
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  const buy = async (amount) => {
    await p.goto(B + '/invest/aapl/invest', { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(400)
    const i = p.locator('.amount-box input')
    await i.fill(String(amount)); await i.dispatchEvent('input'); await p.waitForTimeout(250)
    await p.locator('.col-compose .btn-primary').first().click(); await p.waitForTimeout(400)
    await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
  }
  await buy(200)
  ok('a trade that settled turns a coin',
     (await p.locator('.coin canvas').count()) === 1 && (await p.locator('.tick').count()) === 0)
  // And breathes, around the outside (11g.62). The coin is the moment landing;
  // the beam is the frame being pleased about it, and they are both here on
  // purpose. The wrapper has to be outside the sheet: two of the three layers
  // sit behind the panel and bloom past its edge, and the sheet is a scrolling
  // box that would crop them to nothing.
  ok('and the sheet breathes a beam around itself',
     (await p.locator('.beam > .sheet.sheet-glad').count()) === 1)
  const layers = await p.evaluate(() => {
    const w = document.querySelector('.beam')
    return [getComputedStyle(w, '::after').opacity, getComputedStyle(w, '::before').opacity,
            getComputedStyle(document.querySelector('.beam-bloom')).opacity].map(Number)
  })
  ok('all three of its layers are painting', layers.every((n) => n > 0), layers.join(' / '))
  // The halo has to reach past the sheet or none of it is ever seen: it sits
  // behind an opaque panel and only the spill shows. The first port scaled the
  // layers by 0.9 the way the component it came from does, which on a 675px
  // sheet put the whole halo *inside* the panel — visible in a screenshot only
  // as the absence of a glow, which is the easiest kind of fault to ship.
  const spill = await p.evaluate(() => {
    const s = document.querySelector('.beam > .sheet').getBoundingClientRect()
    const h = document.querySelector('.beam-bloom').getBoundingClientRect()
    return { x: Math.round((h.width - s.width) / 2), y: Math.round((h.height - s.height) / 2) }
  })
  ok('and the halo reaches past the sheet on both axes', spill.x > 8 && spill.y > 8,
     `${spill.x}px across, ${spill.y}px down`)
  // Seventeen numbers on seventeen periods, none of them a multiple of another.
  // If the frame loop is not running they hold still, and the beam is a static
  // green edge rather than a breath.
  //
  // Sampled five times rather than twice. Two reads 1,500ms apart can land on
  // the same rounded value — seventeen superimposed periods come back past
  // where they were, and this suite failed once on `1.213 -> 1.213` with the
  // loop running perfectly well. A test that calls a working product broken
  // one run in twenty is a test people learn to re-run rather than read.
  const bw = async () => p.evaluate(() =>
    getComputedStyle(document.querySelector('.beam')).getPropertyValue('--bw1').trim())
  const reads = []
  for (let i = 0; i < 5; i++) { reads.push(await bw()); if (i < 4) await p.waitForTimeout(400) }
  ok('and the breath is actually moving',
     !!reads[0] && new Set(reads).size > 1, reads.join(' -> '))
  ok('and the gradient it replaced is gone',
     (await p.evaluate(() => getComputedStyle(document.querySelector('.sheet-done'), '::before').content)) === 'none')
  ok('the coin is not read out to anybody',
     (await p.locator('.coin').getAttribute('aria-hidden')) === 'true')
  // Sampled over a turn and taken at its widest: read at one arbitrary moment
  // the coin is as likely to be edge on, which is nineteen dots in a column.
  const lit = async () => p.evaluate(() => {
    const c = document.querySelector('.coin canvas')
    const g = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    let on = 0
    for (let i = 3; i < g.length; i += 4) if (g[i] > 8) on++
    return on
  })
  const seen2 = []
  for (let k = 0; k < 9; k++) { seen2.push(await lit()); await p.waitForTimeout(160) }
  const wide = Math.max(...seen2)
  ok('and it is actually turning', wide > 1200 && Math.min(...seen2) < wide * 0.6,
     `${Math.min(...seen2)} to ${wide} lit pixels across a turn`)
  // .98 goes unanswered, and a coin turning over "Still settling" would be the
  // product celebrating its own failure.
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  await buy(200.98)
  const said = await p.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' ') ?? '')
  ok('one that did not come back confirmed does not', /Still settling/.test(said) &&
     (await p.locator('.coin').count()) === 0 && (await p.locator('.tick').count()) === 1, said.slice(0, 46))
  ok('and it is not framed in green either', (await p.locator('.beam').count()) === 0)
  await p.close()
}

console.log('\nerrors:', errs.length ? errs : 'none')
await teardown(b)
