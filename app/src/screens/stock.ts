import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout } from '../components/bits'
import { find, markGap, type Instrument } from '../catalogue'
import { barChart, type Range } from '../components/chart'
import { state, actions, holding, inBucket, money, MASK } from '../state'
import { usd, pct, signed, shares } from '../format'
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
    // The share behind the token, so the gap reads as a shape over the period
    // rather than only as today's percentage.
    mark: c.mark,
    markLabel: 'Real ' + c.ticker,
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
        go('/invest/' + c.ticker.toLowerCase())
      },
    },
  })
}

/** What you are paying over or under the real share. On a tokenised product
 *  this is the number that decides whether the price on screen is a good one,
 *  and leaving it out is the one omission a trader would call dishonest. */
function markLine(c: Instrument): HTMLElement {
  const g = markGap(c)
  return h('span', { class: 'mark-line' },
    h('span', { class: (g.over ? 'warn' : 'pos') + ' t-body-strong', text: g.pct }),
    h('span', { class: 'muted t-caption',
      text: `${g.word} ${usd(c.mark)}, the real ${c.name} price` }))
}

/** Four windows in a row. One percentage cannot tell a fresh move from a
 *  trend; four can, and they cost a line. */
function timeframes(c: Instrument): HTMLElement {
  // Derived from the day's move so the four agree with each other and with the
  // figure the rest of the product shows.
  const d = c.dayPct
  const of = (share: number) => Math.round(d * share * 100) / 100
  const cells: [string, number][] = [['5m', of(0.04)], ['1h', of(0.12)], ['6h', of(0.5)], ['24h', d]]
  return h('div', { class: 'tf-row' }, ...cells.map(([label, v]) =>
    h('div', { class: 'tf' },
      h('span', { class: 't-caps subtle', text: label }),
      h('span', { class: (v >= 0 ? 'pos' : 'warn') + ' t-body-strong',
        text: (v >= 0 ? '+' : '') + pct(v, 2) }))))
}

/** How much can be bought right now without moving the price, and how many
 *  people are in. A tokenised book is thin; an order that is large against it
 *  fills badly, and that is worth saying before the order rather than after. */
function depthCard(c: Instrument): HTMLElement {
  const thin = c.liquidity < 120000
  return card(
    cardHead('The token itself'),
    kv('Liquidity', usd(c.liquidity, false)),
    kv('24h volume', usd(c.vol24h, false)),
    kv('Holders', c.holders.toLocaleString('en-US') + '  ' +
      (c.holdersPct >= 0 ? '+' : '') + pct(c.holdersPct)),
    h('span', { class: 'muted t-caption',
      text: thin
        ? `Thin. An order much over ${usd(Math.round(c.liquidity * 0.01), false)} will move the price against you.`
        : `Deep enough that an order up to about ${usd(Math.round(c.liquidity * 0.01), false)} fills at the price you see.` }),
    h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'Token address' }),
      h('button', { class: 'addr', on: { click: () => {
        navigator.clipboard?.writeText(c.address).catch(() => {})
        toast('Address copied')
      } } },
        h('span', { class: 'grow', text: c.address.slice(0, 6) + '…' + c.address.slice(-4) }),
        h('span', { class: 'muted', html: icon.copy() }))))
}

export function stockScreen(ticker: string): HTMLElement {
  const c = find(ticker)
  if (!c) {
    return shell('market', pageHeader('Not found'),
      h('p', { class: 'muted', text: 'No such company. Go back to Market and search for it.' }),
      h('button', { class: 'btn btn-secondary btn-sm', text: 'Back to Market', on: { click: () => go('/invest') } }))
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
      h('div', { class: 'chip-row' },
        h('span', { class: 'pill', text: c.kind === 'etf' ? 'ETF' : 'Company' }),
        follow, bucketAdd(c),
        h('button', { class: 'btn btn-primary btn-sm', text: 'Buy ' + c.ticker,
          on: { click: () => go('/invest/' + c.ticker.toLowerCase() + '/invest') } }))),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          h('div', { class: 'card-head' },
            h('div', { class: 'stack-8' },
              h('span', { class: 't-caps subtle', text: 'Token price' }),
              h('span', { class: 't-display-xl', text: usd(c.price) }),
              markLine(c)),
            timeframes(c)),
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
        depthCard(c),
        card(
          cardHead('What this is'),
          h('span', { class: 'muted', text: c.plain }),
          callout('A tokenised share tracks the real one and trades every day of the week, including weekends.')
        ),
        card(
          cardHead('Your position'),
          held && held.shares > 0
            ? h('div', { class: 'stack-12' },
                kv('You hold', state.prefs.hideBalances ? MASK : shares(held.shares) + ' shares'),
                kv('Worth', money(held.shares * c.price)),
                kv('Today', h('span', { class: c.dayPct >= 0 ? 'pos t-body-strong' : 't-body-strong',
                  text: state.prefs.hideBalances
                    ? MASK : signed((held.shares * c.price * c.dayPct) / 100) })))
            : h('span', { class: 'muted', text: 'You do not own any yet.' }),
          h('button', { class: 'btn btn-primary', text: 'Buy ' + c.ticker,
            on: { click: () => go('/invest/' + c.ticker.toLowerCase() + '/invest') } }),
          held && held.shares > 0
            ? h('button', { class: 'btn btn-secondary', text: 'Sell ' + c.ticker,
                on: { click: () => go('/invest/' + c.ticker.toLowerCase() + '/sell') } })
            : null
        )))
  )
}
