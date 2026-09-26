/* The Getting Started run, on the marketing site.
   ---------------------------------------------------------------------------
   Three cards that used to be 485x600 exports are live markup now, and each
   plays a short scripted run when a pointer arrives. This drives them the way
   a pointer would and reads the DOM at the moments each step is meant to have
   landed.

   Wants the site on 4321, which an app sweep does not start — hence the
   `_site` prefix, which is how all.sh knows to leave it alone. Run it by hand:

     npx serve site -l 4321 &          # or anything that does cleanUrls
     SITE_URL=http://localhost:4321 node app/scripts/_sitegs.mjs

   The timings below are read off the driver's own step durations. They are
   deliberately sampled between two steps rather than on the boundary of one:
   a check that fires exactly when a step does is a check that fails on a
   loaded machine and tells you nothing about the product. */
import { launch, open } from './_sitelib.mjs'

const b = await launch()
let fail = 0
const ok = (cond, what) => {
  console.log(`${cond ? '  ok  ' : '  FAIL'}  ${what}`)
  if (!cond) fail++
}

const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
p.setDefaultTimeout(9000)
p.on('pageerror', (e) => { console.log('  FAIL  page error: ' + e.message); fail++ })

await open(p, '/')
await p.waitForTimeout(500)
await p.evaluate(() => document.querySelector('.gs-steps')
  .scrollIntoView({ block: 'center', behavior: 'instant' }))
await p.waitForTimeout(900)

const text = (k, s) => p.$eval(`.gs-mock[data-gs="${k}"] ${s}`, (e) => e.textContent.trim())
  .catch(() => '<missing>')
const has = (k, s, c) => p.$eval(`.gs-mock[data-gs="${k}"] ${s}`, (e, x) => e.classList.contains(x), c)
  .catch(() => false)
const attr = (k, s, a) => p.$eval(`.gs-mock[data-gs="${k}"] ${s}`, (e, x) => e.hasAttribute(x), a)
  .catch(() => false)
const shown = (k) => p.$eval(`.gs-mock[data-gs="${k}"] .gs-cursor`, (c) => c.classList.contains('is-on'))

/** Is the arrow pointing at this? Its tip is its box's top-left corner, which
 *  is the whole reason it is an arrow and not a dot: the tip is on the target
 *  and the body is somewhere the target is not. */
const onTarget = (k, sel) => p.evaluate(([kind, s]) => {
  const mock = document.querySelector(`.gs-mock[data-gs="${kind}"]`)
  const t = mock.querySelector(s)
  if (!t) return 'no such target'
  const a = t.getBoundingClientRect(), r = mock.querySelector('.gs-cursor').getBoundingClientRect()
  return (r.left >= a.left - 4 && r.left <= a.right + 4 && r.top >= a.top - 4 && r.top <= a.bottom + 4)
    ? 'on' : `off by (${Math.round(r.left - (a.left + a.width / 2))}, ${Math.round(r.top - (a.top + a.height / 2))})`
}, [k, sel])

/* Nothing about a hover run should be reachable by a screen reader: it is one
   illustration a screen, and the caption says what it shows. */
console.log('\n--- the markup ---')
ok((await p.$$eval('.gs-mock', (e) => e.length)) === 3, 'three mocks')
ok((await p.$$eval('.gs-mock[role="img"][aria-label]', (e) => e.length)) === 3, 'each is one captioned image')
ok((await p.$$eval('.gs-win[aria-hidden="true"]', (e) => e.length)) === 3, 'each screen is hidden from the reader')
ok((await p.$$eval('.gs-mock img', (e) => e.length)) === 0, 'no screenshots left in the section')
/* The icons are one sprite and forty <use>s. A <use> inherits from the <use>,
   not from where the symbol is written, so paint the stroke on the wrong side
   and every glyph renders as a filled black blob — at this size, a change a
   whole-image pixel diff will not notice. Ask the computed style instead. */
ok((await p.$$eval('.gs-mock use', (e) => e.length)) > 20, 'the icons are uses of one sprite')
const ink = await p.$eval('.gs-mock .m-i', (e) => {
  const c = getComputedStyle(e)
  return `${c.fill} / ${c.stroke} / ${c.strokeWidth}`
})
ok(/^none \/ rgb/.test(ink), `line icons are stroked, not filled: ${ink}`)
const arrow = await p.$eval('.gs-arrow', (e) => getComputedStyle(e).fill)
ok(arrow !== 'none' && arrow !== 'rgb(0, 0, 0)', `the arrow is filled: ${arrow}`)
/* The signed-in screens carry the product's own tab rail; the sign-up screen
   does not, because you are not in yet. */
