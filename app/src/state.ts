/** The one source of truth. Every figure the screens show is derived from
 *  here, so a flow that moves money changes every screen that mentions it.
 *  Opening figures match design.md 11b.4f. */

import { reference } from './format'
import { find } from './catalogue'

export type ActivityKind = 'payment' | 'trade' | 'grow'

export interface Activity {
  ref: string
  kind: ActivityKind
  who: string
  type: string
  amount: number          // signed, in dollars
  at: string              // ISO
  note?: string
  settled: boolean
}

/** Everything the person can decide about how the product behaves. Grouped
 *  rather than scattered through State so the Account screen has one thing to
 *  read and one thing to reset. */
export interface Prefs {
  /** Where Home opens. Simple is three doors and the number; Detailed is the
   *  chart, the positions and the rest. */
  homeView: 'simple' | 'detailed'
  theme: 'dark' | 'light'
  /** The product is for Nigerians holding dollars, so the naira line beside a
   *  figure is the setting people actually change. */
  showNaira: boolean
  /** What "Add to bucket" puts against a company before you edit it. */
  tradeDefault: number
  /** Ask again, above this, before anything leaves. 0 turns it off. */
  confirmOver: number
  notify: { payments: boolean; prices: boolean; earn: boolean; borrowing: boolean }
}

export const DEFAULT_PREFS: Prefs = {
  homeView: 'simple',
  theme: 'dark',
  showNaira: true,
  tradeDefault: 50,
  confirmOver: 500,
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
}

export interface Notif {
  id: string
  kind: 'money' | 'trade' | 'grow' | 'security'
  title: string
  body: string
  at: string
  read: boolean
}

export interface Bank {
  id: string
  name: string
  last4: string
  holder: string
}

export interface Device {
  id: string
  name: string
  seen: string
  current: boolean
}

