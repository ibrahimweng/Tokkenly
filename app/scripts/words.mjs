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
import { seen, verify, locked } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)

/* Every screen a customer meets, and every dialog that opens over one.
   The console is staff-facing and holds itself to the same rule, so it is in
   here too.

   The first version of this file walked thirty-two routes and looked only
   inside `.content`. That is the shape of the mistake it exists to catch: it
   passed the whole product while never once opening a review, a receipt, an
   outcome, a refusal or an empty state — which between them are most of the
   sentences somebody reads on the day something goes wrong. */
const ROUTES = [
  '/', '/?view=simple',
  '/invest', '/invest?cat=ETFs', '/invest?q=zzzz',
  '/invest/aapl', '/invest/voo', '/invest/ko', '/invest/meta',
  '/invest/aapl/invest', '/invest/aapl/sell', '/invest/aapl/send',
  '/invest/aapl/send?to=Ngozi%20Eze', '/invest/meta/invest',
  '/transfer', '/addmoney', '/addmoney?via=card',
  '/send', '/send?to=Tunde%20Bakare', '/send?rail=bank&to=gt', '/send?q=zzzz',
  '/receive', '/withdraw',
  '/grow', '/grow/borrow', '/grow/earn', '/grow/repay', '/grow/takeout',
  '/activity', '/activity?filter=alerts', '/activity?filter=trades', '/activity?q=zzzz',
  '/statement', '/bucket', '/disclosures', '/all',
  '/account', '/account/details', '/account/preferences', '/account/notifications',
  '/account/wallet', '/account/verification', '/account/payments',
  '/account/security', '/account/support', '/account/legal',
  '/admin', '/admin/status', '/admin/switches', '/admin/people',
  '/admin/money', '/admin/breaks', '/admin/audit', '/admin/launch',
  '/signin', '/signup', '/verify',
  '/welcome/0', '/welcome/1', '/welcome/2', '/welcome/3',
]

/* And every dialog, at the address that opens it. A review is where somebody
   agrees to move money and a receipt is what they keep, so those two carry
   more weight than any page in the list above. */
