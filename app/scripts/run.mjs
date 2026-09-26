/* npm test: every suite in scripts/, against a fresh preview of dist/.

   It starts `vite preview` on a free port, runs each suite one after another
   with BASE_URL pointing at it, and ends with one line per suite and a
   non-zero exit if any of them failed or crashed. It does not build: run
   `npm run build` first, so what is tested is what would be deployed.

     npm test                      every suite
     npm test -- flows walk        just these
     BASE_URL=http://localhost:4173 npm test
                                   against a server that is already up
     DIST=/elsewhere npm test      a build written with --outDir
     VERBOSE=1 npm test            every suite's full output, not just its
                                   failures

   A suite is any .mjs directly in scripts/ whose name does not start with an
   underscore. Helpers live in scripts/lib/, tools in scripts/figma/, and the
   `_site*` scripts belong to the marketing site and need its server. */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { createServer } from 'node:net'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const APP = join(HERE, '..')
const DIST = process.env.DIST || join(APP, 'dist')
const PER_SUITE_MS = Number(process.env.SUITE_TIMEOUT_MS || 5 * 60_000)
const VERBOSE = !!process.env.VERBOSE

const wanted = process.argv.slice(2)
const suites = readdirSync(HERE)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_') && f !== 'run.mjs')
  .map((f) => f.replace(/\.mjs$/, ''))
  .filter((s) => !wanted.length || wanted.includes(s))
  .sort()
const unknown = wanted.filter((w) => !suites.includes(w))
if (unknown.length) {
  console.error(`No suite called ${unknown.join(', ')}.`)
  process.exit(2)
}

/* ---- the server ---- */

const freePort = () =>
  new Promise((res, rej) => {
    const s = createServer()
    s.unref()
    s.on('error', rej)
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => res(port))
    })
  })

async function waitFor(url, ms = 20_000) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    try {
      const r = await fetch(url)
      if (r.ok) return true
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  return false
}

let server = null
let base = process.env.BASE_URL
if (!base) {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error(`No build to test: ${DIST}/index.html is missing. Run \`npm run build\` first.`)
    process.exit(2)
  }
  const port = await freePort()
  const vite = join(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin', 'vite.js')
  server = spawn(process.execPath, [vite, 'preview', '--outDir', DIST, '--port', String(port), '--strictPort', '--host', '127.0.0.1'],
    { cwd: APP, stdio: ['ignore', 'pipe', 'pipe'] })
  let serverLog = ''
  server.stdout.on('data', (d) => (serverLog += d))
  server.stderr.on('data', (d) => (serverLog += d))
  base = `http://127.0.0.1:${port}`
  if (!(await waitFor(base + '/'))) {
    console.error(`vite preview did not come up on ${base}.\n${serverLog}`)
    server.kill()
    process.exit(2)
  }
}
const stop = () => server?.kill()
process.on('SIGINT', () => { stop(); process.exit(130) })
console.log(`Testing ${base} with ${suites.length} suite${suites.length === 1 ? '' : 's'}\n`)

/* ---- the suites ---- */

function run(name) {
  return new Promise((res) => {
    const started = Date.now()
    const child = spawn(process.execPath, [join(HERE, name + '.mjs')], {
      cwd: APP,
      env: { ...process.env, BASE_URL: base },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    child.stdout.on('data', (d) => { out += d; if (VERBOSE) process.stdout.write(d) })
    child.stderr.on('data', (d) => { out += d; if (VERBOSE) process.stderr.write(d) })
    const timer = setTimeout(() => { out += `\n(killed after ${PER_SUITE_MS / 1000}s)`; child.kill('SIGKILL') }, PER_SUITE_MS)
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      res({ name, code: code ?? (signal ? 1 : 0), out, ms: Date.now() - started })
    })
  })
}

const results = []
for (const name of suites) {
  const r = await run(name)
  const fails = r.out.split('\n').filter((l) => /^\s*FAIL\b/.test(l))
  // The last tally line, wherever it is: a warning on stderr can follow it.
  const tally = [...r.out.matchAll(/^(\d+) passed, (\d+) failed$/gm)].pop()
  // A FAIL line is a failure even if the suite forgot to set its exit code,
  // and a non-zero exit with no FAIL line is a crash, not a pass.
  r.status = fails.length ? 'FAIL' : r.code !== 0 ? 'CRASH' : 'PASS'
  results.push(r)
  const secs = (r.ms / 1000).toFixed(1).padStart(5) + 's'
  const counts = tally ? `${tally[1]} passed, ${tally[2]} failed` : ''
  console.log(`${r.status.padEnd(5)}  ${name.padEnd(13)} ${secs}  ${counts}`)
  if (!VERBOSE) {
    if (r.status === 'FAIL') for (const l of fails.slice(0, 12)) console.log('         ' + l.trim())
    if (r.status === 'FAIL' && fails.length > 12) console.log(`         … and ${fails.length - 12} more`)
    if (r.status === 'CRASH') for (const l of r.out.trim().split('\n').slice(-8)) console.log('         ' + l)
  }
}
stop()

const bad = results.filter((r) => r.status !== 'PASS')
console.log(`\n${results.length - bad.length} of ${results.length} suites passed` +
  (bad.length ? `; failing: ${bad.map((r) => `${r.name} (${r.status.toLowerCase()})`).join(', ')}` : ''))
process.exit(bad.length ? 1 : 0)
