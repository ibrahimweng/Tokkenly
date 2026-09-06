import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow, renderBase } from '../components/shell'
import { card, cardHead, kv, callout, emptyState, fieldError, amount } from '../components/bits'
import { table } from '../components/table'
import { searchField, searchNote } from '../components/search'
import { rank, onlyNear } from '../match'
import { composerScreen } from '../components/composer'
import { state, movementCeiling, ceilingLabel, WALLET } from '../state'

const ceilingLabel2 = (byBalance: number) => ceilingLabel(byBalance, 'The most you can move here')
import { walletScreen } from './wallet'
import { usd, naira, when, activityLabel } from '../format'
import { openSheet, current, go } from '../router'

import { isMobile } from '../responsive'
import { toast, modalOver } from '../components/sheet'

const PEOPLE = ['Adaeze Okonkwo', 'Tunde Bakare', 'Chidi Nwosu', 'Ngozi Eze']

const initials = (name: string) => name.split(' ').map((s) => s[0]).join('')

/** When someone was last paid, so the list is ordered by memory rather than
 *  alphabet. Nothing beats "the person you paid on Tuesday". */
function lastPaid(name: string): string {
  const a = state.activity.find((x) => x.who === name && x.kind === 'payment')
  return a ? (a.amount < 0 ? 'You sent ' : 'They sent ') + usd(Math.abs(a.amount)) + ' · ' + when(a.at) : 'No payments yet'
}

/** Step one of Send on a phone. There is no second column to hold the list,
 *  so who comes first and how much follows as a sheet. Figma M07. */
/** The same list the phone shows as a screen, as a sheet for the dialog's
 *  Change row. One source of people, two presentations. */
export function peopleRows(onPick: (who: string) => void): HTMLElement[] {
  return [...PEOPLE]
    .sort((a, b) => {
      const ia = state.activity.findIndex((x) => x.who === a)
      const ib = state.activity.findIndex((x) => x.who === b)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
    .map((p) =>
      h('button', { class: 'sheet-row', on: { click: () => onPick(p) } },
        h('span', { class: 'avatar', text: initials(p) }),
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: p }),
          h('small', { text: lastPaid(p) })),
        h('span', { class: 'muted', html: icon.chevron() })))
}

export function sendWhoScreen(): HTMLElement {
  const r = current()
  const term = r.query.get('q') ?? ''
  const setTerm = (v: string) => go('/send' + (v ? '?q=' + encodeURIComponent(v) : ''))

  const people = [...PEOPLE]
    .sort((a, b) => {
      const ia = state.activity.findIndex((x) => x.who === a)
      const ib = state.activity.findIndex((x) => x.who === b)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })

  const PEOPLE_FIELDS = (n: string) => [n, lastPaid(n)]
  const row = (n: string) =>
    h('button', {
      class: 'sheet-row',
      on: { click: () => go('/send?to=' + encodeURIComponent(n)) },
    },
      h('span', { class: 'avatar', text: initials(n) }),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: n }),
        h('small', { text: lastPaid(n) })),
      h('span', { class: 'muted', html: icon.chevron() }))

  // The list narrows as you type. The address is only touched on Enter,
  // because a route change rebuilds the tree and takes the focus with it.
  const peopleCard = h('div', { class: 'stack' })
  const paint = (t: string): void => {
    const found = t.trim() ? rank(t, people, PEOPLE_FIELDS) : people
    peopleCard.replaceChildren(card(
      cardHead('People you can pay'),
      searchNote(t, found.length, onlyNear(t, found, PEOPLE_FIELDS)),
      found.length
        ? h('div', { class: 'sheet-list' }, ...found.map(row))
        : emptyState('Nobody by that name',
            'Search another name, or send to an address below.',
            { label: 'Clear the search', onClick: () => go('/send') })))
  }
  paint(term)

  const address = h('input', { placeholder: 'Paste a Base address' })
  const addressField = h('label', { class: 'field' }, address)
  const addressError = fieldError(
    h('span', { html: icon.alert() }), h('span', { text: 'Paste a full Base address' }))
  addressError.hidden = true
  const submitAddress = () => {
    const v = address.value.trim()
    // The mistake is shown where it was made, not in a toast that has gone by.
    const bad = v.length < 8
    addressField.classList.toggle('error', bad)
    addressError.hidden = !bad
    if (bad) { address.focus(); return }
    go('/send?to=' + encodeURIComponent(v.slice(0, 6) + '…' + v.slice(-4)))
  }
  address.addEventListener('input', () => {
    addressField.classList.remove('error')
    addressError.hidden = true
  })

  return shell(
    'wallet',
    pageHeader('Send money', eyebrow('Cash available', usd(state.cash))),
    searchField({
      placeholder: 'Search a name',
      value: r.query.get('q') ?? '',
      // Picking a name here is the whole screen: it goes straight to the
      // composer with that person already in it.
      suggest: (t) => rank(t, people, PEOPLE_FIELDS).slice(0, 7).map((n) => ({
        label: n,
        hint: 'Send money',
        group: 'People',
        pick: () => go('/send?to=' + encodeURIComponent(n)),
      })),
      onType: paint,
      onCommit: setTerm,
    }),
    peopleCard,
    card(
      cardHead('Or send to an address'),
      addressField,
      addressError,
      h('button', { class: 'btn btn-secondary', text: 'Continue', on: { click: submitAddress } }),
      callout('Base network only. Sending any other asset to this address loses it.', 'warning')
    )
  )
}

