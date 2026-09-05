import { h, link } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead } from '../components/bits'
import { DESTINATIONS, PLACE_LABEL, type Place } from '../destinations'
import { current, go } from '../router'

/** Everything the product can do, in one place. Built from the same registry
 *  the tabs and the overlay read, so a screen cannot appear here and be
 *  unreachable, or exist and be missing from the list. */
export function allScreen(): HTMLElement {
  const term = (current().query.get('q') ?? '').toLowerCase()
  const match = (label: string, also?: string) =>
    !term || (label + ' ' + (also ?? '')).toLowerCase().includes(term)

  const order: Place[] = ['home', 'wallet', 'market', 'grow', 'history', 'account']
  const groups = order
    .map((place) => [place, DESTINATIONS.filter((d) => d.place === place && match(d.label, d.also))] as const)
    .filter(([, items]) => items.length)

  const setTerm = (v: string) => go('/all' + (v ? '?q=' + encodeURIComponent(v) : ''))

  return shell('account',
    pageHeader('Everything', eyebrow('Screens', String(DESTINATIONS.length))),
    h('label', { class: 'field' },
      h('span', { html: icon.search() }),
      h('input', {
        placeholder: 'Search every screen', value: current().query.get('q') ?? '',
        on: { keydown: (e) => {
          if ((e as KeyboardEvent).key === 'Enter') setTerm((e.target as HTMLInputElement).value)
        } },
      })),
    h('p', { class: 'muted', style: { margin: '0' },
      text: 'Every place, every action and every screen inside them. Press ⌘K anywhere to jump straight to one.' }),
    h('div', { class: 'all-grid' },
      ...groups.map(([place, items]) =>
        card(
          cardHead(PLACE_LABEL[place]),
          h('div', { class: 'stack-8' },
            ...items.map((d) =>
              link(d.to, 'kv all-row',
                h('span', { class: 'two-line' },
                  h('span', { class: 't-body-strong', text: d.label }),
                  h('small', { text: d.hint ?? d.to })),
                h('span', { class: 'muted', html: icon.chevron() }))))))),
    groups.length ? null : h('p', { class: 'muted', text: 'Nothing by that name.' })
  )
}
