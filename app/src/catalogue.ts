/** Reference data for the Market. Prices are indicative and stand in for a
 *  feed; design.md 11c.4a records that no equities backend exists yet. */

export interface Instrument {
  /** What you actually hold. A tokenised Apple share is AAPLc, not AAPL —
   *  the suffix is the whole point of the product and hiding it would be the
   *  product pretending to be a broker. Routes and search still answer to the
   *  underlying symbol, so `/invest/aapl` resolves here. */
  ticker: string
  /** The share the token tracks, on its home exchange. */
  under: string
  name: string
  /** In the approved launch set, or waiting on contract and eligibility
   *  verification. The market shows both and never lets you buy the second. */
  launch: boolean
  /** How stale `mark` is, in seconds. Past the ceiling, no trade.
   *
   *  There is one independent price, not two. This file briefly had `mark` —
   *  what the share is worth on its home exchange — and a separate `chainlink`
   *  reference, which are the same fact from the same kind of source, and the
   *  trade review ended up printing both. One number, named by where it comes
   *  from, with an age on it. */
  chainlinkAge: number
  /** The B20 multiplier. A tokenised share cannot pay a dividend into your
   *  wallet or split into two tokens, so both are expressed as a number of
   *  underlying shares each token represents. It starts at 1 and only ever
   *  moves on a corporate action. */
  multiplier: number
  /** What moved it, newest first. */
  actions: { at: string; kind: 'dividend' | 'split' | 'other'; what: string; from: number; to: number }[]
  /** A share in one company, or a fund holding many. The product is sold as
   *  "U.S. stocks and ETFs" and the two behave differently enough that a
   *  person should never have to guess which one they are buying: a fund has
   *  no single business behind it, and its P/E is a weighted average rather
   *  than one company's earnings. */
  kind: 'stock' | 'etf'
  /** How many companies a fund spreads across. Absent for a single share. */
  holds?: number
  /** What the share is worth on its home exchange right now. The token can
   *  trade away from it, and the gap is the single most important number a
   *  tokenised product can show: it is what you are paying over or under the
   *  real thing. */
  mark: number
  /** What can be bought right now without moving the price. A tokenised book
   *  is thin, and an order that is large against it fills badly. */
  liquidity: number
  /** How many people hold the token, and how that moved in a day. */
  holders: number
  holdersPct: number
  /** 24-hour traded volume in the token. */
  vol24h: number
  /** The token's own address. For a thing sold as tokenised, showing the
   *  token is a trust signal rather than clutter. */
  address: string
  price: number
  dayPct: number
  yearLow: number
  yearHigh: number
  dividend: number
  cap: string
  pe: number
  plain: string
  tags: string[]
}

