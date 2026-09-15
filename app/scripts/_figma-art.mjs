/* The eleven drawings, as SVG, for building them as components in Figma.
 *
 * They are DOM nodes built by `drawings.ts`, so the only honest way to get the
 * markup is to build them in a browser and read it back. Same source as the
 * product draws, which is the point: a component in the file that was drawn by
 * hand is a copy, and a copy drifts.
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage()
await p.goto('http://localhost:4180/scripts/_art.html', { waitUntil: 'networkidle' })
const art = await p.evaluate(() =>
  [...document.querySelectorAll('.artcell')].map((c) => ({
    name: c.querySelector('b').textContent,
    svg: c.querySelector('svg').outerHTML,
    box: c.querySelector('svg').getAttribute('viewBox'),
  })))
await b.close()
writeFileSync(new URL('../figma/art.json', import.meta.url), JSON.stringify(art, null, 1))
console.log(art.map((a) => `${a.name.padEnd(13)} ${a.box.padEnd(22)} ${a.svg.length} chars`).join('\n'))
