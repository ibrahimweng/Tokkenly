import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout, bucketBar, showBucketBar } from '../components/bits'
import { CATALOGUE, find, markGap, deviation, tradable, type Instrument, pathOf } from '../catalogue'
import { barChart, sparkline, type Range } from '../components/chart'
import { state, actions, holding, inBucket, money, assetOn, MASK } from '../state'
import { usd, pct, signed, shares, shares as fmtShares } from '../format'
import { go } from '../router'
import { pageable, beside as besideOf } from '../components/pager'
import { toast } from '../components/sheet'
import { isMobile } from '../responsive'
import { celebrate } from '../confetti'
import { cameThrough } from '../whence'

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

/** A year, drawn small. Same span the receipt's sparkline uses: long enough to
 *  be a shape rather than a squiggle, short enough to be about now.
 *
 *  The percentage is the company's own — how far it has come from its year low,
 *  which is what the big chart's 1Y draws too, so the little line and the big
 *  one are the same claim. The receipt's version pins it at a constant, which
 *  nobody can see on a screen showing one company; in a strip of thirteen side
 *  by side it would have drawn thirteen identical climbs, and a graph that is
 *  the same shape for every company is decoration wearing the clothes of data. */
const spark = (c: Instrument): Range => ({
  key: '1Y', days: 365, pct: ((c.price - c.yearLow) / c.yearLow) * 100,
  vol: 0.09, fmt: () => '', over: 'this year',
})

/** The market, as a strip you can run a thumb along.
 *
 *  A company page used to be a dead end: you arrived from Invest, read it, and
 *  went back to the list to reach the next one. The list comes with you now —
 *  every company in the catalogue, its name, its day, and its year as a line
 *  small enough to read at a glance. The one you are on is lit, and the strip
 *  scrolls it into view on arrival, so the strip is also the answer to "where
 *  am I in this list".
 *
 *  All thirteen, not the four that can be bought. The market shows thirteen on
 *  purpose (11g.34) and a strip that quietly held four would be a second
 *  opinion about what exists. Nine of them say "Not open yet" when you get
 *  there, which is the screen's job and not the strip's. */
function coStrip(now: Instrument): HTMLElement {
  const strip = h('nav', { class: 'co-strip', ariaLabel: 'Companies' })
  for (const c of CATALOGUE) {
    const on = c.ticker === now.ticker
    const cell = h('button', {
      class: 'co-cell' + (on ? ' on' : ''),
      // Replaced, not pushed — see the note on the header below.
      on: { click: () => { if (!on) go(pathOf(c), true) } },
    },
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: c.name }),
        h('small', { class: c.dayPct >= 0 ? 'pos' : 'warn',
          text: (c.dayPct >= 0 ? '+' : '\u2212') + pct(Math.abs(c.dayPct)) })),
      sparkline(spark(c), c.price, c.ticker.charCodeAt(0)))
    if (on) cell.setAttribute('aria-current', 'page')
    strip.appendChild(cell)
  }
  // After the mount, not during it: an element that is not in the document has
  // no scroll box to scroll.
  queueMicrotask(() => {
    strip.querySelector('.co-cell.on')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  })
  return strip
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
  // The same plus the list carries, and for the same reason: this is one press
  // beside the price, not a second call to action competing with Buy. It was a
  // labelled button in the header, sitting between the company's name and the
  // thing the screen is actually for.
  const b = h('button', {
    class: 'icon-btn' + (already ? ' on' : ''),
    ariaLabel: already ? c.name + ' is in your bucket' : 'Add ' + c.name + ' to your bucket',
    title: already ? 'In your bucket · ' + usd(already.dollars, false) : 'Add to bucket',
    html: already ? icon.check() : icon.plus(),
  })
  b.addEventListener('click', () => {
    if (already) { go('/bucket'); return }
    // Before the action: addToBucket rebuilds the tree and detaches this
    // button, and a burst measured from a detached element never appears.
    celebrate(b)
    showBucketBar()
    actions.addToBucket(c.ticker, state.prefs.tradeDefault)
  })
  return b
}

/** Buy, on a phone, where a thumb already is.
 *
 *  On a wide screen the button lives in the position card beside the chart and
 *  is on screen the whole time you are reading. On a phone that card is the
 *  last of six and the button landed 2,876 pixels down a 3,232-pixel page — so
 *  the one thing this screen is for was off the end of it. It used to be in the
 *  header, and the header is a name now.
 *
 *  Not both. The card's button is dropped at this width, so Buy is in exactly
 *  one place at every width rather than twice at one of them. Sticky rather
 *  than fixed, and in the same container as the bucket bar, so when there is
 *  something in the bucket the two stack instead of landing on each other. */
