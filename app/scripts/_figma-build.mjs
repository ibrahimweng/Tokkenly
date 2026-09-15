/* Turn an exported flow into the JavaScript that builds it in Figma.
 *
 * `use_figma` takes a code string, so this writes one. The tree goes in as a
 * compact literal and a short recursive builder walks it: a frame per box, a
 * text node per run, auto-layout wherever the CSS was flex, and a bound
 * variable wherever the fill matches a token.
 *
 * Usage: node scripts/_figma-build.mjs <flow-file> <screen-index>  > /tmp/x.js
 */
import { readFileSync } from 'node:fs'

const [file, which, partsFile] = process.argv.slice(2)
const PARTS = partsFile ? readFileSync(partsFile, 'utf8').trim() : '{}'
const doc = JSON.parse(readFileSync(new URL('../figma/flows/' + file, import.meta.url), 'utf8'))
const screen = doc.screens[Number(which)]

/* Compact: one-letter keys, no nulls, no empty strings. The tree is going into
   a 50,000-character argument, so every repeated key name costs. */
const tok = doc.tokens
const pack = (n) => {
  const o = {}
  if (n.cls) o.n = n.cls.split(' ')[0]
  else o.n = n.tag
  o.b = [n.x, n.y, n.w, n.h]
  if (n.fill) { o.f = n.fill.hex; if (n.fill.alpha < 1) o.fa = Number(n.fill.alpha.toFixed(2)) }
  if (n.fill && tok[n.fill.hex]) o.v = tok[n.fill.hex]
  if (n.radius) o.r = Math.round(n.radius)
  if (n.opacity !== undefined) o.o = Number(n.opacity.toFixed(2))
  if (n.text) {
    o.t = n.text.slice(0, 220)
    o.s = n.font.size; o.wt = n.font.weight; o.lh = n.font.line
    o.c = n.font.ink
    if (n.font.tracking) o.ls = Number(n.font.tracking.toFixed(2))
    if (n.font.align && n.font.align !== 'start' && n.font.align !== 'left') o.ta = n.font.align
  }
  if (n.svg) o.g = n.svg
  if (n.part) o.p = n.part
  if (n.kids) o.k = n.kids.map(pack).filter(Boolean)
  return o
}
const tree = pack(screen.tree)

const code = `
const PAGE = ${JSON.stringify(doc.flow)}
const NAME = ${JSON.stringify(screen.name)}
const T = ${JSON.stringify(tree)}

const rgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255,
})

// The Colour collection, so a fill that is a token binds to it.
const cols = await figma.variables.getLocalVariableCollectionsAsync()
const colour = cols.find((c) => c.name === 'Colour')
const byName = {}
for (const id of colour.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id)
  if (v) byName[v.name] = v
}

// Every component in the file, by name, so a named part becomes an instance.
const PARTS = {}
const missing = []
for (const pg of figma.root.children) {
  if (pg.name !== 'Design system' && pg.name !== 'Icons') continue
  await figma.setCurrentPageAsync(pg)
  for (const c of pg.findAllWithCriteria({ types: ['COMPONENT'] })) {
    const short = c.name.replace(/^art\//, '').replace(/^Icon=/, '')
    if (!PARTS[short]) PARTS[short] = c
  }
}

await figma.loadFontAsync({ family: 'Geist', style: 'Regular' })
await figma.loadFontAsync({ family: 'Geist', style: 'Medium' })
await figma.loadFontAsync({ family: 'Geist', style: 'SemiBold' })
const styleFor = (w) => (w >= 600 ? 'SemiBold' : w >= 500 ? 'Medium' : 'Regular')

let page = figma.root.children.find((p) => p.name === PAGE)
if (!page) { page = figma.createPage(); page.name = PAGE }
await figma.setCurrentPageAsync(page)

// One frame per screen, laid out left to right in the order they are built.
const existing = page.children.find((c) => c.name === NAME)
if (existing) existing.remove()
const right = page.children.reduce((m, c) => Math.max(m, c.x + c.width), 0)

const build = (n, parent) => {
  // A named part is a component in this file. Place an instance rather than a
  // copy, so editing the component edits every screen that uses it.
  if (n.p) {
    const comp = PARTS[n.p]
    let node
    if (comp) { node = comp.createInstance() }
    else {
      node = figma.createFrame()
      node.fills = []
      node.strokes = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.65 } }]
      node.dashPattern = [3, 3]
      missing.push(n.p)
    }
    node.name = n.p
    parent.appendChild(node)
    node.x = n.b[0]; node.y = n.b[1]
    try { node.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3])) } catch {}
    if (n.o !== undefined) node.opacity = n.o
    return node
  }
  if (n.g) {
    const node = figma.createNodeFromSvg(n.g)
    node.name = n.n || 'art'
    parent.appendChild(node)
    node.x = n.b[0]; node.y = n.b[1]
    try { node.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3])) } catch {}
    if (n.o !== undefined) node.opacity = n.o
    return node
  }
  if (n.t !== undefined) {
    const t = figma.createText()
    t.fontName = { family: 'Geist', style: styleFor(n.wt) }
    t.characters = n.t
    t.fontSize = n.s
    t.lineHeight = { unit: 'PIXELS', value: n.lh }
    if (n.ls) t.letterSpacing = { unit: 'PIXELS', value: n.ls }
    t.fills = [{ type: 'SOLID', color: rgb(n.c) }]
    t.textAutoResize = 'HEIGHT'
    t.name = n.t.slice(0, 40)
    parent.appendChild(t)
    t.x = n.b[0]; t.y = n.b[1]
    try { t.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3])) } catch {}
    if (n.ta === 'center') t.textAlignHorizontal = 'CENTER'
    if (n.ta === 'right' || n.ta === 'end') t.textAlignHorizontal = 'RIGHT'
    if (n.o !== undefined) t.opacity = n.o
    return t
  }
  const f = figma.createFrame()
  f.name = n.n || 'box'
  f.clipsContent = false
  parent.appendChild(f)
  f.x = n.b[0]; f.y = n.b[1]
  f.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3]))
  if (n.f) {
    let paint = { type: 'SOLID', color: rgb(n.f) }
    if (n.fa !== undefined) paint.opacity = n.fa
    if (n.v && byName[n.v]) {
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', byName[n.v])
    }
    f.fills = [paint]
  } else {
    f.fills = []
  }
  if (n.r) f.cornerRadius = n.r
  if (n.o !== undefined) f.opacity = n.o
  for (const k of n.k || []) {
    const c = build(k, f)
    // Children came out of the DOM in page coordinates; make them the frame's.
    if (c) { c.x = c.x - n.b[0]; c.y = c.y - n.b[1] }
  }
  return f
}

const frame = figma.createFrame()
frame.name = NAME
frame.resize(T.b[2], T.b[3])
frame.x = right + 120
frame.y = 0
frame.clipsContent = true
frame.fills = [figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: rgb(T.f || '#0a0a0c') }, 'color', byName['ground/canvas'])]
page.appendChild(frame)
for (const k of T.k || []) build(k, frame)

return { page: page.name, frame: frame.name, id: frame.id,
         children: frame.children.length,
         missingParts: [...new Set(missing)] }
`
process.stdout.write(code)
