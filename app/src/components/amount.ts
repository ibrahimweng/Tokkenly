import { h } from '../ui'
import { icon } from '../icons'
import { usd, parseAmount } from '../format'
import { isMobile } from '../responsive'

export interface AmountComposer {
  el: HTMLElement
  get(): number
  set(v: number): void
  /** `capped` is true when the figure asked for was more than the maximum.
   *  Clamping without saying so leaves a field reading 999,999 next to a
   *  button offering 2,480, and no explanation of which one is real. */
  onChange(fn: (v: number, capped: boolean) => void): void
  /** What Enter in the field does. A composer is built before the button it
   *  belongs to, so the action arrives afterwards. */
  onSubmit(fn: () => void): void
}

/** The phone enters an amount with a keypad, the way the Figma screens do.
 *  Digits are read as cents so the decimal point never has to be typed. */
export function keypad(comp: AmountComposer): HTMLElement {
  const press = (d: string) => {
    const cents = Math.round(comp.get() * 100).toString()
    const next = cents === '0' ? d : cents + d
    comp.set(Number(next.slice(0, 9)) / 100)
  }
  const back = () => {
    const cents = Math.round(comp.get() * 100).toString()
    comp.set(Number(cents.slice(0, -1) || '0') / 100)
  }
  const pad = h('div', { class: 'keypad' })
  for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
    pad.appendChild(h('button', { class: 'key', text: d, on: { click: () => press(d) } }))
  }
  pad.appendChild(h('span'))
  pad.appendChild(h('button', { class: 'key', text: '0', on: { click: () => press('0') } }))
  pad.appendChild(h('button', { class: 'key', html: icon.back(), ariaLabel: 'Delete', on: { click: back } }))
  return pad
}

/** Rule 47: anything you can drag must also be typeable, and the two never
 *  disagree. The ruler writes into the field; the field redraws the ruler. */
