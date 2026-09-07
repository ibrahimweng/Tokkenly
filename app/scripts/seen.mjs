/* Every suite but ftue.mjs is about a person who has been here before, so the
   intro is in the way. Seeding the flag the app actually reads is truer than
   clicking Skip in every script, and it costs one line per page.
   `prefs` seeds preferences too, for the suites that need a particular one —
   the chart lives on Detailed, and Home now opens on Simple. */
export const seen = (p, prefs = {}, security = {}) =>
  p.addInitScript(`try {
    localStorage.setItem('tokkenly.prefs.v1',
      ${JSON.stringify(JSON.stringify({ seenIntro: true, prefs, security }))})
    // Somebody who has been here before is somebody whose tab is already
    // unlocked. lock.mjs is the suite that does not seed this.
    sessionStorage.setItem('tokkenly.unlocked', '1')
  } catch {}`)

/** A genuinely new person: the intro unseen, but unlocked, because they have
 *  just signed up and signing up gets you in. Being new is not a reason to be
 *  asked for a PIN you set thirty seconds ago. */
export const fresh = (p) =>
  p.addInitScript(`try {
    localStorage.removeItem('tokkenly.prefs.v1')
    sessionStorage.setItem('tokkenly.unlocked', '1')
  } catch {}`)

/** The other side of it: a cold tab, where the lock is the first thing. */
export const locked = (p, security = {}) =>
  p.addInitScript(`try {
    localStorage.setItem('tokkenly.prefs.v1',
      ${JSON.stringify(JSON.stringify({ seenIntro: true, prefs: {}, security }))})
    sessionStorage.removeItem('tokkenly.unlocked')
  } catch {}`)

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

/** Read a figure once it has stopped moving.
 *
 *  Home and the wallet count the balance from the old number to the new one
 *  over half a second, so a read taken a fixed moment after a navigation is a
 *  read of the animation rather than of the balance: the same assertion passes
 *  or fails depending on how busy the machine was. Poll until the text repeats
 *  itself, then take it. */
export async function settled(p, sel = '.hero-figure', ms = 6000) {
  await p.waitForSelector(sel, { timeout: ms })
  const read = () => p.$eval(sel, (e) => e.textContent ?? '')
  const end = Date.now() + ms
  let prev = await read()
  for (;;) {
    await p.waitForTimeout(120)
    const now = await read()
    if (now === prev || Date.now() > end) return now
    prev = now
  }
}
