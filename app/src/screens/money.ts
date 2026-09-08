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
import { stockScreen } from './stock'
import { walletScreen } from './wallet'
import { find, type Instrument, pathOf } from '../catalogue'
import { usd, naira, when, shares, activityLabel } from '../format'
import { openSheet, current, go, closeSheet } from '../router'

import { isMobile, isSplit } from '../responsive'
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
export function destination(way?: 'tokkenly' | 'bank' | 'base'): Destination | null {
  const r = current()
  // The way comes from the path now — /send/bank is a bank whatever the query
  // says. `?rail=` is still read for the addresses that predate the split, and
  // for the review dialog, which is rebuilt from its own parameters.
  const rail = way ? (way === 'base' ? 'chain' : way) : r.query.get('rail')
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
    go('/send/bank?to=' + encodeURIComponent(name) +
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
/* ---------------------------------------------------------------------------
   Three ways, in a rail.

   This was four cards down one screen — people, your own banks, somebody
   else's account, a Base address — and then the composer replaced the lot of
   them, so the way you had chosen stopped being on screen the moment you
   chose it. Two things were wrong with that. A person who picked the wrong
   way had to go back to change it, and the trail said "Wallet › Send money"
   at every step of an errand with three of them.

   So it is the shape Account already uses: the ways stay in a rail on the
   left, the one you picked fills the panel on the right, and the panel is
   where the whole errand happens — the list, then the amount, then the
   review, which is a dialog because it is a commit. The rail never moves.

   And the two bank cards became one. They were split because one needs a name
   check and the other does not, which is a fact about the second step and not
   a reason for two doors: a bank account is a bank account, and whose it is
   is the first thing the panel asks.
   --------------------------------------------------------------------------- */

type Way = 'tokkenly' | 'bank' | 'base'

const WAYS: { key: Way; label: string; ic: () => string; sub: () => string }[] = [
  { key: 'tokkenly', label: 'Someone on Tokkenly', ic: icon.account,
    sub: () => 'Dollars, in about a minute' },
  { key: 'bank', label: 'A bank account', ic: icon.convert,
    sub: () => (switchOn('payout.ngn') ? 'Dollars out, naira in' : 'Paused') },
  { key: 'base', label: 'USDC on Base', ic: icon.wallet,
    sub: () => 'Dollars on the network' },
]

const wayOf = (d: Destination): Way =>
  d.rail === 'bank' ? 'bank' : d.rail === 'chain' ? 'base' : 'tokkenly'
const wayLabel = (w: Way): string => WAYS.find((x) => x.key === w)!.label

/** The rail. Same rows as the Account index, because it is the same idea and
 *  a second set of rows that looked almost like those would be a second idea
 *  by accident.
 *
 *  `pick` is for the sheet these rows become on a phone: there the answer has
 *  to close the dialog before it navigates, and a second copy of the rows
 *  written to do that would be a second idea by accident too. */
function sendRail(active?: Way, pick?: (w: Way) => void): HTMLElement {
  return h('nav', { class: 'set-list ways' + (active ? ' rail' : ''), ariaLabel: 'Ways to send' },
    ...WAYS.map((w) => {
      const row = h('button', {
        class: 'set-row' + (w.key === active ? ' on' : ''),
        on: { click: () => (pick ? pick(w.key) : go('/send/' + w.key)) },
      },
        // A name and a sentence about it, stacked. Account's rows carry a name
        // and a status and fit them side by side; "Someone on Tokkenly" beside
        // "Dollars, in about a minute" in a 320px column is two ellipses.
        h('span', { class: 'who' },
          h('span', { class: 'mark', html: w.ic() }),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: w.label }),
            h('small', { text: w.sub() }))),
        h('span', { class: 'muted set-chev', html: icon.chevron() }))
      if (w.key === active) row.setAttribute('aria-current', 'page')
      return row
    }))
}

/** Everybody you have paid, searchable. The list narrows as you type and the
 *  address is only touched on Enter, because a route change rebuilds the tree
 *  and takes the focus with it. */
