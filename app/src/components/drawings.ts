import { slab, disc, guide, line, iso, draw, type Drawn } from './iso'

/* ---------------------------------------------------------------------------
   The drawings.

   Eleven objects, one vocabulary. Each is a small stack of slabs, discs and
   guide lines in the projection `iso.ts` sets, and each is about the thing the
   screen it sits on is about — a share is a plate lifted off a pile, a bill is
   a plate with a meter on it, an empty list is a plate with its rows dashed.

   Two nouns carry the whole set: a plate is a share and a disc is cash. Hold
   those and a drawing nobody has seen before still reads.

   They are deliberately literal. The field they replace was abstract, which is
   what let it be both decoration and gauge and do neither well; a picture of
   the actual object cannot drift from the screen's subject because it is the
   screen's subject.

   Sizes are in iso units and the boxes are hand-fitted. A drawing that fits
   its box badly reads as a drawing floating in a card, so the numbers here
   matter more than they look.
   --------------------------------------------------------------------------- */

export type Art = () => SVGSVGElement

/** A point on a slab's top face, in the face's own two directions rather than
 *  in x and y. `d` runs right across the diamond, `s` runs down it — which is
 *  what you actually want when placing a mark on a plate, because x and y each
 *  run diagonally and a glyph laid out in them comes out sheared. */
const face = (d: number, s: number, z: number) => iso(d + s, s - d, z)

/** An arc drawn lying on a top face, as a polyline through the face's own two
 *  directions. A circle in screen coordinates over an iso plate is a circle
 *  hovering in front of the plate, not a mark on it — which is what the dial
 *  and the lens both looked like before this existed. */
function faceArc(d: number, sd: number, r: number, a0: number, a1: number,
                 z: number, n = 24): string {
  const pts: string[] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push(fmt(face(d + Math.cos(a) * r, sd + Math.sin(a) * r, z)))
  }
  return 'M' + pts.join('L')
}

const art = (d: Drawn): Art => () => draw(d)

/* ------------------------------------------------------- the four doors -- */

/** Invest. A pile of plates with one lifted clear of it: the share you own,
 *  out of the market it came from. Plates are shares everywhere in this set,
 *  which is what lets Borrow be a pile of them with cash coming off. */
export const INVEST = art({
  box: [-11, -14, 22, 23],
  body: (g) => {
    // Three, spaced. Four at half a unit apart was a solid block with lines on
    // it: the whole point of an exploded drawing is the air between the parts.
    for (let i = 0; i < 3; i++) {
      g.appendChild(slab({ x: -3.6, y: -3.6, z: i * 1.5, w: 7.2, d: 7.2, h: 0.55 }))
    }
    g.appendChild(guide(0, 0, 3.55, 6.6))
    g.appendChild(slab({ x: -3.6, y: -3.6, z: 6.6, w: 7.2, d: 7.2, h: 0.7 }))
    // The mark on the lifted plate: a line going up and to the right, which is
    // the one gesture this product uses for a thing that grew. Laid out in the
    // face's own directions so it sits on the plate rather than across it.
    const z = 7.35
    g.appendChild(line(
      `M${fmt(face(-2.1, 0.7, z))}L${fmt(face(-0.7, 0.05, z))}` +
      `L${fmt(face(0.2, 0.45, z))}L${fmt(face(1.9, -0.7, z))}`, { opacity: 0.9 }))
    g.appendChild(line(
      `M${fmt(face(0.95, -0.7, z))}L${fmt(face(1.9, -0.7, z))}` +
      `L${fmt(face(1.9, 0.05, z))}`, { opacity: 0.9 }))
  },
})

/** Wallet. Three plates fanned apart — the three balances — over a base that
 *  holds them. Fanned rather than stacked because they are three things you
 *  have at once, not one thing on top of another. */
