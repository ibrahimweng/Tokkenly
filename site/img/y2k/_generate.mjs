/* Tokkenly's Y2K sticker set.

   Sixteen fintech objects in the turn-of-the-millennium idiom: chrome, aqua
   gloss, hot pink and electric blue, pixel and sparkle accents. Each one wears
   the same white die-cut keyline as the mascot set — the same drawing again
   with every stroke widened by twice the band, painted white, sitting behind
   at an offset. Overlapping white shapes union for free, so there is no
   boolean work and no SVG filter, which matters because Figma's SVG import
   drops filters. Gradients it keeps, which is why chrome is safe.

   The restraint is deliberate: each sticker spends two or three Y2K signals,
   never all of them at once. */
import { writeFileSync, mkdirSync } from 'node:fs'

const S = 280, C = 140
const INK = '#053329'
const MINT = '#2bbd9b'
const BAND = 10, OFF = [7, 8]
const SW = 9                       /* the standard outline */

/* ---- geometry ----------------------------------------------------------- */
const rr = (x, y, w, h, r) =>
  `M ${x + r} ${y} h ${w - r * 2} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - r * 2}` +
  ` a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(w - r * 2)} a ${r} ${r} 0 0 1 ${-r} ${-r}` +
  ` v ${-(h - r * 2)} a ${r} ${r} 0 0 1 ${r} ${-r} Z`
const ell = (cx, cy, rx, ry) =>
  `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`
const cir = (cx, cy, r) => ell(cx, cy, r, r)
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z'
/* A four-point twinkle: straight out to the points, scooped in between. */
const star = (cx, cy, r, w) =>
  `M ${cx} ${cy - r} Q ${cx + w} ${cy - w} ${cx + r} ${cy} Q ${cx + w} ${cy + w} ${cx} ${cy + r}` +
  ` Q ${cx - w} ${cy + w} ${cx - r} ${cy} Q ${cx - w} ${cy - w} ${cx} ${cy - r} Z`

/* A lens leaf: two arcs bowing opposite ways between base and tip. */
const leaf = (bx, by, tx, ty, bulge) => {
  const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy)
  const px = (-dy / len) * bulge, py = (dx / len) * bulge
  const mx = (bx + tx) / 2, my = (by + ty) / 2
  return `M ${bx} ${by} Q ${mx + px} ${my + py} ${tx} ${ty} Q ${mx - px} ${my - py} ${bx} ${by} Z`
}

/* ---- paint -------------------------------------------------------------- */
/* Chrome: sky, a hard horizon, then ground. The horizon is what sells it. */
const CHROME = [[0, '#ffffff'], [.26, '#cfdeee'], [.45, '#54749b'], [.5, '#2b3f5c'],
  [.55, '#f9e9c8'], [.74, '#e0b077'], [1, '#9c7038']]
/* the same metal with the horizon softened, for shapes too tall to take the hard one */
const CHROME_SOFT = [[0, '#ffffff'], [.3, '#d3e0ee'], [.5, '#7d9ab9'], [.58, '#ead8b6'], [1, '#bd8f55']]
const STEEL = [[0, '#ffffff'], [.35, '#dfe8f2'], [.55, '#94a9c1'], [1, '#e8eef5']]
const AQUA = [[0, '#7fe8ff'], [.5, '#2f8fe6'], [1, '#5b46d6']]
const VIOLET = [[0, '#ff8fd0'], [.55, '#b06cff'], [1, '#5b46d6']]
const HEAT = [[0, '#fff27a'], [.45, '#ff9b3d'], [1, '#ff4f9b']]
const PINK = [[0, '#ffc0e0'], [.5, '#ff72b4'], [1, '#d63f8c']]
const IRIS = [[0, '#ff9ad5'], [.28, '#9b8cff'], [.5, '#5fd8ff'], [.72, '#7bf0c0'], [1, '#ffd98a']]

/* ---- the sticker builder ------------------------------------------------ */
/* A part is {d, fill?, stroke?, sw?, op?, t?}. `fill: 'none'` stays none in the
   white pass too, so an arc drawn as a stroke never fills into a blob. */