function peopleWay(): (Node | null)[] {
  const r = current()
  const term = r.query.get('q') ?? ''
  const people = byRecent(PEOPLE())
  const FIELDS = (n: string) => [n, lastPaid(n)]
  const row = (n: string) =>
    h('button', {
      class: 'sheet-row',
      on: { click: () => go('/send/tokkenly?to=' + encodeURIComponent(n)) },
    },
      h('span', { class: 'avatar', text: initials(n) }),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: n }),
        h('small', { text: lastPaid(n) })),
      h('span', { class: 'muted', html: icon.chevron() }))

  const list = h('div', { class: 'stack' })
  const paint = (t: string): void => {
    const found = t.trim() ? rank(t, people, FIELDS) : people
    list.replaceChildren(card(
      cardHead('Who is it going to'),
      searchNote(t, found.length, onlyNear(t, found, FIELDS)),
      found.length
        ? h('div', { class: 'sheet-list' }, ...found.map(row))
        : emptyState('Nobody by that name',
            'Search another name, or pick another way to send.',
            { label: 'Clear the search', onClick: () => go('/send/tokkenly') })))
  }
  paint(term)

  return [
    searchField({
      placeholder: 'Search a name',
      value: term,
      suggest: (t) => rank(t, people, FIELDS).slice(0, 7).map((n) => ({
        label: n, hint: 'Send dollars', group: 'People',
        pick: () => go('/send/tokkenly?to=' + encodeURIComponent(n)),
      })),
      onType: paint,
      onCommit: (v) => go('/send/tokkenly' + (v ? '?q=' + encodeURIComponent(v) : '')),
    }),
    list,
    card(
      cardHead('What this way is'),
      kv('Arrives', 'In about a minute, any day'),
      kv('Fee', 'No fee'),
      kv('Currency', 'Dollars, both ends')),
  ]
}

/** Your own banks, and then anybody else's. Whose account it is decides one
 *  thing only — whether a name has to come back from the bank before the money
 *  can go — so it is a question inside this way rather than two ways. */
function bankWay(): (Node | null)[] {
  if (!switchOn('payout.ngn')) {
    return [card(
      cardHead('A bank account', h('span', { class: 'pill warn', text: 'Paused' })),
      h('span', { class: 'muted',
        text: 'Bank payouts are off right now. You can still send dollars to a person or a wallet. Anything already on its way will finish.' }))]
  }
  return [
    card(
      cardHead('One of your banks'),
      ...state.banks.map((b) =>
        h('button', {
          class: 'sheet-row',
          on: { click: () => go('/send/bank?to=' + encodeURIComponent(b.id)) },
        },
          h('span', { class: 'mark', html: icon.convert() }),
          h('span', { class: 'two-line grow' },
            h('span', { class: 't-body-strong', text: b.name }),
            h('small', { text: '•••• ' + b.last4 + ' · ' + b.holder })),
          h('span', { class: 'muted', html: icon.chevron() }))),
      h('span', { class: 'muted t-caption', text: 'Dollars out, naira in.' }),
      h('button', { class: 'link quiet', text: 'Add a bank', on: { click: () => openSheet('banks') } })),
    payeeCard(),
  ]
}

/** A Base address, checked for shape before it is used. */
function baseWay(): (Node | null)[] {
  const address = h('input', { placeholder: 'Paste a Base address' })
  const field = h('label', { class: 'field' }, address)
  const err = fieldError(
    h('span', { html: icon.alert() }), h('span', { text: 'Paste a full Base address' }))
  err.hidden = true
  const submit = () => {
    const v = address.value.trim()
    // The mistake is shown where it was made, not in a toast that has gone by.
    const bad = v.length < 8
    field.classList.toggle('error', bad)
    err.hidden = !bad
    if (bad) { address.focus(); return }
    go('/send/base?to=' + encodeURIComponent(v.slice(0, 6) + '…' + v.slice(-4)))
  }
  address.addEventListener('input', () => { field.classList.remove('error'); err.hidden = true })
  address.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') { e.preventDefault(); submit() }
  })
  return [
    card(
      cardHead('Where is it going'),
      field,
      err,
      h('button', { class: 'btn btn-secondary', text: 'Continue', on: { click: submit } }),
      callout('Base network only. Anything else sent here is lost.', 'warning')),
    card(
      cardHead('What this way is'),
      kv('Network', 'Base, and only Base'),
      kv('Fee', 'No fee'),
      kv('Final', 'A sent transaction cannot be recalled')),
  ]
}

const wayPanel = (w: Way): (Node | null)[] =>
  w === 'bank' ? bankWay() : w === 'base' ? baseWay() : peopleWay()

