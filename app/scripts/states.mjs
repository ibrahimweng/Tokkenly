/* Every state the product claims to have, exercised in a real browser.
   Figma 02 Components: Button, Icon button, Text field, Empty state, Toast. */
import { chromium } from 'playwright'
import { seen, fresh } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errors = []
const page = await b.newPage({ viewport: { width: 1440, height: 1024 } })
// This suite is about what a button looks like, not about arriving, so it
// arrives as somebody who has been here before: intro seen, tab unlocked.
await seen(page)
page.on('pageerror', (e) => errors.push(String(e)))

const bg = (h) => page.evaluate((el) => getComputedStyle(el).backgroundColor, h)
const go = async (r, w = 1440) => {
  await page.setViewportSize({ width: w, height: 900 })
  await page.goto(B + r, { waitUntil: 'networkidle' })
  await page.waitForTimeout(150)
}
const ok = (label, pass, detail = '') =>
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)

console.log('HOVER')
// Home carries no filled button since Send and Receive moved to the wallet
// (11g.44). What is being checked is the treatment, so it is checked wherever
// the treatment lives.
await go('/verify')
const filled = page.locator('.btn-primary').first()
const rest = await bg(await filled.elementHandle())
await filled.hover(); await page.waitForTimeout(80)
const hov = await bg(await filled.elementHandle())
ok('filled button changes on hover', rest !== hov, `${rest} → ${hov}`)
ok('hover is the token, not a hex', hov === 'rgb(236, 236, 237)', hov)

console.log('FOCUS')
await page.keyboard.press('Tab')
const outline = await page.evaluate(() => {
  const el = document.activeElement
  const s = getComputedStyle(el)
  return { tag: el.tagName.toLowerCase(), width: s.outlineWidth, color: s.outlineColor }
})
ok('keyboard focus draws a ring', outline.width === '2px', JSON.stringify(outline))

console.log('PRESSED')
const box = await filled.boundingBox()
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await page.mouse.down(); await page.waitForTimeout(60)
// The 110ms transition means an immediate sample lands mid-fade. Wait past
// it with room to spare — 160 was close enough to the edge to fail about one
// run in three, which is a worse test than no test.
await page.waitForTimeout(320)
const pressedOpacity = await page.evaluate(
  (el) => getComputedStyle(el).opacity, await filled.elementHandle())
await page.mouse.up()
ok('pressing sinks the button', Math.abs(Number(pressedOpacity) - 0.88) < 0.02, pressedOpacity)

console.log('DISABLED')
await go('/grow/borrow')
await page.locator('.amount-box input').fill('0')
await page.locator('.amount-box input').dispatchEvent('input')
// past the end of the fade, so the opacity read is the settled one
await page.waitForTimeout(320)
const dis = await page.evaluate(() => {
  const el = document.querySelector('.card .btn-primary')
  const s = getComputedStyle(el)
  return { disabled: el.hasAttribute('disabled'), opacity: s.opacity, pe: s.pointerEvents,
           label: el.textContent.trim() }
})
// No veil. It was opacity 0.4 over the primary's own fill, which put the label
// at 3.25:1 in dark and 2.52:1 in light — the least readable text in the
// product, on the control somebody is staring at while working out why they
// cannot continue (11g.59). A state is a pair of colours, not a dimmer, so
// what is checked here is that it is off and that nothing is veiled;
// contrast.mjs measures whether it can be read.
ok('a zero amount disables the action',
   dis.disabled && dis.pe === 'none', JSON.stringify(dis))
ok('and does it without a veil over the label',
   Number(dis.opacity) === 1, `"${dis.label}" at opacity ${dis.opacity}`)

console.log('LOADING')
await go('/grow/borrow?sheet=borrow-review&v=500')
await page.locator('.sheet .btn-primary').click()
await page.waitForTimeout(80)
const busy = await page.locator('.sheet .btn-primary.is-busy').count()
ok('confirming shows a spinner', busy === 1, `is-busy nodes: ${busy}`)
await page.waitForTimeout(700)
const outcomeTitle = await page.locator('.sheet .figure .t-title').first().textContent()
ok('and then the outcome arrives', /Borrowed/.test(outcomeTitle ?? ''), outcomeTitle ?? '')