function build(name, make) {
  const defs = []
  const g = (stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => {
    const id = `${name}${defs.length}`
    defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
      stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + '</linearGradient>')
    return `url(#${id})`
  }
  /* A soft specular blob - the Frutiger Aero highlight. */
  const gloss = (cx = .34, cy = .28, r = .62, a = .95) => {
    const id = `${name}${defs.length}`
    defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">` +
      `<stop offset="0" stop-color="#fff" stop-opacity="${a}"/>` +
      `<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`)
    return `url(#${id})`
  }
  const parts = make({ g, gloss })

  const el = (o, white) => {
    const f = o.fill === undefined || o.fill === 'none' ? 'none' : (white ? '#fff' : o.fill)
    const sw = o.sw === undefined ? (o.stroke ? SW : 0) : o.sw
    const st = white ? '#fff' : o.stroke
    const w = white ? sw + BAND * 2 : sw
    const a = [`d="${o.d}"`, `fill="${f}"`]
    if (w > 0) a.push(`stroke="${st || INK}"`, `stroke-width="${w}"`, 'stroke-linecap="round"', 'stroke-linejoin="round"')
    if (o.op !== undefined && !white) a.push(`opacity="${o.op}"`)
    if (o.t) a.push(`transform="${o.t}"`)
    return `<path ${a.join(' ')}/>`
  }
  /* The white pass wants every part solid and opaque; only the art needs defs. */
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">` +
    `<defs>${defs.join('')}</defs>` +
    `<g transform="translate(${OFF[0]} ${OFF[1]})">${parts.map((o) => el(o, true)).join('')}</g>` +
    `<g>${parts.map((o) => el(o, false)).join('')}</g></svg>`
}

