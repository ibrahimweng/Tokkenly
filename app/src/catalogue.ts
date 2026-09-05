/** Reference data for the Market. Prices are indicative and stand in for a
 *  feed; design.md 11c.4a records that no equities backend exists yet. */

export interface Instrument {
  ticker: string
  name: string
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
  { ticker: 'AAPL', mark: 223.72, liquidity: 237000, holders: 21600, holdersPct: 4.31, vol24h: 694000, address: '7xKqL2mBvT4nRpYcJ8dWzHfA3sGuQ9eN1bXrM6tVkPzD', kind: 'stock', name: 'Apple', price: 224.1, dayPct: 1.2, yearLow: 164.08, yearHigh: 237.49, dividend: 0.44, cap: '$3.41T', pe: 34.2, plain: 'Phones, laptops and the services that run on them.', tags: ['Popular', 'Technology'] },
  { ticker: 'NVDA', mark: 119.4, liquidity: 486000, holders: 38400, holdersPct: 6.12, vol24h: 1210000, address: '4mNbR8cVpX2tLqJ7yHgW5sKdA9uZ3eF6nTrB1vYoQwMx', kind: 'stock', name: 'Nvidia', price: 118.9, dayPct: 2.4, yearLow: 39.23, yearHigh: 140.76, dividend: 0.03, cap: '$2.92T', pe: 54.1, plain: 'The chips almost every AI system is trained on.', tags: ['Popular', 'Technology'] },
  { ticker: 'MSFT', mark: 428.87, liquidity: 312000, holders: 17900, holdersPct: 2.84, vol24h: 588000, address: '9pQrT5wYnK3bLcH8vJmX2sGdF7aZ4eU6tRxV1oNyBiCw', kind: 'stock', name: 'Microsoft', price: 430.2, dayPct: 0.6, yearLow: 309.45, yearHigh: 468.35, dividend: 0.72, cap: '$3.20T', pe: 36.8, plain: 'Windows, Office and the Azure cloud behind them.', tags: ['Popular', 'Technology'] },
  { ticker: 'GOOGL', mark: 166.77, liquidity: 148000, holders: 9420, holdersPct: 1.96, vol24h: 241000, address: '2vLkM7xBqW9nJcR4tYpH6sZdG3aF8eT5uNrX1oPyViQm', kind: 'stock', name: 'Alphabet', price: 164.7, dayPct: -0.3, yearLow: 120.21, yearHigh: 191.75, dividend: 0.48, cap: '$2.03T', pe: 23.9, plain: 'Search, YouTube and Android.', tags: ['Technology'] },
  { ticker: 'TSLA', mark: 245.84, liquidity: 203000, holders: 26800, holdersPct: 8.03, vol24h: 731000, address: '6tRnW3yKpV8mBqL5cJxH9sAdZ2gF4eU7oNrT1vYiXwPm', kind: 'stock', name: 'Tesla', price: 248.5, dayPct: -0.8, yearLow: 138.8, yearHigh: 299.29, dividend: 0, cap: '$792B', pe: 62.4, plain: 'Electric cars, batteries and driver software.', tags: ['Popular'] },
  { ticker: 'AMZN', mark: 179.14, liquidity: 176000, holders: 14300, holdersPct: 3.55, vol24h: 402000, address: '8wYpK4nBvR7tLmJ2cQxH5sZdA9gF3eU6oNrV1yTiXqMb', kind: 'stock', name: 'Amazon', price: 178.5, dayPct: 0.9, yearLow: 118.35, yearHigh: 201.2, dividend: 0, cap: '$1.86T', pe: 42.1, plain: 'The shop, and the cloud that pays for it.', tags: ['Popular'] },
  { ticker: 'VOO', mark: 511.11, liquidity: 664000, holders: 31200, holdersPct: 5.47, vol24h: 1480000, address: '3nBqL9xVpT6mRcJ8yKwH2sGdF5aZ7eU4tNrX1oPyViWm', kind: 'etf', holds: 500, name: 'S&P 500 ETF', price: 511.57, dayPct: 0.4, yearLow: 398.1, yearHigh: 528.9, dividend: 1.32, cap: '$1.24T', pe: 26.4, plain: 'One holding spread across the five hundred biggest US companies.', tags: ['ETFs', 'Steady'] },
  { ticker: 'QQQ', mark: 469.19, liquidity: 421000, holders: 19700, holdersPct: 4.02, vol24h: 886000, address: '5xTpM2nBvK8qLcR7yJwH4sZdG9aF6eU3tNrV1oPyXiQb', kind: 'etf', holds: 100, name: 'Nasdaq-100 ETF', price: 468.2, dayPct: 0.8, yearLow: 342.4, yearHigh: 503.5, dividend: 0.58, cap: '$298B', pe: 31.7, plain: 'One holding spread across the hundred biggest on the Nasdaq.', tags: ['ETFs'] },
  { ticker: 'KO', mark: 71.09, liquidity: 84000, holders: 7130, holdersPct: 2.18, vol24h: 118000, address: '1qLmX6nBpV4tRcJ9yKwH7sZdA2gF5eU8oNrT3vYiPwMb', kind: 'stock', name: 'Coca-Cola', price: 71.4, dayPct: 0.2, yearLow: 57.66, yearHigh: 73.53, dividend: 2.71, cap: '$308B', pe: 26.1, plain: 'Drinks sold in almost every country on earth.', tags: ['Steady'] },
  { ticker: 'JNJ', mark: 159.91, liquidity: 102000, holders: 5480, holdersPct: 1.44, vol24h: 147000, address: '7vNrT8xBqK2mLcJ5yPwH3sZdG6aF9eU1tRoX4yViQwMb', kind: 'stock', name: 'Johnson & Johnson', price: 158.9, dayPct: -0.1, yearLow: 143.13, yearHigh: 168.85, dividend: 3.12, cap: '$382B', pe: 21.4, plain: 'Medicines and medical devices.', tags: ['Steady', 'Health'] },
  { ticker: 'NKE', mark: 80.33, liquidity: 61000, holders: 4260, holdersPct: 2.91, vol24h: 96000, address: '4bXqM9nBvT5tLcR2yKwH8sZdF7aG3eU6oNrP1vYiJwXm', kind: 'stock', name: 'Nike', price: 78.6, dayPct: -1.4, yearLow: 70.75, yearHigh: 123.39, dividend: 1.88, cap: '$118B', pe: 20.3, plain: 'Trainers, kit and the brand on them.', tags: ['Consumer'] },
  { ticker: 'DIS', mark: 93.53, liquidity: 73000, holders: 6910, holdersPct: 1.72, vol24h: 132000, address: '9tRnV5xBpK7mLqJ3yWwH6sZdA8gF2eU4oNrT1vYiCwXb', kind: 'stock', name: 'Disney', price: 94.2, dayPct: 0.5, yearLow: 83.91, yearHigh: 123.74, dividend: 0.79, cap: '$171B', pe: 38.5, plain: 'Films, parks and streaming.', tags: ['Consumer'] },
]

/** What you are paying over or under the real share. Positive means the token
 *  is cheaper than the thing it tracks; negative means you are paying a
 *  premium for it. Read off the mark, the way an exchange quotes it. */
export const discount = (c: Instrument): number =>
  c.mark ? ((c.mark - c.price) / c.mark) * 100 : 0

export const CATEGORIES = ['Popular', 'ETFs', 'Technology', 'Steady', 'Consumer', 'Health', 'Everything']

export const INDICES = [
  { name: 'S&P 500', value: '5,648.40', pct: 0.42 },
  { name: 'Nasdaq', value: '17,713.62', pct: 0.71 },
  { name: 'Dow Jones', value: '41,335.05', pct: -0.13 },
]

export const PICKS = [
  { ticker: 'VOO', line: 'The whole US market in one go, for people who do not want to pick' },
  { ticker: 'AAPL', line: 'A company you already use every day' },
  { ticker: 'KO', line: 'Boring on purpose, and pays a dividend four times a year' },
]

export const find = (ticker: string): Instrument | undefined =>
  CATALOGUE.find((c) => c.ticker.toLowerCase() === ticker.toLowerCase())
