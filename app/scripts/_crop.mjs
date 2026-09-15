import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const c = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })
const p = await c.newPage()
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await seen(p, {})
await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
await p.locator('.gates').screenshot({ path: '/tmp/ba7/doors.png' })
await p.goto(B + '/grow', { waitUntil: 'networkidle' }); await p.waitForTimeout(700)
await p.locator('.card.prod').first().locator('xpath=..').screenshot({ path: '/tmp/ba7/grow.png' })
  .catch(async () => { await p.screenshot({ path: '/tmp/ba7/grow.png' }) })
// An empty state on a real screen: search the market for something that is not there.
await p.goto(B + '/invest', { waitUntil: 'networkidle' }); await p.waitForTimeout(600)
const f = p.locator('input[type="search"], .jump-field input, input').first()
await f.fill('zzzzqq'); await f.dispatchEvent('input'); await p.waitForTimeout(600)
await p.locator('.empty').first().screenshot({ path: '/tmp/ba7/empty.png' })
  .catch(() => console.log('no empty on invest'))
// The intro, where the drawing is biggest.
const w = await c.newPage()
await w.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await w.addInitScript(`try { localStorage.removeItem('tokkenly.prefs.v1'); sessionStorage.setItem('tokkenly.unlocked','1') } catch {}`)
await w.goto(B + '/welcome/0', { waitUntil: 'networkidle' }); await w.waitForTimeout(700)
await w.screenshot({ path: '/tmp/ba7/welcome.png' })
console.log('ok')
await b.close()
