import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead, kv, callout, providerNote, emptyState, fieldError, amount } from '../components/bits'
import { table } from '../components/table'
import { searchField, searchNote } from '../components/search'
import { rank, onlyNear } from '../match'
import { composerScreen } from '../components/composer'
import {
  state, movementCeiling, ceilingLabel, holding, cardFee, resolveAccount, switchOn, WALLET,
  type Destination,
} from '../state'

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

/* ---------------------------------------------------------------------------
   One Send, and the question it asks first.

   There used to be two screens. Send took dollars to a person or a Base
   address; Withdraw took dollars to your own bank and turned them into naira.
   "Why is there a send and there is a withdrawal?" is the right question, and
   the honest answer is that there is not: both take dollars out of the same
   wallet, and what differs is only where they land.

   So there is one screen and the destination is what it asks. Everything else
   follows from that one answer — the currency at the far end, the rail, the
   speed, whether a rate is involved and whether anybody's name needs checking:

     Someone on Tokkenly   dollars, instantly, free
     A Base address        dollars, on the network, free, and final
     A Nigerian account    dollars out, naira in, at the rate — yours or
                           anybody's, with the name checked before you confirm

   Withdraw and Convert still resolve, to the third of those. An address people
   have bookmarked should not stop working because the product learned to
   count the errand properly.
   --------------------------------------------------------------------------- */

/** Where the money is going, read off the address. `to` names it; `rail` says
 *  which kind of thing it is, so a person called "0x…" and an address are
 *  never confused for each other. */
export function destination(): Destination | null {
  const r = current()
  const rail = r.query.get('rail')
  const to = r.query.get('to')
  if (rail === 'bank') {
    const own = state.banks.find((b) => b.id === to)
    if (own) return { rail: 'bank', name: own.name, bankId: own.id, bank: own.name, number: own.number }
    const bank = r.query.get('bank')
    if (to && bank) return { rail: 'bank', name: to, bank, number: r.query.get('acct') ?? '' }
    return null
  }
  if (!to) return null
  if (rail === 'chain') return { rail: 'chain', name: to }
  return { rail: 'tokkenly', name: to }
}

/** Somebody else's Nigerian account, checked before it is used.
 *
 *  Ten digits, then the bank returns a name. It is the one step that catches a
 *  wrong digit while the money is still yours, and every Nigerian who has ever
 *  sent a transfer expects to see it — so the name arrives on the screen and
 *  the button stays out of reach until it does. */
function payeeCard(): HTMLElement {
  const banks = ['Access Bank', 'GTBank', 'Kuda', 'Opay', 'First Bank', 'UBA', 'Zenith Bank', 'Moniepoint']
  const pick = h('select', { class: 'field-select' },
    ...banks.map((b) => h('option', { value: b, text: b })))
  const acct = h('input', { placeholder: '10-digit account number', inputmode: 'numeric' })
  acct.setAttribute('maxlength', '10')
  const field = h('label', { class: 'field' }, acct)
  const err = fieldError(h('span', { html: icon.alert() }),
    h('span', { text: 'We could not find that account. Check the number and the bank.' }))
  err.hidden = true
  const found = h('div', { class: 'found', hidden: true })
  const go2 = h('button', { class: 'btn btn-primary', text: 'Use this account', hidden: true })

  let name: string | null = null
  const check = () => {
    name = resolveAccount(acct.value)
    field.classList.toggle('error', !name && acct.value.replace(/\D/g, '').length === 10)
    err.hidden = !!name || acct.value.replace(/\D/g, '').length < 10
    found.hidden = !name
    go2.hidden = !name
    if (name) {
      found.replaceChildren(
        h('span', { class: 't-caps subtle', text: 'Account name' }),
        h('span', { class: 't-title', text: name }),
        h('small', { class: 'muted', text: pick.value + ' · ' + acct.value }))
    }
  }
  acct.addEventListener('input', check)
  pick.addEventListener('change', check)
  go2.addEventListener('click', () => {
    if (!name) return
    go('/send?rail=bank&to=' + encodeURIComponent(name) +
       '&bank=' + encodeURIComponent(pick.value) + '&acct=' + encodeURIComponent(acct.value))
  })

  return card(
    cardHead('Somebody else’s account'),
    h('label', { class: 'field' }, pick),
    field,
    err,
    found,
    go2,
    h('span', { class: 'muted t-caption',
      html: icon.info() + ' We check the name before you confirm. Naira arrives in minutes.' }))
}

