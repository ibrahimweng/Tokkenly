/* The two nav bugs, before and after, from two real builds on two ports.

   4173 is the working build. 4174 is a worktree at the commit before the fix.
   Run it by hand:

     (cd app && npx vite preview --port 4173 --strictPort) &
     git worktree add /tmp/before <sha>
     (cd /tmp/before/app && npm run build && npx vite preview --port 4174 --strictPort) &
     node app/scripts/_shot-nav.mjs [outdir]
*/
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { seen } from './seen.mjs'

const OUT = process.argv[2] ?? '/tmp'
mkdirSync(OUT, { recursive: true })
const PORTS = { before: 4174, after: 4173 }
const SHOTS = [
  ['bucket-rail', '/bucket', 1440, { clip: { x: 0, y: 0, width: 260, height: 500 } }],
  ['spend-bar', '/spend', 390, { clip: { x: 0, y: 760, width: 390, height: 84 } }],
]

/* Both halves or nothing.
 *
 *  This lives in scripts/, so all.sh runs it with everything else — and a
 *  normal sweep starts one preview, not two. Crashing there would be a capture
 *  script reporting a failure of the product, which is a lie with a stack
 *  trace on it. No before to compare against is not a failure, it is nothing
 *  to do, so say which port is missing and stand down. */
const up = async (u) => {
  try { return (await fetch(u, { method: 'HEAD' })).ok } catch { return false }
}
for (const [side, port] of Object.entries(PORTS)) {
  if (await up(`http://localhost:${port}/`)) continue
  console.log(`no ${side} build on http://localhost:${port} — nothing to compare, skipping.`)
  console.log('Serve it with: npx vite preview --port 4174 --strictPort (from a worktree)')
  process.exit(0)
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [name, route, w, opt] of SHOTS) {
  for (const [side, port] of Object.entries(PORTS)) {
    const c = await b.newContext({ viewport: { width: w, height: w < 500 ? 844 : 1000 }, deviceScaleFactor: 2 })
    const p = await c.newPage()
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
    await seen(p, {})
    await p.goto(`http://localhost:${port}/#${route}`, { waitUntil: 'networkidle' })
    await p.waitForTimeout(600)
    await p.screenshot({ path: `${OUT}/${name}-${side}.png`, ...opt })
    await c.close()
  }
  console.log('shot ' + name)
}
await b.close()
