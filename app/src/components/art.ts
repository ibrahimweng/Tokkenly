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

const CELL = 12

export function dotArt(spec: ArtSpec): SVGSVGElement {
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

  spec.size.forEach((row, y) => {
    for (let x = 0; x < spec.cols; x++) {
      const d = parseInt(row[x] ?? '0', 36)
      if (!d) continue
      const c = document.createElementNS(NS, 'circle')
      c.setAttribute('cx', String(x * CELL + CELL / 2))
      c.setAttribute('cy', String(y * CELL + CELL / 2))
      c.setAttribute('r', String(d / 2))
      c.setAttribute('fill', TONE[spec.tone[y]?.[x] ?? 'b'] ?? TONE.b)
      svg.appendChild(c)
    }
  })
  return svg
}
