/* Getting Started, before and after, from two real builds.
   ---------------------------------------------------------------------------
   4321 is the working tree. 4322 is a worktree at the commit before this work,
   where the three cards are still 485x600 exports. Nothing here is drawn from
   memory: where a shot has a before, the before is a browser pointed at the
   older build.

     (cd site && python3 -m http.server 4321) &
     git worktree add /tmp/gs-before <sha>
     (cd /tmp/gs-before/site && python3 -m http.server 4322) &
     node app/scripts/_siteshots-gs.mjs [outdir]

   Two rules, both learned the hard way.

   A fresh page per shot. Hovering card two after card one, in one page, leaves
   the pointer somewhere Playwright will not always re-enter from, and a run
   that never started photographs as a card at rest — which is a picture of the
   old behaviour filed under the new one.

   And a shot waits for its state rather than for a stopwatch. The runs are
   driven by setTimeout, so under load they drift; "wait 4.4 seconds and press
   the shutter" came back with the sheet halfway through a step about a third
   of the time. `till` waits for the thing the shot is of, which cannot drift
   and cannot lie. */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = process.argv[2] ?? '/tmp/gs-shots'
mkdirSync(OUT, { recursive: true })
const AFTER = 'http://localhost:4321/index.html'
const BEFORE = 'http://localhost:4322/index.html'
const SIZES = [[1440, 1000, '1440'], [834, 1112, '834'], [390, 844, '390']]

const up = async (u) => { try { return (await fetch(u)).ok } catch { return false } }
for (const [name, u] of [['after', AFTER], ['before', BEFORE]]) {
  if (await up(u)) continue
  console.log(`no ${name} build on ${u} — nothing to compare, skipping.`)
  console.log('Serve each with: python3 -m http.server 4321 (and 4322 from a worktree)')
  process.exit(0)
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let bad = 0
const shots = []

/** A page at one size, on one build, scrolled to the section, fonts blocked so
 *  two builds cannot differ by whose webfont arrived first. */
async function open(url, w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  p.on('pageerror', (e) => { console.error('  PAGE ERROR  ' + e.message); bad++ })
  p.setDefaultTimeout(12000)
  await p.goto(url, { waitUntil: 'load' })
  /* Walk the page first, so the lazy images actually start loading, and then
     wait for them to land. This is not tidiness: the images above this
     section are what set its position, and a hover taken before they arrive
     is a hover on a card that is about to be somewhere else. Two hundred
     milliseconds after one such hover the section had moved 233px, the
     pointer was outside the card, and the run tore itself down — which
     photographed as a card at rest under the caption "mid-run". */
  await p.evaluate(async () => {
    const step = innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 90))
    }
  })
  // Only the ones that are actually drawn: the page carries an image that is
  // display:none above a phone and lazy with it, so it never loads at all and
  // waiting for it waits forever.
  await p.waitForFunction(() => [...document.images]
    .filter((i) => i.getClientRects().length)
    .every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 25000 })
  // The cards arrive on a reveal, in CSS and again in JS; a shot taken
  // through either is a shot of a transition. Land them first.
  await p.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((e) => {
      e.style.transition = 'none'
      e.classList.add('in')
    })
    document.querySelectorAll('.gs-step').forEach((e) => {
      e.style.transition = 'none'
      e.style.opacity = ''
      e.style.transform = ''
    })
  })
  await p.evaluate(() => document.querySelector('.gs-steps')
    .scrollIntoView({ block: 'center', behavior: 'instant' }))
  // And then hold until the section has stopped moving, whatever moved it.
  await p.waitForFunction(() => {
    const r = document.querySelector('.gs-steps').getBoundingClientRect()
    const was = window.__gsTop
    window.__gsTop = r.top
    return was !== undefined && Math.abs(was - r.top) < 0.5
  }, null, { timeout: 15000, polling: 120 })
  return p
}

/** Start a card's run, and wait until the arrow is demonstrably on it. */
async function begin(p, kind) {
  await p.hover(`.gs-mock[data-gs="${kind}"]`)
  await p.waitForFunction((k) => document.querySelector(`.gs-mock[data-gs="${k}"] .gs-cursor`)
    .classList.contains('is-on'), kind, { timeout: 8000 })
}

/** Hold until the card is in the state this shot is of, re-hovering if the
 *  run has died on the way. `test` is a predicate on the mock element, run in
 *  the page.
 *
 *  Self-healing on purpose. A hover run is at the mercy of anything that
 *  moves the page under a pointer that is not moving, and a capture script
 *  that waits patiently for a run that stopped thirty seconds ago produces
 *  nothing but a stale picture and a confident caption. If the arrow is not
 *  on the card, put it back and keep waiting. */
