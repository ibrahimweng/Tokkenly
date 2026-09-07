/** The dot fields, and the palette they are painted from.
 *
 *  This file used to hold three compositions lifted cell for cell from Figma
 *  06 Desktop, D01c Home — hand-placed grids of base-36 diameters, tiled into
 *  a texture behind each door. Every surface in the product now carries an
 *  object instead (11g.44, 11g.45), so the compositions and the renderer that
 *  tiled them are gone rather than left sitting unused. They are in the
 *  history if the texture is ever wanted back.
 *
 *  What survives is the grid unit, the four rungs, and the idea that a field
 *  is keyed to a figure rather than being decoration.
 *
 *  It is drawn as one SVG rather than several hundred spans: a field is upward
 *  of a thousand dots, and that many divs is a thousand nodes for a picture. */
const TONE: Record<string, string> = {
  a: 'var(--dot-dim)', b: 'var(--dot-mid)', c: 'var(--dot-lit)', p: 'var(--data-2)',
  /* Not a composed tone. It is what a cell takes when the account has not
     woken it. */
  z: 'var(--dot-sleep)',
}

/** A field's own three rungs, for a card that is about one product rather than
 *  about the account as a whole. Only which colour each rung resolves to
 *  changes, so a cell drawn dim stays dim. */
export const LEND_RAMP: Record<string, string> = {
  a: 'var(--lend-dim)', b: 'var(--lend-mid)', c: 'var(--lend-lit)', p: 'var(--lend-lit)',
}
export const OWE_RAMP: Record<string, string> = {
  a: 'var(--owe-dim)', b: 'var(--owe-mid)', c: 'var(--owe-lit)', p: 'var(--owe-lit)',
}

/** The grid a field is drawn on, in SVG user units. */
const CELL = 12

/** A cell that is not awake keeps its place and its size and gives up its
 *  tone. Every tone, to the same rung — the first version dimmed each one by a
 *  step, which reads well until you notice that a dim cell has nowhere to go:
 *  moving $1,000 into Earn changed that tile's level and changed not one pixel
 *  of it, because the cells being woken were composed dim in the first place.
 *  A gauge whose sensitivity depends on where the artist happened to put the
 *  light is not a gauge. */
const SLEEP = 'z'

/** How much of a field is awake.
 *
 *  Never none of it. A field keyed straight to a proportion goes almost dark
 *  on an account holding most of its money somewhere else, and two of the
 *  three doors on Home would have read as broken rather than as informative:
 *  the seeded account is 77% shares, 15% cash, 7.6% Earn. So the value moves
 *  the level between a floor and the whole thing. At the top it is exactly the
 *  field Figma drew — the composition is the top of the scale, not one variant
 *  of it. */
const FLOOR = 0.45
export const level = (part: number, whole: number): number =>
  FLOOR + (1 - FLOOR) * (whole > 0 ? Math.max(0, Math.min(1, part / whole)) : 0)

/* ===========================================================================
   Objects, drawn as particle fields.

   The three fields above are compositions: hand-placed cells, lifted from
   Figma, tiled into a texture. A texture is the right answer for a background
   and the wrong one for a picture — repeated four times across a card it says
   nothing, which is why the two product cards read as having art on them
   rather than art about them.

   These are objects. A stack of coins for lending, a wallet for borrowing:
   one simple thing per card, stated once, at a size you can see. Composing one
   by hand at the resolution a wallet needs would be four thousand characters
   of base 36, so these are generated from a shape and then broken up — which
   is a departure from the note at the top of this file, and a deliberate one.
   That note is about not re-deriving a drawing somebody made; nobody drew
   these.

   The look is the one in the reference: a form stippled solid at one end,
   coming apart into loose specks at the other. Three parts to it —

     the form      cells inside the shape, kept with a probability that falls
                   along the drift axis, so the left stays solid and the right
                   opens up
     the break     cells just outside the shape, near where it is coming apart,
                   thinning with distance
     the dust      a far sparser scatter that carries on past the form, so the
                   band has something in it rather than ending in a hard edge

   Every one of those is decided by a hash of the cell's own coordinates, so
   the picture is identical on every render. The tree here is rebuilt on every
   state change; a field that used Math.random would boil.
   =========================================================================== */