export function amountComposer(opts: {
  initial: number
  max: number
  note?: string
  quick?: { label: string; value: number }[]
}): AmountComposer {
  // The composer never holds a figure above its own ceiling, not even the one
  // it was handed. A screen that asks to open at more than the account can
  // move gets the ceiling, and the caller is told to say why.
  let value = Math.min(opts.max, Math.max(0, opts.initial))
  const subs: ((v: number, capped: boolean) => void)[] = []
  /* What Enter does, once the caller has one. Held rather than passed in,
     because the composer is built before the button it belongs to. */
  let submit: (() => void) | undefined

  const input = h('input', {
    type: 'text',
    inputmode: 'decimal',
    value: usd(value),
    ariaLabel: 'Amount',
  })

  /* Enter is the action. The keyboard route to the button that spends money
   * was eighteen stops, and the last five of them were this field and the four
   * quick amounts sitting between it and the button — which is the shape of
   * every form: you type the number, and then you are done. The skip link
   * answers the nine before this screen; this answers the five inside it. */
  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key !== 'Enter') return
    e.preventDefault()
    commit(parseAmount(input.value), false)
    submit?.()
  })

  const canvas = h('canvas')
  const ruler = h('div', { class: 'ruler', ariaLabel: 'Drag to change the amount' }, canvas)

  const note = h('p', { class: 'amount-note', text: opts.note ?? '' })
  // What a drag is for, and what it can reach. "Type an amount, or drag the
  // ruler" named the control without saying what it did or where it stopped,
  // which is most of why the ruler read as texture.
  const hint = h('p', { class: 'ruler-note',
    text: `Drag to adjust, or type. Up to ${usd(opts.max)}.` })

  /* Amounts a screen proposes, filtered by what this composer can actually
   * take. Borrow offered $500, $1,000, $1,480 and Max against a $250 ceiling:
   * four presses, one answer, and two of the four were the same number before
   * the clamp even ran. A row of choices where every choice gives the same
   * result is not a row of choices.
   *
   * A screen proposes, because it knows what a sensible amount of its own
   * thing looks like. The ceiling disposes, because only the composer knows
   * what the account may move today. Where nothing proposed survives, the
   * ceiling proposes for itself rather than leaving an empty row — quarters of
   * what is left, rounded to something a person would say out loud. */
  // Down, never up: a proposed half that is more than half is a chip that lies
  // about itself, and a proposal that rounds up towards a ceiling is a chip
  // that gets clamped.
  const step = (n: number): number => {
    if (n >= 1000) return Math.floor(n / 50) * 50
    if (n >= 100) return Math.floor(n / 10) * 10
    return Math.floor(n / 5) * 5
  }
  function usableQuick(): { label: string; value: number }[] {
    const already = new Set<number>()
    const keep = (opts.quick ?? []).filter((q) => {
      if (q.value > opts.max + 0.005 || q.value <= 0) return false
      const cents = Math.round(q.value * 100)
      if (already.has(cents)) return false
      already.add(cents)
      return true
    })
    // Three or it is not a row. Below that the ceiling proposes the whole
    // ladder rather than the screen's leftovers being topped up with it —
    // $50 beside $60 is two chips saying the same thing, and a row of
    // shortcuts that reads as arbitrary is worse than three that read as a
    // scale of what is left.
    if (keep.length >= 3) return keep
    const half = step(opts.max / 2), quarter = step(opts.max / 4)
    return [
      ...(quarter > 0 ? [{ label: usd(quarter, false), value: quarter }] : []),
      ...(half > quarter ? [{ label: usd(half, false), value: half }] : []),
      ...(opts.max > half ? [{ label: 'Max', value: opts.max }] : []),
    ]
  }

  const chips = h('div', { class: 'chip-row', style: { justifyContent: 'center' } })
  for (const q of usableQuick()) {
    chips.appendChild(
      h('button', {
        class: 'chip',
        text: q.label,
        on: { click: () => commit(q.value, true) },
      })
    )
  }

  function draw(): void {
    const dpr = devicePixelRatio || 1
    const w = ruler.clientWidth || 408
    const hgt = 72
    canvas.width = w * dpr
    canvas.height = hgt * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, hgt)
    const css = getComputedStyle(document.documentElement)
    const subtle = css.getPropertyValue('--subtle').trim() || '#65656c'
    const ink = css.getPropertyValue('--ink').trim() || '#dcdce0'

    // Ticks are a fixed pitch; the value slides the field under the needle.
    const pitch = 6
    const centre = w / 2
    const perPx = opts.max / (w * 1.6)
    const offset = (value / perPx) % pitch
    for (let x = -pitch; x < w + pitch; x += pitch) {
      const px = x - offset
      const idx = Math.round((px - centre) / pitch)
      const major = idx % 5 === 0
      const dist = Math.abs(px - centre) / centre
      ctx.globalAlpha = Math.max(0.12, 1 - dist * 1.15)
      ctx.fillStyle = subtle
      const th = major ? 26 : 16
      ctx.fillRect(px, (hgt - th) / 2, 1, th)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = ink
    ctx.fillRect(centre - 1, 8, 2, hgt - 16)
  }

  function commit(v: number, syncField: boolean): void {
    const asked = Math.max(0, Math.round(v * 100) / 100)
    value = Math.min(opts.max, asked)
    if (syncField) input.value = usd(value)
    draw()
    for (const fn of subs) fn(value, asked > opts.max)
  }

  input.addEventListener('input', () => commit(parseAmount(input.value), false))
  input.addEventListener('blur', () => (input.value = usd(value)))
  input.addEventListener('focus', () => input.select())

  let dragging = false
  let lastX = 0
  const perPxValue = () => opts.max / ((ruler.clientWidth || 408) * 1.6)
  ruler.addEventListener('pointerdown', (e) => {
    dragging = true
    lastX = e.clientX
    ruler.setPointerCapture(e.pointerId)
  })
  ruler.addEventListener('pointermove', (e) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    lastX = e.clientX
    commit(value - dx * perPxValue(), true)
  })
  const stop = () => (dragging = false)
  ruler.addEventListener('pointerup', stop)
  ruler.addEventListener('pointercancel', stop)

  // Four ways to enter one number — a field, a ruler, quick chips and, on the
  // phone, a keypad — is not generosity, it is indecision, and it was pushing
  // the confirm button off the bottom of the sheet. The phone has the keypad
  // and the chips, which are the two a thumb wants; the ruler is 44px of
  // unlabelled line between the amount and the chips and it goes. The desktop
  // keeps it, because there it is the only way to move the figure without
  // typing, and it now says what it reaches.
  const phone = isMobile()
  const el = h(
    'div',
    { class: 'stack-16' },
    h('div', { class: 'amount-wrap' }, h('div', { class: 'amount-box' }, input), note),
    phone ? null : ruler,
    phone ? null : hint,
    chips.children.length ? chips : h('span')
  )

  queueMicrotask(draw)
  addEventListener('resize', draw)

  return {
    el,
    get: () => value,
    set: (v) => commit(v, true),
    onChange: (fn) => {
      subs.push(fn)
    },
    onSubmit: (fn) => {
      submit = fn
    },
  }
}
