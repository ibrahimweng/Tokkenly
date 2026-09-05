/* The parts that behave like a live product rather than a picture of one:
   dialogs that present the way Figma draws them, a chart whose ranges redraw,
   notifications that clear, and a table you can order. */
import { chromium } from 'playwright'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (label, pass, detail = '') =>
  console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`)
const page = async (w = 1440, h = 1024) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  p.on('pageerror', (e) => errs.push(String(e)))
  return p
}

console.log('DIALOGS  Figma draws D09 Send and D12 Receive over the wallet')
for (const [route, title] of [['/send', 'Send money'], ['/receive', 'Receive money']]) {
  const p = await page()
  await p.goto(B + route, { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
  const d = await p.evaluate(() => {
    const s = document.querySelector('.scrim > .sheet')
    return { w: s ? Math.round(s.getBoundingClientRect().width) : 0,
             title: s?.querySelector('h2')?.textContent,
             behind: document.querySelector('.content .page-header h1')?.textContent,
             sidebar: getComputedStyle(document.querySelector('.sidebar')).display !== 'none' }
  })
  ok(`${route} is a 480 dialog over the wallet`,
     d.w === 480 && d.title === title && d.behind === 'Wallet' && d.sidebar, JSON.stringify(d))
  await p.keyboard.press('Escape'); await p.waitForTimeout(200)
  ok(`${route} closes to the wallet`, p.url().endsWith('#/wallet'), new URL(p.url()).hash)
  await p.close()
}
{ // and still a bottom sheet on a phone
  const p = await page(390, 844)
  await p.goto(B + '/send?to=Tunde%20Bakare', { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
  const grabber = await p.locator('.sheet .grabber').count()
  const keypad = await p.locator('.sheet .keypad').count()
  ok('the phone still gets a sheet with a grabber and a keypad', grabber === 1 && keypad === 1)
  await p.close()
}
{ // changing the recipient without leaving
  const p = await page()
  await p.goto(B + '/send', { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
  await p.locator('.sheet-row').first().click(); await p.waitForTimeout(250)
  const listed = await p.locator('.sheet-row').count()
  await p.locator('.sheet-row').nth(1).click(); await p.waitForTimeout(250)
  const to = await p.locator('.sheet .t-body-strong').first().textContent()
  ok('Change opens the list and picks a new recipient', listed >= 4 && !!to, `${listed} listed, now ${to}`)
  await p.close()
}

console.log('CHART  a range that redraws nothing is a button that lies')
{
  const p = await page()
  await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
  const read = () => p.evaluate(() => {
    const chart = document.querySelector('.bars')?.closest('.card')
    return {
      bars: chart?.querySelectorAll('.bars > *').length,
      on: chart?.querySelector('.chip[aria-pressed="true"]')?.textContent,
      delta: chart?.querySelector('.t-caption')?.textContent?.slice(0, 40),
    }
  })
  const y = await read()
  const chartChip = (t) => p.locator('.bars').locator('xpath=ancestor::*[contains(@class,"card")][1]')
    .locator('.chip', { hasText: t }).first()
  await chartChip('1M').click(); await p.waitForTimeout(250)
  const m = await read()
  await chartChip('ALL').click(); await p.waitForTimeout(250)
  const a = await read()
  ok('each range draws its own columns', y.bars !== m.bars && m.bars !== a.bars,
     `1Y ${y.bars}, 1M ${m.bars}, ALL ${a.bars}`)
  ok('the pressed chip follows', m.on === '1M' && a.on === 'ALL', `${m.on} then ${a.on}`)
  ok('and the change is read off the range', y.delta !== m.delta, m.delta ?? '')
  await p.close()
}

console.log('NOTIFICATIONS  a count that does not go down is decoration')
{
  const p = await page()
  await p.goto(B + '/', { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
  const start = await p.locator('.bell .dot').textContent()
  await p.locator('.bell').click(); await p.waitForTimeout(250)
  const rows = await p.locator('.sheet-row').count()
  await p.locator('.sheet-row:not(.read)').first().click(); await p.waitForTimeout(250)
  const after = await p.locator('.bell .dot').textContent()
  ok('reading one drops the count', Number(after) === Number(start) - 1, `${start} then ${after}`)
  await p.locator('.link', { hasText: 'Mark all read' }).click(); await p.waitForTimeout(250)
  ok('mark all read clears the badge', (await p.locator('.bell .dot').count()) === 0)
  ok('and the panel says so', (await p.locator('.sheet .muted').first().textContent()) === 'All caught up')
  await p.close()
}

console.log('SORTING  ordering is part of the address')
{
  const p = await page()
  const first = () => p.locator('tbody tr').first().textContent()
  await p.goto(B + '/history', { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
  const n = await p.locator('tbody tr').count()
  const byDate = await first()
  await p.locator('.th-sort', { hasText: 'Amount' }).click(); await p.waitForTimeout(250)
  const desc = await first()
  await p.locator('.th-sort', { hasText: 'Amount' }).click(); await p.waitForTimeout(250)
  const asc = await first()
  ok('history has something to sort', n >= 20, `${n} rows`)
  ok('sorting by amount reorders', byDate !== desc && desc !== asc)
  ok('the direction is in the url', p.url().includes('sort=amt&dir=asc'), new URL(p.url()).hash)
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(250)
  ok('and it survives a reload', (await first()) === asc)
  await p.close()
}

console.log('MOVING AROUND  four navigators, one registry')
{
  const p = await page(1600, 1000)
  await p.goto(B + '/convert', { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
  const crumbs = (await p.locator('.crumb').allTextContents()).join(' > ')
  ok('a trail says where you are', crumbs === 'Wallet > Convert to naira', crumbs)
  await p.locator('.crumb').first().click(); await p.waitForTimeout(250)
  ok('and the trail steps back up', p.url().endsWith('#/wallet'), new URL(p.url()).hash)

  await p.goto(B + '/convert', { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
  const tabs = await p.locator('.place-tab').allTextContents()
  ok('the place shows its screens as tabs', tabs.length === 6, tabs.join(' | '))
  ok('and lights the one you are on',
     (await p.locator('.place-tab[aria-current="page"]').textContent()) === 'Convert to naira')

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
  ok('arrows and enter go there', p.url().includes('/market/aapl'), new URL(p.url()).hash)

  await p.goto(B + '/all', { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
  const groups = await p.locator('.all-grid .card').count()
  const rows = await p.locator('.all-row').count()
  ok('the index lists every destination', groups === 6 && rows >= 24, `${groups} groups, ${rows} rows`)
  await p.close()
}

console.log('WIDTH  the middle is drawn in a 1200 column, whatever the monitor')
{
  for (const w of [1440, 2000, 2560]) {
    const p = await page(w, 1000)
    await p.goto(B + '/convert', { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
    const m = await p.evaluate(() => {
      const g = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().width) : null }
      return { content: g('.content'), side: g('.stack.grow') }
    })
    ok(`${w}px keeps the column at 1200`, m.content === 1200, `content ${m.content}, side card ${m.side}`)
    await p.close()
  }
}

console.log('\nERRORS: ' + (errs.length ? errs.join(' | ') : 'none'))
await b.close()
