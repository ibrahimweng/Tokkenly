/* The eight product pages.
   ---------------------------------------------------------------------------
   They are generated (site/build-products.mjs, from site/copy-products.mjs),
   which is exactly why they need checking: a template that goes wrong goes
   wrong eight times, and a page nobody has opened is a page nobody has seen.

   Wants the site on 4321, which an app sweep does not start, hence the
   `_site` prefix that tells all.sh to leave it alone:

     (cd site && python3 -m http.server 4321) &
     node app/scripts/_siteprod.mjs
*/
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/* Before opening a browser: are the committed pages the ones the builder
   would write? They are generated and committed, so a hand-edit to one of
   them lives until the next regeneration and then vanishes without a word.
   That has happened once already. */
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
console.log('=== in step with the builder ===')
let builderOk = true
/* Both builders, because they share a nav and a footer: build-pages imports
   them from build-products, so one routing change regenerates all eleven
   pages. That is exactly the edit that quietly undid the product pages' cta
   fix, and checking half the site would have missed it just as well. */
for (const script of ['site/build-products.mjs', 'site/build-pages.mjs']) {
  try {
    console.log('  ok    ' + script.replace('site/', '').padEnd(20) +
      execFileSync('node', [script, '--check'], { cwd: REPO, encoding: 'utf8' }).trim())
  } catch (e) {
    builderOk = false
    console.log('  FAIL  ' + script.replace('site/', '').padEnd(20) +
      String(e.stderr || e.message).trim().replace(/\n/g, '\n        '))
  }
}

const SLUGS = ['tokenized-stocks', 'gifting-and-rewards', 'receive', 'send',
               'pay-bills', 'convert', 'earn', 'borrow']
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let bad = builderOk ? 0 : 1
const ok = (c, m) => { console.log(`${c ? '  ok  ' : '  FAIL'}  ${m}`); if (!c) bad++ }

for (const w of [1440, 834, 390]) {
  console.log(`\n=== ${w} ===`)
  for (const slug of SLUGS) {
    const p = await b.newPage({ viewport: { width: w, height: 1000 }, deviceScaleFactor: 1 })
    const errs = []
    p.on('pageerror', (e) => errs.push('js: ' + e.message))
    p.on('requestfailed', (r) => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) errs.push('404: ' + r.url().split('/').pop()) })
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
    await p.goto(`http://localhost:4321/products/${slug}.html`, { waitUntil: 'load' })
    await p.evaluate(async () => {
      const s = innerHeight * 0.8
      for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
    })
    await p.waitForTimeout(300)
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const h1 = await p.$$eval('h1', (e) => e.length)
    ok(errs.length === 0 && over === 0 && h1 === 1,
      `${slug.padEnd(20)} ${errs.length ? errs.slice(0,2).join(' | ') : ''}${over ? ' sideways ' + over + 'px' : ''}${h1 !== 1 ? ' h1s:' + h1 : ''}`.trimEnd() ||
      `${slug.padEnd(20)} clean`)
    await p.close()
  }
}

/* every link on every page resolves */
console.log('\n=== links ===')
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
const seen = new Map()
for (const slug of [...SLUGS, null]) {
  const url = slug ? `http://localhost:4321/products/${slug}.html` : 'http://localhost:4321/index.html'
  await p.goto(url, { waitUntil: 'load' })
  const hrefs = await p.$$eval('a[href]', (as) => as
    .filter((a) => !a.hasAttribute('data-soon'))
    .map((a) => a.getAttribute('href')))
  for (const h of hrefs) {
    if (!h || h.startsWith('#') || h.startsWith('http')) continue
    const abs = new URL(h, url).href
    if (!seen.has(abs)) {
      const r = await p.request.get(abs)
      seen.set(abs, r.status())
    }
  }
}
for (const [u, st] of seen) ok(st === 200, `${st}  ${u.replace('http://localhost:4321', '')}`)

/* Eight pages, and no two of them the same shape. The whole point of the
   rebuild: if a future edit collapses them back onto one template, this is
   the line that notices. */
