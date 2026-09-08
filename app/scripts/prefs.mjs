/* A preference that changes nothing is a preference that lies. Every switch in
   Account is followed to the thing it claims to change. */
import { chromium } from 'playwright'
import { seen, verify } from './seen.mjs'
const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const p = await b.newPage({ viewport: { width: 1440, height: 1100 } })
await seen(p)
p.on('pageerror', (e) => errs.push(String(e)))
p.setDefaultTimeout(6000)
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
// Every control lives in its own group now, so a helper per group rather
// than one /account that held all twenty-five.
const group = async (g) => { await p.goto(B + '/account/' + g, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400) }
const acct = () => group('preferences')
const notifs = () => group('notifications')
const at = async (r) => { await p.goto(B + r, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(400) }
const text = () => p.evaluate(() => document.body.innerText)

// out of the way of the limits, so the ceiling under test is the one meant
await verify(p)

console.log('IT REMEMBERS')
await acct()
await p.getByRole('button', { name: 'Detailed', exact: true }).click(); await p.waitForTimeout(300)
await at('/')
ok('home screen follows the setting', /PORTFOLIO OVER TIME/i.test(await text()), 'detailed')
await acct()
await p.getByRole('button', { name: 'Simple', exact: true }).click(); await p.waitForTimeout(300)
await at('/')
// The three doors, which only the Simple view draws. It used to look for the
// words "Buy Stocks", which stopped being a door label when every door was
// made to carry the name of the place it opens.
ok('and back again', (await p.locator('.card.gate').count()) === 3, 'simple')

console.log('THEME')
await acct()
await p.getByRole('button', { name: 'Light', exact: true }).click(); await p.waitForTimeout(300)
await at('/invest')
ok('the theme survives leaving the screen',
   (await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light')
await acct()
await p.getByRole('button', { name: 'Dark', exact: true }).click(); await p.waitForTimeout(300)

console.log('NAIRA BESIDE DOLLARS')
await at('/transfer')
ok('naira is there by default', /About \u20a6[\d,]+/.test(await text()))
await acct()
await p.getByRole('button', { name: /Show naira beside dollars/ }).click(); await p.waitForTimeout(300)
await at('/transfer')
ok('turning it off removes it', !/About \u20a6[\d,]+/.test(await text()))
await at('/withdraw')
ok('but Convert still shows naira, because that is what it is about',
   /₦/.test(await text()))
await acct()
await p.getByRole('button', { name: /Show naira beside dollars/ }).click(); await p.waitForTimeout(300)

console.log('HIDE MY BALANCES  the switch, and where it sits')
{
  const MASK = '\u2022\u2022\u2022\u2022\u2022\u2022'
  // Every screen with a headline balance carries the switch, on the figure's
  // own line rather than in the header three hundred pixels away. Borrow & Lend is the
  // reason this is a test: it masked a balance and offered no way to uncover
  // it short of four taps into Preferences.
  // The figure is whichever element the switch was paired with, which is the
  // point: the test cannot name one without naming the other.
  // Borrow & Lend's own hero is gone, and the figure it carried went to the two
  // position pages the cards open. The switch went with it — that is the rule,
  // and these two routes are where it now has to hold.
  const sel = '.figure-eye > :first-child'
  for (const route of ['/', '/transfer', '/grow/lending', '/grow/borrowing']) {
    await at(route)
    const where = await p.evaluate(() => {
      const e = document.querySelector('.eye-btn')
      if (!e) return null
      return { figure: !!e.closest('.figure-eye'), header: !!e.closest('.page-header'),
               n: document.querySelectorAll('.eye-btn').length }
    })
    ok(`${route} carries it, beside the figure`,
       !!where && where.figure && !where.header && where.n === 1,
       where ? `${where.n} eye, in ${where.figure ? 'the figure' : 'the header'}` : 'no eye')
    // and the button next to the number covers that number
    const read = () => p.evaluate((q) => document.querySelector(q)?.textContent ?? '', sel)
    const shown = await read()
    await p.locator('.eye-btn').first().click(); await p.waitForTimeout(350)
    const hidden = await read()
    await p.locator('.eye-btn').first().click(); await p.waitForTimeout(350)
    const back = await read()
    ok(`  and it covers the figure it sits on`,
       hidden === MASK && back === shown, `${shown} → ${hidden} → ${back}`)
  }
  // One switch, one setting: covering on Home covers everywhere.
  await at('/')
  await p.locator('.eye-btn').first().click(); await p.waitForTimeout(350)
  await at('/grow/borrowing')
  ok('one switch, not one per screen',
     (await p.evaluate(() => document.querySelector('.hero-figure')?.textContent)) === MASK)
  ok('and it says which way it is pointing',
     (await p.evaluate(() => document.querySelector('.eye-btn')?.getAttribute('aria-pressed'))) === 'true')
  // And a figure that is not a headline follows the setting without a switch
  // of its own: the two cards on Borrow & Lend are positions, like a holding on
  // a company page. Two eyes on one screen would suggest two things to cover.
  await at('/grow')
  ok('the cards follow it with no switch of their own',
     (await p.evaluate(() => [...document.querySelectorAll('.prod-figure')].map((e) => e.textContent)))
       .every((t) => t === MASK) &&
     (await p.evaluate(() => document.querySelectorAll('.eye-btn').length)) === 0)
  await at('/')
  await p.locator('.eye-btn').first().click(); await p.waitForTimeout(350)
  // Preferences still has it, because a control found by accident once is a
  // control you cannot find again on purpose.
  await acct()
  ok('Preferences still holds it too',
     (await p.getByRole('button', { name: /Hide my balances/ }).count()) === 1)
}

console.log('THE REMINDERS ON HOME  where they sit, and how to be rid of them')
{
  // Its own page: the verify reminder only exists on an unverified account,
  // and this suite verified the shared one on the first line.
  const t = await b.newPage({ viewport: { width: 1440, height: 1300 } })
  await seen(t)
  t.on('pageerror', (e) => errs.push(String(e)))
  t.setDefaultTimeout(6000)
  await t.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const home = async () => { await t.goto(B + '/', { waitUntil: 'domcontentloaded' }); await t.waitForTimeout(450) }
  await home()
  // Reading order rather than child order: the task and the feed share a
  // wrapper now, because on a tablet held upright they sit beside each other
  // (11g.56), and one level of nesting is not a change of position. Every
  // element in the flow, in the order somebody meets it.
  const o = await t.evaluate(() =>
    [...document.querySelectorAll('main *')]
      .map((e) => String(e.className || e.tagName).split(' ')[0])
      .filter((c) => ['gates', 'task', 'headline'].includes(c)))
  // They used to sit above the balance and the doors, which is where a bank
  // puts what it wants from you rather than what you came for.
  const feedAt = await t.evaluate(() => {
    const all = [...document.querySelectorAll('main *')]
    const f = all.find((e) => /Recent activity/i.test(e.textContent ?? '') && e.classList.contains('card-head'))
    return f ? all.indexOf(f) : -1
  })
  const taskAt = await t.evaluate(() => {
    const all = [...document.querySelectorAll('main *')]
    const e = all.find((x) => x.classList.contains('task'))
    return e ? all.indexOf(e) : -1
  })
  const gateAt = await t.evaluate(() => {
    const all = [...document.querySelectorAll('main *')]
    const e = all.find((x) => x.classList.contains('gates'))
    return e ? all.indexOf(e) : -1
  })
  ok('they sit under the doors and against the activity',
     gateAt >= 0 && taskAt > gateAt && feedAt > taskAt,
     `${o.join(' > ')}  (doors ${gateAt}, task ${taskAt}, feed ${feedAt})`)
  ok('the row still goes where it says, and has a way to be put away',
     (await t.locator('.task .task-main').count()) >= 1 &&
     (await t.locator('.task .task-close').count()) >= 1)
  const rows = () => t.locator('.task').count()
  const before = await rows()
  await t.locator('.task-close').first().click(); await t.waitForTimeout(450)
  const asked = await t.evaluate(() => document.querySelector('.sheet')?.innerText.replace(/\n/g, ' ') ?? '')
  // One of these is what lifts an account's limits. It asks first, and it says
  // what is being hidden and what is not.
  ok('it asks before it goes', /Put away/.test(asked), asked.slice(0, 44))
  ok('and says what stays behind', /still verify from Account|Nothing leaves your bucket/.test(asked))
  ok('and where it still lives', /Where it still lives/i.test(asked))
  await t.getByRole('button', { name: 'Keep it on Home' }).click(); await t.waitForTimeout(400)
  ok('keeping it keeps it', (await rows()) === before)
  await t.locator('.task-close').first().click(); await t.waitForTimeout(400)
  await t.getByRole('button', { name: 'Put it away' }).click(); await t.waitForTimeout(450)
  ok('putting it away takes it off Home', (await rows()) === before - 1, `${before} → ${await rows()}`)
  // A preference, so it survives a reload. seen() re-seeds prefs on every
  // fresh document, so what was written is read back rather than reloaded.
  ok('and it is written down, not held in a variable',
     (await t.evaluate(() =>
       JSON.parse(localStorage.getItem('tokkenly.prefs.v1') ?? '{}').prefs?.putAway ?? [])).length === 1)
  await t.goto(B + '/account/preferences', { waitUntil: 'domcontentloaded' }); await t.waitForTimeout(450)
  const back = await t.evaluate(() => [...document.querySelectorAll('.pref-row')]
    .map((e) => e.innerText.replace(/\n/g, ' · ')).find((x) => /put away/i.test(x)) ?? '')
  ok('Preferences offers the way back, and counts them', /One is put away/.test(back), back || 'no row')
  await t.locator('.pref-row', { hasText: 'put away' }).getByText('Show them again').click()
  await t.waitForTimeout(400)
  await home()
  ok('and it brings them back', (await rows()) === before)
  await t.goto(B + '/account/preferences', { waitUntil: 'domcontentloaded' }); await t.waitForTimeout(450)
  ok('the row goes away when there is nothing to bring back',
     !(await t.evaluate(() => document.body.innerText)).includes('put away'))

  /* The debit-card notice joins the same list rather than getting a second
     one. It was 202px of chrome on all forty-three routes with no way to close
     it, which is furniture rather than an advert. */
  await home()
  ok('the sidebar carries the card notice', await t.evaluate(() => !!document.querySelector('.promo')))
  await t.locator('.promo-shut').click({ force: true }); await t.waitForTimeout(400)
  ok('and it can be put away', await t.evaluate(() => !document.querySelector('.promo')))
  await t.goto(B + '/invest', { waitUntil: 'domcontentloaded' }); await t.waitForTimeout(400)
  ok('and stays away on the next screen', await t.evaluate(() => !document.querySelector('.promo')))
  ok('as a preference, not a variable',
     (await t.evaluate(() =>
       JSON.parse(localStorage.getItem('tokkenly.prefs.v1') ?? '{}').prefs?.putAway ?? []))
       .includes('promo.card'))
  await t.goto(B + '/account/preferences', { waitUntil: 'domcontentloaded' }); await t.waitForTimeout(450)
  await t.locator('.pref-row', { hasText: 'put away' }).getByText('Show them again').click()
  await t.waitForTimeout(400)
  await home()
  ok('and one list brings back both', await t.evaluate(() => !!document.querySelector('.promo')))
  await t.close()
}

console.log('NOTIFICATIONS')
await at('/')
const before = await p.evaluate(() => document.querySelector('.bell .dot')?.textContent ?? '0')
await notifs()
await p.getByRole('button', { name: /Money landing/ }).click(); await p.waitForTimeout(300)
await at('/')
const after = await p.evaluate(() => document.querySelector('.bell .dot')?.textContent ?? '0')
ok('turning one off changes what reaches you', before !== after, `${before} → ${after}`)
await p.locator('.bell').click(); await p.waitForTimeout(500)
ok('the bell goes to the section rather than floating a panel',
   (await p.evaluate(() => location.hash)) === '#/activity?filter=alerts' &&
   (await p.locator('.scrim').count()) === 0,
   await p.evaluate(() => location.hash))
// The two money ones. "paid you" would also catch the daily lending interest,
// which is a grow notification and is meant to still be here.
ok('and the section agrees with the bell',
   !/Adaeze|Payroll/i.test(await p.evaluate(() => document.querySelector('.alert-list')?.innerText ?? '')),
   (await p.evaluate(() => document.querySelector('.alert-list')?.innerText?.replace(/\n/g, ' ').slice(0, 60) ?? '')))
await notifs()
await p.getByRole('button', { name: /Money landing/ }).click(); await p.waitForTimeout(300)

console.log('ASK FOR THE PIN ABOVE')
await at('/invest/aapl/invest')
let i = p.locator('.amount-box input')
await i.fill('100'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
ok('under the figure, nothing extra to do',
   await p.evaluate(() => !document.querySelector('.pinpad') && !!document.querySelector('.scrim .btn-primary')))
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
await at('/invest/aapl/invest')
i = p.locator('.amount-box input')
await i.fill('900'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
const big = await p.evaluate(() => ({
  pad: !!document.querySelector('.pinpad'),
  button: !!document.querySelector('.scrim .btn-primary'),
  says: document.querySelector('.pin-note')?.textContent ?? '',
}))
// A tickbox proves nothing about who is holding the phone, so above the
// figure there is no button to press at all until four digits arrive.
ok('over it, the PIN stands where the button was',
   big.pad && !big.button, big.says || 'no pad')
const tap = (d) => p.locator('.pin-keypad .key', { hasText: new RegExp('^' + d + '$') }).first().click()
for (const d of ['9', '9', '9', '9']) await tap(d)
await p.waitForTimeout(400)
ok('a wrong PIN says how many tries are left',
   /tries left/.test(await p.evaluate(() => document.querySelector('.pin-note')?.textContent ?? '')),
   await p.evaluate(() => document.querySelector('.pin-note')?.textContent ?? ''))
for (const d of ['4', '1', '9', '3']) await tap(d)
await p.waitForTimeout(400)
ok('and the right one hands back the button that names the amount',
   /900/.test(await p.evaluate(() => document.querySelector('.scrim .btn-primary')?.textContent ?? '')),
   await p.evaluate(() => document.querySelector('.scrim .btn-primary')?.textContent ?? 'still gated'))
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
await acct()
await p.getByRole('button', { name: 'Never', exact: true }).click(); await p.waitForTimeout(300)
await at('/invest/aapl/invest')
i = p.locator('.amount-box input')
await i.fill('2000'); await i.dispatchEvent('input'); await p.waitForTimeout(200)
await p.locator('.btn-primary').first().click(); await p.waitForTimeout(400)
ok('and "Never" means never', await p.evaluate(() => !document.querySelector('.agree')))

/* A quick amount you cannot use is not a quick amount. Borrow offered $500,
   $1,000, $1,480 and Max against a $250 ceiling — four presses, one answer,
   and two of the four were the same number before the clamp even ran. */
console.log('QUICK AMOUNTS AGAINST THE CEILING')
{
  // Its own page. The suite above verifies the account and turns the PIN check
  // off, and both move the ceiling — a check that reads whatever ceiling the
  // last test left behind is checking nothing in particular.
  const q = await b.newPage({ viewport: { width: 1440, height: 1100 } })
  await seen(q)
  await q.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  for (const r of ['/grow/borrow', '/invest/aapl/invest', '/withdraw', '/grow/earn']) {
    await q.goto(B + r, { waitUntil: 'domcontentloaded' }); await q.waitForTimeout(550)
    const m = await q.evaluate(() => ({
      chips: [...document.querySelectorAll('.chip')].map((e) => e.textContent.trim()),
      ceiling: document.querySelector('.ruler-note')?.textContent ?? '',
    }))
    // [\d,.]+ is greedy and ate the full stop at the end of the sentence, so
    // this read "250.00." and Number gave NaN, and every comparison against NaN
    // is false — which is a check that passes whatever the chips say.
    const found = m.ceiling.match(/Up to \$([\d,]+(?:\.\d+)?)/)
    // A ceiling this could not read is a check that would pass whatever the
    // chips said. It says so instead.
    if (!found) { ok(`${r}: read its ceiling`, false, `no "Up to" in "${m.ceiling}"`); continue }
    const cap = Number(found[1].replace(/,/g, ''))
    if (!Number.isFinite(cap)) { ok(`${r}: read its ceiling as a number`, false, JSON.stringify(m.ceiling)); continue }
    const over = m.chips.filter((c) => /^\$/.test(c) && Number(c.replace(/[^0-9.]/g, '')) > cap + 0.005)
    ok(`${r} offers nothing above its own ceiling of ${usdish(cap)}`, over.length === 0,
       m.chips.join(' ') + (over.length ? '   over: ' + over.join(' ') : ''))
    ok('  and no two of them are the same press', new Set(m.chips).size === m.chips.length,
       m.chips.join(' '))
    ok('  and there are at least two to choose between', m.chips.length >= 2, m.chips.join(' '))
  }
  await q.close()
}
function usdish(n) { return '$' + n.toLocaleString('en-US') }

/* The keyboard route to the button that spends money was eighteen stops. The
   skip link answers the nine before the screen; this answers the five inside
   it, which are the field and the four amounts between it and the button. */
console.log('ENTER IS THE ACTION')
await at('/invest/aapl/invest')
{
  const f = p.locator('.amount-box input')
  await f.fill('120')
  await p.keyboard.press('Enter'); await p.waitForTimeout(600)
  const said = await p.evaluate(() => ({
    sheet: document.querySelector('.scrim .sheet-head h2')?.textContent?.trim() ?? null,
    figure: document.querySelector('.scrim .figure .t-display-xl')?.textContent?.trim() ?? null,
  }))
  ok('Enter in the amount field goes where the button goes', said.sheet === 'Review',
     JSON.stringify(said))
  ok('and it carries the figure that was typed', said.figure === '$120.00', String(said.figure))
  await p.keyboard.press('Escape'); await p.waitForTimeout(250)
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
