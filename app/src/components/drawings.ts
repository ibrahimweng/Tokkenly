import { slab, disc, guide, line, iso, draw, inset, corners, ring, mark,
         hatch, pin, footprint, slot, screw, dim, type Drawn } from './iso'

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

const art = (d: Drawn, name: string): Art => () => draw(d, name)

/* ------------------------------------------------------- the four doors -- */

/** Invest. A pile of plates with one lifted clear of it: the share you own,
 *  out of the market it came from. Plates are shares everywhere in this set,
 *  which is what lets Borrow be a pile of them with cash coming off. */
export const INVEST = art({
  box: [-13, -17, 26, 28],
  body: (g) => {
    const W = 7.2
    // The plinth the whole thing stands on, stepped: a second thinner slab
    // just under the first, which is what gives a base an edge rather than a
    // band.
    g.appendChild(slab({ x: -4.8, y: -4.8, z: -2.2, w: 9.6, d: 9.6, h: 0.45 }))
    g.appendChild(hatch({ x: -4.8, y: -4.8, z: -2.2, w: 9.6, h: 0.45, side: 'front', n: 7 }))
    g.appendChild(slab({ x: -4.3, y: -4.3, z: -1.75, w: 8.6, d: 8.6, h: 0.5 }))
    g.appendChild(hatch({ x: -4.3, y: -4.3, z: -1.75, w: 8.6, h: 0.5, side: 'right', n: 5 }))
    // Four fixings on the plinth's face, at the corners the guides run up.
    for (const [d, sd] of [[-3.1, 0], [3.1, 0], [0, -3.1], [0, 3.1]]) {
      g.appendChild(screw(d, sd, -1.25))
    }
    g.appendChild(corners({ x: -3.6, y: -3.6, w: W, d: W, z0: -1.25, z1: 7.2, in: 0.5 }))
    for (let i = 0; i < 3; i++) {
      const z = i * 1.5
      g.appendChild(slab({ x: -3.6, y: -3.6, z, w: W, d: W, h: 0.55 }))
      g.appendChild(inset({ x: -3.6, y: -3.6, z, w: W, d: W, h: 0.55, by: 0.7 }))
      g.appendChild(hatch({ x: -3.6, y: -3.6, z, w: W, h: 0.55, side: 'front', n: 5 }))
      // Each plate is a certificate: a slot cut in it, a rule under the slot,
      // and the pins that carry the one above.
      g.appendChild(slot(-1.8, 0.4, -0.8, z + 0.55, 0.4, 2.9))
      g.appendChild(mark(-1.7, 1.7, 0.6, z + 0.55, { opacity: 0.3 }))
      if (i < 2) {
        g.appendChild(pin(-2.7, -2.7, z + 0.55, 0.95))
        g.appendChild(pin(2.7, 2.7, z + 0.55, 0.95))
      }
    }
    const top = 6.6
    g.appendChild(slab({ x: -3.6, y: -3.6, z: top, w: W, d: W, h: 0.7 }))
    g.appendChild(inset({ x: -3.6, y: -3.6, z: top, w: W, d: W, h: 0.7, by: 0.7 }))
    g.appendChild(hatch({ x: -3.6, y: -3.6, z: top, w: W, h: 0.7, side: 'front', n: 5 }))
    g.appendChild(hatch({ x: -3.6, y: -3.6, z: top, w: W, h: 0.7, side: 'right', n: 4 }))
    // The mark on the lifted plate: a line going up and to the right, which is
    // the one gesture this product uses for a thing that grew.
    const z = top + 0.75
    g.appendChild(line(
      `M${fmt(face(-2.1, 0.8, z))}L${fmt(face(-0.7, 0.15, z))}` +
      `L${fmt(face(0.2, 0.55, z))}L${fmt(face(1.9, -0.6, z))}`, { opacity: 0.9 }))
    g.appendChild(line(
      `M${fmt(face(0.95, -0.6, z))}L${fmt(face(1.9, -0.6, z))}` +
      `L${fmt(face(1.9, 0.15, z))}`, { opacity: 0.9 }))
    g.appendChild(mark(-2.1, 1.9, 1.35, z, { dash: '2 3', opacity: 0.28 }))
    // And the one dimension in the drawing: how far the share was lifted.
    g.appendChild(dim(iso(4.6, -4.6, 0.55), iso(4.6, -4.6, top)))
  },
}, 'INVEST')

