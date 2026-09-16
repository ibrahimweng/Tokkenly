/* Turn an exported flow into the JavaScript that builds it in Figma.
 *
 * `use_figma` takes a code string, so this writes one. The tree goes in as a
 * compact literal and a short recursive builder walks it: a frame per box, a
 * text node per run, a component instance wherever the DOM named a part, and a
 * bound variable wherever the fill matches a token.
 *
 * Two things the 50,000-character argument forces, both handled here rather
 * than by asking less of the design:
 *
 *   - Several screens go in one call, comma-separated, when they fit.
 *   - One screen that does not fit goes in slices. The first call makes the
 *     frame and its first few top-level children; each later one finds the
 *     frame by name and appends the next few. The result is identical — the
 *     same children, in the same order, at the same coordinates — so this is a
 *     transport limit handled in transport, and not a change to the drawing.
 *
 * Usage: node scripts/_figma-build.mjs <flow-file> <indices> [parts] [n] [i]
 *        node scripts/_figma-build.mjs 02-home.json 0,1,2
 *        node scripts/_figma-build.mjs 03-....json 7 "" 3 0
 */
import { readFileSync } from 'node:fs'

/* The node builder, shared with _figma-chrome.mjs so the furniture and the
   screens around it are built by one piece of code. */
const NODE = readFileSync(new URL('./_figma-node.js', import.meta.url), 'utf8')

const [file, which, partsFile, nParts = '1', part = '0'] = process.argv.slice(2)
const doc = JSON.parse(readFileSync(new URL('../figma/flows/' + file, import.meta.url), 'utf8'))
const indices = String(which).split(',').map((s) => Number(s.trim()))
for (const i of indices) {
  if (!doc.screens[i]) { console.error('no screen ' + i + ' in ' + file); process.exit(1) }
}

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
  // A part's children live in the component, not here. Packing them anyway put
  // the whole nav rail into the payload of every screen that only needed to
  // say which rail it was.
  if (n.kids && !n.part) o.k = n.kids.map(pack).filter(Boolean)
  return o
}

const N = Number(nParts)
const P = Number(part)

/* Cut a screen that will not fit in one call into slices that do.
 *
 * The rule used to be: find the one node carrying most of the payload and
 * split its children. On an index page that is a chart card beside a
 * thirty-two row table it found nothing. The table is 56% of the screen, just
 * under the threshold the rule asked for, so the cut fell back to the root —
 * whose single child cannot be split — and slice 0 came out holding the whole
 * screen while the rest came out empty.
 *
 * This asks a simpler question. Walk for the biggest subtrees that already
 * fit, in the order they are drawn, and fill a slice until the next one would
 * not. Ancestors are carried in every slice that needs them, because the
 * builder finds the frame it already made rather than making a second one —
 * but a branch with nothing in this slice is dropped, since carrying it anyway
 * is what put the chart card in the payload of every slice of a page that is
 * mostly one table. */
const BUDGET = Number(process.env.SLICE_BUDGET || 21000)
const weigh = (n) => JSON.stringify(n).length

/* The largest subtrees that fit, in drawing order. A node too big to fit is
   replaced by its children; one with no children to give goes in over budget,
   because a single node is the smallest thing this can emit. */
function chunks(root) {
  const out = []
  const walk = (n) => {
    if (weigh(n) <= BUDGET || !(n.k ?? []).length) { out.push(n); return }
    for (const k of n.k) walk(k)
  }
  walk(root)
  return out
}

/* Fill each slice in order until the next chunk would not fit. Order matters:
   a screen built out of order would have its rows in the wrong places. */
function bins(root) {
  const out = []
  let cur = []
  let w = 0
  for (const c of chunks(root)) {
    const cw = weigh(c)
    if (cur.length && w + cw > BUDGET) { out.push(cur); cur = []; w = 0 }
    cur.push(c)
    w += cw
  }
  if (cur.length) out.push(cur)
  return out
}

/* This slice's tree: the chunks it owns, and only the ancestors above them. */
function prune(n, keep) {
  if (keep.has(n)) return n
  const kids = (n.k ?? []).map((k) => prune(k, keep)).filter(Boolean)
  return kids.length ? { ...n, k: kids } : null
}

