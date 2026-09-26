/* Every drawing in the set, at once, in both themes.

   The drawings are only ever seen one to a card, which is exactly the way not
   to notice that two of them are the same picture with the parts moved — which
   is what Lend and Borrow were until they were put side by side here. So: a
   contact sheet.

   It reads `drawings.ts` directly off a Vite dev server rather than the build,
   because the module exports the objects by name and the build does not. Start
   one first (DEV_URL, default http://localhost:5173):

       npm run dev

   With no server this says so and stops. It used to render two blank images and
   report nothing, which is the shape of a check that can only pass. */
import { launch, check, teardown, shot, DEV_URL } from '../lib/harness.mjs'

const URL = DEV_URL + '/scripts/figma/art.html'
const WANT = 11
const ok = check

const up = await fetch(URL).then((r) => r.ok).catch(() => false)
if (!up) {
  console.log(`SKIPPED  no dev server at ${DEV_URL}. Start one with: npm run dev`)
  process.exit(0)
}

const b = await launch()
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
  await p.locator('.artsheet').screenshot({ path: shot(`sheet-${theme}.png`) })
  await c.close()
}
console.log(`written: ${shot('sheet-*.png')}`)
await teardown(b)
