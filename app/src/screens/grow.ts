import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, meter, callout, figureWithEye } from '../components/bits'
import { composerScreen, scenarios } from '../components/composer'
import { table } from '../components/table'
import { amount } from '../components/bits'
import {
  state, holdingsValue, owed, availableToBorrow, sellPoint,
  monthlyCost, monthlyInterest, movementCeiling, ceilingLabel, money, MASK,
} from '../state'
import { usd, pct, signed, when } from '../format'
import { go, openSheet } from '../router'
import { objectArt, stir, level, COINS, WALLET, LEND_RAMP, OWE_RAMP, type ObjectField } from '../components/art'
import { hint, type Hint } from '../components/hint'

/* ---------------- the hub ---------------- */

/* ---------------------------------------------------------------------------
   The two products, as a mirrored pair.

   They were the same card twice: a caps eyebrow, then the rate at 32px, then
   the pitch, then rows. Which made the loudest thing on each of them the one
   thing they have in common — a percentage — and left EARN and BORROW as 11px
   labels doing the work of saying which is which. Somebody glancing at this
   screen read "4.8% a year" and "9.4% a year" and had to look twice to find
   out what either was for.

   So the name leads. The headline says what you can do in ink and finishes the
   sentence in grey, which is the shape the rest of this product's covers use,
   and the rate is inside that sentence where it belongs — a fact about the
   offer rather than the offer itself.

   And they are mirrored rather than identical. Same anatomy top to bottom, and
   the field under the button on both — but the lending card's is flipped and
   lit in green, the borrowing card's runs the other way in amber. No chance of
   mistaking one for the other from across a room. Each field is keyed to its
   own figure, the way the doors on Home are — how much of your spendable money
   is out on loan, and how much of your limit you have drawn.
   --------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
   Two cards, one word each.

   They used to carry five pieces of text apiece: an eyebrow reading LENDING,
   a headline reading "Lend your dollars.", a grey clause finishing the
   sentence, three figures, and a caption underneath explaining the terms. Six
   lines to say a thing that takes one word, and the one word was the eyebrow —
   set in the smallest, quietest type on the card.

   So the eyebrow becomes the title. "Lend". "Borrow". Under it, one sentence
   saying what you get, in the words somebody would use to tell a friend. Then
   the figures. Then the button. Nothing else.

   The caption did carry one fact worth keeping on each card — what we would
   sell, and that nothing is locked up — and those have not been deleted. They
   have moved behind the question mark on the row they are about, which is
   where somebody looks when they want them and out of the way when they do
   not.
   --------------------------------------------------------------------------- */

