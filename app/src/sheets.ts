import { h, swap, show } from './ui'
import { icon } from './icons'
import { sheet, figure, panel, foldPanel, outcome, toast } from './components/sheet'
import { callout as calloutEl, emptyState as emptyStateEl, skeletonList } from './components/bits'
import {
  state, actions, owed, monthlyCost, monthlyInterest, holding, bucketTotal, bucketRefusals,
  tradeFee, cardFee, weakPin, ratePassword, LIMITS, type Activity, txHash, onChain, supportRef,
  switchOn, assetOn,
  requestQuote, quoteLive, settlement, grossOf, billOutcome, payAsset, money, rateLine,
  type Quote, type Destination,
} from './state'
import { pinPad } from './components/pinpad'
import {
  find, discount, CATALOGUE, refusals, priceImpact, minReceived, deviation, GUARDS,
  type Instrument, pathOf,
} from './catalogue'
import { sparkline, type Range } from './components/chart'
import { usd, naira, pct, shares as fmtShares, longWhen, when, isDrawdown } from './format'
import { type Route, closeSheet, replaceSheet, go } from './router'
import { isMobile } from './responsive'
import { QA } from './screens/settings'
import { peopleRows, addPanels, addTab, sendWays, addWays } from './screens/money'
import { billFrom } from './screens/spend'
import { parts, partName, partFigure, partUnder, partAlso } from './screens/wallet'
import { assetOf, netOf, shortAddress, DOLLARS, type Asset } from './assets'
import { assetLine } from './components/purse'
import { search } from './destinations'
import * as ledger from './ledger'
import { BEHIND_MORE } from './components/shell'

/** One year, which is the span a receipt's sparkline should show: long enough
 *  to be a shape rather than a squiggle, short enough to be about now. */
const YEAR: Range = { key: '1Y', days: 365, pct: 17.28, vol: 0.09, fmt: () => '', over: 'this year' }

/** How long a confirmation shows its spinner. Short enough not to annoy,
 *  long enough that the state is real rather than decorative. */
export const CONFIRM_MS = 350

/* How long the two ways in actually take.
   A card is pulled by us and clears in seconds; a transfer is pushed by a
   person through their own bank and takes as long as the banks take. The
   difference is the point of offering both, so it is a real wait with a real
   posting on either side of it rather than a spinner over an answer we
   already had. Short enough to demonstrate, long enough to be a state. */
const CARD_MS = 1400
const TRANSFER_MS = 2600

/** The destination a send sheet was opened for, rebuilt from its address.
 *  A dialog that cannot be reconstructed from the route is a dialog that
 *  loses its target the moment the tree is rebuilt. */
function destFrom(r: Route): Destination {
  const rail = (r.query.get('rail') ?? 'tokkenly') as Destination['rail']
  const to = r.query.get('to') ?? ''
  if (rail === 'bank') {
    const own = state.banks.find((b) => b.id === to)
    if (own) return { rail, name: own.name, bankId: own.id, bank: own.name, number: own.number }
    return { rail, name: to, bank: r.query.get('bank') ?? '', number: r.query.get('acct') ?? '' }
  }
  return { rail, name: to }
}

const num = (r: Route, k: string, d = 0): number => Number(r.query.get(k) ?? d) || d

/** Which balance a dialog was opened against, read off its own address so a
 *  refresh cannot quietly move the payment onto a different one. */
const assetFrom = (r: Route): Asset => {
  const a = r.query.get('a') as Asset | null
  return a && DOLLARS.includes(a) ? a : payAsset()
}
const str = (r: Route, k: string, d = ''): string => r.query.get(k) ?? d

/** A review sheet: what is about to happen, in four rows, then one button
 *  that names the action and the amount. design.md 11b.4e. */
function review(opts: {
  title: string
  figureLabel: string
  figureValue: string
  rows: [string, string][]
  note: string
  action: string
  onConfirm: () => void
  /** What is leaving, so the "ask again above" preference can decide whether
   *  this needs a deliberate second step. Omit for anything that is not a
   *  payment out. */
  amount?: number
  /** A reason this particular confirmation must not go through, asked at the
   *  moment the button is pressed. `settlement` reads the cents of the dollar
   *  figure, which works everywhere the person typed dollars; a bill is typed
   *  in naira and its dollars are an artefact of the rate, so it brings its
   *  own refusal. Returning a string refuses in place and writes nothing. */
  refuseWith?: () => string | undefined
  /** A rate this sheet is honouring, for the two flows that change currency.
   *  The rows, the button and what confirming does are all functions of it,
   *  because all three change when the quote does. When present, the plain
   *  `rows`, `action` and `onConfirm` above are not used. */
  hold?: {
    rows: (q: Quote) => [string, string][]
    action: (q: Quote) => string
    onConfirm: (q: Quote) => void
  }
}): HTMLElement {
  // The quote this sheet is honouring, if it is honouring one. Held in a
  // variable rather than read fresh, because that is the difference between a
  // rate that is held and a rate that merely says it is.
  // Null until the rate has been fetched. A quote is asked for, not assumed.
  let quote: Quote | null = null
  const rowsNow = (): [string, string][] =>
    opts.hold && quote ? opts.hold.rows(quote) : opts.rows
  const actionNow = (): string =>
    opts.hold && quote ? opts.hold.action(quote) : opts.action
  const confirmNow = (): void => {
    if (opts.hold && quote) opts.hold.onConfirm(quote)
    else opts.onConfirm()
  }

  // Why this confirmation cannot go through, if it cannot. Sits under the
  // button and takes its place in the flow, rather than arriving as a toast
  // that has gone by the time you look up.
  const refusal = h('div', { class: 'hold expired', hidden: true })
  const refuse = (why: string) => {
    show(refusal, true)
    swap(refusal, h('span', { html: icon.alert() }), h('span', { text: why }))
  }

  const button = h('button', { class: 'btn btn-primary', text: actionNow() })
  button.addEventListener('click', () => {
    if (button.classList.contains('is-busy') || button.hasAttribute('disabled')) return
    // Nothing may move while there is no connection. Every one of these
    // confirmations writes to a local ledger and reports success, which on a
    // dropped signal is the worst thing a money app can do: tell somebody a
    // payment landed when nothing left the building.
    if (!state.online) {
      refuse('No connection, so nothing was sent. Try again when you are back online.')
      return
    }
    // The other side can say no, and when it does nothing is written: the
    // ledger is not touched, the sheet stays where it is, and the reason is on
    // screen rather than in a toast that has gone by the time you look up.
    const own = opts.refuseWith?.()
    if (own) {
      refuse(own)
      return
    }
    if (settlement(opts.amount ?? 0) === 'declined') {
      refuse('Your bank said no. Nothing left your account. Check with them, or try less.')
      return
    }
    // A quote that ran out between the sheet opening and the button being
    // pressed must not be spent. The countdown below normally takes the button
    // away first; this is the floor under it.
    if (quote && !quoteLive(quote)) return
    refusal.hidden = true
    // Money takes a moment to move. The button says so, rather than pretending
    // the ledger changed the instant it was pressed. Figma Button State=Loading.
    button.classList.add('is-busy')
    setTimeout(confirmNow, CONFIRM_MS)
  })

  // The preference is "ask for your PIN above X". It was a tickbox, which is
  // a thing a thumb learns to hit without reading — and a tickbox proves
  // nothing about who is holding the phone. Four digits do. Above the figure
  // the button is replaced by the pad, so there is no button left to press
  // out of habit.
  const limit = state.prefs.confirmOver
  const big = limit > 0 && (opts.amount ?? 0) > limit

  /** The four digits that stand in front of a large movement, as a block that
   *  replaces itself with the button once they are right. A function rather
   *  than a value because a held-rate sheet builds a fresh one per quote. */
  function pinGate(): HTMLElement {
    const gate = h('div', { class: 'stack-8 pin-gate' })
    const ask = (error?: string) => {
      if (actions.pinLocked()) {
        swap(gate,
          h('span', { class: 't-caps subtle', text: 'Locked' }),
          h('span', { class: 'field-error', role: 'status',
            text: 'Five wrong tries. Set a new PIN from Account before moving this much.' }),
          h('button', { class: 'btn btn-secondary', text: 'Go to Security',
            on: { click: () => { closeSheet(); go('/account/security') } } }))
        return
      }
      const pad = pinPad({
        hint: `Over your ${usd(limit, false)} check, so this one needs your PIN.`,
        onFull: (v) => {
          if (!actions.checkPin(v)) {
            ask(actions.pinLocked()
              ? 'Locked'
              : 'Wrong PIN. ' + (5 - state.security.wrongPin) + ' tries left.')
            return
          }
          // Correct: the pad gives way to the button that names the amount, so
          // what is about to happen is still on screen when it happens.
          swap(gate, button)
          button.focus()
        },
      })
      swap(gate,
        h('span', { class: 't-caps subtle', text: 'Authorise with your PIN' }),
        pad.el)
      if (error) pad.reject(error)
    }
    ask()
    return gate
  }

  /* ---- a rate that is actually held ---------------------------------- */
  if (opts.hold) {
    const rows = h('div')
    const clock = h('div', { class: 'hold' })
    const foot = h('div', { class: 'stack-12' })
    const el = sheet(
      opts.title,
      figure(opts.figureLabel, opts.figureValue),
      rows, clock, refusal, foot)

    let timer = 0

    /** Asking. The rows are a skeleton rather than an empty panel, because the
     *  shape of the answer arriving is the difference between a slow screen and
     *  a broken one — and this was the component the product had written and
     *  never once called. */
    const ask = (): void => {
      clearInterval(timer)
      quote = null
      refusal.hidden = true
      swap(rows, skeletonList(3))
      clock.className = 'hold'
      clock.replaceChildren(h('span', { html: icon.info() }),
        h('span', { text: 'Getting you a rate.' }))
      swap(foot)
      requestQuote().then((q) => { quote = q; draw() }).catch(fail)
    }

    /** It did not arrive. Says which of the two reasons it was, and offers the
     *  only thing that helps. Nothing has moved: the confirm button does not
     *  exist in this state, so there is nothing to press by mistake. */
    const fail = (): void => {
      clearInterval(timer)
      // The skeleton goes with the attempt. Leaving it under an error message
      // says "still loading" and "it failed" at the same time.
      swap(rows)
      clock.className = 'hold expired'
      clock.replaceChildren(h('span', { html: icon.alert() }),
        h('span', { text: state.online
          ? 'Could not get a rate just now. Nothing has been sent.'
          : 'No connection, so there is no rate to hold. Nothing has been sent.' }))
      swap(foot, h('button', {
        class: 'btn btn-secondary', text: 'Try again', on: { click: ask },
      }))
    }

    const draw = (): void => {
      swap(rows, panel(...rowsNow()))
      button.textContent = actionNow()
      // A held rate does not exempt a large withdrawal from the PIN. The gate
      // is rebuilt with each quote, so a rate taken and left to expire cannot
      // leave an already-authorised button sitting there for the next one.
      swap(foot, big ? pinGate() : button)
      clock.classList.remove('expired')
      tick()
      clearInterval(timer)
      timer = setInterval(tick, 1000) as unknown as number
    }
    let mounted = false
    function tick(): void {
      // The sheet can be closed while the clock is running, and an interval
      // that outlives what it was counting for is a leak with a timer on it.
      // The check waits for the first mount: the opening call happens while
      // the sheet is still being assembled and is not in the document yet, and
      // bailing there left the clock blank for its first second.
      if (mounted && !el.isConnected) { clearInterval(timer); return }
      if (el.isConnected) mounted = true
      const left = quote ? quote.until - Date.now() : 0
      if (left > 0) {
        const s = Math.ceil(left / 1000)
        clock.replaceChildren(
          h('span', { html: icon.info() }),
          h('span', { text: `This rate is held for ${s} more second${s === 1 ? '' : 's'}.` }))
        return
      }
      clearInterval(timer)
      clock.classList.add('expired')
      clock.replaceChildren(
        h('span', { html: icon.alert() }),
        h('span', { text: 'That rate has run out. Take a new one to carry on.' }))
      // The button goes rather than greying: a dead control you can still
      // press is how a stale rate gets spent.
      swap(foot, h('button', {
        class: 'btn btn-primary', text: 'Get a new rate', on: { click: ask },
      }))
    }
    ask()
    return el
  }

  // A button that looks ready and refuses on press is a button that made
  // somebody commit to something the product had already decided against.
  // Whether there is a connection is known before the sheet is drawn, so it is
  // said here and the control that cannot work is not drawn at all. The check
  // on the button stays as the floor under this. (The held-rate path above
  // reaches the same place by its own route: the quote request rejects while
  // offline and `fail` leaves no confirm button either.)
  if (!state.online) {
    refuse('No connection, so this cannot be sent. Nothing has left your wallet. Try again when you are back online.')
    return sheet(
      opts.title,
      figure(opts.figureLabel, opts.figureValue),
      panel(...opts.rows),
      calloutEl(opts.note),
      refusal,
      h('button', { class: 'btn btn-secondary', text: 'Back', on: { click: closeSheet } }))
  }

  if (!big) {
    return sheet(
      opts.title,
      figure(opts.figureLabel, opts.figureValue),
      panel(...opts.rows),
      calloutEl(opts.note),
      refusal,
      button)
  }

  return sheet(
    opts.title,
    figure(opts.figureLabel, opts.figureValue),
    panel(...opts.rows),
    calloutEl(opts.note),
    refusal,
    pinGate()
  )
}