export const WALLET = art({
  box: [-12, -17, 24, 26],
  body: (g) => {
    g.appendChild(slab({ x: -4, y: -4, z: 0, w: 8, d: 8, h: 0.6 }))
    const fan: [number, number, number][] = [[-3.4, -1, 2.4], [-2.2, -2.2, 4.8], [-1, -3.4, 7.2]]
    for (const [x, y, z] of fan) {
      g.appendChild(guide(x + 2.5, y + 2.5, 0.6, z))
      g.appendChild(slab({ x, y, z, w: 5, d: 5, h: 0.5 }))
    }
    g.appendChild(disc(1.4, -0.9, 8.3, 1.2, { h: 0.4, opacity: 0.85 }))
  },
})

/** Borrow & Lend. A balance: two discs at different heights on one axis, which
 *  is what borrowing against something actually is. */
export const GROW = art({
  box: [-12, -15, 24, 23],
  body: (g) => {
    g.appendChild(slab({ x: -2.8, y: -2.8, z: 0, w: 5.6, d: 5.6, h: 0.6 }))
    g.appendChild(line(`M${fmt(iso(0, 0, 0.6))}L${fmt(iso(0, 0, 7.4))}`, { opacity: 0.9 }))
    // The beam runs along the face direction, not along x. A beam along x is a
    // diagonal on screen, and a balance whose beam is a diagonal reads as a
    // tipped balance however level it is in the projection. This one is level
    // where it counts, which is on the screen — and neither side of this
    // screen is the wrong one to be on.
    const arm = 3.6
    g.appendChild(line(
      `M${fmt(face(-arm, 0, 7.4))}L${fmt(face(arm, 0, 7.4))}`, { opacity: 0.9 }))
    for (const d of [-arm, arm]) {
      const [px, py] = face(d, 0, 7.4)
      g.appendChild(line(`M${px.toFixed(2)} ${py.toFixed(2)}` +
        `L${px.toFixed(2)} ${(py + 1.9).toFixed(2)}`, { opacity: 0.6 }))
    }
    // What is on them: two coins one side, one the other. Enough asymmetry to
    // say the two sides are traded against each other, not enough to tip it.
    const pan = (d: number, n: number) => {
      const [px, py] = face(d, 0, 7.4)
      const put = (n2: SVGElement, dy: number) => {
        n2.setAttribute('transform', `translate(${px.toFixed(2)} ${(py + dy).toFixed(2)})`)
        g.appendChild(n2)
      }
      put(disc(0, 0, 0, 1.5, { h: 0.28 }), 1.9)
      for (let i = 0; i < n; i++) put(disc(0, 0, 0, 0.95, { h: 0.42 }), 1.62 - i * 0.5)
    }
    pan(-arm, 2)
    pan(arm, 1)
  },
})

/** Spend. A meter face on a plate, with a plate of bills under it. The dial is
 *  the one thing in the set drawn from the front rather than in projection,
 *  because a dial read at an angle is a dial nobody can read. */
export const SPEND = art({
  box: [-11, -14, 22, 22],
  body: (g) => {
    g.appendChild(slab({ x: -4, y: -4, z: 0, w: 8, d: 8, h: 0.6 }))
    g.appendChild(guide(0, 0, 0.6, 4.2))
    g.appendChild(slab({ x: -3.4, y: -3.4, z: 4.2, w: 6.8, d: 6.8, h: 0.7 }))
    // The dial, on the plate rather than in front of it: every point of it is
    // placed in the face's own directions, so it lies down with the plate.
    const z = 4.95
    g.appendChild(line(faceArc(0, 0.9, 2.2, Math.PI, 2 * Math.PI, z), { opacity: 0.9 }))
    for (let i = 0; i <= 4; i++) {
      const a = Math.PI + (i / 4) * Math.PI
      g.appendChild(line(
        `M${fmt(face(Math.cos(a) * 2.2, 0.9 + Math.sin(a) * 2.2, z))}` +
        `L${fmt(face(Math.cos(a) * 1.7, 0.9 + Math.sin(a) * 1.7, z))}`, { opacity: 0.5 }))
    }
    // The needle, pointing where a bill you have already paid points.
    g.appendChild(line(
      `M${fmt(face(0, 0.9, z))}L${fmt(face(1.1, -0.35, z))}`, { opacity: 0.95 }))
  },
})

