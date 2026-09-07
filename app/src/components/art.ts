/** The dot field behind the three gateway tiles, lifted cell for cell from
 *  Figma 06 Desktop, D01c Home — gateway. Each panel is a 12px grid with a
 *  circle centred in every cell it uses: `size` gives the diameter in base 36
 *  (0 for an empty cell, b for 11), `tone` gives which of four colours it
 *  takes. Nothing here is generated — the fields are composed, and a formula
 *  that came close would still be a different picture.
 *
 *  It is drawn as one SVG rather than several hundred spans: the Buy panel
 *  alone is 272 dots, and three tiles of divs is a thousand nodes for a
 *  decoration. */
export interface ArtSpec { cols: number; size: string[]; tone: string[] }

const TONE: Record<string, string> = {
  a: 'var(--dot-dim)', b: 'var(--dot-mid)', c: 'var(--dot-lit)', p: 'var(--data-2)',
  /* Not a composed tone. Nothing in the three fields is written as 'z'; it is
     what a cell takes when the account has not woken it. */
  z: 'var(--dot-sleep)',
}

/** 34 × 12 at 12px, so 408 × 144 drawn into the 400 × 140 Figma clips it to. */
export const BUY: ArtSpec = {
  cols: 34,
  size: [
    '5555555443222333333200000000002334',
    '6666666432000022220000000000000234',
    '7777776543200000000000233333222335',
    '7777776654320000000003455555444556',
    '5555666665300000000002445667788887',
    '4334455543200000000000235688888887',
    '4333220000000002200000035799999998',
    '6430000000002445443223456899999998',
    '7530000000003455566677888877777788',
    '6400000000000235689aaaaa9765445667',
    '32000000000000358aaaaaaa9765443333',
    '00023332000000469bbbbbbba987542000',
  ],
  tone: [
    'bbbbbbbbbbbbbbbbbbbb..........bbbb',
    'ccccccbbbb....bbbb.............bbb',
    'ccccccbbbbb...........bbbbbbbbbbbb',
    'cccccccbbbbb.........bbbbbbbbbbbbb',
    'bbbbbcccbbb..........bbbbbccccccpc',
    'bbbbbbbbbbb...........bbbccccccccc',
    'bbbbbb.........bb......bbccccccpcc',
    'bbb.........bbbbbbbbbbbbcccccccccc',
    'cbb.........bbbbbbbcccccccccccpccc',
    'bb...........bbbcccccpccccbbbbbbcc',
    'bb............bbccccccccccbbbbbbbb',
    '...bbbbb......bcccccpcccccccbbb...',
  ],
}

export const CONVERT: ArtSpec = {
  cols: 24,
  size: [
    '430000022322000000000023',
    '320000000000000022333222',
    '432000000000003455554433',
    '554200000000003566666666',
    '554200000000023456788888',
    '320000000000002346788888',
    '000002344433222346899999',
    '000003566655555677888888',
    '000003456778999998765545',
    '0000003468aaaaaaa8643333',
    '0000002479aaaaaaa8754320',
    '432223468abbbbbba9876420',
  ],
  tone: [
    'aa.....aaaaa..........aa',
    'aa..............aaaaaaaa',
    'aaa...........aaaaaaaaaa',
    'aaaa..........aaabbbbaab',
    'aaaa.........aaaaabbbbbb',
    'aa............aaaabbbbbp',
    '.....aaaaaaaaaaaabbbbbbb',
    '.....aaabaaaaaaabbbbbbpb',
    '.....aaabbbbbpbbbbbbaaaa',
    '......aaabbbbbbbbbbaaaaa',
    '......aabbbbpbbbbbbaaaa.',
    'aaaaaaabbbbbbbbbbbbbpaa.',
  ],
}

