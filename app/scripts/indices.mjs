/* The three indices, opened.

   Invest carried three numbers with nothing behind them — the only figures on
   a screen where everything else leads somewhere. Each is a page now, and this
   suite holds the two claims those pages make.

   The first is navigational: three pages, a pager that names all three, Next
   and Previous that wrap, and the same arrow keys and swipe every other set in
   the product answers to.

   The second is the awkward one, and it is the reason this file exists.
   Tokkenly lists thirteen instruments and the S&P has five hundred, so most of
   what these tables show cannot be bought. A row it lists opens and offers a
   plus. A row it does not says so and goes nowhere. The failure mode worth
   guarding is the tempting one: making twenty dead rows look live. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const page = async (w = 1280, h = 1000) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(6000)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return p
}
const hash = (p) => p.evaluate(() => location.hash)

console.log('THE THREE CARDS  numbers that lead somewhere')
{
  const p = await page()
  await p.goto(B + '/invest', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const cards = await p.evaluate(() => [...document.querySelectorAll('.indices .card')].map((e) => ({
    door: e.classList.contains('door-card'), role: e.getAttribute('role'), tab: e.tabIndex,
    says: /on Tokkenly/.test(e.textContent),
  })))
  ok('all three open', cards.length === 3 && cards.every((c) => c.door && c.role === 'link'),
     JSON.stringify(cards[0] ?? {}))
  // A card somebody can press with a mouse and not with a keyboard is a card
  // half the product's own a11y suite exists to stop.
  ok('and are reachable without a pointer', cards.every((c) => c.tab === 0))
  ok('and say what is behind them before they are pressed', cards.every((c) => c.says))
  await p.locator('.indices .card', { hasText: 'S&P 500' }).click()
  await p.waitForTimeout(500)
  ok('pressing one lands on its page', (await hash(p)) === '#/invest/index/sp500', await hash(p))
  ok('and the trail says where that is',
     (await p.evaluate(() => [...document.querySelectorAll('.crumbs .crumb')]
       .map((e) => e.textContent.trim()).join(' > '))) === 'Invest > S&P 500')
  await p.close()
}

console.log('THE PAGER  press next, and next again')
{
  const p = await page()
  await p.goto(B + '/invest/index/sp500', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  ok('all three are named at the top',
     (await p.evaluate(() => [...document.querySelectorAll('.pager-tab')]
       .map((e) => e.textContent.trim()).join('|'))) === 'S&P 500|Nasdaq-100|Dow Jones')
  const next = async () => { await p.locator('.pager-step').last().click(); await p.waitForTimeout(420) }
  await next(); const one = await hash(p)
  await next(); const two = await hash(p)
  await next(); const three = await hash(p)
  ok('Next walks the three', one === '#/invest/index/nasdaq' && two === '#/invest/index/dow',
     one + ' then ' + two)
  // Three pages that stop dead at the third read as broken rather than as
  // finished, and Next is the control this page was asked for.
  ok('and wraps rather than stopping dead', three === '#/invest/index/sp500', three)
  await p.locator('.pager-step').first().click(); await p.waitForTimeout(420)
  ok('Previous goes the other way', (await hash(p)) === '#/invest/index/dow', await hash(p))
  await p.locator('.pager-tab', { hasText: 'Nasdaq-100' }).click(); await p.waitForTimeout(420)
  ok('and a name goes straight there', (await hash(p)) === '#/invest/index/nasdaq', await hash(p))
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(420)
  ok('the arrow keys page as well', (await hash(p)) === '#/invest/index/sp500', await hash(p))
  await p.goto(B + '/invest/index/sp500?sheet=jump'); await p.waitForTimeout(500)
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400)
  ok('and a dialog keeps them while it is open',
     (await hash(p)).startsWith('#/invest/index/sp500'), await hash(p))
  await p.close()
}

console.log('WHAT IS IN IT  and what can actually be bought')
{
  const p = await page()
  await p.goto(B + '/invest/index/sp500', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const t = await p.evaluate(() => {
    const trs = [...document.querySelectorAll('.table tbody tr')]
    const w = trs.map((r) => parseFloat(r.children[2].textContent))
    return {
      n: trs.length,
      first: trs[0].querySelector('.t-body-strong')?.textContent?.trim(),
      ordered: w.every((v, i) => i === 0 || v <= w[i - 1] + 0.001),
      plus: trs.filter((r) => r.querySelector('.icon-btn')).length,
      shut: trs.filter((r) => r.querySelector('.shut')).length,
      // Every row is one or the other. A row with neither is a row that says
      // nothing about whether it can be bought, which is the state this table
      // must never be in.
      neither: trs.filter((r) => !r.querySelector('.icon-btn') && !r.querySelector('.shut')).length,
    }
  })
  ok('the table is ordered by weight, heaviest first', t.first === 'Apple' && t.ordered, JSON.stringify(t))
  ok('every row either offers a plus or says why it does not', t.neither === 0,
     t.plus + ' with a plus, ' + t.shut + ' shut, ' + t.neither + ' saying nothing')
  // The point of the whole table: most of an index is not for sale here, and
  // the page is not allowed to hide that.
  ok('and most of an index is honestly marked as not for sale', t.shut > t.plus,
     t.shut + ' of ' + t.n)
  await p.locator('.table tbody tr', { hasText: 'Nvidia' }).first().click()
  await p.waitForTimeout(500)
  ok('a listed row opens that company', (await hash(p)) === '#/invest/nvda', await hash(p))
  ok('and it can be bought from there',
     await p.evaluate(() => [...document.querySelectorAll('main .btn-primary')]
       .some((e) => /^Buy /.test(e.textContent))))
  await p.goto(B + '/invest/index/sp500'); await p.waitForTimeout(500)
  await p.locator('.table tbody tr', { hasText: 'Broadcom' }).first().click()
  await p.waitForTimeout(420)
  ok('a row it does not list goes nowhere at all',
     (await hash(p)) === '#/invest/index/sp500', await hash(p))
  const before = await p.evaluate(() => document.querySelector('.nav-bucket .count')?.textContent ?? '0')
  await p.locator('.table tbody tr', { hasText: 'Apple' }).first().locator('.icon-btn').click()
  await p.waitForTimeout(600)
  const after = await p.evaluate(() => document.querySelector('.nav-bucket .count')?.textContent ?? '0')
  ok('the plus fills the bucket without leaving the index',
     Number(after) === Number(before) + 1 && (await hash(p)) === '#/invest/index/sp500',
     before + ' -> ' + after)
  await p.close()
}

console.log('THE LEVEL  which is not a price')
{
  const p = await page()
  await p.goto(B + '/invest/index/sp500', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(600)
  // The page prints "an index level is not a price" in a callout. A chart with
  // dollar signs down its axis would be arguing with the sentence beside it.
  const money = await p.evaluate(() => ({
    axis: [...document.querySelectorAll('.ch-tick')].map((e) => e.textContent.trim()),
    ohlc: [...document.querySelectorAll('.ch-num')].map((e) => e.textContent.trim()),
    edges: [...document.querySelectorAll('.ch-edge')].map((e) => e.textContent.trim()),
    said: /not a price/.test(document.body.innerText),
  }))
  const dollars = [...money.axis, ...money.ohlc, ...money.edges].filter((t) => t.includes('$'))
  ok('the page says the level is not a price', money.said)
  ok('and the chart does not print it in dollars', dollars.length === 0, dollars.join(' '))
  ok('the axis still reads as figures', money.axis.length > 0, money.axis.join(' '))
  // The company chart is money and has to stay money.
  await p.goto(B + '/invest/aapl'); await p.waitForTimeout(600)
  const stock = await p.evaluate(() =>
    [...document.querySelectorAll('.ch-tick')].map((e) => e.textContent.trim()))
  ok('and a company chart is still in dollars', stock.every((t) => t.includes('$')), stock.join(' '))
  await p.close()
}

console.log('THE DOW  the one this product can show whole')
{
  const p = await page()
  await p.goto(B + '/invest/index/dow', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const d = await p.evaluate(() => ({
    rows: document.querySelectorAll('.table tbody tr').length,
    says: /All thirty of them/.test(document.body.innerText),
    // No fund tracks it on Tokkenly, and the page has to say so rather than
    // leave the card empty or quietly omit it.
    fund: /does not list a fund/.test(document.body.innerText),
    priced: /Share price/.test(document.body.innerText),
  }))
  ok('thirty companies, all thirty shown', d.rows === 30 && d.says, d.rows + ' rows')
  ok('and it says there is no fund for this one', d.fund)
  ok('and that this is the index weighted by share price', d.priced)
  await p.close()
}

console.log('PHONE')
{
  const p = await page(390, 844)
  await p.goto(B + '/invest/index/sp500', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const m = await p.evaluate(() => {
    const pager = document.querySelector('.pager').getBoundingClientRect()
    const h1 = document.querySelector('h1')
    return {
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pagerUp: pager.bottom <= window.innerHeight + 1,
      taps: [...document.querySelectorAll('.pager-tab, .pager-step')]
        .map((e) => Math.round(e.getBoundingClientRect().height)),
      rows: document.querySelectorAll('.feed-row').length,
      // A sentence beside the title used to squeeze it to "S&P …" here.
      titleWhole: h1.scrollWidth <= h1.clientWidth + 1,
      title: h1.textContent.trim(),
    }
  })
  ok('no sideways scroll', m.over === 0, 'overflowX ' + m.over)
  ok('the pager is above the fold', m.pagerUp)
  ok('and every control in it clears 44px', m.taps.every((n) => n >= 44), m.taps.join(','))
  ok('the title is not cut off', m.titleWhole, m.title)
  ok('and the whole table is there', m.rows >= 30, m.rows + ' rows')
  await p.close()
}

console.log('THE STRIP ON A PHONE  it has to name the index you are on')
{
  // The strip is wider than a phone, so it scrolls — and it used to start at
  // its left edge on every screen, which meant Dow Jones showed a row reading
  // "S&P 500  Nasdaq-100" and nothing else. The one control whose whole job is
  // saying where you are was naming two places you are not, and the tab
  // carrying `aria-current` was the one nobody could see.
  for (const w of [390, 360]) {
    const p = await page(w, 844)
    for (const key of ['sp500', 'nasdaq', 'dow']) {
      await p.goto(B + '/invest/index/' + key, { waitUntil: 'domcontentloaded' })
      await p.waitForTimeout(500)
      const s = await p.evaluate(() => {
        const box = document.querySelector('.pager-tabs')
        const on = box.querySelector('.pager-tab.on')
        const a = on.getBoundingClientRect(), b = box.getBoundingClientRect()
        return { name: on.textContent.trim(), whole: a.left >= b.left - 1 && a.right <= b.right + 1,
                 scrolls: box.scrollWidth > box.clientWidth + 1 }
      })
      ok(`${w}  ${key} shows its own tab, whole`, s.whole, JSON.stringify(s))
    }
    await p.close()
  }
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
