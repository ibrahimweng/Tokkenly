/* The chrome, as components.
 *
 * The rail and the tab bar are the same furniture on every screen — 7,573 of
 * Home's 28,116 characters, repeated eighty-six times. Eighty-six copies of
 * one rail is eighty-six places to change it, which is the opposite of what a
 * design file is for. This reads the subtrees the exporter marked, checks
 * that every name means exactly one drawing, and emits the script that builds
 * each one once on the Design system page. The flows then reference them.
 *
 * Usage: node scripts/_figma-chrome.mjs [--check] [names...] > /tmp/x.js
 */
import { readFileSync, readdirSync } from 'node:fs'

/* The node builder, shared with _figma-build.mjs. */
const NODE = readFileSync(new URL('./_figma-node.js', import.meta.url), 'utf8')

const DIR = new URL('../figma/flows/', import.meta.url)
const tok = JSON.parse(readFileSync(new URL('../figma/tokens.json', import.meta.url), 'utf8'))
const BY_HEX = {}
for (const [fig, v] of Object.entries(tok.colour.vars)) BY_HEX[v.Dark.toLowerCase()] = fig

/* Same encoding the builder reads, minus the part short-circuit: here the
   children are the point. */
const pack = (n) => {
  const o = { n: n.cls ? n.cls.split(' ')[0] : n.tag, b: [n.x, n.y, n.w, n.h] }
  if (n.fill) { o.f = n.fill.hex; if (n.fill.alpha < 1) o.fa = Number(n.fill.alpha.toFixed(2)) }
  if (n.fill && BY_HEX[n.fill.hex]) o.v = BY_HEX[n.fill.hex]
  if (n.radius) o.r = Math.round(n.radius)
  if (n.opacity !== undefined) o.o = Number(n.opacity.toFixed(2))
  if (n.text) {
    o.t = n.text.slice(0, 220)
    o.s = n.font.size; o.wt = n.font.weight; o.lh = n.font.line; o.c = n.font.ink
    if (n.font.tracking) o.ls = Number(n.font.tracking.toFixed(2))
    if (n.font.align && n.font.align !== 'start' && n.font.align !== 'left') o.ta = n.font.align
  }
  if (n.svg) o.g = n.svg
  if (n.part && !n.chrome) o.p = n.part
  if (n.kids) o.k = n.kids.map(pack)
  return o
}

/* Every chrome subtree in the export, by the name the exporter gave it. */
const found = new Map()
const clash = []
const find = (n, where) => {
  if (n.chrome) {
    const t = pack(n)
    // A part's position is the screen's business; the component starts at 0,0.
    const dx = t.b[0], dy = t.b[1]
    const shift = (m) => { m.b = [m.b[0] - dx, m.b[1] - dy, m.b[2], m.b[3]]; (m.k ?? []).forEach(shift) }
    shift(t)
    const seen = found.get(n.part)
    if (!seen) found.set(n.part, { tree: t, from: where })
    else if (JSON.stringify(seen.tree) !== JSON.stringify(t)) clash.push(`${n.part}: ${seen.from} vs ${where}`)
  }
  for (const k of n.kids ?? []) find(k, where)
}
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const doc = JSON.parse(readFileSync(new URL(f, DIR), 'utf8'))
  for (const s of doc.screens) find(s.tree, s.name)
}

const args = process.argv.slice(2)
if (args.includes('--check') || !args.length) {
  const rows = [...found.entries()]
    .map(([k, v]) => `${k.padEnd(28)} ${String(JSON.stringify(v.tree).length).padStart(6)}  ${v.from}`)
  console.log(rows.sort().join('\n'))
  // A name that means two different drawings is a name that is lying. Say so
  // rather than let the second one quietly win.
  if (clash.length) console.log('\nSAME NAME, DIFFERENT DRAWING:\n  ' + clash.join('\n  '))
  process.exit(clash.length ? 1 : 0)
}

const want = args.filter((a) => !a.startsWith('--'))
const pick = want.map((w) => {
  const hit = found.get(w)
  if (!hit) { console.error('no chrome named ' + w); process.exit(1) }
  return { name: w, tree: hit.tree }
})

process.stdout.write(`
const CHROME = ${JSON.stringify(pick)}

const rgb = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255,
})

const page = figma.root.children.find((p) => p.name === 'Design system')
await figma.setCurrentPageAsync(page)

const cols = await figma.variables.getLocalVariableCollectionsAsync()
const colour = cols.find((c) => c.name === 'Colour')
const byName = {}
for (const id of colour.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id)
  if (v) byName[v.name] = v
}

const PARTS = {}
const missing = []
const take = (node, name) => {
  const short = name.replace(/^(art\\/|icon\\/|Icon=)/, '')
  if (!PARTS[short]) PARTS[short] = node
  const low = short.toLowerCase()
  if (!PARTS[low]) PARTS[low] = node
}
for (const pg of figma.root.children) {
  if (pg.name !== 'Design system' && pg.name !== 'Icons') continue
  for (const c of pg.children) {
    if (c.type === 'COMPONENT') take(c, c.name)
    else if (c.type === 'COMPONENT_SET') for (const v of c.children) if (v.type === 'COMPONENT') take(v, v.name)
  }
}

await figma.loadFontAsync({ family: 'Geist', style: 'Regular' })
await figma.loadFontAsync({ family: 'Geist', style: 'Medium' })
await figma.loadFontAsync({ family: 'Geist', style: 'SemiBold' })
const styleFor = (w) => (w >= 600 ? 'SemiBold' : w >= 500 ? 'Medium' : 'Regular')

${NODE}

// The chrome sits in a row of its own, and each piece keeps the slot it was
// given, so rebuilding one does not shuffle the rest.
const placed = page.children.find((c) => /^(Nav rail|Tab bar) /.test(c.name))
const startX = placed ? placed.x : page.children.reduce((m, c) => Math.max(m, c.x + c.width), 0) + 200
const rowY = placed ? placed.y : 7400

const made = []
let n = 0
for (const c of CHROME) {
  const old = page.children.find((k) => k.name === c.name)
  const at = old ? { x: old.x, y: old.y } : { x: startX + n * 340, y: rowY }
  if (old) old.remove()
  const holder = figma.createFrame()
  holder.name = c.name
  holder.clipsContent = false
  page.appendChild(holder)
  holder.resize(Math.max(1, c.tree.b[2]), Math.max(1, c.tree.b[3]))
  holder.x = at.x; holder.y = at.y
  if (c.tree.f) {
    let paint = { type: 'SOLID', color: rgb(c.tree.f) }
    if (c.tree.fa !== undefined) paint.opacity = c.tree.fa
    if (c.tree.v && byName[c.tree.v]) paint = figma.variables.setBoundVariableForPaint(paint, 'color', byName[c.tree.v])
    holder.fills = [paint]
  } else holder.fills = []
  if (c.tree.r) holder.cornerRadius = c.tree.r
  for (const k of c.tree.k || []) build(k, holder)
  const comp = figma.createComponentFromNode(holder)
  comp.name = c.name
  comp.description = 'Chrome, read off the running product by scripts/_figma-read.mjs and built by _figma-chrome.mjs. Do not redraw by hand.'
  made.push({ name: comp.name, id: comp.id })
  n += 1
}
return { made, missing: [...new Set(missing)], count: made.length }
`)
