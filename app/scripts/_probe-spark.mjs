/* The sparkline the product actually draws, turned into the SVG Figma will
   import. Two substitutions, both forced by the importer rather than chosen:
   `var(--positive)` becomes the hex it resolves to (the builder binds the
   paint back to the variable afterwards), and the 0-100 viewBox is pre-scaled
   to the 117x56 the table draws it at, because `preserveAspectRatio="none"`
   stretches the box but not the 2px stroke, and Figma has no equivalent. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const W = 117, H = 56
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await seen(p)
await p.goto('http://localhost:4173/#/invest/list/popular', { waitUntil: 'networkidle' })
await p.waitForTimeout(400)
const raw = await p.evaluate(() => document.querySelector('.spark.up svg').outerHTML)
await b.close()

const r2 = (n) => Math.round(n * 100) / 100
const scale = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
  (_, x, y) => r2(Number(x) / 100 * W) + ',' + r2(Number(y) / 100 * H))

const ds = [...raw.matchAll(/ d="([^"]+)"/g)].map((m) => scale(m[1]))
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
  `<path d="${ds[0]}" fill="#3fd99b" fill-opacity="0.12" stroke="none"/>` +
  `<path d="${ds[1]}" fill="none" stroke="#3fd99b" stroke-width="2" ` +
  `stroke-linecap="round" stroke-linejoin="round"/></svg>`
console.log(svg.length)
console.log(svg)