/* --------------------------------------------------- the two grow cards -- */

/** Lend. Coins going onto a pile — money you put somewhere and left. */
export const LEND = art({
  box: [-13, -16, 26, 25],
  body: (g) => {
    g.appendChild(slab({ x: -4.5, y: -4.5, z: 0, w: 9, d: 9, h: 0.6 }))
    for (let i = 0; i < 4; i++) {
      g.appendChild(disc(-1.8, 1.2, 0.6 + i * 0.62, 2, { h: 0.5, opacity: 1 - i * 0.05 }))
    }
    g.appendChild(guide(2.4, -1.8, 2.5, 6.4))
    g.appendChild(disc(2.4, -1.8, 6.4, 2, { h: 0.5, opacity: 0.85 }))
  },
})

/** Borrow. The shares stay, and cash comes off them.
 *
 *  Plates are shares everywhere in this set — that is what INVEST is a stack
 *  of — and discs are cash, which is what LEND is a pile of. So this is the
 *  one drawing that has both: the pile of plates still standing, and a coin
 *  lifted clear of it. Drawn with coins on both sides, as it was, it was the
 *  same picture as Lend with the parts moved, which is the one thing a pair of
 *  cards side by side cannot afford. */
export const BORROW = art({
  box: [-13, -17, 26, 26],
  body: (g) => {
    g.appendChild(slab({ x: -4.5, y: -4.5, z: 0, w: 9, d: 9, h: 0.6 }))
    for (let i = 0; i < 3; i++) {
      g.appendChild(slab({ x: -4, y: -0.6, z: 0.6 + i * 1.15, w: 5, d: 5, h: 0.5 }))
    }
    g.appendChild(guide(2.4, -2, 1.4, 6.6))
    g.appendChild(disc(2.4, -2, 6.6, 1.9, { h: 0.55 }))
  },
})

/* --------------------------------------------------------- empty states -- */

/*  These are the quiet ones. An empty state is a screen apologising, so its
    drawing is smaller, lighter and built of fewer parts than a door's — the
    same vocabulary at a lower volume, rather than a different idea.

    There are five, one per empty state the product actually renders. A sixth
    was drawn — money on its way between two places — and deleted, because
    nothing draws it: the settling section does not appear at all when there is
    nothing settling, so that empty case has no screen to be empty on. */

/** Nothing has moved. The list, with its rows drawn as the dashes that mean
 *  "this is where they go" rather than "here they are". */
export const NO_ACTIVITY = art({
  box: [-11, -8, 22, 15],
  body: (g) => {
    g.appendChild(slab({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5 }))
    // Three rows that are not there, on the face, in the direction rows run.
    for (let i = 0; i < 3; i++) {
      g.appendChild(line(
        `M${fmt(face(-2.6, -1.9 + i * 1.9, 0.5))}L${fmt(face(2.6, -1.9 + i * 1.9, 0.5))}`,
        { dash: '2 4', opacity: 0.55 }))
    }
  },
})

/** You hold nothing. The pile from INVEST with only its base left, and the two
 *  plates that would sit on it drawn as the ghosts they are. */
export const NO_HOLDINGS = art({
  box: [-10, -12, 20, 18],
  body: (g) => {
    g.appendChild(slab({ x: -3.2, y: -3.2, z: 0, w: 6.4, d: 6.4, h: 0.5 }))
    g.appendChild(guide(0, 0, 0.5, 5.4))
    g.appendChild(slab({ x: -3.2, y: -3.2, z: 2.9, w: 6.4, d: 6.4, h: 0.5, ghost: true }))
    g.appendChild(slab({ x: -3.2, y: -3.2, z: 5.4, w: 6.4, d: 6.4, h: 0.5, ghost: true }))
  },
})

