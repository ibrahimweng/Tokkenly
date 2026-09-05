import { h, link, append } from '../ui'
import { icon } from '../icons'
import { state } from '../state'
import { openSheet, go } from '../router'

export type Place = 'home' | 'wallet' | 'market' | 'grow' | 'history' | 'account'

const PLACES: { id: Place; label: string; to: string; ic: () => string }[] = [
  { id: 'home', label: 'Home', to: '/', ic: icon.home },
  { id: 'wallet', label: 'Wallet', to: '/wallet', ic: icon.wallet },
  { id: 'market', label: 'Market', to: '/market', ic: icon.market },
  { id: 'grow', label: 'Grow', to: '/grow', ic: icon.grow },
  { id: 'history', label: 'History', to: '/history', ic: icon.history },
  { id: 'account', label: 'Account', to: '/account', ic: icon.account },
]

/** Six places, and Account sits apart because it is you rather than your
 *  money. design.md 11b.2. */
export function sidebar(active: Place): HTMLElement {
  const nav = h('nav', { class: 'nav' })
  for (const p of PLACES) {
    if (p.id === 'account') nav.appendChild(h('div', { class: 'nav-gap' }))
    const row = link(p.to, 'nav-row', h('span', { html: p.ic() }), h('span', { text: p.label }))
    if (p.id === active) row.setAttribute('aria-current', 'page')
    nav.appendChild(row)
  }

  const promo = h(
    'div',
    { class: 'promo' },
    h('div', { class: 'promo-badge', html: icon.card() }),
    h('h3', { text: 'Debit card\ncoming soon' }),
    h('p', { text: 'Spend your dollars in naira, anywhere that takes a card.' }),
    h(
      'button',
      { on: { click: () => openSheet('card') } },
      h('span', { text: state.cardWaitlist ? 'You are on the list' : 'Join the list' }),
      h('span', { html: icon.chevron() })
    )
  )

  const initials = state.person.name.split(' ').map((s) => s[0]).join('')
  const who = h(
    'button',
    { class: 'whoami', on: { click: () => go('/account') } },
    h('span', { class: 'avatar', text: initials }),
    h(
      'span',
      { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: state.person.name }),
      h('small', { text: 'Verified' })
    ),
    h('span', { class: 'muted', html: icon.chevron() })
  )

  return h(
    'aside',
    { class: 'sidebar' },
    h('div', { class: 'brand' }, h('span', { class: 'brand-mark', text: 'T' }),
      h('strong', { text: 'Tokkenly' })),
    nav,
    promo,
    who
  )
}

/** Every signed-in screen is this: a rail, then a column that owns the page. */
export function shell(active: Place, ...bands: (Node | false | null)[]): HTMLElement {
  const content = h('main', { class: 'content' })
  append(content, bands)
  return h('div', { class: 'screen' }, sidebar(active), content)
}

export function pageHeader(title: string, right?: Node | null): HTMLElement {
  return h('header', { class: 'page-header' }, h('h1', { text: title }), right ?? null)
}

export function eyebrow(label: string, value: string): HTMLElement {
  return h('div', { class: 'eyebrow' },
    h('span', { class: 't-caps', text: label }),
    h('strong', { text: value }))
}