function productCard(opts: {
  key: 'lend' | 'borrow'
  /** One word. It is the name of the thing, not a description of it. */
  title: string
  /** One sentence, saying what you get. Not what it is called again. */
  say: string
  art: ObjectField; ramp: Record<string, string>; at: number
  rows: [string, string | Node, Hint?][]
  /** The one figure this card is about, sitting directly above its button.
   *  Label, value, and a tone when the value is money you owe. */
  standing: [string, string, string?]
  /** What the button says, and where it goes. They have to be the same fact.
   *  These two read "Borrow money" and "Lend dollars" and opened the position
   *  pages — a report headed "Borrowing" whose own main button says "Repay".
   *  A door that promises an action and delivers a report is the same fault as
   *  the old "Convert Cash" that opened a page called Transfer, and `names.mjs`
   *  did not see it because it had never read a product card. */
  cta: string; ctaTo: string
}): HTMLElement {
  // Anchored to the bottom on both, which is the dense end of the composition
  // and the end the account wakes first — so the lit mass sits against the
  // card's own bottom edge and the empty end of the field faces the button.
  // Four across: the band is about 494 wide and the field is 24 columns, so
  // one copy of it put 20 pixels between dot centres and a 17px ball in each.
  const art = objectArt(opts.art, opts.at, opts.ramp)
  const band = h('div', { class: 'prod-art' }, art)
  // No second link in the corner. "Repay" and "Take it back" were two more
  // decisions on a card whose job is one, and both are the first thing on the
  // page the button already leads to.
  const words = h('div', { class: 'stack-8' },
    h('h2', { class: 'prod-title', text: opts.title }),
    h('p', { class: 'prod-say muted', text: opts.say }))
  // The question mark goes on the label, not the figure: a question mark after
  // a number reads as doubt about the number.
  const figures = h('div', { class: 'stack-12' },
    ...opts.rows.map(([k, v, tip]) => h('div', { class: 'kv' },
      h('span', { class: 'kv-key' },
        h('span', { text: k }),
        tip ? hint(tip) : null),
      typeof v === 'string' ? h('span', { class: 't-body-strong', text: v }) : v)))
  const action = h('button', { class: 'btn btn-secondary', text: opts.cta,
    on: { click: () => go(opts.ctaTo) } })

  // The figure this card is really about, immediately above the button that
  // acts on it. It is smaller than a hero figure on purpose: the card is not a
  // dashboard, it is a door with your position written on the handle.
  const standing = h('div', { class: 'prod-standing' },
    h('span', { class: 't-caps subtle', text: opts.standing[0] }),
    h('span', { class: 'prod-figure' + (opts.standing[2] ? ' ' + opts.standing[2] : ''),
      text: opts.standing[1] }))

  const c = card()
  c.classList.add('prod', 'prod-' + opts.key)
  // Nothing comes between the words and the button they belong to. The field
  // used to sit between the figures and the action on the borrowing card,
  // which put a picture in the middle of a sentence and an action: the button
  // read as belonging to the art rather than to the offer above it.
  //
  // So the field goes under the button on both, against the card's own bottom
  // edge, and the order is the same on both: the name, the sentence, the
  // figures, your position, the button. It was the field at the top of one
  // card and the bottom of the other, which is a nicer idea and costs 128
  // pixels: it started the lending card's title level with the borrowing
  // card's figures and left the two buttons at different heights. The mirror
  // is the field itself — flipped, and in the other colour — not which end of
  // the card it sits at.
  c.append(words, figures, h('div', { class: 'spacer' }), standing, action, band)
  // The same answer the three doors on Home give (11g.51): the field parts
  // around the pointer wherever it is on the card. Reach and push are in the
  // field's own units, so the picture behaves the same way here as it does
  // there even though this one is drawn a fifth larger.
  stir(c, art)
  return c
}

const QUESTIONS: [string, string][] = [
  ['Can I lose money lending?', 'Your dollars sit in short term US government debt. The rate can go up or down. It is not a guarantee.'],
  ['What if my shares fall?', 'We only sell if they fall to 140% of what you borrowed. Repay some, or add shares, and nothing is sold.'],
  ['Is anything locked up?', 'No. Take back what you lent any time. Repay a loan any time. No fee either way.'],
  ['When does interest start?', 'The next morning. After that it lands in your wallet every day.'],
  ['Can I use both at once?', 'Yes. What you lent keeps paying while a loan is open.'],
  ['What does borrowing cost?', 'Just the interest, charged daily on what you owe. No other fees.'],
]
export function growScreen(): HTMLElement {
  // A class rather than an inline style, because three columns is a desktop
  // answer and an inline style cannot be asked about the width. At 390 it was
  // three 100px columns of two-word lines.
  const qgrid = h('div', { class: 'qgrid' })
  for (const [q, a] of QUESTIONS) {
    qgrid.appendChild(h('div', { class: 'stack-8' },
      h('span', { class: 't-body-strong', text: q }),
      h('span', { class: 'muted t-caption', text: a })))
  }

  // Two cards and the questions, and nothing else. The hero above them showed
  // "Lent out" and "You owe" in display type, and then both cards showed the
  // same two figures again forty pixels lower. The page said everything twice
  // and led with the half that is not a decision.
  return shell(
    'grow',
    pageHeader('Borrow & Lend'),
    h('div', { class: 'row prods' },
      productCard({
        key: 'lend', title: 'Lend',
        say: `Earn ${pct(state.rates.lend)} a year on cash you are not using.`,
        // How much of the money you could spend is out working. Not the whole
        // portfolio: shares are not money you chose to lend or not to.
        art: COINS(), ramp: LEND_RAMP,
        at: level(state.lent, state.lent + state.cash),
        rows: [
          ['Interest so far', h('span', { class: 'pos t-body-strong',
            text: state.prefs.hideBalances ? MASK : signed(state.interestPaid) })],
          ['Rate', pct(state.rates.lend) + ' a year', {
            title: 'The rate',
            body: `It moves with the market, so it can go up or down. ${usd(1000, false)} lent pays about ${usd(monthlyInterest(1000))} a month at today's rate.`,
          }],
        ],
        standing: ['Lent out', money(state.lent)],
        cta: 'See your lending', ctaTo: '/grow/lending',
      }),
      productCard({
        key: 'borrow', title: 'Borrow',
        say: 'Get cash without selling your shares.',
        // How much of the limit is drawn, which is the one number a borrower
        // is actually watching.
        art: WALLET(), ramp: OWE_RAMP,
        at: level(owed(), Math.max(state.borrowLimit, 1)),
        rows: [
          ['You can borrow', money(availableToBorrow())],
          ['Against', money(holdingsValue()) + ' in shares', {
            title: 'Against your shares',
            body: owed() > 0
              ? `Your shares back the loan. You keep them and they keep earning. We would only sell some if they fell below ${money(sellPoint())}.`
              : 'Your shares back the loan. You keep them and they keep earning. We would only sell some if they fell a long way.',
            more: { label: 'What can go wrong', onClick: () => go('/disclosures') },
          }],
        ],
        standing: owed() > 0
          ? ['You owe', money(owed()), 'warn']
          : ['Borrowed so far', money(0)],
        cta: 'See your borrowing', ctaTo: '/grow/borrowing',
      })),
    card(cardHead('Questions people ask'), qgrid)
  )
}

