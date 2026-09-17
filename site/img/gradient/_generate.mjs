/* Tokkenly's gradient sticker set.

   The language of the reference: no outlines at all, shapes told apart by
   colour alone, smooth multi-stop gradients inside each one, soft rounded
   geometry, and a hard near-black shadow cast down-right as the only
   dimensional cue.

   Holes are compound paths with fill-rule evenodd rather than masks - a mask
   survives Figma's SVG import, but evenodd is one node instead of three.
   Grain does not survive at all (filters are dropped on import), so the
   texture in the reference is carried by the gradients instead.

   KEYLINE=1 re-renders the set with the white die-cut keyline of the other
   two boards, for comparison. */
import { writeFileSync, mkdirSync } from 'node:fs'

const S = 280, C = 140
const SHADOW = process.env.SHADOW === '1'   /* the reference has none */
const SH = ['#0b0b0b', 22, 10]
const KEY = process.env.KEYLINE === '1'
const BAND = 11, OFF = [7, 8]

/* ---- geometry ----------------------------------------------------------- */
const rr = (x, y, w, h, r) =>
  `M ${x + r} ${y} h ${w - r * 2} a ${r} ${r} 0 0 1 ${r} ${r} v ${h - r * 2}` +
  ` a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(w - r * 2)} a ${r} ${r} 0 0 1 ${-r} ${-r}` +
  ` v ${-(h - r * 2)} a ${r} ${r} 0 0 1 ${r} ${-r} Z`
const ell = (cx, cy, rx, ry) =>
  `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`
const cir = (cx, cy, r) => ell(cx, cy, r, r)
/* outer and inner in one path: evenodd punches the hole */
const ring = (cx, cy, ro, ri) => ell(cx, cy, ro, ro) + ' ' + ell(cx, cy, ri, ri)
const poly = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ') + ' Z'
const heart = (cx, cy, w, h) =>
  `M ${cx} ${cy + h * .55} C ${cx - w * 1.15} ${cy - h * .1} ${cx - w * .62} ${cy - h * .95} ${cx} ${cy - h * .38}` +
  ` C ${cx + w * .62} ${cy - h * .95} ${cx + w * 1.15} ${cy - h * .1} ${cx} ${cy + h * .55} Z`

/* ---- paint -------------------------------------------------------------- */
/* Read off the reference: high-key throughout, and no black anywhere. The
   darkest note in the whole set is NAVY, and it is used sparingly. Gradients
   run light to saturated and are allowed to cross hue. Colour is chosen for
   harmony rather than realism - which is why the coffee cup is green. */
const ICE = [[0, '#f2fafe'], [.5, '#d8edfa'], [1, '#a8d8f2']]
const SKY = [[0, '#d4eefc'], [.5, '#5ab3e8'], [1, '#2e7fd4']]
const BLUE = [[0, '#bcdcf8'], [.5, '#3d8ce0'], [1, '#1e5fbf']]
const NAVY = [[0, '#34627f'], [1, '#123a5c']]
const LIME = [[0, '#ecf9cf'], [.5, '#8cd836'], [1, '#4fae20']]
const GRASS = [[0, '#b6ecab'], [.5, '#2fb344'], [1, '#0e8a3c']]
const JADE = [[0, '#b2f2da'], [.45, '#22b37e'], [1, '#0a7a52']]
const MINT = [[0, '#c4f6e4'], [.45, '#2bbd9b'], [1, '#12866d']]
const BLUSH = [[0, '#fff2f5'], [1, '#f7c4d0']]
const PINK = [[0, '#ffd2e2'], [.5, '#f4467e'], [1, '#c81f56']]
const CORAL = [[0, '#ffcbbb'], [.5, '#ee3b4a'], [1, '#c21e30']]
const PEACH = [[0, '#fff0de'], [.5, '#fbc8a0'], [1, '#f2a061']]
const ORANGE = [[0, '#ffe6bd'], [.5, '#f79b3c'], [1, '#dd7318']]
const GOLD = [[0, '#fff6cf'], [.45, '#f2c84b'], [1, '#d99a1f']]
const COCOA = [[0, '#e0a870'], [.5, '#a06029'], [1, '#6b3a12']]
const PAPER = [[0, '#ffffff'], [.55, '#e2f1fb'], [1, '#bcdff5']]
const CREAM = [[0, '#fffaec'], [1, '#ecd9ae']]
/* aliases kept so the drawings below read the same */
const CASH = GRASS, DEEP = BLUE, ROSE = PINK, EMBER = CORAL, AMBER = GOLD, SLATE = ICE

