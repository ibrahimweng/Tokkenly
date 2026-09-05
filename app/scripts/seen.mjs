/* Every suite but ftue.mjs is about a person who has been here before, so the
   intro is in the way. Seeding the flag the app actually reads is truer than
   clicking Skip in every script, and it costs one line per page.
   `prefs` seeds preferences too, for the suites that need a particular one —
   the chart lives on Detailed, and Home now opens on Simple. */
export const seen = (p, prefs = {}) =>
  p.addInitScript(`try { localStorage.setItem('tokkenly.prefs.v1',
    ${JSON.stringify(JSON.stringify({ seenIntro: true, prefs }))}) } catch {}`)
