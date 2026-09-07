import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, meter } from '../components/bits'
import { composerScreen, scenarios } from '../components/composer'
import { table } from '../components/table'
import { amount, figureWithEye } from '../components/bits'
import {
  state, holdingsValue, owed, availableToBorrow, cover, sellPoint,
  monthlyCost, monthlyInterest, movementCeiling, ceilingLabel, money, MASK, inNaira,
} from '../state'
import { usd, pct, signed, when } from '../format'
import { go, openSheet } from '../router'
import { dotArt, level, mirror, BORROW, LEND_RAMP, OWE_RAMP, type ArtSpec } from '../components/art'

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

   And they are mirrored rather than identical. One composition, reflected: the
   lending card carries its field at the top in green, the borrowing card
   carries the same field flipped at the bottom in amber. Same anatomy, and no
   chance of mistaking one for the other from across a room. Each field is
   keyed to its own figure, the way the doors on Home are — how much of your
   spendable money is out on loan, and how much of your limit you have drawn.
   --------------------------------------------------------------------------- */

function productCard(opts: {
  key: 'lend' | 'borrow'
  eyebrow: string
  /** The clause that says what this is, in ink. */
  lead: string
  /** The rest of the same sentence, in grey. */
  rest: string
  art: ArtSpec; ramp: Record<string, string>; at: number
  rows: [string, string | Node][]
  cta: string; ctaTo: string
  linkLabel: string; linkTo: string
}): HTMLElement {
  // Anchored to the bottom on both, which is the dense end of the composition
  // and the end the account wakes first. On the lending card that puts the lit
  // mass against the words; on the borrowing one it puts it against the card's
  // own edge. Same field, and the two crops are the mirror.
  const band = h('div', { class: 'prod-art' }, dotArt(opts.art, opts.at, opts.ramp))
  const words = h('div', { class: 'stack-8' },
    h('div', { class: 'card-head' },
      h('h2', { class: 't-caps subtle', text: opts.eyebrow }),
      h('button', { class: 'link', text: opts.linkLabel, on: { click: () => go(opts.linkTo) } })),
    h('p', { class: 'prod-say' },
      h('strong', { text: opts.lead + ' ' }),
      h('span', { class: 'muted', text: opts.rest })))
  const figures = h('div', { class: 'stack-12' }, ...opts.rows.map(([k, v]) => kv(k, v)))
  const action = h('button', { class: 'btn btn-secondary', text: opts.cta,
    on: { click: () => go(opts.ctaTo) } })

  const c = card()
  c.classList.add('prod', 'prod-' + opts.key)
  // The mirror, in one line: the field leads on one card and closes the other.
  if (opts.key === 'lend') {
    c.append(band, words, figures, h('div', { class: 'spacer' }), action)
  } else {
    c.append(words, figures, h('div', { class: 'spacer' }), action, band)
  }
  return c
}

const QUESTIONS: [string, string][] = [
  ['Can I lose money lending?', 'Your dollars sit in short term US government debt. The rate can move up or down, and it is not a guarantee.'],
  ['What if my shares fall?', 'We only sell if your cover drops under 140%. Repay part of the loan, or add shares, and nothing is sold.'],
  ['Is anything locked up?', 'No. Take back what you have lent whenever you want, and repay a loan whenever you want. There is no fee either way.'],
  ['When does interest start?', 'The morning after you move money in. From then on it lands in your wallet every day.'],
  ['Can I use both at once?', 'Yes. What you have lent keeps paying while a loan is open. The two do not affect each other.'],
  ['What does borrowing cost?', 'Only the interest, charged daily on what you owe. No arrangement fee and no early repayment fee.'],
]

/** Where this account stands: what is lent out, and what is owed.
 *  The card used to be labelled "In Grow" and show the lent balance alone,
 *  which read as the whole place while $380 of borrowing and $8.90 of
 *  interest were on the books and named nowhere on the screen. A lending
 *  product that shows the limit and hides the balance is selling, not
 *  informing. The owed side appears only when there is a loan: a zero here
 *  would be a figure nobody asked for. */
function growHero(): HTMLElement {
  const debt = owed()
  return h('section', { class: 'card' },
    h('div', { class: 'hero-top' },
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Lent out' }),
        figureWithEye(h('span', { class: 'hero-figure', text: money(state.lent) })),
        inNaira(state.lent) ? h('span', { class: 'muted t-caption', text: inNaira(state.lent)! }) : null,
        h('span', { class: 'muted',
          text: `Paying you ${pct(state.rates.lend)} a year, every day. Nothing is locked up.` })),
      debt > 0
        ? h('div', { class: 'stack-8 hero-aside' },
            h('span', { class: 't-caps subtle', text: 'You owe' }),
            h('span', { class: 't-display', text: money(debt) }),
            inNaira(debt) ? h('span', { class: 'muted t-caption', text: inNaira(debt)! }) : null,
            h('span', { class: 'muted',
              text: `${money(state.borrowed)} borrowed and ${money(state.interestOwed)} interest so far` }))
        : null))
}

