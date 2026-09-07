/* The parts that behave like a live product rather than a picture of one:
   dialogs that present the way Figma draws them, a chart whose ranges redraw,
   notifications that clear, and a table you can order. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (label, pass, detail = '') =>
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
const page = async (w = 1440, h = 1024) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await seen(p, { homeView: 'detailed' })
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(8000)
  // the webfont host is unreachable from here, and networkidle waits for it
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return p
}

console.log('COMPOSING IS A SCREEN  every way of moving money, the same way')
for (const [route, title] of [
  ['/send?to=Tunde%20Bakare', 'Send money'], ['/receive', 'Receive money'],
  ['/addmoney', 'Add money'], ['/withdraw', 'Withdraw to your bank'],
  ['/invest/aapl/invest', 'Invest'], ['/grow/borrow', 'Borrow'],
  ['/grow/earn', 'Lend'], ['/grow/repay', 'Repay'],
]) {
  const p = await page()
  await p.goto(B + route, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(250)
  const d = await p.evaluate(() => ({
    dialog: !!document.querySelector('.scrim > .sheet'),
    h1: document.querySelector('.content .page-header h1')?.textContent,
    trail: !!document.querySelector('.crumbs'),
  }))
  // Send and Receive were dialogs over the wallet and the other six were
  // screens, which meant the one composer that most needs a list beside it had
  // nowhere to put one. One rule now: composing is a place, committing is a
  // dialog over the place.
  ok(`${route} is a screen of its own`,
     !d.dialog && d.h1 === title && d.trail, JSON.stringify(d))
  await p.close()
}
{ // and still a bottom sheet on a phone
  const p = await page(390, 844)
  await p.goto(B + '/send?to=Tunde%20Bakare', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200)
  const grabber = await p.locator('.sheet .grabber').count()
  const keypad = await p.locator('.sheet .keypad').count()
  ok('the phone still gets a sheet with a grabber and a keypad', grabber === 1 && keypad === 1)
  await p.close()
}
{ // changing the recipient without leaving the screen
  const p = await page()
  await p.goto(B + '/send?to=Tunde%20Bakare', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(250)
  const people = p.locator('.stack.grow .sheet-row')
  const listed = await people.count()
  const before = await p.locator('.col-compose .sheet-row .t-body-strong').first().textContent()
  await people.nth(0).click(); await p.waitForTimeout(300)
  const after = await p.locator('.col-compose .sheet-row .t-body-strong').first().textContent()
  // The list is the column beside the amount, not a dialog opened from a
  // Change link that opened from a dialog.
  ok('the column beside it picks who you are paying',
     listed >= 4 && !!after && after !== before, `${listed} listed, ${before} → ${after}`)
  await p.close()
}

console.log('CHART  a range that redraws nothing is a button that lies')
{
  const p = await page()
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200)
  const read = () => p.evaluate(() => {
    const chart = document.querySelector('.ch-bars')?.closest('.card')
    return {
      bars: chart?.querySelectorAll('.ch-candle').length,
      // the bar count follows the width now, so what has to change with the
      // range is the scale, the dates and the figure — not how many marks
      ticks: [...chart.querySelectorAll('.ch-tick')].map((e) => e.textContent).join(' '),
      axis: [...chart.querySelectorAll('.ch-axis span')].map((e) => e.textContent).join(' '),
      on: chart?.querySelector('.chip[aria-pressed="true"]')?.textContent,
      delta: chart?.querySelector('.t-caption')?.textContent?.slice(0, 40),
    }
  })
  const y = await read()
  const chartChip = (t) => p.locator('.ch-bars').locator('xpath=ancestor::*[contains(@class,"card")][1]')
    .locator('.chip', { hasText: t }).first()
  await chartChip('1M').click(); await p.waitForTimeout(300)
  const m = await read()
  await chartChip('ALL').click(); await p.waitForTimeout(300)
  const a = await read()
  ok('every bar has a value axis behind it', y.ticks.length > 0 && y.ticks.includes('$'), y.ticks)
  ok('the axis rescales to the range', y.ticks !== m.ticks && m.ticks !== a.ticks,
     `1Y ${y.ticks} | 1M ${m.ticks}`)
  ok('the dates under it follow too', y.axis !== m.axis, `1Y ${y.axis}`)
  ok('the pressed chip follows', m.on === '1M' && a.on === 'ALL', `${m.on} then ${a.on}`)
  ok('and the change is read off the range', y.delta !== m.delta, m.delta ?? '')

  // the hover, which the comb never had
  const box = await p.locator('.ch-bars').boundingBox()
  await p.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.6)
  await p.waitForTimeout(200)
  const tip = await p.evaluate(() => {
    const t = document.querySelector('.ch-tip')
    if (t.hidden) return null
    // Candles light the one you are on; a line moves a cursor to it. Either
    // way exactly one thing on the plot marks where the pointer is.
    const cursor = document.querySelector('.ch-cursor')
    return {
      text: t.innerText.replace(/\n/g, ' '),
      marked: document.querySelectorAll('.ch-candle.on').length + (cursor && !cursor.hidden ? 1 : 0),
    }
  })
  ok('pointing at a point says what it was worth', !!tip && tip.marked === 1, tip ? tip.text : 'no tooltip')
  await p.close()
}

console.log('NOTIFICATIONS  a count that does not go down is decoration')
{
  const p = await page()
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200)
  const start = await p.locator('.bell .dot').textContent()
  await p.locator('.bell').click(); await p.waitForTimeout(400)
  // No longer a panel over Home: the bell is a way to a section of Activity,
  // and the count moves from the bell to the chip that opens it.
  ok('the bell is a way to somewhere, not a panel',
     (await p.evaluate(() => location.hash)) === '#/activity?filter=alerts' &&
     (await p.locator('.scrim').count()) === 0, await p.evaluate(() => location.hash))
  ok('the chip carries the count',
     (await p.locator('.chip-count').textContent()) === start, start)
  // Reading one opens what it is about, which is the point of the row.
  await p.locator('.set-row.alert:not(.read)').first().click(); await p.waitForTimeout(500)
  ok('and a row goes to the thing it is about',
     (await p.evaluate(() => location.hash)).includes('sheet=receipt'),
     await p.evaluate(() => location.hash))
  await p.keyboard.press('Escape'); await p.waitForTimeout(350)
  const after = await p.locator('.chip-count').textContent()
  ok('reading one drops the count', Number(after) === Number(start) - 1, `${start} then ${after}`)
  await p.locator('.link', { hasText: 'Mark all read' }).click(); await p.waitForTimeout(300)
  ok('mark all read clears it', (await p.locator('.chip-count').count()) === 0)
  ok('and the section says so',
     /All caught up/.test(await p.evaluate(() => document.querySelector('.card-head')?.innerText ?? '')))
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(250)
  ok('and the bell agrees', (await p.locator('.bell .dot').count()) === 0)
  await p.close()
}

console.log('SORTING  ordering is part of the address')
{
  const p = await page()
  const first = () => p.locator('tbody tr').first().textContent()
  await p.goto(B + '/activity', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200)
  const n = await p.locator('tbody tr').count()
  const byDate = await first()
  await p.locator('.th-sort', { hasText: 'Amount' }).click(); await p.waitForTimeout(250)
  const desc = await first()
  await p.locator('.th-sort', { hasText: 'Amount' }).click(); await p.waitForTimeout(250)
  const asc = await first()
  ok('history has something to sort', n >= 20, `${n} rows`)
  ok('sorting by amount reorders', byDate !== desc && desc !== asc)
  ok('the direction is in the url', p.url().includes('sort=amt&dir=asc'), new URL(p.url()).hash)
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(250)
  ok('and it survives a reload', (await first()) === asc)
  await p.close()
}

console.log('MOVING AROUND  four navigators, one registry')
{
  const p = await page(1600, 1000)
  await p.goto(B + '/withdraw', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(250)
  const crumbs = (await p.locator('.crumb').allTextContents()).join(' > ')
  ok('a trail says where you are', crumbs === 'Transfer > Withdraw to your bank', crumbs)
  await p.locator('.crumb').first().click(); await p.waitForTimeout(250)
  ok('and the trail steps back up', p.url().endsWith('#/transfer'), new URL(p.url()).hash)

  await p.goto(B + '/withdraw', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200)
  ok('and nothing repeats the sidebar under the title',
     (await p.locator('.place-tab').count()) === 0)

  await p.keyboard.press('Meta+k'); await p.waitForTimeout(300)
  ok('cmd K opens the palette', (await p.locator('.jump').count()) === 1)
  const find = async (q) => {
    await p.locator('.jump-field input').fill(q); await p.waitForTimeout(220)
    return (await p.locator('.jump-hit .t-body-strong').allTextContents())
  }
  ok('it finds an action', (await find('borr')).includes('Borrow'))
  ok('it finds a person', (await find('adaeze')).includes('Adaeze Okonkwo'))
  ok('it finds a receipt', (await find('TKN-8F2K90')).includes('TKN-8F2K90'))
  ok('it finds something you hold', (await find('nvidia')).some((x) => /Nvidia/.test(x)))
  await find('apple')
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await p.waitForTimeout(350)
  ok('arrows and enter go there', p.url().includes('/invest/aapl'), new URL(p.url()).hash)

  await p.goto(B + '/all', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(250)
  const groups = await p.locator('.all-grid .card').count()
  const rows = await p.locator('.all-row').count()
  ok('the index lists every destination', groups === 6 && rows >= 24, `${groups} groups, ${rows} rows`)
  await p.close()
}

console.log('MOVING AROUND, on a phone')
{
  const p = await page(390, 844)
  await p.goto(B + '/transfer', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(250)
  const t = await p.evaluate(() => ({
    tabs: document.querySelectorAll('.place-tab').length,
    overflowX: Math.max(0, document.documentElement.scrollWidth - 390),
  }))
  ok('the rail is the only place navigation, and nothing overflows',
     t.tabs === 0 && t.overflowX === 0, JSON.stringify(t))

  // the magnifier used to open History, which is not what a magnifier means
  await p.locator('.topbar .icon-btn').first().click(); await p.waitForTimeout(350)
  ok('the search icon opens the palette', (await p.locator('.jump').count()) === 1)
  const box = await p.evaluate(() => {
    const r = document.querySelector('.jump').getBoundingClientRect()
    return { w: Math.round(r.width), bottom: Math.round(r.bottom) }
  })
  ok('and it arrives from the bottom, full width', box.w === 390 && box.bottom === 844, JSON.stringify(box))
  ok('with the keyboard hints hidden', (await p.locator('.jump-foot').isVisible().catch(() => false)) === false)
  await p.locator('.jump-field input').fill('borr'); await p.waitForTimeout(250)
  await p.locator('.jump-hit').first().click(); await p.waitForTimeout(350)
  ok('and tapping a hit goes there', p.url().includes('/grow'), new URL(p.url()).hash)
  await p.close()
}

console.log('A BASE UNDER A DIALOG IS NOT WHERE YOU ARE')
{
  for (const [w, route, wants] of [
    [1600, '/withdraw', true], [1600, '/send', true], [1600, '/receive', true],
    [390, '/withdraw', false],
  ]) {
    const p = await page(w, w === 390 ? 844 : 1000)
    await p.goto(B + route, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(220)
    const has = await p.evaluate(() => !!document.querySelector('.crumbs'))
    ok(`${w}px ${route} ${wants ? 'keeps' : 'drops'} its trail`, has === wants)
    await p.close()
  }
}

console.log('WIDTH  the middle is drawn in a 1200 column, whatever the monitor')
{
  for (const w of [1440, 2000, 2560]) {
    const p = await page(w, 1000)
    await p.goto(B + '/withdraw', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(200)
    const m = await p.evaluate(() => {
      const g = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().width) : null }
      return { content: g('.content'), side: g('.stack.grow') }
    })
    ok(`${w}px keeps the column at 1200`, m.content === 1200, `content ${m.content}, side card ${m.side}`)
    await p.close()
  }
}

console.log('THE DOT FIELDS  decoration that has been given something to say')
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } })
  await seen(p, { homeView: 'simple' })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  const read = async () => {
    await p.goto(B + '/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(600)
    return p.evaluate(() => [...document.querySelectorAll('.gate')].map((g) => {
      let awake = 0, asleep = 0
      for (const c of g.querySelectorAll('circle')) {
        if (/dot-sleep/.test(c.getAttribute('fill') ?? '')) asleep += 1
        else awake += 1
      }
      return { says: g.querySelector('.gate-reads')?.textContent ?? '', awake, asleep }
    }))
  }
  const before = await read()
  ok('all three doors carry a field', before.length === 3)
  // The three slices of one portfolio, one door each, so no two of them can
  // be the same picture on an account with its money in more than one place.
  ok('and each one says which slice it is keyed to',
     before.every((g) => /% of your money (in|lent)/.test(g.says)), before.map((g) => g.says).join(' | '))
  ok('no two are at the same level',
     new Set(before.map((g) => g.awake)).size === 3, before.map((g) => g.awake + '/' + (g.awake + g.asleep)).join(' '))
  // A gauge that does not move is a picture. $1,000 out of cash and lent out
  // has to show up on the two doors it is about, and not on the third.
  await p.goto(B + '/grow/earn', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(500)
  const amt = p.locator('.amount-box input')
  await amt.fill('1000'); await amt.dispatchEvent('input'); await p.waitForTimeout(250)
  await p.locator('.btn-primary').first().click(); await p.waitForTimeout(500)
  await p.locator('.scrim .btn-primary').first().click(); await p.waitForTimeout(1000)
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  const after = await read()
  ok('moving money wakes one field and quiets another',
     after[1].awake < before[1].awake && after[2].awake > before[2].awake,
     before.map((g, i) => `${g.awake}\u2192${after[i].awake}`).join(' '))
  ok('and leaves the one it is not about alone', after[0].awake === before[0].awake)
  ok('the words follow the field', after[2].says !== before[2].says,
     `${before[2].says} \u2192 ${after[2].says}`)
  // No account, no reading: the intro shows the field exactly as it is drawn.
  const w = await b.newPage({ viewport: { width: 1440, height: 900 } })
  await w.addInitScript(`try { localStorage.removeItem('tokkenly.prefs.v1'); sessionStorage.setItem('tokkenly.unlocked','1') } catch {}`)
  await w.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  await w.goto(B + '/welcome/0', { waitUntil: 'domcontentloaded' }); await w.waitForTimeout(600)
  ok('the intro shows the field as composed, with nothing asleep in it',
     (await w.evaluate(() => [...document.querySelectorAll('.welcome-art circle')]
       .filter((c) => /dot-sleep/.test(c.getAttribute('fill') ?? '')).length)) === 0)
  await w.close()
  await p.close()
}

console.log('\nERRORS: ' + (errs.length ? errs.join(' | ') : 'none'))
await b.close()
