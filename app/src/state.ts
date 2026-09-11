/** The one source of truth. Every figure the screens show is derived from
 *  here, so a flow that moves money changes every screen that mentions it.
 *  Opening figures match design.md 11b.4f. */

import { reference, usd, naira, shares as sharesOf } from './format'
import { CATALOGUE, find, tradable, refusals, type Refusal, type Instrument } from './catalogue'
import * as ledger from './ledger'
import { tokenFor } from './bills'
import { purseFor, assetOf, defaultNet, type Asset } from './assets'

export type ActivityKind = 'payment' | 'trade' | 'grow'

export interface Activity {
  ref: string
  kind: ActivityKind
  who: string
  type: string
  amount: number          // signed, in dollars
  at: string              // ISO
  note?: string
  /** What this movement cost, in dollars. Recorded rather than recomputed:
   *  the receipt for a trade made last month has to state the fee that was
   *  charged then, not the fee the rate would give today. Absent means the
   *  movement was free, which is most of them. */
  fee?: number
  /** Which way money came in. A deposit is a bank transfer, a Base payment or
   *  a card charge, and Add money lists them a tab at a time — which cannot be
   *  worked out from the payer's name without guessing that anybody called
   *  "Payroll" used a bank. Only inbound payments carry it. */
  rail?: 'bank' | 'base' | 'card'
  /** What actually moved, when it was not money. A share sent to another
   *  person has a dollar value — the row has to show one, and the portfolio
   *  really did fall by it — but the thing that changed hands is a number of
   *  shares in a named company, and a receipt that only says "−$224.10" is a
   *  receipt for the wrong event. Recorded at the price of the day, like the
   *  fee, because the value of what was sent is not what it is worth now. */
  asset?: { ticker: string; shares: number; price: number }
  /** What was actually bought, when it was not money and not a share. A
   *  recharge is a payment of dollars whose subject is a phone number, and a
   *  receipt that says "−$3.34 to MTN" is a receipt for the wrong event:
   *  the fact somebody keeps it for is which number it went to, and on a
   *  prepaid meter it is the twenty digits they have to type into the wall.
   *  Recorded on the movement rather than derived, for the same reason `asset`
   *  is — the token is a function of the reference and the reference does not
   *  change, but the network's name and the meter's owner are facts about the
   *  day it was paid. */
  bill?: { target: string; naira: number; token?: string }
  /** Which of the three balances this moved — out on a payment, in on a
   *  deposit. Recorded rather than assumed: "$45 to Tunde" does not say
   *  whether the USDC or the USDT went, and somebody looking at two dollar
   *  balances that no longer add up wants the answer from the record rather
   *  than from arithmetic. Absent on the movements where nothing was chosen
   *  — interest paid in, a drawdown — which take the default. */
  purse?: Asset
  /** Which network it travelled on, for the movements that travelled. A
   *  payment on TRON and a payment on Ethereum cost different money and go
   *  wrong in different ways, so "on the chain" is not an answer. */
  net?: string
  settled: boolean
}

/** Everything the person can decide about how the product behaves. Grouped
 *  rather than scattered through State so the Account screen has one thing to
 *  read and one thing to reset. */
export interface Prefs {
  /** Where Home opens. Simple is three doors and the number; Detailed is the
   *  chart, the positions and the rest. */
  homeView: 'simple' | 'detailed'
  /** What you pay with unless you say otherwise, and what a price is quoted
   *  in. One setting rather than two, because they are one decision: somebody
   *  whose money is in naira wants to be told what things cost in naira, and
   *  somebody holding USDC does not want a second figure under every price.
   *  A composer can be overridden for one payment; doing so does not move
   *  this. */
  payWith: Asset
  theme: 'dark' | 'light'
  /** The product is for Nigerians holding dollars, so the naira line beside a
   *  figure is the setting people actually change. */
  showNaira: boolean
  /** What "Add to bucket" puts against a company before you edit it. */
  tradeDefault: number
  /** Ask again, above this, before anything leaves. 0 turns it off. */
  confirmOver: number
  /** Take your balances off the screen. People check their money on buses and
   *  in queues here, and a $16,229 figure at 48px is readable from the next
   *  seat. Prices, rates and limits are not covered: they are public, and
   *  hiding them helps nobody. */
  hideBalances: boolean
  /** Which of Home's standing reminders have been put away. A reminder you
   *  cannot dismiss is an advert, and this one is on the screen the product
   *  opens on — but it is also the thing that lifts a limit, so it is put away
   *  deliberately rather than by a stray tap, and there is a way back to it.
   *  A preference, so it survives a reload and one control brings them back. */
  putAway: string[]
  notify: { payments: boolean; prices: boolean; earn: boolean; borrowing: boolean }
}

export const DEFAULT_PREFS: Prefs = {
  homeView: 'simple',
  payWith: 'usdc',
  theme: 'dark',
  showNaira: true,
  tradeDefault: 50,
  confirmOver: 500,
  hideBalances: false,
  putAway: [],
  notify: { payments: true, prices: true, earn: true, borrowing: true },
}

/** How the account is locked, and what it is locked with. This was four
 *  switches on the Security screen that flipped a local variable and toasted
 *  — a security screen that lies about its own state is worse than none, so
 *  every one of them reads and writes here now.
 *
 *  The PIN and the password are held in the clear because this is a prototype
 *  with no server. A real one sends the password and never stores it, and
 *  keeps the PIN in the device's secure enclave. The shapes are the same. */
export interface Security {
  /** Four digits. The product asks for it to unlock and to authorise anything
   *  over the ask-again figure. */
  pin: string
  pinChanged: string
  password: string
  passwordChanged: string
  faceId: boolean
  /** Whether opening the app asks for the PIN at all. */
  appLock: boolean
  /** Wrong attempts since the last correct one. Five locks the challenge. */
  wrongPin: number
}

export const DEFAULT_SECURITY: Security = {
  pin: '4193',
  pinChanged: '24 August 2026',
  password: 'harmattan evening walk',
  passwordChanged: '2 July 2026',
  faceId: true,
  appLock: true,
  wrongPin: 0,
}

/** The four digits nobody should be allowed to choose. Not a strength meter —
 *  a PIN has 10,000 possibilities and a meter on four digits is theatre — but
 *  these five patterns are what a thief tries first, and roughly a quarter of
 *  real PINs are in this set. */
export function weakPin(pin: string, dob = ''): string | null {
  if (!/^\d{4}$/.test(pin)) return null
  if (/^(\d)\1{3}$/.test(pin)) return 'Four of the same number is the first thing anyone tries.'
  const d = pin.split('').map(Number)
  const run = (step: number) => d.every((n, i) => i === 0 || n === (d[i - 1] + step + 10) % 10)
  if (run(1)) return 'Four in a row is the second thing anyone tries.'
  if (run(-1)) return 'Four in a row backwards is no harder to guess than forwards.'
  if (d[0] === d[2] && d[1] === d[3]) return 'A repeated pair is easy to read over your shoulder.'
  // A year between 1930 and this year is a date of birth, and a date of birth
  // is on the card in the same wallet as the phone.
  const year = Number(pin)
  if (year >= 1930 && year <= 2026) return 'That looks like a year. Anyone who knows your age can guess it.'
  const born = dob.match(/\b(19|20)\d{2}\b/)
  if (born && pin === born[0]) return 'That is the year you were born.'
  return null
}

/** Length beats composition. A rule demanding a symbol produces Password1!,
 *  which is short, guessable and universally hated; length is what actually
 *  costs an attacker time. So: a floor, a blocklist of what people pick
 *  anyway, and a sentence saying what would make it better. */
const COMMON = [
  'password', '12345678', 'qwertyui', 'iloveyou', 'letmein', 'welcome',
  'football', 'password1', 'abc12345', 'sunshine', 'princess',
  'tokkenly', 'nigeria', 'lagos', 'monkey', 'dragon', 'admin',
]

export interface PasswordVerdict { ok: boolean; text: string; rank: 'weak' | 'fair' | 'strong' }

export function ratePassword(v: string, person = ''): PasswordVerdict {
  const low = v.toLowerCase()
  if (v.length < 10) {
    return { ok: false, rank: 'weak',
      text: `Ten characters at least. ${10 - v.length} to go.` }
  }
  if (COMMON.some((c) => low.includes(c))) {
    return { ok: false, rank: 'weak',
      text: 'That contains one of the passwords people pick most. Anything else is safer.' }
  }
  if (person && low.includes(person.toLowerCase().split(' ')[0])) {
    return { ok: false, rank: 'weak', text: 'Your own name is the first guess anybody makes.' }
  }
  if (/^(.)\1+$/.test(v)) {
    return { ok: false, rank: 'weak', text: 'One character repeated is one character long.' }
  }
  if (v.length >= 16) {
    return { ok: true, rank: 'strong',
      text: 'Strong. Long enough that length alone protects it.' }
  }
  return { ok: true, rank: 'fair',
    text: 'Good. A few more words would make it much harder to guess.' }
}

export interface Kyc {
  status: 'none' | 'checking' | 'verified'
  method?: 'NIN' | 'BVN'
  checkedOn?: string
  /** The last four digits, which is all a person needs to recognise it. */
  last4?: string
}

/** What an account can move in a month and in one go, before and after the
 *  check. One pair of numbers, read everywhere, so the limits card and the
 *  thing that actually stops a payment cannot drift apart. */
export const LIMITS = {
  none: { monthly: 1000, single: 250 },
  verified: { monthly: 10000, single: 2500 },
}

/** The account's address on Base. On a tokenised product this is closer to
 *  identity than to a setting — it is what somebody pays to and what a block
 *  explorer knows you by — so it lives here rather than as a literal inside
 *  the Receive screen, where the profile could not reach it. */
export const WALLET = '0x7a3F4b91Ce2D8a06F5b17d3E4c8B29aA5f0e9c21'

export interface BucketItem {
  ticker: string
  dollars: number
}

export interface Holding {
  ticker: string
  name: string
  shares: number
  price: number
  dayPct: number
  /** What the position cost in total, and what one share of it cost on
   *  average. Both derived from the trades that built it. */
  cost: number
  each: number
  /** What it is worth now against what it cost. The figure a person actually
   *  came to the screen for, and the one the portfolio never showed. */
  gain: number
  gainPct: number
}

export interface Notif {
  id: string
  kind: 'money' | 'trade' | 'grow' | 'security'
  title: string
  body: string
  at: string
  read: boolean
  /** What it is about. A notification that says money arrived and then does
   *  nothing when you press it is a dead end — the row is the shortest route
   *  anybody has to the receipt. `ref` opens that receipt in place; `to` is
   *  for the ones that are not about a transaction. */
  ref?: string
  to?: string
  /** Whether this also went out as an email, and why.
   *
   *  Some of these are ours to choose and some are not: a completed or failed
   *  financial action and a security event go out whatever the switches say,
   *  because a person who has lost access to the app is exactly the person who
   *  needs to be told. Saying which is which on the row is what stops
   *  "unsubscribe" being a promise the product cannot keep. */
  emailed?: 'always' | 'preference' | false
}

/** Identity, and permission, which are not the same thing.
 *
 *  The spec is explicit that KYC approval must be kept separate from
 *  permission to use the investment product, and it is right: an identity
 *  check answers "are you who you say", and eligibility answers "may this
 *  person, in this country, hold this instrument". A product that folds them
 *  into one boolean has no way to say "we know exactly who you are and you
 *  still cannot buy this", which is the commonest real answer.
 *
 *  Five checks, each with its own state, because a person who fails one wants
 *  to know which and a support agent needs to know before they pick up. */
export type CheckState = 'pending' | 'passed' | 'failed' | 'review'

export interface Check {
  key: 'identity' | 'age' | 'residence' | 'sanctions' | 'product'
  label: string
  what: string
  state: CheckState
  /** What the check actually returned, in the words a person could repeat to
   *  support. Empty while it has not run. */
  detail: string
  at?: string
}

export interface Bank {
  id: string
  name: string
  last4: string
  holder: string
  /** The whole number, because a payout names one and a person checks it.
   *  Nigerian account numbers are ten digits, always. */
  number: string
}

/** A card on file. Naira in, at the speed a card moves, which is the whole
 *  reason it is here beside the transfer: one route is instant and costs
 *  something, the other is free and takes a minute. */
export interface Card {
  id: string
  brand: string
  last4: string
  expiry: string
  holder: string
}

/** The naira account money is paid into.
 *
 *  Not a shared account with a reference on it. Every Nigerian payments
 *  provider issues a dedicated virtual account per customer, which is why a
 *  transfer needs no reference at all: the account number *is* the reference,
 *  and money reaching it can only be yours. It is a permanent detail of the
 *  account, not a thing generated per payment, so it sits in state beside the
 *  Base address rather than being made up at the review. */
export interface VirtualAccount {
  bank: string
  number: string
  name: string
}