export const CATALOGUE: Instrument[] = [
  { ticker: 'AAPLc', under: 'AAPL', launch: true, chainlinkAge: 12, multiplier: 1.0043, actions: [{ at: '2026-08-11', kind: 'dividend', what: 'Quarterly dividend, $0.26 a share, paid into the multiplier', from: 1.0031, to: 1.0043 }], mark: 223.72, liquidity: 237000, holders: 21600, holdersPct: 4.31, vol24h: 694000, address: '7xKqL2mBvT4nRpYcJ8dWzHfA3sGuQ9eN1bXrM6tVkPzD', kind: 'stock', name: 'Apple', price: 224.1, dayPct: 1.2, yearLow: 164.08, yearHigh: 237.49, dividend: 0.44, cap: '$3.41T', pe: 34.2, plain: 'Phones, laptops and the services that run on them.', tags: ['Popular', 'Technology'] },
  { ticker: 'NVDAc', under: 'NVDA', launch: true, chainlinkAge: 8, multiplier: 1.0009, actions: [{ at: '2026-06-10', kind: 'dividend', what: 'Quarterly dividend, $0.01 a share', from: 1.0008, to: 1.0009 }], mark: 119.4, liquidity: 486000, holders: 38400, holdersPct: 6.12, vol24h: 1210000, address: '4mNbR8cVpX2tLqJ7yHgW5sKdA9uZ3eF6nTrB1vYoQwMx', kind: 'stock', name: 'Nvidia', price: 118.9, dayPct: 2.4, yearLow: 39.23, yearHigh: 140.76, dividend: 0.03, cap: '$2.92T', pe: 54.1, plain: 'The chips almost every AI system is trained on.', tags: ['Popular', 'Technology'] },
  { ticker: 'MSFTc', under: 'MSFT', launch: false, chainlinkAge: 21, multiplier: 1.0067, actions: [{ at: '2026-08-14', kind: 'dividend', what: 'Quarterly dividend, $0.83 a share', from: 1.0048, to: 1.0067 }], mark: 428.87, liquidity: 312000, holders: 17900, holdersPct: 2.84, vol24h: 588000, address: '9pQrT5wYnK3bLcH8vJmX2sGdF7aZ4eU6tRxV1oNyBiCw', kind: 'stock', name: 'Microsoft', price: 430.2, dayPct: 0.6, yearLow: 309.45, yearHigh: 468.35, dividend: 0.72, cap: '$3.20T', pe: 36.8, plain: 'Windows, Office and the Azure cloud behind them.', tags: ['Popular', 'Technology'] },
  { ticker: 'METAc', under: 'META', launch: true, chainlinkAge: 11, multiplier: 1.0021, actions: [{ at: '2026-06-25', kind: 'dividend', what: 'Quarterly dividend, $0.53 a share', from: 1.0011, to: 1.0021 }], mark: 513.10, liquidity: 96000, holders: 11800, holdersPct: 3.42, vol24h: 356000, address: '5kRpX8mBvL2tNcJ9yHwQ4sZdA7gF3eU6oTrV1nYiPwMb', kind: 'stock', name: 'Meta', price: 511.90, dayPct: 1.1, yearLow: 279.4, yearHigh: 542.81, dividend: 0.41, cap: '$1.30T', pe: 27.6, plain: 'Facebook, Instagram, WhatsApp and the ads on them.', tags: ['Popular', 'Technology'] },
  { ticker: 'GOOGLc', under: 'GOOGL', launch: true, chainlinkAge: 15, multiplier: 1.0029, actions: [{ at: '2026-06-09', kind: 'dividend', what: 'Quarterly dividend, $0.20 a share', from: 1.0017, to: 1.0029 }], mark: 166.77, liquidity: 148000, holders: 9420, holdersPct: 1.96, vol24h: 241000, address: '2vLkM7xBqW9nJcR4tYpH6sZdG3aF8eT5uNrX1oPyViQm', kind: 'stock', name: 'Alphabet', price: 164.7, dayPct: -0.3, yearLow: 120.21, yearHigh: 191.75, dividend: 0.48, cap: '$2.03T', pe: 23.9, plain: 'Search, YouTube and Android.', tags: ['Technology'] },
  { ticker: 'TSLAc', under: 'TSLA', launch: false, chainlinkAge: 9, multiplier: 1.0, actions: [], mark: 245.84, liquidity: 203000, holders: 26800, holdersPct: 8.03, vol24h: 731000, address: '6tRnW3yKpV8mBqL5cJxH9sAdZ2gF4eU7oNrT1vYiXwPm', kind: 'stock', name: 'Tesla', price: 248.5, dayPct: -0.8, yearLow: 138.8, yearHigh: 299.29, dividend: 0, cap: '$792B', pe: 62.4, plain: 'Electric cars, batteries and driver software.', tags: ['Popular'] },
  { ticker: 'AMZNc', under: 'AMZN', launch: false, chainlinkAge: 34, multiplier: 1.0, actions: [], mark: 179.14, liquidity: 176000, holders: 14300, holdersPct: 3.55, vol24h: 402000, address: '8wYpK4nBvR7tLmJ2cQxH5sZdA9gF3eU6oNrV1yTiXqMb', kind: 'stock', name: 'Amazon', price: 178.5, dayPct: 0.9, yearLow: 118.35, yearHigh: 201.2, dividend: 0, cap: '$1.86T', pe: 42.1, plain: 'The shop, and the cloud that pays for it.', tags: ['Popular'] },
  { ticker: 'VOOc', under: 'VOO', launch: false, chainlinkAge: 18, multiplier: 1.0181, actions: [{ at: '2026-06-27', kind: 'dividend', what: 'Quarterly distribution, $1.78 a share', from: 1.0146, to: 1.0181 }], mark: 511.11, liquidity: 664000, holders: 31200, holdersPct: 5.47, vol24h: 1480000, address: '3nBqL9xVpT6mRcJ8yKwH2sGdF5aZ7eU4tNrX1oPyViWm', kind: 'etf', holds: 500, name: 'S&P 500 ETF', price: 511.57, dayPct: 0.4, yearLow: 398.1, yearHigh: 528.9, dividend: 1.32, cap: '$1.24T', pe: 26.4, plain: 'One holding spread across the five hundred biggest US companies.', tags: ['ETFs', 'Steady'] },
  { ticker: 'QQQc', under: 'QQQ', launch: false, chainlinkAge: 26, multiplier: 1.0044, actions: [{ at: '2026-06-23', kind: 'dividend', what: 'Quarterly distribution, $0.68 a share', from: 1.0029, to: 1.0044 }], mark: 469.19, liquidity: 421000, holders: 19700, holdersPct: 4.02, vol24h: 886000, address: '5xTpM2nBvK8qLcR7yJwH4sZdG9aF6eU3tNrV1oPyXiQb', kind: 'etf', holds: 100, name: 'Nasdaq-100 ETF', price: 468.2, dayPct: 0.8, yearLow: 342.4, yearHigh: 503.5, dividend: 0.58, cap: '$298B', pe: 31.7, plain: 'One holding spread across the hundred biggest on the Nasdaq.', tags: ['ETFs'] },
  { ticker: 'KOc', under: 'KO', launch: false, chainlinkAge: 41, multiplier: 1.0271, actions: [{ at: '2026-07-01', kind: 'dividend', what: 'Quarterly dividend, $0.48 a share', from: 1.0203, to: 1.0271 }], mark: 71.09, liquidity: 84000, holders: 7130, holdersPct: 2.18, vol24h: 118000, address: '1qLmX6nBpV4tRcJ9yKwH7sZdA2gF5eU8oNrT3vYiPwMb', kind: 'stock', name: 'Coca-Cola', price: 71.4, dayPct: 0.2, yearLow: 57.66, yearHigh: 73.53, dividend: 2.71, cap: '$308B', pe: 26.1, plain: 'Drinks sold in almost every country on earth.', tags: ['Steady'] },
  { ticker: 'JNJc', under: 'JNJ', launch: false, chainlinkAge: 55, multiplier: 1.0198, actions: [{ at: '2026-08-26', kind: 'dividend', what: 'Quarterly dividend, $1.24 a share', from: 1.0120, to: 1.0198 }], mark: 159.91, liquidity: 102000, holders: 5480, holdersPct: 1.44, vol24h: 147000, address: '7vNrT8xBqK2mLcJ5yPwH3sZdG6aF9eU1tRoX4yViQwMb', kind: 'stock', name: 'Johnson & Johnson', price: 158.9, dayPct: -0.1, yearLow: 143.13, yearHigh: 168.85, dividend: 3.12, cap: '$382B', pe: 21.4, plain: 'Medicines and medical devices.', tags: ['Steady', 'Health'] },
  { ticker: 'NKEc', under: 'NKE', launch: false, chainlinkAge: 63, multiplier: 1.0148, actions: [{ at: '2026-07-01', kind: 'dividend', what: 'Quarterly dividend, $0.37 a share', from: 1.0102, to: 1.0148 }], mark: 80.33, liquidity: 61000, holders: 4260, holdersPct: 2.91, vol24h: 96000, address: '4bXqM9nBvT5tLcR2yKwH8sZdF7aG3eU6oNrP1vYiJwXm', kind: 'stock', name: 'Nike', price: 78.6, dayPct: -1.4, yearLow: 70.75, yearHigh: 123.39, dividend: 1.88, cap: '$118B', pe: 20.3, plain: 'Trainers, kit and the brand on them.', tags: ['Consumer'] },
  { ticker: 'DISc', under: 'DIS', launch: false, chainlinkAge: 29, multiplier: 1.0084, actions: [{ at: '2026-07-24', kind: 'dividend', what: 'Half-yearly dividend, $0.75 a share', from: 1.0004, to: 1.0084 },
      { at: '2026-01-16', kind: 'other', what: 'Custodian rebalanced the basket after a transfer agent change', from: 1.0, to: 1.0004 }], mark: 93.53, liquidity: 73000, holders: 6910, holdersPct: 1.72, vol24h: 132000, address: '9tRnV5xBpK7mLqJ3yWwH6sZdA8gF2eU4oNrT1vYiCwXb', kind: 'stock', name: 'Disney', price: 94.2, dayPct: 0.5, yearLow: 83.91, yearHigh: 123.74, dividend: 0.79, cap: '$171B', pe: 38.5, plain: 'Films, parks and streaming.', tags: ['Consumer'] },
]

