/* The groupings on Invest, opened out.

   Invest ended in three cards of three, four and however-many rows, with no
   way to see the rest and nothing to do from them but leave. Each is now a
   screen, and this suite holds what makes each one worth its address.

   The claim under test is that these are not the market table three more
   times. Where people start carries reasons and separates what is paused from
   what can be bought today; the watchlist can stop following without opening
   thirteen company pages; movers splits up from down, because "moving" without
   a direction is two questions in one list. And Popular is deliberately not
   among them — it is a chip on Invest that filters an uncapped table, so a
   screen for it would be that list at a second address. */
import { chromium } from 'playwright'
import { seen } from './seen.mjs'

const B = 'http://localhost:4173/#'
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const ok = (l, pass, d = '') => console.log(`  ${pass ? 'ok  ' : 'FAIL'}  ${l}${d ? '  ' + d : ''}`)
const page = async (w = 1280, h = 1100) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await seen(p)
  p.on('pageerror', (e) => errs.push(String(e)))
  p.setDefaultTimeout(6000)
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  return p
}
const hash = (p) => p.evaluate(() => location.hash)

console.log('THE WAY IN  the cards keep their rows and gain a door')
{
  const p = await page()
  await p.goto(B + '/invest', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const cards = await p.evaluate(() => [...document.querySelectorAll('section.card')]
    .filter((c) => /Where people start|Your watchlist|Moving today/.test(c.textContent))
    .map((c) => ({
      link: !!c.querySelector('.card-head a, .card-head button'),
      rows: c.querySelectorAll('.kv, .start-row').length,
    })))
  // Both halves matter. A card that loses its rows to a screen makes Invest
  // worse to scan; a card with no way through leaves the screen unreachable.
  ok('all three still show rows', cards.length === 3 && cards.every((c) => c.rows > 0),
     JSON.stringify(cards))
  ok('and all three now lead somewhere', cards.every((c) => c.link))
  await p.close()
}

console.log('THE THREE SCREENS  each with a reason to exist')
{
  const p = await page()
  for (const [key, title] of [
    ['starters', 'Where people start'], ['watchlist', 'Your watchlist'], ['movers', 'Moving today'],
  ]) {
    await p.goto(B + '/invest/list/' + key, { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(500)
    const m = await p.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim(),
      trail: [...document.querySelectorAll('.crumbs .crumb')].map((e) => e.textContent.trim()).join(' > '),
      tabs: [...document.querySelectorAll('.pager-tab')].map((e) => e.textContent.trim()).join('|'),
      lit: document.querySelector('.pager-tab.on')?.textContent?.trim(),
      rows: document.querySelectorAll('.table tbody tr, .start-row').length,
      over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }))
    ok(key + ' has its own name and trail', m.h1 === title && m.trail === 'Invest > ' + title,
       JSON.stringify(m))
    ok('  and the strip names all four groupings',
       m.tabs === 'Popular|Where people start|Your watchlist|Moving today', m.tabs)
    ok('  with this one lit', m.lit === title, m.lit)
    ok('  and something on it', m.rows > 0, m.rows + ' rows')
    ok('  and no sideways scroll', m.over === 0, 'overflowX ' + m.over)
  }
  await p.close()
}

