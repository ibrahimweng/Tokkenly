/* What every _site* check shares.
   ---------------------------------------------------------------------------
   The marketing site in site/ is served on its own, and these scripts drive a
   browser against it. They used to hard-code http://localhost:4321 and
   ".html" addresses, and several printed "ok" beside a 404 because nothing
   looked at the response. So:

     SITE_URL      where the site is served (default http://localhost:4321).
                   Serve it the way Vercel does — cleanUrls, so /about is a
                   page and /about.html is a redirect to it; `npx serve site`
                   does that out of the box.
     CHROMIUM      the browser binary (default /opt/pw-browsers/chromium).

   open() fails on any response that is not 2xx, and ok() sets
   process.exitCode, so a FAIL anywhere makes the script exit non-zero even
   when it goes on to run its remaining checks. */
import { chromium } from 'playwright'
import { PRODUCTS } from '../../site/copy-products.mjs'

export const BASE = (process.env.SITE_URL || 'http://localhost:4321').replace(/\/$/, '')
export const launch = () => chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' })

/* The product slugs come from the copy the pages are built from, so a
   product added, merged or renamed there is checked here without an edit. */
export const SLUGS = PRODUCTS.map((p) => p.slug)
export const COMPANY = ['/about', '/blog', '/contact', '/terms', '/privacy']
export const PAGES = ['/', ...SLUGS.map((s) => '/products/' + s), ...COMPANY]

export async function open(page, path, opts = { waitUntil: 'load' }) {
  const r = await page.goto(BASE + path, opts)
  if (!r || !r.ok()) throw new Error(`${path} answered ${r ? r.status() : 'nothing'}`)
  return r
}

let failed = 0
export function ok(cond, what) {
  console.log(`${cond ? '  ok  ' : '  FAIL'}  ${what}`)
  if (!cond) { failed++; process.exitCode = 1 }
  return !!cond
}
export const failures = () => failed
export function summary() {
  console.log(`\n${failed ? 'FAIL=' + failed : 'FAIL=0'}`)
}
