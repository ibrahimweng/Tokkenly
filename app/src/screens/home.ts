import { h, link } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
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
    h('span', { class: 'chip', text: a.settled ? 'Settled' : 'Pending' }),
    amount(a.amount),
  ])
}

function chart(): HTMLElement {
  // Twelve months of the portfolio, drawn as a dot column so a flat month
  // still reads as a month. design.md 8.12.
  const wrap = h('div', { class: 'card', style: { gap: '20px' } })
  wrap.appendChild(h('div', { class: 'card-head' },
    h('span', { class: 't-caps subtle', text: 'Portfolio over time' }),
    h('div', { class: 'chip-row' },
      ...['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((p, i) =>
        h('button', { class: 'chip', text: p, ariaPressed: i === 4 })))))

  const bars = h('div', { class: 'bars', style: { display: 'flex', alignItems: 'flex-end', gap: '3px', height: '196px' } })
  let seed = 7
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  for (let i = 0; i < 72; i++) {
    const t = i / 71
    const v = 0.28 + t * 0.6 + (rand() - 0.5) * 0.12
    bars.appendChild(h('div', {
      style: {
        width: '5px', borderRadius: '2px', flex: 'none',
        height: Math.max(6, v * 196) + 'px',
        background: i > 64 ? 'var(--ink)' : 'var(--control-pressed)',
      },
    }))
  }
  wrap.appendChild(bars)
  wrap.appendChild(h('div', { style: { display: 'flex', justifyContent: 'space-between' } },
    ...['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((m) =>
      h('span', { class: 't-caption subtle', text: m }))))
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
    pageHeader(isMobile() ? '' : 'Good morning, ' + state.person.name.split(' ')[0], viewToggle()),
    h('div', { class: 'row' },
      h('div', { class: 'stack', style: { width: '308px', flex: 'none' } },
        h('div', { class: 'stack-8' },
          h('span', { class: 'muted', text: 'Everything is settled. Nothing needs your attention.' }),
          h('span', { class: 't-display-xl', text: usd(value) }),
          h('span', {}, h('span', { class: 'pos t-body-strong', text: signed(142.6) + ' (1.16%)' }),
            h('span', { class: 'muted', text: '  Today' }))),
        h('div', { class: 'chip-row' },
          h('button', { class: 'btn btn-filled btn-sm', text: 'Send', on: { click: () => go('/send') } }),
          h('button', { class: 'btn btn-quiet btn-sm', text: 'Receive', on: { click: () => go('/receive') } }))),
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
    pageHeader(isMobile() ? '' : 'Good morning, ' + state.person.name.split(' ')[0], viewToggle()),
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