export interface State {
  signedIn: boolean
  /** Whether this app session has been unlocked. Kept in sessionStorage, not
   *  localStorage: an unlock that outlives the tab is not a lock, and a lock
   *  that outlives a reload of a tab you never closed is an annoyance. The
   *  tab closing is the cold start the lock exists for. */
  unlocked: boolean
  prefs: Prefs
  security: Security
  person: { name: string; email: string; phone: string; dob: string; address: string }
  cash: number
  inEarn: number
  earnedSoFar: number
  borrowed: number
  interestOwed: number
  borrowLimit: number
  rates: { earn: number; borrow: number; collateral: number }
  /** What a transaction costs, as a percentage. The marketing sells this:
   *  "the amount, the rate, the fee, and exactly what you receive, before you
   *  confirm. Nothing folded into a worse rate." A product that answers that
   *  with "free" is not being transparent, it is being vague — and the two
   *  ship together. `fx` is nought because the naira rate on screen is the
   *  rate you get; that is the "nothing folded in" half of the promise. */
  fees: { trade: number; fx: number }
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
  banks: Bank[]
  devices: Device[]
  activity: Activity[]
  notifications: Notif[]
  /** Whether the intro has been seen. It gates the landing route only, so a
   *  deep link still goes where it points. */
  seenIntro: boolean
  cardWaitlist: boolean
  phraseWrittenDown: boolean
  ngnPerUsd: number
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
  unlocked: false,
  prefs: { ...DEFAULT_PREFS, notify: { ...DEFAULT_PREFS.notify } },
  security: { ...DEFAULT_SECURITY },
  person: {
    name: 'Chinaza Okoro',
    email: 'ibrahimweng0@gmail.com',
    phone: '+234 802 431 9087',
    dob: '14 March 1996',
    address: '12 Awolowo Road, Ikoyi, Lagos',
  },
  cash: 2480,
  inEarn: 1240,
  earnedSoFar: 18.6,
  borrowed: 380,
  interestOwed: 8.9,
  borrowLimit: 1860,
  rates: { earn: 4.8, borrow: 9.4, collateral: 140 },
  fees: { trade: 0.5, fx: 0 },
  kyc: { status: 'none' },
  usedThisMonth: 180,
  holdings: [
    { ticker: 'AAPL', name: 'Apple', shares: 23.42, price: 224.1, dayPct: 1.2 },
    { ticker: 'NVDA', name: 'Nvidia', shares: 26.94, price: 118.9, dayPct: 2.4 },
    { ticker: 'VOO', name: 'Vanguard S&P 500', shares: 5.6, price: 511.57, dayPct: 0.4 },
    { ticker: 'TSLA', name: 'Tesla', shares: 4.8, price: 248.5, dayPct: -0.8 },
  ],
  bucket: [],
  watchlist: ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'VOO'],
  banks: [
    { id: 'gt', name: 'GTBank', last4: '4471', holder: 'Chinaza Okoro' },
    { id: 'kuda', name: 'Kuda', last4: '8820', holder: 'Chinaza Okoro' },
  ],
  devices: [
    { id: 'mac', name: 'Chrome on Mac', seen: 'Now', current: true },
    { id: 'iphone', name: 'iPhone 13', seen: 'Today 09:12', current: false },
    { id: 'pixel', name: 'Pixel 7', seen: '2 days ago', current: false },
  ],
  notifications: [
    { id: 'n1', kind: 'money', title: 'Adaeze Okonkwo paid you $120.00',
      body: 'It is already in your wallet.', at: iso('2026-09-05T14:32'), read: false },
    { id: 'n2', kind: 'trade', title: 'Your Apple order filled',
      body: '1.87 shares at $224.10.', at: iso('2026-09-05T14:05'), read: false },
    { id: 'n3', kind: 'grow', title: 'Earn paid you $0.16',
      body: 'Interest lands every morning while your dollars sit in Earn.', at: iso('2026-09-04T00:05'), read: false },
    { id: 'n4', kind: 'security', title: 'New sign in on Pixel 7',
      body: 'Lagos, Nigeria. If this was not you, sign out everywhere.', at: iso('2026-09-03T21:10'), read: true },
    { id: 'n5', kind: 'money', title: 'Payroll arrived',
      body: '$1,500.00 from Kuda ending 8820.', at: iso('2026-08-29T08:00'), read: true },
  ],
  seenIntro: false,
  cardWaitlist: false,
  phraseWrittenDown: false,
  ngnPerUsd: 1500,
  activity: [
    { ref: 'TKN-8F2K90', kind: 'payment', who: 'Adaeze Okonkwo', type: 'Received', amount: 120, at: iso('2026-09-05T14:32'), settled: true },
    { ref: 'TKN-8E4J77', kind: 'trade', who: 'Apple', type: 'Bought', amount: -420, at: iso('2026-09-05T14:05'), settled: true },
    { ref: 'TKN-7D1J83', kind: 'payment', who: 'Tunde Bakare', type: 'Sent', amount: -45, at: iso('2026-09-04T09:14'), settled: true },
    { ref: 'TKN-7C8H62', kind: 'grow', who: 'Earn', type: 'Interest', amount: 0.16, at: iso('2026-09-04T00:05'), settled: true },
    { ref: 'TKN-6C9H77', kind: 'payment', who: 'Payroll', type: 'Received', amount: 1500, at: iso('2026-08-29T08:00'), settled: true },
    { ref: 'TKN-6B4G61', kind: 'trade', who: 'Tesla', type: 'Sold', amount: 260, at: iso('2026-08-28T19:20'), settled: true },
    { ref: 'TKN-5Z2E44', kind: 'payment', who: 'Adaeze Okonkwo', type: 'Sent', amount: -80, at: iso('2026-08-26T16:40'), settled: true },
    { ref: 'TKN-5Y3D31', kind: 'trade', who: 'Nvidia', type: 'Bought', amount: -380, at: iso('2026-08-26T11:05'), settled: true },
    { ref: 'TKN-4X1C25', kind: 'payment', who: 'Rent', type: 'Sent', amount: -620, at: iso('2026-08-24T07:00'), settled: true },
    { ref: 'TKN-3V0A04', kind: 'payment', who: 'Tunde Bakare', type: 'Sent', amount: -30, at: iso('2026-08-22T10:22'), settled: true },
    { ref: 'TKN-2T9Y81', kind: 'payment', who: 'Data top up', type: 'Sent', amount: -12, at: iso('2026-08-20T18:35'), settled: true },
    { ref: 'TKN-2S4X70', kind: 'grow', who: 'Borrow', type: 'Borrowed', amount: 500, at: iso('2026-08-12T10:40'), settled: true },
    { ref: 'TKN-2R7W58', kind: 'payment', who: 'Chidi Nwosu', type: 'Received', amount: 65, at: iso('2026-08-11T13:05'), settled: true },
    { ref: 'TKN-1Q6V47', kind: 'payment', who: 'MTN airtime', type: 'Sent', amount: -8, at: iso('2026-08-09T19:48'), settled: true },
    { ref: 'TKN-1P5U36', kind: 'trade', who: 'Vanguard S&P 500', type: 'Bought', amount: -300, at: iso('2026-08-07T15:22'), settled: true },
    { ref: 'TKN-1N4T25', kind: 'payment', who: 'Ngozi Eze', type: 'Sent', amount: -150, at: iso('2026-08-05T11:30'), settled: true },
    { ref: 'TKN-0M3S14', kind: 'grow', who: 'Earn', type: 'Moved in', amount: -740, at: iso('2026-08-03T09:15'), settled: true },
    { ref: 'TKN-0L2R03', kind: 'payment', who: 'Ikeja Electric', type: 'Sent', amount: -34, at: iso('2026-08-01T07:40'), settled: true },
    { ref: 'TKN-0K1Q92', kind: 'payment', who: 'Payroll', type: 'Received', amount: 1500, at: iso('2026-07-31T08:00'), settled: true },
    { ref: 'TKN-0J0P81', kind: 'trade', who: 'Apple', type: 'Bought', amount: -560, at: iso('2026-07-29T14:12'), settled: true },
  ],
}

