/* Account as an index, and the two locks behind it. The questions this asks
   are the ones the old screen could not answer: can you find a control, does
   the row tell you what it is set to before you tap, and does the PIN stand
   between somebody and your money or is it decoration. */
import { chromium } from 'playwright'
import { seen, verify } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)

const page = async (w = 1440, h = 1100) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await seen(p)
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

const GROUPS = ['details', 'preferences', 'notifications', 'security',
  'payments', 'verification', 'support', 'legal']

console.log('THE INDEX  eight rows, not ten cards')
{
  const p = await page()
  await at(p, '/account')
  const rows = await p.evaluate(() => [...document.querySelectorAll('.set-row')].map((e) => ({
    label: e.querySelector('.t-body-strong')?.textContent ?? '',
    value: e.querySelector('.set-value')?.textContent ?? '',
  })))
// Nine: the wallet became a group of its own when the product started saying
// who holds the key, what it sponsors, and how somebody got in.
  ok('every group is a row', rows.length === 9, rows.length + ' rows')
  ok('and every row answers before you tap',
     rows.every((r) => r.value.length > 0),
     rows.map((r) => r.label + ' → ' + r.value).join(' | '))
  // The whole point of the value column: no row may truncate it away.
  ok('none of the values is cut off', !rows.some((r) => r.value.includes('…')),
     rows.filter((r) => r.value.includes('…')).map((r) => r.label).join(', ') || 'none cut')
  // The wall was the index itself: ten cards where eight rows would do. The
  // panel beside it is allowed cards — that is what a panel is for — so the
  // question is whether the column holding the list has any.
// One card beside the list, and it is the door to the ops console rather than
// a setting. The wall this was written against was ten cards *of settings*;
// what is being kept out is a second way to change the same things, not a
// signpost to a different product.
  ok('the old wall of cards is gone',
     (await p.locator('main .set-col .card').count()) === 1 &&
     (await p.locator('main .set-list .set-row').count()) === 9,
     await p.locator('main .set-col .card').count() + ' cards beside the list')
  await p.close()
}

console.log('WHERE YOU ARE  said once, by whatever is already on the screen')
{
  const p = await page()
  for (const g of GROUPS) {
    await at(p, '/account/' + g)
    const said = await p.evaluate(() => ({
      crumbs: !!document.querySelector('.crumbs'),
      lit: document.querySelector('.set-row.on .t-body-strong')?.textContent ?? '',
      h1: document.querySelector('h1')?.textContent ?? '',
    }))
    // Wide: the lit row is the answer, so a trail restating it is a second
    // copy of a fact already on screen.
    ok(`  wide /account/${g} says it once`, !said.crumbs && !!said.lit && said.h1 === 'Account')
  }
  const m = await page(390, 844)
  for (const g of GROUPS) {
    await at(m, '/account/' + g)
    const said = await m.evaluate(() => {
      const b = document.querySelector('.page-back')
      return {
        crumbs: !!document.querySelector('.crumbs'),
        back: b?.innerText.trim() ?? '',
        tall: b ? Math.round(b.getBoundingClientRect().height) : 0,
        h1: document.querySelector('h1')?.textContent ?? '',
      }
    })
    // Narrow: the trail's last name was the page title, word for word, one
    // line above it. One step up in its place, and it is hittable.
    ok(`  narrow /account/${g} offers one step up`,
       !said.crumbs && said.back === 'Account' && said.tall >= 44 && said.h1 !== 'Account',
       `${said.back || 'no back'} ${said.tall}px over "${said.h1}"`)
  }
  await m.locator('.page-back').click(); await m.waitForTimeout(300)
  ok('  and it lands on the index', (await m.evaluate(() => location.hash)) === '#/account')
  await p.close(); await m.close()
}

console.log('PERSONAL DETAILS IS A PROFILE')
{
  const p = await page()
  await at(p, '/account/details')
  const prof = await p.evaluate(() => document.querySelector('.profile')?.innerText.replace(/\n/g, ' · ') ?? '')
  ok('it opens with who this is', /Chinaza Okoro/.test(prof) && /since/.test(prof), prof)
  ok('with a monogram, not a placeholder',
     (await p.evaluate(() => document.querySelector('.profile .avatar')?.textContent)) === 'CO')
  const acct = await p.evaluate(() =>
    [...document.querySelectorAll('.card')].find((c) => /THIS ACCOUNT/.test(c.innerText))?.innerText.replace(/\n/g, ' · ') ?? '')
  ok('and the three facts that are this product, not this person',
     /0x/.test(acct) && /Payouts land in/.test(acct) && /You can move/.test(acct), acct.slice(0, 110))
  // The address is the one thing here nobody retypes by hand.
  ok('the address reads from its left edge, where the copy button is not',
     (await p.evaluate(() => getComputedStyle(document.querySelector('.addr')).textAlign)) === 'left')
  // Unverified the amber banner says it at length; the badge would be a
  // second copy. Verified there is no banner, so the badge carries it.
  ok('the status is stated once', !/Not verified/.test(prof), prof)
  await verify(p)
  await at(p, '/account/details')
  ok('and verified, by the profile',
     /Verified/.test(await p.evaluate(() => document.querySelector('.profile')?.innerText ?? '')) &&
     (await p.locator('.page-header .eyebrow').count()) === 0)
  await p.close()
}

