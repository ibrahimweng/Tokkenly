import { h, link } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, bell, jumpOpen } from '../components/shell'
import { card, cardHead, headLink, kv, amount, directionMark } from '../components/bits'
import { table } from '../components/table'
import { state, actions, holdingsValue, availableToBorrow, buyingPower } from '../state'
import { usd, signed, when, pct, activityLabel } from '../format'
import { go } from '../router'
import { isMobile } from '../responsive'

function viewToggle(): HTMLElement {
  const mk = (v: 'simple' | 'detailed', label: string) =>
    h('button', {
      class: 'chip',
      text: label,
      ariaPressed: state.homeView === v,
      on: { click: () => { actions.setHomeView(v); go('/') } },
    })
  return h('div', { class: 'chip-row' }, mk('simple', 'Simple'), mk('detailed', 'Detailed'))
}

function quickAction(label: string, sub: string, ic: string, to: string): HTMLElement {
  const a = link(to, 'card grow tile')
  a.style.textDecoration = 'none'
  a.appendChild(h('div', { class: 'promo-badge', html: ic }))
  a.appendChild(h('div', { class: 'spacer' }))
  a.appendChild(h('div', { class: 'stack-8' },
    h('span', { class: 't-title', text: label }),
    h('span', { class: 'muted', text: sub })))
  return a
}

function activityRows(limit: number) {
  return state.activity.slice(0, limit).map((a) => [
    h('span', { class: 'who' }, directionMark(a.amount),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: activityLabel(a) }),
        h('small', { text: a.ref + ' · ' + when(a.at) }))),
    h('span', { class: 'pill', text: a.settled ? 'Settled' : 'Pending' }),
    amount(a.amount),
  ])
}

/** Six ranges, each with its own number of columns, its own axis and its own
 *  change. A range switch that redraws nothing is a button that lies. */