/* ---------------- shared history bands ---------------- */

function loanHistory(): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'grow' && a.who === 'Borrowing')
  return card(
    cardHead('Your loans', h('button', { class: 'link', text: 'All borrowing and lending', on: { click: () => go('/activity?filter=grow') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
        { key: 'rate', label: 'Rate', optional: true }, { key: 'ref', label: 'Reference', optional: true },
        { key: 'amt', label: 'Amount', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: a.type })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: pct(state.rates.borrow) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref }),
      undefined,
      { lead: 'w', detail: ['when', 'ref'], figure: ['amt'] },
    )
  )
}

function earnHistory(): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'grow' && a.who === 'Lending')
  return card(
    cardHead('Your earnings', h('button', { class: 'link', text: 'All borrowing and lending', on: { click: () => go('/activity?filter=grow') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
        { key: 'rate', label: 'Rate', optional: true }, { key: 'ref', label: 'Reference', optional: true },
        { key: 'amt', label: 'Paid', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: a.type })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: pct(state.rates.lend) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref }),
      undefined,
      { lead: 'w', detail: ['when', 'ref'], figure: ['amt'] },
    )
  )
}

/* ---------------- borrow ---------------- */

export function borrowScreen(): HTMLElement {
  const shares = holdingsValue()
  const avail = availableToBorrow()
  return composerScreen({
    place: 'grow',
    base: growScreen,
    title: 'Borrow',
    eyebrow: ['Available', usd(avail)],
    cardLabel: 'How much',
    cardRight: 'Available ' + usd(avail),
    initial: Math.min(1150, avail),
    // Drawing on a credit line puts money in the wallet that was not there
    // before, so it crosses the account boundary the same way a deposit or a
    // share purchase does, and it answers to the same ceiling. Without this an
    // unverified account could take a $1,150 loan while being stopped from
    // buying $300 of a share — the riskier of the two being the one left open.
    max: Math.min(avail, movementCeiling()),
    maxLabel: ceilingLabel(avail, 'What your shares will lend against'),
    note: 'Repay any time. No fee for repaying early.',
    quick: [
      { label: usd(500, false), value: 500 },
      { label: usd(1000, false), value: 1000 },
      { label: usd(Math.round(avail), false), value: avail },
      { label: 'Max', value: avail },
    ],
    summary: (v) => {
      const after = state.borrowed + v
      return [
        ['Rate', pct(state.rates.borrow) + ' a year'],
        ['Costs you', 'About ' + usd(monthlyCost(v)) + ' a month'],
        ['Shares needed', state.rates.collateral + '% of what you borrow'],
        ['Sold if shares fall below', usd(after * (state.rates.collateral / 100))],
      ]
    },
    callout: 'Your shares stay yours and keep earning. We only sell if they fall to the level above.',
    risky: true,
    action: (v) => 'Borrow ' + usd(v),
    onAction: (v) => openSheet('borrow-review', { v: String(v) }),
    right: (v) => {
      const after = state.borrowed + v
      const trigger = after * (state.rates.collateral / 100)
      // How far the shares could fall before any of them is sold — the same
      // figure the scenarios table below reaches for, so the two cannot drift.
      const room = shares > 0 ? Math.max(0, ((shares - trigger) / shares) * 100) : 0
      const c = card(
        cardHead('What secures it',
          h('button', { class: 'link', text: 'Your positions', on: { click: () => go('/') } })),
        h('span', { class: 't-title', text: 'Your shares' }),
        h('span', { class: 't-display-xl', text: usd(shares) }),
        h('span', { class: 'muted', text: 'They stay yours. You keep any gains and any dividends while the loan is open.' }),
        h('div', { class: 'stack-12' },
          // "Collateral cover" was the last piece of insider vocabulary on a
          // customer screen, and the plain-English version of it was still
          // arithmetic: shares as a percentage of the debt, which reads in the
          // thousands and pins its own bar full. The row asks the question
          // somebody actually has — how far can it fall — and the rule behind
          // the number is behind the question mark rather than in a caption
          // nobody reads twice.
          h('div', { class: 'kv' },
            h('span', { class: 'kv-key' },
              h('span', { class: 't-caps subtle', text: 'Your shares can fall' }),
              hint({
                title: 'Your shares can fall',
                body: `Your shares have to be worth at least ${state.rates.collateral}% of the money you borrowed. If they fall below that, we sell just enough to bring it back.`,
              })),
            h('span', { class: 'pos t-body-strong', text: Math.round(room) + '%' })),
          meter(shares, trigger),
          h('span', { class: 'muted t-caption', text: room >= 25
            ? 'The line is where we would sell. You are a long way above it.'
            : 'The line is where we would sell. Borrow less, or add shares, to move away from it.' })),
        h('div', { class: 'stack-12' },
          kv('Already borrowed', usd(state.borrowed)),
          kv('After this borrow', usd(after)),
          kv('Interest so far', usd(state.interestOwed))),
        scenarios('If your shares fall',
          ['Falls by', 'Your shares', 'What happens'],
          [
            ['20%', usd(shares * 0.8), 'Nothing changes'],
            ['50%', usd(shares * 0.5), 'Nothing changes'],
            [Math.round(room) + '%', usd(trigger), 'We sell enough to cover'],
          ])
      )
      return c
    },
    bottom: loanHistory(),
  })
}