/* --------------------------------------------------------------- sending --
   Where money is going, which is the only question Send actually asks.

   There used to be two screens: Send, for a person or an address, and
   Withdraw, for your own bank. They were one errand wearing two names — both
   take dollars out of the same wallet — and the split hid the thing that
   really differs, which is that a payout into naira is a conversion and the
   other two are not. */
export type Rail = 'tokkenly' | 'chain' | 'bank'

export interface Destination {
  rail: Rail
  /** What it is called on screen: a person, a shortened address, an account
   *  holder's name as the bank returned it. */
  name: string
  /** One of your own banks, when it is one of your own. */
  bankId?: string
  /** For a bank payout: which bank, and the ten digits. */
  bank?: string
  number?: string
}

/** Whose account that number is.
 *
 *  Every Nigerian transfer asks this before it asks anything else: you type
 *  ten digits, the bank returns a name, and you check it against the person
 *  you meant to pay. It is the one step that catches a wrong digit before the
 *  money is gone, and a product that moves naira without it is missing the
 *  safety rail everybody in that market already expects.
 *
 *  Deterministic, like the rest of the failure model: ten digits or it is not
 *  a number, and a number ending 99 resolves to nobody — so the refusal is on
 *  a path anybody can walk rather than a state nobody has seen. */
const HOLDERS = [
  'ADAEZE NGOZI OKONKWO', 'TUNDE OLUWASEUN BAKARE', 'CHIDI EMEKA NWOSU',
  'NGOZI AMARA EZE', 'IBRAHIM SULEIMAN BELLO', 'FATIMA AISHA YUSUF',
  'OLUWATOBI DANIEL ADEYEMI', 'BLESSING CHIOMA UDE', 'MUSA GARBA ALIYU',
  'KEHINDE FOLASADE LAWAL',
]

export function resolveAccount(number: string): string | null {
  const digits = number.replace(/\D/g, '')
  if (digits.length !== 10) return null
  const own = state.banks.find((b) => b.number === digits)
  if (own) return own.holder.toUpperCase()
  if (digits.slice(-2) === '99') return null
  return HOLDERS[Number(digits.slice(-1))]
}

/** What is on its way in and has not landed. Derived, like everything else:
 *  it is the balance of the account the money sits in between the two banks,
 *  not a number kept beside the row that is waiting. */
export const inflightNaira = (): number => ledger.balanceOf('inflight')

/** And what is on its way out: naira that left the desk and have not reached
 *  anybody's bank yet. The other half of the same honesty. */
export const outboundNaira = (): number => ledger.balanceOf('payout')

/** The transaction on Base, for the movements that have one.
 *
 *  A product settling on a public chain has one thing a bank does not: the
 *  movement is checkable by somebody who does not trust you. Hiding that is
 *  throwing away the single best argument the product has, so every movement
 *  that touched the chain carries a hash and every receipt links to it.
 *
 *  Derived from the reference rather than stored, because this is a prototype
 *  and a made-up hash that changes on every render would be worse than an
 *  honest deterministic one. */
export function txHash(ref: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < ref.length; i++) {
    h ^= ref.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  let out = '0x'
  for (let i = 0; i < 8; i++) {
    h = Math.imul(h ^ (h >>> 15), 0x2545f491) >>> 0
    out += h.toString(16).padStart(8, '0')
  }
  return out.slice(0, 66)
}

/** Which movements actually touched Base. A naira leg does not: it is two
 *  banks and a desk, and putting a Basescan link on it would be the product
 *  claiming a proof it does not have. */
export const onChain = (a: Activity): boolean =>
  // A bill never does either. The dollars leave the wallet through our desk
  // and what reaches the network is naira, so there is no hash to link to and
  // a Basescan button on a ₦500 recharge would be the product claiming a
  // proof it does not have.
  !a.bill
  && (a.kind === 'trade'
    || (a.kind === 'payment' && a.note !== 'Converted to naira' && a.note !== 'Paid out in naira'))

/** The reference support will ask for. The same one on the screen, in the
 *  email, and in the admin record — one string, so nobody has to translate. */
export const supportRef = (a: Activity): string => a.ref.replace('TKN-', 'TKN/') + '/1'

/* --------------------------------------------------------------- the ops --
   Everything §10 of the spec asks for, as data the screens read.

   None of this is customer-facing and all of it decides what a customer can
   do, which is exactly why it belongs in the product rather than in somebody's
   dashboard: a switch that turns off buying is a product decision with a
   screen behind it, and a provider that is down is a sentence a customer reads
   long before an engineer does. */

/** A server-controlled switch. Each one has a customer-facing consequence and
 *  names it, because "buying: off" without "what people see" is how a kill
 *  switch gets flipped by somebody who does not know what it does. */
export interface Switch {
  key: string
  label: string
  /** What stops working, in the words the customer will read. */
  effect: string
  on: boolean
  /** Who last moved it, and when. */
  by?: string
  at?: string
}

/** One of the outside systems the product cannot work without. */
export interface Provider {
  key: string
  name: string
  does: string
  state: 'up' | 'slow' | 'down'
  /** What is measured, and what it read. */
  metric: string
  since?: string
  /** What the customer sees while it is like this. */
  fallback: string
}

/** A line in the audit history. Staff actions only: the customer's own
 *  movements are in the ledger, and mixing the two would make it impossible to
 *  answer "did anybody here touch this account". */
export interface AuditLine {
  at: string
  who: string
  what: string
  target: string
  /** Whether it changed anything, or only looked. */
  kind: 'read' | 'change'
}

/** A difference between two records that should agree. The whole job of
 *  reconciliation is to have somewhere for these to sit and be worked, rather
 *  than for them to be discovered by a customer. */
export interface Break {
  id: string
  what: string
  ours: string
  theirs: string
  by: number
  state: 'open' | 'working' | 'cleared'
  opened: string
}

/** Somebody else on the pilot, as the admin sees them. */
export interface Member {
  id: string
  name: string
  email: string
  joined: string
  kyc: 'none' | 'checking' | 'verified'
  eligible: boolean
  funded: number
  invite: string
  state: 'active' | 'restricted' | 'closed'
}

/** A thing that must be true before external users are invited. Straight out
 *  of "Required before launch", because a checklist that lives in a document
 *  is a checklist nobody has looked at this week. */
export interface Gate {
  key: string
  what: string
  who: string
  state: 'done' | 'in-progress' | 'not-started'
  note: string
}

/** Somebody you can pay, and whether they hold an account here.
 *
 *  Cash goes to anybody: a Base address is a Base address. A share does not.
 *  A tokenised share is a security, and delivering one to somebody nobody has
 *  identified is the thing a licence exists to prevent — so the product can
 *  only hand a share to another verified Tokkenly account. See design.md
 *  11g.27 for the survey that settled this.
 *
 *  The flag lives on the person rather than being derived, because the honest
 *  version of this screen is the one that refuses, and a refusal you cannot
 *  reach is a refusal nobody has tested. */
export interface Person {
  name: string
  onTokkenly: boolean
}

export interface Device {
  id: string
  name: string
  seen: string
  current: boolean
}

export interface State {
  signedIn: boolean
  /** Whether the browser believes it can reach the network. Not a guarantee —
   *  navigator.onLine is true on a wifi that goes nowhere — but it catches the
   *  common case, and on the connections this product is for the common case
   *  is most of them. Kept in state so every screen reads one answer. */
  online: boolean
  /** Whether this app session has been unlocked. Kept in sessionStorage, not
   *  localStorage: an unlock that outlives the tab is not a lock, and a lock
   *  that outlives a reload of a tab you never closed is an annoyance. The
   *  tab closing is the cold start the lock exists for. */
  unlocked: boolean
  prefs: Prefs
  security: Security
  person: { name: string; email: string; phone: string; dob: string; address: string; joined: string }
  /* ----- what you hold, read from the ledger -----
     Not fields. Every one of these used to be a number some action added to,
     which is exactly how $200 could appear in a wallet with nothing leaving a
     bank. They are the balances of named accounts now, derived on every read,
     so the only way to change one is to post a movement that balances. */
  readonly cash: number
  /** The two halves of it, for the one screen that is about which is which. */
  readonly usdc: number
  readonly usdt: number
  /** And the naira, in naira. */
  readonly naira: number
  readonly lent: number
  readonly interestPaid: number
  readonly borrowed: number
  readonly interestOwed: number
  borrowLimit: number
  rates: { lend: number; borrow: number; collateral: number }
  /** What a transaction costs, as a percentage. The marketing sells this:
   *  "the amount, the rate, the fee, and exactly what you receive, before you
   *  confirm. Nothing folded into a worse rate." A product that answers that
   *  with "free" is not being transparent, it is being vague — and the two
   *  ship together. `fx` is nought because the naira rate on screen is the
   *  rate you get; that is the "nothing folded in" half of the promise. */
  fees: { trade: number; fx: number; card: number }
  /** Identity, and what it unlocks. The marketing says identity checks "may be
   *  required before financial and investment services", so an account starts
   *  without one and the limits say what that costs. */
  kyc: Kyc
  usedThisMonth: number
  holdings: Holding[]
  watchlist: string[]
  /** Companies picked out and not yet paid for. A watchlist is a list of
   *  things you are interested in; a bucket is a list of things you have
   *  decided on, with an amount against each. */
  bucket: BucketItem[]
  people: Person[]
  banks: Bank[]
  cards: Card[]
  va: VirtualAccount
  checks: Check[]
  invite: { code: string; by: string; at: string }
  switches: Switch[]
  providers: Provider[]
  audit: AuditLine[]
  breaks: Break[]
  members: Member[]
  gates: Gate[]
  devices: Device[]
  activity: Activity[]
  notifications: Notif[]
  /** Whether the intro has been seen. It gates the landing route only, so a
   *  deep link still goes where it points. */
  seenIntro: boolean
  cardWaitlist: boolean
  phraseWrittenDown: boolean
  ngnPerUsd: number
  /** When that rate was last quoted. A rate with no time on it is a rumour. */
  rateAt: string
}

/* --------------------------------------------------------------- keeping --
   The ledger is demo data and resets, which is the point of a prototype. The
   preferences are not: a theme that forgets on reload, or an intro that plays
   again every time the page is opened, is worse than not having the setting.
   Only these two are kept, and a browser that refuses storage just gets the
   defaults rather than an error. */
const KEEP = 'tokkenly.prefs.v1'
const SESSION = 'tokkenly.unlocked'

/** How long the app may sit in the background before it wants the PIN again.
 *  A lock that only fires on a cold start protects a phone that has been
 *  turned off, which is not the phone anybody loses. */
export const IDLE_LOCK_MS = 2 * 60 * 1000

function remember(): void {
  try {
    localStorage.setItem(KEEP, JSON.stringify({
      prefs: state.prefs, seenIntro: state.seenIntro,
      // The attempt count is kept. A lockout a reload clears is not a
      // lockout — and there is a way out that does not need a server: the
      // password. Signing in unlocks, and unlocking resets the count.
      security: state.security,
    }))
  } catch { /* private windows and blocked storage are not a failure */ }
}

/* ---------------------------------------------------------------------------
   Opening the books.

   Every row the account already has is replayed into the ledger, oldest first,
   so the statement holds the same history the activity list does. What is left
   over — the difference between where those rows leave the balances and where
   the account actually stands — is the opening position, posted before them
   from an account called "Before this record". That account is not a fudge and
   it is not hidden: an account that has been open for months has a history
   this file does not contain, and naming it is more honest than pretending the
   first row is the beginning of the world.
   --------------------------------------------------------------------------- */

/** Which company a recorded row is about. The rows name the company the way a
 *  person would — "Apple", "Tesla" — because that is what the activity list
 *  reads; the ledger counts shares by ticker. */
const tickerOf = (name: string): string | undefined =>
  CATALOGUE.find((c) => c.name === name)?.ticker

/** What one already-recorded movement did to the ledger.
 *
 *  Usually one posting. A movement that changed currency is two, because a
 *  single entry cannot be denominated twice — so the second one is named
 *  separately and carries the same reference and rate, which is what makes the
 *  pair readable back as one conversion. */
interface Legs {
  entries: ledger.Entry[]
  kind?: string
  rate?: number
  naira?: ledger.Entry[]
}

