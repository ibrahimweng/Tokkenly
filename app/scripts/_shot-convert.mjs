/* The Convert batch, before and after, from two real builds.

   4173 is main at fb9f5a2. 4174 is a worktree at ef01bbd, the commit before
   Convert existed. Nothing here is drawn from memory: where a shot has a
   before, the before is a browser pointed at the older build.

   Viewport captures, not full-page ones. The phone's tab bar is position
   fixed, so a full-page capture of a 2,400px screen parks it in the middle of
   the image, which is a capture artefact and not what anybody sees. Where the
   thing worth showing is below the fold, the page is scrolled to it first. */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { seen, settled } from './seen.mjs'

const OUT = process.argv[2] ?? '/tmp/shots'
mkdirSync(OUT, { recursive: true })
const AFTER = 'http://localhost:4173/#'
const BEFORE = 'http://localhost:4174/#'
const SIZES = [
  { w: 1440, h: 1000, tag: '1440' },
  { w: 834, h: 1112, tag: '834' },
  { w: 390, h: 844, tag: '390' },
]

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const shots = []

/** One page, seeded as somebody who has been here before, at one size. */
async function open(w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await seen(p)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  p.setDefaultTimeout(9000)
  return p
}

const shot = async (p, name) => {
  const file = `${OUT}/${name}.png`
  await p.screenshot({ path: file })
  shots.push(name)
  return file
}

const go = async (p, base, route, settle = 600) => {
  await p.goto(base + route, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(settle)
}

/* ---- 1. the doors row, both builds, three sizes ----
   The change with a real before: two doors boxed into the left column, then
   three across the full width. On a phone the row sits under the hero, so
   scroll to it rather than photograph the part of the screen above it.

   Not scrollIntoViewIfNeeded: at 390 Playwright judged the row near enough to
   the fold to leave the page alone, and both sides came back byte for byte the
   same picture of the hero. Centre it by hand, then read the door titles back
   out of the DOM, so a shot that captured the wrong thing says so in the log
   rather than in an image nobody re-checks. */
for (const { w, h, tag } of SIZES) {
  for (const [side, base] of [['before', BEFORE], ['after', AFTER]]) {
    const p = await open(w, h)
    await go(p, base, '/transfer')
    await settled(p, '.hero-figure').catch(() => {})
    await p.evaluate(() => {
      const t = [...document.querySelectorAll('.way .t-title, .t-title')]
        .find((e) => e.textContent.trim() === 'Add money')
      if (t) (t.closest('.way') ?? t.parentElement)
        .scrollIntoView({ block: 'center', behavior: 'instant' })
    })
    await p.waitForTimeout(600)
    const doors = await p.$$eval('.way .t-title', (n) => n.map((x) => x.textContent.trim()))
    console.error(`  doors ${tag} ${side}: ${doors.join(' | ')}`)
    await shot(p, `01-doors-${tag}-${side}`)
    await p.close()
  }
}

/* ---- 2. the address itself ----
   /convert on the old build, and the screen it opens on the new one. */
{
  const p = await open(1440, 1000)
  await go(p, BEFORE, '/convert', 900)
  await shot(p, '02-convert-1440-before')
  await p.close()
}
for (const { w, h, tag } of SIZES) {
  const p = await open(w, h)
  await go(p, AFTER, '/convert/usdc/ngn', 900)
  await shot(p, `02-convert-${tag}-after`)
  await p.close()
}

/* ---- 3. money actually in flight ----
   A row that only exists while a conversion is between its two legs proves
   nothing if the screenshot is of an empty composer, so put money in flight
   and photograph the stage. */
{
  const p = await open(1440, 1000)
  await go(p, AFTER, '/convert/usdc/ngn', 700)
  await p.locator('.quick button, .chip-row button').nth(1).click().catch(() => {})
  await p.waitForTimeout(300)
  await shot(p, '03-review-1440-after')
  await p.locator('.btn-primary').filter({ hasText: /^Convert/ }).first().click()
  await p.waitForTimeout(700)
  const confirm = p.locator('.sheet .btn-primary').filter({ hasText: /^Convert/ }).first()
  await confirm.waitFor({ state: 'visible', timeout: 9000 })
  await p.waitForTimeout(250)
  await shot(p, '04-hold-1440-after')
  await confirm.click()
  await p.waitForTimeout(900)
  await shot(p, '05-at-the-desk-1440-after')   // leg one posted, leg two pending
  await p.waitForTimeout(3200)
  await shot(p, '06-landed-1440-after')        // leg two posted
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)

  /* the receipt, opened from the row it made */
  await go(p, AFTER, '/activity?filter=converted', 700)
  await p.locator('.feed-row').first().click()
  await p.waitForTimeout(700)
  await shot(p, '08-receipt-1440-after')
  await p.close()
}

/* ---- 4. the filter row ----
   Five chips, then six. Same screen, both builds. */
for (const [side, base] of [['before', BEFORE], ['after', AFTER]]) {
  const p = await open(1440, 1000)
  await go(p, base, '/activity', 800)
  await shot(p, `07-activity-1440-${side}`)
  await p.close()
}

console.log(shots.join('\n'))
await b.close()
