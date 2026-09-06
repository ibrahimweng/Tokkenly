import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { amount, directionMark, emptyState } from '../components/bits'
import { searchField, searchNote } from '../components/search'
import { rank, onlyNear } from '../match'
import { table } from '../components/table'
import { state, type ActivityKind, type Activity } from '../state'
import { when, usd, activityLabel } from '../format'
import { go, current, openSheet } from '../router'
import { isMobile } from '../responsive'

const FILTERS: { id: string; label: string; kinds: ActivityKind[] | null }[] = [
  { id: 'all', label: 'All', kinds: null },
  { id: 'payments', label: 'Payments', kinds: ['payment'] },
  { id: 'trades', label: 'Trades', kinds: ['trade'] },
  { id: 'grow', label: 'Grow', kinds: ['grow'] },
]

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
  const paint = (t: string): void => {
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
    placeholder: isMobile() ? 'Name, reference or amount' : 'Search a name, a reference or an amount',
    value: r.query.get('q') ?? '',
    // Straight to the receipt. A reference is a thing somebody has read off a
    // statement and wants to see, not a thing they want a filtered list of.
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

  const chips = h('div', { class: 'chip-row' }, ...FILTERS.map((x) =>
    h('button', { class: 'chip', text: x.label, ariaPressed: x.id === active,
      on: { click: () => setQuery('filter', x.id === 'all' ? '' : x.id) } })))

  return shell(
    'history',
    pageHeader('Activity',
      h('button', { class: 'btn btn-secondary btn-sm', on: { click: () => openSheet('export') } },
        h('span', { html: icon.download() }), h('span', { text: 'Export' }))),
    h('div', { class: 'row', style: { alignItems: 'center' } }, search, chips),
    list,
  )
}