/** The end of a flow. It used to assert success on every one of them; a
 *  movement that has not come back confirmed says so instead, and says what
 *  that means, because "we do not know yet" is a state a person can act on and
 *  a false "Sent" is not. */
function done(
  title: string,
  line: string,
  a: Activity,
  extra: [string, string][] = []
): HTMLElement {
  if (!a.settled) {
    return outcome(
      'Still settling',
      'We have not had confirmation yet. It may still land. Nothing has been sent twice.',
      [['Reference', a.ref], ['When', longWhen(a.at)], ...extra],
      { label: 'Done', onClick: closeSheet },
      // In place. Opening a receipt used to close this sheet, navigate to
      // Activity and open it there — so asking "what exactly happened" moved
      // you off the screen you were on to answer it. The record is a dialog;
      // it belongs over whatever you are looking at.
      { label: 'See the record', onClick: () => replaceSheet('receipt', { ref: a.ref }) },
      // Nothing to celebrate: this one did not come back confirmed.
      { celebrate: false })
  }
  return outcome(
    title,
    line,
    [['Reference', a.ref], ['When', longWhen(a.at)], ...extra],
    { label: 'Done', onClick: closeSheet },
    { label: 'See the record', onClick: () => replaceSheet('receipt', { ref: a.ref }) }
  )
}

/** The trade that must not happen, as a dialog.
 *
 *  Every reason at once, not the first one: a trade can be refused because the
 *  reference is stale *and* the order is too big for the book, and telling
 *  somebody about one of those sends them off to fix half a problem. There is
 *  no confirm button in this sheet — not a disabled one, none — because the
 *  safest version of a control you must not press is a control that is not
 *  there.
 *
 *  It is also where the product says what it checked. A refusal that does not
 *  show its working reads as the app being broken; one that names the venue
 *  price, the independent price and the ceiling between them reads as the
 *  product doing its job. */
function refused(c: Instrument, v: number, kind: 'buy' | 'sell' = 'buy'): HTMLElement | null {
  const bad = refusals(c, v, { trading: !switchOn(kind), asset: !assetOn(c.ticker) })
  if (!bad.length) return null
  return sheet('Not this one',
    figure('We are not taking this trade', bad.length + (bad.length === 1 ? ' reason' : ' reasons'), 'warn'),
    ...bad.map((b) => calloutEl(b.title + '. ' + b.why, 'warning')),
    panel(
      ['Price here', usd(c.price)],
      ['The real price', usd(c.mark)],
      ['Apart by', pct(Math.abs(deviation(c)), 2)],
      ['Ceiling', pct(GUARDS.deviationPct, 1)],
      ['Impact', pct(priceImpact(c, v), 2)],
      ['Ceiling', pct(GUARDS.impactPct, 1)],
    ),
    h('span', { class: 'muted t-caption',
      text: 'Nothing has been sent and nothing has left your wallet. These checks run again every time you open a trade.' }),
    h('button', { class: 'btn btn-secondary', text: 'Back', on: { click: closeSheet } }))
}

/** The same, for a basket. `payBucket` is a loop over `buy`, so a bucket has
 *  to be refused for every reason a single trade is refused — and it was not
 *  refused for any of them: a company the composer would not sell you could be
 *  put in a bucket and paid for at the till without one check running.
 *
 *  This is the floor. Nothing outside the launch set can go in a bucket now,
 *  and the bucket screen will not open a review while anything in it is
 *  refused, but a bucket is saved between visits and the catalogue is not. As
 *  with `refused` above there is no confirm button in this sheet, not even a
 *  disabled one. */
function bucketRefused(): HTMLElement | null {
  const bad = bucketRefusals()
  if (!bad.length) return null
  const names = bad.map((x) => x.c?.name ?? x.item.ticker)
  const one = bad.length === 1
  return sheet('Not this basket',
    figure('We are not taking this payment',
      bad.length + (one ? ' company' : ' companies') + ' in the way', 'warn'),
    ...bad.flatMap((x) => x.bad.map((r) =>
      calloutEl(`${x.c?.name ?? x.item.ticker}: ${r.title}. ${r.why}`, 'warning'))),
    h('span', { class: 'muted t-caption',
      text: `Nothing has been sent and nothing has left your wallet. Take ${one ? 'it' : 'them'} out and the rest can still be paid for together, in one payment.` }),
    h('button', { class: 'btn btn-primary',
      text: one ? 'Take out ' + names[0] : `Take out the ${bad.length} we cannot buy`,
      on: { click: () => {
        for (const x of bad) actions.removeFromBucket(x.item.ticker)
        closeSheet()
        go('/bucket')
      } } }),
    h('button', { class: 'btn btn-secondary', text: 'Back', on: { click: closeSheet } }))
}

/* ---------------- registry ---------------- */

type Builder = (r: Route) => HTMLElement