export const BORROW: ArtSpec = {
  cols: 24,
  size: [
    '000000000000022333445555',
    '000000023444443333456666',
    '000000245666655445556666',
    '000000346677777777765433',
    '000002344567888888864200',
    '233333334568888888754200',
    '666544445678999998654330',
    '777777777887766655665542',
    '678999999986432234455430',
    '579aaaaaa975320000000000',
    '68aaaaaaa976432000000000',
    '89aaaaa99988653000000000',
  ],
  tone: [
    '.............aaaaaaaaaaa',
    '.......aaaaaaaaaaaaaabbb',
    '......aaaabbaaaaaaaaaaaa',
    '......aaabbbbbbbbbbaaaaa',
    '.....aaaaabbbbbpbbbaaa..',
    'aaaaaaaaaabbbbbbbbbaaa..',
    'aaaaaaaaaabbbbpbbbbaaaa.',
    'bbbbbpbbbbbbbbaaaaaaaaaa',
    'bbbbbbbbbbbaaaaaaaaaaaa.',
    'abbbpbbbbbbaaa..........',
    'abbbbbbbbbbaaaa.........',
    'bbbpbbbbbbbbbaa.........',
  ],
}

/** The same field, reflected. Lending and borrowing are two halves of one
 *  thing — one account's dollars are the other account's loan — so the two
 *  cards carry one composition, mirrored, rather than two drawings that happen
 *  to sit beside each other. */
export const mirror = (spec: ArtSpec): ArtSpec => ({
  cols: spec.cols,
  size: spec.size.map((r) => [...r].reverse().join('')),
  tone: spec.tone.map((r) => [...r].reverse().join('')),
})

/** A field's own three rungs, for a card that is about one product rather than
 *  about the account as a whole. The composition is untouched: only which
 *  colour each rung resolves to changes, so a cell drawn dim stays dim. */
export const LEND_RAMP: Record<string, string> = {
  a: 'var(--lend-dim)', b: 'var(--lend-mid)', c: 'var(--lend-lit)', p: 'var(--lend-lit)',
}
export const OWE_RAMP: Record<string, string> = {
  a: 'var(--owe-dim)', b: 'var(--owe-mid)', c: 'var(--owe-lit)', p: 'var(--owe-lit)',
}

const CELL = 12

/** How much of its cell a dot is allowed to fill.
 *
 *  The compositions run to 11 of 12, which on the gateway tiles read as a
 *  halftone and on a 494px card read as a row of balls: 20.6px between centres
 *  with a 17.2px dot in each is not a dot field, it is a ball pit. Dropping the
 *  diameter is half the answer — the other half is the pitch below. */
const SHRINK = 0.6

/** The field, repeated until the dots are small.
 *
 *  A composed field has a fixed number of cells, so the bigger the box it is
 *  stretched across, the further apart its dots land — and because the crop
 *  scales by whichever axis needs more, it is the field's twelve rows against
 *  the band's height that actually sets the pitch. Repeating it in both axes
 *  is what keeps that pitch fine, and every other copy is reflected, so the
 *  joins are folds rather than seams and the eye reads one continuous texture
 *  rather than wallpaper. */
function repeat(spec: ArtSpec, x: number, y: number): ArtSpec {
  if (x <= 1 && y <= 1) return spec
  const wide = (rows: string[]) => rows.map((row) => {
    let out = ''
    for (let k = 0; k < x; k++) out += k % 2 ? [...row].reverse().join('') : row
    return out
  })
  const tall = (rows: string[]) => {
    const out: string[] = []
    for (let k = 0; k < y; k++) out.push(...(k % 2 ? [...rows].reverse() : rows))
    return out
  }
  return { cols: spec.cols * x, size: tall(wide(spec.size)), tone: tall(wide(spec.tone)) }
}

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

