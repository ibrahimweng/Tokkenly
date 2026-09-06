import { h } from '../ui'
import { icon } from '../icons'
import { say } from '../announce'

/** One search field for the whole product.
 *
 *  There were five of them and they behaved the same way: nothing happened
 *  until you pressed Enter, and then the page reloaded around a query
 *  parameter. Between the first keystroke and that press the product said
 *  nothing at all — no narrowing, no count, no suggestion, no sign it had
 *  noticed. The palette behind ⌘K had done this properly since it was written;
 *  the five fields people actually land on had not.
 *
 *  Two things happen as you type. The list under the field narrows, because
 *  that list is the answer and watching it shrink is the fastest way to know
 *  the search is working. And a panel offers the closest matches — including
 *  things that are not in the list at all, which is the case the narrowing
 *  cannot serve: a company you do not hold, a screen, a person you have not
 *  paid yet.
 *
 *  The address is still the record. Typing does not touch it — a query
 *  parameter per keystroke is a history nobody can go back through, and this
 *  app rebuilds its whole tree on a route change, which would take the focus
 *  out of the field you are typing in. Enter commits. */

export interface Suggestion {
  label: string
  /** Under the label. For a row whose match is not in its own name — a help
   *  question found by a word in its answer looks like a wrong answer until
   *  the answer is on the row too. */
  sub?: string
  /** What it is, on the right of the row. */
  hint?: string
  /** The group it belongs to, shown as a rung above the first of its kind. */
  group?: string
  /** Taking it. Returning nothing leaves the panel open. */
  pick: () => void
}

export interface SearchSpec {
  placeholder: string
  /** What the address already holds, so a link into a search still works. */
  value?: string
  ariaLabel?: string
  /** The closest things to what has been typed. Empty query means no panel:
   *  a list of suggestions before anybody has typed is a menu, not a search. */
  suggest: (term: string) => Suggestion[]
  /** Narrow whatever is under the field. Called on every keystroke. */
  onType: (term: string) => void
  /** Enter with nothing chosen. Usually commits the term to the address. */
  onCommit?: (term: string) => void
}

const MAX = 7

export function searchField(spec: SearchSpec): HTMLElement {
  const input = h('input', {
    type: 'search', placeholder: spec.placeholder, value: spec.value ?? '',
    ariaLabel: spec.ariaLabel ?? spec.placeholder,
  })
  // A combobox, so a screen reader is told there is a list and which row of it
  // is current. Without these the panel is a div nobody is told about.
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-expanded', 'false')
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('autocomplete', 'off')

  const panel = h('div', { class: 'suggest', role: 'listbox' })
  panel.hidden = true
  const id = 'sg-' + Math.random().toString(36).slice(2, 8)
  panel.id = id
  input.setAttribute('aria-controls', id)

  let shown: Suggestion[] = []
  let on = -1

  const paintCursor = (): void => {
    ;[...panel.querySelectorAll<HTMLElement>('.suggest-row')].forEach((row, i) => {
      const is = i === on
      row.classList.toggle('on', is)
      row.setAttribute('aria-selected', String(is))
      if (is) {
        input.setAttribute('aria-activedescendant', row.id)
        row.scrollIntoView({ block: 'nearest' })
      }
    })
    if (on < 0) input.removeAttribute('aria-activedescendant')
  }

  const close = (): void => {
    panel.hidden = true
    // Emptied, not just hidden. aria-controls points at this element, and a
    // hidden list still holding the answers to the last query is a list a
    // screen reader can be walked into.
    panel.replaceChildren()
    shown = []
    on = -1
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
  }

  const open = (term: string): void => {
    shown = term.trim() ? spec.suggest(term).slice(0, MAX) : []
    on = -1
    if (!shown.length) return close()
    panel.replaceChildren()
    let group = ''
    shown.forEach((s, i) => {
      if (s.group && s.group !== group) {
        group = s.group
        panel.appendChild(h('div', { class: 't-caps subtle suggest-group', text: group }))
      }
      const row = h('button', { class: 'suggest-row', role: 'option', type: 'button' },
        s.sub
          ? h('span', { class: 'two-line grow' },
              h('span', { text: s.label }), h('small', { text: s.sub }))
          : h('span', { class: 'grow', text: s.label }),
        s.hint ? h('span', { class: 'muted suggest-hint', text: s.hint }) : null)
      row.id = id + '-' + i
      // mousedown, not click: the input's blur fires first and would close the
      // panel out from under the press.
      row.addEventListener('mousedown', (e) => { e.preventDefault(); close(); s.pick() })
      panel.appendChild(row)
    })
    panel.hidden = false
    input.setAttribute('aria-expanded', 'true')
    paintCursor()
  }

  input.addEventListener('input', () => {
    const term = input.value
    spec.onType(term)
    open(term)
  })

  input.addEventListener('keydown', (e) => {
    const k = e.key
    if (k === 'Escape') {
      if (!panel.hidden) { e.preventDefault(); close(); return }
      if (input.value) { input.value = ''; spec.onType(''); close() }
      return
    }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      if (panel.hidden) return
      e.preventDefault()
      on = k === 'ArrowDown'
        ? (on + 1) % shown.length
        : (on <= 0 ? shown.length - 1 : on - 1)
      paintCursor()
      return
    }
    if (k === 'Enter') {
      e.preventDefault()
      if (on >= 0 && shown[on]) { const s = shown[on]; close(); s.pick(); return }
      close()
      spec.onCommit?.(input.value)
    }
  })

  // A pointer leaving the field is not a decision, so the panel waits a beat
  // for a press that may be on its way to one of its own rows.
  input.addEventListener('blur', () => setTimeout(close, 120))
  input.addEventListener('focus', () => { if (input.value) open(input.value) })

  return h('div', { class: 'search' },
    h('label', { class: 'field' }, h('span', { html: icon.search() }), input),
    panel)
}

/** What a narrowed list says when it has narrowed to nothing, or to near
 *  misses only. Both are answers; an empty space is not. */
export function searchNote(term: string, found: number, near: boolean): HTMLElement | null {
  if (!term.trim()) return null
  const text = found === 0
    ? `Nothing matches “${term.trim()}”.`
    : near
      ? `Nothing matches “${term.trim()}” exactly. The closest ${found === 1 ? 'is' : 'are'} below.`
      : `${found} ${found === 1 ? 'match' : 'matches'} for “${term.trim()}”.`
  // Said as well as shown: the list changing under a field is invisible to
  // somebody who cannot see it.
  say(text)
  return h('p', { class: 'search-note muted t-caption', role: 'status', text })
}
