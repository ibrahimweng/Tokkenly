/* Every search field in the product, on the screen it lives on. They were five
   fields that did nothing until Enter and then matched on `includes`, so a
   dropped letter was answered with an empty list. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const page = async (w = 1440, h = 1000) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(6000)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return p
}
const type = async (p, t) => {
  const i = p.locator('.search input')
  await i.fill(t); await i.dispatchEvent('input'); await p.waitForTimeout(260)
}
const panel = (p) => p.evaluate(() =>
  [...document.querySelectorAll('.suggest-row')].map((r) => r.querySelector('.grow')?.textContent ?? ''))
const note = (p) => p.evaluate(() => document.querySelector('.search-note')?.textContent ?? null)
const holds = (p) => p.evaluate(() => document.activeElement?.getAttribute('role') === 'combobox')

/* Every one of them, and the count of the thing each narrows. */
const FIELDS = [
  { route: '/invest', what: '.table tbody tr', term: 'nvda', typo: 'micrsoft', wants: 'Microsoft', w: 1440 },
  { route: '/activity', what: '.feed-row', term: 'adaeze', typo: 'adeze', wants: 'Adaeze', w: 1440 },
  { route: '/send', what: '.sheet-list .sheet-row', term: 'tunde', typo: 'tnde', wants: 'Tunde', w: 390 },
  { route: '/account/support', what: '.card .set-row', term: 'pin', typo: 'recovry', wants: 'recovery', w: 1440 },
  { route: '/all', what: '.all-row', term: 'borrow', typo: 'borow', wants: 'Borrow', w: 1440 },
]

console.log('IT NARROWS AS YOU TYPE')
for (const f of FIELDS) {
  const p = await page(f.w, f.w === 390 ? 844 : 1000)
  await p.goto(B + f.route, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500)
  const before = await p.evaluate((s) => document.querySelectorAll(s).length, f.what)
  await type(p, f.term)
  const after = await p.evaluate((s) => document.querySelectorAll(s).length, f.what)
  ok(`${f.route} narrows`, after < before && after > 0, `${before} → ${after}`)
  // A route change rebuilds the whole tree and would take the focus with it.
  ok(`${f.route} keeps the caret in the field`, await holds(p))
  ok(`${f.route} says how many`, /match/i.test((await note(p)) ?? ''), (await note(p)) ?? 'nothing said')
  ok(`${f.route} offers the closest under the field`, (await panel(p)).length > 0, JSON.stringify((await panel(p)).slice(0, 2)))
  // The point of the whole thing: a near miss is still an answer.
  await type(p, f.typo)
  const hits = await panel(p)
  ok(`${f.route} survives a typo`,
     hits.some((x) => x.toLowerCase().includes(f.wants.toLowerCase())), `"${f.typo}" → ${JSON.stringify(hits.slice(0, 2))}`)
  ok(`${f.route} says it is a near miss`, /closest/i.test((await note(p)) ?? ''), (await note(p)) ?? 'nothing said')
  await p.close()
}

console.log('THE PANEL TAKES THE KEYBOARD')
{
  const p = await page()
  await p.goto(B + '/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500)
  await type(p, 'nvid')
  ok('it says it has a list', await p.evaluate(() =>
    document.querySelector('.search input')?.getAttribute('aria-expanded') === 'true'))
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(150)
  ok('and which row is current', await p.evaluate(() => {
    const on = document.querySelector('.search input')?.getAttribute('aria-activedescendant')
    return !!on && document.getElementById(on)?.classList.contains('on') === true
  }))
  await p.keyboard.press('Enter'); await p.waitForTimeout(500)
  ok('enter on a row goes there', (await p.evaluate(() => location.hash)).includes('/invest/nvda'),
     await p.evaluate(() => location.hash))

  await p.goto(B + '/invest', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
  await type(p, 'apple')
  await p.keyboard.press('Enter'); await p.waitForTimeout(500)
  // Enter with nothing chosen commits the term, so a search can be linked.
  ok('enter with nothing chosen commits the search',
     (await p.evaluate(() => location.hash)).includes('q=apple'), await p.evaluate(() => location.hash))

  await type(p, 'nvid')
  await p.keyboard.press('Escape'); await p.waitForTimeout(150)
  ok('escape closes the panel', await p.evaluate(() =>
    document.querySelector('.search input')?.getAttribute('aria-expanded') === 'false'))
  await p.keyboard.press('Escape'); await p.waitForTimeout(250)
  ok('and again clears the field', (await p.evaluate(() => document.querySelector('.search input')?.value)) === '')
  // A hidden list still holding the last answers is one a screen reader can be
  // walked into.
  ok('a closed panel holds nothing', (await panel(p)).length === 0)
  await p.close()
}

console.log('A LINK INTO A SEARCH STILL WORKS')
{
  const p = await page()
  await p.goto(B + '/invest?q=coca', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500)
  ok('the address seeds the field',
     (await p.evaluate(() => document.querySelector('.search input')?.value)) === 'coca')
  ok('and the list arrives narrowed',
     (await p.evaluate(() => document.querySelectorAll('.table tbody tr').length)) === 1)
  await p.close()
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
