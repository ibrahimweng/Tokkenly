import { h } from '../ui'
import { usd, pct } from '../format'

/** One chart, used everywhere the product draws a value over time. It was two
 *  near-copies before — a comb of fixed 5px bars on Home and another on the
 *  stock page — neither of which said what any bar was worth, and both of
 *  which ran off the side of a phone.
 *
 *  What it now does that the comb did not:
 *    · a value axis, so a bar is a number rather than a height
 *    · gridlines behind the bars, recessive, on the same nice steps
 *    · a bar count that follows the width, so the marks stay legible from a
 *      390 phone to a 1440 desktop instead of being cut off or crushed
 *    · a hover that names the point and what it was worth
 *    · a change figure derived from the series it draws, not stated beside it
 */

export interface Range {
  key: string
  /** How far back the range reaches, in days. The axis and the tooltip both
   *  read real dates off this, so a label under a bar is when that bar was. */
  days: number
  /** What the value did over the range, as a percentage. */
  pct: number
  /** How much the line wanders on the way, as a share of the whole move. */
  vol: number
  /** How a point in this range names itself: a time, a day, or a month. */
  fmt: (d: Date) => string
  /** What the caption calls it: "over 1Y", "all time". */
  over?: string
}

export interface ChartSpec {
  ranges: Range[]
  initial: string
  /** Where the series ends: the value the rest of the screen already shows. */
  endValue: number
  height?: number
  seed?: number
  title?: string
}

/* ---------------------------------------------------------------- series --
   Seeded, so a range always draws the same shape and a figure someone comes
   back to has not moved on its own (design.md rule 43). The ends are pinned:
   the series starts at exactly what the range's change implies and finishes
   at exactly the value on screen, so the caption is read off the data rather
   than asserted beside it. */
export function seriesFor(r: Range, endValue: number, n: number, seed = 7): number[] {
  const start = endValue / (1 + r.pct / 100)
  const span = endValue - start
  let s = seed + r.key.length * 31 + Math.round(Math.abs(r.pct) * 7)
  const rand = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 1 : i / (n - 1)
    // the wander is damped at both ends so the pinned values are not a jump
    const ease = Math.sin(t * Math.PI)
    out.push(start + span * t + (rand() - 0.5) * Math.abs(span || endValue * 0.04) * r.vol * 4 * ease)
  }
  out[0] = start
  out[n - 1] = endValue
  return out
}

/** Where a point sits in real time: t of 0 is the far end of the range, t of
 *  1 is now. Both the axis and the tooltip read dates from here, so they can
 *  never drift apart. */
function dateAt(r: Range, t: number): Date {
  return new Date(Date.now() - r.days * 864e5 * (1 - t))
}

/** Axis steps a person would have chosen: 1, 2 or 5 times a power of ten. */
function niceTicks(lo: number, hi: number, want = 4): number[] {
  if (!(hi > lo)) return [lo]
  const raw = (hi - lo) / want
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const first = Math.ceil(lo / step) * step
  const out: number[] = []
  for (let v = first; v <= hi + step * 0.01; v += step) out.push(v)
  return out
}

/** $12.5K rather than $12,480.60: an axis label is a landmark, not a figure.
 *  The decimals come from the gap between labels, not from the size of the
 *  number — over a day a $16,000 portfolio moves $50, and three labels all
 *  reading "$16.1K" is an axis that has stopped saying anything. */
export function compact(n: number, step = Math.abs(n) || 1): string {
  const a = Math.abs(n)
  const [div, suffix] = a >= 1e9 ? [1e9, 'B'] : a >= 1e6 ? [1e6, 'M'] : a >= 1e3 ? [1e3, 'K'] : [1, '']
  if (!suffix) return usd(n, false)
  const dp = Math.max(0, Math.min(2, Math.ceil(-Math.log10(step / div))))
  return '$' + (n / div).toFixed(dp) + suffix
}

/** Bars are only readable down to a certain width, and only interesting above
 *  a certain count. Between those, the space decides how many there are — and
 *  the gaps are part of the space: n bars carry n-1 gaps, so counting them as
 *  free width overfills the row and the bars collapse to nothing. */
const MIN_BAR = 5
const GAP = 2
const MIN_BARS = 12
const MAX_BARS = 90
const fitBars = (w: number) =>
  Math.max(MIN_BARS, Math.min(MAX_BARS, Math.floor((w + GAP) / (MIN_BAR + GAP))))