const SHEETS = [
  '/?sheet=jump', '/?sheet=more', '/?sheet=card', '/?sheet=put-away&task=verify',
  '/?sheet=pick-who',
  '/activity?sheet=receipt&ref=TKN-8E4J77', '/activity?sheet=receipt&ref=TKN-8F2K90',
  '/activity?sheet=export',
  '/account/support?sheet=contact', '/account/details?sheet=edit&field=email',
  '/account/security?sheet=pin', '/account/security?sheet=password',
  '/account/security?sheet=phrase', '/account/legal?sheet=close',
  '/account/wallet?sheet=export-wallet',
  '/transfer?sheet=banks', '/transfer?sheet=cards',
  '/send?to=Tunde%20Bakare&sheet=send-review&v=120',
  '/send?rail=bank&to=gt&sheet=send-review&v=200',
  '/addmoney?sheet=transfer-review&v=200',
  '/addmoney?via=card&sheet=card-review&v=200',
  '/addmoney?sheet=add-waiting&ref=TKN-6C9H77',
  '/invest/aapl/invest?sheet=invest-review&v=200&t=AAPL',
  '/invest/aapl/sell?sheet=sell-review&v=200&t=AAPL',
  '/invest/aapl/send?to=Tunde%20Bakare&sheet=shares-review&v=224.1&t=AAPL',
  '/grow/borrow?sheet=borrow-review&v=300', '/grow/repay?sheet=repay-review&v=100',
  '/grow/earn?sheet=earn-review&v=300', '/grow/takeout?sheet=takeout-review&v=300',
  '/bucket?sheet=bucket-review',
  '/admin/people?sheet=admin-person&id=u2',
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
  // The pattern beside a word has to be a *different* phrase. The first
  // version of this list allowed "custodian" wherever "custodian" appeared,
  // which is a check that can never fire — and it did not, on two screens
  // that used the word with nothing beside it.
  ['custodial', /hold(s)? (your|their) own key/i],
  ['custodian', /holds the real share|holds the shares/i],
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
/* A suite that walks ninety addresses and reads nothing passes silently, which
   is the failure mode of every check written against a selector. So each route
   has to come back with words on it, and the count is printed.
   Eight, not twenty-five: an empty bucket and a search that found nobody are
   genuinely three short lines, and a floor that flags those is a floor that
   gets raised until it flags nothing. */
const empty = []
let sentences = 0

/** What is readable on whatever is on screen, as leaf elements.
 *
 *  Leaves, not blocks: reading a container's innerText joins every label,
 *  figure and keypad digit inside it into one string, and then the lock
 *  screen's four buttons and ten digits come back as a twenty-five word
 *  sentence nobody wrote. */
const read = (page) => page.evaluate(({ exempt, max }) => {
    const out = { long: [], dashed: [], text: '' }
    const skip = new Set()
    for (const [sel] of exempt) for (const e of document.querySelectorAll(sel)) skip.add(e)
    const isSkipped = (e) => { for (const s of skip) if (s === e || s.contains(e)) return true; return false }
    // Leaf elements only, so a sentence is not counted once per wrapper. The
    // scrim and the toast rail are in here because a dialog and a toast are
    // where the words matter most and where nobody was looking.
    // Four of these are not `.content`: the auth screens, the lock screen and
    // the onboarding all render their own shell, and walking only `.content`
    // read exactly nothing on the six screens a newcomer meets first.
    const within = ['.content', '.scrim', '.pop', '.toast-rail', '.auth', '.lock', '.welcome']
    const sel = within.flatMap((w) =>
      ['p', 'span', 'small', 'h1', 'h2', 'li', 'button', 'strong', 'label'].map((t) => `${w} ${t}`)).join(',')
    for (const e of document.querySelectorAll(sel)) {
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

for (const r of [...ROUTES, ...SHEETS]) {
  await p.goto(B + r, { waitUntil: 'domcontentloaded' })
  // A held-rate review fetches a quote before it has any rows, so a dialog
  // needs longer than a page before there is anything to read.
  await p.waitForTimeout(r.includes('sheet=') ? 900 : 280)
  const found = await read(p)

  const words = found.text.trim().split(/\s+/).filter(Boolean).length
  if (words < 8) empty.push({ r, words })
  sentences += found.text.split(/(?<=[.!?])\s+/).length
  for (const l of found.long) long.push({ r, ...l })
  for (const d of found.dashed) dashed.push({ r, s: d })
  for (const [word, near] of JARGON) {
    const re = new RegExp('\\b' + word, 'i')
    if (re.test(found.text) && !(near && near.test(found.text))) jargon.push({ r, word })
  }
}

/* The lock screen is not at an address. It renders over whatever you were
   looking at, so the only way to read it is to open the app locked — and
   `locked()` is an init script, so it needs a page of its own rather than the
   one that has been walking every other screen. */
{
  const l = await b.newPage({ viewport: { width: 1440, height: 900 } })
  await locked(l)
  await l.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await l.goto(B + '/', { waitUntil: 'domcontentloaded' })
  await l.waitForTimeout(500)
  const found = await read(l)
  await l.close()
  const words = found.text.trim().split(/\s+/).filter(Boolean).length
  if (words < 8) empty.push({ r: '/ (locked)', words })
  sentences += found.text.split(/(?<=[.!?])\s+/).length
  for (const x of found.long) long.push({ r: '/ (locked)', ...x })
  for (const d of found.dashed) dashed.push({ r: '/ (locked)', s: d })
}

console.log('IT ACTUALLY READ THE SCREENS')
ok(`every one of the ${ROUTES.length + SHEETS.length + 1} screens had words on it`, empty.length === 0,
   empty.map((e) => `${e.r} (${e.words}w)`).join(', ') || `${sentences} sentences read`)

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