/** A point in the shape's own grid. `d` is how far it is from the solid form,
 *  in cells: 0 inside it, growing outward. The level reads that. */
interface Speck { x: number; y: number; r: number; d: number }

export interface ObjectField { cols: number; rows: number; dots: Speck[] }

/** True where the solid form is. Coordinates are cells, not pixels. */
type Mask = (x: number, y: number) => boolean

/* Two box shapes, because a field has to be composed for the band it lands in.
   A picture laid out for a 1.25 card and then cropped into a 2.6 door loses
   most of itself; `slice` is the right crop for a texture and the wrong one
   for a subject. TALL is the two product cards, WIDE is the three doors on
   Home and the onboarding panels. Nothing uses both, so nothing is laid out
   twice. */
export interface Box { cols: number; rows: number; mid: number; from: number; to: number }
export const TALL: Box = { cols: 104, rows: 83, mid: 42, from: 6, to: 66 }
export const WIDE: Box = { cols: 116, rows: 44, mid: 22, from: 5, to: 74 }

/** Deterministic per-cell noise in [0, 1). Cheap, and stable across renders. */
function noise(x: number, y: number): number {
  let h = Math.imul(x + 11, 374761393) ^ Math.imul(y + 7, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/* ---- shapes, in cell coordinates ---- */
const disc = (cx: number, cy: number, r: number): Mask =>
  (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r
const ringGap = (cx: number, cy: number, a: number, b: number): Mask =>
  (x, y) => { const q = (x - cx) ** 2 + (y - cy) ** 2; return q >= a * a && q <= b * b }
const rrect = (x0: number, y0: number, x1: number, y1: number, r: number): Mask =>
  (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false
    const dx = Math.max(x0 + r - x, 0, x - (x1 - r))
    const dy = Math.max(y0 + r - y, 0, y - (y1 - r))
    return dx * dx + dy * dy <= r * r
  }
const any = (...m: Mask[]): Mask => (x, y) => m.some((f) => f(x, y))
const not = (m: Mask): Mask => (x, y) => !m(x, y)
const both = (a: Mask, b: Mask): Mask => (x, y) => a(x, y) && b(x, y)

/** Chamfer distance to the nearest solid cell, in cells. Two passes, so the
 *  whole grid costs one sweep each way rather than a search per cell. */
function spread(inside: boolean[], w: number, h: number): number[] {
  const BIG = 1e6
  const d: number[] = inside.map((v) => (v ? 0 : BIG))
  const at = (x: number, y: number) => d[y * w + x]
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    if (x > 0) d[i] = Math.min(d[i], at(x - 1, y) + 3)
    if (y > 0) d[i] = Math.min(d[i], at(x, y - 1) + 3)
    if (x > 0 && y > 0) d[i] = Math.min(d[i], at(x - 1, y - 1) + 4)
    if (x < w - 1 && y > 0) d[i] = Math.min(d[i], at(x + 1, y - 1) + 4)
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x
    if (x < w - 1) d[i] = Math.min(d[i], at(x + 1, y) + 3)
    if (y < h - 1) d[i] = Math.min(d[i], at(x, y + 1) + 3)
    if (x < w - 1 && y < h - 1) d[i] = Math.min(d[i], at(x + 1, y + 1) + 4)
    if (x > 0 && y < h - 1) d[i] = Math.min(d[i], at(x - 1, y + 1) + 4)
  }
  return d.map((v) => v / 3)
}

/** Where the form starts coming apart. 0 at the left edge of the object, 1 by
 *  the time the drift has crossed it. */
function makeField(mask: Mask, box: Box): ObjectField {
  const { cols, rows, mid: OBJ_MID, from: DRIFT_FROM, to: DRIFT_TO } = box
  const inside: boolean[] = new Array(cols * rows)
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) inside[y * cols + x] = mask(x, y)
  const dist = spread(inside, cols, rows)
  const dots: Speck[] = []
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x
    const t = Math.max(0, Math.min(1, (x - DRIFT_FROM) / (DRIFT_TO - DRIFT_FROM)))
    const n = noise(x, y)
    const d = dist[i]
    if (inside[i]) {
      // Solid at the near end, opening up as the drift crosses it.
      if (n > 1 - 0.88 * t * t) continue
      dots.push({ x, y, r: 0.46 - 0.14 * t, d: 0 })
    } else {
      // What has come off it, and then a far thinner dust carrying on past.
      // The dust fans: its vertical reach opens with the drift, so a band
      // half as wide as it is not left with a bare lower half. That is what
      // the reference does with a mane and a wheel.
      const cone = Math.exp(-Math.abs(y - OBJ_MID) / (7 + 26 * t))
      const near = 0.62 * Math.exp(-d / 2.6) * (0.18 + 0.82 * t)
      const far = 0.16 * Math.exp(-d / 20) * t * t * cone
      if (n > near + far) continue
      dots.push({ x, y, r: Math.max(0.16, 0.42 * Math.exp(-d / 7)), d })
    }
  }
  // Nearest first, so a rising level pushes the scatter outward from the form
  // rather than lighting it in reading order.
  dots.sort((a, b) => a.d - b.d)
  return { cols, rows, dots }
}

