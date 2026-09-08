import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, headActions } from '../components/shell'
import { amount, emptyState } from '../components/bits'
import { searchField, searchNote } from '../components/search'
import { rank, onlyNear } from '../match'
import { state, actions, visibleNotifications, type ActivityKind, type Activity, type Notif } from '../state'
import { usd, shares as fmtShares, activityLabel } from '../format'
import { go, current, openSheet } from '../router'
import { isMobile } from '../responsive'
import { popover, closeHint } from '../components/hint'

const ALERTS = 'alerts'

/** The categories, still at the top. They narrow one feed rather than
 *  switching between two lists: Notices is the feed with only the
 *  announcements in it, not a different screen. */
const FILTERS: { id: string; label: string; kinds: ActivityKind[] | null }[] = [
  { id: 'all', label: 'All', kinds: null },
  { id: 'payments', label: 'Payments', kinds: ['payment'] },
  { id: 'trades', label: 'Trades', kinds: ['trade'] },
  { id: 'grow', label: 'Borrow & Lend', kinds: ['grow'] },
]

/* ---------------------------------------------------------------------------
   One feed.

   Activity held two lists that never met: a table of money, and — behind its
   own chip — a list of notifications. Somebody who remembered "Adaeze paid me"
   had to know whether they were remembering the payment or the announcement of
   it, because those lived in different places. They are the same day in
   somebody's life and they belong in one column, in time order.

   What the reading said, and what it changed:

   - **One item per underlying event.** Monzo's account of merging their feeds
     is explicit about it: work out the source and destination of each item and
     keep one that represents the whole transfer. Three of the five seeded
     notifications carry the reference of a transaction that is already a row.
     Showing both is the fault this file has spent four tiers removing — the
     page saying everything twice. So a notification about a transaction folds
     into that transaction's row, which carries a bell to say it was announced
     and whether it was emailed. A notification with nothing behind it — a sign
     in, a rate alert — is a row of its own.
   - **A leading glyph per nature.** NN/g on list entries: pair the important
     pieces with iconography, and keep every element in a fixed position so the
     eye learns the row once. Bought, sold, added, sent, received, borrowed,
     repaid, lent, taken back, interest, security. Eleven natures, eleven
     glyphs, always in the same place.
   - **A tag, in words.** The glyph is recognition; the tag is the answer for
     anybody who does not recognise it, and it is what tells a notification
     from a movement, which is the thing this rebuild was asked for.
   - **Day headers.** The common pattern, and the cheap one: compare each row's
     date against the row above and emit a header when it changes. Today,
     Yesterday, then the date.
   - **Short timestamps.** Their job is roughly how long ago, not exactly when.

   Sorting by amount is still in the address, and turns the grouping off: a
   list ordered by size has no days in it. Sorting by who, by type and by
   reference has gone with the table — a feed has no columns to sort.
   --------------------------------------------------------------------------- */

type Nature =
  | 'bought' | 'sold' | 'shares-out'
  | 'added' | 'received' | 'sent' | 'withdrew'
  | 'borrowed' | 'repaid' | 'lent' | 'tookback' | 'interest'
  | 'security' | 'notice'

const NATURE: Record<Nature, { ic: () => string; tag: string }> = {
  bought: { ic: icon.bought, tag: 'Bought' },
  sold: { ic: icon.sold, tag: 'Sold' },
  'shares-out': { ic: icon.send, tag: 'Shares sent' },
  added: { ic: icon.receive, tag: 'Added money' },
  received: { ic: icon.arrowIn, tag: 'Received' },
  sent: { ic: icon.send, tag: 'Sent' },
  withdrew: { ic: icon.arrowOut, tag: 'Withdrawn' },
  borrowed: { ic: icon.download, tag: 'Borrowed' },
  repaid: { ic: icon.repay, tag: 'Repaid' },
  lent: { ic: icon.grow, tag: 'Lent' },
  tookback: { ic: icon.repay, tag: 'Taken back' },
  interest: { ic: icon.coin, tag: 'Interest' },
  security: { ic: icon.lock, tag: 'Security' },
  notice: { ic: icon.bell, tag: 'Notice' },
}