/* ---------- derived ---------- */

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

export const monthlyEarn = (principal: number): number =>
  (principal * state.rates.earn) / 100 / 12

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

export const nairaAside = (dollars: number): string | null =>
  state.prefs.showNaira
    ? `About ₦${Math.round(dollars * state.ngnPerUsd).toLocaleString('en-US')} at today’s indicative rate`
    : null

/* ------------------------------------------------------------ the limits --
   One place, so the card that states a limit and the thing that enforces it
   are the same number. */
export const verified = (): boolean => state.kyc.status === 'verified'
export const limits = () => (verified() ? LIMITS.verified : LIMITS.none)
export const leftThisMonth = (): number =>
  Math.max(0, limits().monthly - state.usedThisMonth)

/** The most a single movement can be: the single-payment cap, or whatever is
 *  left of the month, whichever runs out first. */
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

/** The most that can be invested once the fee has to fit in the cash too. */
export const maxInvestable = (): number =>
  Math.floor((state.cash / (1 + state.fees.trade / 100)) * 100) / 100

export const bucketTotal = (): number =>
  state.bucket.reduce((t, b) => t + b.dollars, 0)

/** What the bucket costs all in — the fee is charged once on the whole
 *  payment, not per company, which is the point of paying once. */
export const bucketCost = (): number => bucketTotal() + tradeFee(bucketTotal())

export const bucketShortfall = (): number =>
  Math.max(0, bucketCost() - state.cash)

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
  const entry: Activity = {
    ref: a.ref ?? reference(),
    at: a.at ?? new Date().toISOString(),
    settled: a.settled ?? true,
    kind: a.kind,
    who: a.who,
    type: a.type,
    amount: a.amount,
    note: a.note,
  }
  state.activity.unshift(entry)
  return entry
}

