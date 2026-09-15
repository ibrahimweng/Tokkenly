/* ---------------------------------------------------------------------------
   Isometric line art.

   What was here before was a field of several hundred circles per picture,
   arranged into the silhouette of an object and lit according to how much of
   your money was in that thing. It was clever and it was noise: at the size
   the cards actually draw it, a few hundred dots is a texture, and a texture
   that is also a gauge is a gauge nobody reads.

   So: line drawings. One stroke weight, one colour, objects built the way an
   exploded diagram builds them — plates in a stack with the space between
   them shown rather than hidden, and every face filled in the colour of what
   it is lying on so the near ones hide the far ones (see GROUND below).

   Three rules hold the set together.

     One weight.     Every line in every drawing is the same width on screen,
                     whatever the drawing is scaled to. `vector-effect` does
                     that; without it a picture at 240px and the same picture
                     at 96px are two different weights and read as two styles.

     One colour.     `currentColor`, always. Which means every drawing works in
                     both themes without a second copy, and a caller can quiet
                     one by setting `color` rather than by editing it.

     One projection. 2:1 dimetric — x goes right and down, y goes left and
                     down, z goes straight up. The whole set shares a horizon,
                     so two drawings side by side look like two objects on one
                     table rather than two pictures.
   --------------------------------------------------------------------------- */

const NS = 'http://www.w3.org/2000/svg'

/** The colour of whatever the drawing is sitting on.
 *
 *  Every face in the set is filled with it. That is the difference between an
 *  exploded diagram and a pile of wire: with no fill, a coin behind a coin
 *  shows through the coin in front, four coins become one cylinder with lines
 *  in it, and the edge of the slab underneath runs straight across everything
 *  standing on it. Filling each face in the ground colour makes near things
 *  hide far things, which is the only reason any of these read.
 *
 *  A `var()` in a presentation attribute is ignored, so this always goes on
 *  `style`. The fallback is `transparent`: a caller who has not said what the
 *  ground is gets the wire drawing rather than a black hole. */
const GROUND = 'var(--art-ground, transparent)'

/** The projection. Half-width right per x, half-width left per y, z straight
 *  up. `K` is the horizontal half-step; `K / 2` falls out of the 2:1 ratio. */
const K = 0.866

export type P = [number, number]

export const iso = (x: number, y: number, z = 0): P =>
  [(x - y) * K, (x + y) * 0.5 - z]

const at = ([x, y]: P): string => `${x.toFixed(2)} ${y.toFixed(2)}`

function el<T extends SVGElement>(name: string, attrs: Record<string, string>): T {
  const n = document.createElementNS(NS, name) as T
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v)
  return n
}

/** A path in the one weight, in the one colour. `stroke-width` is set here and
 *  `vector-effect` keeps it there through any scale the layout applies. */
export function line(d: string, opts: {
  fill?: string
  dash?: string
  width?: number
  opacity?: number
} = {}): SVGPathElement {
  const p = el<SVGPathElement>('path', {
    d,
    stroke: 'currentColor',
    'stroke-width': String(opts.width ?? 1.1),
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round',
    'vector-effect': 'non-scaling-stroke',
  })
  p.style.fill = opts.fill ?? 'none'
  if (opts.dash) p.setAttribute('stroke-dasharray', opts.dash)
  if (opts.opacity !== undefined) p.setAttribute('opacity', String(opts.opacity))
  return p
}

const poly = (pts: P[], close = true): string =>
  'M' + pts.map(at).join('L') + (close ? 'Z' : '')

/* ----------------------------------------------------------------- shapes -- */

export interface Slab {
  /** Where the near-bottom corner sits, in iso units. */
  x?: number
  y?: number
  z?: number
  /** How big, in iso units. */
  w?: number
  d?: number
  h?: number
  /** Ghosted, for the plates a stack is showing you it could have. */
  ghost?: boolean
}

