/* Every drawing in the set, at once, in both themes.

   The drawings are only ever seen one to a card, which is exactly the way not
   to notice that two of them are the same picture with the parts moved — which
   is what Lend and Borrow were until they were put side by side here. So: a
   contact sheet.

   It reads `drawings.ts` directly off a Vite dev server rather than the build,
   because the module exports the objects by name and the build does not. Start
   one first:

       npx vite --port 4180

   With no server this says so and stops. It used to render two blank images and
   report nothing, which is the shape of a check that can only pass. */
import { chromium } from 'playwright'

const URL = 'http://localhost:4180/scripts/_art.html'
const WANT = 11
let fail = 0
const ok = (l, pass, d = '') => {
  if (!pass) fail += 1
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
}

const up = await fetch(URL).then((r) => r.ok).catch(() => false)
if (!up) {
  console.log('SKIPPED  no dev server on 4180. Start one with: npx vite --port 4180')
  process.exit(0)
}

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const theme of ['dark', 'light']) {
  const c = await b.newContext({ viewport: { width: 940, height: 1200 }, deviceScaleFactor: 2 })
  const p = await c.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(URL, { waitUntil: 'networkidle' })
  if (theme === 'light') await p.evaluate(() => { document.documentElement.dataset.theme = 'light' })
  await p.waitForTimeout(400)
  const n = await p.locator('.artcell svg').count()
  // A drawing with no paths in it is a drawing that threw while being built,
  // and an svg element on its own is not evidence of one.
  const empties = await p.evaluate(() =>
    [...document.querySelectorAll('.artcell')]
      .filter((c2) => c2.querySelectorAll('svg path, svg ellipse').length < 3)
      .map((c2) => c2.querySelector('b')?.textContent ?? '?'))
  ok(`${theme}: every drawing in the set renders`, n === WANT, `${n} of ${WANT}`)
  ok(`${theme}: and none of them is an empty frame`, empties.length === 0, empties.join(' '))
  ok(`${theme}: and nothing threw`, errs.length === 0, errs.join(' | '))
  await p.locator('.artsheet').screenshot({ path: `/tmp/ba7/sheet-${theme}.png` })
  await c.close()
}
console.log(fail ? `\n${fail} FAILED` : '\nok, /tmp/ba7/sheet-*.png written')
await b.close()
