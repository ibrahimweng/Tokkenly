import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, meter } from '../components/bits'
import { composerScreen, scenarios } from '../components/composer'
import { table } from '../components/table'
import { amount } from '../components/bits'
import {
  state, holdingsValue, owed, availableToBorrow, cover, sellPoint,
  monthlyCost, monthlyEarn,
} from '../state'
import { usd, pct, signed, when } from '../format'
import { go, openSheet } from '../router'

/* ---------------- the hub ---------------- */

function productCard(opts: {
  label: string; linkLabel: string; linkTo: string
  rate: string; pitch: string; rows: [string, string | Node][]
  caption: string; cta: string; ctaTo: string
}): HTMLElement {
  const c = card()
  c.style.flex = '1'
  c.appendChild(h('div', { class: 'card-head' },
    h('span', { class: 't-caps subtle', text: opts.label }),
    h('button', { class: 'link', text: opts.linkLabel, on: { click: () => go(opts.linkTo) } })))
  c.appendChild(h('span', { class: 't-display', text: opts.rate }))
  c.appendChild(h('span', { class: 'muted', text: opts.pitch }))
  for (const [k, v] of opts.rows) c.appendChild(kv(k, v))
  c.appendChild(h('span', { class: 'muted t-caption', text: opts.caption }))
  c.appendChild(h('div', { class: 'spacer' }))
  c.appendChild(h('button', { class: 'btn btn-quiet', text: opts.cta, on: { click: () => go(opts.ctaTo) } }))
  return c
}

const QUESTIONS: [string, string][] = [
  ['Can I lose money in Earn?', 'Your dollars sit in short term US government debt. The rate can move up or down, and it is not a guarantee.'],
  ['What if my shares fall?', 'We only sell if your cover drops under 140%. Repay part of the loan, or add shares, and nothing is sold.'],
  ['Is anything locked up?', 'No. Take money out of Earn whenever you want, and repay a loan whenever you want. There is no fee either way.'],
  ['When does interest start?', 'The morning after you move money in. From then on it lands in your wallet every day.'],
  ['Can I use both at once?', 'Yes. Money in Earn keeps paying while a loan is open. The two do not affect each other.'],
  ['What does borrowing cost?', 'Only the interest, charged daily on what you owe. No arrangement fee and no early repayment fee.'],
]

export function growScreen(): HTMLElement {
  const qgrid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' } })
  for (const [q, a] of QUESTIONS) {
    qgrid.appendChild(h('div', { class: 'stack-8' },
      h('span', { class: 't-body-strong', text: q }),
      h('span', { class: 'muted t-caption', text: a })))
  }

  return shell(
    'grow',
    pageHeader('Grow'),
    card(
      cardHead('In Grow'),
      h('span', { class: 't-display', text: usd(state.inEarn) }),
      h('span', { class: 'muted', text: `Earning ${pct(state.rates.earn)} a year, paid every day. Nothing is locked up.` })
    ),
    h('div', { class: 'row' },
      productCard({
        label: 'Earn', linkLabel: 'Take out', linkTo: '/grow/takeout',
        rate: pct(state.rates.earn) + ' a year',
        pitch: 'Paid every day, straight into your wallet. Nothing is locked up.',
        rows: [
          ['Paid so far', h('span', { class: 'pos t-body-strong', text: signed(state.earnedSoFar) })],
          ['Take out', 'Any time, no fee'],
        ],
        caption: `Moving ${usd(1000, false)} in pays about ${usd(monthlyEarn(1000))} a month.`,
        cta: 'Move money in', ctaTo: '/grow/earn',
      }),
      productCard({
        label: 'Borrow', linkLabel: 'Repay', linkTo: '/grow/repay',
        rate: pct(state.rates.borrow) + ' a year',
        pitch: 'Borrow against the shares you already own. They stay yours the whole time.',
        rows: [
          ['You can borrow', usd(availableToBorrow())],
          ['Against', usd(holdingsValue()) + ' in shares'],
        ],
        caption: `A ${usd(1000, false)} loan costs about ${usd(monthlyCost(1000))} a month. Repay any time.`,
        cta: 'Borrow money', ctaTo: '/grow/borrow',
      })),
    card(cardHead('Questions people ask'), qgrid)
  )
}

/* ---------------- shared history bands ---------------- */

function loanHistory(): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'grow' && a.who === 'Borrow')
  return card(
    cardHead('Your loans', h('button', { class: 'link', text: 'See all', on: { click: () => go('/history?filter=grow') } })),
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
        amount(a.amount),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref })
    )
  )
}

function earnHistory(): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'grow' && a.who === 'Earn')
  return card(
    cardHead('Your earnings', h('button', { class: 'link', text: 'See all', on: { click: () => go('/history?filter=grow') } })),
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
        h('span', { class: 'muted', text: pct(state.rates.earn) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a.amount),
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
    max: avail,
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
    title: 'Earn',
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
      ['Rate', pct(state.rates.earn) + ' a year'],
      ['Pays you', 'About ' + usd(monthlyEarn(v)) + ' a month'],
      ['Paid', 'Every day'],
      ['Take out', 'Any time, no fee'],
    ],
    callout: 'Interest lands in your wallet every day. You do not have to do anything.',
    action: (v) => 'Move ' + usd(v) + ' in',
    onAction: (v) => openSheet('earn-review', { v: String(v) }),
    right: (v) => {
      const after = state.inEarn + v
      const yearly = (after * state.rates.earn) / 100
      return card(
        cardHead('What you earn'),
        h('span', { class: 't-title', text: 'In Earn' }),
        h('span', { class: 't-display-xl', text: usd(state.inEarn) }),
        h('span', { class: 'muted', text: 'It keeps earning every day. Take any part of it out whenever you want.' }),
        h('div', { class: 'stack-12' },
          kv('After this move', usd(after)),
          kv('Rate', pct(state.rates.earn) + ' a year'),
          kv('Earned so far', h('span', { class: 'pos t-body-strong', text: signed(state.earnedSoFar) }))),
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
    eyebrow: ['In Earn', usd(state.inEarn)],
    cardLabel: 'How much',
    cardRight: 'In Earn ' + usd(state.inEarn),
    initial: Math.min(300, state.inEarn),
    max: state.inEarn,
    note: 'It lands in your wallet straight away. No notice and no fee.',
    quick: [
      { label: usd(100, false), value: 100 },
      { label: usd(300, false), value: 300 },
      { label: usd(500, false), value: 500 },
      { label: 'All', value: state.inEarn },
    ],
    summary: (v) => [
      ['Goes to', 'Your wallet'],
      ['Arrives', 'Straight away'],
      ['Fee', 'None, ever'],
      ['You give up', 'About ' + usd(monthlyEarn(v)) + ' a month'],
    ],
    callout: 'Interest already paid stays in your wallet. Only what you leave in keeps earning.',
    action: (v) => 'Take out ' + usd(v),
    onAction: (v) => openSheet('takeout-review', { v: String(v) }),
    right: (v) => {
      const rest = Math.max(0, state.inEarn - v)
      const yearly = (rest * state.rates.earn) / 100
      return card(
        cardHead('What keeps earning'),
        h('span', { class: 't-title', text: 'After this' }),
        h('span', { class: 't-display-xl', text: usd(rest) }),
        h('span', { class: 'muted', text: 'That carries on earning every day, and you can take more out whenever you want.' }),
        h('div', { class: 'stack-12' },
          kv('Rate', pct(state.rates.earn) + ' a year'),
          kv('Paid', 'Every day'),
          kv('Earned so far', h('span', { class: 'pos t-body-strong', text: signed(state.earnedSoFar) }))),
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
