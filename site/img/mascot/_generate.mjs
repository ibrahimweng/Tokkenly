/* Tokkenly's mascot: a sprouting token. One egg-shaped body, a sprout on the
   crown, a face and limbs drawn as strokes, and a white die-cut keyline offset
   down-right behind the whole drawing.

   Every sticker is the same primitives with different arguments, which is what
   makes nine drawings read as one set.

   The keyline is that same drawing again with every stroke widened by twice the
   band and everything painted white, sitting behind. Overlapping white shapes
   union for free, so there is no boolean work and no filter - which matters,
   because a filter would not survive the trip into Figma as vectors.

   An offset keyline also shows through interior negative space, so the poses
   keep the gap between the legs either shut (the white merges) or wide open
   (the white reads as outline). A middling gap is the one thing to avoid. */
import { writeFileSync, mkdirSync } from 'node:fs'

const SKIN = '#2bbd9b'             /* one token: swap for the purple */
const INK = '#053329'
const S = 280
const CX = 140, CY = 142
const BW = 54                      /* body half-width */
const TOP = CY - 78, BOT = CY + 66 /* body crown and base */
const LW = 15                      /* limbs */
const FW = 10                      /* face */
const BAND = 10                    /* the white keyline */
const OFF = [7, 8]

/* A primitive is {fill, d} or {d, w} (a stroke). Both know how to widen. */
const el = (o, white) => {
  if (o.fill !== undefined) {
    const extra = white ? ` stroke="#fff" stroke-width="${BAND * 2}" stroke-linejoin="round"` : ''
    return `<path d="${o.d}" fill="${white ? '#fff' : o.fill}"${extra}/>`
  }
  const w = white ? o.w + BAND * 2 : o.w
  return `<path d="${o.d}" fill="none" stroke="${white ? '#fff' : (o.c || INK)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
}

const arc = (x, y, rx, ry) =>
  `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`

/* ---- body --------------------------------------------------------------- */
/* A lens leaf: two arcs bowing opposite ways between base and tip. */
function leaf(bx, by, tx, ty, bulge) {
  const dx = tx - bx, dy = ty - by, len = Math.hypot(dx, dy)
  const px = (-dy / len) * bulge, py = (dx / len) * bulge
  const mx = (bx + tx) / 2, my = (by + ty) / 2
  return { fill: SKIN, d: `M ${bx} ${by} Q ${mx + px} ${my + py} ${tx} ${ty} Q ${mx - px} ${my - py} ${bx} ${by} Z` }
}

const body = () => [
  { fill: SKIN, d:
    `M ${CX - BW} ${CY - 4}
     C ${CX - BW} ${TOP + 12} ${CX - 32} ${TOP} ${CX} ${TOP}
     C ${CX + 32} ${TOP} ${CX + BW} ${TOP + 12} ${CX + BW} ${CY - 4}
     C ${CX + BW} ${BOT - 16} ${CX + 34} ${BOT} ${CX} ${BOT}
     C ${CX - 34} ${BOT} ${CX - BW} ${BOT - 16} ${CX - BW} ${CY - 4} Z` },
]

/* The sprout rides on top of the body, drawn before it so the stem tucks in. */
const sprout = () => [
  { d: `M ${CX + 2} ${TOP + 6} C ${CX + 4} ${TOP - 14} ${CX + 12} ${TOP - 22} ${CX + 15} ${TOP - 36}`, w: 9, c: SKIN },
  leaf(CX + 14, TOP - 32, CX + 44, TOP - 50, 13),
  leaf(CX + 10, TOP - 20, CX - 18, TOP - 33, 11),
]

/* ---- face --------------------------------------------------------------- */
const EY = CY - 16, MY = CY + 16, SP = 22
const eyes = {
  open: () => [{ d: arc(CX - SP, EY, 6, 8), w: FW }, { d: arc(CX + SP, EY, 6, 8), w: FW }],
  happy: () => [
    { d: `M ${CX - SP - 12} ${EY + 5} q 12 -16 24 0`, w: FW },
    { d: `M ${CX + SP - 12} ${EY + 5} q 12 -16 24 0`, w: FW },
  ],
  shut: () => [
    { d: `M ${CX - SP - 12} ${EY - 2} q 12 13 24 0`, w: FW },
    { d: `M ${CX + SP - 12} ${EY - 2} q 12 13 24 0`, w: FW },
  ],
  wink: () => [
    { d: `M ${CX - SP - 12} ${EY + 5} q 12 -16 24 0`, w: FW },
    { d: arc(CX + SP, EY, 6, 8), w: FW },
  ],
  flat: () => [
    { d: `M ${CX - SP - 10} ${EY} h 20`, w: FW }, { d: `M ${CX + SP - 10} ${EY} h 20`, w: FW },
  ],
  up: () => [
    { d: `M ${CX - SP - 12} ${EY + 2} q 12 -13 24 3`, w: FW },
    { d: `M ${CX + SP - 12} ${EY + 4} q 12 -15 24 -3`, w: FW },
  ],
}
const mouths = {
  smile: () => [{ d: `M ${CX - 14} ${MY - 4} q 14 15 28 0`, w: FW }],
  grin: () => [{ fill: INK, d: `M ${CX - 18} ${MY - 6} q 18 24 36 0 z` }],
  o: () => [{ fill: INK, d: arc(CX, MY + 2, 9, 11) }],
  line: () => [{ d: `M ${CX - 11} ${MY} h 22`, w: FW }],
  wave: () => [{ d: `M ${CX - 15} ${MY} q 7.5 -9 15 0 q 7.5 9 15 0`, w: FW }],
  small: () => [{ d: `M ${CX - 9} ${MY - 3} q 9 10 18 0`, w: FW }],
}

/* ---- limbs -------------------------------------------------------------- */
/* Limbs are drawn behind the body, so a shoulder buried inside the silhouette
   is simply invisible and no arm can ever cross the face. A hand that is meant
   to rest on the body goes in the pose's `front` list instead. */
const SL = [CX - 22, CY + 26], SR = [CX + 22, CY + 26]
const HL = [CX - 16, BOT - 20], HR = [CX + 16, BOT - 20]

const path = (pts) => 'M ' + pts.map((p) => p.join(' ')).join(' L ')
const hand = ([x, y]) => ({ fill: INK, d: arc(x, y, 10, 10) })
const arm = (pts) => [{ d: path(pts), w: LW }, hand(pts[pts.length - 1])]
/* A foot is an ellipse sitting on the end of the leg, turned along the toe. */
const leg = (pts, toe = 1) => {
  const [x, y] = pts[pts.length - 1]
  return [{ d: path(pts), w: LW }, { fill: INK, d: arc(x + toe * 7, y + 3, 15, 8.5) }]
}
const stand = () => [
  ...leg([HL, [CX - 16, BOT + 30]], -1),
  ...leg([HR, [CX + 16, BOT + 30]], 1),
]

const POSES = {
  /* legs together: the keyline between them merges */
  wave: { f: ['happy', 'smile'], l: () => [
    ...arm([SL, [CX - 72, CY - 2], [CX - 86, CY - 44]]),
    ...arm([SR, [CX + 76, CY + 46]]),
    ...stand(),
  ] },
  /* legs wide: the keyline reads as outline */
  cheer: { f: ['happy', 'grin'], l: () => [
    ...arm([SL, [CX - 68, CY - 18], [CX - 60, CY - 56]]),
    ...arm([SR, [CX + 68, CY - 18], [CX + 60, CY - 56]]),
    ...leg([HL, [CX - 54, BOT + 26]], -1),
    ...leg([HR, [CX + 54, BOT + 26]], 1),
  ] },
  run: { f: ['wink', 'grin'], l: () => [
    ...arm([SR, [CX + 72, CY - 36]]),
    ...arm([SL, [CX - 86, CY + 30]]),
    ...leg([[CX - 16, BOT - 24], [CX - 58, BOT + 8], [CX - 72, BOT + 34]], -1),
    ...leg([[CX + 16, BOT - 24], [CX + 52, BOT + 16], [CX + 38, BOT + 36]], 1),
  ] },
  /* hand to the chin: the arm swings out low and curves back in front */
  think: { f: ['up', 'small'], l: () => [
    ...arm([SL, [CX - 74, CY + 40], [CX - 74, CY - 14], [CX - 62, CY - 24]]),
    ...arm([SR, [CX + 72, CY + 44]]),
    ...stand(),
  ] },
  /* crossed legs: two curves that shut the gap completely */
  calm: { f: ['shut', 'smile'], l: () => [
    ...arm([SL, [CX - 70, CY + 48]]),
    ...arm([SR, [CX + 70, CY + 48]]),
    { d: `M ${CX - 46} ${BOT - 2} Q ${CX - 6} ${BOT + 26} ${CX + 30} ${BOT + 12}`, w: LW },
    { d: `M ${CX + 46} ${BOT - 2} Q ${CX + 6} ${BOT + 26} ${CX - 30} ${BOT + 12}`, w: LW },
    { fill: INK, d: arc(CX + 32, BOT + 12, 13, 9) },
    { fill: INK, d: arc(CX - 32, BOT + 12, 13, 9) },
  ] },
  point: { f: ['open', 'smile'], l: () => [
    ...arm([SL, [CX - 70, CY + 46]]),
    ...arm([SR, [CX + 78, CY + 2], [CX + 106, CY - 6]]),
    ...stand(),
  ] },
  shrug: { f: ['flat', 'wave'], l: () => [
    ...arm([SL, [CX - 74, CY + 18], [CX - 88, CY - 12]]),
    ...arm([SR, [CX + 74, CY + 18], [CX + 88, CY - 12]]),
    ...stand(),
  ] },
  /* cradling a token: the coin and both hands sit in front of the body */
  hold: { f: ['open', 'smile'], t: () => [
    { fill: SKIN, d: arc(CX, BOT - 10, 27, 27) },
    { d: arc(CX, BOT - 10, 22, 22), w: 8 },
    { d: `M ${CX - 9} ${BOT - 18} h 18 M ${CX} ${BOT - 18} v 17`, w: 7 },
    hand([CX - 31, BOT - 6]), hand([CX + 31, BOT - 6]),
  ], l: () => [
    { d: path([SL, [CX - 66, CY + 40], [CX - 31, BOT - 6]]), w: LW },
    { d: path([SR, [CX + 66, CY + 40], [CX + 31, BOT - 6]]), w: LW },
    ...stand(),
  ] },
  grow: { f: ['happy', 'o'], l: () => [
    ...arm([SL, [CX - 70, CY - 10], [CX - 68, CY - 52]]),
    ...arm([SR, [CX + 78, CY + 16]]),
    ...stand(),
  ] },
}

function sticker(name) {
  const p = POSES[name]
  const parts = [...sprout(), ...p.l(), ...body(), ...(p.t ? p.t() : []), ...eyes[p.f[0]](), ...mouths[p.f[1]]()]
  const white = parts.map((o) => el(o, true)).join('')
  const art = parts.map((o) => el(o, false)).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
<g transform="translate(${OFF[0]} ${OFF[1]})">${white}</g>
<g>${art}</g>
</svg>`
}

mkdirSync('out', { recursive: true })
const names = Object.keys(POSES)
names.forEach((n) => writeFileSync(`out/${n}.svg`, sticker(n)))
console.log(names.join(' '))
