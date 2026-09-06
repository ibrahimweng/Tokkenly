import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { amount, card, cardHead, directionMark, emptyState } from '../components/bits'
import { searchField, searchNote } from '../components/search'
import { rank, onlyNear } from '../match'
import { table } from '../components/table'
import { state, actions, visibleNotifications, type ActivityKind, type Activity, type Notif } from '../state'
import { when, usd, activityLabel } from '../format'
import { go, current, openSheet } from '../router'
import { isMobile } from '../responsive'

const FILTERS: { id: string; label: string; kinds: ActivityKind[] | null }[] = [
  { id: 'all', label: 'All', kinds: null },
  { id: 'payments', label: 'Payments', kinds: ['payment'] },
  { id: 'trades', label: 'Trades', kinds: ['trade'] },
  { id: 'grow', label: 'Grow', kinds: ['grow'] },
]

/* ---------------------------------------------------------------------------
   Notifications, as a place rather than a panel.

   They were a modal over whatever screen the bell happened to be on: five
   announcements floating above a page, dismissed by the same gesture that
   dismisses a payment you are halfway through, and reachable from exactly one
   header. They are the told-you layer over the events this screen already
   holds, so they belong here.

   Beside the money, not mixed into it. A notification has no amount and no
   reference; putting it in the table would mean two empty columns and a sort
   by amount that cannot order it. It is a section of its own, behind its own
   chip, with the unread count on the chip where the bell used to carry it.
   --------------------------------------------------------------------------- */

const ALERTS = 'alerts'
const GLYPH: Record<Notif['kind'], () => string> = {
  money: icon.wallet, trade: icon.market, grow: icon.grow, security: icon.lock,
}

/** One announcement, and the thing it is about. A row that greys out and does
 *  nothing else is a dead end: the receipt is what somebody opening "Adaeze
 *  paid you $120" actually wants, and it is one press away. */
function alertRow(n: Notif): HTMLElement {
  const onward = n.ref
    ? () => openSheet('receipt', { ref: n.ref! })
    : n.to ? () => go(n.to!) : null
  return h('button', {
    class: 'set-row alert' + (n.read ? ' read' : ''),
    on: { click: () => { actions.readNotification(n.id); onward?.() } },
  },
    h('span', { class: 'who' },
      h('span', { class: 'mark', html: GLYPH[n.kind]() }),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: n.title }),
        h('small', { text: n.body }))),
    h('span', { class: 'muted t-caption nowrap', text: when(n.at) }),
    onward ? h('span', { class: 'muted set-chev', html: icon.chevron() }) : null)
}

function alertsSection(rows: Notif[], term: string): HTMLElement {
  const unread = visibleNotifications().filter((n) => !n.read).length
  return card(
    // The section's name is its name; how many are unread is state, and state
    // belongs beside the button that changes it, not in the heading.
    cardHead('Notifications',
      h('span', { class: 'head-state' },
        h('span', { class: 'muted t-caption', text: unread ? unread + ' unread' : 'All caught up' }),
        unread
          ? h('button', { class: 'link', text: 'Mark all read',
              on: { click: () => actions.readAllNotifications() } })
          : null)),
    searchNote(term, rows.length, onlyNear(term, rows, (n) => [n.title, n.body])),
    rows.length
      ? h('div', { class: 'alert-list' }, ...rows.map(alertRow))
      : term.trim()
        ? emptyState('Nothing matches that', 'Try a different word.',
            { label: 'Clear the search', onClick: () => go('/activity?filter=' + ALERTS) })
        : emptyState('Nothing yet', 'Payments, orders and sign ins show up here.',
            undefined, 'history'))
}

/** The list itself, lifted out so the search can repaint it without
 *  rebuilding the page around the field being typed into. */
function tableOf(rows: Activity[],
                 sort: { key: string; dir: 'asc' | 'desc'; onSort: (k: string) => void }): HTMLElement {
  return table(
      [
        { key: 'who', label: 'Who', sortable: true },
        { key: 'type', label: 'Type', optional: true, sortable: true },
        { key: 'ref', label: 'Reference', optional: true, sortable: true },
        { key: 'date', label: 'Date', optional: true, sortable: true },
        { key: 'amt', label: 'Amount', align: 'right', sortable: true },
      ],
      rows.map((a) => [
        h('span', { class: 'who' }, directionMark(a.amount),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: a.who }),
            h('small', { class: 'phone-only', text: a.type + ' · ' + when(a.at) }))),
        h('span', { class: 'muted', text: a.type }),
        h('span', { class: 'muted', text: a.ref }),
        h('span', { class: 'muted', text: when(a.at) }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref }),
      { current: { key: sort.key, dir: sort.dir }, onSort: sort.onSort }
    )
}

/** History is the one place that holds everything, which is what makes every
 *  See all in the product honest. design.md 11b.4j. */
