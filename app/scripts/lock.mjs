/* The lock. Two questions matter more than whether the pad works: does it
   actually stand in front of every screen, and does it leak what it exists to
   hide. A lock screen with the balance on it is a lock screen for nobody. */
import { chromium } from 'playwright'
import { seen, locked } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)

const page = async (opts = {}, w = 1440, h = 1000) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  if (opts.unlocked) await seen(p, opts.prefs ?? {}, opts.security ?? {})
  else await locked(p, opts.security ?? {})
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(6000)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return p
}
const at = async (p, r) => {
  await p.goto(B + r, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(400)
}
const tap = (p, d) => p.locator('.pin-keypad .key', { hasText: new RegExp('^' + d + '$') }).first().click()
const note = (p) => p.evaluate(() => document.querySelector('.pin-note')?.textContent ?? '')
const body = (p) => p.evaluate(() => document.body.innerText)

console.log('IT STANDS IN FRONT OF EVERYTHING')
{
  const p = await page()
  for (const r of ['/', '/invest/aapl', '/transfer', '/account/security', '/bucket', '/activity']) {
    await at(p, r)
    ok(`${r} is locked`, (await p.locator('.lock-card').count()) === 1)
  }
  await p.close()
}

console.log('AND LEAKS NOTHING  a lock screen with the balance on it is for nobody')
{
  const p = await page()
  await at(p, '/')
  const t = await body(p)
  ok('no figure of any kind', !/\$[\d,]/.test(t) && !/₦/.test(t), (t.match(/\$[\d,]+/) ?? ['none'])[0])
  ok('no notifications', (await p.locator('.bell').count()) === 0)
  ok('no navigation out of it',
     (await p.locator('.sidebar').count()) === 0 && (await p.locator('.rail').count()) === 0)
  ok('but it does say whose phone this is', /Chinaza/.test(t))
  await p.close()
}

console.log('UNLOCKING LANDS WHERE YOU WERE GOING')
{
  const p = await page()
  await at(p, '/invest/aapl')
  ok('a deep link locks first', (await p.locator('.lock-card').count()) === 1)
  for (const d of ['4', '1', '9', '3']) await tap(p, d)
  await p.waitForTimeout(500)
  ok('and opens on the link, not on Home',
     /Apple/.test(await body(p)) && (await p.locator('.lock-card').count()) === 0,
     new URL(p.url()).hash)
  await at(p, '/transfer')
  ok('and stays unlocked after that', (await p.locator('.lock-card').count()) === 0)
  await p.close()
}

console.log('THE WRONG PIN')
{
  const p = await page()
  await at(p, '/')
  for (const d of ['1', '1', '1', '2']) await tap(p, d)
  await p.waitForTimeout(400)
  ok('counts down rather than just refusing', /4 tries left/.test(await note(p)), await note(p))
  for (let i = 0; i < 4; i++) {
    for (const d of ['1', '1', '1', '2']) await tap(p, d)
    await p.waitForTimeout(350)
  }
  ok('five tries locks it out', (await body(p)).includes('Five wrong tries'))
  ok('and the pad is gone', (await p.locator('.pinpad').count()) === 0)
  // An earlier draft offered "use my recovery phrase" here and cleared the
  // count to open it, which hands five more guesses to whoever presses it.
  ok('the way out is the password, not five more guesses',
     /Sign in with my password/.test(await body(p)) &&
     !(await p.locator('.btn', { hasText: 'Use my recovery phrase' }).count()))
  // Seeded once through the page rather than through addInitScript, which
  // would re-seed on the reload and wipe the very count under test.
  await p.close()

  const q = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await q.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await q.goto(B + '/', { waitUntil: 'domcontentloaded' })
  await q.evaluate(() => {
    localStorage.setItem('tokkenly.prefs.v1',
      JSON.stringify({ seenIntro: true, prefs: {}, security: {} }))
    sessionStorage.removeItem('tokkenly.unlocked')
  })
  await q.reload({ waitUntil: 'domcontentloaded' }); await q.waitForTimeout(400)
  for (let i = 0; i < 5; i++) {
    for (const d of ['1', '1', '1', '2']) await tap(q, d)
    await q.waitForTimeout(300)
  }
  ok('the count is kept, not just held in memory',
     (await q.evaluate(() => JSON.parse(localStorage.getItem('tokkenly.prefs.v1')).security?.wrongPin)) === 5)
  await q.reload({ waitUntil: 'domcontentloaded' }); await q.waitForTimeout(500)
  ok('so a reload does not clear it', (await body(q)).includes('Five wrong tries'))
  await q.close()
}

console.log('THE PASSWORD IS THE WAY BACK')
{
  const p = await page()
  await at(p, '/')
  for (let i = 0; i < 5; i++) {
    for (const d of ['1', '1', '1', '2']) await tap(p, d)
    await p.waitForTimeout(300)
  }
  await p.locator('.btn', { hasText: 'Sign in with my password' }).click()
  await p.waitForTimeout(400)
  ok('it goes to sign in', /Sign in/.test(await body(p)) && (await p.locator('.auth-card').count()) === 1)
  await p.locator('.auth-card .btn-primary').click()
  await p.waitForTimeout(500)
  // Getting in with the password is getting in; asking for the PIN straight
  // afterwards is asking the same question twice.
  ok('and signing in does not then ask for the PIN',
     (await p.locator('.lock-card').count()) === 0, new URL(p.url()).hash)
  await p.close()
}

console.log('FACE ID  what people actually use, so it is on the screen')
{
  const p = await page()
  await at(p, '/')
  ok('offered when it is on', (await p.locator('.lock-face').count()) === 1)
  await p.locator('.lock-face').click()
  await p.waitForTimeout(800)
  ok('and it gets you in', (await p.locator('.lock-card').count()) === 0)
  const off = await page({ security: { faceId: false } })
  await at(off, '/')
  ok('not offered when it is off', (await off.locator('.lock-face').count()) === 0)
  await p.close(); await off.close()
}

console.log('THE SWITCH DECIDES  it was honoured as a setting and enforced by nothing')
{
  const p = await page({ security: { appLock: false } })
  await at(p, '/')
  ok('off means no lock at all', (await p.locator('.lock-card').count()) === 0)
  await p.close()
}

console.log('LOCK NOW  a lock you can only reach by waiting is a lock nobody tests')
{
  const p = await page({ unlocked: true })
  await at(p, '/account/security')
  ok('Security offers it', (await p.getByRole('button', { name: 'Lock now' }).count()) === 1)
  await p.getByRole('button', { name: 'Lock now' }).click()
  await p.waitForTimeout(450)
  ok('and it locks', (await p.locator('.lock-card').count()) === 1)
  for (const d of ['4', '1', '9', '3']) await tap(p, d)
  await p.waitForTimeout(500)
  ok('back in where you were', /Security/.test(await body(p)))
  const off = await page({ unlocked: true, security: { appLock: false } })
  await at(off, '/account/security')
  ok('and it is not offered when the lock is off',
     (await off.getByRole('button', { name: 'Lock now' }).count()) === 0)
  await p.close(); await off.close()
}

console.log('TYPING  a pad you have to focus first is a pad that looks like a form')
{
  const p = await page()
  await at(p, '/')
  ok('nothing is focused, so nothing is ringed',
     (await p.evaluate(() => document.activeElement?.tagName)) === 'BODY',
     await p.evaluate(() => document.activeElement?.tagName ?? '?'))
  await p.keyboard.type('419')
  await p.waitForTimeout(200)
  ok('but the keyboard still fills the dots',
     (await p.locator('.pin-dot.on').count()) === 3)
  await p.keyboard.press('Backspace')
  await p.waitForTimeout(150)
  ok('and backspace takes one off', (await p.locator('.pin-dot.on').count()) === 2)
  await p.keyboard.type('93')
  await p.waitForTimeout(500)
  ok('and the fourth digit gets you in', (await p.locator('.lock-card').count()) === 0)
  await p.close()
}

console.log('AND IT DOES NOT STEAL KEYS FROM A FIELD')
{
  const p = await page({ unlocked: true })
  await at(p, '/account/security?sheet=password')
  const f = p.locator('.sheet .field input').nth(1)
  await f.click()
  await f.type('harmattan 2026')
  await p.waitForTimeout(200)
  ok('digits typed into an input land in the input',
     (await f.inputValue()) === 'harmattan 2026', await f.inputValue())
  await p.close()
}

console.log('BOTH SIZES, BOTH THEMES')
{
  for (const theme of ['dark', 'light']) {
    for (const [w, hh] of [[1440, 900], [390, 844]]) {
      const p = await b.newPage({ viewport: { width: w, height: hh } })
      await locked(p, {})
      await p.addInitScript(`try {
        const k = 'tokkenly.prefs.v1'
        const v = JSON.parse(localStorage.getItem(k) || '{}')
        v.prefs = { ...(v.prefs || {}), theme: '${theme}' }
        localStorage.setItem(k, JSON.stringify(v))
      } catch {}`)
      await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
      await at(p, '/')
      const fits = await p.evaluate(() => ({
        x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        pad: !!document.querySelector('.pin-keypad'),
        below: [...document.querySelectorAll('.lock-card .key')]
          .some((e) => e.getBoundingClientRect().bottom > innerHeight + 1),
      }))
      ok(`${w}px ${theme}: fits, and every key is reachable`,
         fits.x === 0 && fits.pad && !fits.below, JSON.stringify(fits))
      await p.close()
    }
  }
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