const RANGES: Record<string, { cols: number; axis: string[]; drift: number; vol: number; pct: number }> = {
  // pct is stated, not derived from the drawn line. A noisy series read at its
  // endpoints produced things like +51% in a month. The day and the year are
  // the figures already on this screen: +$142.60 today, +17.28% all in.
  '1D': { cols: 24, axis: ['9am', '12pm', '3pm', '6pm', '9pm'], drift: 0.04, vol: 0.05, pct: 1.16 },
  '1W': { cols: 28, axis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], drift: 0.08, vol: 0.07, pct: 2.4 },
  '1M': { cols: 30, axis: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'], drift: 0.14, vol: 0.06, pct: 4.1 },
  '3M': { cols: 45, axis: ['Jul', 'Aug', 'Sep'], drift: 0.3, vol: 0.07, pct: 8.7 },
  '1Y': { cols: 72, axis: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'], drift: 0.6, vol: 0.09, pct: 17.28 },
  'ALL': { cols: 84, axis: ['2024', '2025', '2026'], drift: 0.78, vol: 0.11, pct: 24.6 },
}

/** Seeded per range, so a range always draws the same shape. Rule 43's
 *  sibling: a figure a person can come back to must not move on its own. */
function series(key: string): number[] {
  const r = RANGES[key]
  let seed = 7 + key.length * 31
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  return Array.from({ length: r.cols }, (_, i) => {
    const t = i / (r.cols - 1)
    return Math.max(0.06, 0.28 + t * r.drift + (rand() - 0.5) * r.vol)
  })
}

function chart(): HTMLElement {
  // Twelve months of the portfolio, drawn as a dot column so a flat month
  // still reads as a month. design.md 8.12.
  const wrap = h('div', { class: 'card', style: { gap: '20px' } })
  const bars = h('div', { class: 'bars', style: { display: 'flex', alignItems: 'flex-end', gap: '3px', height: '196px' } })
  const axis = h('div', { style: { display: 'flex', justifyContent: 'space-between' } })
  const delta = h('span', { class: 't-caption' })
  const chips = h('div', { class: 'chip-row' })

  const draw = (key: string) => {
    const vals = series(key)
    const live = Math.max(1, Math.round(vals.length * 0.1))
    bars.replaceChildren(...vals.map((v, i) =>
      h('div', {
        style: {
          width: '5px', borderRadius: '2px', flex: 'none',
          height: Math.max(6, v * 196) + 'px',
          background: i >= vals.length - live ? 'var(--ink)' : 'var(--control-pressed)',
          transition: 'height 220ms cubic-bezier(0.2,0.8,0.2,1)',
        },
      })))
    axis.replaceChildren(...RANGES[key].axis.map((m) =>
      h('span', { class: 't-caption subtle', text: m })))
    // What the range gained, against what it started from.
    const change = RANGES[key].pct
    const money = holdingsValue() - holdingsValue() / (1 + change / 100)
    delta.className = 't-caption ' + (change >= 0 ? 'pos' : 'warn')
    delta.textContent = `${change >= 0 ? '+' : ''}${usd(money)} (${change >= 0 ? '+' : ''}${pct(change)}) over ${key === 'ALL' ? 'all time' : key}`
    for (const c of chips.children) {
      (c as HTMLElement).setAttribute('aria-pressed', String(c.textContent === key))
    }
  }

  for (const key of Object.keys(RANGES)) {
    chips.appendChild(h('button', { class: 'chip', text: key, on: { click: () => draw(key) } }))
  }
  wrap.appendChild(h('div', { class: 'card-head' },
    h('span', { class: 't-caps subtle', text: 'Portfolio over time' }), chips))
  wrap.appendChild(delta)
  wrap.appendChild(bars)
  wrap.appendChild(axis)
  draw('1Y')
  return wrap
}

export function homeScreen(): HTMLElement {
  return state.homeView === 'simple' ? gateway() : detailed()
}

function detailed(): HTMLElement {
  const value = holdingsValue()
  const positions = card(
    cardHead('Your positions', headLink('Market', '/market')),
    ...state.holdings.map((p) => {
      const row = h('div', { class: 'kv', style: { cursor: 'pointer' } },
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: p.ticker }),
          h('small', { text: `${p.name} · ${p.shares.toFixed(2)} shares` })),
        h('span', { class: 'two-line right' },
          h('span', { class: 't-body-strong', text: usd(p.shares * p.price) }),
          h('small', { class: p.dayPct >= 0 ? 'pos' : 'muted', text: (p.dayPct >= 0 ? '+' : '') + pct(p.dayPct) })))
      row.addEventListener('click', () => go('/market/' + p.ticker.toLowerCase()))
      return row
    })
  )

  const growCard = card(
    cardHead('Grow', headLink('Open Grow', '/grow')),
    h('span', { class: 't-body-strong', text: `${usd(availableToBorrow(), false)} to borrow against your shares, at ${pct(state.rates.borrow)} a year` }),
    h('span', { class: 't-body-strong', text: `${pct(state.rates.earn)} a year on dollars you are not using, paid every day` })
  )

  const available = card(
    cardHead('Available'),
    kv('Cash', usd(state.cash)),
    kv('Buying power', usd(buyingPower())),
    kv('Total gain', h('span', { class: 'pos t-body-strong', text: signed(1840.6) + ' (17.28%)' }))
  )

  return shell(
    'home',
    pageHeader(isMobile() ? '' : 'Good morning, ' + state.person.name.split(' ')[0],
      h('div', { class: 'row', style: { gap: '12px', alignItems: 'center' } }, jumpOpen(), viewToggle(), bell())),
    h('div', { class: 'row' },
      h('div', { class: 'stack', style: { width: '308px', flex: 'none' } },
        h('div', { class: 'stack-8' },
          h('span', { class: 'muted', text: 'Everything is settled. Nothing needs your attention.' }),
          h('span', { class: 't-display-xl', text: usd(value) }),
          h('span', {}, h('span', { class: 'pos t-body-strong', text: signed(142.6) + ' (1.16%)' }),
            h('span', { class: 'muted', text: '  Today' }))),
        h('div', { class: 'chip-row' },
          h('button', { class: 'btn btn-primary btn-sm', text: 'Send', on: { click: () => go('/send') } }),
          h('button', { class: 'btn btn-secondary btn-sm', text: 'Receive', on: { click: () => go('/receive') } }))),
      h('div', { class: 'row grow tiles' },
        quickAction('Buy', 'Shares and funds', icon.buy(), '/market'),
        quickAction('Convert', 'Naira and dollars', icon.convert(), '/convert'),
        quickAction('Borrow', 'Against your shares', icon.download(), '/grow/borrow'))),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        chart(),
        card(
          cardHead('Recent activity', headLink('See all', '/history')),
          table(
            [{ key: 'who', label: '' }, { key: 'state', label: '' }, { key: 'amt', label: '', align: 'right' }],
            activityRows(4),
            (i) => go('/history?sheet=receipt&ref=' + state.activity[i].ref)
          )
        )),
      h('div', { class: 'stack col-side' }, growCard, positions, available))
  )
}

function gateway(): HTMLElement {
  const tile = (label: string, sub: string, to: string, ic: string) => {
    const a = link(to, 'card tile')
    a.style.textDecoration = 'none'
    a.style.minHeight = '220px'
    a.appendChild(h('div', { class: 'promo-badge', html: ic }))
    a.appendChild(h('div', { class: 'spacer' }))
    a.appendChild(h('div', { class: 'stack-8' },
      h('span', { class: 't-title', text: label }),
      h('span', { class: 'muted', text: sub })))
    return a
  }
  return shell(
    'home',
    pageHeader(isMobile() ? '' : 'Good morning, ' + state.person.name.split(' ')[0],
      h('div', { class: 'row', style: { gap: '12px', alignItems: 'center' } }, jumpOpen(), viewToggle(), bell())),
    h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'Your money' }),
      h('span', { class: 't-display-xl', text: usd(state.cash + state.inEarn + holdingsValue()) }),
      h('span', { class: 'muted', text: 'Everything is settled. Nothing needs your attention.' })),
    h('div', { class: 'row tiles' },
      tile('Buy stock', 'Own a piece of Apple, Nvidia or an index fund', '/market', icon.buy()),
      tile('Add money', 'Turn naira into dollars, usually in under a minute', '/addmoney', icon.receive()),
      tile('Send', 'Pay anyone, anywhere, for nothing', '/send', icon.send())),
    card(
      cardHead('Recent activity', headLink('See all', '/history')),
      table(
        [{ key: 'who', label: '' }, { key: 'state', label: '' }, { key: 'amt', label: '', align: 'right' }],
        activityRows(5),
        (i) => go('/history?sheet=receipt&ref=' + state.activity[i].ref)
      )
    )
  )
}
