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
  // One purse per asset. Two of them are dollars and they are still two
  // accounts: USDC and USDT are different instruments with different issuers,
  // and a product that could not tell you which of the two you held would be a
  // product that had lost track of one of them. The third is naira, which is
  // not a token at all — it is money in a bank rail, and it is here because
  // somebody paid for airtime out of it.
  { id: 'wallet.usdc', name: 'Your USDC', currency: 'USD', book: 'yours',
    what: 'Dollars you hold, issued by Circle' },
  { id: 'wallet.usdt', name: 'Your USDT', currency: 'USD', book: 'yours',
    what: 'Dollars you hold, issued by Tether' },
  { id: 'wallet.ngn', name: 'Your naira', currency: 'NGN', book: 'yours',
    what: 'Naira you hold, in your Tokkenly account' },
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
  // One per network, not one for "the chain". Where money went is the fact a
  // person checks a record for, and "outside Tokkenly" does not answer it —
  // a payment on TRON and a payment on Ethereum cost different money, take
  // different time, and go wrong in different ways.
  { id: 'chain.base', name: 'Base network', currency: 'USD', book: 'theirs',
    what: 'Wallets outside Tokkenly, on Base' },
  { id: 'chain.tron', name: 'TRON network', currency: 'USD', book: 'theirs',
    what: 'Wallets outside Tokkenly, on TRON' },
  { id: 'chain.ethereum', name: 'Ethereum network', currency: 'USD', book: 'theirs',
    what: 'Wallets outside Tokkenly, on Ethereum' },
  { id: 'market', name: 'The market', currency: 'USD', book: 'theirs',
    what: 'Where a tokenised share is bought and sold' },
  // Airtime, data and a meter are all naira paid to somebody who is not us,
  // through the partner that reaches them. One account rather than one per
  // network: the statement names the network in the line, and a ledger with
  // an account per telco is a ledger that has confused a counterparty with a
  // category.
  { id: 'biller', name: 'Bill partners', currency: 'NGN', book: 'theirs',
    what: 'Networks and discos paid on your behalf' },
  // Not a fiction: this account is where the balances this record does not
  // contain came from. An opening position has a history, and a prototype
  // that pretends otherwise is the thing this file exists to stop.
  { id: 'opening', name: 'Before this record', currency: 'USD', book: 'theirs',
    what: 'What the account already held when the ledger starts' },
  { id: 'opening.ngn', name: 'Before this record', currency: 'NGN', book: 'theirs',
    what: 'What the account already held when the ledger starts' },
]

/** One of the balances the app calls "your money". Asked rather than compared
 *  against a name, because there are three of them now and every reader that
 *  spelled out `'wallet'` was a reader that would silently stop seeing two
 *  thirds of somebody's money. */
export const isPurse = (id: string): boolean => id.startsWith('wallet.')

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
      what: 'Shares held for you by the firm that holds the real shares' },
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

/** Which accounts are allowed to go below nothing.
 *
 *  Everything outside the product can: a bank we have debited, the market, a
 *  network, the opening position — their balances here are only the part of
 *  them this record has seen, and a negative figure means money came from
 *  them. So can the two accounts that are a debt by definition, the loan and
 *  the interest on it, and the desk, whose two halves are apart for a moment
 *  in every conversion. What cannot is anything that is yours to spend or ours
 *  to hold: a purse, what you have lent, what is in custody for you, and the
 *  accounts money waits in between two banks. A movement that would take one
 *  of those below nothing is a movement spending money that is not there, and
 *  it is refused here, under every screen and every action, rather than
 *  trusted to each of them. */
const MAY_GO_NEGATIVE = new Set(['loan', 'loan.int', 'desk.usd', 'desk.ngn', 'interest'])
export const mayGoNegative = (id: string): boolean =>
  MAY_GO_NEGATIVE.has(id) || account(id).book === 'theirs'

/** A cached balance per account, kept up to date as postings are written.
 *  Every figure on every screen is a balance, and deriving each of them by
 *  walking every posting ever made meant the wallet was read by scanning the
 *  whole book a dozen times per render. The book is still the truth — this is
 *  rebuilt from it on a reset or a restore — it is just not re-read for every
 *  question. */
const balances = new Map<string, number>()
/** And the running totals by kind, for `paidOf`, for the same reason. */
const paid = new Map<string, number>()
/** Bumped on every posting, so a reading derived from the book (a holding, a
 *  cost basis) can be kept until the book has actually changed. */
let version = 0
export const ledgerVersion = (): number => version

const round6 = (n: number): number => Math.round(n * 1e6) / 1e6

function apply(p: Posting): void {
  for (const e of p.entries) {
    balances.set(e.account, round6((balances.get(e.account) ?? 0) + e.amount))
    if (p.kind && isPurse(e.account)) paid.set(p.kind, round6((paid.get(p.kind) ?? 0) + e.amount))
  }
  version += 1
}

