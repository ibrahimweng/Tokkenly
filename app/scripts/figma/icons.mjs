/* The icon set, as SVG, for building the ones Figma is missing as components.
 *
 * `icons.ts` is the only place the product's icons exist, so it is the only
 * honest source for the file. Bundled rather than parsed: a regex over the
 * source would work until the first icon composed out of a helper, and then it
 * would quietly emit the wrong shape.
 *
 * With --check it says which icons the product has and the file does not,
 * given the list of what is in the file; with names it writes the use_figma
 * script that builds those.
 *
 * Usage: node scripts/figma/icons.mjs --check <in-figma.json>
 *        node scripts/figma/icons.mjs bolt phone play > build.js
 */
import { build } from 'esbuild'
import { readFileSync, unlinkSync } from 'node:fs'

const tmp = new URL('../../.icons.bundle.mjs', import.meta.url)
await build({
  entryPoints: [new URL('../../src/icons.ts', import.meta.url).pathname],
  bundle: true, format: 'esm', write: true, logLevel: 'silent',
  outfile: tmp.pathname,
})
const { icon } = await import(tmp.href + '?t=' + Date.now())
unlinkSync(tmp)

/* The markup the app renders, with the two substitutions Figma's importer
   needs: it knows neither `currentColor` nor a CSS `var()`, so the ink goes in
   concrete and the script binds it to the variable afterwards. */
const SET = Object.entries(icon).map(([name, make]) => ({
  name,
  svg: make()
    .replace(/currentColor/g, '#DCDCE0')
    .replace(/ data-ic="[^"]*"/, '')
    .replace(/ class="ic"/, ''),
}))

const args = process.argv.slice(2)
if (args[0] === '--check') {
  const have = new Set(JSON.parse(readFileSync(args[1], 'utf8')))
  const gap = SET.filter((i) => !have.has(i.name)).map((i) => i.name)
  console.log('in code: ' + SET.length + '   in Figma: ' + have.size)
  console.log(gap.length ? 'missing from Figma:\n  ' + gap.join(' ') : 'nothing missing')
  process.exit(gap.length ? 1 : 0)
}

const want = args.filter((a) => !a.startsWith('--'))
const pick = SET.filter((i) => want.includes(i.name))
if (pick.length !== want.length) {
  console.error('no such icon: ' + want.filter((w) => !SET.some((i) => i.name === w)).join(' '))
  process.exit(1)
}

process.stdout.write(`
const ICONS = ${JSON.stringify(pick)}

const page = figma.root.children.find((p) => p.name === 'Icons')
await figma.setCurrentPageAsync(page)

const cols = await figma.variables.getLocalVariableCollectionsAsync()
const colour = cols.find((c) => c.name === 'Colour')
const V = {}
for (const id of colour.variableIds) {
  const v = await figma.variables.getVariableByIdAsync(id)
  if (v) V[v.name] = v
}

// The grid the page already uses, continued: twelve to a row, so a new icon
// lands beside the ones it belongs with rather than off on its own.
const laid = page.children.filter((c) => /^icon\\//.test(c.name))
const x0 = laid.length ? Math.min(...laid.map((c) => c.x)) : 0
const y0 = laid.length ? Math.min(...laid.map((c) => c.y)) : 0
const step = 96
let slot = laid.length

const made = []
for (const ic of ICONS) {
  const old = page.children.find((c) => c.name === 'icon/' + ic.name)
  const at = old
    ? { x: old.x, y: old.y }
    : { x: x0 + (slot % 12) * step, y: y0 + Math.floor(slot / 12) * step }
  if (old) old.remove(); else slot += 1
  const node = figma.createNodeFromSvg(ic.svg)
  node.name = 'icon/' + ic.name
  page.appendChild(node)
  node.resize(24, 24)
  node.x = at.x; node.y = at.y
  // One ink for the whole set, bound, so the icons follow the mode.
  for (const d of node.findAll(() => true)) {
    if ('strokes' in d && d.strokes.length) {
      d.strokes = d.strokes.map((p2) =>
        p2.type === 'SOLID' ? figma.variables.setBoundVariableForPaint(p2, 'color', V['ink/ink']) : p2)
    }
    if ('fills' in d && Array.isArray(d.fills) && d.fills.length) {
      d.fills = d.fills.map((p2) =>
        p2.type === 'SOLID' ? figma.variables.setBoundVariableForPaint(p2, 'color', V['ink/ink']) : p2)
    }
  }
  const comp = figma.createComponentFromNode(node)
  comp.name = 'icon/' + ic.name
  comp.description = 'Drawn by src/icons.ts, exported by scripts/figma/icons.mjs. Do not redraw by hand.'
  made.push({ name: comp.name, id: comp.id })
}
return { made, count: made.length }
`)