ok((await p.$$eval('.gs-mock[data-gs="fund"] .m-rail, .gs-mock[data-gs="invest"] .m-rail',
  (e) => e.length)) === 2, 'the two signed-in screens have the tab rail')
ok((await p.$$eval('.gs-mock[data-gs="signup"] .m-rail', (e) => e.length)) === 0,
  'and the sign-up screen does not')
/* The screens are the app at phone scale — 390 design pixels wide, with the
   app's own 56px buttons and 48px fields and 20px card padding — and the glass
   shows 507 of the 850-1,000 each one is tall. That is the point: nothing is
   squeezed to fit, the run pans instead. */
for (const k of ['signup', 'fund', 'invest']) {
  const m = await p.evaluate((kind) => {
    const mock = document.querySelector(`.gs-mock[data-gs="${kind}"]`)
    const win = mock.querySelector('.gs-win').getBoundingClientRect()
    const phone = mock.querySelector('.gs-phone').getBoundingClientRect()
    const scr = mock.querySelector('.gs-scr').getBoundingClientRect()
    const k = win.width / 390                 // page pixels per screen pixel
    // Everything is laid out at page scale, so read it back and divide into
    // the screen's own pixels — which is where the app's numbers live.
    const at = (sel, prop) => {
      const e = mock.querySelector(sel)
      return e ? +(parseFloat(getComputedStyle(e)[prop]) / k).toFixed(1) : null
    }
    return {
      glassW: win.width, phoneW: phone.width,
      glass: Math.round(win.height / k),
      screen: Math.round(scr.height / k),
      btn: at('.m-btn', 'height'), field: at('.m-field', 'height'),
      pad: at('.m-card', 'paddingTop'), body: at('.m-body', 'fontSize'),
    }
  }, k)
  /* The one that matters most. The screen is sized from a container unit, and
     the first attempt did it through `tan(atan2(100cqw, 390px))` — a number,
     which has to resolve before layout, which is while a container unit is
     still 0. Chromium deferred it and rendered correctly; Safari resolved it
     as written and drew every card empty. Whatever the mechanism, the screen
     has to come out exactly as wide as the glass it is drawn in. */
  ok(Math.abs(m.phoneW - m.glassW) < 1,
    `${k}: the screen is drawn the width of its glass (${m.phoneW.toFixed(1)} vs ${m.glassW.toFixed(1)})`)
  ok(Math.abs(m.glass - 507) <= 2, `${k}: the glass shows ${m.glass} of the screen's own pixels`)
  ok(m.screen > m.glass + 150,
    `${k}: the screen is ${m.screen} tall, so the run has somewhere to pan`)
  ok(m.btn === null || Math.abs(m.btn - 56) < 0.5, `${k}: buttons are the app's 56 (${m.btn})`)
  ok(m.field === null || Math.abs(m.field - 48) < 0.5, `${k}: fields are the app's 48 (${m.field})`)
  ok(m.pad === null || Math.abs(m.pad - 20) < 0.5, `${k}: cards pad 20 (${m.pad})`)
  ok(m.body === null || Math.abs(m.body - 14) < 0.5, `${k}: body is 14 (${m.body})`)
}
/* The rail and the sheet are pinned to the glass, not to the page: pan the
   screen and they stay where a thumb left them, which is what they do in the
   product. */
for (const k of ['fund', 'invest']) {
  ok(await p.$eval(`.gs-mock[data-gs="${k}"] .m-rail`,
    (e) => e.parentElement.classList.contains('gs-phone')),
    `${k}: the tab rail is pinned to the glass, not to the page`)
}
ok(await p.$eval('.gs-mock[data-gs="fund"] .m-sheet',
  (e) => e.parentElement.classList.contains('gs-phone')),
  'and so is the sheet')

console.log('\n--- at rest ---')
ok(!(await shown('signup')), 'the arrow is parked')
ok((await text('signup', '[data-f="code"] .m-val')) === '', 'nothing is typed')
ok(!(await attr('fund', '.m-sheet', 'data-on')), 'the sheet is down')
ok((await text('invest', '.m-count')) === '6 companies', 'the whole list is showing')
ok(!(await has('invest', '.m-bucket', 'is-on')), 'the bucket is empty, so it has no badge')

/* ----------------------------------------------------------- 1. signup ---
   Four fields and a button, about seven and a half seconds. */
console.log('\n--- signup ---')
await p.hover('.gs-mock[data-gs="signup"]')
await p.waitForTimeout(700)
ok(await shown('signup'), 'the arrow comes in')
ok((await onTarget('signup', '[data-f="code"]')) === 'on',
  `it lands on the invite field: ${await onTarget('signup', '[data-f="code"]')}`)
