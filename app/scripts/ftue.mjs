/* The first thing a new person sees, walked the way a new person walks it. */
import { chromium } from 'playwright'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const page = async (w = 1440, h = 900) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
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
  ok('the last one offers the thing it taught',
     await p.evaluate(() => !!document.body.innerText.match(/Buy your first share/)))
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

console.log('FINISHING IT BUYS SOMETHING')
{
  const p = await page()
  await p.goto(B + '/welcome/3', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  await p.getByRole('button', { name: 'Buy your first share' }).click(); await p.waitForTimeout(500)
  ok('the last step hands you to Invest',
     (await p.evaluate(() => location.hash)).includes('invest'), await p.evaluate(() => location.hash))
  await p.close()
}

console.log('BOTH SIZES, BOTH THEMES')
for (const [w, h] of [[1440, 900], [390, 844]]) {
  for (const theme of ['dark', 'light']) {
    const p = await page(w, h)
    await p.goto(B + '/welcome/0', { waitUntil: 'domcontentloaded' })
    await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
    await p.waitForTimeout(400)
    const m = await p.evaluate(() => {
      const btn = [...document.querySelectorAll('.btn-primary')].pop()
      const r = btn?.getBoundingClientRect()
      return {
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        overflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        reachable: r ? r.bottom <= window.innerHeight + 1 : false,
      }
    })
    ok(`${w}px ${theme}: fits without scrolling`, m.overflowX === 0 && m.overflowY <= 1,
       `x ${m.overflowX}, y ${m.overflowY}`)
    ok(`${w}px ${theme}: the button is reachable`, m.reachable)
    await p.close()
  }
}
console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
