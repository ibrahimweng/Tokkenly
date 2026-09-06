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
  /** The real price of the thing the token tracks. Drawn as a line over the
   *  candles, because the gap between the two is the number that matters most
   *  on a tokenised share and a single figure only shows it as of now. */
  mark?: number
  markLabel?: string
  /** How the series is drawn. Candles for a share, because open, high, low and
   *  close are four real facts about a traded thing and the gap between them
   *  is what a trader reads. A line for a portfolio, because a savings balance
   *  has a value rather than an intraday range: drawing one as candles put a
   *  trader's instrument on a saver's screen and made the busiest block on
   *  Home out of a number that only goes up and down slowly. */
  shape?: 'candles' | 'area'
}

export interface Candle { o: number; h: number; l: number; c: number }

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

/** One candle per bucket, from a finer series inside it. A bar says where a
 *  period ended; a candle says where it opened, how far it ran either way, and
 *  which direction it closed — four numbers for the same width, which is why
 *  every trading screen draws them. */
export function candlesFor(r: Range, endValue: number, n: number, seed = 7): Candle[] {
  const STEPS = 6
  const fine = seriesFor(r, endValue, n * STEPS, seed)
  const out: Candle[] = []
  for (let i = 0; i < n; i++) {
    const slice = fine.slice(i * STEPS, i * STEPS + STEPS)
    out.push({
      o: slice[0], c: slice[slice.length - 1],
      h: Math.max(...slice), l: Math.min(...slice),
    })
  }
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

/** How many candles a range is made of, whatever the width. The series used
 *  to be generated at the bar count the row had room for, which made every
 *  figure read off it a fact about the browser window rather than about the
 *  thing being charted: Apple's year high came out $224.50 at 1440, $224.69
 *  at 1100 and $224.55 on a phone, and the same reload on the same screen
 *  agreed with itself only because the generator is seeded. */
const RESOLUTION = MAX_BARS

/** Fold the fixed series into however many candles the width has room for.
 *  The buckets partition the whole series and nothing is dropped, so the high,
 *  the low and the two ends come out the same at every width — which is the
 *  point. A wider window shows more detail, not different history. */
export function foldCandles(full: Candle[], n: number): Candle[] {
  if (n >= full.length) return full
  const out: Candle[] = []
  for (let i = 0; i < n; i++) {
    const from = Math.floor((i * full.length) / n)
    const to = Math.max(Math.floor(((i + 1) * full.length) / n), from + 1)
    const slice = full.slice(from, to)
    out.push({
      o: slice[0].o,
      c: slice[slice.length - 1].c,
      h: Math.max(...slice.map((k) => k.h)),
      l: Math.min(...slice.map((k) => k.l)),
    })
  }
  return out
}

export function barChart(spec: ChartSpec): HTMLElement {
  const height = spec.height ?? 200
  let range = spec.ranges.find((r) => r.key === spec.initial) ?? spec.ranges[0]
  let vals: number[] = []
  let candles: Candle[] = []
  /** The range at full resolution, before the width has folded it. */
  let full: Candle[] = []

  const grid = h('div', { class: 'ch-grid' })
  const bars = h('div', { class: 'ch-bars' })
  const overlay = h('div', { class: 'ch-overlay' })
  const tip = h('div', { class: 'ch-tip', hidden: true })
  /** Where the pointer is, on a line that has no bars to light up. */
  const cursor = h('span', { class: 'ch-cursor', hidden: true })
  const plot = h('div', { class: 'ch-plot', style: { height: height + 'px' } }, grid, bars, overlay, tip)
  // Open, high, low, close and the change, above the plot — four numbers of
  // precision the marks alone cannot give, and the line every trading screen
  // puts here.
  const ohlc = h('div', { class: 'ch-ohlc' })
  const axis = h('div', { class: 'ch-axis' })
  const caption = h('span', { class: 't-caption' })
  const chips = h('div', { class: 'chip-row' })
  const wrap = h('div', { class: 'chart' },
    h('div', { class: 'card-head' },
      h('span', { class: 't-caps subtle', text: spec.title ?? 'Value over time' }), chips),
    h('div', { class: 'ch-top' }, caption, ohlc), plot, axis)

  const draw = () => {
    // A width of nothing is not a width. Drawing against a fallback puts a
    // count on screen that the row cannot hold; the observer below will call
    // back the moment there is something to measure.
    const w = bars.clientWidth
    if (w < MIN_BAR) return
    const n = fitBars(w)
    full = candlesFor(range, spec.endValue, RESOLUTION, spec.seed)
    candles = foldCandles(full, n)
    vals = candles.map((k) => k.c)

    // The axis is zoomed to the series, not anchored at zero: this portfolio
    // never went near zero, and a zero baseline squeezes a year of movement
    // into the top fifth of the card. The lowest label is the series low, so
    // it can never be misread as growth from nothing.
    // The extremes come off the wicks, not the closes: a candle whose high is
    // clipped by the top of the plot is a candle that lies. The mark widens
    // the scale so its line is always on screen, but it is not part of the
    // high and the low — those belong to the price, and reporting the mark as
    // the period's high would be reporting the wrong instrument.
    const lo = Math.min(...candles.map((k) => k.l))
    const hi = Math.max(...candles.map((k) => k.h))
    const scaleLo = Math.min(lo, spec.mark ?? Infinity)
    const scaleHi = Math.max(hi, spec.mark ?? -Infinity)
    const pad = (scaleHi - scaleLo) * 0.12 || scaleHi * 0.02
    const base = scaleLo - pad
    const top = scaleHi + pad
    const at = (v: number) => ((v - base) / (top - base)) * 100

    const marks = niceTicks(lo, hi)
    const step = marks.length > 1 ? marks[1] - marks[0] : hi - lo
    grid.replaceChildren(...marks.map((v) =>
      h('div', { class: 'ch-line', style: { bottom: at(v) + '%' } },
        h('span', { class: 'ch-tick', text: compact(v, step) }))))

    if (spec.shape === 'area') drawArea()
    else bars.replaceChildren(...candles.map((k, i) => {
      const up = k.c >= k.o
      const bodyTop = Math.max(at(k.o), at(k.c))
      const bodyLow = Math.min(at(k.o), at(k.c))
      return h('div', { class: 'ch-candle' + (up ? ' up' : ' down') + (i === n - 1 ? ' now' : '') },
        // the wick runs the whole range, the body only from open to close
        h('span', { class: 'ch-wick',
          style: { bottom: at(k.l) + '%', height: Math.max(1, at(k.h) - at(k.l)) + '%' } }),
        h('span', { class: 'ch-body',
          style: { bottom: bodyLow + '%', height: Math.max(1.2, bodyTop - bodyLow) + '%' } }))
    }))

    /** One filled shape under one line, and a dot on the end. The fill fades
     *  out downwards rather than sitting as a slab, because the area under a
     *  balance line is not a quantity — it is there to give the line a body. */
    function drawArea(): void {
      const n2 = vals.length
      const pt = (v: number, i: number) => `${(i / (n2 - 1)) * 100},${100 - at(v)}`
      const line = vals.map(pt).join(' L ')
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', 'ch-svg')
      svg.setAttribute('viewBox', '0 0 100 100')
      svg.setAttribute('preserveAspectRatio', 'none')
      svg.setAttribute('aria-hidden', 'true')
      const id = 'chfill' + Math.random().toString(36).slice(2, 8)
      svg.innerHTML =
        `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0%" stop-color="currentColor" stop-opacity="0.28"/>` +
        `<stop offset="100%" stop-color="currentColor" stop-opacity="0"/>` +
        `</linearGradient></defs>` +
        `<path d="M ${line} L 100,100 L 0,100 Z" fill="url(#${id})" stroke="none"/>` +
        `<path d="M ${line}" fill="none" stroke="currentColor" stroke-width="2" ` +
        `vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>`
      // The end of the line is where the money is now, so it gets a mark. Its
      // own element rather than an SVG circle: the viewBox is stretched to the
      // plot, and a circle inside it would come out an ellipse.
      const end = h('span', { class: 'ch-end',
        style: { left: '100%', bottom: at(vals[n2 - 1]) + '%' } })
      bars.replaceChildren(svg, end, cursor)
      bars.classList.toggle('up', spec.endValue >= candles[0].o)
      bars.classList.toggle('down', spec.endValue < candles[0].o)
    }

    // The real price of the share behind the token, drawn across the whole
    // period so the gap is a shape rather than a single figure.
    overlay.replaceChildren()
    if (spec.mark !== undefined) {
      overlay.appendChild(h('span', { class: 'ch-mark', style: { bottom: at(spec.mark) + '%' } },
        h('span', { class: 'ch-mark-tag', text: (spec.markLabel ?? 'Real price') + ' ' + usd(spec.mark) })))
    }
    // The period's own high and low, on the edge where a trader looks for them.
    overlay.appendChild(h('span', { class: 'ch-edge high', style: { bottom: at(hi) + '%' } },
      h('span', { text: 'High ' + usd(hi) })))
    overlay.appendChild(h('span', { class: 'ch-edge low', style: { bottom: at(lo) + '%' } },
      h('span', { text: 'Low ' + usd(lo) })))

    // Axis labels are generated, not listed: twelve months of them fit a
    // desktop card and crowd into each other on a phone. The width says how
    // many there is room for, and they are read off the same dates the
    // tooltip uses, so a label under a bar is when that bar was.
    const k = Math.max(3, Math.min(6, Math.floor(w / 110)))
    axis.replaceChildren(...Array.from({ length: k }, (_, j) =>
      h('span', { class: 't-caption muted', text: range.fmt(dateAt(range, j / (k - 1))) })))

    // Where the range opened, not where its first candle closed. `vals` holds
    // closes, so reading the baseline off vals[0] measured close-to-close
    // while the percentage beside it measured open-to-now — two different
    // spans in one sentence, and the dollar half moved with the width because
    // the first close did. The open is the pinned start of the series.
    const from = candles[0].o
    const change = spec.endValue - from
    caption.className = 't-caption ' + (change >= 0 ? 'pos' : 'warn')
    caption.textContent =
      `${change >= 0 ? '+' : '−'}${usd(Math.abs(change))} (${change >= 0 ? '+' : '−'}${pct(Math.abs(range.pct))}) ` +
      (range.over ?? 'over ' + range.key)

    // The four numbers are the latest period at full resolution — a fixed
    // slice of time — not the last bucket, whose width depends on the window.
    if (spec.shape === 'area') ohlc.replaceChildren()
    else paintOhlc(full[full.length - 1], from)

    plot.setAttribute('role', 'img')
    plot.setAttribute('aria-label',
      `${spec.title ?? 'Value over time'}. ${range.over ?? 'Over ' + range.key}: ` +
      `${usd(from)} on ${dateAt(range, 0).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}, ` +
      `${usd(spec.endValue)} now, a low of ${usd(lo)} and a high of ${usd(hi)}.`)

    for (const c of chips.children) {
      (c as HTMLElement).setAttribute('aria-pressed', String(c.textContent === range.key))
    }
  }

  /** Open, high, low and close are four facts about a traded thing. A balance
   *  has none of them, so the row is not drawn at all on a line chart rather
   *  than being filled with numbers that do not mean anything. */
  function paintOhlc(k: Candle | undefined, from: number): void {
    if (!k) return
    const d = k.c - k.o
    ohlc.replaceChildren(
      ...([['O', k.o], ['H', k.h], ['L', k.l], ['C', k.c]] as [string, number][]).map(([l, v]) =>
        h('span', { class: 'ch-num' },
          h('span', { class: 'subtle', text: l }), h('span', { text: usd(v) }))),
      h('span', { class: (d >= 0 ? 'pos' : 'warn') + ' t-caption',
        text: `${d >= 0 ? '+' : '−'}${usd(Math.abs(d))} (${d >= 0 ? '+' : '−'}${pct(Math.abs((d / (from || 1)) * 100))})` }))
  }

  // ---- the hover: which candle, what it did, and when
  let lit = -1
  const show = (i: number) => {
    if (i === lit || i < 0 || i >= vals.length) return
    const areaMode = spec.shape === 'area'
    if (lit >= 0 && !areaMode) bars.children[lit]?.classList.remove('on')
    lit = i
    if (areaMode) {
      cursor.hidden = false
      cursor.style.left = (i / (vals.length - 1)) * 100 + '%'
    } else (bars.children[i] as HTMLElement).classList.add('on')
    const from = candles[0].o
    const k = candles[i]
    const d = vals[i] - from
    // The readout follows the pointer, so the four numbers are the candle you
    // are on rather than the last one.
    if (spec.shape !== 'area') paintOhlc(k, from)
    tip.replaceChildren(
      h('span', { class: 't-body-strong', text: usd(vals[i]) }),
      h('span', { class: (d >= 0 ? 'pos' : 'warn') + ' t-caption',
        text: `${d >= 0 ? '+' : '−'}${pct(Math.abs((d / from) * 100))}` }),
      h('span', { class: 'muted t-caption', text: range.fmt(dateAt(range, i / (vals.length - 1))) }))
    tip.hidden = false
    // clamped so it never hangs off either edge of the card
    const x = spec.shape === 'area'
      ? (i / (vals.length - 1)) * bars.clientWidth
      : (bars.children[i] as HTMLElement).offsetLeft + (bars.children[i] as HTMLElement).offsetWidth / 2
    tip.style.left = Math.min(Math.max(x, tip.offsetWidth / 2), plot.clientWidth - tip.offsetWidth / 2) + 'px'
  }
  const hide = () => {
    if (lit >= 0 && spec.shape !== 'area') bars.children[lit]?.classList.remove('on')
    cursor.hidden = true
    lit = -1
    tip.hidden = true
    // A chart that never got a width to draw against has no candles to report.
    if (candles.length && spec.shape !== 'area') paintOhlc(full[full.length - 1], candles[0].o)
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
