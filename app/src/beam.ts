/* The breathing beam.
   ---------------------------------------------------------------------------

   A halo that swells and settles around the confirmation sheet, so the moment
   money lands has something around it and not only the coin turning inside it.

   Ported from `border-beam` — Copyright (c) 2026 Jakub Antalik, MIT — which is
   the engine under Spectrum UI's Beam Card. The original is a React component
   for a Tailwind project; this product has no React, no Tailwind and no runtime
   dependencies, so what is taken is the recipe rather than the package — and
   the recipe is almost all CSS. The periods, the phase offsets, the blur radii
   and the opacities are its shipped `pulse-outside` numbers; see `11g.62` for
   what had to change and why.

   Two things are deliberately not the same.

   The colours. The shipped palette is nine hues on a rainbow, cycling a full
   hue revolution every fourteen seconds. Dropped into this product it would be
   the most colourful thing in it by a wide margin, and 11g.59 spent a whole
   tier taking colour *out* of the ground so the words could be read. So the
   nine slots are nine greens — the product's own — and the hue cycle is
   narrowed from a full circle to fourteen degrees either side, which keeps the
   light moving through cooler and warmer green rather than through everything.

   And the driving. The original runs one shared requestAnimationFrame loop for
   every beam on the page, capped near thirty frames a second. That is right and
   it is kept, because seventeen custom properties on seventeen different
   periods is not something CSS keyframes can express without seventeen
   animations — but there is only ever one confirmation sheet, so the set holds
   one member in practice.

   Why a loop at all, when the rest of the product's motion is CSS: the whole
   effect is a stack of radial gradients whose size, position and per-corner
   opacity all breathe on periods that do not divide into each other. Seventeen
   numbers, no two in step. That is what stops it reading as a pulse and makes
   it read as something alive. */

/** One number, breathing between `a` and `b`. */
type Osc = { prop: string; a: number; b: number; period: number; delay: number; px: boolean }

type Beam = { el: HTMLElement; osc: Osc[]; hue: { period: number; range: number } }

const TAU = Math.PI * 2

/* Thirty frames a second, less two milliseconds of slack so a frame that
   arrives a hair early is not thrown away. The effect is a slow swell; sixty
   frames of it would be sixty repaints an eye cannot tell from thirty. */
const FRAME = 1000 / 30 - 2

/** Cosine, not sine: it starts at rest, which is what a breath does. */
const ease = (t: number): number => (1 - Math.cos(TAU * t)) / 2

/** The shipped `pulse-outside` constants, per theme.
 *
 *  `sp` how far the blobs stretch, `dr` how far they drift in pixels, `op` how
 *  far the corner opacities dip, `gh` how much the whole glow's height swings,
 *  and three base periods: `bs` for drift, `ss` for stretch, `ghs` for height.
 *  The light theme moves further and dips its corners not at all, because a
 *  glow on white has less contrast to spend and needs the travel instead. */
type Tune = { sp: number; dr: number; op: number; gh: number; bs: number; ss: number; ghs: number }

const TUNE: Record<'dark' | 'light', Tune> = {
  dark: { sp: 0.28, dr: 14, op: 0.46, gh: 0.16, bs: 2.3, ss: 6.4, ghs: 2.4 },
  light: { sp: 0.36, dr: 19, op: 0, gh: 0.58, bs: 3.7, ss: 4.6, ghs: 3.8 },
}

/** Fourteen seconds for a full breath of colour, and fourteen degrees of it. */
const HUE = { period: 14, range: 14 }

function oscillators(t: Tune): Osc[] {
  const { sp, dr, op, gh, bs, ss, ghs } = t
  const n = (prop: string, a: number, b: number, period: number, delay = 0): Osc =>
    ({ prop, a, b, period, delay, px: false })
  const p = (prop: string, a: number, b: number, period: number): Osc =>
    ({ prop, a, b, period, delay: 0, px: true })
  return [
    // Three groups of blobs. Each group has its own width, height and drift,
    // and no two periods are a multiple of another, so the shape never repeats
    // exactly inside the time anybody looks at it.
    n('--bw1', 1 - sp, 1 + sp * 1.1, ss * 0.9),
    n('--bh1', 1 + sp * 0.9, 1 - sp * 0.85, ss * 1.26),
    p('--bx1', -dr, dr * 0.9, bs * 1.6),
    p('--by1', dr * 0.55, -dr * 0.7, bs * 1.6),
    n('--bw2', 1 + sp, 1 - sp * 0.85, ss * 1.1),
    n('--bh2', 1 - sp * 0.8, 1 + sp * 1.05, ss * 0.81),
    p('--bx2', dr * 0.8, -dr * 0.9, bs * 1.88),
    p('--by2', -dr, dr * 0.65, bs * 1.88),
    n('--bw3', 1 - sp * 0.6, 1 + sp * 1.15, ss * 0.98),
    n('--bh3', 1 + sp * 0.75, 1 - sp, ss * 1.4),
    p('--bx3', -dr * 0.6, dr, bs * 1.45),
    p('--by3', -dr * 0.85, dr * 0.45, bs * 1.45),
    // The height of the whole glow, which is what makes it a breath rather
    // than four separate lights.
    n('--bgh', 1 - gh, 1 + gh, ghs),
    // And the four corners, each dipping on its own clock and its own delay,
    // so the light appears to travel without anything actually rotating.
    n('--bop-tl', 1 - op, 1, bs),
    n('--bop-tr', 1 - op, 1, bs * 1.32, bs * 0.28),
    n('--bop-bl', 1 - op, 1, bs * 0.84, bs * 0.55),
    n('--bop-br', 1 - op, 1, bs * 1.58, bs * 0.83),
  ]
}

const live = new Set<Beam>()
let frame: number | null = null
let last = 0

function tick(now: number): void {
  frame = requestAnimationFrame(tick)
  if (now - last < FRAME) return
  last = now
  const t = now / 1000
  for (const b of live) {
    if (!b.el.isConnected) { live.delete(b); continue }
    for (const o of b.osc) {
      const v = o.a + (o.b - o.a) * ease((t - o.delay) / o.period)
      b.el.style.setProperty(o.prop, o.px ? v.toFixed(2) + 'px' : v.toFixed(4))
    }
    const h = -b.hue.range + 2 * b.hue.range * ease(t / b.hue.period)
    b.el.style.setProperty('--beam-hue', h.toFixed(2) + 'deg')
  }
  if (!live.size) stop()
}

function stop(): void {
  if (frame == null) return
  cancelAnimationFrame(frame)
  frame = null
}

/** Start a beam breathing on an element, and hand back the way to stop it.
 *
 *  Somebody who has asked for less motion gets the halo without the breath:
 *  the CSS still paints it, so the sheet is still framed in green, and nothing
 *  moves. That is the same bargain the rest of the product's motion makes. */
export function breathe(el: HTMLElement): () => void {
  if (typeof matchMedia !== 'undefined'
      && matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}
  const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  const b: Beam = { el, osc: oscillators(TUNE[theme]), hue: HUE }
  live.add(b)
  if (frame == null) { last = 0; frame = requestAnimationFrame(tick) }
  return () => { live.delete(b); if (!live.size) stop() }
}
