import { h } from '../ui'
import { icon } from '../icons'

/** Four dots and a pad. One component behind three jobs — changing the PIN,
 *  unlocking the app, and signing off a payment — because a PIN that looks
 *  different in each place is a PIN people stop recognising.
 *
 *  Two rules it exists to enforce. The digits are never echoed: a filled dot
 *  says how far you are without putting the number on a screen somebody can
 *  see over your shoulder. And it completes itself — four digits is the whole
 *  input, so asking for a Continue tap after the fourth is asking twice. */
export interface PinPad {
  el: HTMLElement
  /** Empties the dots, for a second attempt or a next step. */
  reset: () => void
  /** Shakes, clears, and puts a message under the dots. */
  reject: (message: string) => void
  value: () => string
}

export function pinPad(opts: {
  /** Called with the four digits the moment the fourth lands. */
  onFull: (pin: string) => void
  /** A line under the dots that is not an error — what this PIN is for. */
  hint?: string
}): PinPad {
  let value = ''
  const dots = h('div', { class: 'pin-dots', role: 'status', ariaLabel: 'No digits entered' })
  const note = h('span', { class: 'pin-note muted t-caption', text: opts.hint ?? '' })

  const paint = () => {
    dots.replaceChildren(...[0, 1, 2, 3].map((i) =>
      h('span', { class: 'pin-dot' + (i < value.length ? ' on' : '') })))
    dots.setAttribute('aria-label',
      value.length ? value.length + ' of four digits entered' : 'No digits entered')
  }

  const press = (d: string) => {
    if (value.length >= 4) return
    // A new digit clears the last complaint. Leaving it up while somebody is
    // retyping reads as the new attempt already having failed.
    if (note.classList.contains('bad')) {
      note.classList.remove('bad')
      note.textContent = opts.hint ?? ''
    }
    value += d
    paint()
    if (value.length === 4) {
      const full = value
      // after the fourth dot has painted, so the completion is visible
      setTimeout(() => opts.onFull(full), 120)
    }
  }
  const back = () => {
    value = value.slice(0, -1)
    paint()
  }

  const pad = h('div', { class: 'keypad pin-keypad' })
  for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
    pad.appendChild(h('button', { class: 'key', type: 'button', text: d,
      on: { click: () => press(d) } }))
  }
  pad.appendChild(h('span'))
  pad.appendChild(h('button', { class: 'key', type: 'button', text: '0',
    on: { click: () => press('0') } }))
  pad.appendChild(h('button', { class: 'key', type: 'button', html: icon.back(),
    ariaLabel: 'Delete', on: { click: back } }))

  const el = h('div', { class: 'pinpad' }, dots, note, pad)

  // Typing goes through the document, not through a focused element. A pad
  // that has to be focused first either needs a ring around it — which makes
  // four dots read as a text field — or an autofocus, which puts that ring up
  // before anybody has touched a key. Neither is right on a screen where the
  // pad is the only thing there is to do.
  //
  // Self-cleaning: this app replaces a screen wholesale rather than unmounting
  // it, so the listener drops itself the moment its pad leaves the document.
  const onKey = (e: KeyboardEvent) => {
    if (!el.isConnected) { document.removeEventListener('keydown', onKey); return }
    const t = e.target as HTMLElement | null
    // Somebody typing into a field is typing into a field.
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    if (/^\d$/.test(e.key)) { press(e.key); e.preventDefault() }
    else if (e.key === 'Backspace') { back(); e.preventDefault() }
  }
  document.addEventListener('keydown', onKey)

  paint()

  return {
    el,
    value: () => value,
    reset: () => { value = ''; paint() },
    reject: (message: string) => {
      value = ''
      paint()
      note.textContent = message
      note.classList.add('bad')
      dots.classList.remove('shake')
      // reflow, or a second failure in a row does not re-run the animation
      void dots.offsetWidth
      dots.classList.add('shake')
    },
  }
}
