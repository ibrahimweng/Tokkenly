import { h, append } from '../ui'
import { icon } from '../icons'
import { closeSheet } from '../router'

/** One sheet shape for the whole product: 480 wide, radius 28, a head with a
 *  close, then whatever the flow needs. design.md 11b.4e. */
export function sheet(title: string, ...body: (Node | false | null)[]): HTMLElement {
  const panel = h('div', { class: 'sheet' })
  panel.appendChild(
    h(
      'div',
      { class: 'sheet-head' },
      h('h2', { text: title }),
      h('button', { class: 'close', ariaLabel: 'Close', html: icon.close(), on: { click: closeSheet } })
    )
  )
  append(panel, body)

  const scrim = h('div', {
    class: 'scrim',
    on: {
      click: (e) => {
        if (e.target === scrim) closeSheet()
      },
    },
  }, panel)

  // Escape closes, and the listener retires with the sheet it belongs to.
  const onKey = (e: KeyboardEvent) => {
    if (!scrim.isConnected) {
      removeEventListener('keydown', onKey)
      return
    }
    if (e.key === 'Escape') closeSheet()
  }
  addEventListener('keydown', onKey)
  return scrim
}

/** A dialog over a screen, addressed by its own path rather than ?sheet=.
 *  Send and Receive work this way: Figma draws them as D09 and D12, a modal
 *  over the wallet, not as screens of their own. Closing goes somewhere real
 *  because there is no sheet parameter to drop. */
export function modalOver(
  base: HTMLElement,
  title: string,
  onClose: () => void,
  ...body: (Node | false | null)[]
): HTMLElement {
  const panel = h('div', { class: 'sheet' },
    h('div', { class: 'sheet-head' },
      h('h2', { text: title }),
      h('button', { class: 'close', ariaLabel: 'Close', html: icon.close(), on: { click: onClose } })))
  append(panel, body)
  const scrim = h('div', {
    class: 'scrim',
    on: { click: (e) => { if (e.target === scrim) onClose() } },
  }, panel)
  const onKey = (e: KeyboardEvent) => {
    if (!scrim.isConnected) { removeEventListener('keydown', onKey); return }
    if (e.key === 'Escape') onClose()
  }
  addEventListener('keydown', onKey)
  base.appendChild(scrim)
  return base
}

export function figure(label: string, value: string, cls = ''): HTMLElement {
  return h('div', { class: 'figure' },
    h('span', { class: 't-caps subtle', text: label }),
    h('span', { class: 't-display-xl ' + cls, text: value }))
}

export function panel(...rows: [string, string][]): HTMLElement {
  const p = h('div', { class: 'panel' })
  for (const [label, value] of rows) {
    p.appendChild(h('div', { class: 'cell' },
      h('span', { class: 't-caps subtle', text: label }),
      h('span', { class: 't-body-strong', text: value })))
  }
  return p
}

/** The outcome sheet: a tick, what happened, the record, and a way on. */
export function outcome(
  title: string,
  line: string,
  rows: [string, string][],
  primary: { label: string; onClick: () => void },
  secondary?: { label: string; onClick: () => void }
): HTMLElement {
  return sheet(
    '',
    h('div', { class: 'tick', html: icon.check() }),
    h('div', { class: 'figure' },
      h('span', { class: 't-title', text: title }),
      h('span', { class: 'muted', text: line })),
    panel(...rows),
    h('button', { class: 'btn btn-primary', text: primary.label, on: { click: primary.onClick } }),
    secondary
      ? h('button', { class: 'btn btn-secondary', text: secondary.label, on: { click: secondary.onClick } })
      : null
  )
}

let toastRail: HTMLElement | null = null
export function toast(message: string, tone: 'info' | 'success' | 'error' = 'info'): void {
  if (!toastRail) {
    toastRail = h('div', { class: 'toast-rail' })
    document.body.appendChild(toastRail)
  }
  const t = h('div', { class: 'toast' + (tone === 'info' ? '' : ' ' + tone), text: message })
  toastRail.appendChild(t)
  setTimeout(() => t.remove(), 2600)
}
