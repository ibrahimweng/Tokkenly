import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead, kv, callout, emptyState, fieldError, amount } from '../components/bits'
import { table } from '../components/table'
import { searchField, searchNote } from '../components/search'
import { rank, onlyNear } from '../match'
import { composerScreen } from '../components/composer'
import { state, movementCeiling, ceilingLabel, holding, WALLET } from '../state'

const ceilingLabel2 = (byBalance: number) => ceilingLabel(byBalance, 'The most you can move here')
import { walletScreen } from './wallet'
import { stockScreen } from './stock'
import { find, type Instrument } from '../catalogue'
import { usd, naira, when, shares, activityLabel } from '../format'
import { openSheet, current, go } from '../router'

import { isMobile } from '../responsive'
import { toast } from '../components/sheet'

/** Names only. Cash goes to anybody, so the Tokkenly flag on a person is
 *  nothing to do with paying them — it is what decides whether a share can be
 *  handed over, and that lives on the share screen. */
const PEOPLE = (): string[] => state.people.map((p) => p.name)

/** Ordered by memory rather than alphabet: the person you paid on Tuesday
 *  first. Shared, because the picker and the column beside Send must not
 *  disagree about who is at the top. */
export function byRecent(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const ia = state.activity.findIndex((x) => x.who === a)
    const ib = state.activity.findIndex((x) => x.who === b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
}

export const initials = (name: string) => name.split(' ').map((s) => s[0]).join('')

/** When someone was last paid, so the list is ordered by memory rather than
 *  alphabet. Nothing beats "the person you paid on Tuesday". */
export function lastPaid(name: string): string {
  const a = state.activity.find((x) => x.who === name && x.kind === 'payment')
  return a ? (a.amount < 0 ? 'You sent ' : 'They sent ') + usd(Math.abs(a.amount)) + ' · ' + when(a.at) : 'No payments yet'
}

/** Step one of Send on a phone. There is no second column to hold the list,
 *  so who comes first and how much follows as a sheet. Figma M07. */
/** The same list the phone shows as a screen, as a sheet for the dialog's
 *  Change row. One source of people, two presentations. */
export function peopleRows(onPick: (who: string) => void): HTMLElement[] {
  return byRecent(PEOPLE())
    .map((p) =>
      h('button', { class: 'sheet-row', on: { click: () => onPick(p) } },
        h('span', { class: 'avatar', text: initials(p) }),
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: p }),
          h('small', { text: lastPaid(p) })),
        h('span', { class: 'muted', html: icon.chevron() })))
}

/** Who you can pay, and a field for anybody you cannot. On a phone this is the
 *  first screen of Send; on a wide one it is the column beside the composer,
 *  so choosing who and saying how much are one screen rather than a dialog
 *  that opens another dialog to change its own target. */
function sendSide(opts: { search: boolean }): HTMLElement {
  const r = current()
  const term = r.query.get('q') ?? ''
  const setTerm = (v: string) => go('/send' + (v ? '?q=' + encodeURIComponent(v) : ''))

  const people = byRecent(PEOPLE())

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

  return h('div', { class: 'stack' },
    opts.search
      ? searchField({
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
        })
      : null,
    peopleCard,
    card(
      cardHead('Or send to an address'),
      addressField,
      addressError,
      h('button', { class: 'btn btn-secondary', text: 'Continue', on: { click: submitAddress } }),
      callout('Base network only. Sending any other asset to this address loses it.', 'warning')
    ))
}

export function sendWhoScreen(): HTMLElement {
  return shell(
    'wallet',
    pageHeader('Send money', eyebrow('Cash available', usd(state.cash))),
    sendSide({ search: true }))
}