await p.waitForTimeout(700)
const typed = await text('signup', '[data-f="code"] .m-val')
ok(typed.length > 0 && 'TKN-4QX2'.startsWith(typed), `the code is filling: "${typed}"`)
await p.waitForTimeout(2600)
ok((await text('signup', '[data-f="code"] .m-val')) === 'TKN-4QX2', 'the code is in')
ok(await has('signup', '[data-f="code"]', 'is-done'), 'and marked done')
ok((await text('signup', '[data-f="name"] .m-val')) === 'Chinaza Okoro', 'the name is in')
await p.waitForTimeout(1900)
ok((await text('signup', '[data-f="email"] .m-val')) === 'chinaza.okoro@example.com', 'the address is in')
ok((await p.$$eval('.gs-mock[data-gs="signup"] .is-caret', (e) => e.length)) <= 1,
  'one caret in the window, at most')
await p.waitForTimeout(1400)
ok((await text('signup', '[data-f="pass"] .m-val')).length === 10, 'the password is in, as dots')
await p.waitForTimeout(1200)
ok((await text('signup', '[data-f="go"]')) === 'Checking your invite…',
  `the button takes it: "${await text('signup', '[data-f="go"]')}"`)
ok((await onTarget('signup', '[data-f="go"]')) !== 'on', 'and the arrow comes off it')
/* The button is 200 design pixels below anything the glass showed at rest, so
   pressing it means the page came up to it. That is the arrangement: the
   screen keeps the app's spacing and the run moves the page, rather than the
   spacing shrinking until a whole screen fits. */
const lifted = await p.$eval('.gs-mock[data-gs="signup"] .gs-scr',
  (e) => parseFloat(getComputedStyle(e).getPropertyValue('--pan')) || 0)
ok(lifted < -300, `the page came up to reach it (${Math.round(lifted)}px)`)

console.log('\n--- and leaving puts it all back ---')
await p.mouse.move(10, 10)
await p.waitForTimeout(400)
ok((await text('signup', '[data-f="code"] .m-val')) === '', 'the fields are empty again')
ok((await text('signup', '[data-f="go"]')) === 'Create account', 'the button is a button again')
ok(!(await shown('signup')), 'the arrow is gone')
ok(!(await has('signup', '[data-f="code"]', 'is-done')), 'and nothing is left tinted')
ok((await p.$eval('.gs-mock[data-gs="signup"] .gs-scr',
  (e) => parseFloat(getComputedStyle(e).getPropertyValue('--pan')) || 0)) === 0,
  'and the page is back at its top')

/* ------------------------------------------------------------- 2. fund --- */
console.log('\n--- add money ---')
await p.hover('.gs-mock[data-gs="fund"]')
/* The wallet's first move is the page, not the hand: the three doors are
   below the glass at rest, so the run brings them up before pressing one. */
await p.waitForTimeout(1000)
const panned = await p.$eval('.gs-mock[data-gs="fund"] .gs-scr',
  (e) => parseFloat(getComputedStyle(e).getPropertyValue('--pan')) || 0)
ok(panned < -80, `the page comes up to show all three doors (${Math.round(panned)}px)`)
await p.waitForTimeout(500)
ok((await onTarget('fund', '[data-f="add"]')) === 'on',
  `then the arrow lands on one: ${await onTarget('fund', '[data-f="add"]')}`)
await p.waitForTimeout(400)
ok(await attr('fund', '.m-sheet', 'data-on'), 'the sheet rises')
ok(await p.$eval('.gs-mock[data-gs="fund"] .gs-phone', (e) =>
  getComputedStyle(e, '::after').backgroundColor !== 'rgba(0, 0, 0, 0)'), 'and dims what it covers')
await p.waitForTimeout(950)
ok((await onTarget('fund', '[data-f="crypto"]')) === 'on', 'it reads the crypto row first')
await p.waitForTimeout(700)
ok((await onTarget('fund', '[data-f="bank"]')) === 'on', 'then settles on the bank one')
await p.waitForTimeout(600)
ok(await attr('fund', '.m-acct', 'data-on'), 'the account details take the sheet over')
ok(await has('fund', '[data-f="bank"]', 'is-gone'), 'the three ways stand down')
ok((await text('fund', '.m-sheet-h')) === 'Bank transfer', 'and the sheet says which one you picked')
await p.waitForTimeout(1400)
ok((await text('fund', '[data-f="copy"]')) === 'Copied', 'the number is copied')
await p.mouse.move(10, 10)
await p.waitForTimeout(500)
ok(!(await attr('fund', '.m-sheet', 'data-on')), 'the sheet goes back down')
ok((await text('fund', '.m-sheet-h')) === 'How are you adding it?', 'with its own question back')
ok(!(await has('fund', '[data-f="bank"]', 'is-gone')), 'and all three ways showing')

