/** Where every figure in this product actually comes from.
 *
 *  Before this file, money appeared. `addMoney` did `state.cash += amount` and
 *  that was the whole of it: no bank was debited, nothing was owed to anybody
 *  in between, and the wallet went up the instant the button was pressed. The
 *  same was true in reverse of a withdrawal, and a share bought came from
 *  nowhere in particular. Every screen was honest about its own arithmetic and
 *  the product as a whole was not honest about anything.
 *
 *  So: double entry, and named accounts across three books.
 *
 *    theirs   accounts outside Tokkenly — a person's Nigerian bank, a card
 *             issuer, the Base network, the venue shares are bought from.
 *             Money entering the product comes from one of these and money
 *             leaving it goes to one.
 *    ours     Tokkenly's own — the naira account money is paid into, the one
 *             payouts leave from, the desk where the two currencies meet,
 *             fees, and the interest the pool pays and charges.
 *    yours    the balances the app shows: your wallet, what you have lent and
 *             what you owe.
 *
 *  Shares are in here too, and not as a dollar value — an account holding "the
 *  value of your Apple" would move every time the market did, which is not a
 *  thing a ledger account does. They are counted in shares, one currency per
 *  ticker, so a buy is two balanced postings: dollars from your wallet to the
 *  market, and Apple from the market to your custody. Sending a share to
 *  somebody moves the units and no money at all, which is exactly what it is.
 *
 *  A posting is a set of entries that sums to zero *in each currency it
 *  touches*. `post` refuses anything else, which is the whole point: a
 *  movement that would invent money does not throw at some later reconciliation
 *  — it does not happen. A currency conversion is two balanced postings, one
 *  in each currency, joined by the rate the person was shown; that is how a
 *  real ledger does it, because one entry cannot be denominated twice.
 *
 *  Balances are derived, never stored. There is no second copy of the truth to
 *  drift from the first.
 */

/** What an entry is denominated in. Two of these are money; the rest are
 *  tickers, one per company, because a share is a unit you can hold a number
 *  of and it balances exactly the way a currency does — what left the market
 *  arrived in somebody's custody, to four decimal places. */
export type Currency = string
export const MONEY: Currency[] = ['USD', 'NGN']

/** Which set of books an account belongs to. It decides how the statement
 *  groups it and, more usefully, makes "money came from outside" a thing you
 *  can ask the ledger rather than a thing you have to trust. */
export type Book = 'yours' | 'ours' | 'theirs'

export interface Account {
  id: string
  name: string
  currency: Currency
  book: Book
  /** What it is for, in one line, for the statement's own explanation. */
  what: string
}

/* ---------------------------------------------------------------------------
   The accounts.

   Fixed ones are listed; the ones that vary by counterparty — a particular
   bank, a particular company's shares — are made on demand and remembered, so
   the statement can name them without the ledger having to know every bank in
   Nigeria in advance.
   --------------------------------------------------------------------------- */

