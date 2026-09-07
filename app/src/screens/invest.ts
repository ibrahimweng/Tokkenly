import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv } from '../components/bits'
import { composerScreen, scenarios } from '../components/composer'
import { table } from '../components/table'
import { amount } from '../components/bits'
import { find, discount, refusals, priceImpact, minReceived, GUARDS } from '../catalogue'
import { stockScreen } from './stock'
import { state, holding, nairaAside, tradeFee, maxInvestable, movementCeiling, ceilingLabel, switchOn, assetOn } from '../state'
import { usd, pct, signed, shares as fmtShares, when } from '../format'
import { go, openSheet } from '../router'

function orders(ticker?: string): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'trade' && (!ticker || a.who === find(ticker)?.name))
  return card(
    cardHead('Recent orders',
      h('button', { class: 'link', text: 'See all', on: { click: () => go('/activity?filter=trades') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
        { key: 'ref', label: 'Reference', optional: true }, { key: 'amt', label: 'Total', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: a.type + ' ' + a.who }),
          h('small', { class: 'phone-only', text: when(a.at) })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref })
    )
  )
}

export function investScreen(ticker: string): HTMLElement {
  const c = find(ticker)
  if (!c) return shell('market', pageHeader('Not found'))
  return composerScreen({
    place: 'market',
    base: () => stockScreen(ticker),
    title: 'Invest',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Cash ' + usd(state.cash),
    initial: Math.min(500, maxInvestable()),
    // The fee has to fit in the cash too, so the ceiling is what is left once
    // it does — not the balance, which would put every "All" over the top.
    // Two ceilings, and the lower one is the real one: the cash that is there
    // once the fee fits, and what the account is allowed to move.
    max: Math.min(maxInvestable(), movementCeiling()),
    maxLabel: ceilingLabel(maxInvestable(), 'The most you can invest, fee included'),
    note: nairaAside(Math.min(500, state.cash)) ?? undefined,
    quick: [
      { label: usd(100, false), value: 100 },
      { label: usd(250, false), value: 250 },
      { label: usd(500, false), value: 500 },
      { label: 'All', value: state.cash },
    ],
    summary: (v) => {
      // What the gap to the real share is worth on this order. It was stated
      // as a bare percentage sitting among dollar figures, which left the one
      // cost on the screen that is not a fee as the only one you could not
      // read in money. It is not added to the total: it is inside the price
      // per share, not a charge on top, and the total is what leaves the
      // wallet. So it comes after what you receive, as a note on the price
      // rather than a line in the bill.
      const gap = v * (1 - c.mark / c.price)   // positive when you pay over
      const got = v / c.price
      return [
        ['Investment', usd(v)],
        ['Fee', `${usd(tradeFee(v))} · ${state.fees.trade}%`],
        ['Total', usd(v + tradeFee(v))],
        ['You receive', fmtShares(got) + ' ' + c.ticker],
        // The floor under it. A quote is a price at a moment and the book
        // moves before it settles, so the number that protects somebody is not
        // the expected one — it is the least they can end up with.
        ['At least', fmtShares(minReceived(got, GUARDS.slippagePct)) + ' ' + c.ticker],
        ['Price impact', pct(priceImpact(c, v), 2),
          priceImpact(c, v) > GUARDS.impactPct ? 'warn' : ''],
        gap > 0
          ? ['Above the real price', `${usd(gap)} · ${pct(Math.abs(discount(c)), 2)}`, 'warn']
          : ['Below the real price', `${usd(-gap)} · ${pct(discount(c), 2)}`, 'pos'],
      ]
    },
    // Four ways this trade can be refused, checked on every keystroke rather
    // than at the review. A button you can press and then be told no is worse
    // than a button that is honest about being unavailable.
    guard: (v) => {
      return refusals(c, v, { trading: !switchOn('buy'), asset: !assetOn(c.ticker) })
    },
    callout: c.kind === 'etf'
      ? `A fund, not a company: one holding spread across ${c.holds ?? 'many'}. Its value can fall as well as rise, and you can get back less than you put in.`
      : 'You are buying part of a share. Its value can fall as well as rise, and you can get back less than you put in.',
    risky: true,
    action: (v) => `Buy ${usd(v)} of ${c.name}`,
    onAction: (v) => openSheet('invest-review', { v: String(v), t: c.ticker }),
    right: (v) => {
      const held = holding(c.ticker)
      const now = held?.shares ?? 0
      // The holding this order would leave you with, not the one you arrived
      // with. All three rows used to read the current position, so a what-if
      // table on a buy screen answered a question nobody had asked: it told
      // you what your existing shares would do and said nothing about the ones
      // you were in the middle of buying.
      const after = now + v / c.price
      const worth = (mult: number) => usd(after * c.price * mult)
      return card(
        cardHead('What you are buying',
          h('button', { class: 'link', text: 'Change stock', on: { click: () => go('/invest') } })),
        h('span', { class: 't-title', text: c.name }),
        h('span', { class: 'muted', text: `${c.ticker} · listed in the United States` }),
        h('span', { class: 't-display-xl', text: usd(c.price) }),
        h('span', { class: c.dayPct >= 0 ? 'pos' : 'muted', text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) + ' today' }),
        h('div', { class: 'stack-12' },
          kv('Year low', usd(c.yearLow)),
          kv('Year high', usd(c.yearHigh)),
          kv('Dividend', pct(c.dividend, 2) + ' a year'),
          kv('You hold', now ? fmtShares(now) + ' shares' : 'None yet'),
          kv('After this order', fmtShares(after) + ' shares')),
        scenarios('If it moves, after this order',
          ['Moves', 'You would hold', 'Worth'],
          [
            ['+10%', fmtShares(after) + ' shares', worth(1.1)],
            ['Flat', fmtShares(after) + ' shares', worth(1)],
            ['−10%', fmtShares(after) + ' shares', worth(0.9)],
          ])
      )
    },
    bottom: orders(),
  })
}