/** The bucket, with nothing in it. */
export const NO_BUCKET = art({
  box: [-11, -11, 22, 18],
  body: (g) => {
    g.appendChild(disc(0, 0, 0, 3.4, { h: 2.6, opacity: 0.8 }))
    g.appendChild(guide(0, 0, 2.6, 5.4))
    g.appendChild(slab({ x: -2, y: -2, z: 5.4, w: 4, d: 4, h: 0.5, ghost: true }))
  },
})

/** Nothing matched. A list with its rows missing and a glass held over it.
 *  The glass is the one thing in the set drawn facing you rather than lying
 *  down, for the same reason a dial would be: a lens seen at an angle is an
 *  ellipse, and an ellipse is not the shape anybody means by a lens. */
export const NO_MATCH = art({
  box: [-11, -14, 22, 21],
  body: (g) => {
    g.appendChild(slab({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5 }))
    for (let i = 0; i < 2; i++) {
      g.appendChild(line(
        `M${fmt(face(-2.6, -1.2 + i * 2.4, 0.5))}L${fmt(face(2.6, -1.2 + i * 2.4, 0.5))}`,
        { dash: '2 4', opacity: 0.45 }))
    }
    // The glass sits off to one side so its handle has somewhere to be. Held
    // over the middle it is a circle on a stick pointing into a plate, which
    // is a balloon.
    const cx = -2.2
    const cy = -9.4
    const r = 2.4
    g.appendChild(line(
      `M${(cx - r).toFixed(2)} ${cy.toFixed(2)}` +
      `A${r} ${r} 0 1 1 ${(cx - r + 0.01).toFixed(2)} ${(cy + 0.01).toFixed(2)}Z`,
      { opacity: 0.9 }))
    g.appendChild(line(
      `M${(cx + r * 0.71).toFixed(2)} ${(cy + r * 0.71).toFixed(2)}` +
      `L${(cx + r * 1.75).toFixed(2)} ${(cy + r * 1.75).toFixed(2)}`,
      { opacity: 0.9, width: 1.6 }))
  },
})

/** Nobody by that name. The same construction as the search with nothing in
 *  it, and a person held over it instead of a glass — dashed, because the
 *  whole of what this picture says is that they are not there. */
export const NO_PEOPLE = art({
  box: [-11, -13, 22, 20],
  body: (g) => {
    g.appendChild(slab({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5 }))
    g.appendChild(guide(0, 0, 0.5, 4.6))
    const [cx, cy] = iso(0, 0, 6.2)
    const r = 1.25
    g.appendChild(line(
      `M${(cx - r).toFixed(2)} ${(cy - 1.5).toFixed(2)}` +
      `A${r} ${r} 0 1 1 ${(cx - r + 0.01).toFixed(2)} ${(cy - 1.49).toFixed(2)}Z`,
      { dash: '3 3', opacity: 0.75 }))
    g.appendChild(line(
      `M${(cx - 2.7).toFixed(2)} ${(cy + 2.6).toFixed(2)}` +
      `A2.7 2.7 0 0 1 ${(cx + 2.7).toFixed(2)} ${(cy + 2.6).toFixed(2)}`,
      { dash: '3 3', opacity: 0.75 }))
  },
})

/* A local helper, kept out of iso.ts because it is only ever needed where a
   drawing writes a path by hand rather than through a shape. */
function fmt(p: [number, number]): string {
  return `${p[0].toFixed(2)} ${p[1].toFixed(2)}`
}

/** Every empty state's drawing, by what is empty. */
export const EMPTY: Record<string, Art> = {
  activity: NO_ACTIVITY,
  holdings: NO_HOLDINGS,
  bucket: NO_BUCKET,
  search: NO_MATCH,
  people: NO_PEOPLE,
}
