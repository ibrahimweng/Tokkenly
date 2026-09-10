import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const base = 'http://localhost:4173/#'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
await seen(page)
const errs = []
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error' && !/ERR_CONNECTION|favicon/.test(m.text())) errs.push('console: ' + m.text()) })

const routes = [
  ['/', 'p01-home'], ['/transfer', 'p02-wallet'], ['/invest', 'p03-market'],
  ['/invest/aapl', 'p04-apple'], ['/invest/aapl/invest', 'p05-invest'],
  ['/grow', 'p06-grow'], ['/grow/borrow', 'p07-borrow'], ['/grow/repay', 'p08-repay'],
  ['/grow/earn', 'p09-earn'], ['/grow/takeout', 'p10-takeout'],
  ['/activity', 'p11-history'], ['/account', 'p12-account'], ['/security', 'p13-security'],
  ['/support', 'p14-support'], ['/send', 'p15-send'], ['/receive', 'p16-receive'],
  ['/addmoney', 'p17-addmoney'], ['/withdraw', 'p18-convert'],
  ['/?sheet=more', 'p19-more'], ['/grow/borrow?sheet=borrow-review&v=1150', 'p20-borrow-review'],
  ['/security?sheet=phrase', 'p21-phrase'], ['/activity?sheet=receipt&ref=TKN-8F2K90', 'p22-receipt'],
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

/* THE NAV BAR
   Two objects, not one bar: a capsule of tabs, and a button of its own beside
   it. Pressing the button does not open a sheet over the screen — the capsule
   becomes the list, in place, while the button stays exactly where the thumb
   left it and turns into the way out. Everything here is a property that is
   easy to break by accident and impossible to see in a screenshot. */
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
console.log('\nTHE NAV BAR')
{
  const box = (sel) => page.evaluate((s) => {
    const e = document.querySelector(s)
    if (!e) return null
    const r = e.getBoundingClientRect()
    return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) }
  }, sel)
  await page.goto(base + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(250)

  const pill = await box('.rail-pill'), more = await box('.rail-more')
  ok('the tabs are a capsule and the button is its own object',
     !!pill && !!more && more.x > pill.x + pill.w, `capsule ${pill?.w}, gap ${more && pill ? more.x - pill.x - pill.w : '?'}`)
  ok('and the button is exactly as tall as the capsule',
     !!pill && !!more && pill.h === more.h, `${pill?.h} against ${more?.h}`)
  // The fourth tab is "Borrow & Lend", which does not fit in a quarter of a
  // 390 phone. Tabs are as wide as their words for exactly that reason, and a
  // label on two lines falls through the capsule's rounded bottom.
  const labels = await page.evaluate(() => [...document.querySelectorAll('.rail-label')]
    .map((e) => ({ t: e.textContent, lines: Math.round(e.getBoundingClientRect().height / 12) })))
  ok('every tab says its whole name on one line',
     labels.length === 4 && labels.every((l) => l.lines === 1),
     labels.map((l) => `${l.t}:${l.lines}`).join(' '))

  await page.locator('.rail-more').click(); await page.waitForTimeout(320)
  const panel = await box('.rail-panel'), moreOpen = await box('.rail-more')
  ok('the button opens the capsule rather than a sheet over the screen',
     !!panel && (await page.locator('.scrim').count()) === 0 && !(await page.locator('.rail-pill').isVisible()))
  ok('and the panel is the capsule: same width, same bottom edge',
     !!panel && !!pill && panel.x === pill.x && panel.w === pill.w && panel.bottom === pill.bottom,
     panel ? `${panel.x}+${panel.w}@${panel.bottom} against ${pill.x}+${pill.w}@${pill.bottom}` : 'no panel')
  ok('and the button has not moved a pixel',
     !!moreOpen && !!more && moreOpen.x === more.x && moreOpen.bottom === more.bottom,
     moreOpen ? `${moreOpen.x}@${moreOpen.bottom} against ${more.x}@${more.bottom}` : 'gone')
  // Eight cells: the four places with no tab, and the four things in here
  // that are not places. Two full rows, which is why Spend went in at the top
  // of the grid rather than being left to sit on a row of its own.
  ok('it holds everything that is not a tab',
     (await page.locator('.rail-cell').count()) === 8)
  const targets = await page.evaluate(() => [...document.querySelectorAll('.rail-cell, .rail-pref .chip, .rail-more')]
    .map((e) => Math.round(e.getBoundingClientRect().height)).filter((n) => n < 44))
  ok('and nothing in it is under a thumb (rule 35)', targets.length === 0, targets.join(' '))

  // Three ways out, because a menu with one way out is a trap on a phone.
  const shut = async () => (await page.locator('.rail-panel').count()) === 0
  await page.locator('.rail-more').click(); await page.waitForTimeout(300)
  ok('the same button closes it', await shut())
  await page.locator('.rail-more').click(); await page.waitForTimeout(300)
  await page.locator('.rail-catch').click({ position: { x: 60, y: 60 } }); await page.waitForTimeout(300)
  ok('and pressing away from it closes it', await shut())
  await page.locator('.rail-more').click(); await page.waitForTimeout(300)
  await page.locator('.rail-cell').first().focus()
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  ok('and so does Escape', await shut())

  // One step, not two. Closing and then going were two history entries that
  // raced, and the race put you back on the screen you started from.
  await page.locator('.rail-more').click(); await page.waitForTimeout(300)
  await page.locator('.rail-cell', { hasText: 'Support' }).click(); await page.waitForTimeout(400)
  const landed = await page.evaluate(() => ({ hash: location.hash, h1: document.querySelector('h1')?.textContent }))
  ok('a place in it goes to that place', /\/support/.test(landed.hash) && landed.h1 === 'Support',
     `${landed.hash} — ${landed.h1}`)
  await page.goBack(); await page.waitForTimeout(400)
  ok('and back from there is the screen you opened it on, not the panel again',
     (await page.evaluate(() => location.hash)) === '#/' && (await page.locator('.rail-panel').count()) === 0,
     await page.evaluate(() => location.hash))
}

