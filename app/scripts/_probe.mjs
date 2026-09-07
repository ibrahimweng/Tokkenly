import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await seen(p)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
for (const r of ['/signin', '/signup', '/welcome/0', '/welcome/1', '/welcome/2', '/welcome/3']) {
  await p.goto('http://localhost:4173/#' + r, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const t = await p.evaluate(() => {
    const root = document.querySelector('.auth, .welcome, .lock')
    return [...root.querySelectorAll('p, span, small, h1, h2, strong, button, label')]
      .filter((e) => !e.querySelector('*') && (e.textContent ?? '').trim().length > 12)
      .map((e) => e.textContent.replace(/\s+/g, ' ').trim())
  })
  console.log('\n### ' + r)
  for (const line of t) console.log('   ' + line)
}
await b.close()