/** The rail beside a panel, or the panel under a header. One shape, so the
 *  screen does not have to be written three times. */
function sendShell(w: Way, steps: { label: string; to?: string }[],
                   body: (Node | null)[]): HTMLElement {
  const head = pageHeader('Send money', eyebrow('Cash available', usd(state.cash)),
    steps.length ? { steps } : {})
  // Narrow: the way you picked is the whole screen. The rail was drawn above
  // the panel here as well, which put the two ways you did not choose between
  // you and the one you did — 244 pixels of an 844-pixel screen, saying a
  // second time what the trail at the top already says, and pushing the people
  // list to 456px. The trail's middle crumb goes back to the three ways, which
  // is what the Account index does at this width: it does not repeat itself
  // over the group you opened either.
  if (!isSplit()) {
    return shell('wallet', head, ...body)
  }
  return shell('wallet', head,
    h('div', { class: 'row set-split' },
      h('div', { class: 'stack set-col' }, sendRail(w)),
      h('div', { class: 'stack grow set-panel' }, ...body)))
}

/** The ways, with nothing chosen yet. On a phone that is the whole screen; on
 *  a wide one the first way fills the panel, because a column of rows beside
 *  nothing is a screen that looks broken. */
function sendPicker(w: Way): HTMLElement {
  return sendShell(w, [{ label: wayLabel(w) }], wayPanel(w))
}

export function sendWhoScreen(): HTMLElement {
  // Wide: a column of rows beside nothing is a screen that looks broken, so
  // the first way fills the panel — and the address says so, because a screen
  // showing one thing under an address that names another is the fault this
  // tier is here to fix.
  if (isSplit()) {
    queueMicrotask(() => go('/send/tokkenly', true))
    return sendPicker('tokkenly')
  }
  // Narrow: the three ways come up from the bottom over the wallet. They were
  // a page of their own, which meant pressing Send left the wallet for a
  // screen holding a title and three rows — and closing it had nowhere
  // sensible to land. A question with three answers is a dialog, and a dialog
  // belongs over the screen it was opened from.
  queueMicrotask(() => go('/transfer?sheet=send-ways', true))
  return walletScreen()
}

/** The three ways, as the body of a sheet. Picking one closes the dialog and
 *  goes to that way, the same as every other list a sheet offers. */
export const sendWays = (): HTMLElement =>
  sendRail(undefined, (w) => { closeSheet(); go('/send/' + w) })

export const addWays = (): HTMLElement =>
  addRail(undefined, (t) => { closeSheet(); go('/addmoney/' + t) })