const built = new Map<string, ObjectField>()
const field = (key: string, mask: Mask, box: Box): ObjectField => {
  let f = built.get(key)
  if (!f) { f = makeField(mask, box); built.set(key, f) }
  return f
}

/* ---- two more shapes the doors need ---- */

/** A slice of a disc, between two angles. Angles run clockwise from east,
 *  because y grows downward here. */
const wedge = (cx: number, cy: number, r: number, a0: number, a1: number): Mask =>
  (x, y) => {
    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) return false
    let a = (Math.atan2(y - cy, x - cx) * 180) / Math.PI
    if (a < 0) a += 360
    return a >= a0 && a <= a1
  }

/** The oval window on a banknote: the ring, not the fill. */
const oval = (cx: number, cy: number, rx: number, ry: number, t: number): Mask =>
  (x, y) => {
    const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
    const inner = ((x - cx) / (rx - t)) ** 2 + ((y - cy) / (ry - t)) ** 2
    return q <= 1 && inner >= 1
  }

/* ---- the two objects ---- */

/** Three coins, overlapping, the front one lowest and most solid. Each is cut
 *  by the one in front of it, because dots cannot occlude: without the cut,
 *  three overlapping discs are one blob. The gap inside the edge is the rim,
 *  and it is what makes a disc read as a coin rather than as a circle. */
const COIN_R = 15
const coin = (cx: number, cy: number): Mask =>
  both(disc(cx, cy, COIN_R), not(ringGap(cx, cy, COIN_R * 0.62, COIN_R * 0.78)))
export const COINS = (): ObjectField => field('coins', (() => {
  const cut = (cx: number, cy: number) => disc(cx, cy, COIN_R + 2.2)
  return any(
    both(coin(45, 30), not(cut(33, 42))),
    both(coin(33, 42), not(cut(21, 54))),
    coin(21, 54),
  )
})(), TALL)

/** A bifold, the way somebody draws one: a rounded body, the flap edge across
 *  the upper third, the strap standing off the right, and a line of stitching
 *  inset from the edge. The stitch is subtracted rather than drawn — a missing
 *  ring of dots inside the silhouette reads as a seam, and adding one would
 *  have needed a second colour the card does not have. */
export const WALLET = (): ObjectField => field('wallet', (() => {
  const body = rrect(7, 26, 51, 60, 4.5)
  // The card standing out of it. One, not a fan: a fan of three reads as a
  // card holder, and the thing under it stops being the subject.
  const card = rrect(17, 13, 38, 28, 1.6)
  const strap = rrect(46, 34, 60, 51, 3)
  // Taken out again. The flap edge across the upper third and the seam either
  // side of the strap are gaps rather than lines, because a missing row of
  // dots is the only line this field can draw.
  const flap = rrect(7, 37.4, 51, 39.6, 0.7)
  const gap = rrect(45.4, 32, 47.2, 53, 0.5)
  const lip = rrect(15, 24.4, 40, 26.6, 0.5)
  return both(any(body, card, strap), not(any(flap, gap, lip)))
})(), TALL)