const screens = indices.map((i) => {
  const sc = doc.screens[i]
  let t = pack(sc.tree)
  if (N > 1) {
    const parts = bins(t)
    process.stderr.write('slices=' + parts.length + '\n')
    if (P >= parts.length) { console.error('slice ' + P + ' of ' + parts.length); process.exit(1) }
    t = prune(t, new Set(parts[P])) ?? { ...t, k: [] }
  }
  return { name: sc.name, t }
})

const code = `
const PAGE = ${JSON.stringify(doc.flow)}
const PART = ${P}
const SCREENS = ${JSON.stringify(screens)}

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
// Read off children rather than findAllWithCriteria, which would need the page
// loaded and so a page switch — and a script gets one of those, which is spent
// on the page being built. Components sit at the top level of both library
// pages; a variant set holds its variants one level down.
//
// Three naming conventions live in this file: the drawings are art/NAME, the
// icons icon/name, and the older Mark variants Icon=Name. The exporter emits
// the bare name for all three, so all three prefixes come off, and the bare
// name is keyed in lower case as well — Icon=Home and icon/home are the same
// icon under two conventions, and a rail full of dashed placeholders is what
// disagreeing about that looks like.
const PARTS = {}
const missing = []
const take = (name, node) => { if (!PARTS[name]) PARTS[name] = node }
for (const pg of figma.root.children) {
  if (pg.name !== 'Design system' && pg.name !== 'Icons') continue
  for (const c of pg.children) {
    // The exporter emits a bare name: INVEST for a drawing, card for an
    // icon. Only the two prefixes that ARE a namespace come off. A
    // variant's own name does not: Mark has a variant called Icon=Card,
    // and stripping that to card let a 32px badge win the name of the
    // 18px icon — which is how the nav rail's advert ended up with a 1px
    // column of text down it reading "Card contents". A variant is
    // addressed through its set.
    if (c.type === 'COMPONENT') take(c.name.replace(/^(art\\/|icon\\/)/, ''), c)
    else if (c.type === 'COMPONENT_SET') {
      for (const v of c.children) if (v.type === 'COMPONENT') take(c.name + ' / ' + v.name, v)
    }
  }
}

await figma.loadFontAsync({ family: 'Geist', style: 'Regular' })
await figma.loadFontAsync({ family: 'Geist', style: 'Medium' })
await figma.loadFontAsync({ family: 'Geist', style: 'SemiBold' })
const styleFor = (w) => (w >= 600 ? 'SemiBold' : w >= 500 ? 'Medium' : 'Regular')

let page = figma.root.children.find((p) => p.name === PAGE)
if (!page) { page = figma.createPage(); page.name = PAGE }
await figma.setCurrentPageAsync(page)

${NODE}

const out = []
for (const S of SCREENS) {
  const T = S.t
  // One frame per screen, laid out left to right in the order they are built.
  // On slice 0 the frame is made fresh; on every later slice it is found and
  // appended to, so a screen too big for one call is still one frame.
  let frame = page.children.find((c) => c.name === S.name)
  if (PART === 0 && frame) { frame.remove(); frame = null }
  if (PART > 0 && !frame) throw new Error('slice ' + PART + ' of ' + S.name + ' but no frame')
  if (!frame) {
    const right = page.children.reduce((m, c) => Math.max(m, c.x + c.width), 0)
    frame = figma.createFrame()
    frame.name = S.name
    frame.resize(T.b[2], T.b[3])
    frame.x = right + 120
    frame.y = 0
    frame.clipsContent = true
    frame.fills = [figma.variables.setBoundVariableForPaint(
      { type: 'SOLID', color: rgb(T.f || '#0a0a0c') }, 'color', byName['ground/canvas'])]
    page.appendChild(frame)
  }
  for (const k of T.k || []) build(k, frame)
  out.push({ frame: frame.name, id: frame.id, children: frame.children.length })
}

return { page: page.name, slice: PART, built: out,
         missingParts: [...new Set(missing)] }
`
process.stdout.write(code)