/* ---- builder ------------------------------------------------------------ */
/* A part is {d, fill, op?, t?, fr?}. No strokes: the reference has no outlines. */
function build(name, make) {
  const defs = []
  const g = (stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => {
    const id = `${name}${defs.length}`
    defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
      stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + '</linearGradient>')
    return `url(#${id})`
  }
  const rad = (stops, cx = .4, cy = .32, r = .75) => {
    const id = `${name}${defs.length}`
    defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">` +
      stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('') + '</radialGradient>')
    return `url(#${id})`
  }
  const parts = make({ g, rad })

  const at = (o, fill, extra) => {
    const a = [`d="${o.d}"`, `fill="${fill}"`]
    if (o.fr) a.push('fill-rule="evenodd"')
    if (o.op !== undefined && !extra) a.push(`opacity="${o.op}"`)
    if (o.t) a.push(`transform="${o.t}"`)
    if (extra) a.push(extra)
    return `<path ${a.join(' ')}/>`
  }
  const shadow = SHADOW ? parts.filter((o) => o.sh !== false).map((o) => at(o, SH[0], '')).join('') : ''
  const art = parts.map((o) => at(o, o.fill)).join('')
  const key = KEY ? `<g transform="translate(${OFF[0]} ${OFF[1]})">` +
    parts.map((o) => at(o, '#fff', `stroke="#fff" stroke-width="${BAND * 2}" stroke-linejoin="round"`)).join('') +
    '</g>' : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">` +
    `<defs>${defs.join('')}</defs>${key}` +
    `<g transform="translate(${SH[1]} ${SH[2]})">${shadow}</g><g>${art}</g></svg>`
}