export function sendScreen(): HTMLElement {
  const r = current()
  const chosen = r.query.get('to')
  // On a phone, who comes first. On desktop the list is the right column.
  if (isMobile() && !chosen && !r.sheet) return sendWhoScreen()
  const to = chosen ?? PEOPLE()[0]
  // Built once and handed back on every repaint: the amount changing must not
  // wipe an address somebody is halfway through pasting.
  const side = isMobile() ? null : sendSide({ search: false })
  return composerScreen({
    place: 'wallet',
    base: walletScreen,
    right: () => side!,
    // On a phone the sheet is all there is, so the row opens a picker. On a
    // wide screen the list is the column beside it, and a Change that opens a
    // dialog to do what the next column already does is a second way to the
    // same place.
    lede: () => h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'To' }),
      h(side ? 'div' : 'button', {
        class: 'sheet-row', style: { background: 'var(--control)' },
        on: side ? {} : { click: () => openSheet('pick-who') },
      },
        h('span', { class: 'avatar', text: initials(to) }),
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: to }),
          h('small', { text: lastPaid(to) })),
        side ? null : h('span', { class: 'link quiet', text: 'Change' }))),
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

/** What people have sent you. Receive was a dialog with a code in it and
 *  nothing else; the question straight after "here is my address" is "did the
 *  last one arrive", and the answer was two screens away. */
function received(): HTMLElement | null {
  const rows = state.activity.filter((a) => a.kind === 'payment' && a.amount > 0).slice(0, 5)
  if (!rows.length) return null
  return card(
    cardHead('Money people have sent you',
      h('button', { class: 'link', text: 'See all',
        on: { click: () => go('/activity?filter=payments') } })),
    table(
      [
        { key: 'w', label: 'Who' }, { key: 'when', label: 'When', optional: true },
        { key: 'ref', label: 'Reference', optional: true }, { key: 'amt', label: 'Amount', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: a.who }),
          h('small', { class: 'phone-only', text: when(a.at) })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref })
    )
  )
}

/* ---------------------------------------------------------------------------
   Sending a share.

   The survey is in design.md 11g.27: the incumbents mostly refuse this, and
   the ones that allow it do it on paper. Of the tokenised platforms, only the
   ones whose token is free to move can do it at all, and that freedom is the
   same decision that keeps them out of some markets entirely.

   So this is the middle option, and it is deliberate: a share can be handed to
   another verified Tokkenly account and to nobody else. Both sides are known,
   both wallets are ours, and the cost basis of each is a number the product
   already holds. Sending to an arbitrary address is not offered — that is the
   point at which a security leaves a regulated perimeter, and it is not a
   thing to ship ahead of the licence that permits it.

   The refusal was built before the transfer. It is the part that has to be
   right on the first day, and a refusal nobody can reach is a refusal nobody
   has tested — which is why two of the four people in the list do not hold an
   account.
   --------------------------------------------------------------------------- */

const onTokkenly = (name: string): boolean =>
  !!state.people.find((p) => p.name === name)?.onTokkenly

/** Who can be handed a share, and who cannot, in one list. The ones without an
 *  account are not hidden and not greyed into silence: they are listed, marked,
 *  and they go to a screen that says why and what to do instead. A row that
 *  does nothing when pressed teaches nobody anything. */
function shareSide(c: Instrument): HTMLElement {
  const to = (n: string) => `/invest/${c.ticker.toLowerCase()}/send?to=${encodeURIComponent(n)}`
  const row = (n: string) =>
    h('button', { class: 'sheet-row', on: { click: () => go(to(n)) } },
      h('span', { class: 'avatar', text: initials(n) }),
      h('span', { class: 'two-line grow' },
        h('span', { class: 't-body-strong', text: n }),
        h('small', { text: onTokkenly(n) ? lastPaid(n) : 'No Tokkenly account' })),
      onTokkenly(n) ? null : h('span', { class: 'pill warn', text: 'Cash only' }),
      h('span', { class: 'muted', html: icon.chevron() }))
  const names = byRecent(state.people.map((p) => p.name))
  return h('div', { class: 'stack' },
    card(
      cardHead('Who gets them'),
      h('div', { class: 'sheet-list' }, ...names.filter(onTokkenly).map(row))),
    card(
      cardHead('Not on Tokkenly yet'),
      h('div', { class: 'sheet-list' }, ...names.filter((n) => !onTokkenly(n)).map(row)),
      h('span', { class: 'muted t-caption',
        text: 'A share is a security, so it can only be delivered to a verified account. You can still send these people cash.' })))
}