/* ---------------- repay ---------------- */

export function repayScreen(): HTMLElement {
  const total = owed()
  return composerScreen({
    place: 'grow',
    base: growScreen,
    title: 'Repay',
    eyebrow: ['You owe', usd(total)],
    cardLabel: 'How much',
    cardRight: 'Wallet ' + usd(state.cash),
    initial: Math.min(200, total),
    max: Math.min(total, state.cash),
    note: 'Repay any part of it. There is no fee for repaying early.',
    quick: [
      { label: usd(50, false), value: 50 },
      { label: usd(100, false), value: 100 },
      { label: usd(200, false), value: 200 },
      { label: 'All', value: Math.min(total, state.cash) },
    ],
    summary: (v) => {
      const left = Math.max(0, total - v)
      return [
        ['Comes from', 'Your wallet'],
        ['Left owing', usd(left)],
        ['Rate on what is left', pct(state.rates.borrow) + ' a year'],
        ['Costs you after', left === 0 ? 'Nothing' : 'About ' + usd(monthlyCost(left)) + ' a month'],
      ]
    },
    callout: 'Repaying frees the same amount up to borrow again whenever you want.',
    action: (v) => 'Repay ' + usd(v),
    onAction: (v) => openSheet('repay-review', { v: String(v) }),
    right: () =>
      card(
        cardHead('What you owe'),
        h('span', { class: 't-title', text: 'Borrowed' }),
        h('span', { class: 't-display-xl', text: usd(state.borrowed) }),
        h('span', { class: 'muted', text: 'Interest is charged every day on what is still owed, so repaying sooner costs less.' }),
        h('div', { class: 'stack-12' },
          kv('Interest so far', usd(state.interestOwed)),
          kv('Rate', pct(state.rates.borrow) + ' a year'),
          kv('Costs you now', 'About ' + usd(monthlyCost(state.borrowed)) + ' a month')),
        scenarios('If you repay',
          ['Repay', 'Left owing', 'Costs a month'],
          [
            [usd(100), usd(Math.max(0, total - 100)), usd(monthlyCost(Math.max(0, total - 100)))],
            [usd(250), usd(Math.max(0, total - 250)), usd(monthlyCost(Math.max(0, total - 250)))],
            ['Everything', usd(0), 'Nothing'],
          ]),
        h('div', { class: 'stack-12' },
          h('span', { class: 't-caps subtle', text: 'What repaying does' }),
          h('span', { class: 'muted t-caption', text: 'Whatever you repay, you can borrow again later. Your shares are never sold.' }))
      ),
    bottom: loanHistory(),
  })
}

