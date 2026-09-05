/** The one source of truth. Every figure the screens show is derived from
 *  here, so a flow that moves money changes every screen that mentions it.
 *  Opening figures match design.md 11b.4f. */

import { reference } from './format'

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
  homeView: 'detailed' | 'simple'
  person: { name: string; email: string; phone: string; dob: string; address: string }
  cash: number
  inEarn: number
  earnedSoFar: number
  borrowed: number
  interestOwed: number
  borrowLimit: number
  rates: { earn: number; borrow: number; collateral: number }
  holdings: Holding[]
  watchlist: string[]
  banks: Bank[]
  devices: Device[]
  activity: Activity[]
  notifications: Notif[]
  cardWaitlist: boolean
  phraseWrittenDown: boolean
  ngnPerUsd: number
}

const iso = (d: string) => new Date(d).toISOString()

export const state: State = {
  signedIn: true,
  homeView: 'detailed',
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
  holdings: [
    { ticker: 'AAPL', name: 'Apple', shares: 23.42, price: 224.1, dayPct: 1.2 },
    { ticker: 'NVDA', name: 'Nvidia', shares: 26.94, price: 118.9, dayPct: 2.4 },
    { ticker: 'VOO', name: 'Vanguard S&P 500', shares: 5.6, price: 511.57, dayPct: 0.4 },
    { ticker: 'TSLA', name: 'Tesla', shares: 4.8, price: 248.5, dayPct: -0.8 },
  ],
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

  setHomeView(v: 'detailed' | 'simple') {
    state.homeView = v
    changed()
  },

  send(to: string, amount: number): Activity {
    state.cash -= amount
    const a = record({ kind: 'payment', who: to, type: 'Sent', amount: -amount })
    changed()
    return a
  },

  addMoney(amount: number, bankId: string): Activity {
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
    const bank = state.banks.find((b) => b.id === bankId)
    state.cash -= amount
    const a = record({
      kind: 'payment', who: bank ? bank.name : 'Bank transfer',
      type: 'Sent', amount: -amount, note: 'Converted to naira',
    })
    changed()
    return a
  },

  buy(ticker: string, dollars: number): Activity {
    const h = holding(ticker)
    if (h) h.shares += dollars / h.price
    state.cash -= dollars
    const a = record({ kind: 'trade', who: h ? h.name : ticker, type: 'Bought', amount: -dollars })
    changed()
    return a
  },

  sell(ticker: string, dollars: number): Activity {
    const h = holding(ticker)
    if (h) h.shares = Math.max(0, h.shares - dollars / h.price)
    state.cash += dollars
    const a = record({ kind: 'trade', who: h ? h.name : ticker, type: 'Sold', amount: dollars })
    changed()
    return a
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
    changed()
  },

  signOut() {
    state.signedIn = false
    changed()
  },
}