/** A rounded slab: the top face, and the faces you can see from here.
 *
 *  Drawn as a path per face rather than one outline, so the top can carry a
 *  glyph, each face can be quieter than the one above it — which is the whole
 *  of the shading in this style — and each has an area of its own to fill.
 *  Corners are cut rather than curved: a true iso round-over needs
 *  four ellipse arcs per corner and at this weight nobody can tell, while the
 *  cut reads as a chamfer and costs one line. */
export function slab(o: Slab = {}): SVGGElement {
  const { x = 0, y = 0, z = 0, w = 6, d = 6, h = 0.7, ghost = false } = o
  const c = Math.min(0.9, w / 4, d / 4)      // the chamfer
  const g = el<SVGGElement>('g', {})
  const dim = ghost ? 0.3 : 1
  const fill = ghost ? 'none' : GROUND

  // The two faces you can see from here, first, because the top sits on top of
  // them and has to be able to cover their edges.
  if (h > 0.01 && !ghost) {
    // Right, front, and the cut corner between them — which is the corner
    // nearest the eye. Each closes back along the top edge so it has an area
    // to fill; the shared edges get drawn twice and land in the same place.
    g.appendChild(line(poly([
      iso(x + w, y + c, z + h), iso(x + w, y + d - c, z + h),
      iso(x + w, y + d - c, z), iso(x + w, y + c, z),
    ]), { opacity: dim * 0.75, fill }))
    g.appendChild(line(poly([
      iso(x + c, y + d, z + h), iso(x + w - c, y + d, z + h),
      iso(x + w - c, y + d, z), iso(x + c, y + d, z),
    ]), { opacity: dim * 0.55, fill }))
    g.appendChild(line(poly([
      iso(x + w - c, y + d, z + h), iso(x + w, y + d - c, z + h),
      iso(x + w, y + d - c, z), iso(x + w - c, y + d, z),
    ]), { opacity: dim * 0.65, fill }))
  }

  // The top face, corners cut. Last, and filled, so anything lower in the
  // stack stops at this plate rather than running across it.
  const top: P[] = [
    iso(x + c, y, z + h), iso(x + w - c, y, z + h),
    iso(x + w, y + c, z + h), iso(x + w, y + d - c, z + h),
    iso(x + w - c, y + d, z + h), iso(x + c, y + d, z + h),
    iso(x, y + d - c, z + h), iso(x, y + c, z + h),
  ]
  g.appendChild(line(poly(top), {
    opacity: dim, fill, dash: ghost ? '3 4' : undefined,
  }))
  return g
}

/** A disc lying flat — a coin, a plate, the pan of a balance. An ellipse in
 *  projection, so it is drawn as one rather than approximated.
 *
 *  With a height it is a coin: the near half of the wall, filled, and the top
 *  face over it. The far half of the bottom is never drawn, because on a solid
 *  coin you cannot see it — which is also what stops a stack of four reading
 *  as one cylinder with lines in it. */
export function disc(x: number, y: number, z: number, r: number,
                     o: { h?: number; opacity?: number } = {}): SVGGElement {
  const g = el<SVGGElement>('g', {})
  const [cx, cy] = iso(x, y, z)
  const rx = r * K * 2
  const h = o.h ?? 0
  const op = o.opacity ?? 1
  const n = (v: number) => v.toFixed(2)

  if (h > 0) {
    g.appendChild(line(
      `M${n(cx - rx)} ${n(cy)}` +
      `A${n(rx)} ${n(r)} 0 0 0 ${n(cx + rx)} ${n(cy)}` +
      `L${n(cx + rx)} ${n(cy - h)}` +
      `A${n(rx)} ${n(r)} 0 0 1 ${n(cx - rx)} ${n(cy - h)}Z`,
      { opacity: op * 0.7, fill: GROUND }))
  }
  const e = el<SVGEllipseElement>('ellipse', {
    cx: n(cx), cy: n(cy - h), rx: n(rx), ry: n(r),
    stroke: 'currentColor', 'stroke-width': '1.1',
    'vector-effect': 'non-scaling-stroke', opacity: String(op),
  })
  e.style.fill = GROUND
  g.appendChild(e)
  return g
}

