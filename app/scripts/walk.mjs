/* Every desktop address at 1440: it renders a screen rather than the
   not-found page, with a heading, a screenshot of it, and no page errors.
   It used to print the titles and leave the reading to whoever ran it. */
import { B, launch, check, teardown, shot } from './lib/harness.mjs'
import { seen } from './lib/seen.mjs'

const browser = await launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
await seen(page)
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('console: ' + m.text())
})

async function visit(hash, name) {
  await page.goto(B + hash, { waitUntil: 'networkidle' })
  await page.waitForTimeout(180)
  await page.screenshot({ path: shot(`${name}.png`) })
  const title = String(await page.locator('h1, .sheet-head h2').first().textContent().catch(() => '')).trim()
  check(`${hash} renders a screen`, !!title && title !== 'No screen at that address', title.slice(0, 40))
  // A sheet is an address: one named in the URL has to be open over it.
  if (hash.includes('sheet=')) {
    const head = String(await page.locator('.sheet-head h2').first().textContent().catch(() => '')).trim()
    check(`  and the sheet it names is open`, !!head, head)
  }
}

const routes = [
  ['/', '01-home'],
  ['/transfer', '02-wallet'],
  ['/invest', '03-market'],
  ['/invest/aapl', '04-apple'],
  ['/invest/aapl/invest', '05-invest'],
  ['/grow', '06-grow'],
  ['/grow/borrow', '07-borrow'],
  ['/grow/repay', '08-repay'],
  ['/grow/earn', '09-earn'],
  ['/grow/takeout', '10-takeout'],
  ['/activity', '11-history'],
  ['/account', '12-account'],
  ['/security', '13-security'],
  ['/support', '14-support'],
  ['/send', '15-send'],
  ['/receive', '16-receive'],
  ['/addmoney', '17-addmoney'],
  ['/withdraw', '18-convert'],
  ['/signin', '19-signin'],
  ['/signup', '20-signup'],
  ['/grow/borrow?sheet=borrow-review&v=1150', '21-borrow-review'],
  ['/security?sheet=phrase', '22-phrase'],
  ['/activity?sheet=receipt&ref=TKN-8F2K90', '23-receipt'],
]
for (const [hash, name] of routes) await visit(hash, name)
check('no page or console errors', !errors.length, errors.join(' | '))
await teardown(browser)