function legsFor(a: Activity): Legs | null {
  const amt = Math.abs(a.amount)
  const fee = a.fee ?? 0
  // Which purse moved, and which network it moved over. Both are recorded on
  // the movement; both fall back to the defaults for the rows written before
  // there was anything to record.
  const mine = purseFor(a.purse ?? 'usdc')
  const far = 'chain.' + (a.net ?? 'base')
  if (a.kind === 'payment') {
    // A bill changes currency, so it is two postings joined by the rate that
    // was struck — exactly what `payBill` writes when one is paid today. The
    // rate is read back off the record rather than off this morning's screen:
    // a recharge bought at ₦1,500 does not restate itself when the naira
    // moves.
    if (a.bill) {
      // Paid out of naira, there is no conversion: the naira you held are the
      // naira the network took, and inventing a desk between them would be
      // inventing a rate that nobody was quoted.
      if (a.purse === 'ngn') {
        return { entries: [{ account: 'wallet.ngn', amount: -a.bill.naira },
                           { account: 'biller', amount: a.bill.naira }] }
      }
      return {
        entries: [{ account: mine, amount: -amt }, { account: 'desk.usd', amount: amt }],
        rate: a.bill.naira / amt,
        naira: [{ account: 'desk.ngn', amount: -a.bill.naira },
                { account: 'biller', amount: a.bill.naira }],
      }
    }
    return a.amount >= 0
      ? { entries: [{ account: far, amount: -amt }, { account: mine, amount: amt }] }
      : { entries: [{ account: mine, amount: -amt }, { account: far, amount: amt }] }
  }
  if (a.kind === 'trade') {
    // A share handed to somebody moves units and no money at all, which is
    // the whole difference between it and a sale.
    if (a.asset) {
      return { entries: [{ account: 'held:' + a.asset.ticker, amount: -a.asset.shares },
                         { account: 'sent:' + a.asset.ticker, amount: a.asset.shares }] }
    }
    // Both halves of a trade: dollars one way, shares the other. The count
    // comes off the figure the person typed rather than off the amount
    // recorded, which has the fee in it.
    const t = tickerOf(a.who)
    const price = t ? find(t)?.price : undefined
    const units = t && price ? grossOf(a) / price : 0
    const shares: ledger.Entry[] = t
      ? [{ account: 'float:' + t, amount: a.type === 'Sold' ? units : -units },
         { account: 'held:' + t, amount: a.type === 'Sold' ? -units : units }]
      : []
    return a.type === 'Sold'
      ? { entries: [{ account: 'market', amount: -(amt + fee) },
                    { account: mine, amount: amt }, { account: 'fees', amount: fee },
                    ...shares] }
      : { entries: [{ account: mine, amount: -amt },
                    { account: 'market', amount: amt - fee }, { account: 'fees', amount: fee },
                    ...shares] }
  }
  if (a.who === 'Lending') {
    if (a.type === 'Interest') {
      return { kind: 'lend-interest',
        entries: [{ account: 'interest', amount: -amt }, { account: mine, amount: amt }] }
    }
    return a.type === 'Lent'
      ? { entries: [{ account: mine, amount: -amt }, { account: 'lent', amount: amt }] }
      : { entries: [{ account: 'lent', amount: -amt }, { account: mine, amount: amt }] }
  }
  if (a.who === 'Borrowing') {
    return a.type === 'Borrowed'
      ? { entries: [{ account: 'loan', amount: -amt }, { account: mine, amount: amt }] }
      : { entries: [{ account: mine, amount: -amt }, { account: 'loan', amount: amt }] }
  }
  return null
}

/** How long a Nigerian bank payout takes to confirm. Longer than money coming
 *  in, because it is: an outbound transfer waits on the receiving bank, and
 *  the whole point of tracking it as two stages is that the second one is not
 *  instant. */
const PAYOUT_MS = 3400

/** Where the account actually stands, which the replay has to arrive at.
 *
 *  The $2,480 that used to be one wallet is two, because it always was two —
 *  a person paid in USDT and a person paid in USDC hold different things, and
 *  the product was rounding that off. The naira is the third, and it is not a
 *  rounding of anything: it is money somebody chose to keep in naira, which is
 *  a thing this product now lets them do. */
const TODAY: Record<string, number> = {
  'wallet.usdc': 1680, 'wallet.usdt': 800, 'wallet.ngn': 145000,
  lent: 1240, loan: -380, 'loan.int': -8.9,
}

/** And what it holds, in shares. The order is the order the portfolio reads
 *  in, because the holdings list is now derived and an account's row appears
 *  the first time the ledger names it. */
const TODAY_SHARES: [string, number][] =
  [['AAPLc', 23.42], ['NVDAc', 26.94], ['VOOc', 5.6], ['TSLAc', 4.8]]

/** And what those opening shares are assumed to have cost, each. The ledger
 *  does not contain the trades that bought them — that is the whole point of
 *  "Before this record" — so without this the portfolio would open showing a
 *  hundred per cent gain on everything, which is the most flattering lie a
 *  broker can tell. Every screen that shows a gain says which part is
 *  estimated. */
const OPENING_COST: Record<string, number> = {
  AAPLc: 198.40, NVDAc: 96.15, VOOc: 468.20, TSLAc: 271.05,
}

export function openBooks(): void {
  ledger.reset()
  for (const [t, each] of Object.entries(OPENING_COST)) ledger.setOpeningCost(t, each)
  const rows = [...state.activity].reverse()      // oldest first
  const after: Record<string, number> = Object.fromEntries(Object.keys(TODAY).map((k) => [k, 0]))
  // Every ticker the replay touches, plus the ones the account opened with:
  // a trade in something not in the opening position still has to arrive at
  // the right count, and a ticker with no history has to arrive at its.
  const units = new Map<string, number>(TODAY_SHARES.map(([t]) => [t, 0]))
  for (const a of rows) {
    const legs = legsFor(a)
    if (!legs) continue
    for (const e of legs.entries) {
      if (e.account in after) after[e.account] += e.amount
      if (!e.account.startsWith('held:')) continue
      const t = e.account.slice(5)
      units.set(t, (units.get(t) ?? 0) + e.amount)
    }
  }
  const opening = Object.entries(TODAY)
    .map(([id, target]) => ({ account: id, amount: Math.round((target - after[id]) * 100) / 100 }))
    .filter((e) => Math.abs(e.amount) > 1e-9)
  // One counter-account per currency. The opening position is naira as well as
  // dollars now, and a posting has to come to nothing in every currency it
  // touches — balancing ₦145,000 against a dollar account would have been the
  // one thing this ledger exists to refuse.
  const sum = opening.filter((e) => ledger.account(e.account).currency === 'USD')
    .reduce((t, e) => t + e.amount, 0)
  const sumNgn = opening.filter((e) => ledger.account(e.account).currency === 'NGN')
    .reduce((t, e) => t + e.amount, 0)
  // Each ticker balances against its own "before this record" account. One
  // shared account cannot do it: a posting has to come to nothing in every
  // currency it touches, and Apple and Tesla are two of them.
  const target = new Map(TODAY_SHARES)
  const held: ledger.Entry[] = []
  for (const [t, replayed] of units) {
    const short = Math.round(((target.get(t) ?? 0) - replayed) * 1e6) / 1e6
    if (Math.abs(short) < 1e-6) continue
    held.push({ account: 'held:' + t, amount: short },
              { account: 'open:' + t, amount: -short })
  }
  ledger.post({
    ref: 'TKN-OPENING', at: rows[0]?.at ?? new Date().toISOString(),
    what: 'What the account already held',
    entries: [...opening,
              { account: 'opening', amount: -Math.round(sum * 100) / 100 },
              ...(Math.abs(sumNgn) > 1e-9
                ? [{ account: 'opening.ngn', amount: -Math.round(sumNgn * 100) / 100 }]
                : []),
              ...held],
  })
  for (const a of rows) {
    const legs = legsFor(a)
    if (!legs) continue
    ledger.post({ ref: a.ref, at: a.at, what: activityLine(a), kind: legs.kind,
                  entries: legs.entries, rate: legs.rate, pair: legs.naira ? a.ref : undefined })
    if (legs.naira) {
      ledger.post({ ref: a.ref, at: a.at, pair: a.ref, rate: legs.rate,
                    what: `${naira(a.bill!.naira)} paid to ${a.who}`, entries: legs.naira })
    }
  }
}

/** How a movement reads on the statement. The activity list has columns for
 *  who and what; a statement line has one sentence. */
function activityLine(a: Activity): string {
  if (a.asset) return `${a.type} ${sharesOf(a.asset.shares)} ${a.asset.ticker} ${a.type === 'Sent' ? 'to' : 'from'} ${a.who}`
  if (a.kind === 'grow') return `${a.type} · ${a.who}`
  // A trade is "of", not "to" or "from": you bought $420 of Apple, you did not
  // buy $420 to it.
  if (a.kind === 'trade') return `${a.type} ${usd(Math.abs(a.amount))} of ${a.who}`
  return `${a.type} ${usd(Math.abs(a.amount))} ${a.amount >= 0 ? 'from' : 'to'} ${a.who}`
}

export function recall(): void {
  try {
    state.unlocked = sessionStorage.getItem(SESSION) === '1'
  } catch { /* no session storage: the lock simply asks again */ }
  try {
    const raw = localStorage.getItem(KEEP)
    if (!raw) return
    const saved = JSON.parse(raw) as {
      prefs?: Partial<Prefs>; seenIntro?: boolean; security?: Partial<Security>
    }
    // Merged, not replaced: a preference added after this was written should
    // arrive at its default rather than as undefined.
    state.prefs = {
      ...DEFAULT_PREFS, ...saved.prefs,
      notify: { ...DEFAULT_PREFS.notify, ...(saved.prefs?.notify ?? {}) },
      putAway: [...(saved.prefs?.putAway ?? [])],
    }
    state.security = { ...DEFAULT_SECURITY, ...saved.security }
    state.seenIntro = saved.seenIntro ?? false
  } catch { /* unreadable or from an older shape: the defaults stand */ }
}

/** The only preference that lands on the document rather than in a screen. */
export function applyTheme(): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', state.prefs.theme)
  }
}

const iso = (d: string) => new Date(d).toISOString()