/** Every place the money could go, in one column. Three groups, because the
 *  three behave differently, and the group is the fastest way to say which
 *  kind of thing you are about to pay. */
function whereSide(opts: { search: boolean }): (Node | null)[] {
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
      cardHead('Someone on Tokkenly'),
      searchNote(t, found.length, onlyNear(t, found, PEOPLE_FIELDS)),
      found.length
        ? h('div', { class: 'sheet-list' }, ...found.map(row))
        : emptyState('Nobody by that name',
            'Search another name, or use one of the ways below.',
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
    go('/send?rail=chain&to=' + encodeURIComponent(v.slice(0, 6) + '…' + v.slice(-4)))
  }
  address.addEventListener('input', () => {
    addressField.classList.remove('error')
    addressError.hidden = true
  })

  const cards: (Node | null)[] = [
    opts.search
      ? searchField({
          placeholder: 'Search a name',
          value: r.query.get('q') ?? '',
          // Picking a name here is the whole screen: it goes straight to the
          // composer with that person already in it.
          suggest: (t) => rank(t, people, PEOPLE_FIELDS).slice(0, 7).map((n) => ({
            label: n,
            hint: 'Send dollars',
            group: 'People',
            pick: () => go('/send?to=' + encodeURIComponent(n)),
          })),
          onType: paint,
          onCommit: setTerm,
        })
      : null,
    peopleCard,
    switchOn('payout.ngn') ? card(
      cardHead('Your own bank'),
      ...state.banks.map((b) =>
        h('button', {
          class: 'sheet-row',
          on: { click: () => go('/send?rail=bank&to=' + encodeURIComponent(b.id)) },
        },
          h('span', { class: 'mark', html: icon.convert() }),
          h('span', { class: 'two-line grow' },
            h('span', { class: 't-body-strong', text: b.name }),
            h('small', { text: '•••• ' + b.last4 + ' · ' + b.holder })),
          h('span', { class: 'muted', html: icon.chevron() }))),
      h('span', { class: 'muted t-caption', text: 'Dollars out, naira in.' }),
      h('button', { class: 'link quiet', text: 'Add a bank', on: { click: () => openSheet('banks') } }))
      : card(
          cardHead('Your own bank', h('span', { class: 'pill warn', text: 'Paused' })),
          h('span', { class: 'muted',
            text: 'Bank payouts are off right now. You can still send dollars to a person or a wallet. Anything already on its way will finish.' })),
    switchOn('payout.ngn') ? payeeCard() : null,
    card(
      cardHead('A Base address'),
      addressField,
      addressError,
      h('button', { class: 'btn btn-secondary', text: 'Continue', on: { click: submitAddress } }),
      callout('Base network only. Anything else sent here is lost.', 'warning')),
  ]
  return cards
}

/** The whole list, as one column. This is the right-hand column of the
 *  composer, where there is one column to be. */
const whereColumn = (opts: { search: boolean }): HTMLElement =>
  h('div', { class: 'stack' }, ...whereSide(opts))

/** And the whole list as a page, where there is no composer yet and the four
 *  groups would otherwise run 1,300px down one side of a wide screen. The
 *  split is by how the money leaves: dollars on the left, naira on the right. */
export function sendWhoScreen(): HTMLElement {
  const [search, people, own, payee, address] = whereSide({ search: true })
  return shell(
    'wallet',
    pageHeader('Send money', eyebrow('Cash available', usd(state.cash))),
    search,
    isMobile()
      ? h('div', { class: 'stack' }, people, own, payee, address)
      : h('div', { class: 'row' },
          h('div', { class: 'stack col-main' }, people, address),
          h('div', { class: 'stack col-side' }, own, payee)))
}

