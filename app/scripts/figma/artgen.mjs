/* Emit the use_figma script that builds some of the drawings as components.
 *
 * Two substitutions before the SVG goes in. Figma's importer does not know
 * `currentColor` or a CSS `var()`, so the markup carries concrete colours —
 * ink for the strokes, the card's ground for the fills — and the script binds
 * both to the variables afterwards, which is what makes a component follow the
 * theme rather than being a dark-mode picture.
 *
 * Usage: node scripts/figma/artgen.mjs NAME [NAME...] > build.js
 */
import { readFileSync } from 'node:fs'
const art = JSON.parse(readFileSync(new URL('../../figma/art.json', import.meta.url), 'utf8'))
const want = process.argv.slice(2)
const pick = art.filter((a) => want.includes(a.name))
if (pick.length !== want.length) {
  console.error('unknown: ' + want.filter((w) => !art.some((a) => a.name === w)).join(' '))
  process.exit(1)
}
/* SVG attributes inherit, so the five that never vary — the ink, the weight,
   the two joins and the non-scaling rule — belong once on the root and not a
   hundred and ten characters per path. On INVEST that is sixty paths carrying
   the same string, a third of the drawing spent saying the same thing. What
   does vary (opacity, and whether a shape is filled or hollow) stays where it
   is. The picture is identical; the file that describes it is half the size. */
const HOIST = [
  'stroke="#DCDCE0"', 'stroke-width="1.1"',
  'stroke-linejoin="round"', 'stroke-linecap="round"',
  'vector-effect="non-scaling-stroke"',
]
const clean = (s) => {
  let out = s
    .replace(/stroke="currentColor"/g, 'stroke="#DCDCE0"')
    .replace(/style="fill: var\(--art-ground, transparent\);"/g, 'fill="#161619"')
    .replace(/style="fill: none;"/g, 'fill="none"')
    .replace(/ width="100%" height="100%"/, '')
    .replace(/ (?:aria-hidden|focusable|data-art)="[^"]*"/g, '')
  for (const a of HOIST) out = out.split(' ' + a).join('')
  // Anything that was hollow stays hollow; everything else inherits the ink.
  return out.replace('<svg ', '<svg ' + HOIST.join(' ') + ' ')
}

const ORDER = art.map((a) => a.name)
const items = pick.map((a) => ({ name: a.name, svg: clean(a.svg), box: a.box }))

process.stdout.write(`
const ART = ${JSON.stringify(items)}

const page = figma.root.children.find((p) => p.name === 'Design system')
await figma.setCurrentPageAsync(page)

const cols = await figma.variables.getLocalVariableCollectionsAsync()
const colour = cols.find((c) => c.name === 'Colour')
const V = {}
for (const id of colour.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id)
  if (v) V[v.name] = v
}

// Where the drawings live: one row, in the order the set is written down, so
// the eleventh lands in the eleventh slot whichever call puts it there. The
// row anchors on the first drawing already placed; only the first call has to
// go looking for clear space.
const ROW = ${JSON.stringify(ORDER)}
const placed = page.children.find((c) => /^art\\//.test(c.name))
const startX = placed
  ? placed.x - ROW.indexOf(placed.name.slice(4)) * 420
  : page.children.reduce((m, c) => Math.max(m, c.x + c.width), 0) + 200
const rowY = placed ? placed.y : 6400

const made = []
for (const a of ART) {
  const old = page.children.find((c) => c.name === 'art/' + a.name)
  const at = old ? { x: old.x, y: old.y } : { x: startX + ROW.indexOf(a.name) * 420, y: rowY }
  if (old) old.remove()
  const node = figma.createNodeFromSvg(a.svg)
  node.name = 'art/' + a.name
  page.appendChild(node)
  node.resize(360, 360)
  node.x = at.x; node.y = at.y
  // Every stroke is the one ink, every fill the card it sits on, and both
  // bound so the component follows the mode rather than being a dark picture.
  for (const d of node.findAll(() => true)) {
    if ('strokes' in d && d.strokes.length) {
      d.strokes = d.strokes.map((p2) =>
        p2.type === 'SOLID' ? figma.variables.setBoundVariableForPaint(p2, 'color', V['ink/ink']) : p2)
    }
    if ('fills' in d && Array.isArray(d.fills) && d.fills.length) {
      d.fills = d.fills.map((p2) =>
        p2.type === 'SOLID' ? figma.variables.setBoundVariableForPaint(p2, 'color', V['ground/sunken']) : p2)
    }
  }
  const comp = figma.createComponentFromNode(node)
  comp.name = 'art/' + a.name
  comp.description = a.name + ' — drawn by components/drawings.ts, exported by scripts/figma/art.mjs. Do not redraw by hand.'
  made.push({ name: comp.name, id: comp.id })
}
return { made, count: made.length }
`)