console.log('EMPTY')
for (const [route, expect] of [
  ['/activity?q=zzzzz', 'Nothing matches that'],
  ['/invest?q=zzzzz', 'Nothing matches that'],
  ['/support?q=zzzzz', 'Nothing matches that'],
]) {
  await go(route)
  const t = await page.locator('.empty h2').first().textContent().catch(() => null)
  ok(route, t === expect, t ?? 'no empty state')
}
await go('/activity?q=zzzzz')
await page.locator('.empty .btn').click(); await page.waitForTimeout(150)
ok('the empty state clears the search', page.url().endsWith('#/activity'), page.url().split('#')[1])

console.log('EMPTY, on a phone')
// The people live in the Tokkenly way now (11g.60); /send is the three ways.
await go('/send/tokkenly?q=zzzzz', 390)
const t2 = await page.locator('.empty h2').first().textContent().catch(() => null)
ok('the picker search finds nobody', t2 === 'Nobody by that name', t2 ?? 'no empty state')
await go('/send/tokkenly?q=tunde', 390)
// Scoped to the people card, which is the whole of this way's panel.
const n = await page.locator('.card', { hasText: 'Who is it going to' }).locator('.sheet-row').count()
ok('the picker search filters', n === 1, `${n} row(s)`)

console.log('ERROR')
await go('/send/base', 390)
// The placeholder is the example address for whichever network is set, since
// 11g.74 — there is no one "Base address" field any more. The field itself is
// the only one on this panel.
const addrField = page.locator('.set-panel .field input, .card .field input').first()
await addrField.fill('0x12')
await page.waitForTimeout(200)
const err = await page.evaluate(() => {
  const f = document.querySelector('.field.error')
  // The visible one. There is more than one field on this screen now — the
  // account-number check has its own — and every other is hidden, so picking
  // the first in the document was picking a message nobody can see.
  const m = document.querySelector('.field-error:not([hidden])')
  return { ringed: !!f, message: m ? m.textContent.trim() : null }
})
ok('a bad address is marked where it was typed', err.ringed && !!err.message, JSON.stringify(err))
await addrField.fill('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984')
await page.waitForTimeout(200)
const cleared = await page.locator('.field.error').count()
ok('and the error clears as you fix it', cleared === 0, `${cleared} ringed`)

console.log('BUTTON VARIANTS')
await go('/')
const swatch = await page.evaluate(() => {
  const probe = (cls) => {
    const el = document.createElement('button')
    el.className = 'btn ' + cls
    document.body.appendChild(el)
    const s = getComputedStyle(el)
    const out = { bg: s.backgroundColor, fg: s.color }
    el.remove()
    return out
  }
  return {
    primary: probe('btn-primary'), secondary: probe('btn-secondary'),
    quiet: probe('btn-quiet'), destructive: probe('btn-destructive'),
    inverse: probe('btn-inverse'),
  }
})
// Figma 02 Components, Button Variant=*, resolved in dark
const WANT = {
  primary:     { bg: 'rgb(220, 220, 224)', fg: 'rgb(10, 10, 12)' },
  secondary:   { bg: 'rgb(45, 45, 50)',    fg: 'rgb(220, 220, 224)' },
  quiet:       { bg: 'rgba(0, 0, 0, 0)',   fg: 'rgb(220, 220, 224)' },
  destructive: { bg: 'rgb(45, 45, 50)',    fg: 'rgb(255, 138, 92)' },
  inverse:     { bg: 'rgb(110, 79, 53)',   fg: 'rgb(220, 220, 224)' },
}
for (const [k, want] of Object.entries(WANT)) {
  const got = swatch[k]
  ok(`btn-${k} matches Figma`, got.bg === want.bg && got.fg === want.fg,
     `${got.bg} / ${got.fg}`)
}
const stale = await page.evaluate(() =>
  [...document.querySelectorAll('[class*="btn-filled"],[class*="btn-danger"]')].length)
ok('no button still uses an old class name', stale === 0, `${stale} found`)