/** The date a person would write, for "changed on" lines. */
const today = (): string =>
  new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const state: State = {
  signedIn: true,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  unlocked: false,
  prefs: { ...DEFAULT_PREFS, notify: { ...DEFAULT_PREFS.notify } },
  security: { ...DEFAULT_SECURITY },
  person: {
    name: 'Chinaza Okoro',
    email: 'ibrahimweng0@gmail.com',
    phone: '+234 802 431 9087',
    dob: '14 March 1996',
    address: '12 Awolowo Road, Ikoyi, Lagos',
    joined: 'March 2024',
  },
  /** Dollars you can spend, whichever of the two they are. Every ceiling, every
   *  composer and every "can you afford this" in the product reads this, and
   *  none of them cares which issuer — what cares is the payment itself, and
   *  the payment is asked. */
  get cash() { return ledger.balanceOf('wallet.usdc') + ledger.balanceOf('wallet.usdt') },
  get usdc() { return ledger.balanceOf('wallet.usdc') },
  get usdt() { return ledger.balanceOf('wallet.usdt') },
  /** And the naira, which is not dollars and is not converted into them
   *  anywhere a person can spend it. It is its own balance because it is its
   *  own money. */
  get naira() { return ledger.balanceOf('wallet.ngn') },
  get lent() { return ledger.balanceOf('lent') },
  get interestPaid() { return ledger.paidOf('lend-interest') },
  get borrowed() { return -ledger.balanceOf('loan') },
  get interestOwed() { return -ledger.balanceOf('loan.int') },
  borrowLimit: 1860,
  rates: { lend: 4.8, borrow: 9.4, collateral: 140 },
  // A transfer costs nothing and a card costs what the card networks charge.
  // Two ways in that cost the same are one way in wearing two names; the
  // difference is the reason to offer both.
  fees: { trade: 0.5, fx: 0, card: 1.4 },
  kyc: { status: 'none' },
  // Identity is one check; permission is four more. Seeded at the state a
  // person arrives in: their details are on file and nothing has been run.
  checks: [
    { key: 'identity', label: 'Who you are', state: 'pending', detail: '',
      what: 'A government ID and a photo of you' },
    { key: 'age', label: 'Eighteen or over', state: 'pending', detail: '',
      what: 'Read off the date of birth on the document' },
    { key: 'residence', label: 'Resident in Nigeria', state: 'pending', detail: '',
      what: 'The country on your document, and where you sign in from' },
    { key: 'sanctions', label: 'Sanctions and watchlists', state: 'pending', detail: '',
      what: 'Checked against the lists we are required to check' },
    { key: 'product', label: 'May hold tokenised shares', state: 'pending', detail: '',
      what: 'Whether someone in your country is allowed to hold these' },
  ],
  // Invite-only for the pilot. The code is on the account because the person
  // came in through one, and support gets asked "who invited them" often
  // enough that it belongs on the record rather than in a spreadsheet.
  invite: { code: 'TKN-PILOT-0148', by: 'Waitlist, cohort 2', at: iso('2026-03-02T10:00') },
  // Every switch on, except the two that are genuinely not ready. A console
  // that opens with everything green teaches nobody what it looks like when
  // something is off.
  switches: [
    { key: 'signup', label: 'New wallets', on: true, by: 'ops@tokkenly', at: iso('2026-09-01T09:12'),
      effect: 'Sign-up stops creating wallets. Everybody already in keeps theirs.' },
    { key: 'fund.ngn', label: 'Naira funding', on: true, by: 'ops@tokkenly', at: iso('2026-09-04T11:40'),
      effect: 'Add money by transfer and by card both stop. The account details stay visible and nothing lands.' },
    { key: 'fund.card', label: 'Card funding', on: false, by: 'risk@tokkenly', at: iso('2026-09-06T16:02'),
      effect: 'The card way is shown as paused and stops taking payments. Transfers are unaffected.' },
    { key: 'buy', label: 'Buying', on: true, by: 'ops@tokkenly', at: iso('2026-08-28T08:00'),
      effect: 'Every buy button is replaced by a line saying trading is paused. Selling still works.' },
    { key: 'sell', label: 'Selling', on: true, by: 'ops@tokkenly', at: iso('2026-08-28T08:00'),
      effect: 'Sell stops. This one is the last resort: somebody who cannot sell cannot get out.' },
    { key: 'gas', label: 'Sponsored gas', on: true, by: 'ops@tokkenly', at: iso('2026-08-19T14:30'),
      effect: 'Fees come out of the customer\u2019s USDC instead, and every review says so before they confirm.' },
    { key: 'send', label: 'Sending out', on: true, by: 'ops@tokkenly', at: iso('2026-08-19T14:30'),
      effect: 'Sending to a person, an address or a bank all stop.' },
    { key: 'payout.ngn', label: 'Bank payouts', on: true, by: 'ops@tokkenly', at: iso('2026-09-02T10:15'),
      effect: 'The bank rail disappears from Send. Payouts already queued still finish.' },
    { key: 'spend.bills', label: 'Bills', on: true, by: 'ops@tokkenly', at: iso('2026-09-08T09:30'),
      effect: 'Airtime, data and electricity all stop. Spend still opens and says why.' },
    { key: 'asset.METAc', label: 'METAc', on: false, by: 'legal@tokkenly', at: iso('2026-09-05T12:00'),
      effect: 'Meta cannot be bought or sold. Existing holders keep the position and can still send it.' },
  ],
  providers: [
    { key: 'cdp', name: 'Coinbase CDP', does: 'Sign-in, wallets, sponsored gas', state: 'up',
      metric: '99.98% over 30 days', fallback: 'Nobody can sign in or create a wallet.' },
    { key: 'base', name: 'Base', does: 'Settlement', state: 'up',
      metric: 'Block 24,881,204 · 2s behind', fallback: 'Nothing settles. Balances stay correct; movements queue.' },
    { key: '0x', name: '0x Swap API', does: 'Buy and sell quotes', state: 'slow',
      metric: '2,140ms median, up from 340ms', since: iso('2026-09-07T07:52'),
      fallback: 'Quotes take longer to arrive. The review shows a skeleton and the rate hold starts when it lands.' },
    { key: 'chainlink', name: 'Chainlink', does: 'Independent reference prices', state: 'up',
      metric: 'All feeds under 30s', fallback: 'Every trade is refused: there is nothing to check a quote against.' },
    { key: 'didit', name: 'Didit', does: 'Identity and screening', state: 'up',
      metric: '4 checks today, all cleared', fallback: 'New verifications queue. Nobody already verified is affected.' },
    { key: 'switch', name: 'Switch', does: 'Naira in and out', state: 'down',
      metric: 'Webhooks failing since 07:14', since: iso('2026-09-07T07:14'),
      fallback: 'Naira funding and bank payouts both stop. USDC in and out is unaffected, and the app says which.' },
    { key: 'baxi', name: 'Baxi', does: 'Airtime, data and electricity', state: 'up',
      metric: '312 bills today, 2 refused by the network',
      fallback: 'Spend stops taking payments. Nothing is charged and the screen says the partner is down.' },
  ],
  audit: [
    { at: iso('2026-09-07T08:12'), who: 'risk@tokkenly', kind: 'change',
      what: 'Turned off card funding', target: 'Switch · fund.card' },
    { at: iso('2026-09-07T07:58'), who: 'ops@tokkenly', kind: 'read',
      what: 'Opened a customer record', target: 'Adaeze Okonkwo' },
    { at: iso('2026-09-06T16:02'), who: 'legal@tokkenly', kind: 'change',
      what: 'Suspended an asset pending contract sign-off', target: 'Switch · asset.METAc' },
    { at: iso('2026-09-06T11:20'), who: 'ops@tokkenly', kind: 'change',
      what: 'Cleared a reconciliation break', target: 'Break · REC-0441' },
    { at: iso('2026-09-05T09:04'), who: 'support@tokkenly', kind: 'read',
      what: 'Looked up a payout by reference', target: 'TKN-7D1J83' },
  ],
  breaks: [
    { id: 'REC-0448', what: 'Switch says a payout settled. We have no confirmation.',
      ours: 'Queued 14:22', theirs: 'Settled 14:25', by: 180000, state: 'open', opened: iso('2026-09-07T14:40') },
    { id: 'REC-0447', what: 'A deposit landed with no matching virtual account',
      ours: 'Nothing', theirs: '₦120,000 to 9902847002', by: 120000, state: 'working', opened: iso('2026-09-06T09:11') },
    { id: 'REC-0441', what: 'Fee taken twice on one order', ours: '$2.09', theirs: '$4.18',
      by: 2.09, state: 'cleared', opened: iso('2026-09-04T16:30') },
  ],
  members: [
    { id: 'u1', name: 'Chinaza Okoro', email: 'ibrahimweng0@gmail.com', joined: '2 March 2026',
      kyc: 'none', eligible: false, funded: 3000, invite: 'TKN-PILOT-0148', state: 'active' },
    { id: 'u2', name: 'Adaeze Okonkwo', email: 'ibrahimweng0@gmail.com', joined: '18 February 2026',
      kyc: 'verified', eligible: true, funded: 12400, invite: 'TKN-PILOT-0091', state: 'active' },
    { id: 'u3', name: 'Tunde Bakare', email: 'ibrahimweng0@gmail.com', joined: '3 April 2026',
      kyc: 'verified', eligible: true, funded: 860, invite: 'TKN-PILOT-0203', state: 'active' },
    { id: 'u4', name: 'Chidi Nwosu', email: 'ibrahimweng0@gmail.com', joined: '29 May 2026',
      kyc: 'checking', eligible: false, funded: 0, invite: 'TKN-PILOT-0311', state: 'restricted' },
    { id: 'u5', name: 'Ngozi Eze', email: 'ibrahimweng0@gmail.com', joined: '11 June 2026',
      kyc: 'verified', eligible: false, funded: 240, invite: 'TKN-PILOT-0356', state: 'restricted' },
  ],
  gates: [
    { key: 'access', what: 'Written confirmation that Nigerian users may hold these tokens',
      who: 'Legal', state: 'in-progress', note: 'Opinion drafted, waiting on counsel sign-off' },
    { key: 'ng-legal', what: 'Nigerian legal, tax, custody and disclosure requirements approved',
      who: 'Legal', state: 'in-progress', note: 'Disclosures written and in the product. Tax treatment still open.' },
    { key: 'contracts', what: 'Production contract addresses verified for every asset and feed',
      who: 'Engineering', state: 'done', note: 'Four launch assets, USDC, and four Chainlink feeds checked against Coinbase' },
    { key: 'switch', what: 'Switch onramp and offramp documentation confirmed',
      who: 'Engineering', state: 'in-progress', note: 'Webhook signing agreed. Reversal states still unclear.' },
    { key: 'limits', what: 'Approved limits for price freshness, deviation, impact, gas and exposure',
      who: 'Risk', state: 'done', note: '90s, 1.5%, 2%, $5 a month, $50,000 pilot cap' },
    { key: 'security', what: 'Security review and small-value production tests end to end',
      who: 'Engineering', state: 'not-started', note: 'Blocked on the Switch sandbox' },
  ],
  usedThisMonth: 180,
  // Not a list that is kept up to date beside the ledger — a reading of it.
  // A share in this array exists because a movement put it in custody, and
  // its price and day move come off the catalogue, so nothing here can drift
  // from either. What the account opened with is in OPENING_SHARES.
  get holdings() {
    return ledger.held().map((h) => {
      const c = find(h.ticker)
      // What it cost is read the same way the quantity is: off the trades that
      // built the position. There is no second copy to drift.
      const b = ledger.basis(h.ticker)
      const value = h.shares * (c?.price ?? 0)
      return {
        ticker: h.ticker,
        name: c?.name ?? h.ticker,
        shares: h.shares,
        price: c?.price ?? 0,
        dayPct: c?.dayPct ?? 0,
        cost: b.cost,
        each: b.each,
        gain: value - b.cost,
        gainPct: b.cost > 0 ? ((value - b.cost) / b.cost) * 100 : 0,
      }
    })
  },
  bucket: [],
  watchlist: ['AAPLc', 'NVDAc', 'TSLAc', 'METAc', 'VOOc'],
  // Two on Tokkenly and two not, so the screen that refuses to hand a share to
  // somebody without an account is on a path anybody can walk, the way .99
  // declines and .98 goes unanswered.
  people: [
    { name: 'Adaeze Okonkwo', onTokkenly: true },
    { name: 'Tunde Bakare', onTokkenly: true },
    { name: 'Chidi Nwosu', onTokkenly: false },
    { name: 'Ngozi Eze', onTokkenly: false },
  ],
  banks: [
    { id: 'gt', name: 'GTBank', last4: '4471', holder: 'Chinaza Okoro', number: '0142384471' },
    { id: 'kuda', name: 'Kuda', last4: '8820', holder: 'Chinaza Okoro', number: '2019478820' },
  ],
  cards: [
    { id: 'c1', brand: 'Verve', last4: '6612', expiry: '09/28', holder: 'CHINAZA OKORO' },
  ],
  // Permanent, and in the person's own name after it: money reaching it can
  // only be theirs, which is why the transfer needs no reference.
  va: {
    bank: 'Providus Bank',
    number: '9902847713',
    name: 'TOKKENLY / CHINAZA OKORO',
  },
  devices: [
    { id: 'mac', name: 'Chrome on Mac', seen: 'Now', current: true },
    { id: 'iphone', name: 'iPhone 13', seen: 'Today 09:12', current: false },
    { id: 'pixel', name: 'Pixel 7', seen: '2 days ago', current: false },
  ],
  notifications: [
    { id: 'n1', kind: 'money', title: 'Adaeze Okonkwo paid you $120.00',
      body: 'It is already in your wallet.', at: iso('2026-09-05T14:32'), read: false,
      ref: 'TKN-8F2K90', emailed: 'preference' },
    { id: 'n2', kind: 'trade', title: 'Your Apple order filled',
      body: '1.87 shares at $224.10.', at: iso('2026-09-05T14:05'), read: false,
      ref: 'TKN-8E4J77', emailed: 'always' },
    // The reference, not just a place to go: this announcement is about a
    // movement that is already a row, and without the reference the feed shows
    // the interest twice — once as the payment and once as the news of it.
    { id: 'n3', kind: 'grow', title: 'Lending paid you $0.16',
      body: 'Interest lands every morning on the dollars you have lent out.', at: iso('2026-09-04T00:05'), read: false,
      ref: 'TKN-7C8H62', to: '/grow', emailed: false },
    { id: 'n4', kind: 'security', title: 'New sign in on Pixel 7',
      body: 'Lagos, Nigeria. If this was not you, sign out everywhere.', at: iso('2026-09-03T21:10'), read: true,
      to: '/account/security', emailed: 'always' },
    { id: 'n5', kind: 'money', title: 'Payroll arrived',
      body: '$1,500.00 from Kuda ending 8820.', at: iso('2026-08-29T08:00'), read: true,
      ref: 'TKN-6C9H77', emailed: 'always' },
  ],
  seenIntro: false,
  cardWaitlist: false,
  phraseWrittenDown: false,
  ngnPerUsd: 1500,
  rateAt: iso('2026-09-06T09:40'),
  activity: [
    { ref: 'TKN-8F2K90', kind: 'payment', who: 'Adaeze Okonkwo', type: 'Received', amount: 120, at: iso('2026-09-05T14:32'), rail: 'base', settled: true },
    { ref: 'TKN-8E4J77', kind: 'trade', who: 'Apple', type: 'Bought', amount: -420, fee: 2.09, at: iso('2026-09-05T14:05'), settled: true },
    { ref: 'TKN-7D1J83', kind: 'payment', who: 'Tunde Bakare', type: 'Sent', amount: -45, at: iso('2026-09-04T09:14'), settled: true },
    { ref: 'TKN-7C8H62', kind: 'grow', who: 'Lending', type: 'Interest', amount: 0.16, at: iso('2026-09-04T00:05'), settled: true },
    { ref: 'TKN-6C9H77', kind: 'payment', who: 'Payroll', type: 'Received', amount: 1500, at: iso('2026-08-29T08:00'), rail: 'bank', settled: true },
    { ref: 'TKN-6B4G61', kind: 'trade', who: 'Tesla', type: 'Sold', amount: 260, fee: 1.31, at: iso('2026-08-28T19:20'), settled: true },
    { ref: 'TKN-5Z2E44', kind: 'payment', who: 'Adaeze Okonkwo', type: 'Sent', amount: -80, at: iso('2026-08-26T16:40'), settled: true },
    { ref: 'TKN-5Y3D31', kind: 'trade', who: 'Nvidia', type: 'Bought', amount: -380, fee: 1.89, at: iso('2026-08-26T11:05'), settled: true },
    { ref: 'TKN-4X1C25', kind: 'payment', who: 'Rent', type: 'Sent', amount: -620, at: iso('2026-08-24T07:00'), settled: true },
    { ref: 'TKN-3V0A04', kind: 'payment', who: 'Tunde Bakare', type: 'Sent', amount: -30, at: iso('2026-08-22T10:22'), settled: true },
    { ref: 'TKN-2T9Y81', kind: 'payment', who: 'Airtel', type: 'Data', amount: -1, at: iso('2026-08-20T18:35'),
      note: '3GB for 30 days', bill: { target: '0802 431 9087', naira: 1500 }, settled: true },
    { ref: 'TKN-2S4X70', kind: 'grow', who: 'Borrowing', type: 'Borrowed', amount: 500, at: iso('2026-08-12T10:40'), settled: true },
    { ref: 'TKN-2R7W58', kind: 'payment', who: 'Chidi Nwosu', type: 'Received', amount: 65, at: iso('2026-08-11T13:05'), rail: 'base', settled: true },
    { ref: 'TKN-1Q6V47', kind: 'payment', who: 'Airtel', type: 'Airtime', amount: -2, at: iso('2026-08-09T19:48'),
      bill: { target: '0802 431 9087', naira: 3000 }, settled: true },
    { ref: 'TKN-1P5U36', kind: 'trade', who: 'S&P 500 ETF', type: 'Bought', amount: -300, fee: 1.49, at: iso('2026-08-07T15:22'), settled: true },
    { ref: 'TKN-1N4T25', kind: 'payment', who: 'Ngozi Eze', type: 'Sent', amount: -150, at: iso('2026-08-05T11:30'), settled: true },
    { ref: 'TKN-0M3S14', kind: 'grow', who: 'Lending', type: 'Lent', amount: -740, at: iso('2026-08-03T09:15'), settled: true },
    { ref: 'TKN-0L2R03', kind: 'payment', who: 'Ikeja Electric', type: 'Electricity', amount: -10, at: iso('2026-08-01T07:40'),
      note: 'Prepaid · CHINAZA OKORO', bill: { target: '4512 3456 780', naira: 15000, token: tokenFor('TKN-0L2R03') }, settled: true },
    { ref: 'TKN-0K1Q92', kind: 'payment', who: 'Payroll', type: 'Received', amount: 1500, at: iso('2026-07-31T08:00'), rail: 'bank', settled: true },
    { ref: 'TKN-0J0P81', kind: 'trade', who: 'Apple', type: 'Bought', amount: -560, fee: 2.79, at: iso('2026-07-29T14:12'), settled: true },
  ],
}