/** The inner outline of a top face — a second edge a little way inside the
 *  first. Every plate in the reference has one: it is what makes a slab read
 *  as a machined part rather than as a rectangle, and it costs one path. */
export function inset(o: Slab & { by?: number } = {}): SVGPathElement {
  const { x = 0, y = 0, z = 0, w = 6, d = 6, h = 0.7, by = 0.55 } = o
  const c = Math.min(0.9, (w - by * 2) / 4, (d - by * 2) / 4)
  const X = x + by, Y = y + by, W = w - by * 2, D = d - by * 2
  return line(poly([
    iso(X + c, Y, z + h), iso(X + W - c, Y, z + h),
    iso(X + W, Y + c, z + h), iso(X + W, Y + D - c, z + h),
    iso(X + W - c, Y + D, z + h), iso(X + c, Y + D, z + h),
    iso(X, Y + D - c, z + h), iso(X, Y + c, z + h),
  ]), { opacity: 0.35 })
}

/** The four corner guides that hold an exploded stack together. One dashed
 *  vertical at each corner of a plate, running from the bottom of the stack to
 *  the top of it — which is the drawing saying "these are the same object,
 *  pulled apart" rather than "here are some plates". */
export function corners(o: { x: number; y: number; w: number; d: number;
                             z0: number; z1: number; in?: number }): SVGGElement {
  const g = el<SVGGElement>('g', {})
  const k = o.in ?? 0.35
  for (const [cx, cy] of [
    [o.x + k, o.y + k], [o.x + o.w - k, o.y + k],
    [o.x + o.w - k, o.y + o.d - k], [o.x + k, o.y + o.d - k],
  ]) g.appendChild(guide(cx, cy, o.z0, o.z1))
  return g
}

/** The concentric ring on a coin's face. */
export function ring(x: number, y: number, z: number, r: number,
                     opacity = 0.4): SVGEllipseElement {
  const [cx, cy] = iso(x, y, z)
  return el<SVGEllipseElement>('ellipse', {
    cx: cx.toFixed(2), cy: cy.toFixed(2),
    rx: (r * K * 2).toFixed(2), ry: r.toFixed(2),
    fill: 'none', stroke: 'currentColor', 'stroke-width': '1.1',
    'vector-effect': 'non-scaling-stroke', opacity: String(opacity),
  })
}

/** A short flat stroke lying on a top face, in the face's own directions. The
 *  rows on a list, the ticks on a scale, the lines on a bill. */
export function mark(d0: number, d1: number, sd: number, z: number,
                     o: { dash?: string; opacity?: number } = {}): SVGPathElement {
  const at2 = (d: number): P => iso(d + sd, sd - d, z)
  return line(`M${at(at2(d0))}L${at(at2(d1))}`,
              { dash: o.dash, opacity: o.opacity ?? 0.5 })
}

/** Hatching on a near face: a few short parallel strokes at the face's own
 *  angle. It is the oldest mark in technical drawing and it does two things at
 *  once here — says which side of the object is the near one, and gives the
 *  eye something to read at the size these are drawn. */
export function hatch(o: { x: number; y: number; z: number; w: number; h: number;
                           side: 'front' | 'right'; n?: number; opacity?: number }): SVGGElement {
  const g = el<SVGGElement>('g', {})
  const n = o.n ?? 5
  const op = o.opacity ?? 0.28
  for (let i = 1; i <= n; i++) {
    const t = (i / (n + 1)) * o.w
    // Each stroke runs from a point along the top edge down to the bottom
    // edge, offset along it, which is what makes hatching read as a slope
    // across a face rather than as a row of verticals.
    const a = o.side === 'front' ? iso(o.x + t, o.y, o.z + o.h) : iso(o.x, o.y + t, o.z + o.h)
    const b = o.side === 'front'
      ? iso(o.x + t - Math.min(0.5, o.h * 0.8), o.y, o.z)
      : iso(o.x, o.y + t - Math.min(0.5, o.h * 0.8), o.z)
    g.appendChild(line(`M${at(a)}L${at(b)}`, { opacity: op }))
  }
  return g
}

