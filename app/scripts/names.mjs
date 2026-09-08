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
ok('it read the quick actions', quick.length === 3, quick.map((q) => q.label).join(' | '))
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

/* The trail is a navigator too, and it was the one nothing here read.
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
    '/addmoney', '/receive', '/withdraw', '/send', '/bucket', '/invest/aapl',
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
    const bad = []
    for (const c of t) {
      if (!c.to) { bad.push(`"${c.label}" goes nowhere`); continue }
      if (c.to === r) { bad.push(`"${c.label}" is this page`); continue }
      // Somewhere a person could have come from: a tab in the navigation, or
      // a screen this one sits inside.
      if (!places.has(c.to) && !r.startsWith(c.to + '/')) {
        bad.push(`"${c.label}" (${c.to}) is neither a tab nor a step above ${r}`)
        continue
      }
      await at(c.to)
      const h1 = await p.evaluate(() => document.querySelector('h1')?.textContent?.trim() ?? '(none)')
      const a = c.label.toLowerCase(), b2 = h1.toLowerCase()
      if (!(a === b2 || b2.includes(a) || a.includes(b2))) bad.push(`"${c.label}" opens a page called "${h1}"`)
    }
    ok(`${r}  ${t.map((c) => c.label).join(' > ')}`, bad.length === 0, bad.join('; '))
  }
  ok('and it read some trails', trails >= 12, `${trails} trails`)
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