/* ----------------------------------------------------------- 3. invest --- */
console.log('\n--- invest ---')
await p.hover('.gs-mock[data-gs="invest"]')
await p.waitForTimeout(760)
ok((await onTarget('invest', '[data-f="search"]')) === 'on', 'the arrow lands on the search field')
await p.waitForTimeout(900)
ok((await text('invest', '[data-f="search"] .m-val')) === 'appl', 'four letters go in')
await p.waitForTimeout(700)
ok((await text('invest', '.m-count')) === '1 company', 'the list narrows to one')
ok(await has('invest', '.m-co[data-co="MSFT"]', 'is-gone'), 'and the rest stand down')
await p.waitForTimeout(700)
ok((await onTarget('invest', '.m-co[data-co="AAPL"]')) === 'on', 'the arrow reads the row')
await p.waitForTimeout(200)
ok((await onTarget('invest', '[data-f="add-aapl"]')) === 'on', 'then the plus on the end of it')
await p.waitForTimeout(1200)
ok(await has('invest', '[data-f="add-aapl"]', 'is-done'), 'the plus becomes a tick')
ok((await onTarget('invest', '[data-f="add-aapl"]')) !== 'on', 'and the arrow comes off the tick')
ok((await text('invest', '.m-bucket')) === '1', 'the bucket counts one')
ok(await has('invest', '.m-bucket', 'is-on'), 'and wears its badge')
await p.mouse.move(10, 10)
await p.waitForTimeout(500)
ok(!(await has('invest', '.m-bucket', 'is-on')), 'the badge goes when the run does')
ok((await text('invest', '[data-f="search"] .m-val')) === '', 'and the search is empty again')
/* The plus and the tick are two drawings and a class, not a character written
   over the button: write over it once and reset has nothing to put back. */
ok((await p.$$eval('.gs-mock[data-gs="invest"] [data-f="add-aapl"] svg', (e) => e.length)) === 2,
  'the plus is a plus again, both drawings intact')
ok(!(await has('invest', '[data-f="add-aapl"]', 'is-done')), 'and untinted')

/* --------------------------------------------------------- it goes round --
   Hover is a thing people hold, so one run is not the job. */
console.log('\n--- and round ---')
await p.hover('.gs-mock[data-gs="invest"]')
await p.waitForTimeout(5000)
const first = await text('invest', '.m-bucket')
await p.waitForTimeout(3400)
ok(first === '1', 'the first run finishes')
ok(!(await has('invest', '.m-bucket', 'is-on')), 'and the second one starts from the top')
await p.mouse.move(10, 10)

/* -------------------------------------------------- and with no script --
   The driver resets each card to frame one, so frame one has to be what the
   markup already says. If it is not, the section reads as a half-filled form
   for everybody whose JavaScript has not arrived yet. */
console.log('\n--- no script ---')
const dead = await b.newContext({ viewport: { width: 1440, height: 1000 }, javaScriptEnabled: false })
const d = await dead.newPage()
await d.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await open(d, '/')
await d.waitForTimeout(300)
const still = await d.$$eval('.gs-mock', (ms) => ms.every((m) =>
  [...m.querySelectorAll('.m-val')].every((v) => v.textContent === '') &&
  !m.querySelector('.m-sheet[data-on]') &&
  !m.querySelector('.m-bucket.is-on') &&
  !m.querySelector('.is-done') &&
  getComputedStyle(m.querySelector('.gs-cursor')).opacity === '0'))
ok(still, 'the markup is already frame one')
ok((await d.$eval('.gs-mock[data-gs="invest"] .m-count', (e) => e.textContent.trim())) === '6 companies',
  'with the whole list on it')
await dead.close()

/* ------------------------------------------------- and never on a phone --
   No hover there, so it plays once on arrival and stays on its last frame
   rather than snapping back to a form nobody asked to see. */
console.log('\n--- no hover, no pointer ---')
const t = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
await t.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await open(t, '/')
await t.waitForTimeout(400)
await t.evaluate(() => document.querySelector('.gs-mock[data-gs="signup"]')
  .scrollIntoView({ block: 'center', behavior: 'instant' }))
await t.waitForTimeout(3000)
const filled = await t.$eval('.gs-mock[data-gs="signup"] [data-f="code"] .m-val', (e) => e.textContent)
ok(filled.length > 0, `it plays itself into view: code reads "${filled}"`)
await t.close()

console.log(`\n${fail ? 'FAIL=' + fail : 'FAIL=0'}`)
await p.close()
await b.close()
process.exit(fail ? 1 : 0)
