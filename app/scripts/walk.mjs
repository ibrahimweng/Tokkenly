import { chromium } from 'playwright'

const base = 'http://localhost:4173/#'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

async function shot(hash, name) {
  await page.goto(base + hash, { waitUntil: 'networkidle' })
  await page.waitForTimeout(180)
  await page.screenshot({ path: `./shots/${name}.png` })
  const title = await page.locator('h1, .sheet-head h2').first().textContent().catch(() => '?')
  return `${name.padEnd(22)} ${hash.padEnd(46)} ${String(title).trim().slice(0, 32)}`
}

const routes = [
  ['/', '01-home'],
  ['/wallet', '02-wallet'],
  ['/market', '03-market'],
  ['/market/aapl', '04-apple'],
  ['/market/aapl/invest', '05-invest'],
  ['/grow', '06-grow'],
  ['/grow/borrow', '07-borrow'],
  ['/grow/repay', '08-repay'],
  ['/grow/earn', '09-earn'],
  ['/grow/takeout', '10-takeout'],
  ['/history', '11-history'],
  ['/account', '12-account'],
  ['/security', '13-security'],
  ['/support', '14-support'],
  ['/send', '15-send'],
  ['/receive', '16-receive'],
  ['/addmoney', '17-addmoney'],
  ['/convert', '18-convert'],
  ['/signin', '19-signin'],
  ['/signup', '20-signup'],
  ['/grow/borrow?sheet=borrow-review&v=1150', '21-borrow-review'],
  ['/security?sheet=phrase', '22-phrase'],
  ['/history?sheet=receipt&ref=TKN-8F2K90', '23-receipt'],
]
const lines = []
for (const [hash, name] of routes) lines.push(await shot(hash, name))
console.log(lines.join('\n'))
console.log('\nERRORS: ' + (errors.length ? '\n' + errors.join('\n') : 'none'))
await browser.close()
