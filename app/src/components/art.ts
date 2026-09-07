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

export function dotArt(spec: ArtSpec, at = 1, ramp?: Record<string, string>): SVGSVGElement {
  const PAINT = ramp ? { ...TONE, ...ramp } : TONE
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
      c.setAttribute('r', String(d / 2))
      const tone = spec.tone[y]?.[x] ?? 'b'
      const key = seen <= wake ? tone : SLEEP
      c.setAttribute('fill', PAINT[key] ?? PAINT.b)
      svg.appendChild(c)
    }
  }
  return svg
}
