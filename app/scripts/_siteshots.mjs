/* The pictures on the marketing site.
 *
 *  Every image in site/img is a photograph of this app running in light mode,
 *  not a mockup, so the site cannot drift from the product without somebody
 *  noticing. Run it against a built bundle:
 *
 *    npm run build && npx vite preview --port 4173 &
 *    node scripts/_siteshots.mjs && node scripts/_siteopt.mjs
 *
 *  Two kinds of picture. The wide ones are the desktop screen at 1360x850;
 *  the hero keeps the whole thing, sidebar included, because the hero is
 *  showing you the product. The three card pictures are clipped to the
 *  content column instead — printing the same sidebar four times on one page
 *  is repetition, not illustration. The tall ones are the phone at 390x800.
 */
import { chromium } from 'playwright'

const base = 'http://localhost:4173/#'
const out = '../site/img'
const SIDEBAR = 240        // --sidebar-w
const CARD = { width: 1120, height: 700 }   // 1.6, the ratio the card frames are drawn at

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

const seedLight = (p) => p.addInitScript(`try {
  localStorage.setItem('tokkenly.prefs.v1', ${JSON.stringify(JSON.stringify({
    seenIntro: true, prefs: { theme: 'light' }, security: {},
  }))})
  sessionStorage.setItem('tokkenly.unlocked', '1')
} catch {}`)

async function make(width, height) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 })
  await seedLight(p)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return p
}

async function shot(p, hash, name, clip) {
  await p.goto(base + hash, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)     // the balances count up; let them land
  await p.screenshot({ path: `${out}/${name}.png`, ...(clip ? { clip } : {}) })
  return name
}

const desktop = await make(1360, 850)
const phone = await make(390, 800)
const column = { x: SIDEBAR, y: 0, ...CARD }

const done = []
/* The hero: the whole screen. */
done.push(await shot(desktop, '/', 'home'))
/* The three cards under "Companies you know": the content column only. */
done.push(await shot(desktop, '/invest', 'invest', column))
done.push(await shot(desktop, '/invest/aapl', 'stock', column))
done.push(await shot(desktop, '/transfer', 'wallet', column))
/* The phones. p-home is the hero again at phone width: a 1360-wide desktop
   screen scaled into a 300px column is a picture of nothing. */
for (const [hash, name] of [
  ['/', 'p-home'],
  ['/invest/aapl/send', 'p-gift'],
  ['/receive', 'p-receive'],
  /* The wallet, not /withdraw. /withdraw resolves into Send with a sheet
     already open, so the picture came out as a modal over a dimmed screen —
     and the wallet says the same thing better anyway: dollars and the naira
     they are worth, on one card. */
  ['/transfer', 'p-wallet'],
  ['/send', 'p-send'],
  ['/signup', 'p-signup'],
  ['/addmoney', 'p-addmoney'],
  ['/invest', 'p-invest'],
]) done.push(await shot(phone, hash, name))

console.log(done.join('\n'))
await browser.close()