export function sendScreen(forced?: Destination): HTMLElement {
  const to = forced ?? destination()
  // No destination yet, so the screen is the question. At every width: the
  // composer has nothing to compose until it knows where the money is going,
  // and a composer with a blank target is a form with a hole in it.
  if (!to) return sendWhoScreen()
  const bank = to.rail === 'bank'
  const rate = state.ngnPerUsd
  // Built once and handed back on every repaint: the amount changing must not
  // wipe an address somebody is halfway through pasting.
  const side = isMobile() ? null : whereColumn({ search: false })
  return composerScreen({
    place: 'wallet',
    base: walletScreen,
    right: () => side!,
    // On a phone the sheet is all there is, so the row opens the picker. On a
    // wide screen the list is the column beside it, and a Change that opens a
    // dialog to do what the next column already does is a second way to the
    // same place.
    lede: () => h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'To' }),
      h(side ? 'div' : 'button', {
        class: 'sheet-row', style: { background: 'var(--control)' },
        on: side ? {} : { click: () => go('/send') },
      },
        bank
          ? h('span', { class: 'mark', html: icon.convert() })
          : h('span', { class: 'avatar', text: initials(to.name) }),
        h('span', { class: 'two-line grow' },
          h('span', { class: 't-body-strong', text: to.name }),
          // Your own account is already named by the row above it, so the
          // second line masks the number the way the rest of the product
          // does. Somebody else's shows the whole thing, because that is the
          // digits you are checking.
          h('small', { text: !bank
            ? (to.rail === 'chain' ? 'Base address' : lastPaid(to.name))
            : to.bankId
              ? '•••• ' + (to.number ?? '').slice(-4) + ' · ' + state.person.name
              : to.bank + ' · ' + to.number })),
        side ? null : h('span', { class: 'link quiet', text: 'Change' }))),
    title: 'Send money',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Cash ' + usd(state.cash),
    initial: Math.min(bank ? 300 : 120, state.cash),
    max: Math.min(state.cash, movementCeiling()),
    maxLabel: ceilingLabel2(state.cash),
    note: bank
      ? 'Dollars out of your wallet, naira into that account.'
      : 'Arrives in about a minute, any day.',
    quick: bank
      ? [
          { label: usd(50, false), value: 50 },
          { label: usd(100, false), value: 100 },
          { label: usd(300, false), value: 300 },
          { label: 'All', value: state.cash },
        ]
      : [
          { label: usd(20, false), value: 20 },
          { label: usd(50, false), value: 50 },
          { label: usd(120, false), value: 120 },
          { label: 'All', value: state.cash },
        ],
    // No 'To' row: the lede above already names them, and the same fact twice
    // in one dialog reads as a mistake.
    summary: (v) => bank
      ? [
          ['You send', usd(v)],
          ['Rate', '1 dollar = ' + naira(rate)],
          ['Fee', 'No fee'],
          ['They get', naira(v * rate)],
          ['Arrives', 'Usually within a minute'],
        ]
      : [
          ['Fee', 'No fee'],
          ['Arrives', 'In about a minute'],
          ['Network', to.rail === 'chain' ? 'Base' : 'Inside Tokkenly'],
        ],
    callout: bank
      ? 'You get a firm rate on the next screen. It is held for ninety seconds.'
      : 'We move money every day, holidays included.',
    action: (v) => 'Send ' + usd(v),
    onAction: (v) => openSheet('send-review', { v: String(v), ...railParams(to) }),
    bottom: bank ? (pastMoves('out') ?? undefined) : undefined,
  })
}

/** The destination, as the parameters a sheet can be re-opened from. A dialog
 *  that cannot be rebuilt from its address is a dialog that loses its target
 *  on a refresh. */
export function railParams(d: Destination): Record<string, string> {
  const out: Record<string, string> = { rail: d.rail, to: d.bankId ?? d.name }
  if (d.bank) out.bank = d.bank
  if (d.number) out.acct = d.number
  return out
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
        text: 'Shares can only go to a verified Tokkenly account. You can still send these people cash.' })))
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

/** Receive was a screen of its own showing a Base address, beside an Add money
 *  screen showing an account number — two answers to "how does money get in",
 *  on two screens, neither naming the other. It is the Base tab now. The
 *  address still resolves, because somebody has it bookmarked. */