/** What kind of thing this was. Read off what the movement is rather than
 *  asserted at the call site, so two rows that are the same kind of event
 *  cannot be tagged differently. */
function natureOf(a: Activity): Nature {
  if (a.kind === 'trade') {
    if (a.type === 'Sent') return 'shares-out'
    return a.amount < 0 ? 'bought' : 'sold'
  }
  if (a.kind === 'grow') {
    if (a.type === 'Interest') return 'interest'
    if (a.type === 'Borrowed') return 'borrowed'
    if (a.type === 'Repaid') return 'repaid'
    if (a.type === 'Taken back') return 'tookback'
    return 'lent'
  }
  if (a.amount > 0) return a.rail === 'bank' || a.rail === 'card' ? 'added' : 'received'
  return a.note === 'Converted to naira' || a.note === 'Paid out in naira' ? 'withdrew' : 'sent'
}

const NOTICE_NATURE: Record<Notif['kind'], Nature> = {
  money: 'notice', trade: 'notice', grow: 'notice', security: 'security',
}

/** A row in the feed: either a movement, possibly with the announcement that
 *  went with it, or an announcement with nothing behind it. */
type Item =
  | { at: string; act: Activity; told?: Notif }
  | { at: string; note: Notif }

const isAct = (i: Item): i is { at: string; act: Activity; told?: Notif } => 'act' in i

/** Today, Yesterday, then the date. Compared against the row above rather than
 *  computed per row, so the header appears exactly where the day turns. */
function dayName(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.round(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
     new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

function feedRow(i: Item): HTMLElement {
  const n = isAct(i) ? natureOf(i.act) : NOTICE_NATURE[i.note.kind]
  const { ic, tag } = NATURE[n]
  const meta: string[] = [tag]
  let title: string
  let onward: () => void

  if (isAct(i)) {
    const a = i.act
    title = activityLabel(a)
    if (a.asset) meta.push(`${fmtShares(a.asset.shares)} ${a.asset.ticker} at ${usd(a.asset.price)}`)
    meta.push(a.ref)
    onward = () => openSheet('receipt', { ref: a.ref })
  } else {
    const nt = i.note
    title = nt.title
    meta.push(nt.body)
    onward = () => {
      actions.readNotification(nt.id)
      if (nt.ref) openSheet('receipt', { ref: nt.ref })
      else if (nt.to) go(nt.to)
    }
  }
  meta.push(clock(i.at))

  const told = isAct(i) ? i.told : undefined
  const unread = isAct(i) ? !!told && !told.read : !i.note.read

  return h('button', {
    class: 'feed-row' + (unread ? ' unread' : ''),
    on: { click: () => { if (told) actions.readNotification(told.id); onward() } },
  },
    h('span', { class: 'mark feed-ic', html: ic() }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: title }),
      h('small', { class: 'muted', text: meta.filter(Boolean).join(' · ') })),
    // What was announced, on the thing it was announced about. A second row
    // saying the same event happened is the page saying it twice.
    told
      ? h('span', { class: 'feed-told', title: told.emailed ? 'We told you, and emailed you' : 'We told you',
          ariaLabel: 'We told you about this', html: icon.bell() })
      : null,
    isAct(i) ? amount(i.act) : h('span', { class: 'muted t-caption', text: '' }),
    h('span', { class: 'muted set-chev', html: icon.chevron() }))
}

/** History is the one place that holds everything, which is what makes every
 *  See all in the product honest. design.md 11b.4j. */