export function growScreen(): HTMLElement {
  const qgrid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' } })
  for (const [q, a] of QUESTIONS) {
    qgrid.appendChild(h('div', { class: 'stack-8' },
      h('span', { class: 't-body-strong', text: q }),
      h('span', { class: 'muted t-caption', text: a })))
  }

  return shell(
    'grow',
    pageHeader('Borrow & Lend'),
    growHero(),
    h('div', { class: 'row prods' },
      productCard({
        key: 'lend', eyebrow: 'Lending',
        linkLabel: 'Take it back', linkTo: '/grow/takeout',
        lead: 'Lend your dollars.',
        rest: `${pct(state.rates.lend)} a year, paid into your wallet every morning. ` +
          `Nothing is locked up, and ${usd(1000, false)} lent pays about ${usd(monthlyInterest(1000))} a month.`,
        // How much of the money you could spend is out working. Not the whole
        // portfolio: shares are not money you chose to lend or not to.
        art: mirror(BORROW), ramp: LEND_RAMP,
        at: level(state.lent, state.lent + state.cash),
        rows: [
          ['Lent out', money(state.lent)],
          ['Interest so far', h('span', { class: 'pos t-body-strong',
            text: state.prefs.hideBalances ? MASK : signed(state.interestPaid) })],
        ],
        cta: 'Lend dollars', ctaTo: '/grow/earn',
      }),
      productCard({
        key: 'borrow', eyebrow: 'Borrowing',
        linkLabel: 'Repay', linkTo: '/grow/repay',
        lead: 'Borrow against your shares.',
        rest: owed() > 0
          ? `${pct(state.rates.borrow)} a year, and they stay yours the whole time. ` +
            `Repay any time, no fee. We would only sell if your shares fell below ${money(sellPoint())}.`
          : `${pct(state.rates.borrow)} a year, and they stay yours the whole time. ` +
            `A ${usd(1000, false)} loan costs about ${usd(monthlyCost(1000))} a month.`,
        // How much of the limit is drawn, which is the one number a borrower
        // is actually watching.
        art: BORROW, ramp: OWE_RAMP,
        at: level(owed(), Math.max(state.borrowLimit, 1)),
        rows: [
          // What is owed comes before what is available. The other order reads
          // as an offer; this one reads as a position.
          ...(owed() > 0
            ? [['You owe', h('span', { class: 'warn t-body-strong', text: money(owed()) })] as [string, Node]]
            : []),
          ['You can borrow', money(availableToBorrow())],
          ['Against', money(holdingsValue()) + ' in shares'],
        ],
        cta: 'Borrow money', ctaTo: '/grow/borrow',
      })),
    card(cardHead('Questions people ask'), qgrid)
  )
}

/* ---------------- shared history bands ---------------- */

function loanHistory(): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'grow' && a.who === 'Borrowing')
  return card(
    cardHead('Your loans', h('button', { class: 'link', text: 'See all', on: { click: () => go('/activity?filter=grow') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
        { key: 'rate', label: 'Rate', optional: true }, { key: 'ref', label: 'Reference', optional: true },
        { key: 'amt', label: 'Amount', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: a.type }),
          h('small', { class: 'phone-only', text: when(a.at) })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: pct(state.rates.borrow) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref })
    )
  )
}

function earnHistory(): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'grow' && a.who === 'Lending')
  return card(
    cardHead('Your earnings', h('button', { class: 'link', text: 'See all', on: { click: () => go('/activity?filter=grow') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
        { key: 'rate', label: 'Rate', optional: true }, { key: 'ref', label: 'Reference', optional: true },
        { key: 'amt', label: 'Paid', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: a.type }),
          h('small', { class: 'phone-only', text: when(a.at) })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: pct(state.rates.lend) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref })
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
        ['Collateral', state.rates.collateral + '% of what you borrow'],
        ['Sold if shares fall below', usd(after * (state.rates.collateral / 100))],
      ]
    },
    callout: 'Your shares stay yours and keep earning. We only sell if they fall to the level above.',
    risky: true,
    action: (v) => 'Borrow ' + usd(v),
    onAction: (v) => openSheet('borrow-review', { v: String(v) }),
    right: (v) => {
      const after = state.borrowed + v
      const coverPct = after === 0 ? 0 : (shares / after) * 100
      const trigger = after * (state.rates.collateral / 100)
      const c = card(
        cardHead('What secures it',
          h('button', { class: 'link', text: 'Your positions', on: { click: () => go('/') } })),
        h('span', { class: 't-title', text: 'Your shares' }),
        h('span', { class: 't-display-xl', text: usd(shares) }),
        h('span', { class: 'muted', text: 'They stay yours. You keep any gains and any dividends while the loan is open.' }),
        h('div', { class: 'stack-12' },
          h('div', { class: 'kv' },
            h('span', { class: 't-caps subtle', text: 'Collateral cover' }),
            h('span', { class: 'pos t-body-strong', text: Math.round(coverPct).toLocaleString('en-US') + '%' })),
          meter(coverPct, state.rates.collateral),
          h('span', { class: 'muted t-caption', text: 'The mark is the minimum we need. You are well above it.' })),
        h('div', { class: 'stack-12' },
          kv('Already borrowed', usd(state.borrowed)),
          kv('After this borrow', usd(after)),
          kv('Interest so far', usd(state.interestOwed))),
        scenarios('If your shares fall',
          ['Falls by', 'Your shares', 'What happens'],
          [
            ['20%', usd(shares * 0.8), 'Nothing changes'],
            ['50%', usd(shares * 0.5), 'Nothing changes'],
            [Math.round((1 - trigger / shares) * 100) + '%', usd(trigger), 'We sell enough to cover'],
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
          h('span', { class: 'muted t-caption', text: 'Your limit goes back up by whatever you repay, so you can borrow it again later. Your shares are untouched either way, because none of them were ever sold.' }))
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
          h('span', { class: 'muted t-caption', text: 'Your dollars are held in short term US government debt. The rate moves with the market, so it can go up as well as down. It is not fixed and it is not a guarantee.' }))
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
          h('span', { class: 'muted t-caption', text: 'Your dollars are held in short term US government debt. The rate moves with the market, so it can go up as well as down.' }))
      )
    },
    bottom: earnHistory(),
  })
}

export { sellPoint, cover }