/** Wallet. Three plates fanned apart — the three balances — over a base that
 *  holds them. Fanned rather than stacked because they are three things you
 *  have at once, not one thing on top of another. */
export const WALLET = art({
  box: [-13, -19, 26, 29],
  body: (g) => {
    g.appendChild(slab({ x: -4.6, y: -4.6, z: -1.1, w: 9.2, d: 9.2, h: 0.45 }))
    g.appendChild(hatch({ x: -4.6, y: -4.6, z: -1.1, w: 9.2, h: 0.45, side: 'front', n: 7 }))
    g.appendChild(slab({ x: -4, y: -4, z: 0, w: 8, d: 8, h: 0.6 }))
    g.appendChild(inset({ x: -4, y: -4, z: 0, w: 8, d: 8, h: 0.6, by: 0.7 }))
    g.appendChild(hatch({ x: -4, y: -4, z: 0, w: 8, h: 0.6, side: 'front', n: 6 }))
    // The base had three bays cut in it, one per balance. They were the right
    // idea on the wrong drawing: the fan sits over the middle of the base, so
    // the only part of each bay you could see was the end sticking out past a
    // plate — which reads as a plank behind the stack, not a recess under it.
    // Invest keeps its slots because there the plate carrying them is on top.
    const fan: [number, number, number][] = [[-3.4, -1, 2.4], [-2.2, -2.2, 4.8], [-1, -3.4, 7.2]]
    fan.forEach(([x, y, z], i) => {
      g.appendChild(guide(x + 2.5, y + 2.5, 0.6, z))
      g.appendChild(slab({ x, y, z, w: 5, d: 5, h: 0.5 }))
      g.appendChild(inset({ x, y, z, w: 5, d: 5, h: 0.5, by: 0.6 }))
      g.appendChild(hatch({ x, y, z, w: 5, h: 0.5, side: 'front', n: 4 }))
      // One balance per plate, written as a rule that gets shorter down the
      // fan: three amounts, largest on top, which is the order the wallet
      // itself puts them in.
      const cd = (x + 2.5) - (y + 2.5)
      const cs = (x + 2.5) + (y + 2.5)
      const len = 1.5 - i * 0.35
      g.appendChild(mark((cd / 2) - len, (cd / 2) + len, cs / 2 - 0.45, z + 0.5, { opacity: 0.4 }))
      g.appendChild(mark((cd / 2) - len * 0.9, (cd / 2) + len * 0.1, cs / 2 + 0.3, z + 0.5,
                         { opacity: 0.22 }))
      g.appendChild(screw((cd / 2) + 1.05, cs / 2 + 0.75, z + 0.5, 0.22))
    })
    g.appendChild(disc(1.4, -0.9, 8.3, 1.2, { h: 0.4, opacity: 0.85 }))
    g.appendChild(ring(1.4, -0.9, 8.7, 0.62, 0.45))
    g.appendChild(ring(1.4, -0.9, 8.7, 0.95, 0.28))
  },
}, 'WALLET')

/** Borrow & Lend. A balance: two discs at different heights on one axis, which
 *  is what borrowing against something actually is. */
