/** Reference data for the Market. Prices are indicative and stand in for a
 *  feed; design.md 11c.4a records that no equities backend exists yet. */

export interface Instrument {
  ticker: string
  name: string
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
  { ticker: 'AAPL', name: 'Apple', price: 224.1, dayPct: 1.2, yearLow: 164.08, yearHigh: 237.49, dividend: 0.44, cap: '$3.41T', pe: 34.2, plain: 'Phones, laptops and the services that run on them.', tags: ['Popular', 'Technology'] },
  { ticker: 'NVDA', name: 'Nvidia', price: 118.9, dayPct: 2.4, yearLow: 39.23, yearHigh: 140.76, dividend: 0.03, cap: '$2.92T', pe: 54.1, plain: 'The chips almost every AI system is trained on.', tags: ['Popular', 'Technology'] },
  { ticker: 'MSFT', name: 'Microsoft', price: 430.2, dayPct: 0.6, yearLow: 309.45, yearHigh: 468.35, dividend: 0.72, cap: '$3.20T', pe: 36.8, plain: 'Windows, Office and the Azure cloud behind them.', tags: ['Popular', 'Technology'] },
  { ticker: 'GOOGL', name: 'Alphabet', price: 164.7, dayPct: -0.3, yearLow: 120.21, yearHigh: 191.75, dividend: 0.48, cap: '$2.03T', pe: 23.9, plain: 'Search, YouTube and Android.', tags: ['Technology'] },
  { ticker: 'TSLA', name: 'Tesla', price: 248.5, dayPct: -0.8, yearLow: 138.8, yearHigh: 299.29, dividend: 0, cap: '$792B', pe: 62.4, plain: 'Electric cars, batteries and driver software.', tags: ['Popular'] },
  { ticker: 'AMZN', name: 'Amazon', price: 178.5, dayPct: 0.9, yearLow: 118.35, yearHigh: 201.2, dividend: 0, cap: '$1.86T', pe: 42.1, plain: 'The shop, and the cloud that pays for it.', tags: ['Popular'] },
  { ticker: 'VOO', name: 'Vanguard S&P 500', price: 511.57, dayPct: 0.4, yearLow: 398.1, yearHigh: 528.9, dividend: 1.32, cap: '$1.24T', pe: 26.4, plain: 'The five hundred biggest US companies in one holding.', tags: ['Funds', 'Steady'] },
  { ticker: 'QQQ', name: 'Invesco Nasdaq 100', price: 468.2, dayPct: 0.8, yearLow: 342.4, yearHigh: 503.5, dividend: 0.58, cap: '$298B', pe: 31.7, plain: 'The hundred biggest companies on the Nasdaq.', tags: ['Funds'] },
  { ticker: 'KO', name: 'Coca-Cola', price: 71.4, dayPct: 0.2, yearLow: 57.66, yearHigh: 73.53, dividend: 2.71, cap: '$308B', pe: 26.1, plain: 'Drinks sold in almost every country on earth.', tags: ['Steady'] },
  { ticker: 'JNJ', name: 'Johnson & Johnson', price: 158.9, dayPct: -0.1, yearLow: 143.13, yearHigh: 168.85, dividend: 3.12, cap: '$382B', pe: 21.4, plain: 'Medicines and medical devices.', tags: ['Steady', 'Health'] },
  { ticker: 'NKE', name: 'Nike', price: 78.6, dayPct: -1.4, yearLow: 70.75, yearHigh: 123.39, dividend: 1.88, cap: '$118B', pe: 20.3, plain: 'Trainers, kit and the brand on them.', tags: ['Consumer'] },
  { ticker: 'DIS', name: 'Disney', price: 94.2, dayPct: 0.5, yearLow: 83.91, yearHigh: 123.74, dividend: 0.79, cap: '$171B', pe: 38.5, plain: 'Films, parks and streaming.', tags: ['Consumer'] },
]

export const CATEGORIES = ['Popular', 'Funds', 'Technology', 'Steady', 'Consumer', 'Health', 'Everything']

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