/** Why a movement was refused. Thrown, not returned: the action that asked
 *  for it cannot have meant to carry on. */
export class Refused extends Error {}

/** Sums to zero in every currency it touches, or it does not happen.
 *
 *  Thrown rather than logged. A prototype that quietly tolerates an unbalanced
 *  movement is a prototype that will ship one, and the whole reason this file
 *  exists is that the product used to invent money without noticing.
 *
 *  Three more refusals sit beside that one. An amount that is not a finite
 *  number is refused before anything is summed: NaN compares false against
 *  every tolerance, so a movement of NaN dollars used to pass the zero-sum
 *  check and write NaN into a wallet. A posting with no entries is refused,
 *  because it records nothing. And a posting that would take one of your
 *  balances, or one of ours, below nothing is refused — see
 *  `MAY_GO_NEGATIVE` — which is the floor under every overdraw a screen
 *  failed to stop. `floor: false` is for replaying history only. */
export function post(p: Posting, opts: { floor?: boolean } = {}): Posting {
  if (!p.entries.length) throw new Refused(`${p.what}: a movement with no entries records nothing.`)
  const per = new Map<Currency, number>()
  for (const e of p.entries) {
    if (typeof e.amount !== 'number' || !Number.isFinite(e.amount)) {
      throw new Refused(`${p.what}: ${String(e.amount)} is not an amount of money.`)
    }
    const c = account(e.account).currency
    per.set(c, round6((per.get(c) ?? 0) + e.amount))
  }
  for (const [currency, sum] of per) {
    if (Math.abs(sum) > 1e-6) {
      throw new Error(
        `${p.what}: ${currency} entries come to ${sum}, not zero. ` +
        'A movement with one end invents money.',
      )
    }
  }
  // What each account would hold afterwards, summed per account first so a
  // posting that touches the same account twice is judged on where it ends.
  const net = new Map<string, number>()
  for (const e of p.entries) net.set(e.account, (net.get(e.account) ?? 0) + e.amount)
  // The replay of history is the one caller that turns the floor off: the
  // opening position is worked out so the replay *ends* at today's balances,
  // and a row from last month can pass through a figure below nothing on the
  // way without anybody having spent money that was not there.
  for (const [id, delta] of opts.floor === false ? [] : net) {
    if (delta >= 0 || mayGoNegative(id)) continue
    const after = round6((balances.get(id) ?? 0) + delta)
    // A hundredth of a cent of slack, for the rounding every division leaves.
    if (after < -1e-4) {
      throw new Refused(`${p.what}: ${account(id).name} holds ${round6(balances.get(id) ?? 0)}, `
        + `which is less than the ${round6(-delta)} this would take out of it.`)
    }
  }
  book.push(p)
  apply(p)
  return p
}

/** What an account holds now. Read off the running balance, which is kept in
 *  step with the postings by `post` and rebuilt from them by `reset` and
 *  `restore`. */
export function balanceOf(id: string): number {
  return balances.get(id) ?? 0
}

/** Undoes one movement by writing its opposite.
 *
 *  Nothing is deleted from the book, because a record that can be rewritten
 *  is not a record: a payment that went out and came back is two lines, and
 *  both of them happened. Every posting under the reference is negated as it
 *  was written, so each one still balances in each of its currencies. */
export function reverse(ref: string, what: string, at = new Date().toISOString()): void {
  const mine = book.filter((x) => x.ref === ref)
  // Newest first, so a two-stage movement is unwound in the order it would
  // have to be: the naira back to the desk before the dollars back to you.
  for (const x of [...mine].reverse()) {
    post({ ref, at, what, kind: x.kind ? x.kind + '.reversed' : undefined,
           entries: x.entries.map((e) => ({ account: e.account, amount: -e.amount })) })
  }
}

/** A running total of one kind of movement, for the two or three figures that
 *  are a history rather than a balance — interest paid to you so far is not
 *  the balance of anything, because it was spent the moment it landed. */
