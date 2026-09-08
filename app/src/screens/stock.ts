import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, headActions } from '../components/shell'
import { card, cardHead, kv, callout, bucketBar, showBucketBar } from '../components/bits'
import { find, markGap, deviation, tradable, type Instrument, pathOf } from '../catalogue'
import { barChart, type Range } from '../components/chart'
import { state, actions, holding, inBucket, money, assetOn, MASK } from '../state'
import { usd, pct, signed, shares, shares as fmtShares } from '../format'
import { go } from '../router'
import { toast } from '../components/sheet'
import { celebrate } from '../confetti'
import { isMobile } from '../responsive'

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
 *  for the bucket; the amount is editable there.
 *
 *  Null for a company outside the launch set. The Buy button beside it is
 *  already withheld there, and leaving this one standing made the bucket a
 *  way round the refusal: deciding later still ends in buying, so it is
 *  gated on the same thing. The "Not open yet" pill sits in the same row and
 *  says why the row is short. */
function bucketAdd(c: Instrument): HTMLElement | null {
  if (!tradable(c)) return null
  const already = inBucket(c.ticker)
  const b = h('button', {
    class: 'btn btn-secondary btn-sm',
    text: already ? 'In your bucket · ' + usd(already.dollars, false) : 'Add to bucket',
  })
  b.addEventListener('click', () => {
    if (already) { go('/bucket'); return }
    // Before the action: addToBucket rebuilds the tree and detaches this
    // button, and a burst measured from a detached element never appears.
    celebrate(b)
    showBucketBar()
    actions.addToBucket(c.ticker, state.prefs.tradeDefault)
    go(pathOf(c))
  })
  return b
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

/** Every corporate action that has moved the multiplier, newest first. Folded,
 *  because the number is what matters day to day and the history is what
 *  matters the one time somebody asks why it is not 1. */
function foldRows(c: Instrument): HTMLElement {
  const list = h('div', { class: 'stack-8', hidden: true },
    ...c.actions.map((a) => h('div', { class: 'kv' },
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: a.what }),
        h('small', { text: a.at })),
      h('span', { class: 't-body-strong nowrap',
        text: fmtShares(a.from) + ' → ' + fmtShares(a.to) }))))
  const more = h('button', { class: 'panel-more',
    text: c.actions.length + (c.actions.length === 1 ? ' corporate action' : ' corporate actions') })
  more.setAttribute('aria-expanded', 'false')
  more.addEventListener('click', () => {
    list.hidden = !list.hidden
    more.textContent = list.hidden
      ? c.actions.length + (c.actions.length === 1 ? ' corporate action' : ' corporate actions')
      : 'Hide the history'
    more.setAttribute('aria-expanded', String(!list.hidden))
  })
  return h('div', { class: 'stack-8' }, more, list)
}