/** What you are paying over or under the real share. Positive means the token
 *  is cheaper than the thing it tracks; negative means you are paying a
 *  premium for it. Read off the mark, the way an exchange quotes it. */
export const discount = (c: Instrument): number =>
  c.mark ? ((c.mark - c.price) / c.mark) * 100 : 0

/** How that gap reads on screen. The figure is unsigned and the word carries
 *  the direction, because a signed percentage in a price column gets read as a
 *  price move: "−0.17%" beside Apple looked like a fall when it meant you were
 *  paying 0.17% over the real share, and the stock page put the sign and the
 *  word in one sentence — "−0.17% above $223.72" — which cannot both be true.
 *  One helper, so the table, the stock page and the composer cannot drift into
 *  three conventions again. */
export function markGap(c: Instrument): { pct: string; word: string; over: boolean } {
  const d = discount(c)
  const over = d < 0
  return { pct: Math.abs(d).toFixed(2) + '%', word: over ? 'above' : 'below', over }
}

export const CATEGORIES = ['Popular', 'ETFs', 'Technology', 'Steady', 'Consumer', 'Health', 'Everything']

export const INDICES = [
  { name: 'S&P 500', value: '5,648.40', pct: 0.42 },
  { name: 'Nasdaq', value: '17,713.62', pct: 0.71 },
  { name: 'Dow Jones', value: '41,335.05', pct: -0.13 },
]