export function sendScreen(sub?: string, forced?: Destination): HTMLElement {
  const picked = WAYS.find((x) => x.key === sub)?.key
  // An address that names its way in the query rather than its path — /send?to=,
  // /send?rail=chain&to=, /withdraw — is the same place as the one that names
  // it in the path, and one thing with two addresses is what rule 144 is for.
  // So it goes there, replacing rather than pushing: an old link should not
  // cost a step in the history somebody then has to press back through.
  if (!picked && !forced) {
    const old = destination()
    if (old) {
      const q = new URLSearchParams(current().query)
      q.delete('rail')
      const at = '/send/' + wayOf(old) + (q.toString() ? '?' + q.toString() : '')
      // After this render, not during it. `go` calls the route handler
      // straight away, so redirecting inside a render paints the destination
      // and then has this render's own result mounted on top of it — the
      // redirect works and is immediately undone.
      queueMicrotask(() => go(at, true))
      // The way it is about to become, not the picker: `sendWhoScreen` queues
      // a redirect of its own on a wide screen, and two queued redirects race
      // — the second one landed last and dropped the query this one is
      // carrying, which is the destination and any open dialog.
      return sendPicker(wayOf(old))
    }
  }
  const to = forced ?? destination(picked)
  const w: Way | undefined = to ? wayOf(to) : picked
  if (!w) return sendWhoScreen()
  if (!to) return sendPicker(w)

  const bank = to.rail === 'bank'
  const rate = state.ngnPerUsd
  const split = isSplit()
  const steps = [{ label: wayLabel(w), to: '/send/' + w }, { label: to.name }]

  const spec = {
    place: 'wallet' as const,
    // On a phone the composer is a sheet over the way it came from, so closing
    // it lands on the list rather than on the wallet. On a wide screen the way
    // is the lit row in the rail beside it and there is nothing to go under.
    base: () => sendPicker(w),
    // Who it is going to, above the amount. On a wide screen the rail is two
    // inches to the left, so this states the target rather than offering to
    // change it: a Change that opens what the next column already shows is a
    // second way to one place.
    lede: () => h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'To' }),
      h(split ? 'div' : 'button', {
        class: 'sheet-row', style: { background: 'var(--control)' },
        on: split ? {} : { click: () => go('/send/' + w) },
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
        split ? null : h('span', { class: 'link quiet', text: 'Change' }))),
    title: 'Send money',
    eyebrow: ['Cash available', usd(state.cash)] as [string, string],
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
    summary: (v: number): [string, string, string?][] => bank
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
    action: (v: number) => 'Send ' + usd(v),
    onAction: (v: number) => openSheet('send-review', { v: String(v), ...railParams(to) }),
  }

  // Wide: the ways stay in the rail and the amount fills the panel, so the
  // whole errand happens in one place and the way you took is still on screen
  // while you take it.
  if (split) {
    return shell('wallet',
      pageHeader('Send money', eyebrow('Cash available', usd(state.cash)), { steps }),
      h('div', { class: 'row set-split' },
        h('div', { class: 'stack set-col' }, sendRail(w)),
        h('div', { class: 'stack grow set-panel' },
          composerScreen({ ...spec, inline: true }),
          bank ? pastMoves('out') : null)))
  }
  // Narrow: the composer is a sheet over the list it came from, which is the
  // one shape every composer in the product takes at this width.
  return composerScreen({ ...spec, bottom: bank ? (pastMoves('out') ?? undefined) : undefined })
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
      on: { click: () => go('/send/tokkenly?to=' + encodeURIComponent(to)) } }),
    // On a wide screen the list of people who can receive it is the column
    // beside this; on a phone there is nothing but this card, so it carries
    // the way back to the list.
    isMobile()
      ? h('button', { class: 'btn btn-secondary', text: 'Choose somebody else',
          on: { click: () => go(pathOf(c) + '/send') } })
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
        { label: 'Buy ' + c.ticker, onClick: () => go(pathOf(c) + '/invest') }))
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
/** Receive was its own address for the same screen, which is one thing with
 *  two names. It is the Base way of Add money, so it goes there. */
export function receiveScreen(): HTMLElement {
  const q = new URLSearchParams(current().query)
  q.delete('tab')
  const at = '/addmoney/base' + (q.toString() ? '?' + q.toString() : '')
  queueMicrotask(() => go(at, true))
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
      h('button', { class: 'link', text: 'All payments',
        on: { click: () => go('/activity?filter=payments') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
        { key: 'ref', label: 'Reference', optional: true }, { key: 'amt', label: 'Amount', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: activityLabel(a) })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: a.ref }),
        amount(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref }),
      undefined,
      { lead: 'w', detail: ['when', 'ref'], figure: ['amt'] },
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

export const addTab = (sub?: string): AddTab => {
  // The way is a path segment now, the same as Send's. `?tab=` is still read
  // for the addresses that predate it.
  //
  // Card used to fall back to bank whenever card funding was switched off,
  // which left /addmoney/card showing the naira account under a trail reading
  // "Bank transfer" — one screen wearing three names, none of them Card. The
  // switch decides what the card panel says, not which panel you are on.
  const t = sub ?? current().query.get('tab')
  if (t === 'base') return 'base'
  if (t === 'card') return 'card'
  return 'bank'
}

/** The three ways money comes in, as a rail. Same shape as the ways out: a
 *  name, a sentence about it, and the details in the panel beside it. They
 *  were chips above the panel, which is the right control for three of a kind
 *  and the wrong one once the question is "which of these do I want" rather
 *  than "which of these am I looking at". */
const IN_WAYS: { key: AddTab; label: string; ic: () => string; sub: () => string }[] = [
  { key: 'bank', label: 'Bank transfer', ic: icon.convert,
    sub: () => 'Naira from any Nigerian bank' },
  { key: 'base', label: 'USDC on Base', ic: icon.wallet,
    sub: () => 'Dollars from any Base wallet' },
  { key: 'card', label: 'Debit card', ic: icon.card,
    sub: () => (switchOn('fund.card') ? 'Naira on a card, ' + state.fees.card + '% fee' : 'Paused') },
]