/** A pin standing between two plates, at a corner. An exploded stack that is
 *  only plates is a stack of plates; one with the things that join them drawn
 *  as well is an object taken apart. */
export function pin(x: number, y: number, z: number, h: number, r = 0.22): SVGGElement {
  const g = el<SVGGElement>('g', {})
  const [cx, cy] = iso(x, y, z)
  const rx = r * K * 2
  const n = (v: number) => v.toFixed(2)
  g.appendChild(line(
    `M${n(cx - rx)} ${n(cy)}A${n(rx)} ${n(r)} 0 0 0 ${n(cx + rx)} ${n(cy)}` +
    `L${n(cx + rx)} ${n(cy - h)}A${n(rx)} ${n(r)} 0 0 1 ${n(cx - rx)} ${n(cy - h)}Z`,
    { opacity: 0.6, fill: GROUND }))
  const e = el<SVGEllipseElement>('ellipse', {
    cx: n(cx), cy: n(cy - h), rx: n(rx), ry: n(r),
    stroke: 'currentColor', 'stroke-width': '1.1',
    'vector-effect': 'non-scaling-stroke', opacity: '0.7',
  })
  e.style.fill = GROUND
  g.appendChild(e)
  return g
}

/** The outline a floating part would leave on the surface below it. Dashed,
 *  because it is not a thing — it is where a thing goes. */
export function footprint(o: { x: number; y: number; z: number; w: number; d: number }): SVGPathElement {
  const { x, y, z, w, d } = o
  const c = Math.min(0.9, w / 4, d / 4)
  return line(poly([
    iso(x + c, y, z), iso(x + w - c, y, z),
    iso(x + w, y + c, z), iso(x + w, y + d - c, z),
    iso(x + w - c, y + d, z), iso(x + c, y + d, z),
    iso(x, y + d - c, z), iso(x, y + c, z),
  ]), { dash: '2 4', opacity: 0.3 })
}

/** A leader: a short line off a part, ending in a dot. What a diagram uses to
 *  point at something without labelling it. */
export function leader(x: number, y: number, z: number, dx: number, dy: number): SVGGElement {
  const g = el<SVGGElement>('g', {})
  const [ax, ay] = iso(x, y, z)
  const bx = ax + dx, by = ay + dy
  g.appendChild(line(`M${ax.toFixed(2)} ${ay.toFixed(2)}L${bx.toFixed(2)} ${by.toFixed(2)}`,
                     { opacity: 0.4 }))
  const dot = el<SVGCircleElement>('circle', {
    cx: bx.toFixed(2), cy: by.toFixed(2), r: '0.9',
    stroke: 'currentColor', 'stroke-width': '1.1',
    'vector-effect': 'non-scaling-stroke', opacity: '0.4',
  })
  dot.style.fill = 'none'
  g.appendChild(dot)
  return g
}

/** A cut in a top face — a slot, a window, a recess. The feature that says a
 *  plate was machined rather than drawn as a rectangle.
 *
 *  A top face is a diamond, not a rectangle: a point at (d, s) is on it only
 *  while |d| + |s| is inside the half-width. Forget that and the slot runs out
 *  past the plate's edge and hangs in the air, which is how the first version
 *  of this drew three of them. `fits` is the caller's half-width; pass it and
 *  the ends are pulled in to stay on the plate. */