export const PICKS = [
  { ticker: 'VOOc', line: 'The whole US market in one go, for people who do not want to pick' },
  { ticker: 'AAPLc', line: 'A company you already use every day' },
  { ticker: 'KOc', line: 'Boring on purpose, and pays a dividend four times a year' },
]

/** By the token you hold, or by the share it tracks. `AAPLc` and `AAPL` both
 *  land on Apple: the suffix arrived after every route, bookmark, test and
 *  palette entry in the product was already written against the bare symbol,
 *  and an address that stops working because a naming convention changed is a
 *  naming convention that has cost more than it is worth. */
export const find = (ticker: string): Instrument | undefined => {
  const t = ticker.toLowerCase()
  return CATALOGUE.find((c) => c.ticker.toLowerCase() === t)
    ?? CATALOGUE.find((c) => c.under.toLowerCase() === t)
}

/** What the approved launch set is, and what is waiting behind it. The market
 *  shows both — a market that hides what is coming is a market that looks
 *  smaller than it is — and only the first can be bought. */
export const LAUNCH = CATALOGUE.filter((c) => c.launch)
export const tradable = (c: Instrument): boolean => c.launch

/** What one token is worth against the share it tracks. A multiplier above 1
 *  means dividends and splits have accrued into it, so a token is worth more
 *  than one share — which is the single most confusing thing about a tokenised
 *  security and the reason it is stated rather than folded in silently. */
export const perToken = (c: Instrument): number => c.multiplier

/* ---------------------------------------------------------------------------
   The safeguards.

   A quote from a venue, checked against a price that did not come from that
   venue. Everything below is the arithmetic behind the four refusals on the
   trade review, and it lives here rather than in the screen because a rule
   that only exists in a view is a rule one route around the view undoes.

   The numbers are the product's own: a real one gets them from 0x and
   Chainlink, and the seam is these five functions wide.
   --------------------------------------------------------------------------- */

/** What a trade of this size does to the price. A tokenised book is thin, and
 *  a market order that is large against it walks up its own ladder — so the
 *  figure is the trade against available depth, squared off so it stays near
 *  nothing until the order is a real fraction of the book. */