export function receiveScreen(): HTMLElement {
  return addMoneyScreen('base')
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
const NOTE = {
  in: ['Bought dollars'],
  // Both kinds of payout. Money to your own account and money to somebody
  // else's are written with different notes because they are different
  // errands, but "money you have taken out" is true of both, and a card that
  // listed only half of them would be quietly wrong about the half it showed.
  out: ['Converted to naira', 'Paid out in naira'],
} as const

function pastMoves(which: 'in' | 'out'): HTMLElement | null {
  const rows = state.activity
    .filter((a) => (NOTE[which] as readonly string[]).includes(a.note ?? ''))
    .slice(0, 5)
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

/* ---------------------------------------------------------------------------
   Adding money, and the two ways it actually gets here.

   The screen used to show one figure, one bank and one button, and pressing it
   put dollars in the wallet. Nothing was debited, no account was named, and
   the money arrived from nowhere in about as long as a click. The question it
   provoked — "where is the money coming from?" — had no answer because there
   was nothing behind it to answer with.

   There are two ways in, and they are genuinely different, which is why both
   are here rather than one of them dressed up as a choice:

     A transfer  you push naira to an account that belongs to you, from your
                 own bank app. It costs nothing and it takes as long as the
                 banks take. Nobody can hold a rate while you type an account
                 number into another app, so the rate is struck when the money
                 lands, and the screen says so instead of promising otherwise.
     A card      we pull the naira. It is seconds, it costs what the card
                 networks charge, and because it is seconds a firm rate can be
                 held for ninety of them.

   Choosing costs one query parameter, so the choice is a place you can link to
   and come back to rather than a state inside a dialog.
   --------------------------------------------------------------------------- */

export type Via = 'transfer' | 'card'

export const addVia = (): Via =>
  (current().query.get('via') === 'card' && switchOn('fund.card') ? 'card' : 'transfer')


/** Where to send the naira. A dedicated account, permanently yours, which is
 *  why there is no reference to quote: money reaching it can only be yours.
 *  The number is the thing being copied, so the button is on the number. */
function virtualAccount(): HTMLElement {
  const v = state.va
  return card(
    cardHead('Send your naira here'),
    kv('Bank', v.bank),
    h('div', { class: 'kv' },
      h('span', { class: 't-caps subtle', text: 'Account number' }),
      h('button', {
        class: 'copy va-number', title: 'Copy the account number',
        on: {
          click: () => {
            navigator.clipboard?.writeText(v.number).catch(() => {})
            toast('Account number copied')
          },
        },
      },
        h('span', { class: 't-body-strong', text: v.number }),
        h('span', { class: 'muted', html: icon.copy() }))),
    kv('Account name', v.name),
    callout('This account is yours and never changes.'))
}

/* ---------------------------------------------------------------------------
   Adding money is one errand with three ways in.

   It was two screens. "Add money" asked how much and then handed over an
   account number; "Receive" showed a Base address. Both answer the same
   question — how does money get into this wallet — and asking somebody to know
   which of two screens holds their answer is asking them to know the plumbing.

   And two of the three take no amount at all. A bank transfer and a Base
   payment are *pushed*: the product hands over the details and waits. Being
   asked "how much?" before being given an account number is being asked to
   commit to a figure that nothing will hold you to. Only the card is pulled,
   and only the card asks.

   So: one door, three tabs, and the tab is in the address so it can be linked
   to and come back to. Each tab is the details you need and what has already
   arrived that way.
   --------------------------------------------------------------------------- */

export type AddTab = 'bank' | 'base' | 'card'

const ADD_TABS: [AddTab, string][] = [['bank', 'Bank transfer'], ['base', 'Base'], ['card', 'Card']]

export const addTab = (): AddTab => {
  const t = current().query.get('tab')
  if (t === 'base') return 'base'
  if (t === 'card' && switchOn('fund.card')) return 'card'
  return 'bank'
}

/** What has already come in this way. Split by rail, because a tab that lists
 *  every deposit is a tab that answers a question you did not ask on it. */
function arrived(tab: AddTab, full = true): HTMLElement {
  const rows = state.activity
    .filter((a) => a.kind === 'payment' && a.amount > 0 && a.rail === tab)
    .slice(0, full ? 4 : 2)
  const head = cardHead(
    tab === 'base' ? 'Paid to this address' : 'Added this way',
    h('button', { class: 'link', text: 'See all',
      on: { click: () => go('/activity?filter=payments') } }))
  if (!rows.length) {
    return card(head, h('span', { class: 'muted',
      text: tab === 'base'
        ? 'Nothing has been sent to this address yet.'
        : 'Nothing has come in this way yet.' }))
  }
  // Inside the dialog it is a short list rather than a table: a header row
  // over two rows of data is a header row that costs more than it explains.
  if (!full) {
    return card(head, ...rows.map((a) =>
      h('div', { class: 'kv' },
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: activityLabel(a) }),
          h('small', { class: 'muted', text: when(a.at) })),
        amount(a))))
  }
  return card(head, table(
    [
      { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
      { key: 'amt', label: 'Amount', align: 'right' },
    ],
    rows.map((a) => [
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: activityLabel(a) }),
        h('small', { class: 'phone-only', text: when(a.at) })),
      h('span', { class: 'muted', text: when(a.at) }),
      amount(a),
    ]),
    (i) => openSheet('receipt', { ref: rows[i].ref })
  ))
}

