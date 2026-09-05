import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv } from '../components/bits'
import { composerScreen, scenarios } from '../components/composer'
import { table } from '../components/table'
import { amount } from '../components/bits'
import { find } from '../catalogue'
import { state, holding } from '../state'
import { usd, pct, shares as fmtShares, when } from '../format'
import { go, openSheet } from '../router'

function orders(ticker?: string): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'trade' && (!ticker || a.who === find(ticker)?.name))
  return card(
    cardHead('Recent orders',
      h('button', { class: 'link', text: 'See all', on: { click: () => go('/history?filter=trades') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When' },
        { key: 'ref', label: 'Reference' }, { key: 'amt', label: 'Total', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 't-body-strong', text: a.type + ' ' + a.who }),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a.amount),
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
    title: 'Invest',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Cash ' + usd(state.cash),
    initial: Math.min(500, state.cash),
    max: state.cash,
    note: `About ${(500 * state.ngnPerUsd).toLocaleString('en-US')} naira at today's indicative rate`,
    quick: [
      { label: usd(100, false), value: 100 },
      { label: usd(250, false), value: 250 },
      { label: usd(500, false), value: 500 },
      { label: 'All', value: state.cash },
    ],
    summary: (v) => [
      ['You get', fmtShares(v / c.price) + ' shares'],
      ['Price each', usd(c.price)],
      ['Fee', 'Free, Tokkenly covers it'],
      ['Settles', 'In about a minute'],
    ],
    callout: 'You are buying part of a share. Sell any part of it whenever you want.',
    action: (v) => `Buy ${usd(v)} of ${c.name}`,
    onAction: (v) => openSheet('invest-review', { v: String(v), t: c.ticker }),
    right: () => {
      const held = holding(c.ticker)
      return card(
        cardHead('What you are buying',
          h('button', { class: 'link', text: 'Change stock', on: { click: () => go('/market') } })),
        h('span', { class: 't-title', text: c.name }),
        h('span', { class: 'muted', text: `${c.ticker} · listed in the United States` }),
        h('span', { class: 't-display-xl', text: usd(c.price) }),
        h('span', { class: c.dayPct >= 0 ? 'pos' : 'muted', text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) + ' today' }),
        h('div', { class: 'stack-12' },
          kv('Year low', usd(c.yearLow)),
          kv('Year high', usd(c.yearHigh)),
          kv('Dividend', pct(c.dividend, 2) + ' a year'),
          kv('You hold', held ? held.shares.toFixed(2) + ' shares' : 'None yet')),
        scenarios('If it moves',
          ['Moves', 'Your holding', 'Worth'],
          [
            ['+10%', (held?.shares ?? 0).toFixed(2) + ' sh', usd((held?.shares ?? 0) * c.price * 1.1)],
            ['Flat', (held?.shares ?? 0).toFixed(2) + ' sh', usd((held?.shares ?? 0) * c.price)],
            ['−10%', (held?.shares ?? 0).toFixed(2) + ' sh', usd((held?.shares ?? 0) * c.price * 0.9)],
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
    title: 'Sell',
    eyebrow: ['You hold', usd(maxValue)],
    cardLabel: 'How much',
    cardRight: held.shares.toFixed(2) + ' shares',
    initial: Math.min(250, maxValue),
    max: maxValue,
    note: 'The cash lands in your wallet, usually within a minute.',
    quick: [
      { label: usd(100, false), value: 100 },
      { label: usd(250, false), value: 250 },
      { label: 'Half', value: maxValue / 2 },
      { label: 'All', value: maxValue },
    ],
    summary: (v) => [
      ['You sell', fmtShares(v / c.price) + ' shares'],
      ['Price each', usd(c.price)],
      ['Fee', 'Free, Tokkenly covers it'],
      ['Lands in', 'Your wallet'],
    ],
    callout: 'Selling part of a holding is fine. Whatever you keep carries on tracking the price.',
    action: (v) => `Sell ${usd(v)} of ${c.name}`,
    onAction: (v) => openSheet('sell-review', { v: String(v), t: c.ticker }),
    right: (v) =>
      card(
        cardHead('What you are selling'),
        h('span', { class: 't-title', text: c.name }),
        h('span', { class: 't-display-xl', text: usd(maxValue) }),
        h('span', { class: 'muted', text: `${held.shares.toFixed(2)} shares at ${usd(c.price)} each` }),
        h('div', { class: 'stack-12' },
          kv('Selling', fmtShares(v / c.price) + ' shares'),
          kv('Left after', fmtShares(Math.max(0, held.shares - v / c.price)) + ' shares'),
          kv('Worth after', usd(Math.max(0, maxValue - v))))
      ),
    bottom: orders(c.ticker),
  })
}
