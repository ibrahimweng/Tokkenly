import { h, link, append } from '../ui'
import { icon } from '../icons'
import { state, visibleNotifications } from '../state'
import { initialsOf } from '../format'
import { openSheet, go, current } from '../router'
import { isMobile } from '../responsive'
import { trailFor } from '../destinations'

export type Place = 'home' | 'wallet' | 'market' | 'grow' | 'history' | 'account'

interface PlaceDef { id: Place; label: string; to: string; ic: () => string }

/** Six places. On desktop they are a rail; on the phone the first four are
 *  tabs and the rest arrive behind More. Same six either way. */
/* The names the product is called by everywhere else: the marketing site's
   tabs are Home, Invest, Wallet, Activity. The ids stay as they were, so the
   lit-row logic and every `place:` in the registry keep working, and the old
   paths still resolve — a bookmark to /market is not a broken link. */
const PLACES: PlaceDef[] = [
  { id: 'home', label: 'Home', to: '/', ic: icon.home },
  { id: 'market', label: 'Invest', to: '/invest', ic: icon.market },
  { id: 'wallet', label: 'Wallet', to: '/transfer', ic: icon.wallet },
  { id: 'grow', label: 'Borrow & Lend', to: '/grow', ic: icon.grow },
  { id: 'history', label: 'Activity', to: '/activity', ic: icon.history },
  { id: 'account', label: 'Account', to: '/account', ic: icon.account },
]
const TABS = PLACES.slice(0, 4)
export const BEHIND_MORE: { label: string; sub: string; to: string; ic: () => string }[] = [
  { label: 'Activity', sub: 'Everything that has moved', to: '/activity', ic: icon.history },
  { label: 'Notifications', sub: 'What we have told you', to: '/activity?filter=alerts', ic: icon.bell },
  { label: 'Account', sub: 'Your details and your address', to: '/account', ic: icon.account },
  { label: 'Security', sub: 'PIN, Face ID and recovery', to: '/security', ic: icon.lock },
  { label: 'Your banks', sub: 'Where your payouts land', to: '/transfer?sheet=banks', ic: icon.wallet },
  { label: 'Support', sub: state.person.email, to: '/support', ic: icon.mail },
  { label: 'Everything', sub: 'Every screen, in one list', to: '/all', ic: icon.grid },
]

/** The way in to the jump-to overlay for anyone not reaching for a keyboard. */
export function jumpOpen(): HTMLElement {
  return h('button', {
    class: 'jump-open', ariaLabel: 'Search Tokkenly',
    on: { click: () => openSheet('jump') },
  },
    h('span', { class: 'ic', html: icon.search() }),
    h('span', { class: 'grow', text: 'Search' }),
    h('span', { class: 'kbd', text: navigator.platform.includes('Mac') ? '\u2318K' : 'Ctrl K' }))
}

/** The bucket, with what is in it. It sits beside the bell on every screen
 *  because a thing you are meant to come back to and pay for has to be
 *  visible from wherever you wandered off to. */
export function bucketButton(): HTMLElement {
  const n = state.bucket.length
  const b = h('button', {
    class: 'icon-btn bucket-btn', ariaLabel: n ? n + ' in your bucket' : 'Your bucket, empty',
    html: icon.bucket(), on: { click: () => go('/bucket') },
  })
  if (n) b.appendChild(h('span', { class: 'dot', text: String(n) }))
  return b
}

/** The bell from Figma D01. It carries the unread count and now goes to the
 *  place that holds them rather than floating a panel over whatever you were
 *  doing: notifications are a section of Activity, at /activity?filter=alerts. */