export function stockScreen(ticker: string): HTMLElement {
  const c = find(ticker)
  if (!c) {
    return shell('market', pageHeader('Not found'),
      h('p', { class: 'muted', text: 'No such company. Go back to Invest and search for it.' }),
      h('button', { class: 'btn btn-secondary btn-sm', text: 'Back to Invest', on: { click: () => go('/invest') } }))
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
    // Two pills and three buttons beside a company's name. On 390 pixels that
    // wrapped onto its own block and sat on top of the name, so the phone
    // keeps the one thing this screen is for — buying — and puts the rest
    // behind the overflow. The pills are not controls at all and move down
    // into the page, where a state belongs.
    pageHeader(c.name,
      isMobile()
        ? headActions(
            c.launch
              ? { label: 'Buy ' + c.ticker, ic: icon.market, strong: true,
                  run: () => go(pathOf(c) + '/invest') }
              : null,
            { label: watching ? 'Following' : 'Follow', ic: icon.star,
              run: () => {
                actions.toggleWatch(c.ticker)
                toast(watching ? c.ticker + ' removed from your watchlist' : c.ticker + ' added to your watchlist')
              } },
            // Gated on the same thing as Buy above it: deciding later still
            // ends in buying. The two pills below the header carry the
            // reason on a phone.
            tradable(c)
              ? { label: inBucket(c.ticker) ? 'In your bucket' : 'Add to bucket', ic: icon.bucket,
                  run: () => {
                    if (inBucket(c.ticker)) { go('/bucket'); return }
                    // The burst comes from the bucket in the top bar rather
                    // than from the row that was pressed: the row is inside a
                    // menu that is closing, and a burst measured from a
                    // detached element never appears. Where it lands is the
                    // better place for it anyway.
                    const bin = document.querySelector<HTMLElement>('.bucket-btn')
                    if (bin) celebrate(bin)
                    showBucketBar()
                    actions.addToBucket(c.ticker, state.prefs.tradeDefault)
                  } }
              : null)
        : h('div', { class: 'chip-row' },
            h('span', { class: 'pill', text: c.kind === 'etf' ? 'ETF' : 'Company' }),
            // What you can actually do with it. A market that shows twelve
            // companies and lets you buy five has to say which five, on the
            // thing itself, rather than at the point of refusal.
            h('span', { class: 'pill' + (c.launch ? ' pos' : ' warn'),
              text: c.launch ? 'Open for trading' : 'Not open yet' }),
            follow, bucketAdd(c),
            c.launch
              ? h('button', { class: 'btn btn-primary btn-sm', text: 'Buy ' + c.ticker,
                  on: { click: () => go(pathOf(c) + '/invest') } })
              : null)),
    // The two states, on the page rather than in the header, on a phone.
    isMobile()
      ? h('div', { class: 'chip-row' },
          h('span', { class: 'pill', text: c.kind === 'etf' ? 'ETF' : 'Company' }),
          h('span', { class: 'pill' + (c.launch ? ' pos' : ' warn'),
            text: c.launch ? 'Open for trading' : 'Not open yet' }))
      : null,
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
        // The one card that makes this a tokenised product rather than a
        // brokerage: what one token is, against the share it tracks, and every
        // corporate action that has moved the number.
        card(
          cardHead('What one ' + c.ticker + ' is',
            h('span', { class: 'pill', text: 'B20' })),
          h('div', { class: 'stack-8' },
            h('span', { class: 't-display', text: fmtShares(c.multiplier) + ' × ' + c.under }),
            h('span', { class: 'muted',
              text: c.multiplier > 1
                ? `Above one because dividends and corporate actions accrue into the multiplier rather than being paid out. One ${c.ticker} is now worth ${fmtShares(c.multiplier)} ${c.under} shares.`
                : `One ${c.ticker} tracks exactly one ${c.under} share. Nothing has accrued into it yet.` })),
          kv('Reference price', usd(c.mark) + ' · Chainlink'),
          kv('Venue price', usd(c.price) + ' · ' + (deviation(c) >= 0 ? '+' : '−') + pct(Math.abs(deviation(c)), 2)),
          kv('Checked', c.chainlinkAge + ' seconds ago'),
          c.actions.length
            ? foldRows(c)
            : h('span', { class: 'muted t-caption', text: 'No corporate actions since this token was issued.' }),
          callout('A token cannot pay you a dividend directly. Dividends and splits go into the multiplier instead, so one token slowly comes to represent more of the real share.')
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
          callout('This token tracks the real share and trades every day, weekends included.')
        ),
        card(
          cardHead('Your position'),
          held && held.shares > 0
            ? h('div', { class: 'stack-12' },
                kv('You hold', state.prefs.hideBalances ? MASK : shares(held.shares) + ' ' + c.ticker),
                kv('Worth', money(held.shares * c.price)),
                // What it cost, and therefore whether you are up. Both read off
                // the trades that built the position rather than stored beside
                // it, so there is no second copy to disagree with the quantity.
                kv('Average cost', state.prefs.hideBalances ? MASK : usd(held.each) + ' each'),
                kv('You paid', money(held.cost)),
                kv('Gain', h('span', { class: held.gain >= 0 ? 'pos t-body-strong' : 'warn t-body-strong',
                  text: state.prefs.hideBalances
                    ? MASK
                    : `${signed(held.gain)} · ${(held.gain >= 0 ? '+' : '−') + pct(Math.abs(held.gainPct))}` })),
                kv('Today', h('span', { class: c.dayPct >= 0 ? 'pos t-body-strong' : 't-body-strong',
                  text: state.prefs.hideBalances
                    ? MASK : signed((held.shares * c.price * c.dayPct) / 100) })))
            : h('span', { class: 'muted', text: 'You do not own any yet.' }),
          // Only if it can actually be bought. A primary button that leads
          // straight to a refusal is the product wasting somebody's press to
          // avoid admitting something on the screen they are already on.
          c.launch && assetOn(c.ticker)
            ? h('button', { class: 'btn btn-primary', text: 'Buy ' + c.ticker,
                on: { click: () => go(pathOf(c) + '/invest') } })
            : h('span', { class: 'muted t-caption',
                text: c.launch
                  ? `${c.ticker} is paused. You keep anything you hold, and you can still send it.`
                  : `${c.ticker} is not open for trading yet. It is here so you can watch it.` }),
          held && held.shares > 0 && assetOn(c.ticker)
            ? h('button', { class: 'btn btn-secondary', text: 'Sell ' + c.ticker,
                on: { click: () => go(pathOf(c) + '/sell') } })
            : null,
          // Beside Buy and Sell, on the position it moves, and only when there
          // is a position to move. A share can go to another verified Tokkenly
          // account and nowhere else; the screen behind this says so when the
          // person picked does not have one. design.md 11g.27.
          held && held.shares > 0
            ? h('button', { class: 'btn btn-secondary', text: 'Send ' + c.ticker + ' to someone',
                on: { click: () => go(pathOf(c) + '/send') } })
            : null
        ))),
    bucketBar()
  )
}