/** The tabs. Chips rather than a picker, because there are three of them and
 *  all three fit on one line at every width this product draws. */
export function addTabRow(now: AddTab): HTMLElement {
  const row = h('div', { class: 'chip-row' })
  for (const [key, label] of ADD_TABS) {
    // A rail operations has switched off is shown as off, not hidden. A door
    // that vanishes makes people think they misremembered it; one that says
    // "not right now" tells them to come back. That was the rail picker's rule
    // and it is still the rule now the rails are tabs.
    const off = key === 'card' && !switchOn('fund.card')
    const b = h('button', {
      class: 'chip' + (off ? ' off' : ''), ariaPressed: key === now && !off,
      disabled: off,
      on: { click: () => (off ? undefined : go(current().path + '?tab=' + key)) },
    }, h('span', { text: label }), off ? h('small', { text: 'Paused' }) : null)
    if (off) b.title = 'Card funding is off right now. Transfers are unaffected.'
    row.appendChild(b)
  }
  return row
}

/** Your Base address, and the code for it. Lifted out of the Receive screen
 *  whole: the address, the block pattern, the copy, and the one line that
 *  costs real money to get wrong. */
function basePanel(full = true): HTMLElement {
  const address = WALLET
  const short = address.slice(0, 12) + '\u2026' + address.slice(-4)
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
  return card(
    cardHead('Your address', h('span', { class: 'muted', text: 'Base' })),
    h('div', { class: 'stack-12', style: { alignItems: 'center' } },
      qr,
      full ? h('span', { class: 'muted', text: 'Scan this to pay ' + state.person.name }) : null),
    h('div', { class: 'field', style: { justifyContent: 'space-between' } },
      h('span', { class: 't-body-strong', text: short }),
      h('button', { class: 'icon-btn', html: icon.copy(), ariaLabel: 'Copy the address',
        on: { click: copy } })),
    // The field carries a copy button of its own, so the wide one is the
    // page's. In a dialog it is 56 pixels saying what the icon beside the
    // address already said.
    full ? h('button', { class: 'btn btn-primary', text: 'Copy address', on: { click: copy } }) : null,
    callout('Base network only. Anything else is lost.', 'warning'))
}

/** The one tab that has to ask. A card is pulled, so a figure has to exist
 *  before anything can happen — and the fee is on it rather than on the review
 *  behind it, because a fee you meet after pressing the button is a fee you
 *  found out about later. */
function cardPanel(): HTMLElement {
  const plastic = state.cards[0]
  const rate = state.ngnPerUsd
  let value = 200
  const owed = (v: number) => Math.round(v * rate) + cardFee(Math.round(v * rate))
  const pay = h('span', { class: 't-display-xl', text: naira(owed(value)) })
  const split = h('span', { class: 'muted' })
  const btn = h('button', { class: 'btn btn-primary', text: 'Pay ' + naira(owed(value)),
    on: { click: () => openSheet('card-review', { v: String(value) }) } })
  const paint = () => {
    pay.textContent = naira(owed(value))
    split.textContent = `${naira(value * rate)} for the dollars, ${naira(cardFee(Math.round(value * rate)))} card fee.`
    btn.textContent = 'Pay ' + naira(owed(value))
    btn.toggleAttribute('disabled', value < 10 || value > movementCeiling())
  }
  const input = h('input', {
    type: 'text', inputmode: 'decimal', value: String(value), ariaLabel: 'How many dollars',
    on: { input: (e) => {
      const n = Number((e.target as HTMLInputElement).value.replace(/[^\d.]/g, ''))
      value = Number.isFinite(n) ? n : 0
      paint()
    } },
  })
  paint()
  return card(
    cardHead('How many dollars', h('span', { class: 'muted', text: 'Minimum ' + usd(10, false) })),
    h('label', { class: 'field' }, h('span', { class: 'muted', text: '$' }), input),
    h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'You pay' }),
      pay, split),
    h('div', { class: 'stack-12' },
      kv('Card', plastic.brand + ' \u2022\u2022\u2022\u2022 ' + plastic.last4),
      kv('Rate', '1 dollar = ' + naira(rate)),
      kv('Lands', 'In a few seconds')),
    btn,
    h('button', { class: 'link', text: 'Use another card', on: { click: () => openSheet('cards') } }))
}