console.log('\n=== shapes ===')
const shapes = new Map()
for (const slug of SLUGS) {
  await p.goto(`http://localhost:4321/products/${slug}.html`, { waitUntil: 'domcontentloaded' })
  const shape = await p.$$eval('main > section', (ss) => ss
    .map((x) => [...x.classList].filter((c) => c !== 'reveal').join('.') + ':' +
      [...x.querySelectorAll('.fx-stats,.fx-facts,.fx-cmp,.fx-two,.fx-slab,.steps,.faq,.pr-grid,.ts-cards,.sp-in,.prod-more,.prod-risk')]
        .map((e) => e.className.split(' ')[0]).join(','))
    .join(' | '))
  shapes.set(slug, shape)
}
for (const [slug, shape] of shapes) {
  const twin = [...shapes].find(([s2, sh]) => s2 !== slug && sh === shape)
  ok(!twin, `${slug.padEnd(20)} ${twin ? 'is the same shape as ' + twin[0] : 'has a shape of its own'}`)
}
/* ---------------------------------------------------------------------------
   The one that the redesign exists for.

   These pages used to put a whole 780x1600 phone screenshot on a coloured
   slab beside every paragraph: 656 tall against ninety words, so the picture
   outweighed the copy four to one and no page fitted a screen. The landing
   page never shows a whole phone — it shows a receipt of four rows and a
   button, built in markup.

   So: no app screenshots on a product page, no panel taller than the copy it
   stands beside, and the whole introduction inside one screen. */
console.log('\n=== compact ===')
const SHOTS = /(^|\/)(p-[a-z]+|stock|home|wallet|invest)\.webp$/
await p.setViewportSize({ width: 1440, height: 900 })
for (const slug of SLUGS) {
  await p.goto(`http://localhost:4321/products/${slug}.html`, { waitUntil: 'load' })
  await p.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')))
  const m = await p.evaluate(() => {
    const h = (e) => Math.round(e.getBoundingClientRect().height)
    const pairs = []
    for (const row of document.querySelectorAll('.pr-wide')) {
      const pn = row.querySelector('.pn'), body = row.querySelector('.pr-body')
      if (pn && body) pairs.push([h(pn), h(body)])
    }
    for (const row of document.querySelectorAll('.sp-in, .ph-in')) {
      const pn = row.querySelector('.pn'), text = row.querySelector('.sp-text, .ph-text')
      if (pn && text) pairs.push([h(pn), h(text)])
    }
    return {
      shots: [...document.querySelectorAll('main img')].map((i) => i.getAttribute('src')),
      tallest: Math.max(0, ...[...document.querySelectorAll('.pn')].map(h)),
      hero: Math.round(document.querySelector('.hero-product').getBoundingClientRect().bottom),
      pairs,
    }
  })
  const shot = m.shots.find((s) => SHOTS.test(s || ''))
  const fat = m.pairs.find(([pn, text]) => pn > text * 1.5 + 40)
  ok(!shot && m.tallest <= 460 && m.hero <= 1000 && !fat,
    `${slug.padEnd(20)} panel ${String(m.tallest).padStart(3)}px, hero ends ${m.hero}px` +
    `${shot ? '  SCREENSHOT: ' + shot : ''}${m.tallest > 460 ? '  TOO TALL' : ''}` +
    `${m.hero > 1000 ? '  HERO OVERRUNS' : ''}${fat ? `  panel ${fat[0]} vs copy ${fat[1]}` : ''}`)
}

/* The receipt has to read. `.pr-card p` is one class and one element and beats
   any colour a white panel inside that card merely inherits, which is how the
   landing page's own pop-up spent a while as pale mint on white. */
console.log('\n=== the panels read ===')
for (const [url, sel] of [['index.html', '.popup .pop-v'], ['products/send.html', '.pn .pn-v']]) {
  await p.goto('http://localhost:4321/' + url, { waitUntil: 'load' })
  const col = await p.$eval(sel, (e) => getComputedStyle(e).color)
  const [r, g, bl] = col.match(/\d+/g).map(Number)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255
  ok(lum < 0.35, `${url.padEnd(24)} ${sel} is ${col}`)
}

/* A 52px badge drawn as min(52px, 2.709vw) is 10px on a phone. */
console.log('\n=== the chips survive a phone ===')
await p.setViewportSize({ width: 390, height: 900 })
for (const url of ['index.html', 'products/tokenized-stocks.html']) {
  await p.goto('http://localhost:4321/' + url, { waitUntil: 'load' })
  const w = await p.$eval('.pr-chip', (e) => Math.round(e.getBoundingClientRect().width))
  ok(w >= 40, `${url.padEnd(34)} chip is ${w}px`)
}

await b.close()
console.log(`\n${bad ? 'FAIL=' + bad : 'FAIL=0'}`)
process.exit(bad ? 1 : 0)