const FIXED: Account[] = [
  // yours
  { id: 'wallet', name: 'Your wallet', currency: 'USD', book: 'yours',
    what: 'Dollars you hold, as USDC on Base' },
  { id: 'lent', name: 'Your lending', currency: 'USD', book: 'yours',
    what: 'Dollars you have lent into the pool' },
  { id: 'loan', name: 'Borrowed', currency: 'USD', book: 'yours',
    what: 'Dollars drawn against your shares. Negative, because it is not yours' },
  { id: 'loan.int', name: 'Interest owed', currency: 'USD', book: 'yours',
    what: 'What the loan has cost so far, and not yet been paid' },

  // ours
  // Money that has left somebody's bank or card and has not reached us yet is
  // not ours and is not theirs. Before this account existed the product simply
  // pretended the gap was not there: the wallet went up the instant the button
  // was pressed, on a transfer that had not been made.
  { id: 'inflight', name: 'On its way to us', currency: 'NGN', book: 'ours',
    what: 'Naira that has left a bank or a card and has not arrived yet' },
  { id: 'collect', name: 'Tokkenly naira account', currency: 'NGN', book: 'ours',
    what: 'Where naira paid to us sits before it is converted' },
  { id: 'payout', name: 'Tokkenly payout account', currency: 'NGN', book: 'ours',
    what: 'Where naira waits while a payout is on its way out' },
  { id: 'desk.ngn', name: 'Currency desk, naira', currency: 'NGN', book: 'ours',
    what: 'One side of every conversion' },
  { id: 'desk.usd', name: 'Currency desk, dollars', currency: 'USD', book: 'ours',
    what: 'The other side of every conversion' },
  { id: 'fees', name: 'Tokkenly fees', currency: 'USD', book: 'ours',
    what: 'What we charged, and nothing else' },
  // A card fee is charged in naira, on the naira, because that is the currency
  // the card network takes it in. It cannot be folded into the dollar fee
  // account: a posting has to come to nothing in every currency it touches.
  { id: 'fees.ngn', name: 'Tokkenly fees, naira', currency: 'NGN', book: 'ours',
    what: 'What a card charge cost, in the currency it was charged in' },
  { id: 'interest', name: 'Interest we pay and charge', currency: 'USD', book: 'ours',
    what: 'What the pool pays lenders, and what borrowers pay it' },

  // theirs
  { id: 'chain', name: 'Base network', currency: 'USD', book: 'theirs',
    what: 'Wallets outside Tokkenly' },
  { id: 'market', name: 'The market', currency: 'USD', book: 'theirs',
    what: 'Where a tokenised share is bought and sold' },
  // Not a fiction: this account is where the balances this record does not
  // contain came from. An opening position has a history, and a prototype
  // that pretends otherwise is the thing this file exists to stop.
  { id: 'opening', name: 'Before this record', currency: 'USD', book: 'theirs',
    what: 'What the account already held when the ledger starts' },
  { id: 'opening.ngn', name: 'Before this record', currency: 'NGN', book: 'theirs',
    what: 'What the account already held when the ledger starts' },
]

const made = new Map<string, Account>()
for (const a of FIXED) made.set(a.id, a)

/** A counterparty account, named the first time it is used. `bank:gt` is your
 *  GTBank account; `payee:Tunde Bakare` is somebody else's. */
export function account(id: string, name?: string): Account {
  const found = made.get(id)
  if (found) return found
  const [kind, rest] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)]
  const spec: Record<string, Omit<Account, 'id' | 'name'>> = {
    bank: { currency: 'NGN', book: 'theirs', what: 'A bank account in your own name' },
    card: { currency: 'NGN', book: 'theirs', what: 'A card you have added' },
    payee: { currency: 'NGN', book: 'theirs', what: 'Somebody else’s bank account' },
    person: { currency: 'USD', book: 'theirs', what: 'Another Tokkenly account' },
  }
  // Share accounts carry the ticker as their currency: `held:AAPL` is what is
  // in custody for you, `float:AAPL` is what the market has, `sent:AAPL` is
  // what has gone to somebody else, and `open:AAPL` is what was already there
  // when this record starts.
  const SHARES: Record<string, { book: Book; name: (t: string) => string; what: string }> = {
    held: { book: 'yours', name: (t) => t + ' held for you',
      what: 'Tokenised shares a custodian holds in your name' },
    float: { book: 'theirs', name: (t) => t + ' on the market',
      what: 'Shares the market has, before or after you own them' },
    sent: { book: 'theirs', name: (t) => t + ' sent away',
      what: 'Shares handed to another Tokkenly account' },
    open: { book: 'theirs', name: (t) => t + ' before this record',
      what: 'Shares the account already held when the ledger starts' },
  }
  const share = SHARES[kind]
  if (share) {
    const acc: Account = {
      id, currency: rest, book: share.book,
      name: name ?? share.name(rest), what: share.what,
    }
    made.set(id, acc)
    return acc
  }
  const s = spec[kind] ?? { currency: 'USD' as Currency, book: 'theirs' as Book, what: 'An account' }
  const acc: Account = { id, name: name ?? rest ?? id, ...s }
  made.set(id, acc)
  return acc
}

export const accounts = (): Account[] => [...made.values()]

/* ---------------------------------------------------------------------------
   Postings.
   --------------------------------------------------------------------------- */

export interface Entry {
  /** An account id. Positive is into the account, negative is out of it. */
  account: string
  amount: number
}

export interface Posting {
  ref: string
  at: string
  /** What happened, in the words the person would use. */
  what: string
  /** What kind of movement it was, for the few figures that are a running
   *  total of one kind rather than the balance of an account. */
  kind?: string
  entries: Entry[]
  /** The rate honoured, on the two postings that make up a conversion. */
  rate?: number
  /** Ties the two halves of a conversion together. */
  pair?: string
}