/* ---- the set ------------------------------------------------------------ */
const SET = {
  /* the T token, in chrome */
  token: ({ g, gloss }) => [
    { d: cir(C, C, 78), fill: g(CHROME), stroke: INK },
    { d: cir(C, C, 60), fill: MINT, stroke: INK, sw: 6 },
    { d: `M ${C - 30} ${C - 30} h 60 M ${C} ${C - 30} v 62`, fill: 'none', stroke: INK, sw: 17 },
    { d: ell(C - 26, C - 40, 40, 20), fill: gloss(.5, .5, .5, .55), t: `rotate(-24 ${C - 26} ${C - 40})` },
    { d: star(C + 68, C - 62, 30, 5), fill: '#fff', stroke: INK, sw: 6 },
  ],

  /* a card on the tilt, aqua to violet */
  card: ({ g, gloss }) => [
    { d: rr(C - 92, C - 58, 184, 116, 16), fill: g(AQUA), stroke: INK, t: `rotate(-9 ${C} ${C})` },
    { d: rr(C - 92, C - 30, 184, 26, 0), fill: INK, t: `rotate(-9 ${C} ${C})`, sw: 0 },
    { d: rr(C - 72, C + 8, 40, 30, 6), fill: g([[0, '#ffe9a8'], [1, '#d09b3f']]), stroke: INK, sw: 5, t: `rotate(-9 ${C} ${C})` },
    { d: rr(C - 16, C + 20, 96, 12, 6), fill: '#fff', op: .8, t: `rotate(-9 ${C} ${C})`, sw: 0 },
    { d: `M ${C - 92} ${C - 58} h 184 v 44 q -92 34 -184 0 Z`, fill: gloss(.4, .1, .8, .62), t: `rotate(-9 ${C} ${C})` },
    { d: star(C + 78, C - 62, 26, 5), fill: '#fff', stroke: INK, sw: 6 },
  ],

  /* a twinkle cluster */
  spark: ({ g }) => [
    { d: star(C - 6, C - 8, 86, 15), fill: g(STEEL), stroke: INK },
    { d: star(C + 62, C + 54, 40, 7), fill: g(PINK), stroke: INK, sw: 7 },
    { d: star(C - 70, C + 62, 30, 6), fill: g(AQUA), stroke: INK, sw: 6 },
  ],

  /* instant settlement */
  bolt: ({ g }) => [
    { d: poly([[C + 34, C - 106], [C - 62, C + 12], [C - 8, C + 12], [C - 30, C + 106], [C + 66, C - 18], [C + 10, C - 18]]),
      fill: g(HEAT), stroke: INK },
    { d: poly([[C + 18, C - 84], [C - 40, C - 4], [C - 6, C - 4]]), fill: '#fff', op: .55, sw: 0 },
    { d: star(C + 74, C + 62, 28, 5), fill: '#fff', stroke: INK, sw: 6 },
  ],

  /* up and to the right */
  chart: ({ g }) => [
    { d: rr(C - 92, C + 12, 42, 62, 8), fill: g(AQUA), stroke: INK, sw: 7 },
    { d: rr(C - 36, C - 22, 42, 96, 8), fill: g(PINK), stroke: INK, sw: 7 },
    { d: rr(C + 20, C - 62, 42, 136, 8), fill: MINT, stroke: INK, sw: 7 },
    { d: `M ${C - 88} ${C - 40} L ${C - 20} ${C - 80} L ${C + 22} ${C - 58} L ${C + 70} ${C - 112}`,
      fill: 'none', stroke: INK, sw: 13 },
    { d: poly([[C + 98, C - 140], [C + 88, C - 94], [C + 48, C - 126]]), fill: g(HEAT), stroke: INK, sw: 7 },
  ],

  /* the handset */
  phone: ({ g, gloss }) => {
    const T = `rotate(-8 ${C} ${C})`
    const keys = []
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
      keys.push({ d: rr(C - 40 + c * 29, C + 18 + r * 26, 22, 18, 5), fill: '#dbe6f2', stroke: INK, sw: 4, t: T })
    return [
      { d: `M ${C + 42} ${C - 100} v -28`, fill: 'none', stroke: INK, sw: 15, t: T },
      { d: rr(C - 58, C - 104, 116, 200, 24), fill: g(STEEL), stroke: INK, t: T },
      { d: rr(C - 40, C - 86, 80, 66, 8), fill: '#0b3b31', stroke: INK, sw: 5, t: T },
      { d: `M ${C - 28} ${C - 34} v -10 M ${C - 16} ${C - 34} v -20 M ${C - 4} ${C - 34} v -30 M ${C + 8} ${C - 34} v -40`,
        fill: 'none', stroke: MINT, sw: 6, t: T },
      { d: `M ${C - 28} ${C - 68} h 34 M ${C - 28} ${C - 56} h 22`, fill: 'none', stroke: MINT, sw: 5, t: T },
      { d: rr(C - 50, C - 8, 100, 16, 8), fill: '#8ba3bd', stroke: INK, sw: 5, t: T },
      ...keys,
      { d: rr(C - 48, C - 96, 40, 50, 12), fill: gloss(.4, .2, .8, .55), sw: 0, t: T },
    ]
  },

  /* the disc */
  disc: ({ g, gloss }) => [
    { d: cir(C, C, 84), fill: g(IRIS, 0, 0, 1, 1), stroke: INK },
    { d: cir(C, C, 84), fill: gloss(.32, .26, .6, .7) },
    { d: cir(C, C, 30), fill: '#eef3f8', stroke: INK, sw: 6 },
    { d: cir(C, C, 13), fill: '#fff', stroke: INK, sw: 6 },
    { d: `M ${C - 58} ${C - 58} a 82 82 0 0 1 44 -20`, fill: 'none', stroke: '#fff', sw: 8, op: .8 },
  ],

  /* gains */
  rocket: ({ g, gloss }) => [
    { d: `M ${C} ${C - 108} C ${C + 42} ${C - 66} ${C + 46} ${C - 4} ${C + 40} ${C + 40}
          L ${C - 40} ${C + 40} C ${C - 46} ${C - 4} ${C - 42} ${C - 66} ${C} ${C - 108} Z`,
      fill: g(STEEL), stroke: INK },
    { d: poly([[C - 40, C + 4], [C - 80, C + 52], [C - 40, C + 44]]), fill: g(PINK), stroke: INK, sw: 7 },
    { d: poly([[C + 40, C + 4], [C + 80, C + 52], [C + 40, C + 44]]), fill: g(PINK), stroke: INK, sw: 7 },
    { d: cir(C, C - 42, 24), fill: g(AQUA), stroke: INK, sw: 7 },
    { d: ell(C - 8, C - 50, 12, 7), fill: '#fff', op: .85, sw: 0, t: `rotate(-30 ${C - 8} ${C - 50})` },
    { d: `M ${C - 26} ${C + 46} C ${C - 18} ${C + 92} ${C + 18} ${C + 92} ${C + 26} ${C + 46} Z`,
      fill: g(HEAT), stroke: INK, sw: 7 },
  ],

  /* saving */
  piggy: ({ g, gloss }) => [
    { d: ell(C, C + 4, 86, 66), fill: g(PINK), stroke: INK },
    { d: `M ${C - 52} ${C - 58} Q ${C - 8} ${C - 44} ${C - 50} ${C - 16} Q ${C - 62} ${C - 38} ${C - 52} ${C - 58} Z`, fill: g(PINK), stroke: INK, sw: 7 },
    { d: ell(C + 68, C + 10, 30, 26), fill: '#ffb0d8', stroke: INK, sw: 7 },
    { d: cir(C + 62, C + 6, 5), fill: INK, sw: 0 },
    { d: cir(C + 78, C + 12, 5), fill: INK, sw: 0 },
    { d: cir(C + 22, C - 22, 7), fill: INK, sw: 0 },
    { d: `M ${C - 34} ${C - 44} h 46`, fill: 'none', stroke: INK, sw: 12 },
    { d: `M ${C - 44} ${C + 58} v 30 M ${C + 10} ${C + 62} v 26`, fill: 'none', stroke: INK, sw: 20 },
    { d: ell(C - 30, C - 20, 44, 22), fill: gloss(.5, .5, .5, .6), t: `rotate(-16 ${C - 30} ${C - 20})` },
  ],

  /* safekeeping */
  lock: ({ g, gloss }) => [
    { d: `M ${C - 42} ${C - 14} v -26 a 42 42 0 0 1 84 0 v 26`, fill: 'none', stroke: INK, sw: 26 },
    { d: `M ${C - 42} ${C - 14} v -26 a 42 42 0 0 1 84 0 v 26`, fill: 'none', stroke: '#c3d3e4', sw: 13 },
    { d: rr(C - 72, C - 16, 144, 108, 20), fill: g(AQUA), stroke: INK },
    { d: cir(C, C + 28, 16), fill: INK, sw: 0 },
    { d: `M ${C} ${C + 34} v 22`, fill: 'none', stroke: INK, sw: 13 },
    { d: rr(C - 60, C - 6, 120, 40, 16), fill: gloss(.4, .2, .8, .6), sw: 0 },
  ],

  /* paid */
  bubble: ({ g }) => [
    { d: `M ${C - 80} ${C - 72} h 160 a 20 20 0 0 1 20 20 v 84 a 20 20 0 0 1 -20 20 h -70
          l -30 38 l 2 -38 h -62 a 20 20 0 0 1 -20 -20 v -84 a 20 20 0 0 1 20 -20 Z`,
      fill: g(STEEL), stroke: INK },
    { d: rr(C - 84, C - 58, 168, 30, 14), fill: '#fff', op: .65, sw: 0 },
    { d: `M ${C + 16} ${C - 40} a 26 21 0 1 0 -30 21 a 26 21 0 1 1 -30 21`,
      fill: 'none', stroke: INK, sw: 14 },
    { d: `M ${C - 14} ${C - 56} v 80`, fill: 'none', stroke: INK, sw: 12 },
  ],

  /* save */
  floppy: ({ g }) => [
    { d: rr(C - 82, C - 82, 164, 164, 14), fill: g(AQUA), stroke: INK },
    { d: rr(C - 46, C - 82, 92, 62, 4), fill: '#dbe6f2', stroke: INK, sw: 7 },
    { d: rr(C + 8, C - 76, 22, 44, 3), fill: '#8ba3bd', stroke: INK, sw: 6 },
    { d: rr(C - 58, C + 6, 116, 76, 6), fill: '#fff', stroke: INK, sw: 7 },
    { d: `M ${C - 40} ${C + 28} h 66 M ${C - 40} ${C + 50} h 44`, fill: 'none', stroke: '#9fb3c8', sw: 9 },
  ],

  /* the acid face, in mint */
  smiley: ({ g, gloss }) => [
    { d: cir(C, C, 92), fill: g([[0, '#5fe6c2'], [1, '#17a37f']]), stroke: INK },
    { d: ell(C - 32, C - 24, 11, 20), fill: INK, sw: 0 },
    { d: ell(C + 32, C - 24, 11, 20), fill: INK, sw: 0 },
    { d: `M ${C - 46} ${C + 18} q 46 52 92 0`, fill: 'none', stroke: INK, sw: 16 },
    { d: ell(C - 34, C - 52, 46, 22), fill: gloss(.5, .5, .5, .55), t: `rotate(-22 ${C - 34} ${C - 52})` },
  ],

  /* trending */
  flame: ({ g }) => [
    { d: `M ${C + 2} ${C - 112} C ${C + 62} ${C - 52} ${C + 72} ${C - 16} ${C + 66} ${C + 20}
          A 66 66 0 1 1 ${C - 62} ${C + 8} C ${C - 54} ${C - 24} ${C - 26} ${C - 30} ${C - 18} ${C - 62}
          C ${C - 6} ${C - 40} ${C + 14} ${C - 44} ${C + 2} ${C - 112} Z`,
      fill: g(HEAT), stroke: INK },
    { d: `M ${C + 4} ${C - 30} C ${C + 34} ${C + 2} ${C + 32} ${C + 30} ${C + 12} ${C + 48}
          A 34 34 0 1 1 ${C - 26} ${C + 14} C ${C - 16} ${C - 2} ${C - 4} ${C - 8} ${C + 4} ${C - 30} Z`,
      fill: '#fff7c8', op: .9, sw: 0 },
  ],

  /* the pointer */
  cursor: ({ g }) => [
    { d: poly([[C - 48, C - 98], [C - 48, C + 50], [C - 14, C + 16], [C + 12, C + 80],
      [C + 42, C + 66], [C + 16, C + 4], [C + 54, C + 0]]), fill: g(CHROME_SOFT, 0, 0, .35, 1), stroke: INK },
    { d: star(C + 62, C - 66, 32, 6), fill: g(PINK), stroke: INK, sw: 6 },
    { d: star(C - 76, C + 76, 22, 4), fill: '#fff', stroke: INK, sw: 5 },
  ],

  /* the glass orb, with the sprout inside */
  orb: ({ g, gloss }) => [
    { d: cir(C, C, 90), fill: g(AQUA), stroke: INK },
    { d: `M ${C + 2} ${C + 40} C ${C + 6} ${C - 2} ${C + 18} ${C - 18} ${C + 22} ${C - 46}`,
      fill: 'none', stroke: '#fff', sw: 13 },
    { d: leaf(C + 20, C - 40, C + 62, C - 66, 17), fill: '#fff', stroke: INK, sw: 5 },
    { d: leaf(C + 14, C - 20, C - 30, C - 44, 15), fill: '#fff', stroke: INK, sw: 5 },
    { d: ell(C - 34, C - 44, 50, 26), fill: gloss(.5, .5, .5, .9), t: `rotate(-26 ${C - 34} ${C - 44})` },
    { d: `M ${C - 58} ${C + 52} a 78 78 0 0 0 116 0`, fill: 'none', stroke: '#fff', sw: 7, op: .45 },
  ],
}

mkdirSync('out', { recursive: true })
const names = Object.keys(SET)
names.forEach((n) => writeFileSync(`out/${n}.svg`, build(n, SET[n])))
console.log(names.join(' '))