function buyBar(c: Instrument): HTMLElement | null {
  if (!isMobile() || !c.launch || !assetOn(c.ticker)) return null
  return h('div', { class: 'buy-bar' },
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: c.name }),
      h('small', { text: usd(c.price) + ' each' })),
    h('button', { class: 'btn btn-primary btn-sm', text: 'Buy ' + c.ticker,
      on: { click: () => go(pathOf(c) + '/invest') } }))
}

/** The foot of the screen: what you are looking at, and what is already in the
 *  bucket. Either, both or neither. */
function footBars(c: Instrument): HTMLElement | null {
  const buy = buyBar(c)
  const bucket = bucketBar()
  if (!buy && !bucket) return null
  return h('div', { class: 'bars' }, buy, bucket)
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
  const came = cameThrough()

  // Secondary in both states now. It used to go primary when you were not
  // following, which put the loudest button on the screen against a control
  // that only changes what a list shows you — and it sits beside the price now
  // rather than beside Buy, where a primary would read as the purchase.
  const follow = h('button', {
    class: 'btn btn-secondary btn-sm',
    text: watching ? 'Following' : 'Follow',
    on: {
      click: () => {
        actions.toggleWatch(c.ticker)
        toast(watching ? c.ticker + ' removed from your watchlist' : c.ticker + ' added to your watchlist')
      },
    },
  })

  const page = shell(
    'market',
    // The company's name, and nothing else. It carried two pills and three
    // buttons: a kind, a trading state, Follow, Add to bucket and Buy — five
    // things beside a name, two of which were never controls at all. Together
    // they read as a toolbar, and the two pills read as buttons that did not
    // work.
    //
    // Each has a truer home. Follow and the bucket sit beside the price, on the
    // card about the price, because the price is what you are deciding
    // against. The kind and the trading state are facts about the token, so
    // they go in the card that explains the token. And Buy was already on the
    // position, where the money is: it was on this screen twice.
    // The trail names the grouping you came through, because the address
    // cannot. One company has one address from all seven ways in, so
    // `Invest › Disney` was the trail whether you tapped it on Moving today,
    // under the Consumer chip or in the S&P's table. `cameThrough` is memory
    // rather than address: a link somebody sent you came through nothing, and
    // reads `Invest › Disney`, which is the truth for that visit.
    //
    // The strip below replaces its history entry rather than pushing one, so
    // browsing thirteen companies leaves one entry and Back returns to the
    // list you came from rather than walking you back through all of them.
    pageHeader(c.name, undefined,
      { steps: came ? [came, { label: c.name }] : undefined }),
    // The market comes with you. See `coStrip`.
    coStrip(c),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          h('div', { class: 'card-head' },
            h('div', { class: 'stack-8' },
              h('span', { class: 't-caps subtle', text: 'Token price' }),
              h('span', { class: 't-display-xl', text: usd(c.price) }),
              markLine(c)),
            // Hard right of the figure. Following and the bucket are both
            // "come back to this", and the price is the thing you would be
            // coming back to look at.
            h('div', { class: 'price-acts' }, follow, bucketAdd(c))),
          timeframes(c),
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
          // The two pills that used to sit beside the name. They were states
          // wearing the shape of buttons; here they are two rows among the
          // other facts about what one of these is.
          kv('Kind', c.kind === 'etf' ? 'ETF' : 'Company'),
          // The colour is kept: "Not open yet" is the reason there is no Buy
          // button on this screen, and a grey row would leave that unsaid.
          kv('Trading', h('span', { class: c.launch ? 'pos t-body-strong' : 'warn t-body-strong',
            text: c.launch ? 'Open for trading' : 'Not open yet' })),
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
            // On a phone this button is the standing bar at the foot of the
            // screen instead; see `buyBar`. Two of them would be the repetition
            // the bar exists to spare somebody.
            ? (isMobile()
                ? null
                : h('button', { class: 'btn btn-primary', text: 'Buy ' + c.ticker,
                    on: { click: () => go(pathOf(c) + '/invest') } }))
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
    footBars(c)
  )
  // A swipe left or right pages to the company beside this one, and so do the
  // arrow keys — the same control the indices and the lists use.
  const near = besideOf(CATALOGUE.map((x) => ({ key: x.ticker, to: pathOf(x) })), c.ticker)
  pageable(page, { prev: near.prev.to, next: near.next.to, alive: '.co-strip' })
  return page
}