export function bell(): HTMLElement {
  const unread = visibleNotifications().filter((n) => !n.read).length
  const b = h('button', {
    class: 'icon-btn bell', ariaLabel: unread ? unread + ' unread notifications' : 'Notifications',
    html: icon.bell(), on: { click: () => go('/activity?filter=alerts') },
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
  // The bucket sits with the places rather than in a page header, so it is on
  // every screen — a thing you fill as you browse and come back to pay for is
  // no use if it is only visible where you filled it.
  {
    const n = state.bucket.length
    const row = link('/bucket', 'nav-row nav-bucket',
      h('span', { html: icon.bucket() }), h('span', { class: 'grow', text: 'Bucket' }),
      n ? h('span', { class: 'count', text: String(n) }) : null)
    if (current().path === '/bucket') row.setAttribute('aria-current', 'page')
    nav.appendChild(row)
  }
  // Not an <h3>. It sat in the sidebar, which is drawn before the content, so
  // heading navigation on all sixteen signed-in routes landed on an advert
  // before the page's own <h1>. It looks the same and is no longer a landmark.
  const promo = h(
    'div',
    { class: 'promo' },
    h('div', { class: 'promo-badge', html: icon.card() }),
    h('div', { class: 'promo-title', text: 'Debit card\ncoming soon' }),
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
  return h('button', { class: 'whoami', on: { click: () => go('/account') } },
    h('span', { class: 'avatar', text: initialsOf(state.person.name) }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: state.person.name }),
      h('small', { text: state.kyc.status === 'verified' ? 'Verified' : 'Not verified' })),
    h('span', { class: 'muted', html: icon.chevron() }))
}

/* ---------------- phone chrome ---------------- */

/** The phone's chrome: who you are, and the three things that are the same on
 *  every screen. It used to greet you here as well, so Home ran "Good morning,
 *  Chinaza" twice within 180px — once in this bar and once as its own title —
 *  and carried two search buttons 40px apart. A greeting belongs on the screen
 *  that opens the day, not above the Activity list. */
function topBar(): HTMLElement {
  return h('header', { class: 'topbar' },
    h('button', { class: 'avatar', text: initialsOf(state.person.name), ariaLabel: 'Account',
      on: { click: () => go('/account') } }),
    h('span', { class: 'grow' }),
    h('button', { class: 'icon-btn', html: icon.search(), ariaLabel: 'Search Tokkenly',
      on: { click: () => openSheet('jump') } }),
    bucketButton(),
    h('button', { class: 'icon-btn', html: icon.info(), ariaLabel: 'Support',
      on: { click: () => go('/support') } }))
}

function rail(active: Place): HTMLElement {
  const pill = h('div', { class: 'rail-pill' })
  for (const p of TABS) {
    // The name, not only the icon. Four unlabelled glyphs is a memory test,
    // and this product's whole thesis is teaching somebody their first share
    // — the sidebar has said Home, Invest, Wallet, Borrow & Lend in words
    // start, and the phone is where most of these people will actually be.
    const tab = h('button', { class: 'rail-tab', on: { click: () => go(p.to) } },
      h('span', { class: 'ic', html: p.ic() }),
      h('span', { class: 'rail-label', text: p.label }))
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

/** True while a screen is being drawn only to sit under a dialog. Such a base
 *  must not claim the trail or light a tab: the thing on top of it is where
 *  the person actually is. */
let underOverlay = false
export function renderBase(fn: () => HTMLElement): HTMLElement {
  underOverlay = true
  try { return fn() } finally { underOverlay = false }
}

/** A bar across the top when there is no connection. It says what still works
 *  as well as what does not, because "offline" on its own reads as "the app is
 *  broken" when in fact everything you can read is still here — it is only
 *  moving money that has to wait. Announced, because a person who cannot see
 *  the bar is exactly the person who most needs to know before they press a
 *  button that will not work. */
function offlineBar(): HTMLElement | null {
  if (state.online) return null
  return h('div', { class: 'offline-bar', role: 'status', ariaLive: 'polite' },
    h('span', { class: 'ic', html: icon.alert() }),
    h('span', { text: 'No connection. You can still look around; moving money has to wait.' }))
}

/** The way past the chrome. Seven nav rows, a promo with a button of its own
 *  and the account row stand between the start of the document and the page —
 *  on every navigation, because this app replaces the whole tree each time.
 *
 *  A button rather than the customary `<a href="#main">`: the address bar is
 *  the router here, so an anchor to a fragment would navigate to /main and land
 *  on the not-found screen. It moves focus instead, which is the part of a skip
 *  link that actually does the work. `main` takes tabindex="-1" so it can hold
 *  focus without joining the tab order. */
function skipLink(to: HTMLElement): HTMLElement {
  return h('button', {
    class: 'skip', text: 'Skip to content',
    on: { click: () => { to.focus(); to.scrollIntoView() } },
  })
}

export function shell(active: Place, ...bands: (Node | false | null)[]): HTMLElement {
  const content = h('main', { class: 'content', id: 'main', tabIndex: -1 })
  append(content, bands)
  if (isMobile()) {
    return h('div', { class: 'screen' }, skipLink(content), offlineBar(), topBar(), content, rail(active))
  }
  return h('div', { class: 'screen' }, skipLink(content), sidebar(active), offlineBar(), content)
}

/** Where you are, as a trail you can step back up. Drawn from the registry,
 *  so it can never name a screen that is not there. */
function breadcrumbs(): HTMLElement | null {
  const r = current()
  // Parents only. The last step of a trail is the page you are standing on,
  // and the page you are standing on is the <h1> one line below it — so
  // printing it again was a repetition where the two agreed, and a
  // contradiction where they did not: the registry's label is written to be
  // searched ("Take back what you lent") and a title is written to be read
  // ("Take out"). Seven headers named the same screen twice, two of them
  // ("Receive money" over "Add money", "Send to your bank" over "Send money")
  // with words that read as two different places. Every step is a link now,
  // which is the whole job of a trail: a parent you cannot otherwise see.
  const trail = trailFor(r.path, r.query).slice(0, -1)
  if (!trail.length) return null
  const nav = h('nav', { class: 'crumbs', ariaLabel: 'Where you are' })
  trail.forEach((d, i) => {
    if (i) nav.appendChild(h('span', { class: 'crumb-sep', html: icon.chevron() }))
    nav.appendChild(link(d.to, 'crumb', d.label))
  })
  return nav
}

/** A trail is for a parent you cannot see. Where the parent is already on the
 *  screen — a settings rail lit beside its panel — the trail restates it, and
 *  on a phone it restated the page title word for word one line above it. Two
 *  ways out of that, and a screen picks one:
 *
 *  `crumbs: false`  the parent is visible; say nothing.
 *  `back`           the parent is a screen away; one step back, at 44px,
 *                   beats a 37px trail nobody can hit. */
export interface HeaderOpts {
  crumbs?: boolean
  back?: { label: string; to: string }
}

export function pageHeader(title: string, right?: Node | null, opts: HeaderOpts = {}): HTMLElement {
  const b = opts.back
  const back = b
    ? h('button', { class: 'page-back', on: { click: () => go(b.to) } },
        h('span', { class: 'ic', html: icon.back() }), h('span', { text: b.label }))
    : null
  const crumbs = back || opts.crumbs === false || underOverlay ? null : breadcrumbs()
  const row = h('div', { class: 'page-header-row' }, h('h1', { text: title }), right ?? null)
  if (crumbs) return h('header', { class: 'page-header has-crumbs' }, crumbs, row)
  if (back) return h('header', { class: 'page-header' }, back, row)
  return h('header', { class: 'page-header' }, row)
}

export function eyebrow(label: string, value: string): HTMLElement {
  return h('div', { class: 'eyebrow' },
    h('span', { class: 't-caps', text: label }),
    h('strong', { text: value }))
}