export function historyScreen(): HTMLElement {
  const r = current()
  const active = r.query.get('filter') ?? 'all'
  const term = (r.query.get('q') ?? '').toLowerCase()
  const f = FILTERS.find((x) => x.id === active) ?? FILTERS[0]
  const onAlerts = active === ALERTS

  // What a row can be found by: who it was with, what it was, its reference,
  // and the figure — typed either way round, "45" or "$45.00".
  const FIELDS = (a: Activity) => [a.who, a.type, a.ref, String(Math.abs(a.amount)), usd(Math.abs(a.amount))]
  const within = state.activity.filter((a) => !f.kinds || f.kinds.includes(a.kind))
  const rowsFor = (t: string): Activity[] => (t.trim() ? rank(t, within, FIELDS) : within)

  const setQuery = (k: string, v: string) => {
    const q = new URLSearchParams(r.query)
    if (v) q.set(k, v)
    else q.delete(k)
    const s = q.toString()
    go('/activity' + (s ? '?' + s : ''))
  }

  // Sorting is part of the address, so an ordered view can be linked and
  // reloaded the same way a filter or a sheet can.
  const sortKey = r.query.get('sort') ?? 'date'
  const sortDir = (r.query.get('dir') ?? 'desc') as 'asc' | 'desc'
  const onSort = (key: string) => {
    const dir = key === sortKey && sortDir === 'desc' ? 'asc' : 'desc'
    const q = new URLSearchParams(r.query)
    q.set('sort', key); q.set('dir', dir)
    go('/activity?' + q.toString())
  }
  const cmp: Record<string, (a: Activity, b: Activity) => number> = {
    who: (a, b) => a.who.localeCompare(b.who),
    type: (a, b) => a.type.localeCompare(b.type),
    ref: (a, b) => a.ref.localeCompare(b.ref),
    date: (a, b) => a.at.localeCompare(b.at),
    amt: (a, b) => a.amount - b.amount,
  }

  // The list repaints itself as you type. The address is only touched on
  // Enter: a route change rebuilds the whole tree, which takes the focus out
  // of the field being typed into.
  const list = h('div', { class: 'stack' })
  const NFIELDS = (n: Notif) => [n.title, n.body]
  const paint = (t: string): void => {
    if (onAlerts) {
      const all = visibleNotifications()
      list.replaceChildren(alertsSection(t.trim() ? rank(t, all, NFIELDS) : all, t))
      return
    }
    const rows = rowsFor(t)
    const ordered = [...rows].sort((a, b) => (cmp[sortKey] ?? cmp.date)(a, b) * (sortDir === 'asc' ? 1 : -1))
    list.replaceChildren(
      searchNote(t, rows.length, onlyNear(t, rows, FIELDS)) ?? h('span', { hidden: true }),
      ordered.length ? tableOf(ordered, { key: sortKey, dir: sortDir, onSort })
        : t.trim() || active !== 'all'
          ? emptyState('Nothing matches that',
              'Try a different name, reference or amount.',
              { label: 'Clear the search', onClick: () => go('/activity') })
          : emptyState('Nothing here yet',
              'Money you send or receive shows up here.', undefined, 'history'))
  }

  const search = h('div', { class: 'grow' }, searchField({
    // A placeholder that does not fit is a sentence cut off mid-word: at 360
    // this read "Search a name, a reference or an a". The short form says the
    // same three things.
    placeholder: onAlerts
      ? 'Search your notifications'
      : isMobile() ? 'Name, reference or amount' : 'Search a name, a reference or an amount',
    value: r.query.get('q') ?? '',
    // Straight to the receipt. A reference is a thing somebody has read off a
    // statement and wants to see, not a thing they want a filtered list of.
    suggest: (t) => onAlerts
      ? rank(t, visibleNotifications(), NFIELDS).slice(0, 7).map((n) => ({
          label: n.title,
          sub: n.body,
          group: 'Notifications',
          pick: () => { actions.readNotification(n.id); if (n.ref) openSheet('receipt', { ref: n.ref }) },
        }))
      : rank(t, state.activity, FIELDS).slice(0, 7).map((a) => ({
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
  const chips = h('div', { class: 'chip-row' },
    ...FILTERS.map((x) => chip(x.id, x.label)),
    // The count the bell used to carry, on the thing that now opens them.
    chip(ALERTS, 'Notifications', unread ? h('span', { class: 'chip-count', text: String(unread) }) : null))

  return shell(
    'history',
    pageHeader('Activity',
      // Export is a statement of money moved, which is not what this section
      // holds. It stands down rather than exporting something it cannot.
      onAlerts ? null
        : h('button', { class: 'btn btn-secondary btn-sm', on: { click: () => openSheet('export') } },
            h('span', { html: icon.download() }), h('span', { text: 'Export' }))),
    h('div', { class: 'row', style: { alignItems: 'center' } }, search, chips),
    list,
  )
}