export function dotArt(
  spec: ArtSpec, at = 1, ramp?: Record<string, string>,
  /** How many copies of the field fit across and down the box it is drawn
   *  into. Chosen per surface so every field in the product lands at about six
   *  pixels between centres, whatever the box is. */
  tiles: [number, number] = [1, 1],
): SVGSVGElement {
  const PAINT = ramp ? { ...TONE, ...ramp } : TONE
  spec = repeat(spec, tiles[0], tiles[1])
  const NS = 'http://www.w3.org/2000/svg'
  const w = spec.cols * CELL
  const hgt = spec.size.length * CELL
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', `0 0 ${w} ${hgt}`)
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  // The panel is clipped in Figma too, so cropping is the drawn behaviour.
  // Anchored to the bottom, because that is the dense end of every field.
  svg.setAttribute('preserveAspectRatio', 'xMidYMax slice')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')

  // Filled from the bottom, because that is the dense end of every one of
  // these fields and the end they are anchored to. Counted in dots rather than
  // in rows, so each step of the level adds the same amount of ink whatever
  // shape the row happens to be — and crossed within a row rather than at its
  // edge, so the boundary runs diagonally instead of drawing a line across the
  // picture.
  const dots = spec.size.reduce((n, row) => n + [...row].filter((ch) => ch !== '0').length, 0)
  const wake = at >= 1 ? dots : Math.round(dots * Math.max(0, at))
  let seen = 0

  for (let y = spec.size.length - 1; y >= 0; y--) {
    const row = spec.size[y]
    for (let x = spec.cols - 1; x >= 0; x--) {
      const d = parseInt(row[x] ?? '0', 36)
      if (!d) continue
      seen += 1
      const c = document.createElementNS(NS, 'circle')
      c.setAttribute('cx', String(x * CELL + CELL / 2))
      c.setAttribute('cy', String(y * CELL + CELL / 2))
      c.setAttribute('r', String((d / 2) * SHRINK))
      const tone = spec.tone[y]?.[x] ?? 'b'
      const key = seen <= wake ? tone : SLEEP
      c.setAttribute('fill', PAINT[key] ?? PAINT.b)
      svg.appendChild(c)
    }
  }
  return svg
}

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

const OBJ = { cols: 116, rows: 42 }

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
const DRIFT_FROM = 8
const DRIFT_TO = 74

function makeField(mask: Mask): ObjectField {
  const { cols, rows } = OBJ
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
      const near = 0.62 * Math.exp(-d / 2.6) * (0.18 + 0.82 * t)
      const far = 0.05 * Math.exp(-d / 16) * t * t
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
const field = (key: string, mask: Mask): ObjectField => {
  let f = built.get(key)
  if (!f) { f = makeField(mask); built.set(key, f) }
  return f
}

/* ---- the two objects ---- */

/** Three coins, overlapping, the front one lowest and most solid. Each is cut
 *  by the one in front of it, because dots cannot occlude: without the cut,
 *  three overlapping discs are one blob. The gap inside the edge is the rim,
 *  and it is what makes a disc read as a coin rather than as a circle. */
const COIN_R = 13
const coin = (cx: number, cy: number): Mask =>
  both(disc(cx, cy, COIN_R), not(ringGap(cx, cy, COIN_R * 0.60, COIN_R * 0.78)))
export const COINS = (): ObjectField => field('coins', (() => {
  const cut = (cx: number, cy: number) => disc(cx, cy, COIN_R + 2)
  return any(
    both(coin(50, 14), not(cut(35, 20))),
    both(coin(35, 20), not(cut(20, 26))),
    coin(20, 26),
  )
})())

/** A bifold, the way somebody draws one: a rounded body, the flap edge across
 *  the upper third, the strap standing off the right, and a line of stitching
 *  inset from the edge. The stitch is subtracted rather than drawn — a missing
 *  ring of dots inside the silhouette reads as a seam, and adding one would
 *  have needed a second colour the card does not have. */
export const WALLET = (): ObjectField => field('wallet', (() => {
  const body = rrect(7, 9, 48, 36, 3.5)
  // The card standing out of it. One, not a fan: a fan of three reads as a
  // card holder, and the thing under it stops being the subject.
  const card = rrect(15, 2, 32, 10.4, 1.2)
  const strap = rrect(44, 17, 55, 29, 2.5)
  // Taken out again. The flap edge across the upper third and the seam either
  // side of the strap are gaps rather than lines, because a missing row of
  // dots is the only line this field can draw.
  const flap = rrect(7, 17.2, 48, 19, 0.6)
  const gap = rrect(43.6, 16, 45.2, 30, 0.4)
  const lip = rrect(13, 8.6, 34, 10.4, 0.4)
  return both(any(body, card, strap), not(any(flap, gap, lip)))
})())

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