console.log('THE PAGER  and the one that is not a screen')
{
  const p = await page()
  await p.goto(B + '/invest/list/starters', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  await p.locator('.pager-step').last().click(); await p.waitForTimeout(420)
  ok('Next walks the set', (await hash(p)) === '#/invest/list/watchlist', await hash(p))
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(420)
  ok('and so do the arrow keys', (await hash(p)) === '#/invest/list/movers', await hash(p))
  // Popular has no screen on purpose: the market table is not capped, so a
  // screen for it would be the same list at a second address.
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(450)
  ok('and Popular in the set is the chip on Invest, not a fourth screen',
     (await hash(p)) === '#/invest?cat=Popular', await hash(p))
  ok('which lands on the market table with that filter on',
     await p.evaluate(() => /POPULAR/i.test(document.querySelector('.card-head')?.textContent ?? '')))
  await p.close()
}

console.log('WHERE PEOPLE START  reasons, and what is paused')
{
  const p = await page()
  await p.goto(B + '/invest/list/starters', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const st = await p.evaluate(() => {
    const put = [...document.querySelectorAll('section.card')]
      .find((c) => /THE THREE WE PUT FORWARD/i.test(c.textContent))
    return {
      picks: [...put.querySelectorAll('.start-row')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
      plus: put.querySelectorAll('.start-row .icon-btn').length,
      // "In the launch set" is not "you can buy it this afternoon". A first
      // buy should not land on a company operations has switched off, so the
      // screen separates the two rather than blurring them.
      // Case-insensitively: `innerText` applies text-transform, and a pill in
      // this product is uppercase, so a case-sensitive read of it finds
      // nothing whether the card is there or not.
      paused: /paused right now/i.test(document.body.innerText),
      cost: /0\.5% of what you put in/i.test(document.body.innerText),
    }
  })
  ok('three picks, each with the reason it is one', st.picks.length === 3
     && st.picks.every((t) => t.length > 24), st.picks.map((t) => t.slice(0, 30)).join(' | '))
  ok('and each can go in the bucket from here', st.plus === 3, st.plus)
  ok('a company in the set but switched off is named, not offered', st.paused)
  ok('and the screen says what buying costs before it asks anything', st.cost)
  await p.locator('.start-row').first().click(); await p.waitForTimeout(500)
  ok('pressing a pick opens it', (await hash(p)).startsWith('#/invest/aapl'), await hash(p))
  await p.close()
}

console.log('MOVING TODAY  up and down are two questions')
{
  const p = await page()
  await p.goto(B + '/invest/list/movers', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const m = await p.evaluate(() => {
    const heads = [...document.querySelectorAll('.card-head')].map((e) => e.textContent.replace(/\s+/g, ' ').trim())
    const up = [...document.querySelectorAll('section.card')].find((c) => /^Up today/i.test(c.querySelector('.card-head')?.textContent ?? ''))
    const down = [...document.querySelectorAll('section.card')].find((c) => /^Down today/i.test(c.querySelector('.card-head')?.textContent ?? ''))
    const signs = (card) => [...card.querySelectorAll('.table tbody tr')]
      .map((r) => r.children[2].textContent.trim()[0])
    return { heads, widest: heads.some((t) => /widest move/i.test(t)),
             ups: up ? signs(up) : [], downs: down ? signs(down) : [] }
  })
  ok('it leads with the widest move of the day', m.widest, m.heads[0])
  ok('and splits up from down', m.ups.length > 0 && m.downs.length > 0,
     m.ups.length + ' up, ' + m.downs.length + ' down')
  // The split has to actually hold, or the two headings are decoration.
  ok('and everything in each is really going that way',
     m.ups.every((s) => s === '+') && m.downs.every((s) => s === '−'),
     m.ups.join('') + ' / ' + m.downs.join(''))
  await p.close()
}

console.log('YOUR WATCHLIST  the thing the card could not do')
{
  const p = await page()
  await p.goto(B + '/invest/list/watchlist', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(500)
  const before = await p.evaluate(() => document.querySelectorAll('.table tbody tr').length)
  ok('it lists what you follow', before > 0, before + ' rows')
  await p.locator('.row-acts .icon-btn').last().click()
  await p.waitForTimeout(700)
  const after = await p.evaluate(() => document.querySelectorAll('.table tbody tr').length)
  ok('and you can stop following from the list itself', after === before - 1,
     before + ' -> ' + after)
  // Emptied, it has to say what following is for rather than showing a blank.
  // The watchlist is not persisted, so it is emptied the way a person would:
  // by pressing the control this screen exists to give them.
  for (let i = 0; i < 12; i++) {
    const left = await p.locator('.row-acts .icon-btn').count()
    if (!left) break
    await p.locator('.row-acts .icon-btn').last().click()
    await p.waitForTimeout(350)
  }
  const empty = await p.evaluate(() => ({
    rows: document.querySelectorAll('.table tbody tr').length,
    said: /not following anything yet/i.test(document.body.innerText),
    way: [...document.querySelectorAll('main button')].some((e) => /Go to Invest/.test(e.textContent)),
  }))
  ok('unfollowing everything empties it', empty.rows === 0, empty.rows + ' rows left')
  ok('and it then says what following is for', empty.said)
  ok('with a way on', empty.way)
  await p.close()
}

console.log('PHONE')
{
  // 360 as well as 390. Both of this batch's faults were invisible at 390 on
  // one screen and plain at 360 on all three, and the narrow phone is the one
  // that finds them.
  for (const w of [390, 360]) {
    const p = await page(w, 844)
    // The watchlist is not persisted, so it is filled the way a person fills
    // it — by following companies — and never by reaching into storage.
    await p.goto(B + '/invest', { waitUntil: 'domcontentloaded' })
    await p.waitForTimeout(450)
    for (const t of ['AAPLc', 'NVDAc', 'MSFTc']) {
      await p.evaluate((t) => { location.hash = '/stock/' + t }, t)
      await p.waitForTimeout(300)
      const f = p.locator('button', { hasText: /^Follow$/i }).first()
      if (await f.count()) { await f.click(); await p.waitForTimeout(150) }
    }
    for (const k of ['starters', 'watchlist', 'movers']) {
      await p.evaluate((k) => { location.hash = '/invest/list/' + k }, k)
      await p.waitForTimeout(500)
      const g = await p.evaluate(() => {
        const h1 = document.querySelector('h1')
        const box = document.querySelector('.pager-tabs')
        const on = box.querySelector('.pager-tab.on')
        const a = on.getBoundingClientRect(), b = box.getBoundingClientRect()
        return {
          over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          taps: [...document.querySelectorAll('.pager-tab, .pager-step')]
            .map((e) => Math.round(e.getBoundingClientRect().height)),
          title: h1.scrollWidth <= h1.clientWidth + 1,
          // The tab you are on, whole — see the same check in indices.mjs.
          lit: on.textContent.trim(),
          litWhole: a.left >= b.left - 1 && a.right <= b.right + 1,
          // Nothing on the row may be cut. The company description was in the
          // name cell at every width: about 280px of sentence in a 190px box,
          // so twelve of movers' thirteen rows and all five of the watchlist's
          // ellipsised to an unreadable half. It is desktop-only now, the same
          // as the market's own list.
          cut: [...document.querySelectorAll('.feed-row *')]
            .filter((e) => !e.children.length && e.textContent.trim())
            .filter((e) => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1)
            .map((e) => e.textContent.trim().slice(0, 24)),
        }
      })
      ok(`${w}  ${k} fits the phone`, g.over === 0 && g.title, JSON.stringify({ over: g.over, title: g.title }))
      ok('  and its controls clear 44px', g.taps.every((n) => n >= 44), g.taps.join(','))
      ok('  the strip names the screen you are on', g.litWhole, g.lit)
      ok('  and no row is cut mid-sentence', g.cut.length === 0, g.cut.join(' | '))
    }
    await p.close()
  }
}

console.log('\nerrors:', errs.length ? errs : 'none')
await b.close()