/** The refusal. It names the person, says why in one sentence, and offers the
 *  two things that actually help: the same gift as cash, or somebody else. */
function cannotSend(c: Instrument, to: string): HTMLElement {
  const first = to.split(' ')[0]
  const left = card(
    cardHead('Why this cannot go'),
    h('div', { class: 'set-banner' },
      h('span', { class: 'mark warn-mark', html: icon.alert() }),
      h('span', { class: 'two-line grow' },
        h('span', { class: 't-body-strong', text: to + ' does not hold a Tokkenly account' }),
        h('small', { text: 'Shares can only be delivered to a verified account.' }))),
    h('span', { class: 'muted',
      text: `A tokenised share is a security, not a payment. We have to know who is receiving one before we hand it over, which means ${first} needs a verified Tokkenly account first. Cash has no such rule.` }),
    h('button', { class: 'btn btn-primary', text: 'Send ' + first + ' cash instead',
      on: { click: () => go('/send?to=' + encodeURIComponent(to)) } }),
    // On a wide screen the list of people who can receive it is the column
    // beside this; on a phone there is nothing but this card, so it carries
    // the way back to the list.
    isMobile()
      ? h('button', { class: 'btn btn-secondary', text: 'Choose somebody else',
          on: { click: () => go('/invest/' + c.ticker.toLowerCase() + '/send') } })
      : null,
    callout('Nothing has left your holding. You still hold every share you did a moment ago.'))
  left.classList.add('col-compose')
  return shell('market',
    pageHeader('Send ' + c.name),
    isMobile()
      ? left
      : h('div', { class: 'row' }, left, h('div', { class: 'stack grow' }, shareSide(c))))
}

/** Who gets them, on a phone, where there is no column to put the list in. */
function whoGetsSharesScreen(c: Instrument): HTMLElement {
  return shell('market',
    pageHeader('Send ' + c.name,
      eyebrow('You hold', shares(holding(c.ticker)?.shares ?? 0) + ' shares')),
    shareSide(c))
}