export function historyScreen(): HTMLElement {
  const r = current()
  const active = r.query.get('filter') ?? 'all'
  const term = (r.query.get('q') ?? '').toLowerCase()
  const f = FILTERS.find((x) => x.id === active) ?? FILTERS[0]
  const onAlerts = active === ALERTS

  const FIELDS = (a: Activity) => [
    a.who, a.type, a.asset?.ticker ?? '', a.ref,
    String(Math.abs(a.amount)), usd(Math.abs(a.amount)), NATURE[natureOf(a)].tag,
  ]
  const NFIELDS = (n: Notif) => [n.title, n.body]

  const setQuery = (k: string, v: string) => {
    const q = new URLSearchParams(r.query)
    if (v) q.set(k, v)
    else q.delete(k)
    const s2 = q.toString()
    go('/activity' + (s2 ? '?' + s2 : ''))
  }

  // Ordering is part of the address, as it was when this was a table. What has
  // gone with the table is ordering by who, by type and by reference: a feed
  // has no columns to sort. Size is the one that still means something, and it
  // turns the day headers off, because a list ordered by size has no days.
  const sortKey = r.query.get('sort') ?? 'date'
  const sortDir = (r.query.get('dir') ?? 'desc') as 'asc' | 'desc'
  const byAmount = sortKey === 'amt'
  const order = (key: string) => {
    const q = new URLSearchParams(r.query)
    const dir = key === sortKey && sortDir === 'desc' ? 'asc' : 'desc'
    q.set('sort', key); q.set('dir', dir)
    go('/activity?' + q.toString())
  }
  const orderBtn = (key: string, label: string) =>
    h('button', {
      class: 'chip sort-by', ariaPressed: sortKey === key,
      on: { click: () => order(key) },
    }, h('span', { text: label }),
       sortKey === key ? h('small', { text: sortDir === 'desc' ? '↓' : '↑' }) : null)

  const list = h('div', { class: 'stack' })

  /** What the search actually matched, kept so the note under the field can
   *  say whether everything it found was a near miss. */
  let matched: Activity[] = []

  /** Everything that happened, as one column. */
  const items = (t: string): Item[] => {
    const notes = visibleNotifications()
    const matchedNotes = t.trim() ? rank(t, notes, NFIELDS) : notes
    // A notification whose reference names a movement is that movement's
    // announcement, not a second event.
    const spoken = new Map<string, Notif>()
    for (const n of notes) if (n.ref) spoken.set(n.ref, n)

    if (onAlerts) {
      return matchedNotes.map((n) => ({ at: n.at, note: n }))
    }
    const within = state.activity.filter((a) => !f.kinds || f.kinds.includes(a.kind))
    const acts = t.trim() ? rank(t, within, FIELDS) : within
    matched = acts
    const out: Item[] = acts.map((a) => ({ at: a.at, act: a, told: spoken.get(a.ref) }))
    // And the ones with nothing behind them stand on their own.
    if (!f.kinds) {
      for (const n of matchedNotes) if (!n.ref || !spoken.has(n.ref)) out.push({ at: n.at, note: n })
      else if (n.ref && !state.activity.some((a) => a.ref === n.ref)) out.push({ at: n.at, note: n })
    }
    return out
  }

  const paint = (t: string): void => {
    const rows = items(t)
    rows.sort((x, y) => byAmount
      ? ((isAct(x) ? x.act.amount : 0) - (isAct(y) ? y.act.amount : 0)) * (sortDir === 'asc' ? 1 : -1)
      : y.at.localeCompare(x.at) * (sortDir === 'asc' ? -1 : 1))

    const feed = h('div', { class: 'feed' })
    let day = ''
    for (const it of rows) {
      if (!byAmount) {
        const d = dayName(it.at)
        if (d !== day) {
          day = d
          feed.appendChild(h('h2', { class: 't-caps subtle feed-day', text: d }))
        }
      }
      feed.appendChild(feedRow(it))
    }

    const note = onAlerts
      ? searchNote(t, rows.length, onlyNear(t, visibleNotifications(), NFIELDS))
      : searchNote(t, rows.length, onlyNear(t, matched, FIELDS))
    list.replaceChildren(
      note ?? h('span', { hidden: true }),
      rows.length ? feed
        : t.trim() || active !== 'all'
          ? emptyState('Nothing matches that',
              'Try a different name, reference or amount.',
              { label: 'Clear the search', onClick: () => go('/activity') })
          : emptyState('Nothing here yet',
              'Money you move and anything we tell you shows up here.', undefined, 'history'))
  }

  const search = h('div', { class: 'grow' }, searchField({
    placeholder: isMobile() ? 'Name, reference or amount' : 'Search a name, a reference or an amount',
    value: r.query.get('q') ?? '',
    suggest: (t) => rank(t, state.activity, FIELDS).slice(0, 7).map((a) => ({
      label: activityLabel(a),
      hint: a.ref,
      group: 'Receipts',
      pick: () => openSheet('receipt', { ref: a.ref }),
    })),
    onType: paint,
    onCommit: (v) => setQuery('q', v),
  }))

  paint(term)

  const unread = visibleNotifications().filter((n) => !n.read).length
  const chip = (id: string, label: string, extra?: Node | null) =>
    h('button', { class: 'chip', ariaPressed: id === active,
      on: { click: () => setQuery('filter', id === 'all' ? '' : id) } },
      h('span', { text: label }), extra ?? null)
  const ALL = [...FILTERS.map((x) => [x.id, x.label] as const), [ALERTS, 'Notices'] as const]
  const chips = h('div', { class: 'chip-row' },
    ...FILTERS.map((x) => chip(x.id, x.label)),
    chip(ALERTS, 'Notices', unread ? h('span', { class: 'chip-count', text: String(unread) }) : null))

  // Five chips wrapped onto two rows, a search field and an order row: two
  // hundred pixels of controls before a single thing that had happened, on a
  // screen 844 tall. On a phone the five go behind one button that says which
  // one is on, and the order goes behind another beside it. The unread count
  // rides on the filter button, because a number nobody can see is a number
  // that is not doing its job.
  const here = ALL.find(([id]) => id === active)?.[1] ?? 'All'
  const pick = (title: string, ic: () => string, label: string, rows: [string, string, boolean, () => void][]) => {
    const btn = h('button', { class: 'chip', ariaLabel: title + ': ' + label },
      h('span', { class: 'ic', html: ic() }), h('span', { text: label }),
      title === 'Filter' && unread ? h('span', { class: 'chip-count', text: String(unread) }) : null)
    btn.setAttribute('aria-expanded', 'false')
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (btn.getAttribute('aria-expanded') === 'true') { closeHint(); return }
      closeHint()
      popover(btn, title, h('div', { class: 'pop-menu' },
        ...rows.map(([, text, on, run]) =>
          h('button', { class: 'pop-row' + (on ? ' on' : ''), ariaPressed: on,
            on: { click: () => { closeHint(); run() } } },
            h('span', { text }),
            on ? h('span', { class: 'ic', html: icon.check() }) : null))))
    })
    return btn
  }

  const controls = isMobile()
    ? h('div', { class: 'chip-row' },
        pick('Filter', icon.filter, here,
          ALL.map(([id, label]) => [id, label + (id === ALERTS && unread ? ` (${unread})` : ''), id === active,
            () => setQuery('filter', id === 'all' ? '' : id)] as [string, string, boolean, () => void])),
        pick('Order', icon.order, byAmount ? 'Largest' : 'Newest',
          [['date', 'Newest first', !byAmount, () => order('date')],
           ['amt', 'Largest first', byAmount, () => order('amt')]]))
    : null

  return shell(
    'history',
    pageHeader('Activity',
      // The section that used to hold the notifications said "All caught up"
      // when there was nothing left to read. The section is gone; the sentence
      // is not, because a control that quietly vanishes is not an answer to
      // "did I read them all".
      headActions(
        unread
          ? { label: 'Mark all read', ic: icon.check, run: () => actions.readAllNotifications() }
          : { label: 'All caught up', ic: icon.check, said: true },
        { label: 'Statement', ic: icon.page, run: () => go('/statement') },
        { label: 'Export', ic: icon.download, run: () => openSheet('export') })),
    isMobile()
      ? h('div', { class: 'stack-12' }, search, controls)
      : h('div', { class: 'row', style: { alignItems: 'center' } }, search, chips),
    // Ordering, beside the list it orders rather than on top of a column.
    isMobile() ? null : h('div', { class: 'chip-row' }, orderBtn('date', 'Newest'), orderBtn('amt', 'Largest')),
    list,
  )
}
