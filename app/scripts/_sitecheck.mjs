import { chromium } from 'playwright'
const out = process.argv[2] ?? '/tmp'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

async function run(label, width, height) {
  const p = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errs = []
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()) })
  p.on('requestfailed', (r) => errs.push('failed: ' + r.url()))
  await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' })

  // Walk the page so lazy images actually start loading.
  await p.evaluate(async () => {
    const step = innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
  })
  // Then give them time to land. A lazy image that has only been asked for is
  // not a lazy image that has arrived, and the first version of this script
  // photographed the gap.
  /* Only the images that are actually drawn. The coin in the Why section is
     display:none below 1880 and its lazy source is never fetched, which is
     correct and which this used to sit and wait twenty seconds for. */
  await p.waitForFunction(() => [...document.images]
    .filter((i) => i.getClientRects().length)
    .every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20000 })
  await p.evaluate(() => {
    scrollTo(0, 0)
    document.querySelectorAll('.reveal').forEach((e) => {
      e.style.transitionDelay = '0ms'
      e.classList.add('in')
    })
  })
  await p.waitForTimeout(700)

  const report = await p.evaluate((w) => {
    const broken = []
    document.querySelectorAll('img').forEach((im) => {
      if (!im.getClientRects().length) return
      if (!im.complete || im.naturalWidth === 0) broken.push(im.getAttribute('src'))
    })
    /* An element wider than the viewport only matters if it can actually make
       the page scroll sideways. getBoundingClientRect reports the geometry of
       a rotated or oversized box whether or not an ancestor clips it, so the
       tilted ticker — which is clipped by a wrapper and cannot scroll anything
       — was being reported alongside real faults. Anything inside a clipping
       ancestor is skipped; documentElement.scrollWidth above is the real test
       and stays as it is. */
    const clipped = (el) => {
      for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
        const ox = getComputedStyle(n).overflowX
        if (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') return true
      }
      return false
    }
    const bad = []
    document.querySelectorAll('body *').forEach((el) => {
      if (el.classList.contains('skip')) return
      const r = el.getBoundingClientRect()
      if (r.width === 0) return
      if (r.right > w + 1 || r.left < -1) {
        if (clipped(el)) return
        bad.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} L${Math.round(r.left)} R${Math.round(r.right)}`)
      }
    })
    return { scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 8), broken, imgs: document.images.length }
  }, width)

  await p.screenshot({ path: `${out}/site-${label}.png`, fullPage: true })
  console.log(`--- ${label} (${width}) scrollWidth=${report.scrollW} images=${report.imgs} ---`)
  if (report.broken.length) console.log('  BROKEN IMG: ' + report.broken.join(', '))
  if (report.bad.length) console.log('  OVERFLOW: ' + report.bad.join('\n            '))
  if (errs.length) console.log('  ERRORS: ' + errs.join('\n          '))
  if (!report.broken.length && !report.bad.length && !errs.length) console.log('  clean')
  await p.close()
}

await run('desktop', 1440, 900)
await run('tablet', 834, 1000)
await run('phone', 390, 844)
await browser.close()