export function slot(d0: number, d1: number, sd: number, z: number,
                     wide = 0.55, fits = Infinity): SVGPathElement {
  if (fits !== Infinity) {
    const room = Math.max(0.3, fits - Math.abs(sd) - wide)
    d0 = Math.max(d0, -room); d1 = Math.min(d1, room)
  }
  const f = (dd: number, ss: number): P => iso(dd + ss, ss - dd, z)
  const pts: P[] = [
    f(d0, sd - wide), f(d1, sd - wide), f(d1, sd + wide), f(d0, sd + wide),
  ]
  return line(poly(pts), { opacity: 0.45 })
}

/** A fixing on a face: a small circle with a cross in it. Four of them round a
 *  plate and the plate is a part. */
export function screw(d: number, sd: number, z: number, r = 0.28): SVGGElement {
  const g = el<SVGGElement>('g', {})
  const [cx, cy] = iso(d + sd, sd - d, z)
  const e = el<SVGEllipseElement>('ellipse', {
    cx: cx.toFixed(2), cy: cy.toFixed(2),
    rx: (r * K * 2).toFixed(2), ry: r.toFixed(2),
    fill: 'none', stroke: 'currentColor', 'stroke-width': '1.1',
    'vector-effect': 'non-scaling-stroke', opacity: '0.5',
  })
  g.appendChild(e)
  g.appendChild(line(
    `M${(cx - r * K * 1.4).toFixed(2)} ${(cy + r * 0.7).toFixed(2)}` +
    `L${(cx + r * K * 1.4).toFixed(2)} ${(cy - r * 0.7).toFixed(2)}`, { opacity: 0.5 }))
  return g
}

/** A dimension line: a run with a tick at each end, set off to one side. It is
 *  the mark that says a drawing is measuring something rather than picturing
 *  it, and one per picture is enough to say so. */
export function dim(a: P, b: P, tick = 1.4): SVGGElement {
  const g = el<SVGGElement>('g', {})
  const o = { opacity: 0.35 }
  g.appendChild(line(`M${at(a)}L${at(b)}`, o))
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * (tick / 2), ny = (dx / len) * (tick / 2)
  for (const [px, py] of [a, b]) {
    g.appendChild(line(
      `M${(px - nx).toFixed(2)} ${(py - ny).toFixed(2)}` +
      `L${(px + nx).toFixed(2)} ${(py + ny).toFixed(2)}`, o))
  }
  return g
}

/** The dashed line that says two things are the same thing at two heights.
 *  Every exploded drawing in the reference has them and they are the reason
 *  the stack reads as one object rather than as several. */
export function guide(x: number, y: number, z0: number, z1: number): SVGPathElement {
  const a = iso(x, y, z0)
  const b = iso(x, y, z1)
  return line(`M${at(a)}L${at(b)}`, { dash: '2 5', opacity: 0.45, width: 1 })
}

/* ------------------------------------------------------------------ frame -- */

export interface Drawn {
  /** What to draw, in iso units, with the origin wherever the drawing wants. */
  body: (g: SVGGElement) => void
  /** The box to fit, in screen units after projection. */
  box: [number, number, number, number]
}

/** Wrap a drawing in an svg that scales to whatever it is put in.
 *
 *  `aria-hidden`, always: every one of these sits beside words that already
 *  say the thing, and a screen reader announcing "image" over a decoration is
 *  a screen reader reading out the wallpaper. */
export function draw(d: Drawn, name = ''): SVGSVGElement {
  const svg = el<SVGSVGElement>('svg', {
    viewBox: d.box.join(' '),
    width: '100%',
    height: '100%',
    preserveAspectRatio: 'xMidYMid meet',
    'aria-hidden': 'true',
    focusable: 'false',
  })
  // Its own name, for the exporter that rebuilds the design file: eleven
  // drawings are eleven components there, and a converter that cannot name
  // the one in front of it has to inline three thousand characters of path.
  if (name) svg.setAttribute('data-art', name)
  const g = el<SVGGElement>('g', {})
  d.body(g)
  svg.appendChild(g)
  return svg
}
