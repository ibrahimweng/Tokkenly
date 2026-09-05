import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout } from '../components/bits'
import { find, type Instrument } from '../catalogue'
import { barChart, type Range } from '../components/chart'
import { state, actions, holding, inBucket } from '../state'
import { usd, pct, signed } from '../format'
import { go } from '../router'
import { toast } from '../components/sheet'

/** The same chart Home draws, with the company's own year behind it. The
 *  ranges are anchored to the twelve months the catalogue already states, so
 *  1Y ends at the price on screen and starts where the year low implies. */
function priceChart(c: Instrument): HTMLElement {
  const yearPct = ((c.price - c.yearLow) / c.yearLow) * 100
  const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
  const date = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' })
  const ranges: Range[] = [
    { key: '1D', days: 1, pct: c.dayPct, vol: 0.3, fmt: time, over: 'today' },
    { key: '1M', days: 30, pct: c.dayPct * 3.4, vol: 0.25, fmt: date },
    { key: '3M', days: 91, pct: yearPct * 0.31, vol: 0.22, fmt: date },
    { key: '1Y', days: 365, pct: yearPct, vol: 0.18, fmt: month },
  ]
  return barChart({
    ranges, initial: '1Y', height: 220,
    title: c.ticker + ' over time',
    endValue: c.price,
    seed: c.ticker.charCodeAt(0) * 31,
  })
}

/** Buying now and deciding later are different intents, so they are different
 *  buttons. This one puts a default amount against the company and leaves it
 *  for the bucket; the amount is editable there. */
function bucketAdd(c: Instrument): HTMLElement {
  const already = inBucket(c.ticker)
  return h('button', {
    class: 'btn btn-secondary btn-sm',
    text: already ? 'In your bucket · ' + usd(already.dollars, false) : 'Add to bucket',
    on: {
      click: () => {
        if (already) { go('/bucket'); return }
        actions.addToBucket(c.ticker, state.prefs.tradeDefault)
        toast(`${usd(state.prefs.tradeDefault, false)} of ${c.name} is in your bucket`, 'success')
        go('/market/' + c.ticker.toLowerCase())
      },
    },
  })
}

export function stockScreen(ticker: string): HTMLElement {
  const c = find(ticker)
  if (!c) {
    return shell('market', pageHeader('Not found'),
      h('p', { class: 'muted', text: 'No such company. Go back to Market and search for it.' }),
      h('button', { class: 'btn btn-secondary btn-sm', text: 'Back to Market', on: { click: () => go('/market') } }))
  }
  const held = holding(c.ticker)
  const watching = state.watchlist.includes(c.ticker)

  const follow = h('button', {
    class: watching ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm',
    text: watching ? 'Following' : 'Follow',
    on: {
      click: () => {
        actions.toggleWatch(c.ticker)
        toast(watching ? c.ticker + ' removed from your watchlist' : c.ticker + ' added to your watchlist')
      },
    },
  })

  return shell(
    'market',
    pageHeader(c.name,
      h('div', { class: 'chip-row' }, follow, bucketAdd(c),
        h('button', { class: 'btn btn-primary btn-sm', text: 'Buy ' + c.ticker,
          on: { click: () => go('/market/' + c.ticker.toLowerCase() + '/invest') } }))),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          h('div', { class: 'card-head' },
            h('div', { class: 'stack-8' },
              h('span', { class: 't-caps subtle', text: 'Price' }),
              h('span', { class: 't-display-xl', text: usd(c.price) })),
            h('span', { class: c.dayPct >= 0 ? 'chip pos' : 'chip',
              text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) + ' today' })),
          priceChart(c)
        ),
        card(
          cardHead('Growth and valuation'),
          kv('Market value', c.cap),
          kv('Price to earnings', String(c.pe)),
          kv('Dividend', pct(c.dividend, 2) + ' a year'),
          kv('Year low', usd(c.yearLow)),
          kv('Year high', usd(c.yearHigh))
        ),
        card(
          cardHead('News'),
          h('div', { class: 'stack-12' },
            ...[
              [c.name + ' beats expectations for the quarter', '2 hours ago · Reuters'],
              ['Analysts raise the twelve month target', 'Yesterday · Bloomberg'],
              ['What the new product line means for margins', '3 days ago · FT'],
            ].map(([t, s]) => h('div', { class: 'two-line' },
              h('span', { class: 't-body-strong', text: t }),
              h('small', { text: s }))))
        )),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('What this is'),
          h('span', { class: 'muted', text: c.plain }),
          callout('A tokenised share tracks the real one and trades every day of the week, including weekends.')
        ),
        card(
          cardHead('Your position'),
          held && held.shares > 0
            ? h('div', { class: 'stack-12' },
                kv('You hold', held.shares.toFixed(2) + ' shares'),
                kv('Worth', usd(held.shares * c.price)),
                kv('Today', h('span', { class: c.dayPct >= 0 ? 'pos t-body-strong' : 't-body-strong',
                  text: signed((held.shares * c.price * c.dayPct) / 100) })))
            : h('span', { class: 'muted', text: 'You do not own any yet.' }),
          h('button', { class: 'btn btn-primary', text: 'Buy ' + c.ticker,
            on: { click: () => go('/market/' + c.ticker.toLowerCase() + '/invest') } }),
          held && held.shares > 0
            ? h('button', { class: 'btn btn-secondary', text: 'Sell ' + c.ticker,
                on: { click: () => go('/market/' + c.ticker.toLowerCase() + '/sell') } })
            : null
        )))
  )
}