export function sellScreen(ticker: string): HTMLElement {
  const c = find(ticker)
  const held = c ? holding(c.ticker) : undefined
  if (!c || !held) return shell('market', pageHeader('Nothing to sell'))
  const maxValue = held.shares * c.price
  return composerScreen({
    place: 'market',
    base: () => stockScreen(ticker),
    title: 'Sell',
    eyebrow: ['You hold', usd(maxValue)],
    cardLabel: 'How much',
    cardRight: fmtShares(held.shares) + ' shares',
    initial: Math.min(250, maxValue),
    max: maxValue,
    maxLabel: 'What this holding is worth',
    note: 'The cash lands in your wallet, usually within a minute.',
    // A quarter, a half, three quarters, all of it. Selling is the one
    // composer where the natural unit is a proportion of what you hold rather
    // than a round figure: nobody thinks "I will sell two hundred and fifty
    // dollars of Apple", they think "I will sell half".
    quick: [
      { label: '25%', value: Math.round(maxValue * 0.25 * 100) / 100 },
      { label: 'Half', value: Math.round(maxValue * 0.5 * 100) / 100 },
      { label: '75%', value: Math.round(maxValue * 0.75 * 100) / 100 },
      { label: 'All', value: maxValue },
    ],
    summary: (v) => [
      ['Sale', usd(v)],
      ['Fee', `${usd(tradeFee(v))} · ${state.fees.trade}%`],
      ['You receive', usd(v - tradeFee(v))],
      ['At least', usd(minReceived(v - tradeFee(v), GUARDS.slippagePct))],
      ['Shares sold', fmtShares(v / c.price) + ' ' + c.ticker],
      ['Price impact', pct(priceImpact(c, v), 2),
        priceImpact(c, v) > GUARDS.impactPct ? 'warn' : ''],
    ],
    guard: (v) => {
      return refusals(c, v, { trading: !switchOn('sell'), asset: !assetOn(c.ticker) })
    },
    callout: 'Selling part of a holding is fine. Whatever you keep carries on tracking the price.',
    risky: true,
    action: (v) => `Sell ${usd(v)} of ${c.name}`,
    onAction: (v) => openSheet('sell-review', { v: String(v), t: c.ticker }),
    right: (v) =>
      card(
        cardHead('What you are selling'),
        h('span', { class: 't-title', text: c.name }),
        h('span', { class: 't-display-xl', text: usd(maxValue) }),
        h('span', { class: 'muted', text: `${fmtShares(held.shares)} shares at ${usd(c.price)} each` }),
        h('div', { class: 'stack-12' },
          kv('Selling', fmtShares(v / c.price) + ' ' + c.ticker),
          kv('Left after', fmtShares(Math.max(0, held.shares - v / c.price)) + ' ' + c.ticker),
          kv('Worth after', usd(Math.max(0, maxValue - v))),
          // The half a sale screen never showed: what this sale actually
          // realises against what those shares cost. Somebody selling to take
          // a profit is asking exactly this, and the answer was two screens
          // away in a spreadsheet they had to keep themselves.
          kv('It cost you', usd((v / c.price) * held.each)),
          kv('You realise', h('span', {
            class: v - (v / c.price) * held.each >= 0 ? 'pos t-body-strong' : 'warn t-body-strong',
            text: signed(v - (v / c.price) * held.each) })))
      ),
    bottom: orders(c.ticker),
  })
}