async function till(p, kind, test, label) {
  const sel = `.gs-mock[data-gs="${kind}"]`
  const read = () => p.evaluate(([k, src]) => {
    const m = document.querySelector(`.gs-mock[data-gs="${k}"]`)
    // eslint-disable-next-line no-new-func
    return {
      hit: !!new Function('m', 'return (' + src + ')(m)')(m),
      live: m.querySelector('.gs-cursor').classList.contains('is-on'),
      text: m.innerText.replace(/\s+/g, ' ').trim(),
    }
  }, [kind, test.toString()])

  const deadline = Date.now() + 25000
  let last = null
  while (Date.now() < deadline) {
    last = await read()
    if (last.hit) {
      await p.waitForTimeout(240)   // let whatever got here finish moving
      return
    }
    if (!last.live) await p.hover(sel)
    await p.waitForTimeout(120)
  }
  console.error(`  NEVER ARRIVED  ${label}\n           card reads "${(last && last.text || '').slice(-120)}"`)
  bad++
}

const save = async (p, sel, name, note) => {
  /* An element taller than the viewport is captured by scrolling and
     stitching, and the sticky nav is painted into every strip — so it lands
     in the middle of the picture, across whichever card happened to be under
     it. That is a capture artefact and not what anybody sees, so it steps
     out of the way while the shutter is open. */
  const tall = await p.evaluate((s) =>
    document.querySelector(s).getBoundingClientRect().height > innerHeight, sel)
  if (tall) await p.evaluate(() => { document.querySelector('.nav').style.visibility = 'hidden' })
  await p.locator(sel).screenshot({ path: `${OUT}/${name}.png` })
  if (tall) await p.evaluate(() => { document.querySelector('.nav').style.visibility = '' })
  shots.push(note ? `${name}  (${note})` : name)
}

/* Everything a predicate touches has to exist in the page: they are handed
   across as source and rebuilt there, so a helper defined out here is a
   ReferenceError with a stack trace nobody reads. */

/* ---- 1. the section, at rest, both builds, three sizes ----
   Three exported photographs, then three live screens. This is the shot the
   whole change is about, so it is the one taken at every size. */
for (const [w, h, tag] of SIZES) {
  for (const [side, url] of [['before', BEFORE], ['after', AFTER]]) {
    const p = await open(url, w, h)
    await save(p, '.gs-steps', `01-section-${tag}-${side}`)
    await p.close()
  }
}

/* ---- 2. each card, at the moment its run is most itself ----
   The before build has no such moment — that is the point — so the same card
   is photographed at rest there, which is the only state it has. */
const RUNS = [
  ['signup', 'two fields in, a third filling',
    (m) => m.querySelector('[data-f="name"] .m-val').textContent === 'Chinaza Okoro' &&
           m.querySelector('[data-f="email"] .m-val').textContent.length > 2],
  ['fund', 'the account number, copied',
    (m) => m.querySelector('.m-acct[data-on]') && /Copied/.test(m.textContent)],
  ['invest', 'a tick on the row and one in the bucket',
    (m) => m.querySelector('.m-bucket.is-on') && m.querySelector('.m-add.is-done')],
]
for (const [w, h, tag] of SIZES) {
  for (const [i, [kind, note, test]] of RUNS.entries()) {
    const before = await open(BEFORE, w, h)
    await save(before, `.gs-step:nth-child(${i + 1}) .gs-shot`, `02-${kind}-${tag}-before`, 'an export')
    await before.close()

    const p = await open(AFTER, w, h)
    await begin(p, kind)
    await till(p, kind, test, `02-${kind}-${tag}-after`)
    await save(p, `.gs-mock[data-gs="${kind}"]`, `02-${kind}-${tag}-after`, note)
    await p.close()
  }
}

/* ---- 3. the frames worth having on their own ----
   A sheet up with three ways to choose between, and a form that has just been
   sent: both are states the old section could not show at all. */
const EXTRA = [
  ['fund', '03-fund-sheet-1440-after', 'the sheet up, three ways on it',
    (m) => m.querySelector('.m-sheet[data-on]') &&
           !m.querySelector('[data-f="bank"]').classList.contains('is-gone') &&
           m.querySelector('[data-f="bank"]').classList.contains('is-hot')],
  ['signup', '04-signup-sent-1440-after', 'four fields in and the button pressed',
    (m) => /Checking your invite/.test(m.querySelector('[data-f="go"]').textContent)],
  ['invest', '05-invest-search-1440-after', 'four letters, and a list that took them',
    (m) => m.querySelector('[data-f="search"] .m-val').textContent === 'appl' &&
           /1 compan/i.test(m.textContent)],
]
for (const [kind, name, note, test] of EXTRA) {
  const p = await open(AFTER, 1440, 1000)
  await begin(p, kind)
  await till(p, kind, test, name)
  await save(p, `.gs-mock[data-gs="${kind}"]`, name, note)
  await p.close()
}

console.log(shots.join('\n'))
console.log(bad ? `\n${bad} shot(s) NEVER ARRIVED` : '\nevery shot waited for the state it is of')
await b.close()
process.exit(bad ? 1 : 0)
