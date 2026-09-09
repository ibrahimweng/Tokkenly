/* The three indices, and what is actually inside them.
   ---------------------------------------------------------------------------

   Invest showed three numbers — S&P 500, Nasdaq, Dow Jones — and there was
   nothing behind any of them. They were the only figures in the product a
   person could not press, which on a screen where everything else opens is a
   number that reads as broken.

   Each has a page now: where it stands, how it has moved, what it actually
   measures, and the companies in it by weight.

   ON THE HONESTY OF THIS DATA. Weights and levels here are indicative, of the
   order the real ones are, and the page says so — the same footing as every
   price in this prototype. What is *not* invented is membership: Coca-Cola is
   in the S&P and the Dow and is not on the Nasdaq, and the pages say that
   because it is true and because somebody deciding what to buy would notice.

   And the thing the tables cannot pretend: Tokkenly lists thirteen
   instruments. A row it lists opens and can be bought. A row it does not is a
   name and a weight, marked, going nowhere. That gap is the point rather than
   an embarrassment — it is what the launch set *is*, drawn at index scale, and
   dressing twenty dead rows up as live ones would be the product lying about
   what it sells. */

/** One company inside an index.
 *
 *  `ticker` is the Tokkenly token when there is one, and the row reads its
 *  price out of the catalogue so the two can never disagree. Without it the
 *  row carries its own indicative figures and cannot be opened. */
export type Member = {
  name: string
  symbol: string
  /** Percent of the index. Indicative. */
  weight: number
  ticker?: string
  price?: number
  dayPct?: number
}

export type Index = {
  key: string
  name: string
  level: string
  pct: number
  /** For the chart, which draws from the same seeded series the rest uses. */
  yearPct: number
  /** How many companies are in the whole index, and how many are listed here. */
  count: number
  /** What the table is showing, said in words on the page. */
  shown: string
  plain: string
  /** The help card. Plain questions somebody actually has, in order. */
  how: { q: string; a: string }[]
  /** The token that buys the whole index in one holding, where one is listed. */
  etf?: string
  members: Member[]
}

/* Prices for the companies Tokkenly does not list. Indicative, and only ever
   shown beside a row that says it cannot be bought here. */
const P = (price: number, dayPct: number) => ({ price, dayPct })

