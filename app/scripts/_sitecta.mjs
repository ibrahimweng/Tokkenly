/* Every closing slab on the site.
   ---------------------------------------------------------------------------
   Each page ends on the same slab with its own gradient and its own
   arrangement of 3-D objects, and every placement rule lives under
   [data-cta] with an n-* anchor under that. A prop whose markup carries
   neither keeps `position: absolute` with no offsets and draws at its file's
   natural size wherever the static flow left it — which on the eight product
   pages meant all three stacked in the middle of the slab, over the headline
   and through the lead, for two commits, on pages nobody had reopened.

   What is checked here is placement, not composition: did a rule reach this
   prop at all. `left` and `right` both computing to `auto` on an absolutely
   positioned element is that question answered, and it is the whole of the
   bug above — one DOM read, no pixels, no thresholds to argue about.

   Whether the art then lands on the words is a different question and a
   dearer one. It was measured separately, by rendering each slab three times
   — ground alone, ground plus props, ground plus copy — and intersecting the
   two ink masks: zero overlap on all twelve pages at all three widths,
   against about sixteen per cent of the prop ink on each of the eight broken
   ones. Worth repeating by hand when a variant is re-fitted; not worth three
   screenshots and a pixel walk per slab on every sweep.

   Wants the site on SITE_URL (default :4321), which an app sweep does not
   start, hence the `_site` prefix that tells all.sh to leave it alone:

     npx serve site -l 4321 &
     node app/scripts/_sitecta.mjs

   The pages are every page the site has, read from _sitelib.mjs, which reads
   the product list from the copy the product pages are built from. A page
   that does not answer 200 is a FAIL, not a quiet "no close". */
import { launch, open, ok, summary, PAGES } from './_sitelib.mjs'

const b = await launch()

for (const w of [1440, 834, 390]) {
  console.log(`\n=== ${w} ===`)
  const p = await b.newPage({ viewport: { width: w, height: 1100 }, reducedMotion: 'reduce' })
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  for (const page of PAGES) {
    /* domcontentloaded, not load: nothing here reads a pixel, and the props
       are lazy, so waiting for every image on the page is waiting for nothing
       this test is going to ask about. */
    try { await open(p, page, { waitUntil: 'domcontentloaded' }) } catch (e) { ok(false, e.message); continue }
    const r = await p.evaluate(() => {
      const sec = document.querySelector('.closing')
      if (!sec) return { none: true }
      const cs = getComputedStyle(sec.querySelector('.closing-slab'))
      const loose = []
      let shown = 0
      for (const el of sec.querySelectorAll('.cta-prop')) {
        const s = getComputedStyle(el)
        if (s.display === 'none' || s.visibility === 'hidden') continue
        shown++
        if (s.left === 'auto' && s.right === 'auto') loose.push([...el.classList].join('.'))
      }
      return {
        variant: sec.getAttribute('data-cta'),
        grad: /gradient/.test(cs.backgroundImage),
        from: cs.getPropertyValue('--cta-from').trim(),
        tl: sec.querySelectorAll('.cta-prop.n-tl').length,
        total: sec.querySelectorAll('.cta-prop').length,
        shown, loose,
      }
    })
    if (r.none) { ok(true, `${page.padEnd(34)} no close`); continue }
    const why = []
    if (!r.variant) why.push('no data-cta')
    if (!r.grad || !r.from) why.push('gradient unresolved')
    if (r.loose.length) why.push('nothing placed it: ' + r.loose.join(', '))
    if (!r.shown) why.push('no art at all')
    /* Below 1040 the anchor takes over and a variant keeps only its n-tl prop,
       so a variant without one loses its art entirely on a phone. */
    if (r.tl !== 1) why.push(`n-tl x${r.tl}, wanted exactly 1`)
    ok(why.length === 0,
      `${page.padEnd(34)} ${String(r.variant).padEnd(8)} ${r.shown}/${r.total} shown` +
      (why.length ? '  — ' + why.join('; ') : ''))
  }
  await p.close()
}
await b.close()
summary()