console.log('EVERY GROUP IS AN ADDRESS')
{
  const p = await page()
  for (const g of GROUPS) {
    await at(p, '/account/' + g)
    const lit = await p.evaluate(() => document.querySelector('.set-row.on .t-body-strong')?.textContent ?? '')
    const body = await p.evaluate(() => document.querySelector('.set-panel')?.innerText?.trim() ?? '')
    ok(`/account/${g} opens with its own row lit`, !!lit && body.length > 40, lit)
  }
  await p.close()
}

console.log('THE OLD ADDRESSES STILL LAND')
{
  const p = await page()
  for (const [from, expect] of [['/security', 'Security'], ['/support', 'Support']]) {
    await at(p, from)
    ok(`${from} still reaches ${expect}`,
       (await p.evaluate(() => document.querySelector('.set-row.on .t-body-strong')?.textContent ?? '')) === expect)
  }
  await p.close()
}

console.log('WIDE AND NARROW  a rail beside a panel, or one screen at a time')
{
  const p = await page(1440, 1000)
  await at(p, '/account/security')
  ok('wide keeps the list on screen beside the panel',
     (await p.locator('.set-list').count()) === 1 && (await p.locator('.set-panel').count()) === 1)
  const m = await page(390, 844)
  await at(m, '/account/security')
  ok('narrow shows the group alone', (await m.locator('.set-list').count()) === 0)
  await at(m, '/account')
  ok('and the index alone', (await m.locator('.set-list').count()) === 1)
  ok('with a way back into each group',
     (await m.locator('.set-row').count()) === 9)
  await p.close(); await m.close()
}

console.log('SECURITY IS NOT DECORATIVE  the switches used to toast and forget')
{
  const p = await page()
  await at(p, '/account/security')
  const on = () => p.evaluate(() =>
    [...document.querySelectorAll('.toggle-knob, .switch')].length)
  await p.getByRole('button', { name: /Face ID/ }).click()
  await p.waitForTimeout(300)
  await at(p, '/invest')
  await at(p, '/account/security')
  const stuck = await p.evaluate(() => {
    const row = [...document.querySelectorAll('.set-row, .pref-row, button')]
      .find((e) => /Face ID/.test(e.textContent ?? ''))
    return row?.getAttribute('aria-pressed')
  })
  ok('a switch survives leaving the screen', stuck === 'false', 'aria-pressed ' + stuck)
  await p.getByRole('button', { name: /Face ID/ }).click()
  await p.waitForTimeout(200)
  void on
  await p.close()
}

console.log('CHANGING THE PIN  refused at the moment it is typed, not on save')
{
  const p = await page()
  await at(p, '/account/security?sheet=pin')
  ok('it starts by asking for the one you have',
     /PIN you use now/i.test(await p.evaluate(() => document.querySelector('.sheet')?.innerText ?? '')))
  for (const d of ['1', '1', '1', '1']) await tap(p, d)
  await p.waitForTimeout(400)
  ok('a wrong PIN counts down rather than just refusing',
     /4 tries left/.test(await note(p)), await note(p))
  for (const d of ['4', '1', '9', '3']) await tap(p, d)
  await p.waitForTimeout(400)
  ok('the right one moves on', /Your new PIN/i.test(
     await p.evaluate(() => document.querySelector('.sheet .t-caps')?.textContent ?? '')))

  for (const [pin, why] of [
    [['0', '0', '0', '0'], /four of the same/i],
    [['1', '2', '3', '4'], /four in a row/i],
    [['4', '3', '2', '1'], /backwards/i],
    [['1', '9', '9', '6'], /year/i],
  ]) {
    for (const d of pin) await tap(p, d)
    await p.waitForTimeout(320)
    ok('  ' + pin.join('') + ' is refused, and says why', why.test(await note(p)), await note(p))
  }
  for (const d of ['4', '1', '9', '3']) await tap(p, d)
  await p.waitForTimeout(320)
  ok('  so is the one you already have', /already have/.test(await note(p)), await note(p))

  for (const d of ['8', '2', '6', '1']) await tap(p, d)
  await p.waitForTimeout(400)
  ok('a good one asks for it twice', /Type it again/i.test(
     await p.evaluate(() => document.querySelector('.sheet .t-caps')?.textContent ?? '')))
  for (const d of ['8', '2', '6', '2']) await tap(p, d)
  await p.waitForTimeout(400)
  // Back to choosing, not to confirming: two entries disagreed and there is no
  // way to know which was the slip.
  ok('a mismatch goes back to choosing, not round again',
     /Your new PIN/i.test(await p.evaluate(() => document.querySelector('.sheet .t-caps')?.textContent ?? '')) &&
     /did not match/i.test(await note(p)), await note(p))
  for (const d of ['8', '2', '6', '1']) await tap(p, d)
  await p.waitForTimeout(300)
  for (const d of ['8', '2', '6', '1']) await tap(p, d)
  await p.waitForTimeout(500)
  ok('and matching saves it', (await p.locator('.scrim > .sheet').count()) === 0)
  ok('the row says when it changed',
     /changed \d+ \w+ \d{4}/.test(
       await p.locator('.set-row', { hasText: 'App PIN' }).locator('small').textContent()))
  await p.close()
}

