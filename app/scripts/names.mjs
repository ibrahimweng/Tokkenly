/* A door says where it goes.

   Home had a door reading "Convert Cash" that opened a page called Transfer,
   which the code calls the wallet: three names for one place, and "Convert"
   named an operation that had stopped having a page two tiers earlier. Nobody
   caught it because nothing in here had ever compared a label to its
   destination — every suite tests a screen, and this fault lives in the gap
   between two screens.

   So: every label that leads somewhere is read, followed, and checked against
   the name the destination gives itself. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1200 } })
await seen(p)
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())

/* Home's greeting is the one heading that is not a page name, and it is not
   one on purpose: nothing navigates to "Good afternoon, Chinaza". Named here
   so it is an exception rather than an omission. */
const NOT_A_NAME = ['/']

const at = async (r) => {
  await p.goto('about:blank')
  await p.goto(B + r, { waitUntil: 'networkidle' })
  await p.waitForTimeout(200)
}

console.log('THE DOORS ON HOME')
await at('/')
const doors = await p.evaluate(() =>
  [...document.querySelectorAll('.card.gate')].map((e) => ({
    label: e.querySelector('.t-title')?.textContent?.trim(),
    to: (e.getAttribute('href') || '').replace(/^#/, ''),
  })))
// Three at this width. The Wallet door went when the rail is on screen with
// Wallet lit in it — a door to where you already are (11g.75). The phone,
// which has no rail, still has four.
ok('there are three of them', doors.length === 3, doors.map((d) => d.label).join(' | '))

console.log('THE RAIL')
await at('/')
const rail = await p.evaluate(() =>
  [...document.querySelectorAll('.nav-row')].map((e) => ({
    label: e.textContent.trim(), to: (e.getAttribute('href') || '').replace(/^#/, ''),
  })))
ok('it read the rail', rail.length >= 5, rail.map((r) => r.label).join(' | '))

console.log('THE QUICK ACTIONS, AND THE WALLET DOORS')
/* Its own page, seeded on Detailed. `seen` is an init script, so a click on
   the preference is undone by the next navigation. */
const d = await b.newPage({ viewport: { width: 1440, height: 1200 } })
await seen(d, { homeView: 'detailed' })
await d.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await d.goto(B + '/', { waitUntil: 'networkidle' }); await d.waitForTimeout(300)
const quick = await d.evaluate(() =>
  [...document.querySelectorAll('.row.tiles > *')].map((e) => ({
    label: e.querySelector('.t-title, .t-body-strong')?.textContent?.trim(),
    to: (e.getAttribute('href') || '').replace(/^#/, ''),
  })).filter((d) => d.label && d.to))
ok('it read the quick actions', quick.length === 4, quick.map((q) => q.label).join(' | '))
await d.close()
await at('/transfer')
const ways = await p.evaluate(() =>
  [...document.querySelectorAll('.row.equal > .card')].map((e) => ({
    label: e.querySelector('.t-title')?.textContent?.trim(), to: null, click: true,
  })))
// Two: money in and money out. Receive was a third, and it asked the same
// question as Add money — how does money get into this wallet — so it is a tab
// inside that one now.
ok('and the two doors on the wallet', ways.length === 2, ways.map((d) => d.label).join(' | '))

console.log('EVERY LABEL AGAINST THE PAGE IT OPENS')
const seenTo = new Set()
let checked = 0
for (const d of [...doors, ...rail, ...quick]) {
  if (!d.to || NOT_A_NAME.includes(d.to)) continue
  const key = d.label + ' ' + d.to
  if (seenTo.has(key)) continue
  seenTo.add(key)
  await at(d.to)
  const h1 = await p.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '(none)')
  checked += 1
  // The label may be the page's name, or may contain it — "Your bucket" for a
  // rail row reading "Bucket" is the same word doing the same job. What it may
  // not be is a different word.
  const a = d.label.toLowerCase(), c = h1.toLowerCase()
  ok(`${d.label} -> ${d.to}`, a === c || c.includes(a) || a.includes(c), `page says "${h1}"`)
}
ok('and it checked something', checked >= 7, `${checked} labels`)

/* The trail ends where you are (11g.60). It used to name parents only, which
   made "where am I" a question the trail declined to answer on the three
   screens that most needed it. Now the steps you passed are links and the last
   one is not, so what is checked is both halves: every parent goes somewhere
   real that is genuinely above here, and the last one goes nowhere because it
   is here.

   The trail is a navigator too, and it was the one nothing here read.
   Two faults were living in it. It ended on the page you were standing on,
   drawn from the registry's searchable label rather than the screen's title,
   so /receive read "Wallet > Receive money" over an <h1> saying "Add money"
   and /withdraw read "Send to your bank" over "Send money" — one place, two
   names, one line apart. And its root was whichever entry of the group came
   first in the list, so every customer screen filed under `account` — verify
   your identity, the disclosures, the index of every screen — told a customer
   they were standing inside the staff console.

   So a crumb has to earn its place three ways: it goes somewhere that is not
   here, it goes somewhere a person could have come from, and the page it goes
   to answers to the name the crumb gave it. */
console.log('THE TRAIL, AND WHERE IT SAYS YOU CAME FROM')
{
  const places = new Set(rail.map((r) => r.to).filter(Boolean))
  const TRAILED = [
    '/addmoney', '/addmoney/base', '/receive', '/withdraw',
    '/send/tokkenly', '/send/bank', '/send/base', '/bucket', '/invest/aapl',
    '/invest/aapl/invest', '/invest/aapl/sell', '/invest/aapl/send',
    '/grow/earn', '/grow/takeout', '/grow/borrow', '/grow/repay',
    '/statement', '/verify', '/all', '/disclosures',
  ]
  let trails = 0
  for (const r of TRAILED) {
    await at(r)
    const t = await p.evaluate(() => [...document.querySelectorAll('.crumbs .crumb')].map((e) => ({
      label: e.textContent.trim(), to: (e.getAttribute('href') || '').replace(/^#/, ''),
    })))
    if (!t.length) continue
    trails += 1
    // Where the browser actually is. Several old addresses now go to the one
    // the thing lives at — /withdraw is the bank way of Send — so the trail
    // belongs to that path and not to the one this loop typed.
    // The whole address, and its path. A crumb reading /send/bank on
    // /send/bank?to=gt is one step up rather than this page: the query is
    // where the destination lives, so dropping it makes a real step look like
    // a link to itself.
    const now = await p.evaluate(() => location.hash.replace(/^#/, ''))
    const at2 = now.split('?')[0]
    const bad = []
    for (let i = 0; i < t.length; i++) {
      const c = t[i]
      const last = i === t.length - 1
      // The last step is where you are standing. It says so and it is not a
      // link: a crumb you can press to go where you already are is a control
      // that does nothing.
      if (last) {
        if (c.to) bad.push(`"${c.label}" is where you are and is still a link`)
        continue
      }
      if (!c.to) { bad.push(`"${c.label}" goes nowhere`); continue }
      if (c.to === now) { bad.push(`"${c.label}" is this page`); continue }
      // Somewhere a person could have come from: a tab in the navigation, or
      // a screen this one sits inside.
      // A tab in the navigation, a screen this one sits inside, or this same
      // screen with less of the question answered — /send/bank is one step up
      // from /send/bank?to=gt, because the destination is in the query.
      const above = places.has(c.to) || at2.startsWith(c.to + '/') || (c.to === at2 && now !== at2)
      if (!above) {
        bad.push(`"${c.label}" (${c.to}) is neither a tab nor a step above ${now}`)
        continue
      }
      await at(c.to)
      // The name the destination gives itself. On a screen that is a rail and
      // a panel — Account, and now Send and Add money — the <h1> names the
      // screen and the lit row names the panel, and a crumb pointing at a
      // panel is answered by the row rather than by the title. Either will do.
      const said = await p.evaluate(() => [
        document.querySelector('h1')?.textContent?.trim(),
        document.querySelector('.set-row.on .t-body-strong')?.textContent?.trim(),
      ].filter(Boolean))
      const a = c.label.toLowerCase()
      const fits = said.some((n) => {
        const b2 = n.toLowerCase()
        return a === b2 || b2.includes(a) || a.includes(b2)
      })
      if (!fits) bad.push(`"${c.label}" opens a page called "${said.join('" or "')}"`)
      await at(r)
    }
    ok(`${r}  ${t.map((c) => c.label).join(' > ')}`, bad.length === 0, bad.join('; '))
  }
  ok('and it read some trails', trails >= 12, `${trails} trails`)
}

/* Twelve of the thirteen companies had no trail at all.
   -------------------------------------------------------------------------
   The registry is what the breadcrumbs read, and it held four hand-written
   lines for Apple. So Apple's page said Invest > Apple and Disney's said
   nothing: a bare title, on the screen the whole product is for, with no way
   back but the rail. This file passed the whole time because the list above
   samples /invest/aapl.

   So the set is taken from the product rather than typed here. A fourteenth
   company is covered the day it is added. */
console.log('EVERY COMPANY, NOT A SAMPLE')
{
  // The card on Invest previews five now (11g.69), so the whole set is on the
  // category's own screen. Taken from the product either way — a fourteenth
  // company is covered the day it is added.
  await at('/invest/list/everything')
  const n = await p.locator('.table tbody tr').count()
  ok('the market lists them all', n >= 13, n + ' rows')
  const missing = []
  const wrong = []
  for (let i = 0; i < n; i++) {
    await at('/invest/list/everything')
    await p.locator('.table tbody tr').nth(i).click()
    await p.waitForTimeout(420)
    const m = await p.evaluate(() => ({
      at: location.hash.replace(/^#/, ''),
      name: document.querySelector('h1')?.textContent?.trim() ?? '',
      trail: [...document.querySelectorAll('.crumbs .crumb')].map((e) => e.textContent.trim()),
    }))
    if (!m.trail.length) { missing.push(m.at || '(' + m.name + ')'); continue }
    // Invest first, the company last. The middle crumb is the grouping you
    // came through, which here is the Everything screen.
    if (m.trail[0] !== 'Invest' || m.trail[m.trail.length - 1] !== m.name) wrong.push(m.name + ': ' + m.trail.join(' > '))
  }
  ok('every one of them has a trail', missing.length === 0, missing.join(', '))
  ok('and every trail starts at Invest and ends where you are', wrong.length === 0, wrong.join(' | '))

  // Everything is an index of screens, and a company is a row on one rather
  // than a screen of its own. Registering all thirteen for their trails turned
  // Invest's eight entries into thirty-three, most of them reading "Sell Meta"
  // — which told anybody reading the index that the product has thirty-three
  // places under Invest. Addressable, trailed, findable, not listed.
  await at('/all')
  const inv = await p.evaluate(() => {
    const c = [...document.querySelectorAll('section.card')]
      .find((x) => /^Invest$/i.test(x.querySelector('.card-head')?.textContent?.trim() ?? ''))
    return c ? [...c.querySelectorAll('.all-row')].map((e) => e.querySelector('.t-body-strong')?.textContent?.trim()) : []
  })
  const PAGES = ['Invest', 'S&P 500', 'Nasdaq-100', 'Dow Jones',
                 'Where people start', 'Your watchlist', 'Moving today', 'Your bucket',
                 // The seven chips, each a screen since the card on Invest was
                 // capped at five rows (11g.69).
                 'Popular', 'ETFs', 'Technology', 'Steady', 'Consumer', 'Health',
                 'Everything listed']
  ok('Everything lists the pages under Invest', PAGES.every((x) => inv.includes(x)), inv.join(', '))
  ok('and nothing else', inv.length === PAGES.length, inv.length + ' rows: ' + inv.join(', '))
}

console.log('THE TRAIL NAMES THE LIST YOU CAME THROUGH')
{
  // One company has one address from every way in, so the address cannot say
  // which way that was. The trail can, and it is memory rather than address:
  // a link somebody sent you came through nothing.
  const via = async (from, who) => {
    await at(from)
    await p.locator('.table tbody tr, .feed-row, .start-row').filter({ hasText: who }).first().click()
    await p.waitForTimeout(450)
    return p.evaluate(() => [...document.querySelectorAll('.crumbs .crumb')].map((e) => e.textContent.trim()).join(' > '))
  }
  ok('from Moving today', (await via('/invest/list/movers', 'Disney')) === 'Invest > Moving today > Disney',
     await via('/invest/list/movers', 'Disney'))
  ok('from a chip on Invest', (await via('/invest?cat=Consumer', 'Disney')) === 'Invest > Consumer > Disney')
  ok("from an index's own table", (await via('/invest/index/sp500', 'Disney')) === 'Invest > S&P 500 > Disney')
  // Cold, in a tab that has been nowhere: no grouping to name, and the trail
  // says only what it knows.
  const cold = await b.newPage({ viewport: { width: 1280, height: 1000 } })
  await seen(cold)
  await cold.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await cold.goto(B + '/invest/dis', { waitUntil: 'domcontentloaded' })
  await cold.waitForTimeout(500)
  const alone = await cold.evaluate(() => [...document.querySelectorAll('.crumbs .crumb')].map((e) => e.textContent.trim()).join(' > '))
  ok('and a link somebody sent you names no list', alone === 'Invest > Disney', alone)
  await cold.close()
}

/* The two cards on Borrow & Lend were the same fault as Convert Cash and this
   file could not see them: it reads the gates on Home, the rail, the quick
   actions and the wallet's two doors, and a product card is none of those. So
   "Borrow money" opened a report headed Borrowing whose own main button says
   Repay, and nothing here noticed for three tiers.

   Pressed rather than read, because the CTA is a button with a handler and not
   an anchor — following what it actually does is the check, and reading an
   attribute it does not have would not have been one. */
console.log('THE PRODUCT CARDS')
{
  await at('/grow')
  const n = await p.locator('.card.prod .btn').count()
  ok('there are two of them', n === 2, n + ' cards')
  for (let i = 0; i < n; i++) {
    await at('/grow')
    const label = (await p.locator('.card.prod .btn').nth(i).textContent()).trim()
    await p.locator('.card.prod .btn').nth(i).click()
    await p.waitForTimeout(300)
    const m = await p.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim() ?? '(none)',
      where: location.hash.replace(/^#/, ''),
    }))
    const a = label.toLowerCase(), c = m.h1.toLowerCase()
    ok(`${label} -> ${m.where}`, a === c || c.includes(a) || a.includes(c), `page says "${m.h1}"`)
  }
}

/* Rule 49: a card header link names where it goes, never "see more". Ten of
   them said "See all", which names nothing — and the one on Home was the only
   route to the whole of Activity from a phone. */
console.log('EVERY CARD HEADER LINK NAMES SOMETHING')
{
  const VAGUE = /^(see all|see more|view all|more|all|see)$/i
  const WHERE = ['/', '/invest', '/transfer', '/grow', '/grow/borrowing', '/grow/lending', '/activity', '/account']
  const bad = []
  let read = 0
  for (const r of WHERE) {
    await at(r)
    const links = await p.evaluate(() =>
      [...document.querySelectorAll('.card-head .link, .card-head a.link')]
        .map((e) => e.textContent.trim()).filter(Boolean))
    read += links.length
    for (const l of links) if (VAGUE.test(l)) bad.push(`${r}: "${l}"`)
  }
  ok('it read some of them', read >= 6, read + ' links')
  ok('and none of them says only "see all"', bad.length === 0, bad.join('; '))
}

/* A screen has to say how to leave it, and on a phone two of them did not.
   Activity and Account are places, so on a desktop the rail lights them and
   that is the answer; on a phone the capsule holds four tabs and these two
   live behind More, so nothing was lit anywhere and the screen read as being
   nowhere. Every route, at the width where it went wrong. */
console.log('EVERY SCREEN SAYS HOW TO LEAVE IT, ON A PHONE')
{
  const m = await b.newPage({ viewport: { width: 390, height: 844 } })
  await seen(m)
  await m.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const ROUTES = [
    '/', '/invest', '/invest/aapl', '/transfer', '/grow', '/grow/lending', '/grow/borrowing',
    '/grow/borrow', '/grow/repay', '/grow/earn', '/grow/takeout', '/activity',
    '/activity?filter=alerts', '/account', '/account/preferences', '/account/security',
    '/account/details', '/account/payments', '/support', '/bucket', '/send', '/receive',
    '/addmoney', '/withdraw', '/verify', '/all', '/disclosures', '/statement',
    '/invest/aapl/invest', '/invest/aapl/sell', '/invest/aapl/send',
  ]
  const orphans = []
  for (const r of ROUTES) {
    await m.goto('about:blank')
    await m.goto(B + r, { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(200)
    const way = await m.evaluate(() => {
      const vis = (e) => {
        if (!e) return false
        const s = getComputedStyle(e), box = e.getBoundingClientRect()
        return s.display !== 'none' && s.visibility !== 'hidden' && box.width > 0 && box.height > 0
      }
      const sheet = document.querySelector('.scrim .sheet')
      if (sheet) return vis(sheet.querySelector('.close')) ? 'close' : ''
      if (vis(document.querySelector('.page-back'))) return 'back'
      if (vis(document.querySelector('.crumbs'))) return 'crumbs'
      if ([...document.querySelectorAll('.rail-tab')].some((t) => t.getAttribute('aria-current'))) return 'tab'
      if (vis(document.querySelector('.rail-more.is-here'))) return 'more'
      return ''
    })
    if (!way) orphans.push(r)
  }
  ok(`no screen is a dead end at 390  (${ROUTES.length} routes)`, orphans.length === 0, orphans.join(' '))
  await m.close()
}

console.log('\nerrors: ' + (errs.length ? errs.join('\n') : 'none'))
await b.close()