/* ---------------- earn ---------------- */

export function earnScreen(): HTMLElement {
  return composerScreen({
    place: 'grow',
    base: growScreen,
    title: 'Lend',
    eyebrow: ['In your wallet', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'In wallet ' + usd(state.cash),
    initial: Math.min(500, state.cash),
    max: state.cash,
    note: 'Take it out any time. Nothing is locked up.',
    quick: [
      { label: usd(100, false), value: 100 },
      { label: usd(250, false), value: 250 },
      { label: usd(500, false), value: 500 },
      { label: 'All', value: state.cash },
    ],
    summary: (v) => [
      ['Rate', pct(state.rates.lend) + ' a year'],
      ['Pays you', 'About ' + usd(monthlyInterest(v)) + ' a month'],
      ['Paid', 'Every day'],
      ['Take out', 'Any time, no fee'],
    ],
    callout: 'Interest lands in your wallet every day. You do not have to do anything.',
    action: (v) => 'Move ' + usd(v) + ' in',
    onAction: (v) => openSheet('earn-review', { v: String(v) }),
    right: (v) => {
      const after = state.lent + v
      const yearly = (after * state.rates.lend) / 100
      return card(
        cardHead('What you earn'),
        h('span', { class: 't-title', text: 'Lent out' }),
        h('span', { class: 't-display-xl', text: usd(state.lent) }),
        h('span', { class: 'muted', text: 'It keeps earning every day. Take any part of it out whenever you want.' }),
        h('div', { class: 'stack-12' },
          kv('After this move', usd(after)),
          kv('Rate', pct(state.rates.lend) + ' a year'),
          kv('Interest so far', h('span', { class: 'pos t-body-strong', text: signed(state.interestPaid) }))),
        scenarios('What it pays you',
          ['Over', 'You earn', 'Total then'],
          [
            ['1 month', usd(yearly / 12), usd(after + yearly / 12)],
            ['6 months', usd(yearly / 2), usd(after + yearly / 2)],
            ['1 year', usd(yearly), usd(after + yearly)],
          ]),
        h('div', { class: 'stack-12' },
          h('span', { class: 't-caps subtle', text: 'Where the interest comes from' }),
          h('span', { class: 'muted t-caption', text: 'Your dollars sit in short term US government debt. The rate can go up or down. It is not a guarantee.' }))
      )
    },
    bottom: earnHistory(),
  })
}

/* ---------------- take out ---------------- */

export function takeOutScreen(): HTMLElement {
  return composerScreen({
    place: 'grow',
    base: growScreen,
    title: 'Take out',
    eyebrow: ['Lent out', usd(state.lent)],
    cardLabel: 'How much',
    cardRight: 'Lent ' + usd(state.lent),
    initial: Math.min(300, state.lent),
    max: state.lent,
    note: 'It lands in your wallet straight away. No notice and no fee.',
    quick: [
      { label: usd(100, false), value: 100 },
      { label: usd(300, false), value: 300 },
      { label: usd(500, false), value: 500 },
      { label: 'All', value: state.lent },
    ],
    summary: (v) => [
      ['Goes to', 'Your wallet'],
      ['Arrives', 'Straight away'],
      ['Fee', 'None, ever'],
      ['You give up', 'About ' + usd(monthlyInterest(v)) + ' a month'],
    ],
    callout: 'Interest already paid stays in your wallet. Only what you leave in keeps earning.',
    action: (v) => 'Take out ' + usd(v),
    onAction: (v) => openSheet('takeout-review', { v: String(v) }),
    right: (v) => {
      const rest = Math.max(0, state.lent - v)
      const yearly = (rest * state.rates.lend) / 100
      return card(
        cardHead('What keeps earning'),
        h('span', { class: 't-title', text: 'After this' }),
        h('span', { class: 't-display-xl', text: usd(rest) }),
        h('span', { class: 'muted', text: 'That carries on earning every day, and you can take more out whenever you want.' }),
        h('div', { class: 'stack-12' },
          kv('Rate', pct(state.rates.lend) + ' a year'),
          kv('Paid', 'Every day'),
          kv('Interest so far', h('span', { class: 'pos t-body-strong', text: signed(state.interestPaid) }))),
        scenarios('What the rest pays',
          ['Over', 'You earn', 'Total then'],
          [
            ['1 month', usd(yearly / 12), usd(rest + yearly / 12)],
            ['6 months', usd(yearly / 2), usd(rest + yearly / 2)],
            ['1 year', usd(yearly), usd(rest + yearly)],
          ]),
        h('div', { class: 'stack-12' },
          h('span', { class: 't-caps subtle', text: 'Where the interest comes from' }),
          h('span', { class: 'muted t-caption', text: 'Your dollars sit in short term US government debt. The rate can go up or down.' }))
      )
    },
    bottom: earnHistory(),
  })
}

export { sellPoint }

/* ---------------------------------------------------------------------------
   Where a position lives.

   The two cards used to carry a second link in the corner — Repay, Take it
   back — and that was the whole of what you could do with a position you
   already held. Two words in eleven-pixel type, beside a button, for the
   thing somebody with an open loan actually came to the screen to do.

   So the button leads here instead. One page per side, holding what the
   position is, what it costs, what backs it, everything that built it, and
   the two or three things you can do next. The composers still exist at the
   addresses they always had; this is the place that sends you to them.

   One honest limitation, stated on the page rather than designed around: a
   loan is one balance, not a stack of separate loans. Money is fungible, so
   there is no "repay this draw" — repaying reduces the balance, oldest
   interest first. The history below is what happened, not a list of things
   that can each be settled on their own, and pretending otherwise would be a
   fiction that costs somebody money the first time they trusted it.
   --------------------------------------------------------------------------- */

/** The figure a position page opens with, and the actions on it. */
function positionHead(opts: {
  label: string
  value: string
  tone?: string
  say: string
  primary: { label: string; to: string }
  secondary?: { label: string; to: string }
  rows: [string, string | Node, Hint?][]
}): HTMLElement {
  return h('section', { class: 'card' },
    h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: opts.label }),
      // The switch that covers this number, on its line. It used to sit on the
      // hero at /grow; the hero is gone and this is where that figure went.
      figureWithEye(
        h('span', { class: 'hero-figure' + (opts.tone ? ' ' + opts.tone : ''), text: opts.value })),
      h('span', { class: 'muted', text: opts.say })),
    h('div', { class: 'stack-12' },
      ...opts.rows.map(([k, v, tip]) => h('div', { class: 'kv' },
        h('span', { class: 'kv-key' }, h('span', { text: k }), tip ? hint(tip) : null),
        typeof v === 'string' ? h('span', { class: 't-body-strong', text: v }) : v))),
    // The actions, on the figure they act on. This is the whole reason the
    // page exists.
    h('div', { class: 'receipt-on' },
      h('button', { class: 'btn btn-primary', text: opts.primary.label,
        on: { click: () => go(opts.primary.to) } }),
      opts.secondary
        ? h('button', { class: 'btn btn-secondary', text: opts.secondary.label,
            on: { click: () => go(opts.secondary!.to) } })
        : null))
}