export const GROW = art({
  box: [-12.5, -15, 25, 25],
  body: (g) => {
    // A plinth, stepped, so the post stands on something rather than ending.
    g.appendChild(slab({ x: -4, y: -4, z: -1.6, w: 8, d: 8, h: 0.45 }))
    g.appendChild(hatch({ x: -4, y: -4, z: -1.6, w: 8, h: 0.45, side: 'front', n: 6 }))
    g.appendChild(slab({ x: -3.4, y: -3.4, z: -1.15, w: 6.8, d: 6.8, h: 0.5 }))
    g.appendChild(hatch({ x: -3.4, y: -3.4, z: -1.15, w: 6.8, h: 0.5, side: 'right', n: 4 }))
    for (const [d, sd] of [[-2.2, 0], [2.2, 0]]) g.appendChild(screw(d, sd, -0.65))
    g.appendChild(slab({ x: -2.8, y: -2.8, z: 0, w: 5.6, d: 5.6, h: 0.6 }))
    g.appendChild(inset({ x: -2.8, y: -2.8, z: 0, w: 5.6, d: 5.6, h: 0.6, by: 0.55 }))
    g.appendChild(hatch({ x: -2.8, y: -2.8, z: 0, w: 5.6, h: 0.6, side: 'front', n: 4 }))
    // The collar the post turns in.
    g.appendChild(ring(0, 0, 0.6, 0.85, 0.45))
    g.appendChild(ring(0, 0, 0.6, 1.35, 0.25))
    // The post stops at the foot of the fulcrum rather than at the beam. Run
    // all the way up it turns the wedge into an arrowhead and the whole thing
    // into an arrow pointing at nothing.
    g.appendChild(line(`M${fmt(iso(0, 0, 0.6))}L${fmt(iso(0, 0, 6.3))}`, { opacity: 0.9 }))
    // The beam runs along the face direction, not along x. A beam along x is a
    // diagonal on screen, and a balance whose beam is a diagonal reads as a
    // tipped balance however level it is in the projection. This one is level
    // where it counts, which is on the screen — and neither side of this
    // screen is the wrong one to be on.
    const arm = 3.6
    g.appendChild(line(
      `M${fmt(face(-arm, 0, 7.4))}L${fmt(face(arm, 0, 7.4))}`, { opacity: 0.9 }))
    // The pivot the beam turns on, as a block rather than a wedge. A triangle
    // under a beam with a post running up into it is an arrow, whatever it was
    // drawn to be — and an arrow pointing at nothing is worse than no fulcrum.
    g.appendChild(slab({ x: -0.9, y: -0.9, z: 6.3, w: 1.8, d: 1.8, h: 0.75 }))
    // The graduations hang below the beam, where a scale's do. Above it they
    // are a comb sitting on a stick.
    for (const d of [-2.6, -1.9, -1.2, 1.2, 1.9, 2.6]) {
      const [tx, ty] = face(d, 0, 7.4)
      g.appendChild(line(`M${tx.toFixed(2)} ${ty.toFixed(2)}` +
        `L${tx.toFixed(2)} ${(ty + 0.5).toFixed(2)}`, { opacity: 0.3 }))
    }
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
      put(ring(0, 0, 0, 0.48, 0.4), 1.62 - (n - 1) * 0.5)
    }
    pan(-arm, 2)
    pan(arm, 1)
  },
}, 'GROW')

/** Spend. A meter face on a plate, with a plate of bills under it. The dial is
 *  the one thing in the set drawn from the front rather than in projection,
 *  because a dial read at an angle is a dial nobody can read. */
