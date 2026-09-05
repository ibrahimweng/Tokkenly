import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { amount, directionMark, emptyState } from '../components/bits'
import { table } from '../components/table'
import { state, type ActivityKind } from '../state'
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
      h('button', { class: 'btn btn-quiet btn-sm', on: { click: () => openSheet('export') } },
        h('span', { html: icon.download() }), h('span', { text: 'Export' }))),
    h('div', { class: 'row', style: { alignItems: 'center' } }, search, chips),
    rows.length
      ? table(
          [
            { key: 'who', label: 'Who' },
            { key: 'type', label: 'Type', optional: true },
            { key: 'ref', label: 'Reference', optional: true },
            { key: 'date', label: 'Date', optional: true },
            { key: 'amt', label: 'Amount', align: 'right' },
          ],
          rows.map((a) => [
            h('span', { class: 'who' }, directionMark(a.amount),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: a.who }),
                h('small', { class: 'phone-only', text: a.type + ' · ' + when(a.at) }))),
            h('span', { class: 'muted', text: a.type }),
            h('span', { class: 'muted', text: a.ref }),
            h('span', { class: 'muted', text: when(a.at) }),
            amount(a.amount),
          ]),
          (i) => openSheet('receipt', { ref: rows[i].ref })
        )
      : term || active !== 'all'
        ? emptyState('Nothing matches that',
            'Try a different name, reference or amount.',
            { label: 'Clear the search', onClick: () => go('/history') })
        : emptyState('Nothing here yet',
            'Money you send or receive shows up here.', undefined, 'history')
  )
}