/* THE SCREENS THEMSELVES
   Two faults, on every screen that had them. A title beside three labelled
   buttons wrapped onto its own block and sat on top of them — Activity read
   "Acti…" under Mark all read / Statement / Export. And five screens still
   drew a three-column table with sort carets, which is a spreadsheet somebody
   has been asked to use with a thumb. */
console.log('\nEVERY SCREEN, ON A PHONE')
{
  const ROUTES = ['/', '/invest', '/invest/aapl', '/transfer', '/grow', '/activity',
    '/statement', '/account', '/security', '/send', '/addmoney', '/withdraw', '/bucket']
  const clipped = [], tabled = []
  for (const r of ROUTES) {
    await page.goto(base + r, { waitUntil: 'networkidle' }); await page.waitForTimeout(200)
    // The longest text the heading can ever hold, not whichever one is on
    // screen at the moment this runs. Home's is a greeting, so its length is a
    // function of the time of day: "Good afternoon, Chinaza" clipped and "Good
    // morning, Chinaza" did not, and this check passed every morning for three
    // tiers. A check whose input is the wall clock is only sometimes running.
    const said = await page.evaluate(() => {
      const t = document.querySelector('h1')
      if (!t) return { clip: false, tables: document.querySelectorAll('main.content .table').length }
      const was = t.textContent
      const worst = /^Good (morning|afternoon|evening)/.test(was ?? '')
        ? 'Good afternoon, ' + (was ?? '').split(', ').slice(1).join(', ')
        : was
      t.textContent = worst
      const clip = t.scrollWidth > t.clientWidth + 1
      t.textContent = was
      return { clip, worst, tables: document.querySelectorAll('main.content .table').length }
    })
    if (said.clip) clipped.push(r + (said.worst ? ` ("${said.worst}")` : ''))
    if (said.tables) tabled.push(`${r} (${said.tables})`)
  }
  ok('no screen cuts off its own title', clipped.length === 0, clipped.join(' '))
  ok('and none of them draws a table at a thumb', tabled.length === 0, tabled.join(' '))

  // The overflow. One action stays, the rest are one press away — and a state
  // like "All caught up" is listed rather than vanishing, because a control
  // that quietly disappears is not an answer to the question it used to
  // answer.
  await page.goto(base + '/activity', { waitUntil: 'networkidle' }); await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'More on this screen' }).click(); await page.waitForTimeout(250)
  const menu = await page.locator('.pop-row, .pop-said').allTextContents()
  ok('the header keeps one action and lists the rest',
     menu.some((t) => /Statement/.test(t)) && menu.some((t) => /Export/.test(t)),
     menu.join(', '))
  await page.keyboard.press('Escape'); await page.waitForTimeout(200)

  // Five filter chips on two rows, a search field and an order row was two
  // hundred pixels of controls before a single thing that had happened.
  const filter = page.locator('.chip').filter({ hasText: 'All' }).first()
  ok('the filter says which one is on, and how many are unread',
     /All/.test(await filter.textContent() ?? '') && /\d/.test(await filter.textContent() ?? ''),
     await filter.textContent())
  await filter.click(); await page.waitForTimeout(250)
  const opts = await page.locator('.pop-row').allTextContents()
  ok('and holds all five of them', opts.length === 5, opts.join(', '))
  await page.locator('.pop-row', { hasText: 'Trades' }).click(); await page.waitForTimeout(350)
  ok('and picking one filters the feed',
     (await page.evaluate(() => location.hash)).includes('filter=trades'),
     await page.evaluate(() => location.hash))

  // What replaced the table: the feed's own row, everywhere.
  await page.goto(base + '/invest', { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  const shape = await page.evaluate(() => {
    const row = document.querySelector('main.content .feed-row')
    if (!row) return null
    return {
      figure: !!row.querySelector('.row-figure'),
      lines: row.querySelector('.row-figure')?.children.length ?? 0,
      trail: !!row.querySelector('.row-trail'),
      tall: Math.round(row.getBoundingClientRect().height),
    }
  })
  ok('the companies are rows with a price over its day move, and the bucket still on them',
     !!shape && shape.figure && shape.lines === 2 && shape.trail && shape.tall >= 44,
     JSON.stringify(shape))

  // Both product cards on the first screen, which 280 pixels of picture each
  // did not allow.
  await page.goto(base + '/grow', { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  const second = await page.evaluate(() => {
    const c = document.querySelectorAll('.card.prod')
    return c.length > 1 ? Math.round(c[1].getBoundingClientRect().top) : -1
  })
  ok('Borrow is on the same screen as Lend', second > 0 && second < 844, `starts at ${second}`)
}

console.log('\nERRORS: ' + (errs.length ? errs.join('\n') : 'none'))
await browser.close()
