import { h, link } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead } from '../components/bits'
import { SCREENS, PLACE_LABEL, type Place, type Destination } from '../destinations'
import { searchField, searchNote } from '../components/search'
import { rank, onlyNear } from '../match'
import { current, go } from '../router'

/** Everything the product can do, in one place. Built from the same registry
 *  the tabs and the overlay read, so a screen cannot appear here and be
 *  unreachable, or exist and be missing from the list. */
export function allScreen(): HTMLElement {
  const term = current().query.get('q') ?? ''
  const FIELDS = (d: Destination) => [d.label, d.also, d.hint, PLACE_LABEL[d.place]]
  const order: Place[] = ['home', 'wallet', 'market', 'grow', 'spend', 'history', 'account']

  const setTerm = (v: string) => go('/all' + (v ? '?q=' + encodeURIComponent(v) : ''))

  // The grid narrows as you type; the address is only touched on Enter,
  // because a route change rebuilds the tree and takes the focus with it.
  const grid = h('div', { class: 'all-grid' })
  const note = h('div')
  const paint = (t: string): void => {
    const found = t.trim() ? rank(t, SCREENS, FIELDS) : SCREENS
    const groups = order
      .map((place) => [place, found.filter((d) => d.place === place)] as const)
      .filter(([, items]) => items.length)
    note.replaceChildren(searchNote(t, found.length, onlyNear(t, found, FIELDS)) ?? h('span', { hidden: true }))
    grid.replaceChildren(...groups.map(([place, items]) =>
      card(
        cardHead(PLACE_LABEL[place]),
        h('div', { class: 'stack-8' },
          ...items.map((d) =>
            link(d.to, 'kv all-row',
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: d.label }),
                h('small', { text: d.hint ?? d.to })),
              h('span', { class: 'muted', html: icon.chevron() })))))))
  }
  paint(term)

  return shell('account',
    pageHeader('Everything', eyebrow('Screens', String(SCREENS.length))),
    searchField({
      placeholder: 'Search every screen',
      value: term,
      suggest: (t) => rank(t, SCREENS, FIELDS).slice(0, 7).map((d) => ({
        label: d.label, hint: d.hint, group: PLACE_LABEL[d.place], pick: () => go(d.to),
      })),
      onType: paint,
      onCommit: setTerm,
    }),
    h('p', { class: 'muted', style: { margin: '0' },
      text: 'Every place, every action and every screen inside them. Press ⌘K anywhere to jump straight to one.' }),
    note,
    grid,
  )
}