export function lendingScreen(): HTMLElement {
  const out = state.lent
  return shell(
    'grow',
    pageHeader('Lending', null, { back: { label: 'Borrow & Lend', to: '/grow' } }),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        positionHead({
          label: 'Lent out',
          value: money(out),
          say: out > 0
            ? `Paying you ${pct(state.rates.lend)} a year, every morning.`
            : 'You have not lent anything yet.',
          rows: [
            ['Earning', pct(state.rates.lend) + ' a year'],
            ['Paid you so far', h('span', { class: 'pos t-body-strong',
              text: state.prefs.hideBalances ? MASK : signed(state.interestPaid) })],
            ['A month pays', money(monthlyInterest(out)), {
              title: 'A month pays',
              body: 'What today’s rate would pay on this amount over a month. The rate moves, so this is an estimate.',
            }],
            ['Locked up', 'Nothing'],
          ],
          primary: { label: 'Lend more', to: '/grow/earn' },
          secondary: out > 0 ? { label: 'Take it back', to: '/grow/takeout' } : undefined,
        }),
        earnHistory()),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('Where the money goes'),
          h('span', { class: 'muted',
            text: 'Your dollars sit in short term US government debt. The rate can go up or down.' }),
          kv('Held as', 'Short term US government debt'),
          kv('Paid', 'Every morning, into your wallet'),
          kv('Notice needed', 'None'),
          kv('Fee', 'No fee'),
          callout('The rate is not a guarantee. It can go down as well as up.')),
        card(
          cardHead('What you can do'),
          h('span', { class: 'muted', text: 'Both of these are free and take about a minute.' }),
          kv('Lend more', 'Moves cash from your wallet'),
          kv('Take it back', 'Moves it back, any amount'))))
  )
}

