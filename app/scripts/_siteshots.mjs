/* The pictures on the marketing site — as it was.
 *
 *  None of the files this takes is on the site any more: the landing page and
 *  the product pages are drawn from their Figma frames now, with the frames'
 *  own art, and home, invest, stock, wallet and the eleven p-* phones were
 *  deleted from site/img as unused. It is kept because it still works and is
 *  the way to photograph the app for the site if that is wanted again; run it
 *  and _siteopt.mjs only to bring those pictures back.
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

const scrimmed = []

async function shot(p, hash, name, clip) {
  await p.goto(base + hash, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)     // the balances count up; let them land
  /* A route that opens a sheet photographs as a modal over a dimmed screen,
     which on the site reads as a dirty screenshot rather than as the product.
     The app moves routes around — /send and /addmoney became choosers — so
     this is checked every run rather than trusted. */
  const scrim = await p.evaluate(() => {
    const s = document.querySelector('.scrim')
    return !!s && getComputedStyle(s).display !== 'none'
  })
  if (scrim) scrimmed.push(`${name} (${hash})`)
  await p.screenshot({ path: `${out}/${name}.png`, ...(clip ? { clip } : {}) })
  return name + (scrim ? '   <-- SCRIM' : '')
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
/* Every one of these is a route that renders a whole screen. The bare
   /send and /addmoney are choosers now: they open a sheet over a dimmed
   wallet, and a scrim in a marketing picture reads as a dirty screenshot,
   so each one is taken at the leaf it leads to instead. Re-probe with a
   `.scrim` check before adding a route here. */
for (const [hash, name] of [
  ['/', 'p-home'],
  ['/invest/aapl/send', 'p-gift'],
  ['/addmoney/base', 'p-receive'],   // the Base address and its QR
  ['/transfer', 'p-wallet'],         // dollars, and the naira they are worth
  ['/send/tokkenly', 'p-send'],      // sending to a person
  ['/signup', 'p-signup'],
  ['/addmoney/bank', 'p-addmoney'],  // naira in by bank transfer
  ['/invest', 'p-invest'],
  /* One per product card. /grow/earn and /grow/borrow are composers and open
     a sheet, so the two screens that SHOW what you have lent and what you owe
     stand in for them. */
  ['/spend', 'p-bills'],
  ['/grow/lending', 'p-earn'],
  ['/grow/borrowing', 'p-borrow'],
]) done.push(await shot(phone, hash, name))

console.log(done.join('\n'))
await browser.close()

if (scrimmed.length) {
  console.error('\nThese routes opened a sheet instead of showing a whole screen:')
  for (const r of scrimmed) console.error('  ' + r)
  console.error('Point them at the leaf route the chooser leads to, and re-run.')
  process.exit(1)
}