/* ---------- derived ---------- */

/** Everything this account holds, in dollars.
 *
 *  Naira is in it, converted at today's rate for this figure and for no other:
 *  a total has to be in one currency to be a total, and the alternative — a
 *  headline that quietly leaves out one of three balances — is worse than a
 *  conversion that says what it is. The naira balance is shown in naira
 *  everywhere it is shown on its own. */
export const worth = (): number =>
  state.cash + state.naira / state.ngnPerUsd + state.lent + holdingsValue()

export const holdingsValue = (): number =>
  state.holdings.reduce((t, h) => t + h.shares * h.price, 0)

export const owed = (): number => state.borrowed + state.interestOwed

export const availableToBorrow = (): number =>
  Math.max(0, state.borrowLimit - state.borrowed)

export const buyingPower = (): number => state.cash + availableToBorrow()

/** Cover is what the shares are worth against what is owed. Below the
 *  collateral floor we sell; above it nothing happens. */
export const cover = (): number =>
  state.borrowed === 0 ? Infinity : (holdingsValue() / state.borrowed) * 100

export const sellPoint = (): number => state.borrowed * (state.rates.collateral / 100)

export const monthlyCost = (principal: number): number =>
  (principal * state.rates.borrow) / 100 / 12

export const monthlyInterest = (principal: number): number =>
  (principal * state.rates.lend) / 100 / 12

/** The naira line beside a dollar figure, when the person wants one. Add
 *  money and Convert are *about* naira and always show it — this is only for
 *  the asides, which is what the preference is offering to quieten. */
/** The notifications the switches let through. A switch that changes nothing
 *  is a switch that lies, so the panel and its count both read this rather
 *  than state.notifications directly. */
const NOTIFY_OF: Record<Notif['kind'], keyof Prefs['notify']> = {
  money: 'payments', trade: 'prices', grow: 'earn', security: 'borrowing',
}
export const visibleNotifications = (): Notif[] =>
  state.notifications.filter((n) => state.prefs.notify[NOTIFY_OF[n.kind]])

/** The naira figure beside a dollar one.
 *
 *  Naira is the unit people here think in; dollars are the thing they bought
 *  with it. It was an aside behind a preference, real on two screens out of
 *  twenty-four — which is localisation done to a product rather than a product
 *  built for a place. It goes under every balance the app states.
 *
 *  Covered along with the dollar figure when balances are hidden: hiding one
 *  and printing the other in naira is not hiding anything. */
export const alsoIn = (dollars: number): string | null => {
  if (!state.prefs.showNaira) return null
  if (state.prefs.hideBalances) return MASK
  // Whichever one is not leading. An account that counts in naira does not
  // want a naira figure repeated under a naira figure; it wants to know what
  // that is in dollars, which is the question it had before it changed the
  // setting.
  return state.prefs.payWith === 'ngn'
    ? `About ${usd(dollars)}`
    : `About ${naira(dollars * state.ngnPerUsd)}`
}

/** Where that figure came from. A rate with no time and no name on it is a
 *  rumour, and this is the one number in the product a person cannot check
 *  for themselves. */
