/* Does the Figma file still say what the product says?

   The design file is a build rather than a photograph (11g.70), which is its
   whole point and also its whole risk: a build can drift. Nothing was watching
   it, and it drifted through four batches before anybody noticed — and when
   somebody finally looked, seven colour variables in it were the palette of a
   picture the product had stopped drawing.

   So: `figma/tokens.json` is what the file holds, read out of it rather than
   typed, and this compares it to `tokens.css`. It fails three ways.

     A variable Figma has and the product does not, or has at a different
     value in either theme. That is the file being ahead, or the product
     having been edited without the file.

     A colour token the product has and Figma does not. That is the file being
     behind — the common case, and the one that is invisible without a check,
     because everything still works. `codeOnly` in the snapshot lists what is
     deliberately not a Figma variable: opacities, shadows, blurs, timings and
     layout sizes, none of which are colours.

     A text style whose size, line height, weight or tracking has moved.

   What it cannot catch is the snapshot itself going stale, because nothing here
   talks to Figma — the MCP is an agent tool, not something a suite can call.
   Refreshing it is a person re-reading the file's collections. That is one
   manual step rather than none, and it is written down in design.md 11g.80. */
import { readFileSync } from 'node:fs'
import { check, teardown } from './lib/harness.mjs'

const snap = JSON.parse(readFileSync(new URL('../figma/tokens.json', import.meta.url), 'utf8'))
const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8')
const comp = readFileSync(new URL('../src/styles/components.css', import.meta.url), 'utf8')
const parts = JSON.parse(readFileSync(new URL('../figma/parts.json', import.meta.url), 'utf8'))

const ok = check

/* tokens.css holds the dark theme on a bare `:root` and the light one under
   `:root[data-theme='light']`. Split on that rather than on line numbers, so
   moving a declaration inside its own block does not break the reader. */
const lightAt = css.indexOf("[data-theme='light']")
const blocks = { Dark: css.slice(0, lightAt), Light: css.slice(lightAt) }

const read = (block, name) => {
  const m = [...block.matchAll(new RegExp(`--${name}\\s*:\\s*([^;]+);`, 'g'))]
  return m.length ? m[m.length - 1][1].trim() : null
}
const norm = (v) => {
  if (!v) return v
  const s = v.trim().toLowerCase()
  // #abc and #aabbcc are the same colour written two ways.
  const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s)
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : s
}

console.log('COLOUR  every variable in the file, in both modes')
{
  const off = []
  for (const [fig, v] of Object.entries(snap.colour.vars)) {
    for (const mode of ['Dark', 'Light']) {
      const got = norm(read(blocks[mode], v.css))
      const want = norm(v[mode])
      if (got !== want) off.push(`${fig} ${mode}: figma ${want}, css ${got ?? '(absent)'}`)
    }
  }
  ok(`all ${Object.keys(snap.colour.vars).length} agree with tokens.css in Dark and Light`,
     off.length === 0, off.slice(0, 6).join(' | '))
}

console.log('\nTHE OTHER DIRECTION  a colour the product has and the file does not')
{
  const known = new Set(Object.values(snap.colour.vars).map((v) => v.css))
  const allowed = new Set(snap.codeOnly)
  const extra = []
  // Only the dark block: a token declared in light and not in dark is a
  // separate fault and `contrast.mjs` is the suite for it.
  for (const m of blocks.Dark.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = m
    if (known.has(name) || allowed.has(name)) continue
    // A colour, rather than a number, a duration or a shadow.
    if (!/^#[0-9a-f]{3,8}$|^rgba?\(/i.test(value.trim())) continue
    extra.push(`--${name}: ${value.trim()}`)
  }
  ok('no colour token in the product is missing from the file',
     extra.length === 0, extra.join(' | '))
}

console.log('\nRADIUS  four corners, one source')
{
  const off = []
  for (const [name, v] of Object.entries(snap.radius)) {
    const got = read(blocks.Dark, v.css)
    if (norm(got) !== `${v.value}px`) off.push(`${name}: figma ${v.value}, css ${got ?? '(absent)'}`)
  }
  ok('all four agree', off.length === 0, off.join(' | '))
}

console.log('\nTYPE  eight styles, and the rules that draw them')
{
  const both = css + '\n' + comp
  const off = []
  for (const [name, t] of Object.entries(snap.textStyles)) {
    // Not `\b`: a word boundary sits between "y" and "-", so `.t-display\b`
    // matches `.t-display-xl` and reads the wrong rule. This suite found that
    // in itself on its first run, which is the correct number of bugs for a
    // drift checker to find in its own reader.
    const rule = new RegExp(`\\.${t.css}(?![-\\w])[^{]*\\{([^}]*)\\}`).exec(both)
    if (!rule) { off.push(`${name}: no .${t.css} rule`); continue }
    const body = rule[1]
    const num = (prop) => {
      const m = new RegExp(`${prop}\\s*:\\s*(-?[\\d.]+)`).exec(body)
      return m ? Number(m[1]) : null
    }
    const size = num('font-size')
    const line = num('line-height')
    const weight = num('font-weight')
    const track = num('letter-spacing') ?? 0
    if (size !== t.size) off.push(`${name}: size figma ${t.size}, css ${size}`)
    if (line !== t.lineHeight) off.push(`${name}: line figma ${t.lineHeight}, css ${line}`)
    if (weight !== t.weight) off.push(`${name}: weight figma ${t.weight}, css ${weight}`)
    if (Math.abs(track - t.tracking) > 0.0001) {
      off.push(`${name}: tracking figma ${t.tracking}, css ${track}`)
    }
  }
  ok(`all ${Object.keys(snap.textStyles).length} agree`, off.length === 0, off.slice(0, 6).join(' | '))
  ok('and the family the file uses is the family the product loads',
     new RegExp(`--font:\\s*'${snap.family}'`).test(css), snap.family)
}

console.log('\nPARTS  every drawn thing the product uses, and whether the file has it')
{
  // The icons are the one part of the design system the product adds to
  // casually: a new screen wants a new glyph and gets one, and nothing says
  // the file is now short of it. Batch P drew airtime, data and electricity;
  // eight icons went into the product and none into Figma, and the flows were
  // rebuilt two batches later with dashed boxes where the icons should be.
  // This is the check that would have said so at the time.
  const src = readFileSync(new URL('../src/icons.ts', import.meta.url), 'utf8')
  const body = src.slice(src.indexOf('export const icon'))
  const inCode = [...body.matchAll(/^ {2}([A-Za-z][\w]*):/gm)].map((m) => m[1])
  const inFigma = new Set(parts.icons)
  const short = inCode.filter((n) => !inFigma.has(n))
  const spare = parts.icons.filter((n) => !inCode.includes(n))
  ok(`all ${inCode.length} icons the product draws are in the file`,
     short.length === 0, short.join(' '))
  ok('and the file holds none the product stopped drawing',
     spare.length === 0, spare.join(' '))
}

console.log('\nSNAPSHOT  when the file was last read')
console.log(`  read on ${snap.pulledAt}. Nothing here can tell you whether Figma has`)
console.log('  moved since; re-read it when the file changes (design.md 11g.80).')
await teardown()