export const INDEXES: Index[] = [
  {
    key: 'sp500',
    name: 'S&P 500',
    level: '5,648.40',
    pct: 0.42,
    yearPct: 21.4,
    count: 500,
    shown: 'The thirty largest, and every one of them Tokkenly lists',
    plain:
      'Five hundred of the biggest companies in America, weighted by what each '
      + 'is worth. It is the number people mean when they say "the market".',
    how: [
      { q: 'What moves it',
        a: 'The biggest companies move it most. The top ten are about a third of '
          + 'the whole index, so a bad day at Apple or Nvidia shows up here even '
          + 'when four hundred other companies are flat.' },
      { q: 'Why the number is not money',
        a: 'It is an index level, not a price. 5,648 does not cost anything and '
          + 'nobody holds one. What matters is the change: up 0.42% today means '
          + 'the five hundred are worth 0.42% more than they were yesterday.' },
      { q: 'Weighted by size, not evenly',
        a: 'A company worth two trillion counts for a hundred times more than one '
          + 'worth twenty billion. That is why this list is ordered by weight '
          + 'rather than alphabetically.' },
      { q: 'How to own it',
        a: 'Buying five hundred companies one at a time is not practical. A fund '
          + 'that holds all of them is one holding, and Tokkenly lists one.' },
    ],
    etf: 'VOOc',
    members: [
      { name: 'Apple', symbol: 'AAPL', weight: 7.1, ticker: 'AAPLc' },
      { name: 'Microsoft', symbol: 'MSFT', weight: 6.5, ticker: 'MSFTc' },
      { name: 'Nvidia', symbol: 'NVDA', weight: 6.1, ticker: 'NVDAc' },
      { name: 'Amazon', symbol: 'AMZN', weight: 3.6, ticker: 'AMZNc' },
      { name: 'Meta', symbol: 'META', weight: 2.6, ticker: 'METAc' },
      { name: 'Alphabet (A)', symbol: 'GOOGL', weight: 2.2, ticker: 'GOOGLc' },
      { name: 'Broadcom', symbol: 'AVGO', weight: 1.8, ...P(168.4, 1.9) },
      { name: 'Alphabet (C)', symbol: 'GOOG', weight: 1.8, ...P(166.2, -0.3) },
      { name: 'Berkshire Hathaway', symbol: 'BRK.B', weight: 1.7, ...P(462.8, 0.2) },
      { name: 'Tesla', symbol: 'TSLA', weight: 1.5, ticker: 'TSLAc' },
      { name: 'JPMorgan Chase', symbol: 'JPM', weight: 1.4, ...P(221.6, 0.5) },
      { name: 'Eli Lilly', symbol: 'LLY', weight: 1.3, ...P(908.4, -0.6) },
      { name: 'UnitedHealth', symbol: 'UNH', weight: 1.1, ...P(587.3, 0.4) },
      { name: 'Visa', symbol: 'V', weight: 1.0, ...P(283.1, 0.3) },
      { name: 'Exxon Mobil', symbol: 'XOM', weight: 1.0, ...P(114.7, -0.9) },
      { name: 'Mastercard', symbol: 'MA', weight: 0.9, ...P(487.5, 0.4) },
      { name: 'Costco', symbol: 'COST', weight: 0.8, ...P(892.4, 0.7) },
      { name: 'Johnson & Johnson', symbol: 'JNJ', weight: 0.8, ticker: 'JNJc' },
      { name: 'Procter & Gamble', symbol: 'PG', weight: 0.8, ...P(174.9, 0.1) },
      { name: 'Home Depot', symbol: 'HD', weight: 0.8, ...P(368.2, 0.6) },
      { name: 'Walmart', symbol: 'WMT', weight: 0.7, ...P(77.4, 0.8) },
      { name: 'AbbVie', symbol: 'ABBV', weight: 0.7, ...P(196.3, -0.2) },
      { name: 'Netflix', symbol: 'NFLX', weight: 0.7, ...P(701.5, 1.4) },
      { name: 'Merck', symbol: 'MRK', weight: 0.6, ...P(114.2, -0.4) },
      { name: 'Bank of America', symbol: 'BAC', weight: 0.6, ...P(40.1, 0.7) },
      { name: 'Coca-Cola', symbol: 'KO', weight: 0.6, ticker: 'KOc' },
      { name: 'Chevron', symbol: 'CVX', weight: 0.6, ...P(146.8, -0.7) },
      { name: 'AMD', symbol: 'AMD', weight: 0.5, ...P(152.7, 2.1) },
      { name: 'Adobe', symbol: 'ADBE', weight: 0.5, ...P(548.9, -1.1) },
      { name: 'Salesforce', symbol: 'CRM', weight: 0.5, ...P(252.4, 0.9) },
      // Below the top thirty, and here because Tokkenly lists them. A table
      // that cut them would show somebody a company they own and an index it
      // is in, and not put the two together.
      { name: 'Disney', symbol: 'DIS', weight: 0.35, ticker: 'DISc' },
      { name: 'Nike', symbol: 'NKE', weight: 0.24, ticker: 'NKEc' },
    ],
  },
  {
    key: 'nasdaq',
    name: 'Nasdaq-100',
    level: '17,713.62',
    pct: 0.71,
    yearPct: 27.9,
    count: 100,
    shown: 'The thirty largest, and every one of them Tokkenly lists',
    plain:
      'The hundred biggest companies on the Nasdaq, which in practice means the '
      + 'technology ones. Banks are excluded by the rules of the index.',
    how: [
      { q: 'Why it moves more than the S&P',
        a: 'It holds a hundred companies rather than five hundred, and they are '
          + 'concentrated in one industry. Concentration cuts both ways: it rises '
          + 'faster in a good year for technology and falls faster in a bad one.' },
      { q: 'Why some big companies are missing',
        a: 'The index excludes financial companies by rule, so no JPMorgan, no '
          + 'Berkshire, no Bank of America — however large they are. It is also '
          + 'only Nasdaq-listed companies, which is why Coca-Cola, Johnson & '
          + 'Johnson, Nike and Disney are not here. They are on the NYSE.' },
      { q: 'The top of it is very heavy',
        a: 'The largest seven are close to forty per cent of the whole index. '
          + 'Reading this number as "a hundred companies" understates how much '
          + 'of it is a handful of them.' },
      { q: 'How to own it',
        a: 'A fund that holds the hundred is one holding, and Tokkenly lists one.' },
    ],
    etf: 'QQQc',
    members: [
      { name: 'Apple', symbol: 'AAPL', weight: 8.8, ticker: 'AAPLc' },
      { name: 'Microsoft', symbol: 'MSFT', weight: 8.0, ticker: 'MSFTc' },
      { name: 'Nvidia', symbol: 'NVDA', weight: 7.8, ticker: 'NVDAc' },
      { name: 'Broadcom', symbol: 'AVGO', weight: 5.0, ...P(168.4, 1.9) },
      { name: 'Amazon', symbol: 'AMZN', weight: 5.0, ticker: 'AMZNc' },
      { name: 'Meta', symbol: 'META', weight: 4.5, ticker: 'METAc' },
      { name: 'Tesla', symbol: 'TSLA', weight: 2.9, ticker: 'TSLAc' },
      { name: 'Netflix', symbol: 'NFLX', weight: 2.9, ...P(701.5, 1.4) },
      { name: 'Alphabet (A)', symbol: 'GOOGL', weight: 2.6, ticker: 'GOOGLc' },
      { name: 'Costco', symbol: 'COST', weight: 2.6, ...P(892.4, 0.7) },
      { name: 'Alphabet (C)', symbol: 'GOOG', weight: 2.5, ...P(166.2, -0.3) },
      { name: 'AMD', symbol: 'AMD', weight: 1.6, ...P(152.7, 2.1) },
      { name: 'PepsiCo', symbol: 'PEP', weight: 1.4, ...P(172.3, 0.2) },
      { name: 'Linde', symbol: 'LIN', weight: 1.4, ...P(468.9, 0.3) },
      { name: 'Cisco', symbol: 'CSCO', weight: 1.4, ...P(50.8, 0.6) },
      { name: 'T-Mobile', symbol: 'TMUS', weight: 1.3, ...P(197.4, 0.5) },
      { name: 'Qualcomm', symbol: 'QCOM', weight: 1.3, ...P(168.2, 1.1) },
      { name: 'Adobe', symbol: 'ADBE', weight: 1.2, ...P(548.9, -1.1) },
      { name: 'Intuit', symbol: 'INTU', weight: 1.2, ...P(631.7, 0.8) },
      { name: 'Applied Materials', symbol: 'AMAT', weight: 1.0, ...P(191.6, 1.7) },
      { name: 'Texas Instruments', symbol: 'TXN', weight: 1.0, ...P(203.4, 0.4) },
      { name: 'Amgen', symbol: 'AMGN', weight: 1.0, ...P(324.8, -0.3) },
      { name: 'Comcast', symbol: 'CMCSA', weight: 1.0, ...P(39.7, -0.5) },
      { name: 'Booking', symbol: 'BKNG', weight: 1.0, ...P(3894.0, 0.9) },
      { name: 'Honeywell', symbol: 'HON', weight: 0.9, ...P(206.1, 0.2) },
      { name: 'Intel', symbol: 'INTC', weight: 0.9, ...P(21.4, -2.3) },
      { name: 'Starbucks', symbol: 'SBUX', weight: 0.8, ...P(94.6, 0.4) },
      { name: 'Gilead', symbol: 'GILD', weight: 0.7, ...P(84.2, 0.1) },
      { name: 'ADP', symbol: 'ADP', weight: 0.7, ...P(272.9, 0.3) },
      { name: 'Palo Alto Networks', symbol: 'PANW', weight: 0.7, ...P(358.4, 1.5) },
    ],
  },
  {
    key: 'dow',
    name: 'Dow Jones',
    level: '41,335.05',
    pct: -0.13,
    yearPct: 14.8,
    count: 30,
    // The one index this product can show whole, because it only has thirty.
    shown: 'All thirty of them',
    plain:
      'Thirty large American companies, picked by a committee rather than by '
      + 'size. The oldest of the three, and the one people quote most often.',
    how: [
      { q: 'The odd one out',
        a: 'This index weights by share price, not by company size. A company '
          + 'whose shares cost $500 moves it more than one whose shares cost $50, '
          + 'even if the second company is worth ten times as much. Nobody would '
          + 'design it that way now; it is that way because it is from 1896.' },
      { q: 'What that means in practice',
        a: 'Goldman Sachs and UnitedHealth move this index more than Apple does, '
          + 'because their shares cost more. On the S&P, Apple moves it most by a '
          + 'long way. The two indices can disagree about the same day.' },
      { q: 'Only thirty',
        a: 'Thirty companies is not the American market, and the committee that '
          + 'picks them changes its mind — Nvidia and Amazon were added recently, '
          + 'and other names were dropped to make room.' },
      { q: 'How to own it',
        a: 'Tokkenly does not list a fund that tracks this one. The eight '
          + 'companies in it that Tokkenly does list are marked below.' },
    ],
    members: [
      { name: 'Goldman Sachs', symbol: 'GS', weight: 8.5, ...P(512.3, -0.4) },
      { name: 'UnitedHealth', symbol: 'UNH', weight: 7.5, ...P(587.3, 0.4) },
      { name: 'Microsoft', symbol: 'MSFT', weight: 6.0, ticker: 'MSFTc' },
      { name: 'Home Depot', symbol: 'HD', weight: 5.8, ...P(368.2, 0.6) },
      { name: 'Caterpillar', symbol: 'CAT', weight: 5.5, ...P(348.7, -0.8) },
      { name: 'Sherwin-Williams', symbol: 'SHW', weight: 5.0, ...P(371.4, 0.2) },
      { name: 'Visa', symbol: 'V', weight: 4.5, ...P(283.1, 0.3) },
      { name: "McDonald's", symbol: 'MCD', weight: 4.4, ...P(291.6, 0.1) },
      { name: 'Amgen', symbol: 'AMGN', weight: 4.3, ...P(324.8, -0.3) },
      { name: 'Salesforce', symbol: 'CRM', weight: 4.2, ...P(252.4, 0.9) },
      { name: 'American Express', symbol: 'AXP', weight: 4.0, ...P(256.8, 0.5) },
      { name: 'Travelers', symbol: 'TRV', weight: 3.6, ...P(232.1, -0.2) },
      { name: 'IBM', symbol: 'IBM', weight: 3.5, ...P(219.4, 0.7) },
      { name: 'Honeywell', symbol: 'HON', weight: 3.3, ...P(206.1, 0.2) },
      { name: 'Amazon', symbol: 'AMZN', weight: 3.0, ticker: 'AMZNc' },
      { name: 'Boeing', symbol: 'BA', weight: 2.9, ...P(176.2, -1.6) },
      { name: 'Apple', symbol: 'AAPL', weight: 2.8, ticker: 'AAPLc' },
      { name: 'Johnson & Johnson', symbol: 'JNJ', weight: 2.5, ticker: 'JNJc' },
      { name: 'Procter & Gamble', symbol: 'PG', weight: 2.4, ...P(174.9, 0.1) },
      { name: 'Chevron', symbol: 'CVX', weight: 2.4, ...P(146.8, -0.7) },
      { name: 'JPMorgan Chase', symbol: 'JPM', weight: 2.3, ...P(221.6, 0.5) },
      { name: 'Nvidia', symbol: 'NVDA', weight: 2.0, ticker: 'NVDAc' },
      { name: '3M', symbol: 'MMM', weight: 1.7, ...P(133.5, 0.3) },
      { name: 'Merck', symbol: 'MRK', weight: 1.6, ...P(114.2, -0.4) },
      { name: 'Disney', symbol: 'DIS', weight: 1.6, ticker: 'DISc' },
      { name: 'Walmart', symbol: 'WMT', weight: 1.4, ticker: undefined, ...P(77.4, 0.8) },
      { name: 'Nike', symbol: 'NKE', weight: 1.3, ticker: 'NKEc' },
      { name: 'Coca-Cola', symbol: 'KO', weight: 1.1, ticker: 'KOc' },
      { name: 'Cisco', symbol: 'CSCO', weight: 0.9, ...P(50.8, 0.6) },
      { name: 'Verizon', symbol: 'VZ', weight: 0.7, ...P(43.2, -0.1) },
    ],
  },
]

export const findIndex = (key: string | undefined): Index | undefined =>
  INDEXES.find((i) => i.key === key)

/** Where the pager goes from here. Wrapping, so Next always does something —
 *  three pages that stop dead at the third read as broken rather than as
 *  finished. Same argument as the company strip in 11g.63. */
export function beside(key: string): { prev: Index; next: Index } {
  const i = INDEXES.findIndex((x) => x.key === key)
  return {
    prev: INDEXES[(i - 1 + INDEXES.length) % INDEXES.length],
    next: INDEXES[(i + 1) % INDEXES.length],
  }
}

/** How many of an index's listed companies Tokkenly actually sells. The
 *  number the page states rather than leaves somebody to count. */
export const listedIn = (ix: Index): Member[] => ix.members.filter((m) => m.ticker)