export function borrowingScreen(): HTMLElement {
  const debt = owed()
  const shares = holdingsValue()
  // How far the shares could fall before any of them is sold. It was the cover
  // ratio — shares as a percentage of the debt — which reads 3,217% when
  // somebody holds $12,500 of shares against a $389 loan, and nobody thinks in
  // cover ratios. This is the same fact in the words somebody would use to ask
  // for it: how far can it fall before you touch it.
  const room = shares > 0 ? Math.max(0, ((shares - sellPoint()) / shares) * 100) : 0
  return shell(
    'grow',
    pageHeader('Borrowing', null, { back: { label: 'Borrow & Lend', to: '/grow' } }),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        positionHead({
          label: debt > 0 ? 'You owe' : 'You can borrow',
          value: money(debt > 0 ? debt : availableToBorrow()),
          tone: debt > 0 ? 'warn' : undefined,
          say: debt > 0
            ? `Costing you ${pct(state.rates.borrow)} a year, charged daily.`
            : 'Nothing borrowed. Your shares would back a loan up to this.',
          rows: debt > 0
            ? [
                ['Borrowed', money(state.borrowed)],
                ['Interest so far', h('span', { class: 'warn t-body-strong', text: money(state.interestOwed) }), {
                  title: 'Interest so far',
                  body: `Charged every day on what you owe, at ${pct(state.rates.borrow)} a year. It stops the moment you repay.`,
                }],
                ['A month costs', money(monthlyCost(state.borrowed))],
                ['You can still borrow', money(availableToBorrow())],
              ]
            : [
                ['Rate', pct(state.rates.borrow) + ' a year'],
                ['A ' + usd(1000, false) + ' loan', 'About ' + usd(monthlyCost(1000)) + ' a month'],
                ['Backed by', money(shares) + ' in shares'],
              ],
          primary: { label: debt > 0 ? 'Repay' : 'Borrow money', to: debt > 0 ? '/grow/repay' : '/grow/borrow' },
          secondary: debt > 0 && availableToBorrow() > 0
            ? { label: 'Borrow more', to: '/grow/borrow' } : undefined,
        }),
        // What is actually holding the loan up, and the one number that
        // decides whether anything gets sold.
        debt > 0
          ? card(
              cardHead('What backs it'),
              h('div', { class: 'kv' },
                h('span', { class: 'kv-key' },
                  h('span', { class: 't-caps subtle', text: 'Your shares can fall' }),
                  hint({
                    title: 'Your shares can fall',
                    body: `Your shares have to be worth at least ${state.rates.collateral}% of the money you borrowed. If they fall below that, we sell just enough to bring it back.`,
                  })),
                h('span', { class: 'pos t-body-strong', text: Math.round(room) + '%' })),
              // The bar is what the shares are worth. The line on it is the
              // price we would sell at, so the gap between them is the answer
              // to the question above, drawn.
              meter(shares, sellPoint()),
              kv('Your shares', money(shares)),
              kv('We would sell below', money(sellPoint())),
              h('span', { class: 'muted t-caption', text: room >= 25
                ? 'The line is where we would sell. You are a long way above it.'
                : 'The line is where we would sell. Repay some, or add shares, to move away from it.' }),
              h('button', { class: 'btn btn-secondary btn-sm', text: 'See your shares',
                on: { click: () => go('/') } }))
          : null,
        loanHistory()),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('What it costs'),
          kv('Rate', pct(state.rates.borrow) + ' a year'),
          kv('Charged', 'Daily, on what you owe'),
          kv('To take a loan', 'No fee'),
          kv('To repay early', 'No fee'),
          callout('Interest is the only cost. Repaying sooner is always cheaper.')),
        card(
          cardHead('What you can do'),
          h('span', { class: 'muted', text: 'Repay any amount at any time. Your shares are never sold to do it.' }),
          kv('Repay', 'Any amount, any time'),
          kv('Borrow more', 'Up to ' + money(availableToBorrow())),
          kv('Add shares', 'Buying more raises what you can borrow'))))
  )
}
