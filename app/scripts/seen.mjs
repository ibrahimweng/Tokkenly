/* Every suite but ftue.mjs is about a person who has been here before, so the
   intro is in the way. Seeding the flag the app actually reads is truer than
   clicking Skip in every script, and it costs one line per page.
   `prefs` seeds preferences too, for the suites that need a particular one —
   the chart lives on Detailed, and Home now opens on Simple. */
export const seen = (p, prefs = {}) =>
  p.addInitScript(`try { localStorage.setItem('tokkenly.prefs.v1',
    ${JSON.stringify(JSON.stringify({ seenIntro: true, prefs }))}) } catch {}`)

/** Walk the identity check. Suites about something else — fees, preferences —
 *  need the limits out of the way so the ceiling they are testing is the one
 *  that bites. It is four clicks, and doing it for real beats reaching into
 *  state the app would never let a person reach into. */
export async function verify(p, B = 'http://localhost:4173/#') {
  await p.goto(B + '/verify', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(300)
  await p.getByRole('button', { name: 'Start' }).click()
  await p.waitForTimeout(250)
  const i = p.locator('.field input')
  await i.fill('12345678901')
  await i.dispatchEvent('input')
  await p.waitForTimeout(200)
  await p.getByRole('button', { name: 'Check this number' }).click()
  await p.waitForTimeout(250)
  await p.getByRole('button', { name: 'Yes, check it' }).click()
  await p.waitForTimeout(350)
}
