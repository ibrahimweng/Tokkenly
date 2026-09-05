import { h, link } from '../ui'
import { icon } from '../icons'
import { signed } from '../format'

export function card(...children: (Node | false | null)[]): HTMLElement {
  const el = h('section', { class: 'card' })
  for (const c of children) if (c) el.appendChild(c)
  return el
}

export function cardHead(label: string, right?: Node | null): HTMLElement {
  return h('div', { class: 'card-head' },
    h('span', { class: 't-caps subtle', text: label }), right ?? null)
}

/** A card header link names where it goes, never "see more". Rule 49. */
export function headLink(label: string, to: string): HTMLAnchorElement {
  return link(to, 'link', label)
}

export function kv(label: string, value: string | Node, cls = ''): HTMLElement {
  return h('div', { class: 'kv' },
    h('span', { text: label }),
    typeof value === 'string' ? h('span', { class: cls, text: value }) : value)
}

export function callout(text: string, kind: 'brand' | 'warning' = 'brand'): HTMLElement {
  return h('div', { class: 'callout' + (kind === 'warning' ? ' warning' : '') },
    h('span', { html: kind === 'warning' ? icon.alert() : icon.info() }),
    h('span', { text }))
}

/** Nothing to show, and a reason why. Figma 02 Components, Empty state.
 *  A list that renders as blank space reads as a bug; this reads as an answer. */
export function emptyState(
  title: string,
  body: string,
  action?: { label: string; onClick: () => void },
  glyph: 'search' | 'history' | 'alert' = 'search',
): HTMLElement {
  return h('div', { class: 'empty' },
    h('span', { class: 'mark', html: icon[glyph]() }),
    h('h3', { text: title }),
    h('p', { text: body }),
    action ? h('button', { class: 'btn btn-quiet', text: action.label, on: { click: action.onClick } }) : null)
}

/** The shape of an answer, before the answer. Figma 02 Components, Skeleton row. */
export function skeletonList(rows = 4): HTMLElement {
  const row = () => h('div', { class: 'skeleton-row' },
    h('span', { class: 'sk disc' }),
    h('span', { class: 'lines' },
      h('span', { class: 'sk', style: { width: '160px', height: '12px' } }),
      h('span', { class: 'sk', style: { width: '96px', height: '10px' } })),
    h('span', { class: 'sk', style: { width: '72px', height: '12px' } }))
  return h('div', { class: 'skeleton-list' }, ...Array.from({ length: rows }, row))
}

/** A control that is working. The label stays put so the page never jumps. */
export function busy(btn: HTMLButtonElement, on: boolean): void {
  btn.classList.toggle('is-busy', on)
}

export function filled(label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  return h('button', { class: 'btn btn-filled', disabled, on: { click: onClick } }, label)
}

export function quiet(label: string, onClick: () => void): HTMLButtonElement {
  return h('button', { class: 'btn btn-quiet', on: { click: onClick } }, label)
}

/** Money in is green and signed. Money out is neutral. One function, so the
 *  rule cannot be applied by hand and get it wrong. Rule 43. */
export function amount(n: number): HTMLElement {
  return h('span', { class: n >= 0 ? 'pos t-body-strong' : 't-body-strong', text: signed(n) })
}

export function directionMark(n: number): HTMLElement {
  return h('span', { class: 'mark', html: n >= 0 ? icon.arrowIn() : icon.arrowOut() })
}

export function meter(valuePct: number, minPct: number): HTMLElement {
  const scale = Math.max(valuePct, minPct) * 1.1
  const fill = Math.min(100, (valuePct / scale) * 100)
  const tick = Math.min(100, (minPct / scale) * 100)
  return h('div', { class: 'meter-track' },
    h('div', { class: 'meter-fill', style: { width: fill + '%' } }),
    h('div', { class: 'meter-tick', style: { left: `calc(${tick}% - 1px)` } }))
}

export function statLine(label: string, value: string, cls = ''): HTMLElement {
  return h('div', { class: 'stack-8' },
    h('span', { class: 't-caps subtle', text: label }),
    h('span', { class: 't-body-strong ' + cls, text: value }))
}
