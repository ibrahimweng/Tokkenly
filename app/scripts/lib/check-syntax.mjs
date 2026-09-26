/* `node --check` on every script, so a suite that no longer parses fails CI
   rather than failing the next person who runs it.

   Not a type check: the suites are plain JavaScript driving the DOM through
   Playwright, and typing them (checkJs) turned up two hundred complaints about
   Element versus HTMLInputElement and nothing that was wrong. ESLint covers
   the rest: undefined names, unused imports, duplicate keys. */
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(dir, e.name)) : /\.m?js$/.test(e.name) ? [join(dir, e.name)] : [])

let bad = 0
const files = walk(ROOT)
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' })
  } catch (e) {
    bad++
    console.log(`FAIL  ${relative(ROOT, f)}\n${String(e.stderr).trim()}\n`)
  }
}
console.log(`${files.length - bad} of ${files.length} scripts parse`)
process.exit(bad ? 1 : 0)