/* ---- the set ------------------------------------------------------------ */
const SET = {
  /* the rate tag */
  tag: ({ g }) => [
    { d: `M ${C - 84} ${C + 12} L ${C - 30} ${C - 60} h 78 a 18 18 0 0 1 18 18 v 88
          a 18 18 0 0 1 -18 18 h -78 Z`,
      fill: g([[0, '#8fe6c0'], [.5, '#4fa8e0'], [1, '#2e6fd4']], 0, 0, 1, 1) },
    { d: cir(C - 42, C + 4, 12), fill: '#ffffff', sh: false },
    { d: ring(C - 2, C - 24, 17, 8), fill: '#ffffff', fr: 1, sh: false },
    { d: ring(C + 36, C + 22, 17, 8), fill: '#ffffff', fr: 1, sh: false },
    { d: rr(C + 10, C - 40, 14, 84, 7), fill: '#ffffff', t: `rotate(30 ${C + 17} ${C + 2})`, sh: false },
  ],

  /* the signed agreement */
  receipt: ({ g }) => [
    { d: `M ${C - 62} ${C - 96} h 112 a 14 14 0 0 1 14 14 v 148
          q -32 26 -63 0 q -31 -26 -63 0 Z`, fill: g(PAPER) },
    { d: `M ${C - 40} ${C - 42} q 18 -26 34 -4 q 16 22 34 -10 l 0 15 q -20 28 -38 6
          q -18 -22 -30 2 Z`, fill: g(DEEP), sh: false },
    { d: `M ${C - 40} ${C + 4} q 26 -20 52 0 q 22 18 34 2 l 0 13 q -18 20 -40 2
          q -22 -18 -46 -4 Z`, fill: g(SKY), sh: false },
    { d: rr(C - 40, C - 74, 74, 11, 5), fill: '#bcdcf8', sh: false },
  ],

  /* the banded stack */
  cash: ({ g }) => [
    { d: rr(C - 86, C - 34, 172, 92, 8), fill: g(CASH) },
    { d: rr(C - 86, C - 34, 172, 18, 8), fill: '#159c46', sh: false },
    { d: rr(C - 86, C - 6, 172, 8, 4), fill: '#0e8a3c', op: .55, sh: false },
    { d: rr(C - 86, C + 16, 172, 8, 4), fill: '#0e8a3c', op: .55, sh: false },
    { d: `M ${C - 74} ${C - 84} h 138 a 10 10 0 0 1 10 10 v 34 a 10 10 0 0 1 -10 10 h -138
          a 10 10 0 0 1 -10 -10 v -34 a 10 10 0 0 1 10 -10 Z`, fill: g(CASH) },
    { d: ring(C - 48, C - 57, 17, 8), fill: '#0e8a3c', fr: 1, sh: false },
    { d: rr(C - 26, C - 88, 34, 150, 0), fill: g(CREAM) },
    { d: rr(C + 8, C - 88, 15, 150, 0), fill: g(ROSE) },
  ],

  /* cleared */
  verified: ({ g, rad }) => [
    { d: ell(C + 6, C, 78, 88), fill: g(EMBER) },
    { d: ell(C - 4, C, 78, 88), fill: rad(SKY, .38, .3, .8) },
    { d: ell(C - 44, C - 44, 22, 12), fill: '#ffffff', op: .9, sh: false },
    { d: ell(C + 22, C + 48, 26, 13), fill: '#ffffff', op: .9, sh: false },
    { d: ell(C + 34, C - 34, 16, 9), fill: '#ffffff', op: .8, sh: false },
    { d: poly([[C - 46, C - 2], [C - 24, C + 44], [C + 44, C - 50], [C + 44, C - 24], [C - 24, C + 66], [C - 46, C + 22]]),
      fill: '#2e7fd4', sh: false },
    { d: poly([[C - 40, C - 12], [C - 20, C + 30], [C + 50, C - 60], [C + 50, C - 36], [C - 20, C + 52], [C - 40, C + 12]]),
      fill: g(CREAM), sh: false },
    { d: poly([[C + 50, C - 60], [C + 30, C - 74], [C + 6, C - 46], [C + 26, C - 32]]), fill: g(PEACH), sh: false },
  ],

  /* the records */
  ledger: ({ g }) => [
    { d: rr(C - 84, C - 40, 26, 122, 4), fill: g(ROSE) },
    { d: rr(C - 62, C - 58, 22, 140, 4), fill: g(SKY) },
    { d: rr(C - 44, C - 82, 38, 164, 5), fill: g(JADE) },
    { d: rr(C - 40, C - 78, 30, 8, 3), fill: '#ecf9cf', op: .85, sh: false },
    { d: rr(C - 4, C - 54, 40, 136, 5), fill: g(GOLD) },
    { d: rr(C + 0, C - 50, 32, 8, 3), fill: '#fffaec', op: .9, sh: false },
    { d: rr(C + 36, C - 40, 36, 124, 5), fill: g(PINK), t: `rotate(16 ${C + 40} ${C + 82})` },
  ],

  /* the rate on a post */
  yardsign: ({ g }) => [
    { d: ell(C, C + 78, 92, 26), fill: g(LIME) },
    { d: rr(C + 42, C - 84, 17, 158, 4), fill: g(PEACH) },
    { d: rr(C - 52, C - 90, 112, 16, 5), fill: g(PEACH) },
    { d: rr(C - 26, C - 78, 6, 22, 3), fill: '#a06029', sh: false },
    { d: rr(C + 22, C - 78, 6, 22, 3), fill: '#a06029', sh: false },
    { d: rr(C - 54, C - 58, 108, 86, 8), fill: g(CREAM) },
    { d: ring(C - 18, C - 32, 15, 7), fill: '#f4467e', fr: 1, sh: false },
    { d: ring(C + 20, C + 4, 15, 7), fill: '#f4467e', fr: 1, sh: false },
    { d: rr(C - 6, C - 44, 13, 62, 6), fill: '#f4467e', t: `rotate(32 ${C} ${C - 14})`, sh: false },
  ],

  /* the bill that has to be paid */
  bulb: ({ g, rad }) => [
    { d: `M ${C} ${C - 96} a 62 62 0 0 1 38 111 v 20 h -76 v -20 a 62 62 0 0 1 38 -111 Z`,
      fill: rad(AMBER, .36, .3, .8) },
    { d: rr(C - 30, C + 36, 60, 16, 6), fill: g([[0, '#e8f4fd'], [1, '#8fc4e8']]) },
    { d: rr(C - 26, C + 56, 52, 14, 6), fill: g([[0, '#e8f4fd'], [1, '#8fc4e8']]) },
    { d: rr(C - 16, C + 74, 32, 12, 6), fill: '#34627f', sh: false },
    { d: poly([[C - 14, C + 14], [C - 2, C - 28], [C + 2, C - 4], [C + 16, C - 30], [C + 10, C + 14]]),
      fill: '#ffffff', op: .55, sh: false },
  ],

  /* everyday spending */
  coffee: ({ g }) => [
    { d: `M ${C + 44} ${C - 18} a 34 30 0 0 1 0 60 Z`, fill: g([[0, '#5fd8a8'], [1, '#12866d']]) },
    { d: `M ${C - 62} ${C - 46} h 108 v 62 a 54 54 0 0 1 -108 0 Z`, fill: g(MINT) },
    { d: ell(C - 8, C - 46, 54, 20), fill: g(COCOA) },
    { d: heart(C - 8, C - 46, 20, 24), fill: g(CREAM), sh: false },
    { d: rr(C - 66, C + 62, 116, 16, 8), fill: g([[0, '#3fc99a'], [1, '#12866d']]) },
  ],

  /* the groceries */
  carton: ({ g }) => [
    { d: `M ${C - 48} ${C - 44} h 96 v 128 h -96 Z`, fill: g(PAPER) },
    { d: `M ${C - 48} ${C - 44} l 48 -40 l 48 40 Z`, fill: g([[0, '#eaf6fd'], [1, '#9ed2ef']]), sh: false },
    { d: rr(C - 9, C - 96, 18, 16, 4), fill: g([[0, '#bcdff5'], [1, '#5ab3e8']]) },
    { d: rr(C - 40, C + 8, 80, 60, 10), fill: g([[0, '#5ab3e8'], [1, '#1e5fbf']]), sh: false },
    { d: ell(C, C + 30, 19, 22), fill: '#ffffff', sh: false },
    { d: `M ${C + 2} ${C + 14} q 20 -6 22 -16 q -18 -2 -22 16 Z`, fill: g(LIME), sh: false },
  ],

  /* money out */
  plane: ({ g }) => [
    { d: poly([[C - 96, C - 20], [C + 96, C - 74], [C - 6, C + 22]]), fill: g(SKY, 0, 0, 1, 1) },
    { d: poly([[C - 6, C + 22], [C + 96, C - 74], [C + 30, C + 82]]), fill: g(DEEP, 0, 0, 1, 1) },
    { d: poly([[C - 6, C + 22], [C + 30, C + 82], [C - 2, C + 60]]), fill: '#1e5fbf', op: .8, sh: false },
  ],

  /* the vault */
  safe: ({ g }) => [
    { d: rr(C - 88, C - 84, 176, 168, 20), fill: g([[0, '#d4eefc'], [.5, '#7fc0ea'], [1, '#3d8ce0']]) },
    { d: cir(C + 4, C, 62), fill: g([[0, '#ffffff'], [.5, '#9fb3c8'], [1, '#5ab3e8']]), sh: false },
    { d: rr(C - 52, C - 8, 112, 16, 8), fill: '#2e7fd4', t: `rotate(45 ${C + 4} ${C})`, sh: false },
    { d: rr(C - 52, C - 8, 112, 16, 8), fill: '#2e7fd4', t: `rotate(-45 ${C + 4} ${C})`, sh: false },
    { d: ring(C + 4, C, 50, 34), fill: '#2e7fd4', fr: 1, sh: false },
    { d: cir(C + 4, C, 15), fill: '#ffffff', sh: false },
    { d: rr(C - 84, C + 56, 32, 14, 7), fill: '#5ab3e8', sh: false },
  ],

  /* on a schedule */
  calendar: ({ g }) => [
    { d: rr(C - 46, C - 92, 14, 40, 7), fill: g([[0, '#cfe8f7'], [1, '#5ab3e8']]) },
    { d: rr(C + 32, C - 92, 14, 40, 7), fill: g([[0, '#cfe8f7'], [1, '#5ab3e8']]) },
    { d: rr(C - 82, C - 74, 164, 156, 18), fill: g(PAPER) },
    { d: `M ${C - 82} ${C - 56} h 164 v -0 a 18 18 0 0 0 -18 -18 h -128 a 18 18 0 0 0 -18 18 Z`,
      fill: g(EMBER), sh: false },
    { d: cir(C - 40, C - 12, 13), fill: '#8fc9ec', sh: false },
    { d: cir(C, C - 12, 13), fill: '#8fc9ec', sh: false },
    { d: cir(C + 40, C - 12, 13), fill: '#8fc9ec', sh: false },
    { d: cir(C - 40, C + 30, 13), fill: '#8fc9ec', sh: false },
    { d: cir(C, C + 30, 17), fill: g(GRASS), sh: false },
    { d: cir(C + 40, C + 30, 13), fill: '#8fc9ec', sh: false },
  ],

  /* the weekly shop */
  basket: ({ g }) => [
    { d: `M ${C - 44} ${C - 16} a 44 44 0 0 1 88 0 l -17 0 a 27 27 0 0 0 -54 0 Z`, fill: g([[0, '#f07a5a'], [1, '#c21e30']]) },
    { d: poly([[C - 92, C - 20], [C + 92, C - 20], [C + 66, C + 76], [C - 66, C + 76]]), fill: g(EMBER) },
    { d: rr(C - 86, C - 26, 172, 20, 9), fill: g([[0, '#ffcbbb'], [1, '#e8323f']]) },
    { d: rr(C - 44, C + 0, 12, 56, 6), fill: '#c21e30', op: .5, sh: false },
    { d: rr(C - 6, C + 0, 12, 56, 6), fill: '#c21e30', op: .5, sh: false },
    { d: rr(C + 32, C + 0, 12, 56, 6), fill: '#c21e30', op: .5, sh: false },
  ],

  /* rent, or the thing being saved for */
  house: ({ g }) => [
    { d: poly([[C, C - 92], [C + 92, C - 8], [C - 92, C - 8]]), fill: g(EMBER) },
    { d: rr(C - 68, C - 12, 136, 96, 6), fill: g(PEACH) },
    { d: rr(C - 16, C + 30, 32, 54, 5), fill: g(ROSE), sh: false },
    { d: rr(C - 56, C + 10, 30, 30, 4), fill: g(SKY), sh: false },
    { d: rr(C + 26, C + 10, 30, 30, 4), fill: g(SKY), sh: false },
    { d: ell(C + 70, C + 62, 30, 24), fill: g(LIME) },
  ],

  /* where it sits */
  wallet: ({ g }) => [
    { d: rr(C - 46, C - 76, 92, 56, 8), fill: g(AMBER) },
    { d: rr(C - 84, C - 54, 168, 116, 18), fill: g(COCOA) },
    { d: rr(C - 84, C - 6, 168, 68, 18), fill: g([[0, '#e0a870'], [.5, '#b87a3e'], [1, '#8a5020']]), sh: false },
    { d: rr(C + 24, C + 4, 60, 34, 12), fill: g(JADE), sh: false },
    { d: cir(C + 54, C + 21, 10), fill: '#12866d', sh: false },
  ],

  /* borderless */
  globe: ({ g, rad }) => [
    { d: cir(C, C, 92), fill: rad(SKY, .34, .28, .82) },
    { d: `M ${C - 78} ${C - 22} q 14 -30 42 -26 q 18 -2 16 14 q -2 14 12 18
          q 16 6 4 22 q -14 18 -40 12 q -28 -6 -34 -40 Z`, fill: g(MINT), sh: false },
    { d: `M ${C - 6} ${C + 26} q 26 -20 50 -6 q 16 10 8 28 q -8 20 -30 26
          q -20 6 -28 -12 q -8 -20 0 -36 Z`, fill: g(MINT), sh: false },
    { d: `M ${C + 22} ${C - 66} q 30 -10 44 8 q 10 14 -8 22 q -20 8 -34 -4
          q -10 -10 -2 -26 Z`, fill: g(MINT), sh: false },
    { d: `M ${C - 62} ${C + 46} q 18 -10 28 2 q 6 10 -8 16 q -16 6 -22 -4 q -4 -8 2 -14 Z`,
      fill: g(MINT), sh: false },
  ],
}

const DIR = process.env.OUT || 'out'
mkdirSync(DIR, { recursive: true })
const names = Object.keys(SET)
names.forEach((n) => writeFileSync(`${DIR}/${n}.svg`, build(n, SET[n])))
console.log(names.join(' '))