export function sendScreen(): HTMLElement {
  const r = current()
  const chosen = r.query.get('to')
  // On a phone, who comes first. On desktop the list is the right column.
  if (isMobile() && !chosen && !r.sheet) return sendWhoScreen()
  const to = chosen ?? PEOPLE[0]
  return composerScreen({
    place: 'wallet',
    base: walletScreen,
    // Figma D09 draws Send as a dialog over the wallet, not a screen of its
    // own. Every other composer is a screen, and those match already.
    present: 'modal',
    closeTo: '/transfer',
    lede: () => h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'To' }),
      h('button', {
        class: 'sheet-row', style: { background: 'var(--control)' },
        on: { click: () => openSheet('pick-who') },
      },
        h('span', { class: 'avatar', text: initials(to) }),
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: to }),
          h('small', { text: lastPaid(to) })),
        h('span', { class: 'link quiet', text: 'Change' }))),
    title: 'Send money',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Cash ' + usd(state.cash),
    initial: Math.min(120, state.cash),
    max: Math.min(state.cash, movementCeiling()),
    maxLabel: ceilingLabel2(state.cash),
    note: 'Arrives in under a minute, any day of the week.',
    quick: [
      { label: usd(20, false), value: 20 },
      { label: usd(50, false), value: 50 },
      { label: usd(120, false), value: 120 },
      { label: 'All', value: state.cash },
    ],
    // No 'To' row: the lede above already names them, and the same fact twice
    // in one dialog reads as a mistake.
    summary: () => [
      ['Fee', 'None — what you send is what they get'],
      ['Arrives', 'In about a minute'],
      ['Network', 'Base'],
    ],
    callout: 'Payments run every day of the year, including public holidays.',
    action: (v) => 'Send ' + usd(v),
    onAction: (v) => openSheet('send-review', { v: String(v), to }),
  })
}

export function receiveScreen(): HTMLElement {
  const address = WALLET
  const short = address.slice(0, 12) + '…' + address.slice(-4)

  // A deterministic block pattern. It is not a real code, and the copy button
  // is what actually carries the address.
  const qr = h('div', { class: 'qr', ariaLabel: 'A code that resolves to your address' })
  let seed = 42
  for (let i = 0; i < 121; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    qr.appendChild(h('span', { class: seed % 100 > 45 ? 'on' : '' }))
  }

  const copy = () => {
    navigator.clipboard?.writeText(address).catch(() => undefined)
    toast('Address copied', 'success')
  }

  return modalOver(renderBase(walletScreen), 'Receive money', () => go('/transfer'),
    h('div', { class: 'stack-12', style: { alignItems: 'center' } },
      qr,
      h('span', { class: 'muted', text: 'Scan this to pay ' + state.person.name })),
    h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'Your address' }),
      h('div', { class: 'field', style: { justifyContent: 'space-between' } },
        h('span', { class: 't-body-strong', text: short }),
        h('button', { class: 'icon-btn', html: icon.copy(), ariaLabel: 'Copy the address',
          on: { click: copy } }))),
    callout('Base network only. Sending any other asset to this address loses it.', 'warning'),
    h('button', { class: 'btn btn-primary', text: 'Copy address', on: { click: copy } }))
}

/** What has come in this way before, or gone out this way before. Invest and
 *  Sell already carry their recent orders under the composer; these two
 *  carried nothing, and the question after "how much" is usually "what did I
 *  do last time".
 *
 *  Identified by the note the action writes, not by the sign on the amount.
 *  The first version filtered on `kind === 'payment' && amount > 0`, which put
 *  "Received Adaeze Okonkwo" and "Received Payroll" under a heading reading
 *  "Money you have added" — a card that was wrong about the one thing it was
 *  for. Money somebody sent you is not money you added.
 *
 *  Nothing to show means no card. A screen that ends with an empty panel
 *  explaining that it is empty is worse composed than one that ends. */
const NOTE = { in: 'Bought dollars', out: 'Converted to naira' } as const