/** One tab's worth of Add money, used by the dialog and by the page behind it
 *  so the two cannot say different things. */
export function addPanels(tab: AddTab, full = true): HTMLElement[] {
  const panel = tab === 'base' ? basePanel(full) : tab === 'card' ? cardPanel() : virtualAccount()
  if (!full) {
    // One card, not three. A dialog that stacks a details card, a provider
    // note and a history card spends 112 pixels on padding and gaps before it
    // has said anything, and item 61's ceiling is 692 on a phone. What has
    // arrived goes inside the details card; the provider note is the page's.
    for (const el of arrivedRows(tab, 2)) panel.appendChild(el)
    return [addTabRow(tab), panel]
  }
  return [
    addTabRow(tab),
    panel,
    providerNote(tab === 'base' ? 'cdp' : 'switch'),
    arrived(tab, true),
  ].filter(Boolean) as HTMLElement[]
}

/** The last few that came in this way, as bare rows for the dialog to adopt. */
function arrivedRows(tab: AddTab, n: number): HTMLElement[] {
  const rows = state.activity
    .filter((a) => a.kind === 'payment' && a.amount > 0 && a.rail === tab)
    .slice(0, n)
  const head = h('div', { class: 'card-head' },
    h('h3', { class: 't-caps subtle',
      text: tab === 'base' ? 'Paid to this address' : 'Added this way' }),
    h('button', { class: 'link', text: 'See all',
      on: { click: () => go('/activity?filter=payments') } }))
  if (!rows.length) {
    return [head, h('span', { class: 'muted t-caption', text: tab === 'base'
      ? 'Nothing has been sent here yet.' : 'Nothing has come in this way yet.' })]
  }
  return [head, ...rows.map((a) =>
    h('div', { class: 'kv' },
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: activityLabel(a) }),
        h('small', { class: 'muted', text: when(a.at) })),
      amount(a)))]
}

export function addMoneyScreen(forced?: AddTab): HTMLElement {
  const tab = forced ?? addTab()
  const [tabs, ...rest] = addPanels(tab)
  // The composer is gone. It asked how much before handing over an account
  // number, on a rail where nothing holds you to the figure — see the note
  // above `AddTab`. The card tab is where a figure now lives, because a card
  // is the only one of the three that is pulled.
  return shell(
    'wallet',
    pageHeader('Add money', eyebrow('Cash available', usd(state.cash))),
    tabs,
    h('div', { class: 'row' },
      h('div', { class: 'stack col-compose' }, rest[0], rest[1] ?? null),
      h('div', { class: 'stack grow' },
        rest.slice(2).length ? rest[rest.length - 1] : null,
        card(
          cardHead('The three ways in'),
          kv('Bank transfer', 'Naira from any Nigerian bank'),
          kv('Base', 'Dollars from any Base wallet'),
          kv('Card', 'Naira on a debit card, ' + state.fees.card + '% fee'),
          h('span', { class: 'muted t-caption',
            text: 'The first two take no amount. You are given the details and you pay in.' })))))
}

/** The old Withdraw, which is Send with the destination already answered.
 *  It keeps its address rather than its screen: a redirect, not a copy, so
 *  there is one composer for the errand and no second one to drift from it. */
export function withdrawScreen(): HTMLElement {
  const own = state.banks[0]
  // The composer itself, with the destination already answered — not a
  // redirect. A redirect would paint the picker for one frame and then jump,
  // and the point of keeping the address is that it lands where it always did.
  if (!own) return sendScreen()
  return sendScreen({
    rail: 'bank', name: own.name, bankId: own.id, bank: own.name, number: own.number,
  })
}

