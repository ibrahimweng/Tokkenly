/* Every desktop address at 1440: it renders a screen rather than the
   not-found page, with a heading, a screenshot of it, and no page errors.
   It used to print the titles and leave the reading to whoever ran it. */
import { B, BASE_URL, launch, check, teardown, shot } from './lib/harness.mjs'
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

/* An address typed without a hash. The host rewrites every path to
   index.html, and the router used to answer all of them with `#/`, so
   https://host/market/aapl opened Home. It reads the path as the route it
   names now, query and all, and only a path the app has no screen for falls
   back to Home. */
console.log('\nDEEP LINKS  a path without a hash lands where it points')
async function deep(path, wantHash, sheet = false) {
  await page.goto(BASE_URL + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(180)
  const got = await page.evaluate(() => location.pathname + location.hash)
  const title = String(await page.locator('h1, .sheet-head h2').first().textContent().catch(() => '')).trim()
  const ok = got === '/' + wantHash && !!title && title !== 'No screen at that address'
  check(`${path} opens ${wantHash}`, ok, `${got}  ${title.slice(0, 40)}`)
  if (sheet) {
    const head = String(await page.locator('.sheet-head h2').first().textContent().catch(() => '')).trim()
    check('  and the sheet its query names is open', !!head, head)
  }
}
await deep('/market/aapl', '#/market/aapl')
await deep('/invest/aapl/', '#/invest/aapl')
await deep('/grow/borrow?sheet=borrow-review&v=1150', '#/grow/borrow?sheet=borrow-review&v=1150', true)
await deep('/', '#/')
await deep('/index.html', '#/')
await deep('/no/such/place', '#/')
// One path per first segment the app answers to (knownFirst in main.ts): a
// segment dropped from that list would send its links to Home, and this is
// where that shows.
const firsts = ['transfer', 'activity', 'wallet', 'history', 'withdraw', 'receive', 'bucket',
  'disclosures', 'signin', 'signup', 'map', 'all', 'verify', 'statement', 'send', 'spend',
  'addmoney', 'convert', 'account', 'security', 'support', 'market', 'invest', 'grow']
const lost = []
for (const f of firsts) {
  await page.goto(BASE_URL + '/' + f, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(120)
  // Several places settle on a fuller address of their own (/convert becomes
  // /convert/usdc/ngn), so the test is that the path survived into the hash
  // rather than being dropped for Home.
  const got = await page.evaluate(() => location.hash)
  if (!got.startsWith('#/') || got === '#/') lost.push(`/${f} → ${got || '(no hash)'}`)
}
check(`all ${firsts.length} places are reached, not sent Home, when typed without a hash`, !lost.length, lost.join(' | '))
check('no page or console errors', !errors.length, errors.join(' | '))
await teardown(browser)
