/* Human and simple, made countable.

   The brief was one sentence: the words in this product have to be human and
   simple, so somebody who has never bought a share can read a screen once and
   act on it. That is a rule, and a rule nobody can check is a preference — the
   same lesson rule 13 cost four tiers to learn.

   So this walks the real screens and counts what actually makes copy hard:

     Long sentences. Nielsen Norman's finding is that people read about 25%
     slower on a screen than on paper, and the fintech-writing research is
     blunter still: the sentence that loses somebody is the one that carries
     two ideas. Twenty-four words is the ceiling here, and prose blocks the
     disclosures own are exempt because a legal page is read, not scanned.

     Em dashes and semicolons. Both are ways of joining two sentences that
     wanted to be two sentences. This product used to be full of them.

     Jargon with no plain word beside it. "Custodial", "collateral",
     "liquidity", "slippage" and the rest are words insiders forget are words.
     Each is allowed exactly where the screen also explains it, and nowhere
     else.

   It is not a style police. It reports the sentence and the screen, so what
   comes back is a list somebody can rewrite, not a score. */
import { chromium } from 'playwright'
import { seen, verify } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)

/* Every screen a customer meets. The console is staff-facing and holds itself
   to the same rule, so it is in here too. */
const ROUTES = [
  '/', '/invest', '/invest/aapl', '/invest/aapl/invest', '/invest/aapl/sell',
  '/transfer', '/addmoney', '/addmoney?via=card', '/send', '/send?to=Tunde%20Bakare',
  '/send?rail=bank&to=gt', '/receive', '/grow', '/grow/borrow', '/grow/earn',
  '/activity', '/activity?filter=alerts', '/statement', '/bucket',
  '/account', '/account/preferences', '/account/wallet', '/account/verification',
  '/account/payments', '/account/security', '/account/support',
  '/admin', '/admin/switches', '/admin/launch', '/signin', '/signup', '/verify',
]

/** Sentences the rule does not apply to.
 *
 *  It is empty, and that is the finding. The first version of this file
 *  exempted the disclosures and the questions-people-ask block, on the
 *  reasoning that a legal page is read rather than scanned and an answer is
 *  allowed to be an answer. Both then passed without the exemption: breaking
 *  the risk warnings into short sentences did not cost them a single fact, and
 *  reading them afterwards they are plainly better.
 *
 *  So nothing is exempt. If something ever needs to be, it goes here with the
 *  reason beside it, and the reason has to survive somebody asking "why can
 *  this one be hard to read". */
const EXEMPT = []

const MAX_WORDS = 24

/* Words insiders forget are words. Each is allowed only on a screen that also
   says what it means, in the plain word beside it. */
const JARGON = [
  ['custodial', /self-custodial|custodian/i],
  ['collateral', /back(s|ed|ing)? the loan/i],
  ['liquidity', /available|on the book/i],
  ['slippage', /at least|the least/i],
  ['principal', /what you borrowed/i],
  ['remittance', null],
  ['disbursement', null],
  ['onboarding', null],
  ['utilise', null],
  ['leverage', null],
]

const p = await b.newPage({ viewport: { width: 1440, height: 1200 } })
await seen(p)
p.setDefaultTimeout(8000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await verify(p)

const long = []
const dashed = []
const jargon = []

for (const r of ROUTES) {
  await p.goto(B + r, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(280)
  const found = await p.evaluate(({ exempt, max }) => {
    const out = { long: [], dashed: [], text: '' }
    const skip = new Set()
    for (const [sel] of exempt) for (const e of document.querySelectorAll(sel)) skip.add(e)
    const isSkipped = (e) => { for (const s of skip) if (s === e || s.contains(e)) return true; return false }
    // Leaf elements only, so a sentence is not counted once per wrapper.
    for (const e of document.querySelectorAll('.content p, .content span, .content small, .content h1, .content h2, .content li, .pop span')) {
      if (e.querySelector('*')) continue
      if (isSkipped(e)) continue
      const t = (e.textContent ?? '').replace(/\s+/g, ' ').trim()
      if (!t || t.length < 12) continue
      out.text += ' ' + t
      if (/[—–;]/.test(t)) out.dashed.push(t)
      // A sentence, not a paragraph: split on full stops that end one.
      for (const s of t.split(/(?<=[.!?])\s+/)) {
        const n = s.trim().split(/\s+/).length
        if (n > max) out.long.push({ n, s: s.trim() })
      }
    }
    return out
  }, { exempt: EXEMPT, max: MAX_WORDS })

  for (const l of found.long) long.push({ r, ...l })
  for (const d of found.dashed) dashed.push({ r, s: d })
  for (const [word, near] of JARGON) {
    const re = new RegExp('\\b' + word, 'i')
    if (re.test(found.text) && !(near && near.test(found.text))) jargon.push({ r, word })
  }
}

console.log('EVERY SENTENCE A PERSON CAN READ IN ONE GO')
ok(`no sentence over ${MAX_WORDS} words`, long.length === 0,
   long.slice(0, 6).map((l) => `${l.r} (${l.n}w) "${l.s.slice(0, 70)}…"`).join('\n        ') || 'none')

console.log('AND SAID AS ONE SENTENCE, NOT TWO JOINED TOGETHER')
ok('no em dashes or semicolons in what a person reads', dashed.length === 0,
   dashed.slice(0, 6).map((d) => `${d.r}  "${d.s.slice(0, 70)}…"`).join('\n        ') || 'none')

console.log('AND NO WORD THAT ONLY AN INSIDER KNOWS')
ok('every technical word is explained on the screen it appears on', jargon.length === 0,
   jargon.slice(0, 8).map((j) => `${j.r} "${j.word}"`).join(', ') || 'none')

console.log(EXEMPT.length ? '\nexempt, and only these:' : '\nnothing is exempt')
for (const [sel, why] of EXEMPT) console.log(`  ${sel}  -  ${why}`)
await b.close()