export const rateLine = (): string => {
  const at = new Date(state.rateAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${naira(state.ngnPerUsd)} to the dollar · indicative, quoted ${at}`
}

export const nairaAside = (dollars: number): string | null => {
  const n = alsoIn(dollars)
  return n === null ? null : `${n} at today\u2019s indicative rate`
}

/* ------------------------------------------------------------ settlement --
   Every flow in this product succeeded. There was no declined payment, no
   timeout, no reversal, and toast() carried an 'error' tone that nothing ever
   called — which meant the one thing people actually judge a money app on,
   how it behaves when something goes wrong, had never been designed.

   Which movements fail is deterministic rather than random. A prototype that
   declines one payment in ten is unusable for a demo and untestable in a
   suite; a rule you can aim at makes every path reachable on purpose. The
   convention is the one payment sandboxes use — a magic value — carried on
   the cents, so any amount can be turned into a failure by changing the
   pennies:

     .99  the bank says no. Nothing moves.
     .98  no answer in time. It may still land, so it is recorded as
          unsettled rather than claimed either way.

   Everything else settles. */
export type Settlement = 'ok' | 'declined' | 'pending'

export function settlement(amount: number): Settlement {
  const cents = Math.round(Math.abs(amount) * 100) % 100
  if (cents === 99) return 'declined'
  if (cents === 98) return 'pending'
  return 'ok'
}

/** The same rule, on the naira side.
 *
 *  `settlement` reads the cents of a dollar figure, which is the figure a
 *  person typed on every screen that uses it. On a bill they typed naira and
 *  the dollars are derived, so the cents are an artefact of the rate and a
 *  refusal could never be reached deliberately. So a bill is refused on the
 *  naira: anything ending in 99 is a network saying no.
 *
 *  There is no pending case. A bank payout waits on a bank; a top-up does
 *  not — the network takes it or it does not, and a row that sat open for a
 *  ₦500 recharge would be a worse lie than either outcome. */
/** Which balance a movement takes when nobody was asked.
 *
 *  Interest paid in, a drawdown, the fee on a bucket — nothing on those
 *  screens offers a choice, so they follow the preference. Naira is not an
 *  option: you cannot buy a share with it and you cannot borrow into it, so
 *  an account set to naira still trades in the stablecoin it holds most of.
 *  Falling back rather than refusing, because the alternative is a Buy button
 *  that stops working when somebody changes a setting about airtime. */
export const payAsset = (): Asset => {
  const want = state.prefs.payWith
  if (want !== 'ngn') return want
  return state.usdt > state.usdc ? 'usdt' : 'usdc'
}

export function billOutcome(naira: number): 'ok' | 'declined' {
  return Math.round(Math.abs(naira)) % 100 === 99 ? 'declined' : 'ok'
}

/* ----------------------------------------------------------- your money --
   A figure that is yours, which the privacy switch can take off the screen.
   One function, so a balance somebody forgot to cover is not one call site
   away from undoing the whole feature. */
export const MASK = '\u2022\u2022\u2022\u2022\u2022\u2022'

export const money = (n: number, cents = true): string =>
  state.prefs.hideBalances ? MASK : priced(n, cents)

/** A figure in whatever this account counts in.
 *
 *  Everything in the product is held and quoted in dollars, because that is
 *  what the wallet holds and what a share costs. That is the right default and
 *  it is the wrong one for somebody whose money is in naira: "$175.42" is a
 *  price they have to do arithmetic on before they know whether they can
 *  afford it, and a product that makes people do arithmetic about their own
 *  money has not finished.
 *
 *  So the figure follows the setting. One setting, not two: what you pay with
 *  and what you are quoted in are the same decision, and offering them
 *  separately would let somebody ask to be quoted in a currency they do not
 *  hold.
 *
 *  Not masked, unlike `money`. A price is not your business and hiding it
 *  would hide the market. */
export const priced = (n: number, cents = true): string =>
  state.prefs.payWith === 'ngn' ? naira(n * state.ngnPerUsd) : usd(n, cents)

export const moneyNaira = (n: number): string =>
  state.prefs.hideBalances ? MASK : naira(n)

/* ------------------------------------------------------------- the quote --
   "The rate is held for ninety seconds" was a sentence with nothing behind
   it: no clock, no expiry, and no way to be given a new one, so the promise
   was decoration on a screen whose whole job is to be believed about a rate.
   A quote is the rate at a moment, and it stops being honoured. */

export interface Quote {
  /** Naira per dollar, fixed for the life of this quote. */
  rate: number
  /** When it stops being honoured, in epoch milliseconds. */
  until: number
}

export const RATE_HOLD_MS = 90_000

/** Where a re-quote's rate comes from. Stepped through a fixed sequence
 *  rather than drawn at random, because a figure on screen must not move on
 *  its own — it moves when you ask for a new one, which is what a hold is
 *  for. The first quote of a session is the indicative rate exactly, so the
 *  review agrees with the composer you just came from. */
const DRIFT = [0, 0.004, -0.003, 0.007, -0.005, 0.002]
let quoteSeq = 0

export function takeQuote(): Quote {
  const rate = Math.round(state.ngnPerUsd * (1 + DRIFT[quoteSeq % DRIFT.length]))
  quoteSeq += 1
  return { rate, until: Date.now() + RATE_HOLD_MS }
}

export const quoteLive = (q: Quote): boolean => q.until > Date.now()

/** How long asking for a rate takes. The only thing in this prototype that
 *  models a round trip, and it is the right one to model: a rate is the one
 *  figure the product cannot know on its own, and the moment it has to fetch
 *  one is the moment a dropped signal costs somebody money. */
export const QUOTE_MS = 450

export function requestQuote(): Promise<Quote> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!state.online) reject(new Error('offline'))
      else resolve(takeQuote())
    }, QUOTE_MS)
  })
}

/* ------------------------------------------------------------ the limits --
   One place, so the card that states a limit and the thing that enforces it
   are the same number. */
export const verified = (): boolean => state.kyc.status === 'verified'

/** Whether this person may use the investment product. Not the same question
 *  as whether we know who they are, and the spec is explicit about that: KYC
 *  approval is kept separate from permission to trade. Every check has to pass,
 *  and the last one can fail on its own. */
/** Whether a thing the product does is currently switched on. Read by the
 *  screens rather than checked by them: a switch that only the console knows
 *  about is a switch that changes nothing. */
export const switchOn = (key: string): boolean =>
  state.switches.find((s) => s.key === key)?.on ?? true

/** And whether a particular asset is switched on, which is the same question
 *  with the ticker in it. */
export const assetOn = (ticker: string): boolean => switchOn('asset.' + ticker)

/** How many providers are not healthy, for the badge on the console door. */
export const providersDown = (): number =>
  state.providers.filter((p) => p.state !== 'up').length

export const eligible = (): boolean =>
  state.checks.every((c) => c.state === 'passed')

/** The check that is stopping them, if one is. */
export const blockedBy = (): Check | undefined =>
  state.checks.find((c) => c.state === 'failed' || c.state === 'review')
export const limits = () => (verified() ? LIMITS.verified : LIMITS.none)
export const leftThisMonth = (): number =>
  Math.max(0, limits().monthly - state.usedThisMonth)

/** The most a single movement can be: the single-payment cap, or whatever is
 *  left of the month, whichever runs out first.
 *
 *  What answers to it, so the rule stops drifting: anything that crosses the
 *  boundary of the account. Sending, adding money, converting out, buying a
 *  share, and drawing on the credit line — a drawdown puts money in the wallet
 *  that was not there before, and it was the one outflow left uncapped, so an
 *  unverified account could take a $1,150 loan while being stopped from buying
 *  $300 of a share. What does not answer to it: moving your own money between
 *  your own buckets — lent out, taken back — and repaying. A limit that
 *  blocked a repayment would hold someone at 9.4% for the sake of a cap that
 *  exists to protect them. */
export const movementCeiling = (): number =>
  Math.min(limits().single, leftThisMonth())

/** Which ceiling is actually doing the stopping, so the message names the real
 *  one. Three can bind — the money, the month, and the single payment — and a
 *  message that names the wrong one sends someone to fix the wrong thing. */
export function ceilingLabel(byBalance: number, ownLabel: string): string {
  if (movementCeiling() >= byBalance) return ownLabel
  if (leftThisMonth() < limits().single) return 'What is left of your monthly limit'
  return verified() ? 'The most you can move in one go' : 'Your single payment limit until you verify'
}

/* ------------------------------------------------------------------ fees --
   The figure a person types is what they are investing. The fee is added on
   top, so "$50 of Nvidia" buys $50 of Nvidia and costs $50.25 — rather than
   buying $49.75 of it and leaving them to work out why. */
export const tradeFee = (amount: number): number =>
  Math.round(amount * state.fees.trade) / 100

/** What a card charges to move naira. Charged in naira, on the naira, because
 *  that is where the card network takes it — so it is added to what you pay
 *  rather than taken out of what you get, and the review says both figures. */
export const cardFee = (naira: number): number =>
  Math.round(naira * state.fees.card / 100)

/** The most that can be invested once the fee has to fit in the cash too. */
export const maxInvestable = (): number =>
  Math.floor((state.cash / (1 + state.fees.trade / 100)) * 100) / 100

/** What a trade was before its fee — the figure the person typed.
 *
 *  A movement records what left or arrived, which for a buy is the amount plus
 *  the fee and for a sell is the proceeds after it. Reading shares back off
 *  the recorded amount without undoing that gives the wrong count: a $200 buy
 *  of Nvidia was written as −$201.00 and read back as 1.6905 shares when
 *  1.6821 were bought. The rule lives here, beside buy() and sell(), because a
 *  receipt derived one way and a trade recorded another is how a document
 *  ends up disagreeing with the thing it documents. */
export const grossOf = (a: Activity): number =>
  a.type === 'Sold' ? Math.abs(a.amount) + (a.fee ?? 0) : Math.abs(a.amount) - (a.fee ?? 0)

export const bucketTotal = (): number =>
  state.bucket.reduce((t, b) => t + b.dollars, 0)

/** What the bucket costs all in — the fee is charged once on the whole
 *  payment, not per company, which is the point of paying once. */
export const bucketCost = (): number => bucketTotal() + tradeFee(bucketTotal())

export const bucketShortfall = (): number =>
  Math.max(0, bucketCost() - state.cash)

/** Every reason the basket cannot be paid for, company by company. Empty
 *  means it is safe to show a confirm button.
 *
 *  The bucket buys through the same door as a single trade — `payBucket` is a
 *  loop over `buy` — so it has to be refused for the same reasons. Checking
 *  only the launch set here would leave a paused asset, a stale reference
 *  price or an order too big for the book to be found one order into a
 *  payment that cannot be undone.
 *
 *  This is the till. The door, `addToBucket`, checks only the launch set:
 *  what can never be bought must not go in, but a company that is merely
 *  paused this morning is a reasonable thing to put by for later. */
export const bucketRefusals = (): { item: BucketItem; c?: Instrument; bad: Refusal[] }[] =>
  state.bucket
    .map((item) => {
      const c = find(item.ticker)
      return {
        item, c,
        bad: c
          ? refusals(c, item.dollars, { trading: !switchOn('buy'), asset: !assetOn(item.ticker) })
          : [{ code: 'missing', title: 'No longer listed',
               why: `${item.ticker} is not in the catalogue any more. Take it out and the rest can go through.` }],
      }
    })
    .filter((x) => x.bad.length > 0)

export const inBucket = (ticker: string): BucketItem | undefined =>
  state.bucket.find((b) => b.ticker === ticker)

export const holding = (ticker: string): Holding | undefined =>
  state.holdings.find((h) => h.ticker === ticker)

/* ---------- writes ---------- */

type Listener = () => void
const listeners = new Set<Listener>()
export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function changed(): void {
  remember()
  for (const fn of listeners) fn()
}

function record(a: Omit<Activity, 'ref' | 'at' | 'settled'> & Partial<Activity>): Activity {
  // A movement that left the building can come back unconfirmed. Interest and
  // moves between your own buckets cannot: there is nobody else in them.
  const outward = a.kind === 'payment' || a.kind === 'trade'
  const entry: Activity = {
    ref: a.ref ?? reference(),
    at: a.at ?? new Date().toISOString(),
    settled: a.settled ?? (outward ? settlement(a.amount) !== 'pending' : true),
    kind: a.kind,
    who: a.who,
    type: a.type,
    amount: a.amount,
    note: a.note,
    fee: a.fee,
    rail: a.rail,
    asset: a.asset,
    bill: a.bill,
    // Which balance moved, and on what. Dropped here once already, in the
    // same way `rail` was: a field the callers were carefully setting and the
    // record was quietly throwing away, so a payment made in this session
    // replayed out of the default purse rather than the one it named.
    purse: a.purse,
    net: a.net,
  }
  state.activity.unshift(entry)
  return entry
}

/** One movement, written down twice: as the row a person reads, and as the
 *  entries that have to balance. The same reference on both, so the receipt
 *  and the statement are provably the same event — and because `post` refuses
 *  an unbalanced set, an action cannot record a movement it cannot account
 *  for. That is the whole guarantee. */
function move(
  a: Omit<Activity, 'ref' | 'at' | 'settled'> & Partial<Activity>,
  what: string,
  entries: ledger.Entry[],
  extra: { kind?: string; rate?: number; pair?: string } = {},
): Activity {
  const entry = record(a)
  ledger.post({ ref: entry.ref, at: entry.at, what, entries, ...extra })
  return entry
}

export const actions = {
  /** The connection came or went. Nothing else in the app polls for this:
   *  the browser tells us, and every screen re-reads from here. */
  setOnline(v: boolean) {
    if (state.online === v) return
    state.online = v
    changed()
  },

  readNotification(id: string) {
    const n = state.notifications.find((x) => x.id === id)
    if (n && !n.read) { n.read = true; changed() }
  },

  readAllNotifications() {
    let any = false
    for (const n of state.notifications) if (!n.read) { n.read = true; any = true }
    if (any) changed()
  },

  toggleBalances() {
    state.prefs.hideBalances = !state.prefs.hideBalances
    changed()
  },

  setHomeView(v: 'simple' | 'detailed') {
    state.prefs.homeView = v
    changed()
  },

  /** Money that has left, for the monthly limit. Buying a share counts: the
   *  marketing's phrase is "financial and investment services", and a limit
   *  that only watched transfers would be a limit with a hole in it. */
  countAgainstLimit(amount: number) {
    state.usedThisMonth = Math.round((state.usedThisMonth + amount) * 100) / 100
  },

  /* ----- the ops console ----- */

  /** Flip a switch, and write down who did it. An audit line is not a nicety:
   *  the whole value of a kill switch is knowing afterwards who used it and
   *  when, and a console that changes the product silently is worse than no
   *  console. */
  flipSwitch(key: string, by = 'you@tokkenly') {
    const sw = state.switches.find((x) => x.key === key)
    if (!sw) return
    sw.on = !sw.on
    sw.by = by
    sw.at = new Date().toISOString()
    state.audit.unshift({
      at: sw.at, who: by, kind: 'change',
      what: (sw.on ? 'Turned on ' : 'Turned off ') + sw.label.toLowerCase(),
      target: 'Switch · ' + key,
    })
    changed()
  },

  /** Move a reconciliation break along. Three states, because "someone is on
   *  it" is a real and useful thing to know and a two-state list forces
   *  everybody to guess. */
  workBreak(id: string, to: Break['state'], by = 'you@tokkenly') {
    const b = state.breaks.find((x) => x.id === id)
    if (!b) return
    b.state = to
    state.audit.unshift({
      at: new Date().toISOString(), who: by, kind: 'change',
      what: to === 'cleared' ? 'Cleared a reconciliation break' : 'Picked up a reconciliation break',
      target: 'Break · ' + id,
    })
    changed()
  },

  /* ----- identity ----- */
  startVerification(method: 'NIN' | 'BVN', number: string) {
    state.kyc = { status: 'checking', method, last4: number.slice(-4) }
    changed()
  },
  finishVerification() {
    state.kyc = {
      ...state.kyc, status: 'verified',
      checkedOn: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    }
    // The five checks resolve with it. They are not decoration: eligibility is
    // what actually unlocks the product, and the last of them can pass while
    // the others do and still leave somebody unable to buy — which is the
    // point of keeping them apart.
    const at = new Date().toISOString()
    const said: Record<Check['key'], [CheckState, string]> = {
      identity: ['passed', `${state.kyc.method ?? 'NIN'} ending ${state.kyc.last4 ?? '••••'} matched your document and your photo.`],
      age: ['passed', `Born ${state.person.dob}. Over eighteen.`],
      residence: ['passed', 'Nigerian document. You are signing in from Lagos.'],
      sanctions: ['passed', 'No match on any list we have to check.'],
      product: ['passed', 'Nigeria is on the approved list for this pilot.'],
    }
    state.checks = state.checks.map((c) => ({ ...c, state: said[c.key][0], detail: said[c.key][1], at }))
    changed()
  },
  resetVerification() {
    state.kyc = { status: 'none' }
    state.checks = state.checks.map((c) => ({ ...c, state: 'pending', detail: '', at: undefined }))
    changed()
  },
  /** The other ending, and the one nobody builds. A person can be exactly who
   *  they say and still not be allowed to hold the instrument, and the screen
   *  that says so has to exist before somebody meets it. */
  failEligibility() {
    const at = new Date().toISOString()
    state.kyc = { ...state.kyc, status: 'verified',
      checkedOn: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
    state.checks = state.checks.map((c) => c.key === 'product'
      ? { ...c, state: 'failed' as CheckState, at,
          detail: 'Your address is outside the pilot. We know who you are. We cannot open trading for you yet.' }
      : { ...c, state: 'passed' as CheckState, at, detail: 'Passed' })
    changed()
  },

  /* --------------------------------------------------------- sending out --
     One act, three rails. Send and Withdraw used to be two screens for one
     errand — "why is there a send and there is a withdrawal?" — and the
     honest answer is that there is not. Both take dollars out of the same
     wallet; what differs is where they land, and that one fact decides the
     currency, the speed, the fee and whether anybody's name needs checking.

     So the destination is the question, and everything else follows from it:

       tokkenly  another account here. Dollars, instantly, free.
       chain     a Base address. Dollars, on the network, free, and final.
       bank      any Nigerian account, yours or somebody else's. Dollars out,
                 naira in, at the rate — which makes it a conversion, so it is
                 two postings joined by that rate rather than one.
  */
  sendMoney(to: Destination, amount: number, rate = state.ngnPerUsd,
            asset: Asset = state.prefs.payWith, net?: string): Activity {
    // One limit policy for every outflow (item 06), and the limit is a dollar
    // figure — so a payment made in naira counts the dollars it is worth
    // rather than the naira it is. Counting the naira put ₦145,000 against a
    // $1,000 month and shut the account after one bill.
    actions.countAgainstLimit(asset === 'ngn' ? amount / rate : amount)
    // Naira out to a Nigerian bank, from naira. No desk, no rate, no second
    // posting: the naira you held are the naira that left, and a conversion
    // between naira and naira is a fiction with a spread in it.
    if (to.rail === 'bank' && asset === 'ngn') {
      const account = to.bankId ? 'bank:' + to.bankId : 'payee:' + to.name
      ledger.account(account, to.name + (to.number ? ' ···· ' + to.number.slice(-4) : ''))
      const a = record({
        kind: 'payment', who: to.name, type: 'Sent', amount: -Math.round(amount) / rate,
        note: to.bankId ? 'Converted to naira' : 'Paid out in naira',
        purse: 'ngn', settled: false,
      })
      ledger.post({
        ref: a.ref, at: a.at,
        what: `${naira(amount)} queued for ${to.name}`,
        entries: [{ account: 'wallet.ngn', amount: -amount },
                  { account: 'payout', amount: amount }],
      })
      setTimeout(() => actions.landPayout(a.ref, rate), PAYOUT_MS)
      changed()
      return a
    }
    if (to.rail === 'bank') {
      // Two stages, because there are two. The dollars leave the wallet the
      // moment it is authorised and the naira reach somebody's bank when the
      // banks get round to it, and a screen that calls the first one "sent"
      // is telling somebody their rent is paid when it is sitting on a desk.
      // So this half only ever writes what has actually happened.
      const naira = Math.round(amount * rate)
      const account = to.bankId ? 'bank:' + to.bankId : 'payee:' + to.name
      ledger.account(account, to.name + (to.number ? ' ···· ' + to.number.slice(-4) : ''))
      const a = record({
        kind: 'payment', who: to.name, type: 'Sent', amount: -amount,
        note: to.bankId ? 'Converted to naira' : 'Paid out in naira',
        purse: asset, settled: false,
      })
      ledger.post({
        ref: a.ref, at: a.at, pair: a.ref, rate,
        what: `Took ${usd(amount)} from your ${assetOf(asset)!.name}`,
        entries: [{ account: purseFor(asset), amount: -amount }, { account: 'desk.usd', amount }],
      })
      // The naira are ours until the bank has them. `payout` is the account
      // they wait in, and it is the figure the Transfer screen shows as money
      // on its way out.
      ledger.post({
        ref: a.ref, at: a.at, pair: a.ref, rate,
        what: `₦${naira.toLocaleString('en-US')} queued for ${to.name}`,
        entries: [{ account: 'desk.ngn', amount: -naira }, { account: 'payout', amount: naira }],
      })
      setTimeout(() => actions.landPayout(a.ref, rate), PAYOUT_MS)
      changed()
      return a
    }
    // Dollars, and the far end is the only difference: a Tokkenly account, or
    // the network for anything outside it.
    const on = net ?? defaultNet(asset)?.key ?? 'base'
    const far = to.rail === 'tokkenly' ? 'person:' + to.name : 'chain.' + on
    if (to.rail === 'tokkenly') ledger.account(far, to.name)
    const a = move(
      { kind: 'payment', who: to.name, type: 'Sent', amount: -amount,
        purse: asset, net: to.rail === 'tokkenly' ? undefined : on },
      `Sent ${usd(amount)} to ${to.name}`,
      [{ account: purseFor(asset), amount: -amount }, { account: far, amount }],
    )
    changed()
    return a
  },

  /* A bill, paid out of whichever balance was chosen.
   *
   *  Airtime, data and a meter all end in naira reaching somebody who is not
   *  us. What differs is where those naira came from, and the two cases are
   *  genuinely different movements rather than one movement with a label:
   *
   *    from naira        one posting. The naira you held are the naira the
   *                      network took. No desk, no rate, nothing quoted.
   *    from a stablecoin a conversion: two postings joined by the rate the
   *                      person was shown, one in each currency, because a
   *                      single entry cannot be denominated twice.
   *
   *  It settles at once, and that is not a shortcut. A bank payout waits on
   *  a bank and has an account to wait in; a top-up has nothing to wait for.
   *  The network takes it or refuses it, and a refusal never gets here: the
   *  review checks `billOutcome` before it confirms, so nothing is written
   *  and nothing leaves the wallet. */
  payBill(bill: { what: string; who: string; naira: number; target: string;
                  prepaid?: boolean; note?: string; asset?: Asset },
          rate = state.ngnPerUsd): Activity {
    const asset = bill.asset ?? state.prefs.payWith
    const dollars = Math.round((bill.naira / rate) * 100) / 100
    // Counted whichever balance paid. Item 06 says one limit policy for every
    // outflow, and a bill paid from naira is an outflow — the ceiling is a
    // dollar figure, so what is counted is what it was worth.
    actions.countAgainstLimit(dollars)
    const a = record({
      kind: 'payment', who: bill.who, type: bill.what, amount: -dollars,
      note: bill.note, purse: asset,
      bill: { target: bill.target, naira: bill.naira },
      settled: true,
    })
    // The token is what a prepaid payment actually buys, and it is derived
    // from the reference, so it can only be minted once the record has one.
    // Written down rather than recomputed on every read: a receipt opened
    // tomorrow has to show the same twenty digits somebody typed into a wall.
    if (bill.prepaid) a.bill!.token = tokenFor(a.ref)
    if (asset === 'ngn') {
      ledger.post({
        ref: a.ref, at: a.at,
        what: `${naira(bill.naira)} paid to ${bill.who}`,
        entries: [{ account: 'wallet.ngn', amount: -bill.naira },
                  { account: 'biller', amount: bill.naira }],
      })
      changed()
      return a
    }
    ledger.post({
      ref: a.ref, at: a.at, pair: a.ref, rate,
      what: `Took ${usd(dollars)} from your ${assetOf(asset)!.name}`,
      entries: [{ account: purseFor(asset), amount: -dollars }, { account: 'desk.usd', amount: dollars }],
    })
    ledger.post({
      ref: a.ref, at: a.at, pair: a.ref, rate,
      what: `${naira(bill.naira)} paid to ${bill.who}`,
      entries: [
        { account: 'desk.ngn', amount: -bill.naira },
        { account: 'biller', amount: bill.naira },
      ],
    })
    changed()
    return a
  },

  /* ------------------------------------------------------- adding money --
     Money arriving takes time, and the product used to pretend it did not.
     `addMoney` credited the wallet the instant the button was pressed, from a
     bank nobody had told, which is the single most dishonest thing the
     prototype did: it invented the one event the whole flow is about.

     There are two ways in and they behave differently, which is the reason to
     offer both rather than to dress one up as two.

       transfer  You push naira to a virtual account that belongs to you.
                 Free, and it takes as long as the banks take. Nobody can hold
                 a rate while somebody types an account number into another
                 app, so the rate is struck when the money lands and the
                 screen says so.
       card      We pull the naira. Seconds, and it costs the card fee, so a
                 firm rate can be held for the ninety seconds it takes.

     Both run in two steps. `startAddMoney` records what left; `landAddMoney`
     records what arrived and converts it. In between, the naira sits in
     `inflight` — an account that is neither yours nor ours, which is exactly
     what money between two banks is. The wallet does not move until step two,
     and because every balance is derived there is no way to make it. */
  startAddMoney(amount: number, via: { kind: 'transfer' | 'card'; id?: string },
                rate = state.ngnPerUsd, into: Asset = state.prefs.payWith): Activity {
    actions.countAgainstLimit(amount)
    const naira = Math.round(amount * rate)
    const from = via.kind === 'card'
      ? state.cards.find((c) => c.id === via.id) ?? state.cards[0]
      : state.banks.find((b) => b.id === via.id) ?? state.banks[0]
    const account = via.kind === 'card' ? 'card:' + from.id : 'bank:' + from.id
    const label = via.kind === 'card'
      ? (from as Card).brand + ' ···· ' + from.last4
      : (from as Bank).name + ' ···· ' + from.last4
    ledger.account(account, label)
    // A card takes its cut in naira, on the naira, so it is added to what you
    // pay rather than taken out of what you get — and the review says both
    // figures rather than one. A transfer costs nothing, which is the whole
    // difference between the two rails and the reason to show both.
    const fee = via.kind === 'card' ? cardFee(naira) : 0
    const a = record({
      kind: 'payment', who: via.kind === 'card' ? (from as Card).brand + ' card' : (from as Bank).name,
      type: 'Received', amount, note: 'Bought dollars', rail: via.kind === 'card' ? 'card' : 'bank',
      // It has not landed. `settlement()` still decides the two magic
      // endings — a card that declines and one that goes unanswered — but
      // anything else starts pending and stays pending until the naira is
      // actually in our account.
      purse: into, settled: false,
    })
    ledger.post({
      ref: a.ref, at: a.at, rate,
      what: via.kind === 'card'
        ? `${label} charged ₦${naira.toLocaleString('en-US')}`
        : `₦${naira.toLocaleString('en-US')} sent from ${label}`,
      entries: [
        { account, amount: -(naira + fee) },
        { account: 'inflight', amount: naira },
        ...(fee ? [{ account: 'fees.ngn', amount: fee }] : []),
      ],
    })
    changed()
    return a
  },

  /** Stage two of a payout: the naira actually reach the bank.
   *
   *  Until this runs, the activity row is unsettled, the receipt says which
   *  stage it is at, and nothing anywhere calls it complete. The spec's line
   *  is "never describe a bank withdrawal as complete until the payout is
   *  confirmed", and the only way to keep that promise is to have somewhere
   *  for the money to be in the meantime. */
  landPayout(ref: string, rate = state.ngnPerUsd): void {
    const a = state.activity.find((x) => x.ref === ref)
    if (!a || a.settled) return
    // The same magic value, on the way out. `.98` is a payout the bank never
    // confirms: the naira sit in our payout account and the row stays open.
    if (settlement(a.amount) === 'pending') return
    const ngn = Math.round(Math.abs(a.amount) * rate)
    const account = ledger.accounts().find((x) => x.name.startsWith(a.who))?.id
      ?? 'payee:' + a.who
    ledger.post({
      ref, at: new Date().toISOString(),
      what: `₦${ngn.toLocaleString('en-US')} reached ${a.who}`,
      entries: [{ account: 'payout', amount: -ngn }, { account, amount: ngn }],
    })
    a.settled = true
    state.notifications.unshift({
      id: 'n-' + ref,
      kind: 'money',
      title: `₦${ngn.toLocaleString('en-US')} reached ${a.who}`,
      body: `The ${usd(Math.abs(a.amount))} left your wallet earlier; the bank has it now.`,
      at: new Date().toISOString(),
      read: false,
      ref,
      emailed: 'always',
    })
    changed()
  },

  /** The other half: the naira reaches the Tokkenly account and is converted.
   *  The rate is the one honoured at this moment rather than the one shown
   *  when the transfer was started, because that is the truth of it — and on
   *  the card, where a quote was held, the two are the same number. */
  landAddMoney(ref: string, rate = state.ngnPerUsd): void {
    const a = state.activity.find((x) => x.ref === ref)
    if (!a || a.settled) return
    // The one that never arrives. `.98` is the product's magic value for
    // "no answer", and with money genuinely in flight it finally has a state
    // to mean: the transfer sits in `inflight` and stays there. The rule is
    // here rather than on the screen that waits, because a rule that only
    // exists in a view is a rule one route around the view undoes.
    if (settlement(a.amount) === 'pending') return
    const ngn = Math.round(a.amount * rate)
    ledger.post({
      ref, at: new Date().toISOString(),
      what: `₦${ngn.toLocaleString('en-US')} reached your Tokkenly naira account`,
      entries: [{ account: 'inflight', amount: -ngn }, { account: 'collect', amount: ngn }],
    })
    // Naira in, naira kept. Nothing is converted, so there is no desk and no
    // rate: the money simply moves from the account we collected it into to
    // the one that is yours. This is the movement the product used to have no
    // way to make, which is why every naira that arrived had to become
    // dollars whether anybody wanted that or not.
    if (a.purse === 'ngn') {
      ledger.post({
        ref, at: new Date().toISOString(),
        what: `${naira(ngn)} paid into your naira balance`,
        entries: [{ account: 'collect', amount: -ngn }, { account: 'wallet.ngn', amount: ngn }],
      })
      a.settled = true
      state.notifications.unshift({
        id: 'n-' + ref, kind: 'money',
        title: `${naira(ngn)} landed in your naira balance`,
        body: `From ${a.who}. Nothing was converted.`,
        at: new Date().toISOString(), read: false, ref, emailed: 'always',
      })
      changed()
      return
    }
    // The conversion itself: two postings, one in each currency, joined by the
    // rate. One entry cannot be denominated twice.
    ledger.post({
      ref, at: new Date().toISOString(), pair: ref, rate,
      what: `₦${ngn.toLocaleString('en-US')} went to the currency desk`,
      entries: [{ account: 'collect', amount: -ngn }, { account: 'desk.ngn', amount: ngn }],
    })
    ledger.post({
      ref, at: new Date().toISOString(), pair: ref, rate,
      what: `Converted to ${usd(a.amount)} and paid to your ${assetOf(a.purse ?? 'usdc')!.name}`,
      entries: [{ account: 'desk.usd', amount: -a.amount },
                { account: purseFor(a.purse ?? 'usdc'), amount: a.amount }],
    })
    a.settled = true
    // The one genuinely asynchronous event in the product, and so the one that
    // has to say so out loud. The waiting sheet tells people they can close it
    // and carry on; without this, carrying on means never being told it
    // arrived. It is also the first notification the product has ever written
    // — the other five are seeded — which is what finally makes the switch in
    // Preferences gate something real rather than filter a fixed list.
    state.notifications.unshift({
      id: 'n-' + ref,
      kind: 'money',
      title: `${usd(a.amount)} landed in your wallet`,
      body: `₦${ngn.toLocaleString('en-US')} from ${a.who}, at ${naira(rate)} to the dollar.`,
      at: new Date().toISOString(),
      read: false,
      ref,
    })
    changed()
  },


  /** Buying something you do not already hold opens the position. It used to
   *  take the money and add the shares only `if (h)`, so a first purchase —
   *  the one the whole product is for — charged the wallet, created nothing,
   *  and reported "you now own undefined shares". */
  buy(ticker: string, dollars: number,
      asset: Asset = payAsset()): { activity: Activity; shares: number; fee: number; invested: number } {
    const c = find(ticker)
    if (!c) throw new Error('No such instrument: ' + ticker)
    // Never spend money that is not there, whatever the caller asks for —
    // and the fee is part of what has to be there. The composer clamps too;
    // this is the floor under it.
    const spend = Math.max(0, Math.min(dollars, maxInvestable()))
    const fee = tradeFee(spend)
    const shares = spend / c.price
    actions.countAgainstLimit(spend + fee)
    // Both halves, in one movement that has to balance in both of the things
    // it touches. Dollars: the wallet pays the market for the shares and pays
    // us the fee. Apple: the same number of shares leaves the market and
    // arrives in custody in your name. The holdings list is a reading of that
    // second half, so the position cannot be credited without the trade that
    // bought it — and the shares are counted in shares rather than valued in
    // dollars, because an account holding "the value of your Apple" would move
    // every time the market did, which is not a thing a ledger account does.
    const activity = move(
      { kind: 'trade', who: c.name, type: 'Bought', amount: -(spend + fee), fee, purse: asset },
      `Bought ${usd(spend)} of ${c.name}`,
      [{ account: purseFor(asset), amount: -(spend + fee) },
       { account: 'market', amount: spend },
       { account: 'fees', amount: fee },
       { account: 'float:' + c.ticker, amount: -shares },
       { account: 'held:' + c.ticker, amount: shares }],
    )
    changed()
    return { activity, shares, fee, invested: spend }
  },

  /** And selling is bounded by what is actually held, so a holding can never
   *  go negative and the wallet can never be paid for shares that were not
   *  there. A position sold out entirely leaves rather than sitting at zero. */
  sell(ticker: string, dollars: number,
       asset: Asset = payAsset()): { activity: Activity; shares: number; fee: number; proceeds: number } {
    const h = holding(ticker)
    const c = find(ticker)
    if (!h || !c) throw new Error('Nothing held in ' + ticker)
    const value = Math.max(0, Math.min(dollars, h.shares * h.price))
    const fee = tradeFee(value)
    const shares = value / h.price
    // Selling $100 puts $99.50 in the wallet: the fee comes out of what you
    // get, not out of what you sold, which is the figure on the review. The
    // shares go back the way they came, and a position sold out entirely
    // leaves the list because nothing is left in custody to read.
    const activity = move(
      { kind: 'trade', who: c.name, type: 'Sold', amount: value - fee, fee, purse: asset },
      `Sold ${usd(value)} of ${c.name}`,
      [{ account: 'market', amount: -value },
       { account: purseFor(asset), amount: value - fee },
       { account: 'fees', amount: fee },
       { account: 'held:' + c.ticker, amount: -shares },
       { account: 'float:' + c.ticker, amount: shares }],
    )
    changed()
    return { activity, shares, fee, proceeds: value - fee }
  },

  /** Hand shares to another Tokkenly account.
   *
   *  No fee, because the fees card says sending costs nothing and a share is
   *  not a special case of that. No wallet movement either: the portfolio goes
   *  down by what left it and the cash balance does not move, which is the
   *  whole difference between this and selling.
   *
   *  Bounded by what is actually held, like sell(), so a holding can never go
   *  negative however the caller was written. The refusal for a recipient
   *  without an account is on the screen, not here — but the floor is here as
   *  well, because a rule that only exists in a view is a rule one route
   *  around the view undoes. */
  sendShares(ticker: string, dollars: number, to: string):
      { activity: Activity; shares: number; value: number } {
    const p = state.people.find((x) => x.name === to)
    if (!p?.onTokkenly) throw new Error(to + ' does not hold a Tokkenly account')
    const h = holding(ticker)
    const c = find(ticker)
    if (!h || !c) throw new Error('Nothing held in ' + ticker)
    const value = Math.max(0, Math.min(dollars, h.shares * h.price))
    const shares = value / h.price
    // Rule from item 06: one limit policy for every outflow. A share leaving
    // the account is an outflow — an unverified account handing somebody
    // $5,000 of Apple is exactly what a ceiling is for — so it counts against
    // the month like a payment does.
    actions.countAgainstLimit(value)
    // Units, and no money. The movement balances in Apple and touches no
    // dollar account at all, which is the ledger saying the same thing the
    // screen does: this is not a sale, nobody was paid, and the position
    // simply is not yours any more.
    const activity = move(
      { kind: 'trade', who: to, type: 'Sent', amount: -value,
        asset: { ticker: c.ticker, shares, price: h.price } },
      `Sent ${sharesOf(shares)} ${c.ticker} to ${to}`,
      [{ account: 'held:' + c.ticker, amount: -shares },
       { account: 'sent:' + c.ticker, amount: shares }],
    )
    changed()
    return { activity, shares, value }
  },

  borrow(amount: number, asset: Asset = payAsset()): Activity {
    actions.countAgainstLimit(amount)
    // The loan account goes negative by what you drew, because it is not
    // yours. The wallet goes up by the same. Nothing was created.
    const a = move(
      { kind: 'grow', who: 'Borrowing', type: 'Borrowed', amount, purse: asset },
      `Drew ${usd(amount)} against your shares`,
      [{ account: 'loan', amount: -amount }, { account: purseFor(asset), amount }],
    )
    changed()
    return a
  },

  repay(amount: number, asset: Asset = payAsset()): Activity {
    // Interest first, then principal. Both are liabilities of yours, so
    // clearing them moves money from one of your accounts to another — the
    // interest was charged when it accrued, not when it is paid.
    const toInterest = Math.min(amount, state.interestOwed)
    const toPrincipal = Math.min(amount - toInterest, state.borrowed)
    const a = move(
      { kind: 'grow', who: 'Borrowing', type: 'Repaid', amount: -(toInterest + toPrincipal), purse: asset },
      `Repaid ${usd(toInterest + toPrincipal)} of what you owe`,
      [{ account: purseFor(asset), amount: -(toInterest + toPrincipal) },
       { account: 'loan.int', amount: toInterest },
       { account: 'loan', amount: toPrincipal }],
    )
    changed()
    return a
  },

  lend(amount: number, asset: Asset = payAsset()): Activity {
    const a = move(
      { kind: 'grow', who: 'Lending', type: 'Lent', amount: -amount, purse: asset },
      `Lent ${usd(amount)} into the pool`,
      [{ account: purseFor(asset), amount: -amount }, { account: 'lent', amount }],
    )
    changed()
    return a
  },

  takeBack(amount: number, asset: Asset = payAsset()): Activity {
    const back = Math.min(amount, state.lent)
    const a = move(
      { kind: 'grow', who: 'Lending', type: 'Taken back', amount: back, purse: asset },
      `Took ${usd(back)} back out of the pool`,
      [{ account: 'lent', amount: -back }, { account: purseFor(asset), amount: back }],
    )
    changed()
    return a
  },

  finishIntro() {
    state.seenIntro = true
    changed()
  },
  replayIntro() {
    state.seenIntro = false
    changed()
  },

  /* ----- preferences ----- */
  setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    state.prefs[key] = value
    if (key === 'theme') applyTheme()
    changed()
  },
  setNotify(key: keyof Prefs['notify'], on: boolean) {
    state.prefs.notify[key] = on
    changed()
  },
  putAwayTask(id: string) {
    if (!state.prefs.putAway.includes(id)) state.prefs.putAway.push(id)
    changed()
  },
  showTasksAgain() {
    state.prefs.putAway = []
    changed()
  },

  resetPrefs() {
    state.prefs = { ...DEFAULT_PREFS, notify: { ...DEFAULT_PREFS.notify } }
    applyTheme()
    changed()
  },

  /* ----- security ----- */
  /** The five-attempt ceiling is here rather than in the screen, so every
   *  place that asks for the PIN counts against the same total. */
  checkPin(pin: string): boolean {
    if (pin === state.security.pin) {
      state.security.wrongPin = 0
      remember()
      return true
    }
    state.security.wrongPin += 1
    remember()
    return false
  },
  pinLocked: (): boolean => state.security.wrongPin >= 5,
  clearPinAttempts() {
    state.security.wrongPin = 0
    remember()
  },
  setPin(pin: string) {
    state.security.pin = pin
    state.security.pinChanged = today()
    state.security.wrongPin = 0
    changed()
  },
  setPassword(next: string) {
    state.security.password = next
    state.security.passwordChanged = today()
    changed()
  },
  setSecurity<K extends 'faceId' | 'appLock'>(key: K, on: boolean) {
    state.security[key] = on
    changed()
  },

  /* ----- the bucket ----- */
  /** The bucket is a queue of purchases, so the gate that stands in front of
   *  buying one company stands in front of joining the queue. Without this
   *  the bucket is a way round every check in the product: the composer
   *  refuses a company that is not in the launch set, and the bucket would
   *  have bought the same company at the till without asking anything.
   *  Returns whether it went in, so a caller can avoid celebrating a thing
   *  that did not happen. */
  addToBucket(ticker: string, dollars: number): boolean {
    const c = find(ticker)
    if (!c || !tradable(c)) return false
    const it = state.bucket.find((b) => b.ticker === ticker)
    if (it) it.dollars += dollars
    else state.bucket.push({ ticker, dollars })
    changed()
    return true
  },
  /** Deliberately does not broadcast. Every listener re-renders the whole
   *  screen, and this is called from a field's own change handler — rebuilding
   *  the screen out from under a focused input throws on the blur that
   *  follows. Nothing outside the bucket screen shows these amounts, and that
   *  screen repaints the parts that moved itself. */
  setBucketAmount(ticker: string, dollars: number) {
    const it = state.bucket.find((b) => b.ticker === ticker)
    if (it) it.dollars = Math.max(0, Math.round(dollars * 100) / 100)
  },
  removeFromBucket(ticker: string) {
    state.bucket = state.bucket.filter((b) => b.ticker !== ticker)
    changed()
  },
  clearBucket() {
    state.bucket = []
    changed()
  },
  /** One payment, one order per company. The receipts have to stay per
   *  company or a history row could never be reconciled against a holding. */
  payBucket(): { refs: string[]; spent: number; lines: { ticker: string; shares: number }[] } {
    const refs: string[] = []
    const lines: { ticker: string; shares: number }[] = []
    let spent = 0
    // The fee is charged once on the whole payment rather than per company —
    // that is what paying once is for — so the individual buys go through at
    // no fee and the single charge is applied after.
    const fee = tradeFee(bucketTotal())
    const kept = state.fees.trade
    state.fees.trade = 0
    try {
      for (const it of [...state.bucket]) {
        if (it.dollars <= 0) continue
        const { activity, shares } = actions.buy(it.ticker, it.dollars)
        refs.push(activity.ref)
        lines.push({ ticker: it.ticker, shares })
        spent += Math.abs(activity.amount)
      }
    } finally { state.fees.trade = kept }
    // The one fee for the whole payment, posted on its own so the statement
    // shows a single charge rather than one per company.
    if (fee > 0) {
      move(
        { kind: 'trade', who: 'Tokkenly', type: 'Fee', amount: -fee, fee },
        `Fee on one payment for ${lines.length} ${lines.length === 1 ? 'company' : 'companies'}`,
        [{ account: purseFor(payAsset()), amount: -fee }, { account: 'fees', amount: fee }],
      )
    }
    spent += fee
    state.bucket = []
    changed()
    return { refs, spent, lines }
  },

  toggleWatch(ticker: string) {
    const i = state.watchlist.indexOf(ticker)
    if (i === -1) state.watchlist.push(ticker)
    else state.watchlist.splice(i, 1)
    changed()
  },

  addBank(name: string, number: string) {
    const last4 = number.slice(-4)
    state.banks.push({
      id: name.toLowerCase().replace(/\s+/g, '') + last4,
      name, last4, number, holder: state.person.name,
    })
    changed()
  },

  updatePerson(field: 'email' | 'phone' | 'address', value: string) {
    state.person[field] = value
    changed()
  },

  signOutDevice(id: string) {
    state.devices = state.devices.filter((d) => d.id !== id)
    changed()
  },

  signOutEverywhere() {
    state.devices = state.devices.filter((d) => d.current)
    changed()
  },

  joinCardWaitlist() {
    state.cardWaitlist = true
    changed()
  },

  markPhraseWritten() {
    state.phraseWrittenDown = true
    changed()
  },

  signIn() {
    state.signedIn = true
    // Getting in with the password is getting in. Asking for the PIN
    // immediately afterwards is asking the same question twice.
    actions.unlock()
  },

  signOut() {
    state.signedIn = false
    actions.lock()
  },

  unlock() {
    state.unlocked = true
    state.security.wrongPin = 0
    try { sessionStorage.setItem(SESSION, '1') } catch { /* fine */ }
    changed()
  },

  lock() {
    state.unlocked = false
    try { sessionStorage.removeItem(SESSION) } catch { /* fine */ }
    changed()
  },
}
