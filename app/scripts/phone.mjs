import { chromium } from 'playwright'
const base = 'http://localhost:4173/#'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error' && !/ERR_CONNECTION|favicon/.test(m.text())) errs.push('console: ' + m.text()) })

const routes = [
  ['/', 'p01-home'], ['/wallet', 'p02-wallet'], ['/market', 'p03-market'],
  ['/market/aapl', 'p04-apple'], ['/market/aapl/invest', 'p05-invest'],
  ['/grow', 'p06-grow'], ['/grow/borrow', 'p07-borrow'], ['/grow/repay', 'p08-repay'],
  ['/grow/earn', 'p09-earn'], ['/grow/takeout', 'p10-takeout'],
  ['/history', 'p11-history'], ['/account', 'p12-account'], ['/security', 'p13-security'],
  ['/support', 'p14-support'], ['/send', 'p15-send'], ['/receive', 'p16-receive'],
  ['/addmoney', 'p17-addmoney'], ['/convert', 'p18-convert'],
  ['/?sheet=more', 'p19-more'], ['/grow/borrow?sheet=borrow-review&v=1150', 'p20-borrow-review'],
  ['/security?sheet=phrase', 'p21-phrase'], ['/history?sheet=receipt&ref=TKN-8F2K90', 'p22-receipt'],
  ['/signin', 'p23-signin'],
]
const lines = []
for (const [hash, name] of routes) {
  await page.goto(base + hash, { waitUntil: 'networkidle' })
  await page.waitForTimeout(160)
  await page.screenshot({ path: `/tmp/shots/${name}.png` })
  // nothing should scroll sideways on a phone
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  const rail = await page.locator('.railbar').count()
  const sheet = await page.locator('.sheet').count()
  lines.push(`${name.padEnd(20)} ${hash.padEnd(44)} overflowX ${String(over).padStart(3)}  rail ${rail}  sheet ${sheet}`)
}
console.log(lines.join('\n'))
console.log('\nERRORS: ' + (errs.length ? errs.join('\n') : 'none'))
await browser.close()
