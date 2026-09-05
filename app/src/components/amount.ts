import { h } from '../ui'
import { icon } from '../icons'
import { usd, parseAmount } from '../format'

export interface AmountComposer {
  el: HTMLElement
  get(): number
  set(v: number): void
  onChange(fn: (v: number) => void): void
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
  let value = opts.initial
  const subs: ((v: number) => void)[] = []

  const input = h('input', {
    type: 'text',
    inputmode: 'decimal',
    value: usd(value),
    ariaLabel: 'Amount',
  })

  const canvas = h('canvas')
  const ruler = h('div', { class: 'ruler', ariaLabel: 'Drag to change the amount' }, canvas)

  const note = h('p', { class: 'amount-note', text: opts.note ?? '' })
  const hint = h('p', { class: 'hint', text: 'Type an amount, or drag the ruler' })

  const chips = h('div', { class: 'chip-row', style: { justifyContent: 'center' } })
  for (const q of opts.quick ?? []) {
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
    value = Math.max(0, Math.min(opts.max, Math.round(v * 100) / 100))
    if (syncField) input.value = usd(value)
    draw()
    for (const fn of subs) fn(value)
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

  const el = h(
    'div',
    { class: 'stack-16' },
    h('div', { class: 'amount-wrap' }, h('div', { class: 'amount-box' }, input), note),
    ruler,
    hint,
    (opts.quick ?? []).length ? chips : h('span')
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
  }
}