export const actions = {
  readNotification(id: string) {
    const n = state.notifications.find((x) => x.id === id)
    if (n && !n.read) { n.read = true; changed() }
  },

  readAllNotifications() {
    let any = false
    for (const n of state.notifications) if (!n.read) { n.read = true; any = true }
    if (any) changed()
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
    changed()
  },
  resetVerification() {
    state.kyc = { status: 'none' }
    changed()
  },

  send(to: string, amount: number): Activity {
    actions.countAgainstLimit(amount)
    state.cash -= amount
    const a = record({ kind: 'payment', who: to, type: 'Sent', amount: -amount })
    changed()
    return a
  },

  addMoney(amount: number, bankId: string): Activity {
    actions.countAgainstLimit(amount)
    const bank = state.banks.find((b) => b.id === bankId)
    state.cash += amount
    const a = record({
      kind: 'payment', who: bank ? bank.name : 'Bank transfer',
      type: 'Received', amount, note: 'Bought dollars',
    })
    changed()
    return a
  },

  convert(amount: number, bankId: string): Activity {
    actions.countAgainstLimit(amount)
    const bank = state.banks.find((b) => b.id === bankId)
    state.cash -= amount
    const a = record({
      kind: 'payment', who: bank ? bank.name : 'Bank transfer',
      type: 'Sent', amount: -amount, note: 'Converted to naira',
    })
    changed()
    return a
  },

  /** Buying something you do not already hold opens the position. It used to
   *  take the money and add the shares only `if (h)`, so a first purchase —
   *  the one the whole product is for — charged the wallet, created nothing,
   *  and reported "you now own undefined shares". */
  buy(ticker: string, dollars: number): { activity: Activity; shares: number; fee: number; invested: number } {
    const c = find(ticker)
    if (!c) throw new Error('No such instrument: ' + ticker)
    // Never spend money that is not there, whatever the caller asks for —
    // and the fee is part of what has to be there. The composer clamps too;
    // this is the floor under it.
    const spend = Math.max(0, Math.min(dollars, maxInvestable()))
    const fee = tradeFee(spend)
    const shares = spend / c.price
    const h = holding(ticker)
    if (h) h.shares += shares
    else state.holdings.push({ ticker: c.ticker, name: c.name, shares, price: c.price, dayPct: c.dayPct })
    state.cash -= spend + fee
    actions.countAgainstLimit(spend + fee)
    const activity = record({ kind: 'trade', who: c.name, type: 'Bought', amount: -(spend + fee) })
    changed()
    return { activity, shares, fee, invested: spend }
  },

  /** And selling is bounded by what is actually held, so a holding can never
   *  go negative and the wallet can never be paid for shares that were not
   *  there. A position sold out entirely leaves rather than sitting at zero. */
  sell(ticker: string, dollars: number): { activity: Activity; shares: number; fee: number; proceeds: number } {
    const h = holding(ticker)
    const c = find(ticker)
    if (!h || !c) throw new Error('Nothing held in ' + ticker)
    const value = Math.max(0, Math.min(dollars, h.shares * h.price))
    const fee = tradeFee(value)
    const shares = value / h.price
    h.shares -= shares
    if (h.shares < 1e-6) state.holdings.splice(state.holdings.indexOf(h), 1)
    // Selling $100 puts $99.50 in the wallet: the fee comes out of what you
    // get, not out of what you sold, which is the figure on the review.
    state.cash += value - fee
    const activity = record({ kind: 'trade', who: c.name, type: 'Sold', amount: value - fee })
    changed()
    return { activity, shares, fee, proceeds: value - fee }
  },

  borrow(amount: number): Activity {
    state.borrowed += amount
    state.cash += amount
    const a = record({ kind: 'grow', who: 'Borrow', type: 'Borrowed', amount })
    changed()
    return a
  },

  repay(amount: number): Activity {
    const toInterest = Math.min(amount, state.interestOwed)
    state.interestOwed -= toInterest
    state.borrowed = Math.max(0, state.borrowed - (amount - toInterest))
    state.cash -= amount
    const a = record({ kind: 'grow', who: 'Borrow', type: 'Repaid', amount: -amount })
    changed()
    return a
  },

  moveIntoEarn(amount: number): Activity {
    state.cash -= amount
    state.inEarn += amount
    const a = record({ kind: 'grow', who: 'Earn', type: 'Moved in', amount: -amount })
    changed()
    return a
  },

  takeOutOfEarn(amount: number): Activity {
    state.inEarn = Math.max(0, state.inEarn - amount)
    state.cash += amount
    const a = record({ kind: 'grow', who: 'Earn', type: 'Taken out', amount })
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
  addToBucket(ticker: string, dollars: number) {
    const it = state.bucket.find((b) => b.ticker === ticker)
    if (it) it.dollars += dollars
    else state.bucket.push({ ticker, dollars })
    changed()
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
    state.cash -= fee
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

  addBank(name: string, last4: string) {
    state.banks.push({ id: name.toLowerCase() + last4, name, last4, holder: state.person.name })
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