function pastMoves(which: 'in' | 'out'): HTMLElement | null {
  const rows = state.activity.filter((a) => a.note === NOTE[which]).slice(0, 5)
  if (!rows.length) return null
  return card(
    cardHead(which === 'in' ? 'Money you have added' : 'Money you have taken out',
      h('button', { class: 'link', text: 'See all',
        on: { click: () => go('/activity?filter=payments') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
        { key: 'ref', label: 'Reference', optional: true }, { key: 'amt', label: 'Amount', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: activityLabel(a) }),
          h('small', { class: 'phone-only', text: when(a.at) })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref })
    )
  )
}

export function addMoneyScreen(): HTMLElement {
  const bank = state.banks[0]
  return composerScreen({
    place: 'wallet',
    base: walletScreen,
    // The registry, the breadcrumb, the palette and the wallet tile all call
    // this Add money. The screen called itself Buy dollars, its button said
    // Buy, and its review said "You are buying" — five surfaces, three names,
    // for one thing a person does once a week.
    title: 'Add money',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Minimum ' + usd(10, false),
    initial: 200,
    max: Math.min(5000, movementCeiling()),
    maxLabel: ceilingLabel2(5000),
    note: 'Pay from your bank in naira, receive dollars.',
    quick: [
      { label: usd(50, false), value: 50 },
      { label: usd(100, false), value: 100 },
      { label: usd(200, false), value: 200 },
      { label: usd(500, false), value: 500 },
    ],
    // The fee row is here as well as on the review. The pitch is "the amount,
    // the rate, the fee, and exactly what you receive, before you confirm" —
    // and a fee that only appears once you have pressed the button is a fee
    // you found out about later. None is an answer; leaving it out is not.
    summary: (v) => [
      ['You pay', naira(v * state.ngnPerUsd)],
      ['Rate', '1 dollar = ' + naira(state.ngnPerUsd)],
      ['Fee', 'None — the rate above is the rate you get'],
      ['You receive', usd(v)],
      ['From', bank.name + ' •••• ' + bank.last4],
      ['Lands', 'In about a minute'],
    ],
    callout: 'The rate above is indicative. You get a firm one at the review, held for ninety seconds.',
    action: (v) => 'Add ' + usd(v),
    onAction: (v) => openSheet('add-review', { v: String(v) }),
    right: (v) =>
      card(
        cardHead('What you pay'),
        h('span', { class: 't-title', text: 'In naira' }),
        h('span', { class: 't-display-xl', text: naira(v * state.ngnPerUsd) }),
        h('span', { class: 'muted', text: 'Indicative. The rate you see at the review is the rate you get.' }),
        h('div', { class: 'stack-12' },
          kv('Bank', bank.name),
          kv('Account', '•••• ' + bank.last4),
          kv('Name', bank.holder)),
        h('button', { class: 'link', text: 'Use another bank', on: { click: () => openSheet('banks') } })
      ),
    bottom: pastMoves('in') ?? undefined,
  })
}

export function convertScreen(): HTMLElement {
  const bank = state.banks[0]
  return composerScreen({
    place: 'wallet',
    base: walletScreen,
    title: 'Withdraw to your bank',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Cash ' + usd(state.cash),
    initial: Math.min(300, state.cash),
    max: Math.min(state.cash, movementCeiling()),
    maxLabel: ceilingLabel2(state.cash),
    note: 'Dollars out of your wallet, naira into your bank.',
    quick: [
      { label: usd(50, false), value: 50 },
      { label: usd(100, false), value: 100 },
      { label: usd(300, false), value: 300 },
      { label: 'All', value: state.cash },
    ],
    summary: (v) => [
      ['You send', usd(v)],
      ['Rate', '1 dollar = ' + naira(state.ngnPerUsd)],
      ['Fee', 'None — the rate above is the rate you get'],
      ['You get', naira(v * state.ngnPerUsd)],
      ['Into', bank.name + ' •••• ' + bank.last4],
      ['Arrives', 'Usually within a minute'],
    ],
    callout: 'You get a firm rate at the review, held for ninety seconds. Payouts run every day.',
    action: (v) => 'Withdraw ' + usd(v),
    onAction: (v) => openSheet('convert-review', { v: String(v) }),
    right: (v) =>
      card(
        cardHead('Where it lands',
          h('button', { class: 'link', text: 'Change', on: { click: () => openSheet('banks') } })),
        h('span', { class: 't-title', text: bank.name }),
        h('span', { class: 't-display-xl', text: naira(v * state.ngnPerUsd) }),
        h('span', { class: 'muted', text: '•••• ' + bank.last4 + ' · ' + bank.holder }),
        h('div', { class: 'stack-12' },
          ...state.banks.map((b) => kv(b.name, '•••• ' + b.last4))),
        h('button', {
          class: 'link', text: 'Add a bank',
          on: { click: () => openSheet('banks') },
        }),
        h('span', { class: 'muted t-caption', html: icon.info() + ' A bank account has to be in your own name.' })
      ),
    bottom: pastMoves('out') ?? undefined,
  })
}