/* ---- the three doors ----
   Home shows all three at once, so they have to be tellable apart at a glance
   and none of them may be the wallet or the coins: those are spoken for by the
   two product cards a click away, and a door that shows what is behind it is
   only useful if it shows the right thing. */

/** Own a piece. A disc with one wedge cut out of it and set down beside the
 *  hole it came from — which is what a share is, and the only one of these
 *  three that is an idea rather than an object. */
export const PIECE = (): ObjectField => field('piece', (() => {
  const cx = 25, cy = 23, R = 19
  // The slice, and the gap it left. The gap is the slice grown a little, so
  // there is a clean edge rather than a join.
  const slice = wedge(cx, cy, R, 198, 252)
  const gap = wedge(cx, cy, R + 1.5, 194, 256)
  const lifted = (x: number, y: number) => slice(x + 7, y + 4)
  return any(both(disc(cx, cy, R), not(gap)), lifted)
})(), WIDE)

/** Naira in, dollars held: two notes, the front one over the back one, each
 *  with the oval window every banknote in the world has. Notes rather than
 *  coins, because the coins are the lending card's and two piles of money on
 *  one screen would be one thing said twice. */
export const NOTES = (): ObjectField => field('notes', (() => {
  const front = both(rrect(5, 18, 51, 41, 2.5), not(oval(28, 29.5, 11, 8, 2.2)))
  const back = both(rrect(21, 3, 67, 26, 2.5), not(oval(44, 14.5, 11, 8, 2.2)))
  const cut = rrect(3, 16, 53, 43, 2.5)
  return any(both(back, not(cut)), front)
})(), WIDE)

/** Borrow and lend, which is two products and so is two things: the wallet,
 *  with a coin standing against it. The card standing out of the wallet is on
 *  the card behind this door and not here — at this size it was a bump. */
export const PURSE = (): ObjectField => field('purse', (() => {
  const body = rrect(5, 11, 42, 39, 3)
  const flap = rrect(5, 21, 42, 23.2, 0.7)
  const wallet = both(body, not(flap))
  const C = 13
  const coin = both(disc(50, 28, C), not(ringGap(50, 28, C * 0.56, C * 0.76)))
  return any(both(wallet, not(disc(50, 28, C + 2))), coin)
})(), WIDE)

/** The object, at a level. The form is always drawn: a wallet with half of it
 *  missing reads as a fault, not as a figure. What the level moves is how far
 *  the break and the dust carry — a position you have barely opened shows the
 *  thing itself and little else, and a full one throws it across the band. */
export function objectArt(
  f: ObjectField, at = 1, ramp?: Record<string, string>,
): SVGSVGElement {
  const PAINT = ramp ? { ...TONE, ...ramp } : TONE
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${f.cols * CELL} ${f.rows * CELL}`)
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  // The object is at the left, so the left is what must survive a crop.
  svg.setAttribute('preserveAspectRatio', 'xMinYMid slice')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')

  const loose = f.dots.filter((p) => p.d > 0).length
  const wake = Math.round(loose * Math.max(0, Math.min(1, at)))
  let seen = 0
  for (const p of f.dots) {
    const c = document.createElementNS(NS, 'circle')
    c.setAttribute('cx', String(p.x * CELL + CELL / 2))
    c.setAttribute('cy', String(p.y * CELL + CELL / 2))
    c.setAttribute('r', String(p.r * CELL))
    let key: string
    if (p.d === 0) key = 'c'
    else { seen += 1; key = seen <= wake ? (p.d < 3 ? 'b' : 'a') : SLEEP }
    c.setAttribute('fill', PAINT[key] ?? PAINT.b)
    svg.appendChild(c)
  }
  return svg
}
