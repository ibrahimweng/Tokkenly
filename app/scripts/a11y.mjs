/* What the product owes somebody who is not using a mouse, or not looking at
   the screen. Contrast has its own suite; this is everything else. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
await seen(p)
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(6000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(450) }

console.log('A SHEET IS A DIALOG')
// The bell's panel used to be the dialog under test here. It is a section of
// Activity now, so the generic list-in-a-dialog is More.
await at('/?sheet=more')
{
  const d = await p.evaluate(() => {
    const el = document.querySelector('.sheet')
    const by = el?.getAttribute('aria-labelledby')
    return {
      role: el?.getAttribute('role'), modal: el?.getAttribute('aria-modal'),
      named: document.getElementById(by ?? '')?.textContent ?? el?.getAttribute('aria-label'),
      behind: !!document.querySelector('#app > .screen[inert]'),
      focused: !!document.activeElement?.classList.contains('sheet'),
    }
  })
  ok('it says what it is', d.role === 'dialog' && d.modal === 'true', `${d.role} / ${d.modal}`)
  ok('and what it is called', !!d.named, d.named ?? 'unnamed')
  ok('the screen behind it is inert', d.behind)
  ok('and focus is in it when it opens', d.focused)
}
// Tab is the way into the page behind a dialog that only blocks the pointer.
for (let i = 0; i < 6; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(40) }
ok('tab does not walk out of it',
   await p.evaluate(() => !!document.activeElement?.closest('.sheet')))
for (let i = 0; i < 14; i++) { await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(30) }
ok('and neither does shift-tab',
   await p.evaluate(() => !!document.activeElement?.closest('.sheet')))
await p.keyboard.press('Escape'); await p.waitForTimeout(500)
{
  const after = await p.evaluate(() => ({
    gone: !document.querySelector('.sheet'),
    inert: !!document.querySelector('#app > .screen[inert]'),
    // Not the top of the document: the content, past seven nav rows already
    // walked once. Where it came from no longer exists — the whole tree is
    // rebuilt on every change.
    focus: document.activeElement?.tagName + '.' + (document.activeElement?.className ?? ''),
  }))
  ok('closing releases the screen', after.gone && !after.inert)
  ok('and hands focus to the content', after.focus === 'MAIN.content', after.focus)
}

console.log('A COMPOSER THAT PRESENTS AS ONE IS ONE')
// On a wide screen every composer is a screen now, so the case under test —
// a composer drawn as a dialog — is the phone's.
const phone = await b.newPage({ viewport: { width: 390, height: 844 } })
await seen(phone)
phone.on('pageerror', (e) => errs.push(String(e)))
phone.setDefaultTimeout(6000)
await phone.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
await phone.goto(B + '/send?to=Tunde Bakare', { waitUntil: 'domcontentloaded' })
await phone.waitForTimeout(450)
{
  const d = await phone.evaluate(() => {
    const el = document.querySelector('.sheet')
    const by = el?.getAttribute('aria-labelledby')
    const screen = document.querySelector('#app > .screen')
    return {
      role: el?.getAttribute('role'),
      named: document.getElementById(by ?? '')?.textContent,
      focused: !!document.activeElement?.classList.contains('sheet'),
      // Its scrim lives inside the screen, so the screen cannot be inerted
      // wholesale — everything beside it is.
      loose: [...(screen?.children ?? [])]
        .filter((c) => !c.classList.contains('scrim') && !c.hasAttribute('inert'))
        .map((c) => c.className),
    }
  })
  ok('a modal composer is a dialog too', d.role === 'dialog', d.role ?? 'none')
  ok('named by its own heading', d.named === 'Send money', d.named ?? 'unnamed')
  ok('focus lands in it', d.focused)
  ok('and nothing beside it is left reachable', d.loose.length === 0, d.loose.join(', ') || 'all inert')
  await phone.close()
}

console.log('HEADINGS ARE A LADDER')
for (const r of ['/', '/transfer', '/invest', '/invest/aapl', '/grow', '/activity',
                 '/account', '/bucket', '/all', '/disclosures', '/verify']) {
  await at(r)
  const h = await p.evaluate(() =>
    [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((e) => ({ n: Number(e.tagName[1]), t: e.textContent.trim() })))
  const skips = h.filter((x, i) => i && x.n > h[i - 1].n + 1)
  const ones = h.filter((x) => x.n === 1)
  const empty = h.filter((x) => !x.t)
  ok(r, skips.length === 0 && ones.length === 1 && empty.length === 0,
     `${h.length} headings${skips.length ? `, skips to h${skips[0].n}` : ''}` +
     `${ones.length !== 1 ? `, ${ones.length} h1` : ''}${empty.length ? `, ${empty.length} empty` : ''}`)
}
await at('/send?to=Tunde Bakare&sheet=send-review&v=120')
await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(900)
ok('and an outcome sheet has one, with something in it',
   await p.evaluate(() => {
     const hs = [...document.querySelectorAll('.sheet h2')]
     return hs.length === 1 && !!hs[0].textContent.trim()
   }),
   await p.evaluate(() => [...document.querySelectorAll('.sheet h2')].map((e) => JSON.stringify(e.textContent)).join(' ')))

console.log('A WAY PAST THE CHROME')
await at('/transfer')
await p.keyboard.press('Tab'); await p.waitForTimeout(150)
{
  const first = await p.evaluate(() => document.activeElement?.className)
  ok('the first thing you reach is the skip link', first === 'skip', first ?? 'nothing')
  const box = await p.locator('.skip').boundingBox()
  ok('which is on screen once it has focus', !!box && box.y >= 0 && box.y < 200, JSON.stringify(box))
  await p.keyboard.press('Enter'); await p.waitForTimeout(250)
  ok('and it lands on the content',
     await p.evaluate(() => document.activeElement?.tagName === 'MAIN'),
     await p.evaluate(() => document.activeElement?.tagName ?? '?'))
}

console.log('THINGS THAT HAPPEN GET SAID')
const said = () => p.evaluate(() => document.querySelector('.sr-only[role=status]')?.textContent ?? '')
await at('/invest/aapl')
ok('arriving names the screen, in the tab and out loud',
   (await p.title()) === 'Apple · Tokkenly' && (await said()) === 'Apple',
   `${await p.title()} / ${JSON.stringify(await said())}`)
ok('and there is exactly one region doing the talking',
   (await p.evaluate(() => document.querySelectorAll('.sr-only[aria-live]').length)) === 1)
// Adding to the bucket stopped raising a toast — the bar it docks says the
// same thing and the two collided — so this exercises one that still does.
await at('/account/preferences')
await p.getByRole('button', { name: /Reset every preference/ }).click(); await p.waitForTimeout(400)
ok('a toast is announced', /default/i.test(await said()), JSON.stringify(await said()))
await p.locator('.toast').hover(); await p.waitForTimeout(3200)
// WCAG 2.2.1: content that removes itself on a timer has to be holdable.
ok('and holds while it is under the pointer', await p.evaluate(() => !!document.querySelector('.toast')))
await p.locator('.toast').click(); await p.waitForTimeout(250)
ok('and can be dismissed', await p.evaluate(() => !document.querySelector('.toast')))

// What replaced it on that path: the bar is a live region, so a bucket that
// grew is still said out loud rather than only drawn.
await at('/invest')
await p.locator('.table tbody tr').first().locator('.icon-btn').click(); await p.waitForTimeout(500)
ok('and the bucket bar speaks for itself', await p.evaluate(() => {
  const bar = document.querySelector('.bucket-bar')
  return !!bar && bar.getAttribute('role') === 'status' && /in your bucket/.test(bar.textContent ?? '')
}))

await at('/withdraw')
{
  const i = p.locator('.amount-box input')
  await i.fill('99999'); await i.dispatchEvent('input'); await p.waitForTimeout(400)
  const e = await p.evaluate(() => {
    const el = document.querySelector('.field-error')
    return { role: el?.getAttribute('role'), shown: !!el && !el.hidden }
  })
  ok('a ceiling explains itself out loud too', e.shown && e.role === 'status', JSON.stringify(e))
}

console.log('WHAT A THUMB CAN HIT')
{
  const m = await b.newPage({ viewport: { width: 390, height: 844 } })
  await seen(m)
  m.on('pageerror', (e) => errs.push(String(e)))
  await m.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const small = new Map()
  for (const r of ['/', '/transfer', '/invest', '/invest/aapl', '/grow', '/activity', '/bucket',
    '/account', '/account/preferences', '/account/payments', '/account/security', '/account/details',
    '/send', '/receive', '/addmoney', '/withdraw', '/verify', '/all', '/disclosures',
    '/invest/aapl/invest', '/grow/borrow', '/?sheet=more', '/activity?filter=alerts']) {
    await m.goto(B + r, { waitUntil: 'domcontentloaded' }); await m.waitForTimeout(400)
    for (const x of await m.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('a[href], button, input, select, [tabindex]:not([tabindex="-1"])')) {
        if (el.offsetParent === null) continue
        const r = el.getBoundingClientRect()
        if (!r.width || !r.height) continue
        // Height is the axis that fails here: these are wide and short. A
        // crumb is 37 across and cannot be widened without spacing out the
        // trail it belongs to, which is why only height is asserted.
        if (r.height >= 44) continue
        out.push({ k: (el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ').filter(Boolean).join('.')).slice(0, 46),
                   h: Math.round(r.height), t: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20) })
      }
      return out
    })) small.set(x.k, { ...x, where: r })
  }
  const list = [...small.values()]
  ok('nothing on a phone is under 44 tall', list.length === 0,
     list.map((x) => `${x.k} ${x.h}px on ${x.where}`).join('; ') || 'none')

  // And the target still has to look like what it is. The help button is 44
  // wide with the visible 24px circle drawn by a positioned pseudo-element
  // inside it, and a positioned pseudo-element paints above its parent's own
  // text: for one tier the circle covered the question mark and every check on
  // this button — which all measure its box — passed.
  //
  // Painted or not painted is a question about pixels, so this asks about
  // pixels: shoot the button, make its glyph transparent, shoot it again. If
  // the two images are the same, the glyph was not being drawn.
  for (const [w, tag] of [[390, 'a phone'], [1440, 'a desktop']]) {
    const g = await b.newPage({ viewport: { width: w, height: 900 } })
    await seen(g)
    await g.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
    await g.goto(B + '/grow', { waitUntil: 'domcontentloaded' }); await g.waitForTimeout(400)
    const el = g.locator('.hint').first()
    const shown = await el.screenshot()
    await g.addStyleTag({ content: '.hint { color: transparent !important }' })
    await g.waitForTimeout(120)
    const blank = await el.screenshot()
    ok(`  and the question mark is drawn on ${tag}`, !shown.equals(blank),
       shown.equals(blank) ? 'its own circle is painted over it' : 'visible')
    await g.close()
  }
  await m.close()
}

console.log('A CANDLE IS NOT ONLY A COLOUR')
for (const theme of ['dark', 'light']) {
  const c = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(c, { theme })
  c.on('pageerror', (e) => errs.push(String(e)))
  await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await c.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' }); await c.waitForTimeout(700)
  const m = await c.evaluate(() => {
    const cs = [...document.querySelectorAll('.ch-candle')]
    const body = (c) => c && getComputedStyle(c.querySelector('.ch-body'))
    const up = body(cs.find((x) => x.classList.contains('up') && !x.classList.contains('now')))
    const dn = body(cs.find((x) => x.classList.contains('down') && !x.classList.contains('now')))
    const now = body(cs.find((x) => x.classList.contains('now')))
    const clear = (s) => s && /rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor)
    return {
      upHollow: clear(up) && /inset/.test(up.boxShadow),
      downFilled: !clear(dn) && !/inset/.test(dn.boxShadow),
      // the latest period keeps its own ring whichever way it went
      nowRinged: !!now && /1px/.test(now.boxShadow),
      width: Math.round(document.querySelector('.ch-candle')?.getBoundingClientRect().width ?? 0),
    }
  })
  ok(`${theme}: a rise is hollow and a fall is filled`, m.upHollow && m.downFilled, JSON.stringify(m))
  ok(`${theme}: and it survives the narrowest bar drawn`, m.width >= 3, m.width + 'px')
  ok(`${theme}: the latest period still marks itself`, m.nowRinged)
  await c.close()
}

console.log('LABELS THAT FIT WHERE THEY ARE PUT')
for (const [w, tag] of [[1440, 'desk'], [1100, 'tablet'], [390, 'phone'], [360, 'small']]) {
  const c = await b.newPage({ viewport: { width: w, height: 900 } })
  await seen(c)
  c.on('pageerror', (e) => errs.push(String(e)))
  await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await c.goto(B + '/invest/aapl', { waitUntil: 'domcontentloaded' }); await c.waitForTimeout(700)
  const m = await c.evaluate(() => {
    const plot = document.querySelector('.ch-plot')
    const card = plot?.closest('.card')
    if (!plot || !card) return null
    const cb = card.getBoundingClientRect()
    const box = (sel) => [...document.querySelectorAll(sel)].map((e) => ({ t: e.textContent.trim(), r: e.getBoundingClientRect() }))
    const hit = (a, c2) => a.left < c2.right && c2.left < a.right && a.top < c2.bottom && c2.top < a.bottom
    const tag = box('.ch-mark-tag')[0]
    return {
      // The real-price tag used to start at the plot's left edge, which is
      // inside the gutter the axis labels live in, so it sat on top of one.
      overTicks: tag ? box('.ch-tick').filter((t) => hit(tag.r, t.r)).map((t) => t.t) : [],
      // The high and the low sit against the right edge and were flush with it.
      tight: box('.ch-edge span').filter((e) => cb.right - e.r.right < 4).map((e) => e.t),
    }
  })
  ok(`${tag}: nothing on the plot is drawn over anything else`,
     !!m && m.overTicks.length === 0 && m.tight.length === 0, JSON.stringify(m))
  await c.close()
}

console.log('AND EVERY PLACEHOLDER FITS ITS FIELD')
for (const w of [390, 360, 320]) {
  const c = await b.newPage({ viewport: { width: w, height: 844 } })
  await seen(c)
  c.on('pageerror', (e) => errs.push(String(e)))
  await c.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const over = []
  for (const r of ['/activity', '/invest', '/all', '/send', '/account/support', '/verify/number', '/receive']) {
    await c.goto(B + r, { waitUntil: 'domcontentloaded' }); await c.waitForTimeout(350)
    // A placeholder cut mid-word is a sentence the field never finishes.
    over.push(...await c.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('input')) {
        if (!el.placeholder || el.offsetParent === null) continue
        const probe = document.createElement('span')
        const s = getComputedStyle(el)
        probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${s.font};letter-spacing:${s.letterSpacing}`
        probe.textContent = el.placeholder
        document.body.appendChild(probe)
        const need = probe.getBoundingClientRect().width
        probe.remove()
        if (need > el.clientWidth - 1) out.push(el.placeholder)
      }
      return out
    }))
  }
  ok(`${w}px: no placeholder is cut off`, over.length === 0, over.join('; ') || 'none')
  await c.close()
}

console.log('AND THE TYPE IS THE TYPE, WITH NOBODY ELSE IN THE PATH')
{
  const c = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(c)
  c.on('pageerror', (e) => errs.push(String(e)))
  // Nothing routed away this time: the point is that there is nothing to route.
  const offsite = []
  await c.route('**/*', (r) => {
    const u = r.request().url()
    if (u.startsWith('http://localhost:4173')) return r.continue()
    offsite.push(u)
    return r.abort()
  })
  await c.goto(B + '/transfer', { waitUntil: 'networkidle' }); await c.waitForTimeout(700)
  ok('the product fetches nothing from anywhere else', offsite.length === 0, offsite.join(' ') || 'none')
  const f = await c.evaluate(async () => {
    await document.fonts.ready
    const width = (t, font) => {
      const s = document.createElement('span')
      s.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:600 48px ${font}`
      s.textContent = t; document.body.appendChild(s)
      const w = s.getBoundingClientRect().width; s.remove(); return Math.round(w)
    }
    return {
      faces: [...document.fonts].filter((x) => x.status === 'loaded').length,
      hero: getComputedStyle(document.querySelector('.hero-figure')).fontFamily.split(',')[0],
      // Geist and the fallback are nothing like each other, which is the whole
      // reason this matters: a session that fell back was a different design.
      differs: width('$2,480.00', "'Geist'") !== width('$2,480.00', 'ui-sans-serif'),
      // latin-ext carries U+20A0-20AB, and the naira sign is U+20A6.
      naira: width('\u20a63,720,000', "'Geist'") !== width('\u20a63,720,000', 'ui-sans-serif'),
    }
  })
  ok('both subsets load from this origin', f.faces === 2, f.faces + ' faces')
  ok('and the product is set in them', f.hero.includes('Geist') && f.differs, f.hero)
  ok('including the naira sign, which lives in latin-ext', f.naira)
  await c.close()
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
