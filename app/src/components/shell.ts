import { h, link, append } from '../ui'
import { icon } from '../icons'
import { state } from '../state'
import { openSheet, go, current } from '../router'
import { isMobile } from '../responsive'

export type Place = 'home' | 'wallet' | 'market' | 'grow' | 'history' | 'account'

interface PlaceDef { id: Place; label: string; to: string; ic: () => string }

/** Six places. On desktop they are a rail; on the phone the first four are
 *  tabs and the rest arrive behind More. Same six either way. */
const PLACES: PlaceDef[] = [
  { id: 'home', label: 'Home', to: '/', ic: icon.home },
  { id: 'wallet', label: 'Wallet', to: '/wallet', ic: icon.wallet },
  { id: 'market', label: 'Market', to: '/market', ic: icon.market },
  { id: 'grow', label: 'Grow', to: '/grow', ic: icon.grow },
  { id: 'history', label: 'History', to: '/history', ic: icon.history },
  { id: 'account', label: 'Account', to: '/account', ic: icon.account },
]
const TABS = PLACES.slice(0, 4)
export const BEHIND_MORE: { label: string; sub: string; to: string; ic: () => string }[] = [
  { label: 'History', sub: 'Everything that has moved', to: '/history', ic: icon.history },
  { label: 'Account', sub: 'Your details and your address', to: '/account', ic: icon.account },
  { label: 'Security', sub: 'PIN, Face ID and recovery', to: '/security', ic: icon.lock },
  { label: 'Your banks', sub: 'Where your payouts land', to: '/wallet?sheet=banks', ic: icon.wallet },
  { label: 'Support', sub: state.person.email, to: '/support', ic: icon.mail },
]

/** The bell from Figma D01. It carries the unread count and opens the panel. */
export function bell(): HTMLElement {
  const unread = state.notifications.filter((n) => !n.read).length
  const b = h('button', {
    class: 'icon-btn bell', ariaLabel: unread ? unread + ' unread notifications' : 'Notifications',
    html: icon.bell(), on: { click: () => openSheet('notifications') },
  })
  if (unread) b.appendChild(h('span', { class: 'dot', text: String(unread) }))
  return b
}

/* ---------------- desktop rail ---------------- */

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
    h('button', { on: { click: () => openSheet('card') } },
      h('span', { text: state.cardWaitlist ? 'You are on the list' : 'Join the list' }),
      h('span', { html: icon.chevron() }))
  )
  return h('aside', { class: 'sidebar' },
    h('div', { class: 'brand' }, h('span', { class: 'brand-mark', text: 'T' }),
      h('strong', { text: 'Tokkenly' })),
    nav, promo, whoami())
}

function whoami(): HTMLElement {
  const initials = state.person.name.split(' ').map((s) => s[0]).join('')
  return h('button', { class: 'whoami', on: { click: () => go('/account') } },
    h('span', { class: 'avatar', text: initials }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: state.person.name }),
      h('small', { text: 'Verified' })),
    h('span', { class: 'muted', html: icon.chevron() }))
}

/* ---------------- phone chrome ---------------- */

function topBar(): HTMLElement {
  const initials = state.person.name.split(' ').map((s) => s[0]).join('')
  return h('header', { class: 'topbar' },
    h('button', { class: 'avatar', text: initials, ariaLabel: 'Account',
      on: { click: () => go('/account') } }),
    h('span', { class: 'who-line' },
      h('small', { text: 'Good morning' }),
      h('strong', { text: state.person.name.split(' ')[0] })),
    h('button', { class: 'icon-btn', html: icon.search(), ariaLabel: 'Search',
      on: { click: () => go('/history') } }),
    h('button', { class: 'icon-btn', html: icon.info(), ariaLabel: 'Support',
      on: { click: () => go('/support') } }))
}

function rail(active: Place): HTMLElement {
  const pill = h('div', { class: 'rail-pill' })
  for (const p of TABS) {
    const tab = h('button', { class: 'rail-tab', html: p.ic(), ariaLabel: p.label,
      on: { click: () => go(p.to) } })
    if (p.id === active) tab.setAttribute('aria-current', 'page')
    pill.appendChild(tab)
  }
  const moreOpen = current().sheet === 'more'
  const behind = active === 'history' || active === 'account'
  const more = h('button', {
    class: 'rail-more', html: icon.grid(), ariaLabel: 'More',
    on: { click: () => (moreOpen ? history.back() : openSheet('more')) },
  })
  more.setAttribute('aria-expanded', String(moreOpen || behind))
  return h('div', { class: 'railbar' }, pill, more)
}

/* ---------------- the shell ---------------- */

export function shell(active: Place, ...bands: (Node | false | null)[]): HTMLElement {
  const content = h('main', { class: 'content' })
  append(content, bands)
  if (isMobile()) {
    return h('div', { class: 'screen' }, topBar(), content, rail(active))
  }
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
