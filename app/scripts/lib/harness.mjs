/* What every suite shares: where the app is, which browser drives it, how a
   check is reported, and how a run ends.

   Each suite used to carry its own copy of all four, with the address, the
   browser path and the output folder written in as literals from one machine,
   and a check that printed FAIL and exited 0. A sweep of thirty-eight suites
   could only be read by eye. Here a failed check sets the exit code, so
   `npm test` and CI see what the log says.

   Environment, all optional:
     BASE_URL  the app to drive          default http://localhost:4173
     CHROMIUM  a Chromium to launch      default Playwright's own, else
                                                 /opt/pw-browsers/chromium
     SHOTS     where screenshots go      default app/shots (git-ignored)
     DEV_URL   a Vite dev server, for the tools under scripts/figma/ that
               import source modules the build does not export
                                         default http://localhost:5173 */
import { chromium } from 'playwright'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

export const BASE_URL = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/+$/, '')
export const DEV_URL = (process.env.DEV_URL || 'http://localhost:5173').replace(/\/+$/, '')
/** The app's hash root: every suite navigates with `B + '/route'`. */
export const B = BASE_URL + '/#'

/** The browser to launch, in order of who asked for it. An explicit CHROMIUM
 *  wins; then the one `npx playwright install chromium` puts where this
 *  Playwright looks; then the one this sandbox carries. Undefined lets
 *  Playwright say in its own words that there is none. */
export function chromiumPath() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM
  for (const p of [safe(() => chromium.executablePath()), '/opt/pw-browsers/chromium']) {
    if (p && existsSync(p)) return p
  }
  return undefined
}
function safe(fn) {
  try { return fn() } catch { return undefined }
}

export const launch = (options = {}) =>
  chromium.launch({ executablePath: chromiumPath(), ...options })

/* The count, so the last line of a suite says how it went. */
let passed = 0
let failed = 0

/** One check. The line starts with PASS or FAIL so a log can be grepped, and a
 *  FAIL sets the exit code without stopping the suite: the next checks are
 *  still worth knowing. */
export function check(name, cond, detail = '') {
  if (cond) passed++
  else {
    failed++
    process.exitCode = 1
  }
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`)
  return !!cond
}

/** Page errors are failures of the product, whatever the suite is about. */
export function collectErrors(page, errs = [], label = '') {
  page.on('pageerror', (e) => errs.push(`${label}pageerror: ${e.message}`))
  return errs
}

/** Close the browser and say how it went. A suite with no checks at all is
 *  reported as such rather than as green. */
export async function teardown(browser) {
  await browser?.close()
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed) process.exitCode = 1
}

/** A path for a screenshot. Under app/shots unless SHOTS says otherwise, and
 *  the folder is made on first use, so no suite writes into /tmp on one
 *  machine and a folder that does not exist on the next. */
const SHOTS = process.env.SHOTS || join(fileURLToPath(new URL('../../', import.meta.url)), 'shots')
export function shot(file) {
  mkdirSync(SHOTS, { recursive: true })
  return join(SHOTS, file)
}