export const priceImpact = (c: Instrument, dollars: number): number => {
  const share = dollars / Math.max(c.liquidity, 1)
  // Linear in the size of the order against the book, with a squared term that
  // only matters once the order is a real fraction of it. A purely squared
  // curve was near zero for everything a person could actually afford, which
  // made the figure decoration: it read 0.00% on every screen and the refusal
  // behind it could never be reached. A thin tokenised book moves on the first
  // few thousand dollars, and now the number says so.
  return Math.round((share * 120 + share * share * 900) * 100) / 100
}

/** What you are guaranteed to end up with. A quote is a price at a moment; by
 *  the time it settles the book has moved, so the number that matters is not
 *  the expected one but the floor under it. */
export const minReceived = (expected: number, slippagePct = 1): number =>
  Math.floor(expected * (1 - slippagePct / 100) * 1e6) / 1e6

/** How far the venue's price is from the independent one, as a percentage.
 *  Positive means the venue is dearer than the reference. */
export const deviation = (c: Instrument): number =>
  Math.round(((c.price - c.mark) / c.mark) * 10000) / 100

/** The ceilings. Named once, shown on the screen that enforces them, and the
 *  same numbers the refusals are written against. */
export const GUARDS = {
  /** A reference price older than this is not a reference. */
  priceAgeSec: 90,
  /** How far the venue may sit from the reference before we will not trade. */
  deviationPct: 1.5,
  /** How much of the price the order itself is allowed to move. */
  impactPct: 2,
  /** The floor under what you receive, as a percentage of the quote. */
  slippagePct: 1,
  /** The smallest order the product will take. */
  minOrder: 5,
}

export type Refusal = { code: string; title: string; why: string }

/** Every reason this trade must not go through, in the order a person would
 *  want to hear them. Empty means it is safe to show a confirm button.
 *
 *  Returned as a list rather than a boolean because a trade can be refused for
 *  two reasons at once, and telling somebody about one of them sends them off
 *  to fix half a problem. */
export function refusals(c: Instrument, dollars: number, off?: { trading?: boolean; asset?: boolean }): Refusal[] {
  const out: Refusal[] = []
  // Somebody in operations turned it off, which is a different sentence from
  // "the market says no" and has to read as one. A person who is told the
  // book is thin will try a smaller amount; a person who is told we paused it
  // will come back later, and sending them to the first when it is the second
  // wastes their afternoon.
  if (off?.asset) {
    out.push({ code: 'asset-off', title: `${c.ticker} is paused`,
      why: `We have suspended trading in ${c.ticker} while something is checked. If you hold it you keep it, and you can still send it — you cannot buy or sell it today.` })
  }
  if (off?.trading) {
    out.push({ code: 'trading-off', title: 'Trading is paused',
      why: 'Buying is switched off across the product right now. Your holdings are untouched and selling still works.' })
  }
  if (!c.launch) {
    out.push({ code: 'unsupported', title: 'Not open for trading yet',
      why: `${c.ticker} is verified on Base but is not in the approved launch set. It is here so you can see it; you cannot buy it until its contract and eligibility checks are signed off.` })
  }
  if (c.chainlinkAge > GUARDS.priceAgeSec) {
    out.push({ code: 'stale', title: 'The reference price is stale',
      why: `The Chainlink price for ${c.under} is ${c.chainlinkAge} seconds old and we will not trade on anything over ${GUARDS.priceAgeSec}. Nothing has been sent. Try again in a moment.` })
  }
  if (Math.abs(deviation(c)) > GUARDS.deviationPct) {
    out.push({ code: 'deviation', title: 'The venue is too far from the reference',
      why: `The token is quoting ${Math.abs(deviation(c)).toFixed(2)}% ${deviation(c) > 0 ? 'above' : 'below'} the independent price, over our ${GUARDS.deviationPct}% ceiling. That gap is yours to lose, so we do not take the trade.` })
  }
  if (priceImpact(c, dollars) > GUARDS.impactPct) {
    out.push({ code: 'impact', title: 'This order is too big for the book',
      why: `An order this size would move the price ${priceImpact(c, dollars).toFixed(2)}%, over our ${GUARDS.impactPct}% ceiling. Try a smaller amount, or split it across a few days.` })
  }
  if (dollars > c.liquidity) {
    out.push({ code: 'liquidity', title: 'Not enough on the book',
      why: `There is about ${'$' + Math.round(c.liquidity).toLocaleString('en-US')} available in ${c.ticker} right now, and this order is larger than that.` })
  }
  return out
}