console.log('THE PIN STANDS IN FRONT OF THE MONEY')
{
  const p = await page()
  // Out of the way of the unverified ceiling, which caps $900 at $250 and
  // would make every one of these read "no pad" for the wrong reason.
  await verify(p)
  for (const [route, amount, gated] of [
    ['/invest/aapl/invest', 300, false],
    ['/invest/aapl/invest', 900, true],
    ['/invest/aapl/sell', 900, true],
    ['/send?to=Tunde%20Bakare', 900, true],
    ['/withdraw', 900, true],
  ]) {
    await at(p, route)
    const i = p.locator('.amount-box input')
    await i.fill(String(amount)); await i.dispatchEvent('input'); await p.waitForTimeout(200)
    await p.locator('.card .btn-primary, .sheet .btn-primary').last().click()
    await p.waitForTimeout(450)
    const pad = await p.locator('.scrim .pinpad').count()
    ok(`${route} at $${amount} ${gated ? 'asks for the PIN' : 'does not'}`,
       (pad === 1) === gated, pad ? 'pad' : 'no pad')
    await p.keyboard.press('Escape'); await p.waitForTimeout(250)
  }
  await p.close()
}

console.log('THE PASSWORD  length beats punctuation')
{
  const p = await page()
  await at(p, '/account/security?sheet=password')
  const nu = p.locator('.sheet .field input').nth(1)
  const say = () => p.evaluate(() => document.querySelector('.pw-note')?.textContent ?? '')
  const off = () => p.evaluate(() => !!document.querySelector('.sheet .btn-primary')?.hasAttribute('disabled'))
  ok('it opens refusing to save', await off())
  for (const [v, re, blocked] of [
    ['short', /Ten characters at least/, true],
    ['password123', /passwords people pick most/, true],
    ['chinaza okoro is me', /own name/, true],
    ['harmattan window', /Strong/, false],
    ['plain enough', /Good/, false],
  ]) {
    await nu.fill(v); await nu.dispatchEvent('input'); await p.waitForTimeout(200)
    ok(`  "${v}" → ${blocked ? 'refused' : 'accepted'}`,
       re.test(await say()) && (await off()) === blocked, await say())
  }
  // A show toggle, because typing a long password blind on a phone is the
  // reason people pick short ones.
  await p.locator('.pw-eye').nth(1).click(); await p.waitForTimeout(150)
  ok('you can look at what you typed',
     (await nu.getAttribute('type')) === 'text')
  const cu = p.locator('.sheet .field input').nth(0)
  await cu.fill('wrong one'); await p.waitForTimeout(100)
  await p.locator('.sheet .btn-primary').click(); await p.waitForTimeout(400)
  ok('the wrong current password does not save',
     (await p.locator('.scrim > .sheet').count()) === 1)
  await cu.fill('harmattan evening walk'); await p.waitForTimeout(100)
  await p.locator('.sheet .btn-primary').click(); await p.waitForTimeout(500)
  ok('the right one does', (await p.locator('.scrim > .sheet').count()) === 0)
  await p.close()
}

console.log('LOCKED OUT  the way back in is on the screen you are locked out of')
{
  const p = await page()
  await at(p, '/signin')
  ok('sign in offers a way out of a forgotten password',
     (await p.getByRole('button', { name: /Forgotten your password/ }).count()) === 1)
  await p.getByRole('button', { name: /Forgotten your password/ }).click()
  await p.waitForTimeout(400)
  await p.locator('.sheet .btn-primary').click(); await p.waitForTimeout(450)
  const said = await p.evaluate(() => document.querySelector('.sheet')?.innerText?.replace(/\n/g, ' ') ?? '')
  // Never "no account with that email" — that tells a stranger which of the
  // addresses they are guessing is real.
  ok('and it does not say whether the address exists',
     /If .* has an account/.test(said) && !/no account|not found/i.test(said), said.slice(0, 70))
  await p.close()
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
