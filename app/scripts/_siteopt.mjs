/* No image tooling on the box, but there is a browser. Decode each PNG in a
   canvas, scale it to the width the site actually shows it at, and re-encode
   as WebP. */
import { chromium } from 'playwright'
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'fs'

const dir = new URL('../../site/img/', import.meta.url)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage()

const targetWidth = (name) => (name.startsWith('p-') ? 780 : 2040)

const files = readdirSync(dir).filter((f) => f.endsWith('.png'))
const rows = []
for (const f of files) {
  const name = f.replace(/\.png$/, '')
  const src = new URL(f, dir)
  const before = statSync(src).size
  const b64 = readFileSync(src).toString('base64')
  const out = await page.evaluate(async ({ b64, w, q }) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + b64
    await img.decode()
    const scale = Math.min(1, w / img.width)
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale)
    c.height = Math.round(img.height * scale)
    const ctx = c.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return { data: c.toDataURL('image/webp', q).split(',')[1], w: c.width, h: c.height }
  }, { b64, w: targetWidth(name), q: 0.9 })
  const dst = new URL(name + '.webp', dir)
  writeFileSync(dst, Buffer.from(out.data, 'base64'))
  const after = statSync(dst).size
  unlinkSync(src)
  rows.push(`${(name + '.webp').padEnd(18)} ${String(out.w).padStart(5)}x${String(out.h).padEnd(5)}  ${(before / 1024).toFixed(0).padStart(5)}KB -> ${(after / 1024).toFixed(0).padStart(4)}KB`)
}
console.log(rows.sort().join('\n'))
await browser.close()