function addRail(active?: AddTab, pick?: (t: AddTab) => void): HTMLElement {
  return h('nav', { class: 'set-list ways' + (active ? ' rail' : ''), ariaLabel: 'Ways to add money' },
    ...IN_WAYS.map((w) => {
      // A rail operations has switched off is shown as off, not hidden. A door
      // that vanishes makes people think they misremembered it; one that says
      // "not right now" tells them to come back.
      //
      // It was also `disabled`, which is a door you cannot come back through:
      // the only ways left to the card screen were search and a bookmark, and
      // the screen they reached was the naira account under a trail reading
      // "Bank transfer". A paused door opens onto a screen that says it is
      // paused — that is what makes it a door rather than a label.
      const off = w.key === 'card' && !switchOn('fund.card')
      const row = h('button', {
        class: 'set-row' + (w.key === active ? ' on' : '') + (off ? ' off' : ''),
        on: { click: () => (pick ? pick(w.key) : go('/addmoney/' + w.key)) },
      },
        h('span', { class: 'who' },
          h('span', { class: 'mark', html: w.ic() }),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: w.label }),
            h('small', { text: w.sub() }))),
        off ? h('span', { class: 'pill warn', text: 'Paused' }) : null,
        h('span', { class: 'muted set-chev', html: icon.chevron() }))
      if (w.key === active) row.setAttribute('aria-current', 'page')
      return row
    }))
}

/** What has already come in this way. Split by rail, because a tab that lists
 *  every deposit is a tab that answers a question you did not ask on it. */