export const SPEND = art({
  box: [-12.5, -15, 25, 25],
  body: (g) => {
    g.appendChild(slab({ x: -5, y: -5, z: -1.9, w: 10, d: 10, h: 0.45 }))
    g.appendChild(hatch({ x: -5, y: -5, z: -1.9, w: 10, h: 0.45, side: 'front', n: 7 }))
    g.appendChild(slab({ x: -4.4, y: -4.4, z: -1.45, w: 8.8, d: 8.8, h: 0.5 }))
    g.appendChild(hatch({ x: -4.4, y: -4.4, z: -1.45, w: 8.8, h: 0.5, side: 'right', n: 5 }))
    for (const [d, sd] of [[-3.2, 0], [3.2, 0], [0, -3.2], [0, 3.2]]) {
      g.appendChild(screw(d, sd, -0.95))
    }
    g.appendChild(corners({ x: -3.6, y: -3.6, w: 7.2, d: 7.2, z0: 0.3, z1: 4.4, in: 0.4 }))
    g.appendChild(slab({ x: -4, y: -4, z: 0, w: 8, d: 8, h: 0.6 }))
    g.appendChild(inset({ x: -4, y: -4, z: 0, w: 8, d: 8, h: 0.6, by: 0.7 }))
    g.appendChild(hatch({ x: -4, y: -4, z: 0, w: 8, h: 0.6, side: 'front', n: 6 }))
    // The bill under the meter: three rows and a total rule, which is what a
    // bill is at this size.
    // The bill: a window at the head of it and three rows under.
    g.appendChild(slot(-1.9, 1.9, -2.5, 0.6, 0.4, 3.2))
    for (let i = 0; i < 3; i++) {
      g.appendChild(mark(-1.9, i === 2 ? 0.1 : 1.1, -0.9 + i * 1.1, 0.6, { opacity: 0.3 }))
    }
    g.appendChild(footprint({ x: -3.4, y: -3.4, z: 0.6, w: 6.8, d: 6.8 }))
    g.appendChild(slab({ x: -3.4, y: -3.4, z: 4.2, w: 6.8, d: 6.8, h: 0.7 }))
    g.appendChild(inset({ x: -3.4, y: -3.4, z: 4.2, w: 6.8, d: 6.8, h: 0.7, by: 0.6 }))
    g.appendChild(hatch({ x: -3.4, y: -3.4, z: 4.2, w: 6.8, h: 0.7, side: 'front', n: 5 }))
    // The dial, on the plate rather than in front of it: every point of it is
    // placed in the face's own directions, so it lies down with the plate.
    const z = 4.9
    g.appendChild(line(faceArc(0, 0.9, 2.2, Math.PI, 2 * Math.PI, z), { opacity: 0.9 }))
    g.appendChild(line(faceArc(0, 0.9, 1.5, Math.PI, 2 * Math.PI, z), { opacity: 0.3 }))
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI
      const long = i % 2 === 0
      g.appendChild(line(
        `M${fmt(face(Math.cos(a) * 2.2, 0.9 + Math.sin(a) * 2.2, z))}` +
        `L${fmt(face(Math.cos(a) * (long ? 1.65 : 1.9), 0.9 + Math.sin(a) * (long ? 1.65 : 1.9), z))}`,
        { opacity: long ? 0.55 : 0.32 }))
    }
    // The needle, pointing where a bill you have already paid points, on its
    // own little hub.
    g.appendChild(line(
      `M${fmt(face(0, 0.9, z))}L${fmt(face(1.1, -0.35, z))}`, { opacity: 0.95 }))
    g.appendChild(ring(0.9, -0.9, z, 0.22, 0.8))
  },
}, 'SPEND')

/* --------------------------------------------------- the two grow cards -- */

