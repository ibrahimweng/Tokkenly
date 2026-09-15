/* Before and after, side by side, both of them real builds.

   4173 serves this working tree; 4174 serves a worktree checked out at the
   commit before it (see design.md and the project's own rule about this). The
   two are shot at the same widths, in the same themes, with the same seeded
   account, and stitched into one image per screen so the pair is looked at
   rather than remembered. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
import { mkdirSync, readFileSync } from 'node:fs'

const AFTER = 'http://localhost:4173/#'
const BEFORE = 'http://localhost:4174/#'
const OUT = '/tmp/ba8'
mkdirSync(OUT, { recursive: true })

/* The two ports have to be two builds.

   They were not, once: a `vite preview` that found 4173 taken had quietly
   moved itself to 4174, the before-server refused to start on top of it, and
   every pair came out identical — before and after showing the same drawings,
   which reads as "nothing changed" rather than as "the harness is broken".
   The bundle name is the build's fingerprint, so compare those and stop. */
const bundle = async (u) => {
  const r = await fetch(u).then((x) => x.text()).catch(() => '')
  return (r.match(/index-[A-Za-z0-9_-]+\.js/) ?? ['(none)'])[0]
}
const [ba, bb] = await Promise.all([bundle('http://localhost:4173/'), bundle('http://localhost:4174/')])
if (ba === '(none)' || bb === '(none)') {
  console.log('FAIL  both ports must be serving. 4173:', ba, ' 4174:', bb)
  console.log('      after:  npx vite preview --port 4173')
  console.log('      before: git worktree add -f /tmp/before <sha> && (cd /tmp/before/app && npx vite build && npx vite preview --port 4174 --strictPort)')
  process.exit(1)
}
if (ba === bb) {
  console.log(`FAIL  4173 and 4174 are serving the same build (${ba}).`)
  console.log('      A stray preview is on 4174, or the before worktree was never built.')
  process.exit(1)
}
console.log(`after ${ba}  before ${bb}`)

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

/* Each shot: where to go, what to crop, and what to do first. */
const SHOTS = [
  { k: 'doors',   route: '/',          sel: '.gates',        widths: [1440], themes: ['dark', 'light'] },
  { k: 'grow',    route: '/grow',      sel: '.card.prod',    widths: [1440, 834, 390], themes: ['dark', 'light'], parent: true },
  { k: 'welcome', route: '/welcome/0', sel: null,            widths: [1440], themes: ['dark'], fresh: true },
  { k: 'empty',   route: '/invest',    sel: '.empty',        widths: [1440, 390], themes: ['dark', 'light'],
    before: async (p) => {
      const f = p.locator('.jump-field input, input[type="search"], input').first()
      await f.fill('zzzzqq'); await f.dispatchEvent('input'); await p.waitForTimeout(600)
    } },
  { k: 'bucket',  route: '/bucket',    sel: '.empty',        widths: [1440], themes: ['dark'] },
]

async function shoot(base, s, width, theme, path) {
  // deviceScaleFactor 1: a full-page phone capture at 2 is over the upload
  // ceiling, and the drawings are vector — the detail is in the lines, not in
  // the pixels per line.
  const c = await b.newContext({ viewport: { width, height: width < 500 ? 844 : 1000 }, deviceScaleFactor: 2 })
  const p = await c.newPage()
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  if (s.fresh) {
    await p.addInitScript(`try { localStorage.removeItem('tokkenly.prefs.v1'); sessionStorage.setItem('tokkenly.unlocked','1') } catch {}`)
  } else {
    await seen(p, { theme })
  }
  await p.goto(base + s.route, { waitUntil: 'networkidle' })
  if (s.fresh && theme === 'light') await p.evaluate(() => { document.documentElement.dataset.theme = 'light' })
  await p.waitForTimeout(700)
  if (s.before) await s.before(p)
  let loc = s.sel ? p.locator(s.sel).first() : null
  if (loc && s.parent) loc = loc.locator('xpath=..')
  try {
    if (loc) await loc.screenshot({ path })
    else await p.screenshot({ path })
  } catch {
    await p.screenshot({ path })
  }
  await c.close()
}

const b64 = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')

for (const s of SHOTS) {
  for (const width of s.widths) {
    for (const theme of s.themes) {
      const tag = `${s.k}-${width}-${theme}`
      const A = `${OUT}/_a-${tag}.png`
      const B = `${OUT}/_b-${tag}.png`
      await shoot(BEFORE, s, width, theme, B)
      await shoot(AFTER, s, width, theme, A)
      // Stitch: two columns, each labelled, on the theme's own ground.
      const c = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
      const pg = await c.newPage()
      const ground = theme === 'dark' ? '#0a0a0c' : '#f4f4f1'
      const ink = theme === 'dark' ? '#a6a6ad' : '#5c5c64'
      await pg.setContent(`<!doctype html><meta charset="utf-8">
        <style>
          body { margin:0; background:${ground}; color:${ink};
                 font:600 13px/1 ui-sans-serif,system-ui; }
          .row { display:flex; gap:24px; padding:24px; align-items:flex-start; }
          .col { flex:1 1 0; min-width:0; display:flex; flex-direction:column; gap:10px; }
          .col b { letter-spacing:.08em; text-transform:uppercase; font-size:11px; }
          img { width:100%; height:auto; display:block; }
          h1 { margin:24px 24px 0; font-size:13px; letter-spacing:.06em;
               text-transform:uppercase; font-weight:600; }
        </style>
        <h1>${s.k} &middot; ${width}px &middot; ${theme}</h1>
        <div class="row">
          <div class="col"><b>before</b><img src="${b64(B)}"></div>
          <div class="col"><b>after</b><img src="${b64(A)}"></div>
        </div>`)
      await pg.waitForTimeout(250)
      const h = await pg.evaluate(() => document.body.scrollHeight)
      await pg.setViewportSize({ width: 1600, height: Math.min(h, 4000) })
      await pg.waitForTimeout(150)
      await pg.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true })
      await c.close()
      console.log('wrote', tag)
    }
  }
}
await b.close()
