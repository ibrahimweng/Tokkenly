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
await at('/?sheet=notifications')
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
await at('/send?to=Tunde Bakare')
{
  const d = await p.evaluate(() => {
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
await at('/invest')
await p.locator('.table tbody tr').first().locator('.icon-btn').click(); await p.waitForTimeout(350)
ok('a toast is announced', /is in your bucket/.test(await said()), JSON.stringify(await said()))
await p.locator('.toast').hover(); await p.waitForTimeout(3200)
// WCAG 2.2.1: content that removes itself on a timer has to be holdable.
ok('and holds while it is under the pointer', await p.evaluate(() => !!document.querySelector('.toast')))
await p.locator('.toast').click(); await p.waitForTimeout(250)
ok('and can be dismissed', await p.evaluate(() => !document.querySelector('.toast')))

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
    '/invest/aapl/invest', '/grow/borrow', '/?sheet=notifications']) {
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

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