export function paidOf(kind: string): number {
  return paid.get(kind) ?? 0
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

/** What a position cost, and what each share cost on average.
 *
 *  Not stored on the holding. Cost basis is a reading of the trades that built
 *  the position, exactly like the quantity: every posting that put shares into
 *  custody carries the dollars that bought them on the same movement, so the
 *  two can be walked together and cannot drift apart.
 *
 *  Weighted average, not FIFO. A person asking "am I up on Apple" wants one
 *  number, and a sale reduces the cost proportionally rather than picking
 *  which lot went — which is also what makes the figure stable when they sell
 *  half and the price moves afterwards.
 */
const basisCache = new Map<Currency, { at: number; value: { cost: number; shares: number; each: number } }>()

export function basis(ticker: Currency): { cost: number; shares: number; each: number } {
  // Walking the book is the only honest way to arrive at this figure, and it
  // only changes when the book does — so it is walked once per change rather
  // than once per render of every screen that shows a gain.
  const hit = basisCache.get(ticker)
  if (hit && hit.at === version) return hit.value
  const value = walkBasis(ticker)
  basisCache.set(ticker, { at: version, value })
  return value
}

function walkBasis(ticker: Currency): { cost: number; shares: number; each: number } {
  let shares = 0
  let cost = 0
  for (const p of book) {
    const leg = p.entries.find((e) => e.account === 'held:' + ticker)
    if (!leg) continue
    if (leg.amount > 0) {
      shares += leg.amount
      // The opening posting is one movement carrying every account the replay
      // could not reach — the wallet, the lending, and every ticker — so its
      // wallet leg has nothing to do with its Apple leg. Reading one as the
      // price of the other put the average cost at −$39.87 a share. What marks
      // it is its own counter-account: a posting that balances Apple against
      // "Apple before this record" is an opening position, and is priced at
      // the assumed cost rather than at whatever else is in the same movement.
      const opened = p.entries.some((e) => e.account === 'open:' + ticker)
      const money = opened ? undefined : p.entries.find((e) => isPurse(e.account))
      cost += money ? -money.amount : leg.amount * (openingCost.get(ticker) ?? 0)
    } else {
      const out = Math.min(-leg.amount, shares)
      if (shares > 1e-9) cost -= (cost / shares) * out
      shares -= out
    }
  }
  shares = Math.round(shares * 1e6) / 1e6
  cost = Math.round(cost * 100) / 100
  return { cost, shares, each: shares > 1e-9 ? cost / shares : 0 }
}

/** What the account is assumed to have paid for the shares it already held
 *  when the ledger starts. Set by the seed, because the alternative is a
 *  portfolio that opens showing a hundred per cent gain. */
const openingCost = new Map<Currency, number>()
export const setOpeningCost = (ticker: Currency, each: number): void => {
  openingCost.set(ticker, each)
}

/** Wipes the book. Only the seed and a restore use this, and only before
 *  anything is read. */
export function reset(): void {
  book.length = 0
  openingCost.clear()
  balances.clear()
  paid.clear()
  basisCache.clear()
  version += 1
}

/* ---------------------------------------------------------------------------
   Keeping it.

   The book used to be rebuilt from the seed on every load, so a reload undid
   every payment made since — and a receipt opened after the reload pointed at
   a movement that no longer existed. It is kept now, as the postings
   themselves plus the names of the accounts made on the way, because those
   are the whole of it: every balance is derived from them.
   --------------------------------------------------------------------------- */

export interface Snapshot {
  postings: Posting[]
  names: [string, string][]
  opening: [Currency, number][]
}

export function snapshot(): Snapshot {
  return {
    postings: book.map((p) => ({ ...p, entries: p.entries.map((e) => ({ ...e })) })),
    names: [...made.values()].filter((a) => a.id.includes(':')).map((a) => [a.id, a.name]),
    opening: [...openingCost.entries()],
  }
}

/** Puts a kept book back, or refuses it whole. Every posting goes back through
 *  `post`, so a saved book that does not balance, holds a NaN, or overdraws a
 *  purse is not restored at all — half a ledger is worse than the seed. */
export function restore(s: Snapshot): boolean {
  const kept = book.slice()
  const keptOpening = [...openingCost.entries()]
  try {
    if (!s || !Array.isArray(s.postings) || !Array.isArray(s.names) || !Array.isArray(s.opening)) {
      throw new Error('not a book')
    }
    reset()
    for (const [id, name] of s.names) {
      if (typeof id === 'string' && typeof name === 'string') account(id, name)
    }
    for (const [t, each] of s.opening) {
      if (typeof t === 'string' && Number.isFinite(each)) openingCost.set(t, each)
    }
    for (const p of s.postings) {
      if (!p || typeof p.ref !== 'string' || typeof p.at !== 'string' || typeof p.what !== 'string'
          || !Array.isArray(p.entries)) throw new Error('not a posting')
      post({
        ref: p.ref, at: p.at, what: p.what,
        kind: typeof p.kind === 'string' ? p.kind : undefined,
        rate: typeof p.rate === 'number' && Number.isFinite(p.rate) ? p.rate : undefined,
        pair: typeof p.pair === 'string' ? p.pair : undefined,
        entries: p.entries.map((e) => ({ account: String(e.account), amount: Number(e.amount) })),
      }, { floor: false })
    }
    // History may pass below nothing on the way (see `post`); where it ends
    // may not.
    for (const [id, n] of balances) {
      if (n < -1e-4 && !mayGoNegative(id)) throw new Error(id + ' ends below nothing')
    }
    return true
  } catch {
    reset()
    for (const [t, each] of keptOpening) openingCost.set(t, each)
    for (const p of kept) { book.push(p); apply(p) }
    return false
  }
}