export function barChart(spec: ChartSpec): HTMLElement {
  const height = spec.height ?? 200
  let range = spec.ranges.find((r) => r.key === spec.initial) ?? spec.ranges[0]
  let vals: number[] = []

  const grid = h('div', { class: 'ch-grid' })
  const bars = h('div', { class: 'ch-bars' })
  const tip = h('div', { class: 'ch-tip', hidden: true })
  const plot = h('div', { class: 'ch-plot', style: { height: height + 'px' } }, grid, bars, tip)
  const axis = h('div', { class: 'ch-axis' })
  const caption = h('span', { class: 't-caption' })
  const chips = h('div', { class: 'chip-row' })
  const wrap = h('div', { class: 'chart' },
    h('div', { class: 'card-head' },
      h('span', { class: 't-caps subtle', text: spec.title ?? 'Value over time' }), chips),
    caption, plot, axis)

  const draw = () => {
    // A width of nothing is not a width. Drawing against a fallback puts a
    // count on screen that the row cannot hold; the observer below will call
    // back the moment there is something to measure.
    const w = bars.clientWidth
    if (w < MIN_BAR) return
    const n = fitBars(w)
    vals = seriesFor(range, spec.endValue, n, spec.seed)

    // The axis is zoomed to the series, not anchored at zero: this portfolio
    // never went near zero, and a zero baseline squeezes a year of movement
    // into the top fifth of the card. The lowest label is the series low, so
    // it can never be misread as growth from nothing.
    const lo = Math.min(...vals)
    const hi = Math.max(...vals)
    const pad = (hi - lo) * 0.12 || hi * 0.02
    const base = lo - pad
    const top = hi + pad
    const at = (v: number) => ((v - base) / (top - base)) * 100

    const marks = niceTicks(lo, hi)
    const step = marks.length > 1 ? marks[1] - marks[0] : hi - lo
    grid.replaceChildren(...marks.map((v) =>
      h('div', { class: 'ch-line', style: { bottom: at(v) + '%' } },
        h('span', { class: 'ch-tick', text: compact(v, step) }))))

    bars.replaceChildren(...vals.map((v, i) =>
      h('div', {
        class: 'ch-bar' + (i === n - 1 ? ' now' : ''),
        style: { height: Math.max(2, at(v)) + '%' },
      })))

    // Axis labels are generated, not listed: twelve months of them fit a
    // desktop card and crowd into each other on a phone. The width says how
    // many there is room for, and they are read off the same dates the
    // tooltip uses, so a label under a bar is when that bar was.
    const k = Math.max(3, Math.min(6, Math.floor(w / 110)))
    axis.replaceChildren(...Array.from({ length: k }, (_, j) =>
      h('span', { class: 't-caption muted', text: range.fmt(dateAt(range, j / (k - 1))) })))

    const from = vals[0]
    const change = spec.endValue - from
    caption.className = 't-caption ' + (change >= 0 ? 'pos' : 'warn')
    caption.textContent =
      `${change >= 0 ? '+' : '−'}${usd(Math.abs(change))} (${change >= 0 ? '+' : '−'}${pct(Math.abs(range.pct))}) ` +
      (range.over ?? 'over ' + range.key)

    plot.setAttribute('role', 'img')
    plot.setAttribute('aria-label',
      `${spec.title ?? 'Value over time'}. ${range.over ?? 'Over ' + range.key}: ` +
      `${usd(from)} on ${dateAt(range, 0).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ` +
      `${usd(spec.endValue)} now, a low of ${usd(lo)} and a high of ${usd(hi)}.`)

    for (const c of chips.children) {
      (c as HTMLElement).setAttribute('aria-pressed', String(c.textContent === range.key))
    }
  }

  // ---- the hover: which bar, what it was worth, and when
  let lit = -1
  const show = (i: number) => {
    if (i === lit || i < 0 || i >= vals.length) return
    if (lit >= 0) bars.children[lit]?.classList.remove('on')
    lit = i
    const bar = bars.children[i] as HTMLElement
    bar.classList.add('on')
    const from = vals[0]
    const d = vals[i] - from
    tip.replaceChildren(
      h('span', { class: 't-body-strong', text: usd(vals[i]) }),
      h('span', { class: (d >= 0 ? 'pos' : 'warn') + ' t-caption',
        text: `${d >= 0 ? '+' : '−'}${pct(Math.abs((d / from) * 100))}` }),
      h('span', { class: 'muted t-caption', text: range.fmt(dateAt(range, i / (vals.length - 1))) }))
    tip.hidden = false
    // clamped so it never hangs off either edge of the card
    const x = bar.offsetLeft + bar.offsetWidth / 2
    tip.style.left = Math.min(Math.max(x, tip.offsetWidth / 2), plot.clientWidth - tip.offsetWidth / 2) + 'px'
  }
  const hide = () => {
    if (lit >= 0) bars.children[lit]?.classList.remove('on')
    lit = -1
    tip.hidden = true
  }
  bars.addEventListener('pointermove', (e) => {
    const r = bars.getBoundingClientRect()
    show(Math.floor(((e.clientX - r.left) / r.width) * vals.length))
  })
  bars.addEventListener('pointerleave', hide)

  for (const r of spec.ranges) {
    chips.appendChild(h('button', {
      class: 'chip', text: r.key,
      on: { click: () => { range = r; hide(); draw() } },
    }))
  }

  // The bar count follows the width, so the chart is redrawn when it changes
  // rather than overflowing or being squeezed. Guarded: not every browser the
  // preview runs in has ResizeObserver.
  if (typeof ResizeObserver !== 'undefined') {
    let last = 0
    new ResizeObserver(() => {
      const n = fitBars(bars.clientWidth)
      if (n !== last) { last = n; hide(); draw() }
    }).observe(bars)
  }
  draw()
  // The first measurement can be taken before the column has settled, which
  // draws a count the row cannot hold. Re-measure once the frame is done.
  requestAnimationFrame(draw)
  return wrap
}
