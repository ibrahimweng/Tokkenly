/* The six product pages, and the things every page on the site owes them.
   ---------------------------------------------------------------------------
   They are generated (site/build-products.mjs, from site/copy-products.mjs),
   which is exactly why they need checking: a template that goes wrong goes
   wrong six times, and a page nobody has opened is a page nobody has seen.

   Wants the site on SITE_URL (default :4321), which an app sweep does not
   start, hence the `_site` prefix that tells all.sh to leave it alone:

     npx serve site -l 4321 &
     node app/scripts/_siteprod.mjs
*/
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE, launch, open, ok, summary, SLUGS, PAGES } from './_sitelib.mjs'

/* Before opening a browser: are the committed pages the ones the builders
   would write? They are generated and committed, so a hand-edit to one of
   them lives until the next regeneration and then vanishes without a word.
   That has happened once already. Both builders, because they share a nav
   and a footer. */
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
console.log('=== in step with the builders ===')
for (const script of ['site/build-products.mjs', 'site/build-pages.mjs']) {
  try {
    ok(true, script.replace('site/', '').padEnd(20) +
      execFileSync('node', [script, '--check'], { cwd: REPO, encoding: 'utf8' }).trim())
  } catch (e) {
    ok(false, script.replace('site/', '').padEnd(20) + String(e.stderr || e.message).trim().replace(/\n/g, '\n        '))
  }
}

/* No personal address on a screen. The address mail is really delivered to
   carries a person's name, and it belongs in configuration — never as a
   placeholder, a seeded person or the address on a contact page. Rather than
   naming that address here (and so putting it in one more file), this reads
   every address in everything the site serves and allows only the three
   kinds the project allows: the support role, a visitor's you@example.com,
   and an invented person at example.com. */
console.log('\n=== nobody\'s name on a screen ===')
const SITE = join(REPO, 'site')
const served = []
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name)
    if (e.isDirectory()) { if (!['api', 'img', 'fonts'].includes(e.name)) walk(p) }
    else if (/\.(html|js|css|xml|txt)$/.test(e.name)) served.push(p)
  }
}
walk(SITE)
const ALLOWED = /^(support@tokkenly\.com|[^@\s]+@example\.com)$/i
let strays = []
for (const f of served) {
  const found = readFileSync(f, 'utf8').match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []
  for (const a of found) if (!ALLOWED.test(a)) strays.push(`${a} in ${f.replace(REPO + '/', '')}`)
}
ok(strays.length === 0, strays.length
  ? 'addresses that are not support@ or example.com: ' + strays.join(', ')
  : `${served.length} served files, and every address in them is support@ or example.com`)

const b = await launch()

for (const w of [1440, 834, 390]) {
  console.log(`\n=== ${w} ===`)
  for (const slug of SLUGS) {
    const p = await b.newPage({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 1 })
    const errs = []
    p.on('pageerror', (e) => errs.push('js: ' + e.message))
    p.on('requestfailed', (r) => errs.push('failed: ' + r.url().split('/').pop()))
    p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ': ' + r.url().split('/').pop()) })
    try {
      await open(p, `/products/${slug}`)
    } catch (e) { ok(false, `${slug.padEnd(20)} ${e.message}`); await p.close(); continue }
    await p.evaluate(async () => {
      const s = innerHeight * 0.8
      for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
    })
    await p.waitForTimeout(300)
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const h1 = await p.$$eval('h1', (e) => e.length)
    ok(errs.length === 0 && over === 0 && h1 === 1,
      `${slug.padEnd(20)} ${errs.length ? errs.slice(0, 2).join(' | ') : ''}${over ? ' sideways ' + over + 'px' : ''}${h1 !== 1 ? ' h1s:' + h1 : ''}`.trimEnd() ||
      `${slug.padEnd(20)} clean`)
    await p.close()
  }
}

/* Every link on every page answers 200 at the address it is written as, and
   every #anchor it names exists on the page it lands on. A link that only
   works through a redirect — /about.html answered with a 308 to /about — is a
   FAIL too: cleanUrls makes that a round trip on every click. */