export const SHEETS: Record<string, Builder> = {
  /** The three ways to send, and the three ways money comes in, on a phone.
   *  They were pages: /send drew a title over three rows and nothing else, and
   *  picking one drew the same three rows again above the panel you had asked
   *  for. A question with three answers is a dialog, and this one is asked
   *  over the wallet, so closing it leaves you where you pressed the button
   *  rather than on a page with nothing under its title. */
  'send-ways': () => sheet('Where is it going?', sendWays()),
  'add-ways': () => sheet('How are you adding it?', addWays()),

  /** The rest of the rail. Four places are tabs; these five are behind More. */
  /** Jump to anything: a place, an action, a person you pay, something you
   *  hold, or a reference off a receipt. Typing filters live; the list is
   *  keyboard first, because that is the point of it. */
  jump: () => {
    const input = h('input', { placeholder: 'Search Tokkenly', ariaLabel: 'Search Tokkenly' })
    const list = h('div', { class: 'jump-list' })
    let hits = search('')
    let cursor = 0

    const paint = () => {
      list.replaceChildren()
      if (!hits.length) {
        list.appendChild(emptyStateEl('Nothing by that name',
          'Try a place, a person, a company or a reference.'))
        return
      }
      let group = ''
      hits.forEach((hit, i) => {
        if (hit.group !== group) {
          group = hit.group
          list.appendChild(h('div', { class: 'jump-group', text: group }))
        }
        list.appendChild(h('button', {
          class: 'jump-hit', dataset: { on: i === cursor ? '1' : '0' },
          on: { click: () => { closeSheet(); go(hit.to) },
                mouseenter: () => { cursor = i; mark() } },
        },
          h('span', { class: 'two-line grow' },
            h('span', { class: 't-body-strong', text: hit.label }),
            hit.hint ? h('small', { text: hit.hint }) : null),
          h('span', { class: 'muted', html: icon.chevron() })))
      })
    }
    const mark = () => {
      const rows = list.querySelectorAll('.jump-hit')
      rows.forEach((r, i) => r.setAttribute('data-on', i === cursor ? '1' : '0'))
      rows[cursor]?.scrollIntoView({ block: 'nearest' })
    }
    input.addEventListener('input', () => {
      hits = search(input.value); cursor = 0; paint()
    })
    input.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key
      if (k === 'ArrowDown') { e.preventDefault(); cursor = Math.min(cursor + 1, hits.length - 1); mark() }
      else if (k === 'ArrowUp') { e.preventDefault(); cursor = Math.max(cursor - 1, 0); mark() }
      else if (k === 'Enter' && hits[cursor]) { e.preventDefault(); const to = hits[cursor].to; closeSheet(); go(to) }
    })
    paint()
    setTimeout(() => input.focus(), 0)

    const panel = sheet('',
      h('div', { class: 'jump-field' }, h('span', { html: icon.search() }), input,
        h('span', { class: 'kbd', text: 'Esc' })),
      list,
      h('div', { class: 'jump-foot' },
        h('span', { text: '\u2191\u2193 to move' }),
        h('span', { text: '\u21b5 to open' })))
    // no title row on this one; the field is the title
    panel.querySelector('.sheet-head')?.remove()
    panel.querySelector('.sheet')?.classList.add('jump')
    panel.classList.add('scrim-top')     // a palette sits high, not centred
    return panel
  },

  /** Putting away one of Home's standing reminders.
   *
   *  It asks, because one of the two is what lifts an account's limits and a
   *  stray tap on a close button is not a decision about that. And it says
   *  where the thing still lives, so putting the reminder away is understood
   *  as hiding a reminder rather than as cancelling the thing it reminds you
   *  of — which is the mistake this dialog exists to prevent. */
  'put-away': (r) => {
    const id = str(r, 'task')
    const n = state.bucket.length
    const what = id === 'verify'
      ? {
          title: 'Put away the verification reminder?',
          body: 'Your account stays unverified, and the limits stay with it: ' +
            `${usd(LIMITS.none.single, false)} at once and ${usd(LIMITS.none.monthly, false)} a month. ` +
            'You can still verify from Account whenever you want.',
          rows: [['Where it still lives', 'Account · Verification']] as [string, string][],
        }
      : {
          title: 'Put away the bucket reminder?',
          body: `Nothing leaves your bucket. The ${n} ${n === 1 ? 'company stays' : 'companies stay'} in it, ` +
            'and it is still in the sidebar and on every Invest screen. This only stops Home mentioning it.',
          rows: [['Where it still lives', 'Your bucket']] as [string, string][],
        }
    return sheet(what.title,
      h('span', { class: 'muted', text: what.body }),
      panel(...what.rows),
      calloutEl('Both reminders come back from Preferences.'),
      h('button', { class: 'btn btn-primary', text: 'Keep it on Home', on: { click: closeSheet } }),
      h('button', {
        class: 'btn btn-secondary', text: 'Put it away',
        on: { click: () => { actions.putAwayTask(id); closeSheet() } },
      }))
  },

  /** Change who a payment goes to, without leaving the dialog. */
  'pick-who': () =>
    sheet('Who are you sending to?',
      h('div', { class: 'sheet-list' },
        ...peopleRows((who) => {
          closeSheet()
          go('/send/tokkenly?to=' + encodeURIComponent(who))
        })),
      calloutEl('Only people already in your list can be paid without a second check.')),

  more: () =>
    sheet('More',
      h('div', { class: 'sheet-list' },
        ...BEHIND_MORE.map((p) =>
          h('button', {
            class: 'sheet-row',
            on: { click: () => { closeSheet(); go(p.to) } },
          },
            h('span', { class: 'mark', html: p.ic() }),
            h('span', { class: 'two-line' },
              h('span', { class: 't-body-strong', text: p.label }),
              h('small', { text: p.sub })),
            h('span', { class: 'muted', html: icon.chevron() })))),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Coming' }),
        h('div', { class: 'chip-row' },
          h('button', { class: 'chip', text: 'Debit card', on: { click: () => replaceSheet('card') } }),
          h('span', { class: 'pill', text: 'Bills' }))),
      h('p', { class: 'muted t-caption', style: { margin: '0' },
        text: 'These are parts of Tokkenly that are not built yet.' })),

  /* ----- receipts and records ----- */
  receipt: (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))
    if (!a) return sheet('Receipt', h('p', { class: 'muted', text: 'That reference is not in your history.' }))
    const inbound = a.amount >= 0
    // A trade's receipt is about a company, so it says which one, what it is
    // worth now, what shape it has been in, and what you hold of it. The old
    // one said "Apple, −$420.00" and stopped, which is the one document a
    // person keeps being the least informative screen in the product.
    // Which company this was about. A buy or a sell names it in `who`; a share
    // handed to another person names the person there and the company on the
    // asset, and a receipt that only says "−$224.10 to Tunde" is a receipt for
    // the wrong event.
    const c = a.asset
      ? CATALOGUE.find((x) => x.ticker === a.asset!.ticker)
      : a.kind === 'trade' ? CATALOGUE.find((x) => x.name === a.who) : undefined
    const held = c ? holding(c.ticker) : undefined
    const fx = ledger.conversion(a.ref)
    return sheet(
      'Receipt',
      figure(a.type, (inbound ? '+' : '−') + usd(Math.abs(a.amount)),
        inbound && !isDrawdown(a) ? 'pos' : '',
        a.settled
          ? a.asset
            // Not "this payment": no money moved. What moved was the share,
            // and the one thing worth saying about a share that has gone is
            // that it is gone.
            ? `Settled · ${a.who} holds these now, and they cannot be recalled`
            : 'Settled · nothing about this is going to change now'
          : fx && !inbound
            // A payout in flight is not "settling", it is at a named stage,
            // and saying which one is the difference between a person waiting
            // calmly and a person ringing support.
            ? 'Dollars out, naira on the way · the bank has not confirmed it yet'
            : settlement(a.amount) === 'pending'
              ? 'Still settling · we have not seen it yet, and nothing has been taken twice'
              : 'Still settling · it usually clears within a minute'),
      c ? h('div', { class: 'receipt-co' },
        h('span', { class: 'two-line grow' },
          h('span', { class: 't-body-strong', text: `${c.ticker} · ${c.name}` }),
          h('small', { text: c.kind === 'etf' ? `A fund of ${c.holds ?? 'many'} companies` : c.plain })),
        h('span', { class: 'two-line right' },
          h('span', { class: 't-body-strong', text: usd(c.price) }),
          h('small', { class: c.dayPct >= 0 ? 'pos' : 'warn',
            text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) + ' today' }))) : null,
      c ? sparkline(YEAR, c.price, c.ticker.charCodeAt(0)) : null,
      // Four facts, then the rest behind a press. What stays is what somebody
      // opens a receipt to check: who it was with, what they got, what it came
      // to, and the reference they are matching against a statement. What
      // folds is the arithmetic behind the total and the state of the holding
      // afterwards. The order here is the order of importance, because that is
      // what decides which four are above the fold.
      foldPanel(4, [
        // A bill's subject is the number or the meter, not the network that
        // took the money — and on a prepaid meter the twenty digits are the
        // whole reason the record is kept, so they are above the fold and the
        // supplier, which the figure above and the feed row both already name,
        // goes into it.
        ...(a.bill
          ? [[a.type === 'Electricity' ? 'Meter' : 'Number', a.bill.target] as [string, string],
             ...(a.bill.token ? [['Token', a.bill.token] as [string, string]] : [])]
          : [[inbound ? 'From' : 'To', a.who] as [string, string]]),
        // Money that changed currency states both figures. Read off the
        // ledger's paired postings rather than multiplied out here, so a
        // record written a fortnight ago at ₦1,494 does not reprint itself at
        // this morning's rate.
        ...(fx
          ? [[inbound ? 'You paid' : 'They got', naira(fx.naira)] as [string, string]]
          : []),
        // A transfer states what left, at the price of the day it left at. The
        // shares are recorded rather than divided out of the amount, because a
        // price that has moved since would silently restate the quantity.
        ...(a.asset
          ? [['Shares', fmtShares(a.asset.shares) + ' ' + a.asset.ticker] as [string, string]]
          : c ? [['Shares', fmtShares(grossOf(a) / c.price)] as [string, string]] : []),
        // The total is the headline of a record; the amount and the fee that
        // add up to it are the detail, and they were both stated before the
        // button was pressed.
        ...(c ? [[a.type === 'Sold' ? 'You received' : a.asset ? 'Worth then' : 'Total',
          usd(Math.abs(a.amount))] as [string, string]] : []),
        ['Reference', a.ref],

        /* ----- folded ----- */
        ...(a.bill
          ? [[a.type === 'Electricity' ? 'Supplier' : 'Network', a.who] as [string, string]]
          : []),
        // Which balance moved, and on what. Folded rather than above the line:
        // it is the answer to "why does my USDT not add up" and to nothing
        // else, which is exactly the kind of fact the fold is for.
        ...(a.purse ? [['Paid with', assetOf(a.purse)!.name] as [string, string]] : []),
        ...(a.net ? [['Network', netOf(a.net)!.name] as [string, string]] : []),
        ...(a.asset ? [['Price each', usd(a.asset.price)] as [string, string]]
          : c ? [
            [a.type === 'Sold' ? 'Sale' : 'Investment', usd(grossOf(a))] as [string, string],
            ['Price each', usd(c.price)] as [string, string],
          ] : []),
        ['When', longWhen(a.at)],
        ...(fx ? [['Rate', '1 dollar = ' + naira(fx.rate)] as [string, string]] : []),
        // The receipt used to say "None" on every entry, including the trades
        // that charged half a per cent — the one document a person keeps,
        // stating the wrong figure for the one thing it is kept for. The fee
        // is recorded on the movement now, so this reads it rather than
        // asserting it.
        ['Fee', a.fee ? usd(a.fee) : 'None'],
        // The two facts that only matter when something has gone wrong, which
        // is exactly what the fold is for.
        ['Support reference', supportRef(a)],
        ...(onChain(a)
          ? [['On Base', txHash(a.ref).slice(0, 8) + '…' + txHash(a.ref).slice(-6)] as [string, string]]
          : []),
        ...(c && held ? [['You hold now',
          `${fmtShares(held.shares)} shares · ${usd(held.shares * c.price)}`] as [string, string]] : []),
      ]),
      // The proof, for the movements that have one. A product that settles on
      // a public chain can be checked by somebody who does not trust it, and
      // hiding that throws away the best argument it has. A naira payout has
      // no hash and gets no link, because a link to nothing is worse than none.
      // The proof, beside the copy rather than under it. A record that grows a
      // section per fact stops fitting on a phone, and this one is measured
      // against the same ceiling as every other dialog in the product — so the
      // explorer shares the row the download was using alone, and the support
      // reference goes into the fold with the rest of the detail you only want
      // when something has gone wrong.
      h('div', { class: 'receipt-on' },
        h('button', {
          class: 'btn btn-primary', text: 'Download',
          on: { click: () => toast('Receipt saved as ' + a.ref + '.pdf') },
        }),
        onChain(a)
          ? h('button', {
              class: 'btn btn-secondary', title: 'Open this transaction on Basescan',
              on: { click: () => toast('Opening Basescan') },
            },
              h('span', { text: 'On Basescan' }),
              h('span', { class: 'muted', html: icon.external() }))
          : null),
      // The ways on. A receipt is where somebody has just answered "what did I
      // buy"; the next two questions are "how is it doing" and "what do I hold
      // altogether", and both were a dismissal and a hunt away.
      h('div', { class: 'receipt-on' },
        c ? h('button', { class: 'btn btn-secondary', text: 'See ' + c.name,
          on: { click: () => { closeSheet(); go(pathOf(c)) } } }) : null,
        h('button', { class: 'btn btn-secondary', text: 'Your portfolio',
          on: { click: () => { closeSheet(); go('/') } } }))
    )
  },

  export: () =>
    sheet('Export your history',
      panel(
        ['Rows', String(state.activity.length)],
        ['Format', 'CSV, one row per entry'],
        ['Covers', 'Payments, trades, borrowing and lending'],
        ['Sent to', state.person.email]
      ),
      calloutEl('The file lists every reference, so it reconciles against your bank.'),
      h('button', {
        class: 'btn btn-primary', text: 'Email me the file',
        on: { click: () => { toast('On its way to ' + state.person.email); closeSheet() } },
      })),

  answer: (r) => {
    const q = str(r, 'q')
    const found = QA.find(([question]) => question === q)
    return sheet(q || 'Answer',
      h('p', { class: 'muted', style: { margin: '0' }, text: found ? found[1] + '.' : 'No answer for that yet.' }),
      h('button', { class: 'btn btn-secondary', text: 'Still stuck, email us', on: { click: () => replaceSheet('contact') } }))
  },

  contact: () =>
    sheet('Email us',
      panel(
        ['Address', state.person.email],
        ['Reply time', 'Within one working day'],
        ['Hours', 'Monday to Friday, 9 to 6 Lagos time'],
        ['Urgent', 'Sign out everywhere first, then write']
      ),
      calloutEl('Tell us the reference of anything you are asking about and it will be answered faster.'),
      h('button', {
        class: 'btn btn-primary', text: 'Open my email app',
        on: { click: () => { toast('Opening a draft to ' + state.person.email); closeSheet() } },
      })),

  /* ----- account ----- */
  card: () =>
    sheet('Join the list',
      figure('The Tokkenly card', 'Coming soon'),
      panel(
        ['What it is', 'A naira card, funded by your dollars'],
        ['Where it works', 'Anywhere in Nigeria that takes a card'],
        ['What it costs', 'Nothing to join the list'],
        ['We will email', state.person.email]
      ),
      calloutEl('We will only write to you about the card, once, when it is ready.'),
      state.cardWaitlist
        ? h('button', { class: 'btn btn-secondary', text: 'You are on the list', on: { click: closeSheet } })
        : h('button', {
            class: 'btn btn-primary', text: 'Add me to the list',
            on: { click: () => { actions.joinCardWaitlist(); toast('You are on the list'); closeSheet() } },
          })),

  edit: (r) => {
    const field = str(r, 'field', 'email') as 'email' | 'phone' | 'address'
    const label = { email: 'email', phone: 'mobile number', address: 'home address' }[field]
    const input = h('input', { placeholder: 'Type your new ' + label, value: '' })
    const confirm = h('input', { placeholder: 'Type it a second time', value: '' })
    return sheet('Change your ' + label,
      h('p', { class: 'muted', style: { margin: '0' },
        text: field === 'email'
          ? 'We will send a six digit code to the new address. The one you have now keeps working until you type that code in.'
          : 'We check the new details before anything moves.' }),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'New ' + label }),
        h('label', { class: 'field' }, input)),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Type it again' }),
        h('label', { class: 'field' }, confirm)),
      calloutEl('We will never email you asking for your PIN or your recovery phrase.'),
      h('button', {
        class: 'btn btn-primary', text: 'Save the change',
        on: {
          click: () => {
            const v = input.value.trim()
            if (!v) { toast('Type the new ' + label + ' first'); return }
            if (v !== confirm.value.trim()) { toast('The two do not match'); return }
            actions.updatePerson(field, v)
            toast('Your ' + label + ' has been updated')
            closeSheet()
          },
        },
      }))
  },

  /** Three steps on one pad, not three password fields. A PIN is four digits
   *  and a keypad is how four digits are typed; a text input with dots in it
   *  is a form pretending to be a lock.
   *
   *  The weak-PIN check fires the moment the fourth digit lands, not on save.
   *  Being told at the end that the number you just confirmed twice was never
   *  allowed is the version people abandon. */
  pin: () => {
    const wrap = h('div', { class: 'stack' })
    let chosen = ''

    const step = (
      title: string, hint: string,
      onFull: (pin: string, pad: ReturnType<typeof pinPad>) => void,
      error?: string,
    ) => {
      const pad = pinPad({ hint, onFull: (v) => onFull(v, pad) })
      swap(wrap,
        h('span', { class: 't-caps subtle', text: title }),
        pad.el)
      if (error) pad.reject(error)
    }

    const askAgain = () => step('Type it again', 'The same four digits once more',
      (v) => {
        if (v !== chosen) {
          // Back to choosing, not to confirming again. Two entries disagreed
          // and there is no way to know which one was the slip — so the one
          // that gets retyped is the one that decides the PIN.
          askNew('Those did not match. Pick your new PIN again.')
          return
        }
        actions.setPin(chosen)
        toast('Your PIN has been changed')
        closeSheet()
      })

    const askNew = (error?: string) => step('Your new PIN', 'Four digits you will remember',
      (v, pad) => {
        const why = weakPin(v, state.person.dob)
        if (why) { pad.reject(why); return }
        if (v === state.security.pin) {
          pad.reject('That is the PIN you already have.')
          return
        }
        chosen = v
        askAgain()
      }, error)

    step('The PIN you use now', 'So we know it is you',
      (v, pad) => {
        if (actions.checkPin(v)) { askNew(); return }
        pad.reject(actions.pinLocked()
          ? 'Too many tries. Use your recovery phrase to set a new one.'
          : 'That is not your PIN. ' + (5 - state.security.wrongPin) + ' tries left.')
      })

    return sheet('Change your PIN',
      wrap,
      calloutEl('If you forget your PIN you will need your recovery phrase to get back in.'))
  },

  /** Length over composition. A rule demanding a capital and a symbol reliably
   *  produces Password1!, which is eleven characters of nothing; length is
   *  what actually costs an attacker time. So the readout is a sentence about
   *  what would make this one better, not a coloured bar with a word on it. */
  password: () => {
    const cur = h('input', { type: 'password', placeholder: 'The one you use now' })
    const next = h('input', { type: 'password', placeholder: 'Ten characters or more' })
    const note = h('span', { class: 'muted t-caption pw-note', text: 'Ten characters at least. Length beats punctuation.' })
    const save = h('button', { class: 'btn btn-primary', text: 'Save the password', disabled: true })

    const eye = (input: HTMLInputElement) => h('button', {
      class: 'link quiet pw-eye', text: 'Show', ariaLabel: 'Show the password',
      on: {
        click: (e) => {
          e.preventDefault()
          const btn = e.currentTarget as HTMLButtonElement
          const hidden = input.getAttribute('type') === 'password'
          input.setAttribute('type', hidden ? 'text' : 'password')
          btn.textContent = hidden ? 'Hide' : 'Show'
          btn.setAttribute('aria-label', (hidden ? 'Hide' : 'Show') + ' the password')
        },
      },
    })

    const grade = () => {
      const v = next.value
      const r = ratePassword(v, state.person.name)
      note.textContent = v ? r.text : 'Ten characters at least. Length beats punctuation.'
      note.className = 'muted t-caption pw-note' + (v && !r.ok ? ' bad' : v && r.ok ? ' good' : '')
      if (r.ok && v) save.removeAttribute('disabled')
      else save.setAttribute('disabled', 'true')
    }
    next.addEventListener('input', grade)

    save.addEventListener('click', () => {
      if (cur.value !== state.security.password) {
        toast('That is not your current password')
        cur.focus()
        return
      }
      actions.setPassword(next.value)
      toast('Your password has been changed')
      closeSheet()
    })

    return sheet('Change your password',
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'The password you use now' }),
        h('label', { class: 'field' }, cur, eye(cur))),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Your new password' }),
        h('label', { class: 'field' }, next, eye(next)),
        note),
      calloutEl('Your other devices will ask for the new one next time they open the app.'),
      save)
  },

  /** The half of the password loop people actually hit. Two states, because
   *  a form that vanishes on submit leaves you wondering whether it worked.
   *
   *  It says the code was sent whether or not the address is one we know.
   *  Telling a stranger "no account with that email" tells them which of the
   *  addresses they are trying is real. */
  forgot: (r) => {
    if (str(r, 'sent') === '1') {
      return outcome(
        'A link is on its way',
        `If ${state.person.email} has an account, a link to set a new password is in it now.`,
        [['It works once', 'and expires in an hour'],
         ['Nothing arrived?', 'Look in spam, then try again'],
         ['Wrong address?', 'Use the one you signed up with']],
        { label: 'Back to sign in', onClick: () => closeSheet() })
    }
    const email = h('input', { type: 'email', placeholder: 'The email you signed up with',
      value: state.person.email })
    return sheet('Set a new password',
      h('p', { class: 'muted', style: { margin: '0' },
        text: 'We will email you a link. It works once, and it expires in an hour.' }),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Email' }),
        h('label', { class: 'field' }, email)),
      calloutEl('We will never email you asking for your PIN or your recovery phrase. If a message does, it is not from us.'),
      h('button', {
        class: 'btn btn-primary', text: 'Email me a link',
        on: {
          click: () => {
            if (!email.value.includes('@')) { toast('That does not look like an email'); return }
            replaceSheet('forgot', { sent: '1' })
          },
        },
      }))
  },

  phrase: () =>
    sheet('Your recovery phrase',
      figure('Twelve words', 'Hidden'),
      panel(
        ['Where to keep it', 'On paper, somewhere only you can reach'],
        ['Never', 'A photo, a note app, or a message'],
        ['If somebody asks', 'They are stealing from you. Nobody here will ask'],
        ['Written down', '12 August 2026']
      ),
      calloutEl('Anyone with these twelve words can move your money. We cannot stop them and we cannot get it back.', 'warning'),
      h('button', { class: 'btn btn-primary', text: 'Show the words', on: { click: () => replaceSheet('phrase-shown') } })),

  'phrase-shown': () => {
    const words = ['ridge', 'olive', 'cargo', 'siren', 'palm', 'unfold', 'quilt', 'rocket', 'dolphin', 'marble', 'tenant', 'glide']
    const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' } })
    words.forEach((w, i) =>
      grid.appendChild(h('div', { class: 'field', style: { height: '44px' } },
        h('span', { class: 'subtle t-caption', text: String(i + 1) }),
        h('span', { class: 't-body-strong', text: w }))))
    return sheet('Your recovery phrase',
      h('p', { class: 'muted', style: { margin: '0' },
        text: 'Write them on paper, in this order. Do not photograph this screen and do not type them anywhere.' }),
      grid,
      calloutEl('Anyone with these twelve words can move your money.', 'warning'),
      h('button', {
        class: 'btn btn-primary', text: 'I have written them down',
        on: { click: () => { actions.markPhraseWritten(); toast('Keep it somewhere safe'); closeSheet() } },
      }))
  },

  close: () =>
    sheet('Close your account',
      figure('This cannot be undone', 'Three things first'),
      panel(
        ['One', 'Take back the ' + usd(state.lent) + ' you have lent'],
        ['Two', 'Repay the ' + usd(owed()) + ' you owe'],
        ['Three', 'Move the rest of your money out'],
        ['Then', 'Email us and we close it within one working day']
      ),
      calloutEl('We keep your records for seven years because Nigerian law requires it. Nothing else is kept.', 'warning'),
      h('button', {
        // The commit point of the close-account flow. It was wearing the
        // primary button; the danger variant is what it has always been.
        class: 'btn btn-destructive', text: 'Email us to close it',
        on: { click: () => { toast('Opening a draft to ' + state.person.email); closeSheet() } },
      })),

  /** Adding money, in place. The three ways in are three tabs, and the tab is
   *  in the address, so this dialog and the page behind it are the same thing
   *  at two sizes rather than two things that have to be kept in step. */
  'add-money': () => sheet('Add money',
    ...addPanels(addTab(), false),
    h('button', { class: 'link quiet', text: 'Open the full page',
      on: { click: () => go('/addmoney/' + addTab()) } })),

  /** Everything the wallet's card stopped saying.
   *
   *  The card is a figure and a bar now, and a bar is a shape rather than a
   *  statement: it says the dollars are most of it without saying how much any
   *  of it is. This is where the sentence lives. Four rows — what each one is,
   *  where it travels, what it holds and what that is in the other currency —
   *  then the total with what is lent added back, then the rate the naira
   *  figures were struck at. No line about borrowing: there is no borrowing on
   *  this dialog, and a sentence explaining the absence of a thing is a
   *  sentence about nothing. The buying-power card on the wallet makes that
   *  point beside the figure it is actually about.
   *
   *  It is reached by pressing the card, which is the only path a phone, a
   *  keyboard or a screen reader has to it: hovering a band is a shortcut for
   *  a mouse and never the only way to a fact.
   *
   *  Rule 11g.54: it opens over the wallet rather than on a screen of its own,
   *  and it carries a door to the statement — which is the same four accounts
   *  with every posting that moved them. */
  balances: () => {
    const list = parts()
    const total = list.reduce((t, p) => t + p.value, 0)
    return sheet('What you hold',
      h('div', { class: 'sheet-list' },
        ...list.map((p) =>
          h('div', { class: 'sheet-row' },
            h('span', { class: 'dot ' + p.cls }),
            h('span', { class: 'two-line grow' },
              h('span', { class: 't-body-strong', text: partName(p.key) }),
              h('small', { text: partUnder(p) })),
            h('span', { class: 'two-line right' },
              h('span', { class: 't-body-strong', text: partFigure(p) }),
              h('small', { class: 'muted', text: partAlso(p) }))))),
      // The same anatomy as the rows above it, so it reads as their sum rather
      // than as a fifth thing they are among.
      h('div', { class: 'sheet-row' },
        h('span', { class: 't-body-strong grow', text: 'Including what you lent' }),
        h('span', { class: 't-title', text: money(total) })),
      h('span', { class: 'subtle t-caption', text: rateLine() }),
      h('button', { class: 'btn btn-quiet', text: 'See every account',
        on: { click: () => { closeSheet(); go('/statement') } } }))
  },

  banks: () => {
    const name = h('input', { placeholder: 'Bank name' })
    const acct = h('input', { placeholder: 'Account number' })
    return sheet('Your banks',
      h('div', { class: 'stack-12' },
        ...state.banks.map((b) =>
          h('div', { class: 'kv' },
            h('span', { class: 'who' },
              h('span', { class: 'mark', html: icon.wallet() }),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: b.name }),
                h('small', { text: '•••• ' + b.last4 + ' · ' + b.holder }))),
            h('span', { class: 'muted t-caption', text: state.kyc.status === 'verified' ? 'Verified' : 'Not verified' })))),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Add a bank' }),
        h('label', { class: 'field' }, name),
        h('label', { class: 'field' }, acct)),
      calloutEl('A bank account has to be in your own name. We check that before the first payout.'),
      h('button', {
        class: 'btn btn-primary', text: 'Add this bank',
        on: {
          click: () => {
            const n = name.value.trim()
            const a = acct.value.trim()
            if (!n || a.length < 4) { toast('Add a bank name and account number'); return }
            actions.addBank(n, a)
            toast(n + ' added')
            closeSheet()
          },
        },
      }))
  },

  /* ----- send -----
     One review for three destinations. The rows differ because the rails do:
     a payout into naira is a conversion and states a rate, the other two are
     dollars at both ends and state a network. */
  'send-review': (r) => {
    const v = num(r, 'v')
    const to = destFrom(r)
    // Which balance is leaving, and on what. Read off the address so the
    // dialog is rebuildable from it — a review that lost its asset on a
    // refresh would be a review of a different payment.
    const asset = (DOLLARS.includes(str(r, 'a') as Asset) || str(r, 'a') === 'ngn'
      ? str(r, 'a') : 'usdc') as Asset
    const net = netOf(str(r, 'net'))
    if (to.rail !== 'bank') {
      return review({
        title: 'Review',
        figureLabel: 'You are sending', figureValue: usd(v), amount: v,
        rows: [
          ['To', to.rail === 'chain' ? shortAddress(to.name) : to.name],
          ['Paying with', assetOf(asset)!.name],
          ...(net ? [['Network', net.name] as [string, string]] : []),
          ['They receive', usd(v)],
          ['Fee', net && net.fee ? usd(net.fee, false) + ' network fee' : 'No fee'],
          ['Arrives', net ? net.takes : 'In about a minute'],
        ],
        note: net
          // Not "we cannot check an address" any more: the network was checked
          // where it was typed. What is left uncheckable is who is on the
          // other end of it, and that is what this sentence should say.
          ? `${assetLine(asset, net.key)}. We cannot tell whose wallet this is — `
            + 'send a small amount first if you are not sure.'
          : 'Once sent, this cannot be taken back.',
        action: 'Send ' + usd(v),
        onConfirm: () => {
          const a = actions.sendMoney(to, v, state.ngnPerUsd, asset, net?.key)
          replaceSheet('send-done', { ref: a.ref })
        },
      })
    }
    // Naira out of naira is not a conversion, so there is no rate to hold and
    // no clock to run: the figure on the screen is the figure that leaves.
    if (asset === 'ngn') {
      const ngn = Math.round(v * state.ngnPerUsd)
      return review({
        title: 'Review',
        figureLabel: 'You are sending', figureValue: naira(ngn),
        amount: v,
        rows: [
          ['To', to.name],
          ['Account', (to.bank ?? '') + (to.number ? ' · ' + to.number : '')],
          ['Paying with', 'Your naira'],
          ['They get', naira(ngn)],
          ['Converted', 'Nothing'],
          ['Fee', 'No fee'],
        ],
        note: 'Naira out of naira, so there is no rate and nothing to hold.',
        action: 'Send ' + naira(ngn),
        onConfirm: () => {
          const a = actions.sendMoney(to, ngn, state.ngnPerUsd, 'ngn')
          replaceSheet('send-done', { ref: a.ref, rate: String(state.ngnPerUsd) })
        },
      })
    }
    return review({
      title: 'Review',
      figureLabel: 'You are sending', figureValue: usd(v), amount: v,
      rows: [], action: '', onConfirm: () => {},
      note: '',
      hold: {
        rows: (q) => [
          ['To', to.name],
          ['Account', (to.bank ?? '') + (to.number ? ' · ' + to.number : '')],
          ['Paying with', assetOf(asset)!.name],
          ['Rate', '1 dollar = ' + naira(q.rate)],
          ['Fee', 'No fee'],
          ['They get', naira(v * q.rate)],
        ],
        action: () => 'Send ' + usd(v),
        onConfirm: (q) => {
          const a = actions.sendMoney(to, v, q.rate, asset)
          replaceSheet('send-done', { ref: a.ref, rate: String(q.rate) })
        },
      },
    })
  },
  'send-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const rate = num(r, 'rate', 0)
    // A payout has two stages and this is the end of the first one, so the
    // sheet says so rather than saying "Sent". The dollars have gone; the
    // naira have not arrived. Both are true and only one of them is the good
    // news, and the outcome that claims the second is the one that gets a
    // person shouting at their landlord.
    if (rate) {
      if (!a.settled) {
        return outcome('On its way',
          `${usd(Math.abs(a.amount))} has left your wallet. ${naira(Math.abs(a.amount) * rate)} reaches ${a.who} when the bank confirms it.`,
          [['Stage', 'Dollars out'],
           ['Next', 'Naira into the account'],
           ['Rate', '1 dollar = ' + naira(rate)],
           ['Reference', a.ref]],
          { label: 'Done', onClick: closeSheet },
          { label: 'See the record', onClick: () => replaceSheet('receipt', { ref: a.ref }) },
          { celebrate: false })
      }
      return done('Paid', `${naira(Math.abs(a.amount) * rate)} reached ${a.who}.`, a,
                  [['Fee', 'None'], ['Rate', '1 dollar = ' + naira(rate)]])
    }
    return done('Sent', `${usd(Math.abs(a.amount))} is on its way to ${a.who}.`, a, [['Fee', 'None']])
  },

  /* ----- spend -----
     One review for three errands, because they are one movement: naira reach
     somebody who is not us, and the dollars they cost leave the wallet. What
     differs is the line under the figure, and that is the thing being bought.

     The refusal is on the naira, not the dollars. `settlement` reads the cents
     of the figure a person typed, which works everywhere they typed dollars;
     here they typed naira and the dollars are an artefact of the rate, so a
     refusal on the cents could never be reached deliberately and would fire at
     random on the ones that could. A naira figure ending in 99 is a network
     saying no, and it says so before anything is written. */
  'spend-review': (r) => {
    const b = billFrom(r.query)
    if (!b) {
      return sheet('Review', h('p', { class: 'muted',
        text: 'That is not something we can pay for. Go back and pick it again.' }))
    }
    const rate = state.ngnPerUsd
    const dollars = Math.round((b.naira / rate) * 100) / 100
    const fromNaira = b.asset === 'ngn'
    return review({
      title: 'Review',
      figureLabel: b.what, figureValue: naira(b.naira),
      // Not the naira: the ceiling and the PIN are about what leaves the
      // wallet, and what leaves the wallet is dollars — unless it is naira,
      // in which case the dollar figure is an equivalent and the PIN should
      // not be asked against a number nobody moved.
      amount: fromNaira ? 0 : dollars,
      rows: [
        [b.way === 'electricity' ? 'Meter' : 'Number', b.target],
        // The name off the register, restated at the commit. It is the reason
        // the check exists, and a review is the last screen before the money
        // cannot come back.
        ...(b.holder ? [['Registered to', b.holder] as [string, string]] : []),
        ...(b.note ? [['What you get', b.note] as [string, string]] : []),
        ...(b.kind
          ? [['Kind', b.kind === 'prepaid' ? 'Prepaid · a token' : 'Postpaid · off the bill'] as [string, string]]
          : []),
        [b.way === 'electricity' ? 'Supplier' : 'Network', b.who],
        ['Paying with', assetOf(b.asset)!.name],
        // Naira out of naira converts nothing, so there is no cost in another
        // currency and no rate. Printing one would be printing a number that
        // had no part in the payment.
        ...(fromNaira
          ? [['Converted', 'Nothing'] as [string, string]]
          : [['Costs you', usd(dollars)] as [string, string],
             ['Rate', '1 dollar = ' + naira(rate)] as [string, string]]),
        ['Fee', 'No fee'],
      ],
      note: b.way === 'electricity'
        ? 'Check the name on the meter. A payment to the wrong one cannot be recalled.'
        : 'Check the number. A top-up to the wrong one cannot be recalled.',
      action: 'Pay ' + naira(b.naira),
      refuseWith: () => billOutcome(b.naira) === 'declined'
        ? `${b.who} would not take that payment. Nothing left your wallet. Try again, or try a different amount.`
        : undefined,
      onConfirm: () => {
        const a = actions.payBill({
          what: b.what, who: b.who, naira: b.naira, target: b.target,
          // What the record says it was for. A bundle names itself; a meter
          // names the kind and whose it is, which is what a receipt reopened
          // in six months has to be able to say.
          note: b.note ?? (b.holder
            ? `${b.kind === 'prepaid' ? 'Prepaid' : 'Postpaid'} · ${b.holder}`
            : undefined),
          prepaid: b.kind === 'prepaid', asset: b.asset,
        }, rate)
        replaceSheet('spend-done', { ref: a.ref })
      },
    })
  },
  'spend-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const b = a.bill!
    const token = b.token
    const line = a.type === 'Data'
      ? `${a.note} is on ${b.target}.`
      : a.type === 'Airtime'
        ? `${naira(b.naira)} is on ${b.target}.`
        : token
          ? `${naira(b.naira)} of units bought. The token is below.`
          : `${naira(b.naira)} has gone against ${b.target}.`
    const rows: [string, string][] = [
      [a.type === 'Electricity' ? 'Meter' : 'Number', b.target],
      ['Paid', naira(b.naira)],
      [a.purse === 'ngn' ? 'Came out of' : 'Cost you',
       a.purse === 'ngn' ? 'Your naira' : usd(Math.abs(a.amount))],
    ]
    // "Electricity bought" is not what a postpaid payment did: nothing was
    // bought, something was paid down. Airtime and data were bought.
    if (!token) {
      return done(a.type === 'Electricity' ? 'Paid' : a.type + ' added', line, a, rows.slice(0, 2))
    }
    // The token is the product, not a detail of it: somebody is standing at a
    // meter with a phone in one hand. So it is the first row and the primary
    // button puts it on the clipboard — and it is on the receipt too, because
    // the one thing worse than losing it is losing it and having nowhere to
    // look.
    return outcome(
      'Token ready', line,
      [['Token', token], ...rows, ['Reference', a.ref]],
      { label: 'Copy the token',
        onClick: () => {
          navigator.clipboard?.writeText(token.replace(/ /g, '')).catch(() => undefined)
          toast('Token copied', 'success')
        } },
      { label: 'See the record', onClick: () => replaceSheet('receipt', { ref: a.ref }) })
  },

  /* ----- sending shares -----
     Priced in dollars, settled in shares, and every figure on the review says
     which it is. The one line that matters here is not the amount: it is that
     the security itself moves and does not come back. */
  'shares-review': (r) => {
    const v = num(r, 'v')
    const to = str(r, 'to')
    const t = str(r, 't')
    const c = find(t)!
    const held = holding(t)
    const n = held ? v / held.price : 0
    return review({
      title: 'Review',
      figureLabel: 'You are sending', figureValue: fmtShares(n) + ' ' + c.ticker, amount: v,
      rows: [
        ['To', to],
        ['Company', c.name],
        ['Worth', usd(v)],
        ['At', usd(held?.price ?? c.price) + ' a share'],
        ['Fee', 'None, either side'],
        ['You keep', fmtShares(Math.max(0, (held?.shares ?? 0) - n)) + ' ' + c.ticker],
      ],
      note: 'Shares cannot be sent back. Check the name before you send.',
      action: 'Send ' + fmtShares(n) + ' ' + c.ticker,
      onConfirm: () => {
        const { activity } = actions.sendShares(t, v, to)
        replaceSheet('shares-done', { ref: activity.ref })
      },
    })
  },
  'shares-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const n = a.asset ? fmtShares(a.asset.shares) + ' ' + a.asset.ticker : 'The shares'
    return done('Sent', `${n} now belong to ${a.who}.`, a,
      [['Worth', usd(Math.abs(a.amount))], ['Fee', 'None']])
  },

  /* ----- adding money -----
     Two rails, two reviews, and the same two-step ledger under both. Neither
     confirms a wallet that has gone up: they confirm that naira has left, and
     the waiting sheet is where the arrival is reported. */

  /** The card. We pull the naira, so a firm rate can be held for the ninety
   *  seconds it takes, and the fee is a figure rather than a footnote. */
  'card-review': (r) => {
    const v = num(r, 'v')
    const c = state.cards[0]
    const into = (assetOf(str(r, 'into')) ? str(r, 'into') : state.prefs.payWith) as Asset
    return review({
      title: 'Review',
      figureLabel: 'You are adding', figureValue: usd(v), amount: v,
      rows: [], action: '', onConfirm: () => {},
      note: '',
      hold: {
        rows: (q) => {
          const ngn = Math.round(v * q.rate)
          return [
            ['You pay', naira(ngn + cardFee(ngn))],
            ['Rate', '1 dollar = ' + naira(q.rate)],
            ['Fee', naira(cardFee(ngn)) + ' · ' + state.fees.card + '% card fee'],
            ['You receive', into === 'ngn' ? naira(ngn) : usd(v)],
            ['Landing in', assetOf(into)!.name],
            ['Card', c.brand + ' •••• ' + c.last4],
          ]
        },
        action: (q) => 'Pay ' + naira(Math.round(v * q.rate) + cardFee(Math.round(v * q.rate))),
        onConfirm: (q) => {
          const a = actions.startAddMoney(v, { kind: 'card', id: c.id }, q.rate, into)
          // The charge is authorised; the naira has not reached us yet. A card
          // takes seconds, so the wait is short — but it is a real wait with a
          // real posting behind it, not a spinner over an answer we already had.
          setTimeout(() => actions.landAddMoney(a.ref, q.rate), CARD_MS)
          replaceSheet('add-waiting', { ref: a.ref, rate: String(q.rate) })
        },
      },
    })
  },

  /** The transfer. Nothing is held and nothing is charged: this sheet hands
   *  over the account details and waits to be told the money has been sent.
   *  Pressing the button is the person saying they have done it, which is why
   *  it is worded as one — and it is the moment the naira leaves their bank,
   *  so it is the moment the first posting is written. */
  'transfer-review': (r) => {
    const v = num(r, 'v')
    const va = state.va
    const into = (assetOf(str(r, 'into')) ? str(r, 'into') : state.prefs.payWith) as Asset
    const ngn = Math.round(v * state.ngnPerUsd)
    const copy = h('button', {
      class: 'copy va-number', title: 'Copy the account number',
      on: {
        click: () => {
          navigator.clipboard?.writeText(va.number).catch(() => {})
          toast('Account number copied')
        },
      },
    }, h('span', { class: 't-body-strong', text: va.number }),
       h('span', { class: 'muted', html: icon.copy() }))
    return sheet('Send the naira',
      figure('Send exactly', naira(ngn)),
      // The number first, because it is the thing being copied and the thing
      // a wrong keystroke ruins. Everything under it is confirmation.
      h('div', { class: 'kv' },
        h('span', { class: 't-caps subtle', text: 'Account number' }), copy),
      panel(
        ['Bank', va.bank],
        ['Account name', va.name],
        ['Landing in', assetOf(into)!.name],
        ...(into === 'ngn'
          ? [['Converted', 'Nothing'] as [string, string],
             ['Fee', 'No fee'] as [string, string],
             ['You will get', naira(ngn)] as [string, string]]
          : [['Rate', '1 dollar = ' + naira(state.ngnPerUsd) + ', today'] as [string, string],
             ['Fee', 'No fee'] as [string, string],
             ['You will get', 'About ' + usd(v)] as [string, string]]),
      ),
      calloutEl(into === 'ngn'
        // Nothing is converted, so there is nothing for a rate to change. The
        // sentence about the rate moving would have been a caveat about a
        // number that is not in this transaction.
        ? 'Naira in, naira kept. Nothing is converted.'
        // One line, because the dialog is eight pixels over its ceiling with
        // two. What the second line said — that the dollars may differ — the
        // panel above already says with the word "About".
        : 'You get the rate on the day it lands.'),
      h('button', {
        class: 'btn btn-primary', text: 'I have sent it',
        on: {
          click: () => {
            const a = actions.startAddMoney(v, { kind: 'transfer', id: state.banks[0]?.id },
                                            state.ngnPerUsd, into)
            setTimeout(() => actions.landAddMoney(a.ref), TRANSFER_MS)
            replaceSheet('add-waiting', { ref: a.ref })
          },
        },
      }))
      // No "Not now" under it. The sheet already closes from its own header,
      // and a second control that does the same thing is what 11g.32 spent a
      // tier taking out of the other dialogs.
  },

  /** Between the two halves. The wallet has not moved and this sheet does not
   *  say it has: it names what is in flight, where it is, and what happens
   *  next. When the naira lands the tree is rebuilt and this becomes the
   *  outcome, in place, without anybody pressing anything. */
  'add-waiting': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const rate = num(r, 'rate', state.ngnPerUsd)
    if (a.settled) {
      return outcome('Added', `${usd(a.amount)} is in your wallet.`,
        [['From', a.who], ['Rate', '1 dollar = ' + naira(rate)],
         ['Reference', a.ref], ['When', longWhen(a.at)]],
        { label: 'Done', onClick: closeSheet },
        { label: 'See the record', onClick: () => replaceSheet('receipt', { ref: a.ref }) },
        { celebrate: true })
    }
    const stuck = settlement(a.amount) === 'pending'
    return sheet('On its way',
      figure('Waiting for', naira(Math.round(a.amount * rate))),
      panel(
        ['You will get', usd(a.amount)],
        ['From', a.who],
        ['Reference', a.ref],
      ),
      calloutEl(stuck
        ? 'We have not seen this yet. Nothing is lost. It lands in your wallet the moment it arrives. Tell us if it has been an hour.'
        : 'Your wallet goes up the moment your naira arrives. You can close this.',
        stuck ? 'warning' : undefined),
      h('button', { class: 'btn btn-secondary', text: 'Close', on: { click: closeSheet } }))
  },

  /** One person, as the console sees them. Read-only in every sense that
   *  matters: there is nothing on this sheet that moves their money, because
   *  there is nothing anywhere that could. */
  'admin-person': (r) => {
    const m = state.members.find((x) => x.id === str(r, 'id'))
    if (!m) return sheet('Not found', h('p', { class: 'muted', text: 'No such account.' }))
    return sheet(m.name,
      figure('Funded', usd(m.funded, false)),
      panel(
        ['Identity', m.kyc === 'verified' ? 'Verified' : m.kyc === 'checking' ? 'Checking' : 'Not done'],
        ['Eligible to trade', m.eligible ? 'Yes' : 'No'],
        ['Account', m.state === 'active' ? 'Active' : m.state === 'restricted' ? 'Restricted' : 'Closed'],
        ['Invite', m.invite],
        ['Joined', m.joined],
        ['Email', m.email],
      ),
      calloutEl('Opening this record goes in the audit log. Staff can read. Nobody can sign.'),
      h('div', { class: 'receipt-on' },
        h('button', { class: 'btn btn-secondary', text: 'Copy support reference',
          on: { click: () => { navigator.clipboard?.writeText(m.id).catch(() => {}); toast('Reference copied') } } }),
        h('button', { class: 'btn btn-secondary', text: 'Close',
          on: { click: closeSheet } })))
  },

  /** Taking the wallet somewhere else.
   *
   *  The one flow that proves the product is not custody. It is deliberately
   *  not a "download your key" button: Coinbase's export puts the key in front
   *  of the person who owns it, on their device, and the honest version of
   *  this screen says what that means before it starts rather than after. */
  'export-wallet': () =>
    sheet('Take your wallet elsewhere',
      figure('This wallet is', 'Yours'),
      panel(
        ['Network', 'Base'],
        ['Holds', 'USDC and your tokenised shares'],
        ['Exported through', 'Coinbase'],
        ['Tokkenly keeps', 'Nothing'],
      ),
      calloutEl('That app will be able to move everything at this address. Nothing it does can be undone.', 'warning'),
      h('span', { class: 'muted t-caption',
        text: 'Your account and your history stay here. Only control of the wallet moves.' }),
      h('button', {
        class: 'btn btn-primary', text: 'Continue with Coinbase',
        on: { click: () => { toast('Opening the Coinbase export flow'); closeSheet() } },
      })),

  /** The cards on file. The same shape as the banks sheet, because they do the
   *  same job from the other side. */
  cards: () =>
    sheet('Your cards',
      h('div', { class: 'stack-12' },
        ...state.cards.map((c) =>
          h('div', { class: 'kv' },
            h('span', { class: 'who' },
              h('span', { class: 'mark', html: icon.wallet() }),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: c.brand + ' •••• ' + c.last4 })),
                h('small', { text: 'Expires ' + c.expiry })),
            h('span', { class: 'muted t-caption', text: c.holder })))),
      calloutEl(`A card costs ${state.fees.card}% and lands in seconds. A bank transfer is free and takes a minute.`),
      h('button', {
        class: 'btn btn-secondary', text: 'Add a card',
        on: { click: () => { toast('Adding a card needs a payments licence we do not have yet'); closeSheet() } },
      })),

  /* ----- invest ----- */
  'invest-review': (r) => {
    const v = num(r, 'v')
    const c = find(str(r, 't'))!
    const stop = refused(c, v)
    if (stop) return stop
    return review({
      title: 'Review',
      figureLabel: 'You are adding', figureValue: usd(v), amount: v,
      // The amount, the fee, the total and exactly what you receive, in that
      // order, before you confirm. Nothing folded into a worse price.
      rows: [
        ['Investment', usd(v)],
        ['Fee', `${usd(tradeFee(v))} · ${state.fees.trade}%`],
        ['Total', usd(v + tradeFee(v))],
        ['Price each', usd(c.price)],
        // What the token costs against the share it tracks. A fee line that
        // stops at the fee is not the whole cost on a tokenised product.
        // One independent price, named by where it came from and how fresh it
        // is. Quoting the venue against itself proves nothing, and quoting two
        // references proves nothing twice. The label is the words the composer
        // behind this dialog uses — "the real price" — because the same fact
        // wearing two names on two adjacent surfaces is two facts to a reader.
        // The source keeps its name in the value, where it is what makes the
        // number worth believing rather than a brand in a heading.
        [discount(c) >= 0 ? 'Below the real price' : 'Above the real price',
          `${pct(Math.abs(discount(c)), 2)} · ${usd(c.mark)} on Chainlink, ${c.chainlinkAge}s ago`],
        ['You receive', fmtShares(v / c.price) + ' ' + c.ticker],
        ['At least', fmtShares(minReceived(v / c.price, GUARDS.slippagePct)) + ' ' + c.ticker],
        ['Price impact', pct(priceImpact(c, v), 2)],
      ],
      // The last thing read before money moves is the one that has to carry
      // the risk, not a page in a settings menu nobody opens.
      note: c.kind === 'etf'
        ? `A fund, not a company. Its value can fall as well as rise, and you can get back less than you put in.`
        : 'Its value can fall as well as rise, and you can get back less than you put in. Sell any part of it whenever you want.',
      action: `Buy ${usd(v)} of ${c.name}`,
      onConfirm: () => {
        const { activity, shares } = actions.buy(c.ticker, v, assetFrom(r))
        replaceSheet('invest-done', { ref: activity.ref, t: c.ticker, got: fmtShares(shares) })
      },
    })
  },
  'invest-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const c = find(str(r, 't'))!
    const got = num(r, 'got')
    const held = holding(c.ticker)
    // What this purchase bought, and what it adds up to. The second line used
    // to be the only one, and it read "undefined shares" for a first buy.
    const line = held && held.shares - got > 1e-6
      ? `${fmtShares(got)} shares of ${c.name}. You now hold ${fmtShares(held.shares)}.`
      : `${fmtShares(got)} shares of ${c.name}. That is your first holding in it.`
    return done('Bought', line, a, [['Price each', usd(c.price)]])
  },

  /* ----- sell ----- */
  'sell-review': (r) => {
    const v = num(r, 'v')
    const c = find(str(r, 't'))!
    const stop = refused(c, v, 'sell')
    if (stop) return stop
    return review({
      title: 'Review',
      figureLabel: 'You are selling', figureValue: usd(v),
      rows: [
        ['Sale', usd(v)],
        ['Fee', `${usd(tradeFee(v))} · ${state.fees.trade}%`],
        ['You receive', usd(v - tradeFee(v))],
        ['At least', usd(minReceived(v - tradeFee(v), GUARDS.slippagePct))],
        ['Price each', `${usd(c.price)} · real price ${usd(c.mark)} on Chainlink, ${c.chainlinkAge}s ago`],
        ['Shares sold', fmtShares(v / c.price) + ' ' + c.ticker],
        ['Price impact', pct(priceImpact(c, v), 2)],
      ],
      note: 'Whatever you keep carries on tracking the price.',
      // A sale does not leave the account, but neither does a purchase, and
      // the purchase is gated. Somebody who set "ask above $500" would not
      // expect $900 of their holding to be liquidated without being asked.
      amount: v,
      action: `Sell ${usd(v)} of ${c.name}`,
      onConfirm: () => {
        const { activity, shares } = actions.sell(c.ticker, v, assetFrom(r))
        replaceSheet('sell-done', { ref: activity.ref, t: c.ticker, sold: fmtShares(shares) })
      },
    })
  },
  'sell-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const c = find(str(r, 't'))!
    const left = holding(c.ticker)
    return done('Sold',
      `${fmtShares(num(r, 'sold'))} shares of ${c.name}. ${usd(a.amount)} is in your wallet.`, a,
      [['You hold now', left ? fmtShares(left.shares) + ' shares' : 'None left']])
  },

  /* ----- the bucket ----- */
  'bucket-review': () => {
    const stop = bucketRefused()
    if (stop) return stop
    const lines = state.bucket.map((b) => {
      const c = find(b.ticker)!
      return [c.name, `${usd(b.dollars)} · ${fmtShares(b.dollars / c.price)} shares`] as [string, string]
    })
    const total = bucketTotal()
    return review({
      title: 'Review',
      figureLabel: 'You are buying', figureValue: usd(total),
      rows: [
        ...lines,
        ['Investment', usd(total)],
        ['Fee', `${usd(tradeFee(total))} · ${state.fees.trade}%`],
        ['Total', usd(total + tradeFee(total))],
        ['Cash left after', usd(state.cash - total - tradeFee(total))],
      ],
      note: 'One payment, but each company gets its own receipt so you can find any of them later.',
      action: `Buy all ${state.bucket.length} for ${usd(total + tradeFee(total))}`,
      amount: total + tradeFee(total),
      onConfirm: () => {
        const { refs, spent, lines: got } = actions.payBucket()
        replaceSheet('bucket-done', {
          refs: refs.join(','), spent: String(spent),
          got: got.map((g) => g.ticker + ':' + fmtShares(g.shares)).join(','),
        })
      },
    })
  },
  'bucket-done': (r) => {
    const refs = str(r, 'refs').split(',').filter(Boolean)
    const got = str(r, 'got').split(',').filter(Boolean).map((x) => x.split(':'))
    return outcome(
      'Bought',
      `${usd(num(r, 'spent'))} across ${refs.length} ${refs.length === 1 ? 'company' : 'companies'}.`,
      got.map(([t, sh]) => [find(t)?.name ?? t, fmtShares(Number(sh)) + ' shares'] as [string, string]),
      { label: 'Done', onClick: () => { closeSheet(); go('/') } },
      { label: 'See the receipts', onClick: () => { closeSheet(); go('/activity?filter=trades') } }
    )
  },

  /* ----- borrow ----- */
  'borrow-review': (r) => {
    const v = num(r, 'v')
    const after = state.borrowed + v
    return review({
      title: 'Review',
      figureLabel: 'You are borrowing', figureValue: usd(v),
      rows: [
        ['Rate', pct(state.rates.borrow) + ' a year'],
        ['Costs you', 'About ' + usd(monthlyCost(v)) + ' a month'],
        ['Repay', 'Any time, no fee'],
        ['Sold if shares fall below', usd(after * (state.rates.collateral / 100))],
      ],
      note: 'Your shares stay yours and keep earning. We only sell if they fall to that level.',
      action: 'Borrow ' + usd(v),
      onConfirm: () => {
        const a = actions.borrow(v, assetFrom(r))
        replaceSheet('borrow-done', { ref: a.ref })
      },
    })
  },
  'borrow-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Borrowed', `${usd(a.amount)} is in your wallet. Repay any time.`, a,
      [['Rate', pct(state.rates.borrow) + ' a year']])
  },

  /* ----- repay ----- */
  'repay-review': (r) => {
    const v = num(r, 'v')
    const left = Math.max(0, owed() - v)
    return review({
      title: 'Review',
      figureLabel: 'You are repaying', figureValue: usd(v), amount: v,
      rows: [
        ['Comes from', 'Your wallet'],
        ['Left owing', usd(left)],
        ['Rate on what is left', pct(state.rates.borrow) + ' a year'],
        ['Costs you after', left === 0 ? 'Nothing' : 'About ' + usd(monthlyCost(left)) + ' a month'],
      ],
      note: 'Repaying frees the same amount up to borrow again whenever you want.',
      action: 'Repay ' + usd(v),
      onConfirm: () => {
        const a = actions.repay(v, assetFrom(r))
        replaceSheet('repay-done', { ref: a.ref })
      },
    })
  },
  'repay-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const left = owed()
    return done('Repaid',
      left === 0 ? 'Nothing left to clear. Your limit is back to full.' : `${usd(left)} left to clear. Repay the rest whenever you want.`,
      a, [['From', 'Your wallet']])
  },

  /* ----- earn ----- */
  'earn-review': (r) => {
    const v = num(r, 'v')
    return review({
      title: 'Review',
      figureLabel: 'You are moving in', figureValue: usd(v),
      rows: [
        ['Rate', pct(state.rates.lend) + ' a year'],
        ['Pays you', 'About ' + usd(monthlyInterest(v)) + ' a month'],
        ['Paid', 'Every day'],
        ['Take out', 'Any time, no fee'],
      ],
      note: 'The rate moves with the market. It can go up as well as down.',
      action: 'Move ' + usd(v) + ' in',
      onConfirm: () => {
        const a = actions.lend(v, assetFrom(r))
        replaceSheet('earn-done', { ref: a.ref })
      },
    })
  },
  'earn-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Lent', `${usd(Math.abs(a.amount))} starts paying interest tomorrow morning.`, a,
      [['Rate', pct(state.rates.lend) + ' a year']])
  },

  /* ----- take out ----- */
  'takeout-review': (r) => {
    const v = num(r, 'v')
    const rest = Math.max(0, state.lent - v)
    return review({
      title: 'Review',
      figureLabel: 'You are taking out', figureValue: usd(v),
      rows: [
        ['Goes to', 'Your wallet'],
        ['Arrives', 'Straight away'],
        ['Left earning', usd(rest)],
        ['You give up', 'About ' + usd(monthlyInterest(v)) + ' a month'],
      ],
      note: 'Interest already paid stays in your wallet. Only what you leave in keeps earning.',
      action: 'Take out ' + usd(v),
      onConfirm: () => {
        const a = actions.takeBack(v, assetFrom(r))
        replaceSheet('takeout-done', { ref: a.ref })
      },
    })
  },
  'takeout-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Taken back', `${usd(a.amount)} is in your wallet. ${usd(state.lent)} is still lent out.`, a)
  },
}

export function buildSheet(r: Route): HTMLElement | null {
  if (!r.sheet) return null
  // On a phone "more" is not a sheet at all: the nav bar's own capsule becomes
  // the list, in place, with the button that opened it still under the thumb
  // (11g.54). The desktop keeps the sheet, because there is no nav bar down
  // there to grow — the sidebar is the nav bar, and it is already showing.
  if (r.sheet === 'more' && isMobile()) return null
  const make = SHEETS[r.sheet]
  if (!make) return null
  try {
    return make(r)
  } catch {
    return sheet('Something is missing',
      h('p', { class: 'muted', style: { margin: '0' },
        text: 'That sheet needs a record that is no longer here. Close it and try again.' }))
  }
}

export { when }