/** Lend. Coins going onto a pile — money you put somewhere and left. */
export const LEND = art({
  box: [-14, -16, 28, 27],
  body: (g) => {
    g.appendChild(slab({ x: -5.4, y: -5.4, z: -1.8, w: 10.8, d: 10.8, h: 0.45 }))
    g.appendChild(hatch({ x: -5.4, y: -5.4, z: -1.8, w: 10.8, h: 0.45, side: 'front', n: 8 }))
    g.appendChild(slab({ x: -4.9, y: -4.9, z: -1.35, w: 9.8, d: 9.8, h: 0.5 }))
    g.appendChild(hatch({ x: -4.9, y: -4.9, z: -1.35, w: 9.8, h: 0.5, side: 'right', n: 5 }))
    for (const [d, sd] of [[-3.6, 0], [3.6, 0]]) g.appendChild(screw(d, sd, -0.85))
    g.appendChild(slab({ x: -4.5, y: -4.5, z: 0, w: 9, d: 9, h: 0.6 }))
    g.appendChild(inset({ x: -4.5, y: -4.5, z: 0, w: 9, d: 9, h: 0.6, by: 0.8 }))
    g.appendChild(hatch({ x: -4.5, y: -4.5, z: 0, w: 9, h: 0.6, side: 'front', n: 7 }))
    for (let i = 0; i < 4; i++) {
      g.appendChild(disc(-1.8, 1.2, 0.6 + i * 0.62, 2, { h: 0.5, opacity: 1 - i * 0.05 }))
    }
    // The milled face of the top coin, and the one under the coin still in the
    // air: a disc with nothing on it is a disc, a disc with a ring on it is
    // money.
    g.appendChild(ring(-1.8, 1.2, 0.6 + 3 * 0.62 + 0.5, 1, 0.4))
    g.appendChild(guide(2.4, -1.8, 0.6, 6.4))
    g.appendChild(disc(2.4, -1.8, 6.4, 2, { h: 0.5, opacity: 0.85 }))
    g.appendChild(ring(2.4, -1.8, 6.9, 1, 0.4))
    // Where it lands, drawn on the base as the outline it will cover. A
    // dashed arc through the air was read as a scratch across the plate.
    g.appendChild(ring(2.4, -1.8, 0.6, 2, 0.3))
  },
}, 'LEND')

/** Borrow. The shares stay, and cash comes off them.
 *
 *  Plates are shares everywhere in this set — that is what INVEST is a stack
 *  of — and discs are cash, which is what LEND is a pile of. So this is the
 *  one drawing that has both: the pile of plates still standing, and a coin
 *  lifted clear of it. Drawn with coins on both sides, as it was, it was the
 *  same picture as Lend with the parts moved, which is the one thing a pair of
 *  cards side by side cannot afford. */
export const BORROW = art({
  box: [-14, -17, 28, 28],
  body: (g) => {
    g.appendChild(slab({ x: -5.4, y: -5.4, z: -1.8, w: 10.8, d: 10.8, h: 0.45 }))
    g.appendChild(hatch({ x: -5.4, y: -5.4, z: -1.8, w: 10.8, h: 0.45, side: 'front', n: 8 }))
    g.appendChild(slab({ x: -4.9, y: -4.9, z: -1.35, w: 9.8, d: 9.8, h: 0.5 }))
    g.appendChild(hatch({ x: -4.9, y: -4.9, z: -1.35, w: 9.8, h: 0.5, side: 'right', n: 5 }))
    for (const [d, sd] of [[-3.6, 0], [3.6, 0]]) g.appendChild(screw(d, sd, -0.85))
    g.appendChild(slab({ x: -4.5, y: -4.5, z: 0, w: 9, d: 9, h: 0.6 }))
    g.appendChild(inset({ x: -4.5, y: -4.5, z: 0, w: 9, d: 9, h: 0.6, by: 0.8 }))
    g.appendChild(hatch({ x: -4.5, y: -4.5, z: 0, w: 9, h: 0.6, side: 'front', n: 7 }))
    g.appendChild(ring(2.4, -2, 0.6, 1.9, 0.3))
    for (let i = 0; i < 3; i++) {
      const z = 0.6 + i * 1.15
      if (i < 2) {
        g.appendChild(pin(-3.4, 0, z + 0.5, 0.65))
        g.appendChild(pin(-0.6, 3.8, z + 0.5, 0.65))
      }
      g.appendChild(slab({ x: -4, y: -0.6, z, w: 5, d: 5, h: 0.5 }))
      g.appendChild(inset({ x: -4, y: -0.6, z, w: 5, d: 5, h: 0.5, by: 0.6 }))
      // The same rule and slot Invest's plates carry, because these are the
      // same thing: shares, standing where they were, with cash coming off.
      g.appendChild(slot(-3.4, -2.1, 1.0, z + 0.5, 0.32, 2.0))
      g.appendChild(mark(-3.5, -1.5, 1.85, z + 0.5, { opacity: 0.3 }))
    }
    g.appendChild(guide(2.4, -2, 1.4, 6.6))
    g.appendChild(disc(2.4, -2, 6.6, 1.9, { h: 0.55 }))
    g.appendChild(ring(2.4, -2, 7.15, 0.95, 0.4))
  },
}, 'BORROW')

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
  box: [-11, -11, 22, 18],
  body: (g) => {
    g.appendChild(slab({ x: -4.7, y: -4.7, z: -0.85, w: 9.4, d: 9.4, h: 0.4 }))
    g.appendChild(hatch({ x: -4.7, y: -4.7, z: -0.85, w: 9.4, h: 0.4, side: 'front', n: 6 }))
    g.appendChild(slab({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5 }))
    g.appendChild(inset({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5, by: 0.7 }))
    g.appendChild(hatch({ x: -4.2, y: -4.2, z: 0, w: 8.4, h: 0.5, side: 'right', n: 4 }))
    // Three rows that are not there, on the face, in the direction rows run —
    // each with the short second line a row in this product actually has.
    for (let i = 0; i < 3; i++) {
      const sd = -1.9 + i * 1.9
      g.appendChild(mark(-2.4, 2.4, sd, 0.5, { dash: '2 4', opacity: 0.5 }))
      g.appendChild(mark(-2.4, -0.4, sd + 0.62, 0.5, { dash: '2 4', opacity: 0.28 }))
    }
  },
}, 'NO_ACTIVITY')

