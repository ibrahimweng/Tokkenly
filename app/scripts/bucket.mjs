/* Filling a bucket from the places you would fill it, and paying for it once. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
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

await p.goto(B + '/market', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.locator('.table tbody tr').first().locator('.icon-btn').click()
await p.waitForTimeout(400)
ok('a row adds without navigating away', (await p.evaluate(() => location.hash)).includes('market'), await p.evaluate(() => location.hash))
ok('and the count goes up', (await count()) === '1', 'count ' + (await count()))

await p.goto(B + '/market/nvda', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.getByRole('button', { name: 'Add to bucket' }).click(); await p.waitForTimeout(500)
await p.goto(B + '/market/ko', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
await p.getByRole('button', { name: 'Add to bucket' }).click(); await p.waitForTimeout(500)
ok('a stock page adds too', (await count()) === '3', 'count ' + (await count()))

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
ok('an amount can be changed in place',
   money((await p.evaluate(() => [...document.querySelectorAll('.kv')].find((e) => /Total/.test(e.textContent))?.textContent))) === 400,
   await p.evaluate(() => [...document.querySelectorAll('.kv')].find((e) => /Total/.test(e.textContent))?.textContent))

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
const cashBefore = await (async () => {
  await p.goto(B + '/wallet', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(350)
  return money(await p.$eval('.hero-figure', (e) => e.textContent))
})()
await p.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const total = money(await p.evaluate(() => [...document.querySelectorAll('.kv')].find((e) => /Total/.test(e.textContent))?.textContent))
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(500)
const rev = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '')
ok('review lists every company before anything happens', /apple/i.test(rev) && /nvidia/i.test(rev), rev.slice(0, 80))
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
const doneText = await p.evaluate(() => document.querySelector('.scrim')?.innerText.replace(/\n/g, ' ') ?? '')
ok('it confirms what arrived, company by company', /shares/.test(doneText), doneText.slice(0, 90))
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(600)
ok('the bucket empties', (await count()) === '0', 'count ' + (await count()))
const cashAfter = await (async () => {
  await p.goto(B + '/wallet', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(350)
  return money(await p.$eval('.hero-figure', (e) => e.textContent))
})()
ok('and cash went down by the total, once', Math.abs((cashBefore - cashAfter) - total) < 0.05,
   `${cashBefore} → ${cashAfter}, total ${total}`)
await p.goto(B + '/history?filter=trades', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400)
const hist = await p.evaluate(() => document.body.innerText)
ok('each company has its own receipt', /Apple/.test(hist) && /Nvidia/.test(hist))

console.log('PHONE')
const m = await b.newPage({ viewport: { width: 390, height: 844 } })
await seen(m)
await m.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await m.goto(B + '/market/aapl', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(400)
await m.getByRole('button', { name: 'Add to bucket' }).click(); await m.waitForTimeout(500)
await m.goto(B + '/bucket', { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(400)
ok('the phone top bar carries the bucket', await m.evaluate(() => !!document.querySelector('.bucket-btn')))
ok('and the bucket screen does not overflow',
   (await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0)

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