export function sendSharesScreen(ticker: string): HTMLElement {
  const c = find(ticker)
  if (!c) return shell('market', pageHeader('Not found'))
  const held = holding(c.ticker)
  if (!held || held.shares <= 0) {
    return shell('market',
      pageHeader('Send ' + c.name),
      emptyState('You do not hold any ' + c.ticker,
        'You can only send shares you own. Buy some first, then they can go to anybody with a Tokkenly account.',
        { label: 'Buy ' + c.ticker, onClick: () => go('/invest/' + c.ticker.toLowerCase() + '/invest') }))
  }

  const r = current()
  const chosen = r.query.get('to')
  // On a phone, who comes first; on a wide screen the list is the column
  // beside the amount, the same shape Send money takes.
  if (isMobile() && !chosen && !r.sheet) return whoGetsSharesScreen(c)
  const to = chosen ?? byRecent(state.people.map((p) => p.name)).find(onTokkenly) ?? ''
  if (!onTokkenly(to)) return cannotSend(c, to)

  const worth = held.shares * held.price
  // The holding is one ceiling; what the account may move this month is the
  // other, and an outflow answers to both. Item 06 settled that a share is
  // not an exception to it.
  const ceiling = Math.min(worth, movementCeiling())
  const side = isMobile() ? null : shareSide(c)
  // Only the chips that fit. A quick amount the holding cannot cover trips the
  // ceiling warning the moment it is pressed, which makes a shortcut into a
  // telling-off.
  const quick = [
    { label: '1 share', value: c.price },
    { label: '5 shares', value: c.price * 5 },
    { label: 'Half', value: worth / 2 },
    // The last chip is always the biggest thing that can actually go, and it
    // says which ceiling it is: "All" when the holding is the limit, "The
    // most" when the monthly one is. A chip labelled All that stops short of
    // all is worse than no chip.
    { label: worth <= ceiling + 0.005 ? 'All' : 'The most', value: Math.min(worth, ceiling) },
  ].filter((q) => q.value <= ceiling + 0.005 && q.value > 0)

  return composerScreen({
    place: 'market',
    base: () => stockScreen(c.ticker.toLowerCase()),
    right: () => side!,
    lede: () => h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'To' }),
      h(side ? 'div' : 'button', {
        class: 'sheet-row', style: { background: 'var(--control)' },
        on: side ? {} : { click: () => go(`/invest/${c.ticker.toLowerCase()}/send`) },
      },
        h('span', { class: 'avatar', text: initials(to) }),
        h('span', { class: 'two-line grow' },
          h('span', { class: 't-body-strong', text: to }),
          h('small', { text: 'Verified Tokkenly account' })),
        side ? null : h('span', { class: 'link quiet', text: 'Change' }))),
    title: 'Send ' + c.name,
    eyebrow: ['You hold', shares(held.shares) + ' shares'],
    // "How much", not "How many": the field takes dollars, like every other
    // composer in the product, and the summary underneath does the converting
    // into shares. A label that names a unit the field does not accept is the
    // shortest way to make somebody type the wrong number.
    cardLabel: 'How much',
    cardRight: 'You hold ' + usd(worth),
    // One share is what somebody means by giving a share. It opens there when
    // the holding covers it and at the whole holding when it does not.
    initial: Math.min(c.price, ceiling),
    max: ceiling,
    maxLabel: ceilingLabel(worth, 'What you hold of ' + c.ticker),
    note: 'Priced at ' + usd(c.price) + ' a share. No fee, either side.',
    quick,
    summary: (v) => [
      ['They receive', shares(v / held.price) + ' ' + c.ticker],
      ['At', usd(held.price) + ' a share'],
      ['Fee', 'None, either side'],
      ['You keep', shares(Math.max(0, held.shares - v / held.price)) + ' ' + c.ticker],
    ],
    callout: 'The share itself moves, not its value in cash. ' + to.split(' ')[0] +
      ' holds it from the moment it lands, and it cannot be recalled.',
    risky: true,
    action: (v) => 'Send ' + shares(v / held.price) + ' ' + c.ticker,
    onAction: (v) => openSheet('shares-review', { v: String(v), t: c.ticker, to }),
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

  // A screen, like every other way of moving money. It was a dialog, which
  // meant the warning about the network — the one line here that costs real
  // money to get wrong — lived in a box you dismiss, and an address nobody
  // could link somebody to.
  const left = card(
    cardHead('Your address', h('span', { class: 'muted', text: 'Base' })),
    h('div', { class: 'stack-12', style: { alignItems: 'center' } },
      qr,
      h('span', { class: 'muted', text: 'Scan this to pay ' + state.person.name })),
    h('div', { class: 'field', style: { justifyContent: 'space-between' } },
      h('span', { class: 't-body-strong', text: short }),
      h('button', { class: 'icon-btn', html: icon.copy(), ariaLabel: 'Copy the address',
        on: { click: copy } })),
    h('button', { class: 'btn btn-primary', text: 'Copy address', on: { click: copy } }),
    callout('Base network only. Sending any other asset to this address loses it.', 'warning'))
  left.classList.add('col-compose')

  return shell(
    'wallet',
    pageHeader('Receive money', eyebrow('Cash available', usd(state.cash))),
    h('div', { class: 'row' }, left,
      h('div', { class: 'stack grow' },
        card(
          cardHead('What happens when somebody pays you'),
          kv('Network', 'Base'),
          kv('Fee', 'None, either side'),
          kv('Arrives', 'In about a minute, any day of the week'),
          kv('Held as', 'Dollars in your wallet'),
          h('span', { class: 'muted t-caption',
            text: 'Anybody with a Base wallet can pay this address. They do not need a Tokkenly account.' })),
        received())))
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
