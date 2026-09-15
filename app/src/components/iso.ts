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
export function draw(d: Drawn): SVGSVGElement {
  const svg = el<SVGSVGElement>('svg', {
    viewBox: d.box.join(' '),
    width: '100%',
    height: '100%',
    preserveAspectRatio: 'xMidYMid meet',
    'aria-hidden': 'true',
    focusable: 'false',
  })
  const g = el<SVGGElement>('g', {})
  d.body(g)
  svg.appendChild(g)
  return svg
}
