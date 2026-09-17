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
const SLUGS = ['tokenized-stocks', 'gifting-and-rewards', 'receive', 'send',
               'pay-bills', 'convert', 'earn', 'borrow']
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let bad = 0
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
      [...x.querySelectorAll('.fx-stats,.fx-alt,.fx-facts,.fx-cmp,.fx-two,.fx-quote,.steps,.grid-3,.faq,.prod-more,.prod-risk')]
        .map((e) => e.className.split(' ')[0]).join(','))
    .join(' | '))
  shapes.set(slug, shape)
}
for (const [slug, shape] of shapes) {
  const twin = [...shapes].find(([s2, sh]) => s2 !== slug && sh === shape)
  ok(!twin, `${slug.padEnd(20)} ${twin ? 'is the same shape as ' + twin[0] : 'has a shape of its own'}`)
}
await b.close()
console.log(`\n${bad ? 'FAIL=' + bad : 'FAIL=0'}`)
process.exit(bad ? 1 : 0)
