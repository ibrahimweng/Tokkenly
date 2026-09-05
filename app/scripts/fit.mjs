import { chromium } from 'playwright'
const base = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
const rows = []
for (const hash of ['/grow/borrow','/grow/repay','/grow/earn','/grow/takeout','/send','/addmoney','/convert','/market/aapl/invest','/market/aapl/sell']) {
  await p.goto(base + hash, { waitUntil: 'networkidle' })
  await p.waitForTimeout(160)
  const r = await p.evaluate(() => {
    const sheet = document.querySelector('.sheet')
    const btn = sheet && sheet.querySelector('.btn-primary')
    if (!sheet || !btn) return null
    const sb = sheet.getBoundingClientRect(), bb = btn.getBoundingClientRect()
    return { sheetH: Math.round(sb.height), scrollH: sheet.scrollHeight,
      buttonVisible: bb.bottom <= window.innerHeight + 1 && bb.top >= 0 }
  })
  rows.push(hash.padEnd(26) + (r ? `sheet ${String(r.sheetH).padStart(3)}  content ${String(r.scrollH).padStart(3)}  button on screen: ${r.buttonVisible}` : 'no sheet'))
}
console.log(rows.join('\n'))
await b.close()
