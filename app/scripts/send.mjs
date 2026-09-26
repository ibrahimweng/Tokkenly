/* The Send picker, both widths: who first, then how much, and it completes.

   It used to print what it found and assert nothing, which is how two of its
   lines went on reporting 0 for a people rail and an address field that the
   Send redesign (11g.60) had replaced, without anybody reading them. What is
   checked now is the shape the product has: the people are the Tokkenly way's
   own list, with a search over them, and picking one opens the composer. */
import { B, launch, check, teardown, shot } from './lib/harness.mjs'
import { seen } from './lib/seen.mjs'
const b = await launch()
const errs = []
const text = async (pg, sel) => ((await pg.locator(sel).first().textContent().catch(() => '')) ?? '').trim()

// phone: who first, then how much
const p = await b.newPage({ viewport: { width: 390, height: 844 } })
// Since the app lock landed, a page that does not seed the unlock drives
// the PIN pad instead of the product. This suite was measuring the lock
// screen and reporting on it.
await seen(p)
p.on('pageerror', (e) => errs.push('phone pageerror: ' + e.message))
// /send is the three ways now (11g.60); the people live in the Tokkenly one.
console.log('PHONE  /send/tokkenly')
await p.goto(B + '/send/tokkenly', { waitUntil: 'networkidle' })
await p.waitForTimeout(200)
check('the page is Send money', (await text(p, '.page-header h1')) === 'Send money', await text(p, '.page-header h1'))
const people = await p.locator('.sheet-row').count()
check('the people are listed, with no sheet over them yet', people > 0 && (await p.locator('.sheet').count()) === 0,
  `${people} people`)
check('the first says what last passed between you',
  /\$[\d,.]+/.test(await text(p, '.sheet-row small')), await text(p, '.sheet-row small'))
await p.screenshot({ path: shot('p24-send-who.png') })

await p.locator('.sheet-row', { hasText: 'Tunde Bakare' }).first().click()
await p.waitForTimeout(220)
const at = decodeURIComponent(p.url().split('#')[1])
check('tapping Tunde puts him in the address', at.includes('to=Tunde Bakare'), at)
check('and opens the composer with him in it',
  (await text(p, '.sheet-head h2')) === 'Send money' && /Tunde Bakare/.test(await text(p, '.sheet .sheet-row')),
  `${await text(p, '.sheet-head h2')}, ${await text(p, '.sheet .sheet-row .t-body-strong')}`)
await p.screenshot({ path: shot('p25-send-amount.png') })

await p.goBack(); await p.waitForTimeout(220)
check('back closes the composer and leaves the list', (await p.locator('.sheet').count()) === 0,
  `${await p.locator('.sheet').count()} sheets`)

// and it still completes
await p.locator('.sheet-row', { hasText: 'Adaeze' }).first().click()
await p.waitForTimeout(200)
await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(600)
check('the button leads to a review', (await text(p, '.sheet-head h2')) === 'Review', await text(p, '.sheet-head h2'))
await p.locator('.sheet .btn-primary').click()
await p.waitForTimeout(600)
check('and the review to Sent', (await text(p, '.sheet .t-title')) === 'Sent', await text(p, '.sheet .t-title'))

// desktop: the list is a page, and picking somebody is a composer page
const d = await b.newPage({ viewport: { width: 1440, height: 1024 } })
await seen(d)
d.on('pageerror', (e) => errs.push('desktop pageerror: ' + e.message))
console.log('\nDESKTOP  /send/tokkenly')
await d.goto(B + '/send/tokkenly', { waitUntil: 'networkidle' })
await d.waitForTimeout(200)
check('the people are listed', (await d.locator('.sheet-row').count()) > 0, `${await d.locator('.sheet-row').count()}`)
check('with a search over them for anyone not in view',
  (await d.locator('input[placeholder="Search a name"]').count()) === 1)
// With a destination, because a bare /send is the question rather than the
// composer since 11g.38.
await d.goto(B + '/send?to=Tunde%20Bakare', { waitUntil: 'networkidle' })
await d.waitForTimeout(300)
check('/send?to= is a composer on the page, not a dialog',
  (await d.locator('.card .amount-box').count()) === 1 && (await d.locator('.scrim').count()) === 0)
check('paying the person in the address', (await text(d, '.col-compose .sheet-row .t-body-strong')) === 'Tunde Bakare',
  await text(d, '.col-compose .sheet-row .t-body-strong'))

check('no page errors', !errs.length, errs.join(' | '))
await teardown(b)