const book: Posting[] = []

export const postings = (): readonly Posting[] => book

/** Sums to zero in every currency it touches, or it does not happen.
 *
 *  Thrown rather than logged. A prototype that quietly tolerates an unbalanced
 *  movement is a prototype that will ship one, and the whole reason this file
 *  exists is that the product used to invent money without noticing. */
export function post(p: Posting): Posting {
  const per = new Map<Currency, number>()
  for (const e of p.entries) {
    const c = account(e.account).currency
    per.set(c, Math.round(((per.get(c) ?? 0) + e.amount) * 1e6) / 1e6)
  }
  for (const [currency, sum] of per) {
    if (Math.abs(sum) > 1e-6) {
      throw new Error(
        `${p.what}: ${currency} entries come to ${sum}, not zero. ` +
        'A movement with one end invents money.',
      )
    }
  }
  book.push(p)
  return p
}

/** What an account holds now. Derived every time, from the postings. */
export function balanceOf(id: string): number {
  let n = 0
  for (const p of book) for (const e of p.entries) if (e.account === id) n += e.amount
  return Math.round(n * 1e6) / 1e6
}

/** A running total of one kind of movement, for the two or three figures that
 *  are a history rather than a balance — interest paid to you so far is not
 *  the balance of anything, because it was spent the moment it landed. */
export function paidOf(kind: string): number {
  let n = 0
  for (const p of book) {
    if (p.kind !== kind) continue
    for (const e of p.entries) if (e.account === 'wallet') n += e.amount
  }
  return Math.round(n * 1e6) / 1e6
}

/** The naira half of a conversion, and the rate it was honoured at.
 *
 *  A receipt for money that changed currency has to state both figures, and it
 *  has to state the rate that was actually used rather than today's — a record
 *  written a fortnight ago at ₦1,494 that reprints itself at whatever the rate
 *  is this morning is not a record. Both halves of a conversion share a `pair`
 *  and carry the rate, so the document reads it off the ledger rather than
 *  multiplying the dollars by a number it found lying around. */
export function conversion(ref: string): { naira: number; rate: number } | null {
  let rate = 0
  let ngn = 0
  for (const p of book) {
    if (p.ref !== ref || !p.rate) continue
    rate = p.rate
    for (const e of p.entries) {
      if (account(e.account).currency === 'NGN' && e.amount > 0) ngn = Math.max(ngn, e.amount)
    }
  }
  return rate && ngn ? { naira: ngn, rate } : null
}

/** Everything that touched one account, newest first. */
export const touching = (id: string): Posting[] =>
  book.filter((p) => p.entries.some((e) => e.account === id)).reverse()

/** The proof. Every account, its book, and what it holds — which is the whole
 *  claim this file makes, in a form somebody can check. Within a currency the
 *  three books have to come to nothing between them: what is yours and ours is
 *  exactly what came in from theirs. */
export interface Trial {
  currency: Currency
  rows: { account: Account; balance: number }[]
  sum: number
}

export function trial(): Trial[] {
  const out: Trial[] = []
  const seen = new Set<Currency>(MONEY)
  for (const a of accounts()) if (Math.abs(balanceOf(a.id)) > 1e-6) seen.add(a.currency)
  for (const currency of seen) {
    const rows = accounts()
      .filter((a) => a.currency === currency)
      .map((a) => ({ account: a, balance: balanceOf(a.id) }))
      .filter((r) => Math.abs(r.balance) > 1e-6)
    const sum = Math.round(rows.reduce((t, r) => t + r.balance, 0) * 1e6) / 1e6
    out.push({ currency, rows, sum })
  }
  return out
}

/** Every ticker the account actually holds, and how many, derived the same way
 *  the wallet is. The holdings list is built from this rather than kept beside
 *  it, so a share cannot exist in the portfolio without a movement that put it
 *  there. */
export function held(): { ticker: Currency; shares: number }[] {
  const out: { ticker: Currency; shares: number }[] = []
  for (const a of accounts()) {
    if (!a.id.startsWith('held:')) continue
    const n = balanceOf(a.id)
    if (n > 1e-6) out.push({ ticker: a.currency, shares: n })
  }
  return out
}

/** Wipes the book. Only the seed uses this, and only before anything is read. */
export function reset(): void { book.length = 0 }