/** You hold nothing. The pile from INVEST with only its base left, and the two
 *  plates that would sit on it drawn as the ghosts they are. */
export const NO_HOLDINGS = art({
  box: [-10, -12, 20, 19],
  body: (g) => {
    // One guide up the middle, not four up the corners: four dashed verticals
    // through two dashed plates is a cage, and a cage is a different drawing.
    g.appendChild(guide(0, 0, 0.5, 5.4))
    g.appendChild(slab({ x: -3.7, y: -3.7, z: -0.85, w: 7.4, d: 7.4, h: 0.4 }))
    g.appendChild(hatch({ x: -3.7, y: -3.7, z: -0.85, w: 7.4, h: 0.4, side: 'front', n: 5 }))
    g.appendChild(slab({ x: -3.2, y: -3.2, z: 0, w: 6.4, d: 6.4, h: 0.5 }))
    g.appendChild(inset({ x: -3.2, y: -3.2, z: 0, w: 6.4, d: 6.4, h: 0.5, by: 0.6 }))
    g.appendChild(hatch({ x: -3.2, y: -3.2, z: 0, w: 6.4, h: 0.5, side: 'right', n: 4 }))
    g.appendChild(slab({ x: -3.2, y: -3.2, z: 2.9, w: 6.4, d: 6.4, h: 0.5, ghost: true }))
    g.appendChild(slab({ x: -3.2, y: -3.2, z: 5.4, w: 6.4, d: 6.4, h: 0.5, ghost: true }))
  },
}, 'NO_HOLDINGS')

/** The bucket, with nothing in it. */
export const NO_BUCKET = art({
  box: [-11, -12, 22, 19],
  body: (g) => {
    g.appendChild(disc(0, 0, 0, 3.4, { h: 2.6, opacity: 0.8 }))
    for (let i = -2; i <= 2; i++) {
      const x = i * 1.9
      const dy = Math.sqrt(Math.max(0, 1 - (x / 5.9) ** 2)) * 3.4
      g.appendChild(line(`M${x.toFixed(2)} ${(dy - 0.2).toFixed(2)}L${x.toFixed(2)} ${(dy - 2.2).toFixed(2)}`,
                         { opacity: 0.2 }))
    }
    // The rim, and the line inside it that says how empty it is.
    g.appendChild(ring(0, 0, 2.6, 2.9, 0.35))
    g.appendChild(guide(0, 0, 2.6, 6))
    g.appendChild(slab({ x: -2, y: -2, z: 4.2, w: 4, d: 4, h: 0.5, ghost: true }))
    g.appendChild(slab({ x: -2, y: -2, z: 6, w: 4, d: 4, h: 0.5, ghost: true }))
  },
}, 'NO_BUCKET')