console.log('DISABLED KEEPS ITS COLOUR')
await go('/')
const dim = await page.evaluate(() => {
  const probe = (cls) => {
    const el = document.createElement('button')
    el.className = 'btn ' + cls
    el.setAttribute('disabled', '')
    document.body.appendChild(el)
    const s = getComputedStyle(el)
    const out = { bg: s.backgroundColor, ink: s.color, opacity: s.opacity }
    el.remove()
    return out
  }
  return { primary: probe('btn-primary'), secondary: probe('btn-secondary'),
           destructive: probe('btn-destructive') }
})
/* Figma dims the variant's own fill. That is a drawing instruction and it was
   followed literally: opacity 0.4 over whatever the variant was painted, which
   is fine on a grey secondary and is what made a filled primary unreadable.
   Every variant lands on the same off state now — one rung below --control, so
   it reads as recessed rather than as a secondary you could press — and it is
   the same state whichever button it used to be, because "you cannot press
   this" is one fact and not three. */
const off = await page.evaluate(() => {
  const c = getComputedStyle(document.documentElement)
  return { bg: c.getPropertyValue('--off').trim(), ink: c.getPropertyValue('--off-ink').trim() }
})
const asRgb = async (hex) => page.evaluate((h) => {
  const d = document.createElement('div'); d.style.color = h
  document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v
}, hex)
const offBg = await asRgb(off.bg)
for (const [name, got] of Object.entries(dim)) {
  ok(`disabled ${name} takes the off state`, got.bg === offBg && got.opacity === '1',
     JSON.stringify(got) + ' against ' + offBg)
}
const sunken = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--sunken').trim())
ok('and none of them is repainted to --sunken',
   dim.primary.bg !== sunken && dim.secondary.bg !== sunken, sunken)

console.log('THE FIRST SCREEN, AND ITS THREE STATES')
{
  // A fresh page, because the point of these is somebody who has not been here
  // and cannot be seeded past the screen they are looking at.
  const a = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await fresh(a)
  a.on('pageerror', (e) => errors.push(String(e)))
  await a.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const err = () => a.evaluate(() => {
    const e = document.querySelector('.field-error')
    return e && !e.hidden ? e.innerText.replace(/\n/g, ' ').trim() : null
  })
  const land = async (r) => { await a.goto(B + r, { waitUntil: 'domcontentloaded' }); await a.waitForTimeout(400) }

  await land('/signin')
  ok('it says why anybody should hand this product money',
     (await a.evaluate(() => document.querySelectorAll('.promise').length)) === 3
     && /down as well as up/.test(await a.evaluate(() => document.querySelector('.auth-warn')?.textContent ?? '')))
  ok('and the email field does not arrive holding somebody else\u2019s address',
     !/@/.test(await a.evaluate(() => document.querySelector('input[type=email]')?.placeholder ?? '')),
     await a.evaluate(() => document.querySelector('input[type=email]')?.placeholder ?? ''))
  // The one button that is not email was wearing an envelope.
  ok('and Google is not offered under a picture of an envelope',
     await a.evaluate(() => {
       const btn = [...document.querySelectorAll('button')].find((x) => /Continue with Google/.test(x.textContent))
       return !!btn && !btn.querySelector('svg')
     }))

  await a.locator('.btn-primary').click(); await a.waitForTimeout(250)
  ok('an empty field is named where it is empty', (await err()) !== null, await err())
  await a.locator('input[type=email]').fill('a@b.co')
  await a.locator('input[type=password]').fill('wrong')
  await a.locator('.btn-primary').click(); await a.waitForTimeout(150)
  ok('the button says it is working', /is-busy/.test(await a.evaluate(() => document.querySelector('.btn-primary')?.className ?? '')))
  await a.waitForTimeout(900)
  ok('and a refusal leaves you on the screen with the reason',
     /do not recognise/.test((await err()) ?? '') && (await a.evaluate(() => location.hash)).includes('signin'),
     await err())

  // A password you cannot see is how somebody resets one they had right.
  await a.locator('.reveal').click(); await a.waitForTimeout(200)
  ok('the password can be looked at',
     await a.evaluate(() => [...document.querySelectorAll('.field input')].some((i) => i.type === 'text')))

  await a.evaluate(() => window.dispatchEvent(new Event('offline'))); await a.waitForTimeout(200)
  await a.locator('.btn-primary').click(); await a.waitForTimeout(300)
  ok('and nothing is sent with no connection', /No connection/.test((await err()) ?? ''), await err())
  await a.close()
}

console.log('\nERRORS: ' + (errors.length ? errors.join(' | ') : 'none'))
await b.close()