function arrived(tab: AddTab, full = true): HTMLElement {
  const rows = state.activity
    .filter((a) => a.kind === 'payment' && a.amount > 0 && a.rail === tab)
    .slice(0, full ? 4 : 2)
  const head = cardHead(
    tab === 'base' ? 'Paid to this address' : 'Added this way',
    h('button', { class: 'link', text: 'All payments',
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
        h('span', { class: 't-body-strong', text: activityLabel(a) })),
      h('span', { class: 'muted', text: when(a.at) }),
      amount(a),
    ]),
    (i) => openSheet('receipt', { ref: rows[i].ref }),
    undefined,
    { lead: 'w', detail: ['when'], figure: ['amt'] },
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
      class: 'chip' + (off ? ' off' : ''), ariaPressed: key === now,
      on: { click: () => go(current().path + '?tab=' + key) },
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
  // Switched off. The screen still exists, still says Card, and says why it
  // cannot take a payment — and then points at the two ways that can. A
  // paused way that hands you an amount box you cannot submit is worse than
  // one that tells you and moves on.
  if (!switchOn('fund.card')) {
    return card(
      cardHead('Card funding', h('span', { class: 'pill warn', text: 'Paused' })),
      h('p', { class: 'muted', style: { margin: '0' },
        text: 'Cards are off right now. Nothing is wrong with your card — we have '
          + 'stopped taking them for the moment, and we would rather say so than '
          + 'take the money and hold it.' }),
      h('div', { class: 'stack-12' },
        kv('Card', plastic.brand + ' \u2022\u2022\u2022\u2022 ' + plastic.last4),
        kv('Fee when it is back', state.fees.card + '% of what you pay')),
      h('button', { class: 'btn btn-primary', text: 'Add money by transfer',
        on: { click: () => go('/addmoney/bank') } }),
      h('button', { class: 'btn btn-secondary', text: 'Add USDC on Base',
        on: { click: () => go('/addmoney/base') } }))
  }
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
    h('div', { class: 'amount-box' }, input),
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

/** Telling the product about a transfer you have already made.
 *
 *  The brief was that a deposit should not ask how much before handing over an
 *  account number, and that is right: nothing holds you to the figure, and the
 *  money that lands is whatever the sender sent. Asking *after* is a different
 *  question. This is not a gate in front of the details — it is under them, for
 *  somebody who has paid and wants to watch it arrive, and it is what puts the
 *  pending leg on the wallet (11g.37).
 *
 *  Page only. In the dialog it would be a second amount under the one thing the
 *  dialog exists to hand over, and it would not fit under item 61's ceiling. */
function alreadyPaid(): HTMLElement {
  const rate = state.ngnPerUsd
  let value = 200
  const note = h('span', { class: 'muted' })
  const btn = h('button', { class: 'btn btn-primary', text: 'I have sent it',
    on: { click: () => openSheet('transfer-review', { v: String(value) }) } })
  const paint = () => {
    note.textContent = `${naira(value * rate)} at ${naira(rate)} to the dollar.`
    btn.toggleAttribute('disabled', value < 10 || value > movementCeiling())
  }
  const input = h('input', {
    type: 'text', inputmode: 'decimal', value: String(value), ariaLabel: 'How many dollars you sent',
    on: { input: (e) => {
      const n = Number((e.target as HTMLInputElement).value.replace(/[^\d.]/g, ''))
      value = Number.isFinite(n) ? n : 0
      paint()
    } },
  })
  paint()
  return card(
    cardHead('Already paid it?', h('span', { class: 'muted', text: 'Optional' })),
    h('span', { class: 'muted',
      text: 'Tell us how much you sent and we will show it as on its way until it lands.' }),
    // The product's amount control, not a third way of typing one (item 19).
    h('div', { class: 'amount-box' }, input),
    note,
    btn)
}

/** One way's worth of Add money, used by the dialog and by the page behind it
 *  so the two cannot say different things.
 *
 *  The chips are the dialog's alone. The page's way-picker is the rail beside
 *  the panel, so this handed the page a chip row it destructured straight back
 *  off again — two way-pickers in one file, one of them never seen. */
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
    panel,
    tab === 'bank' ? alreadyPaid() : null,
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
    h('button', { class: 'link', text: 'All payments',
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

export function addMoneyScreen(sub?: string, forced?: AddTab): HTMLElement {
  const q = new URLSearchParams(current().query)
  // Narrow, with nothing in the address saying which way: ask from the bottom,
  // over the wallet, the same as Send does. This landed on Bank transfer
  // without asking anything, so one question had two answers at the same
  // width. An address that already names a way, or that has a dialog open on
  // it, is not the question — it goes where it says.
  if (!sub && !forced && !isSplit() && !q.get('tab') && !q.get('sheet')) {
    queueMicrotask(() => go('/transfer?sheet=add-ways', true))
    return walletScreen()
  }
  const tab = forced ?? addTab(sub)
  // An old address names its way in the query, or not at all. Same place, so
  // it goes there rather than being a second copy of it.
  if (!sub) {
    // Carrying the query with it. It dropped it, which took an open dialog and
    // its parameters with it: /addmoney?sheet=transfer-review&v=200 is a
    // review somebody is looking at, and a redirect that keeps only the path
    // closes it.
    q.delete('tab')
    const at = '/addmoney/' + tab + (q.toString() ? '?' + q.toString() : '')
    queueMicrotask(() => go(at, true))
  }
  // The composer is gone. It asked how much before handing over an account
  // number, on a rail where nothing holds you to the figure — see the note
  // above `AddTab`. The card tab is where a figure now lives, because a card
  // is the only one of the three that is pulled.
  const rest = addPanels(tab)
  const label = IN_WAYS.find((w) => w.key === tab)!.label
  const head = pageHeader('Add money', eyebrow('Cash available', usd(state.cash)),
    { steps: [{ label }] })
  // Narrow: the way you picked is the whole screen, and the trail is the way
  // back to the three. See `sendShell` for why it is not the rail again.
  if (!isSplit()) {
    return shell('wallet', head, ...rest)
  }
  // Wide: the three ways stay beside the one you are reading, so choosing
  // another is one press rather than a press and a scroll back up.
  return shell('wallet', head,
    h('div', { class: 'row set-split' },
      h('div', { class: 'stack set-col' }, addRail(tab)),
      h('div', { class: 'stack grow set-panel' }, ...rest)))
}

/** The old Withdraw and Convert, which were each one errand and were both Send
 *  with the destination already answered.
 *
 *  They rendered the composer in place, so the address stayed /withdraw and the
 *  trail could only say "Wallet › Send money" — it had no way to name the bank
 *  rail, because the rail was not in the address. Now that a way has an address
 *  of its own, the honest thing is to go there: one place, one name, one trail.
 *  Replacing rather than pushing, so back from the composer is the wallet and
 *  not this address again. */
export function withdrawScreen(): HTMLElement {
  const own = state.banks[0]
  const at = '/send/bank' + (own ? '?to=' + encodeURIComponent(own.id) : '')
  queueMicrotask(() => go(at, true))
  return sendScreen('bank')
}