/** Nothing matched. A list with its rows missing and a glass held over it.
 *  The glass is the one thing in the set drawn facing you rather than lying
 *  down, for the same reason a dial would be: a lens seen at an angle is an
 *  ellipse, and an ellipse is not the shape anybody means by a lens. */
export const NO_MATCH = art({
  box: [-11, -15, 22, 22],
  body: (g) => {
    g.appendChild(slab({ x: -4.7, y: -4.7, z: -0.85, w: 9.4, d: 9.4, h: 0.4 }))
    g.appendChild(hatch({ x: -4.7, y: -4.7, z: -0.85, w: 9.4, h: 0.4, side: 'front', n: 6 }))
    g.appendChild(slab({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5 }))
    g.appendChild(inset({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5, by: 0.7 }))
    g.appendChild(hatch({ x: -4.2, y: -4.2, z: 0, w: 8.4, h: 0.5, side: 'right', n: 4 }))
    for (let i = 0; i < 2; i++) {
      const sd = -1.2 + i * 2.4
      g.appendChild(mark(-2.4, 2.4, sd, 0.5, { dash: '2 4', opacity: 0.45 }))
      g.appendChild(mark(-2.4, -0.4, sd + 0.62, 0.5, { dash: '2 4', opacity: 0.25 }))
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
    // The bezel inside the glass, which is what stops a circle on a stick
    // reading as a balloon even before the handle is looked at.
    g.appendChild(line(
      `M${(cx - r * 0.72).toFixed(2)} ${cy.toFixed(2)}` +
      `A${(r * 0.72).toFixed(2)} ${(r * 0.72).toFixed(2)} 0 1 1 ${(cx - r * 0.72 + 0.01).toFixed(2)} ${(cy + 0.01).toFixed(2)}Z`,
      { opacity: 0.3 }))
    g.appendChild(line(
      `M${(cx + r * 0.71).toFixed(2)} ${(cy + r * 0.71).toFixed(2)}` +
      `L${(cx + r * 1.75).toFixed(2)} ${(cy + r * 1.75).toFixed(2)}`,
      { opacity: 0.9, width: 1.6 }))
  },
}, 'NO_MATCH')

/** Nobody by that name. The same construction as the search with nothing in
 *  it, and a person held over it instead of a glass — dashed, because the
 *  whole of what this picture says is that they are not there. */
export const NO_PEOPLE = art({
  box: [-11, -14, 22, 21],
  body: (g) => {
    g.appendChild(slab({ x: -4.7, y: -4.7, z: -0.85, w: 9.4, d: 9.4, h: 0.4 }))
    g.appendChild(hatch({ x: -4.7, y: -4.7, z: -0.85, w: 9.4, h: 0.4, side: 'front', n: 6 }))
    g.appendChild(slab({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5 }))
    g.appendChild(inset({ x: -4.2, y: -4.2, z: 0, w: 8.4, d: 8.4, h: 0.5, by: 0.7 }))
    g.appendChild(hatch({ x: -4.2, y: -4.2, z: 0, w: 8.4, h: 0.5, side: 'right', n: 4 }))
    // The row their name would be on, if there were one.
    g.appendChild(mark(-2.4, 2.4, 1.5, 0.5, { dash: '2 4', opacity: 0.35 }))
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
}, 'NO_PEOPLE')

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
