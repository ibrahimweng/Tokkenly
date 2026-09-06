/* The first thing a new person sees, walked the way a new person walks it. */
import { chromium } from 'playwright'
import { fresh, seen, settled } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const page = async (w = 1440, h = 900) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  // New, but unlocked: signing up gets you in, and the intro is about the
  // product rather than the device.
  await fresh(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(6000)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return p
}

console.log('ARRIVING')
{
  const p = await page()
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const first = await p.evaluate(() => ({
    intro: !!document.querySelector('.welcome'),
    chrome: !!document.querySelector('.sidebar, .railbar'),
    title: document.querySelector('.welcome-title')?.textContent,
    dots: document.querySelectorAll('.welcome-dot').length,
    skip: !!document.querySelector('.welcome-top .link'),
  }))
  ok('a new person lands on the intro', first.intro)
  ok('with nothing else on the screen to do', !first.chrome)
  ok('it makes one claim', /one dollar/.test(first.title ?? ''), (first.title ?? '').replace(/\n/g, ' '))
  ok('and says how far through it you are', first.dots === 4, first.dots + ' dots')
  ok('and can be skipped', first.skip)

  console.log('WALKING IT')
  const titles = []
  for (let i = 0; i < 3; i++) {
    await p.getByRole('button', { name: 'Next' }).click(); await p.waitForTimeout(300)
    titles.push((await p.$eval('.welcome-title', (e) => e.textContent)).replace(/\n/g, ' '))
  }
  ok('every step says something different', new Set(titles).size === 3, titles.join(' | '))
  // The last step stops making claims and offers three real companies. What it
  // must not do is offer them as a purchase: picking is not buying.
  const end = await p.evaluate(() => ({
    picks: [...document.querySelectorAll('.welcome-pick')].map((e) => e.querySelector('.t-title')?.textContent),
    buys: [...document.querySelectorAll('.welcome-pick-buys')].map((e) => e.textContent),
    says: document.querySelector('.welcome-text')?.textContent ?? '',
    art: !!document.querySelector('.welcome-art'),
  }))
  ok('the last one offers real companies rather than a slogan',
     end.picks.length === 3 && end.picks.every(Boolean), end.picks.join(', '))
  ok('and says what a starting amount buys of each',
     end.buys.length === 3 && end.buys.every((t) => /\$\d+ buys [\d.]+ shares/.test(t)), end.buys.join(' | '))
  ok('and promises nothing is bought yet', /Nothing is bought until you say so/.test(end.says))
  ok('with the decoration out of the way of the things to press', !end.art)
  ok('back goes back', await (async () => {
    await p.getByRole('button', { name: 'Back' }).click(); await p.waitForTimeout(300)
    return (await p.evaluate(() => location.hash)).endsWith('/2')
  })())
  await p.close()
}

console.log('LEAVING IT')
{
  const p = await page()
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Skip' }).click(); await p.waitForTimeout(400)
  ok('skip lands on Home', await p.evaluate(() => !!document.querySelector('.sidebar')))
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  ok('and it does not come back', await p.evaluate(() => !document.querySelector('.welcome')))
  await p.goto(B + '/account/preferences', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Show it again' }).click(); await p.waitForTimeout(400)
  ok('but Account can bring it back', await p.evaluate(() => !!document.querySelector('.welcome')))
  await p.close()
}

console.log('A DEEP LINK IS NOT A NEW ARRIVAL')
{
  const p = await page()
  await p.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  ok('it goes where it points, intro unseen', await p.evaluate(() => !document.querySelector('.welcome')))
  await p.close()
}

console.log('FINISHING IT LEAVES SOMETHING DONE')
{
  const p = await page()
  // A deep link is not an arrival, so the wallet can be read without spending
  // the intro on the way past.
  await p.goto(B + '/transfer', { waitUntil: 'domcontentloaded' })
  const before = await settled(p, '.hero-figure')
  await p.goto(B + '/welcome/3', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  const names = await p.$$eval('.welcome-pick .t-title', (els) => els.map((e) => e.textContent.trim()))
  await p.locator('.welcome-pick').nth(1).click(); await p.waitForTimeout(600)
  const after = await p.evaluate(() => ({
    where: location.hash,
    rows: document.querySelectorAll('.bucket-row').length,
    text: document.body.innerText,
    count: document.querySelector('.nav-bucket .count')?.textContent ?? '0',
    intro: !!document.querySelector('.welcome'),
    buy: document.querySelector('.btn-primary')?.textContent ?? '',
  }))
  ok('picking one lands on the bucket', after.where.includes('bucket'), after.where)
  ok('with the pick already in it',
     after.rows === 1 && after.text.includes(names[1]), `${after.rows} rows, picked ${names[1]}`)
  ok('and the intro does not come back', !after.intro)
  ok('the sidebar count agrees', after.count === '1', 'count ' + after.count)
  // The whole point of ending here rather than on a receipt: the money decision
  // is still the person's to make, on the screen that shows what it costs.
  ok('the payment is still ahead of you, named', /Buy/.test(after.buy), after.buy)
  await p.goto(B + '/transfer', { waitUntil: 'domcontentloaded' })
  const still = await settled(p, '.hero-figure')
  ok('and the wallet has not moved: picking is not buying', before === still, `${before} → ${still}`)
  await p.close()
}

console.log('AND THERE IS STILL A WAY PAST IT')
{
  const p = await page()
  await p.goto(B + '/welcome/3', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Browse all' }).click(); await p.waitForTimeout(500)
  ok('browse all hands you to the market with an empty bucket',
     (await p.evaluate(() => location.hash)).includes('invest')
     && (await p.evaluate(() => document.querySelector('.nav-bucket .count')?.textContent ?? '0')) === '0',
     await p.evaluate(() => location.hash))
  await p.close()
}

console.log('BOTH SIZES, BOTH THEMES')
// The last step is the tall one now — a paragraph and three cards — so it is
// the one that has to be checked for fit, not only the first.
for (const [w, h] of [[1440, 900], [390, 844]]) {
  for (const theme of ['dark', 'light']) {
    for (const step of [0, 3]) {
      const p = await page(w, h)
      await p.goto(B + '/welcome/' + step, { waitUntil: 'domcontentloaded' })
      await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
      await p.waitForTimeout(400)
      const m = await p.evaluate(() => {
        // Whatever the step ends on: Next on the claims, Browse all on the picks.
        const btn = [...document.querySelectorAll('.welcome-actions .btn')].pop()
        const r = btn?.getBoundingClientRect()
        const last = [...document.querySelectorAll('.welcome-pick')].pop()
        const lr = last?.getBoundingClientRect()
        return {
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          overflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
          reachable: r ? r.bottom <= window.innerHeight + 1 : false,
          picksOnScreen: lr ? lr.bottom <= window.innerHeight + 1 : null,
        }
      })
      ok(`${w}px ${theme} step ${step}: fits without scrolling`, m.overflowX === 0 && m.overflowY <= 1,
         `x ${m.overflowX}, y ${m.overflowY}`)
      ok(`${w}px ${theme} step ${step}: the button is reachable`, m.reachable)
      if (m.picksOnScreen !== null) ok(`${w}px ${theme}: every pick is on screen`, m.picksOnScreen)
      await p.close()
    }
  }
}
console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
