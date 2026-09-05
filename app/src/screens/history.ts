import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { amount, directionMark, emptyState } from '../components/bits'
import { table } from '../components/table'
import { state, type ActivityKind, type Activity } from '../state'
import { when } from '../format'
import { go, current, openSheet } from '../router'

const FILTERS: { id: string; label: string; kinds: ActivityKind[] | null }[] = [
  { id: 'all', label: 'All', kinds: null },
  { id: 'payments', label: 'Payments', kinds: ['payment'] },
  { id: 'trades', label: 'Trades', kinds: ['trade'] },
  { id: 'grow', label: 'Grow', kinds: ['grow'] },
]

/** History is the one place that holds everything, which is what makes every
 *  See all in the product honest. design.md 11b.4j. */
export function historyScreen(): HTMLElement {
  const r = current()
  const active = r.query.get('filter') ?? 'all'
  const term = (r.query.get('q') ?? '').toLowerCase()
  const f = FILTERS.find((x) => x.id === active) ?? FILTERS[0]

  const rows = state.activity.filter((a) => {
    if (f.kinds && !f.kinds.includes(a.kind)) return false
    if (!term) return true
    return (a.who + ' ' + a.type + ' ' + a.ref + ' ' + a.amount).toLowerCase().includes(term)
  })

  const setQuery = (k: string, v: string) => {
    const q = new URLSearchParams(r.query)
    if (v) q.set(k, v)
    else q.delete(k)
    const s = q.toString()
    go('/history' + (s ? '?' + s : ''))
  }

  // Sorting is part of the address, so an ordered view can be linked and
  // reloaded the same way a filter or a sheet can.
  const sortKey = r.query.get('sort') ?? 'date'
  const sortDir = (r.query.get('dir') ?? 'desc') as 'asc' | 'desc'
  const onSort = (key: string) => {
    const dir = key === sortKey && sortDir === 'desc' ? 'asc' : 'desc'
    const q = new URLSearchParams(r.query)
    q.set('sort', key); q.set('dir', dir)
    go('/history?' + q.toString())
  }
  const cmp: Record<string, (a: Activity, b: Activity) => number> = {
    who: (a, b) => a.who.localeCompare(b.who),
    type: (a, b) => a.type.localeCompare(b.type),
    ref: (a, b) => a.ref.localeCompare(b.ref),
    date: (a, b) => a.at.localeCompare(b.at),
    amt: (a, b) => a.amount - b.amount,
  }
  const ordered = [...rows].sort((a, b) => (cmp[sortKey] ?? cmp.date)(a, b) * (sortDir === 'asc' ? 1 : -1))

  const search = h('label', { class: 'field grow' },
    h('span', { html: icon.search() }),
    h('input', {
      placeholder: 'Search a name, a reference or an amount',
      value: r.query.get('q') ?? '',
      on: {
        keydown: (e) => {
          if ((e as KeyboardEvent).key === 'Enter') setQuery('q', (e.target as HTMLInputElement).value)
        },
      },
    }))

  const chips = h('div', { class: 'chip-row' }, ...FILTERS.map((x) =>
    h('button', { class: 'chip', text: x.label, ariaPressed: x.id === active,
      on: { click: () => setQuery('filter', x.id === 'all' ? '' : x.id) } })))

  return shell(
    'history',
    pageHeader('History',
      h('button', { class: 'btn btn-secondary btn-sm', on: { click: () => openSheet('export') } },
        h('span', { html: icon.download() }), h('span', { text: 'Export' }))),
    h('div', { class: 'row', style: { alignItems: 'center' } }, search, chips),
    ordered.length
      ? table(
          [
            { key: 'who', label: 'Who', sortable: true },
            { key: 'type', label: 'Type', optional: true, sortable: true },
            { key: 'ref', label: 'Reference', optional: true, sortable: true },
            { key: 'date', label: 'Date', optional: true, sortable: true },
            { key: 'amt', label: 'Amount', align: 'right', sortable: true },
          ],
          ordered.map((a) => [
            h('span', { class: 'who' }, directionMark(a.amount),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: a.who }),
                h('small', { class: 'phone-only', text: a.type + ' · ' + when(a.at) }))),
            h('span', { class: 'muted', text: a.type }),
            h('span', { class: 'muted', text: a.ref }),
            h('span', { class: 'muted', text: when(a.at) }),
            amount(a.amount),
          ]),
          (i) => openSheet('receipt', { ref: ordered[i].ref }),
          { current: { key: sortKey, dir: sortDir }, onSort }
        )
      : term || active !== 'all'
        ? emptyState('Nothing matches that',
            'Try a different name, reference or amount.',
            { label: 'Clear the search', onClick: () => go('/history') })
        : emptyState('Nothing here yet',
            'Money you send or receive shows up here.', undefined, 'history')
  )
}