console.log('\n=== links ===')
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
const seen = new Map()
for (const path of PAGES) {
  await open(p, path)
  const hrefs = await p.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')))
  for (const h of hrefs) {
    /* Anything carrying a scheme is somebody else's to resolve — the app on
       its own domain, and the contact page's mailto:. */
    if (!h || /^[a-z][a-z0-9+.-]*:/i.test(h)) continue
    const u = new URL(h, BASE + path)
    const hash = u.hash.slice(1)
    u.hash = ''
    const key = u.href + (hash ? '#' + hash : '')
    if (seen.has(key)) continue
    const r = await p.request.get(u.href, { maxRedirects: 0 })
    let why = r.status() === 200 ? '' : String(r.status())
    if (!why && hash && !(new RegExp(`\\sid="${hash}"`).test(await r.text()))) why = 'no #' + hash
    seen.set(key, why)
  }
}
for (const [u, why] of seen) ok(!why, `${why || '200'}  ${u.replace(BASE, '')}`)

/* Six pages, and no two of them the same shape. The whole point of building
   them from their frames: if a future edit collapses them back onto one
   template, this is the line that notices. */
console.log('\n=== shapes ===')
const shapes = new Map()
for (const slug of SLUGS) {
  await open(p, `/products/${slug}`, { waitUntil: 'domcontentloaded' })
  shapes.set(slug, await p.$$eval('main > section', (ss) => ss
    .map((x) => [...x.classList].filter((c) => c !== 'reveal').join('.')).join(' | ')))
}
for (const [slug, shape] of shapes) {
  const twin = [...shapes].find(([s2, sh]) => s2 !== slug && sh === shape)
  ok(!twin, `${slug.padEnd(20)} ${twin ? 'is the same shape as ' + twin[0] : 'has a shape of its own'}`)
}

/* No whole phones. The first version of these pages put 780x1600 app
   screenshots on coloured slabs beside every paragraph; the frames never do,
   and nor does the landing page. So: none of those files on a product page,
   and the hero's "See how it works" lands on the page's #more. */
console.log('\n=== compact ===')
const SHOTS = /(^|\/)(p-[a-z]+|stock|home|wallet|invest)\.webp$/
for (const slug of SLUGS) {
  await open(p, `/products/${slug}`)
  const m = await p.evaluate(() => ({
    shot: [...document.querySelectorAll('main img')].map((i) => i.getAttribute('src')),
    hero: document.querySelector('main > section') ? Math.round(document.querySelector('main > section').getBoundingClientRect().height) : 0,
    more: !!document.getElementById('more'),
  }))
  const shot = m.shot.find((s) => SHOTS.test(s || ''))
  ok(!shot && m.hero > 0 && m.more,
    `${slug.padEnd(20)} hero ${m.hero}px${shot ? '  SCREENSHOT: ' + shot : ''}${m.more ? '' : '  NO #more'}${m.hero ? '' : '  NO HERO'}`)
}

/* The receipt has to read. `.pr-card p` is one class and one element and beats
   any colour a white panel inside that card merely inherits, which is how the
   landing page's own pop-up spent a while as pale mint on white. */
console.log('\n=== the panels read ===')
for (const [url, sel] of [['/', '.popup .pop-v'], ['/products/receive-and-send', '.p2-pn .p2-pn-row b']]) {
  await open(p, url)
  const el = await p.$(sel)
  if (!ok(!!el, `${url.padEnd(28)} has ${sel}`)) continue
  const col = await el.evaluate((e) => getComputedStyle(e).color)
  const [r, g, bl] = col.match(/\d+/g).map(Number)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255
  ok(lum < 0.35, `${url.padEnd(28)} ${sel} is ${col}`)
}

/* A 52px badge drawn as min(52px, 2.709vw) is 10px on a phone. */
console.log('\n=== the chips survive a phone ===')
await p.setViewportSize({ width: 390, height: 900 })
for (const url of ['/', '/products/tokenized-stocks']) {
  await open(p, url)
  const box = await p.$('.pr-chip').then((e) => e && e.boundingBox())
  ok(!!box && box.width >= 40, `${url.padEnd(34)} chip is ${box ? Math.round(box.width) + 'px' : 'missing'}`)
}

await b.close()
summary()
