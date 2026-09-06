import { h } from './ui'
import { icon } from './icons'
import { sheet, figure, panel, outcome, toast } from './components/sheet'
import { callout as calloutEl, emptyState as emptyStateEl, skeletonList } from './components/bits'
import {
  state, actions, owed, monthlyCost, monthlyEarn, holding, bucketTotal,
  tradeFee, weakPin, ratePassword, type Activity,
  requestQuote, quoteLive, settlement, grossOf, type Quote,
} from './state'
import { pinPad } from './components/pinpad'
import { find, discount, CATALOGUE } from './catalogue'
import { sparkline, type Range } from './components/chart'
import { usd, naira, pct, shares as fmtShares, longWhen, when, isDrawdown } from './format'
import { type Route, closeSheet, replaceSheet, go } from './router'
import { QA } from './screens/settings'
import { peopleRows } from './screens/money'
import { search } from './destinations'
import { BEHIND_MORE } from './components/shell'

/** One year, which is the span a receipt's sparkline should show: long enough
 *  to be a shape rather than a squiggle, short enough to be about now. */
const YEAR: Range = { key: '1Y', days: 365, pct: 17.28, vol: 0.09, fmt: () => '', over: 'this year' }

/** How long a confirmation shows its spinner. Short enough not to annoy,
 *  long enough that the state is real rather than decorative. */
export const CONFIRM_MS = 350

const num = (r: Route, k: string, d = 0): number => Number(r.query.get(k) ?? d) || d
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
    refusal.hidden = false
    refusal.replaceChildren(h('span', { html: icon.alert() }), h('span', { text: why }))
  }

  const button = h('button', { class: 'btn btn-primary', text: actionNow() })
  button.addEventListener('click', () => {
    if (button.classList.contains('is-busy') || button.hasAttribute('disabled')) return
    // Nothing may move while there is no connection. Every one of these
    // confirmations writes to a local ledger and reports success, which on a
    // dropped signal is the worst thing a money app can do: tell somebody a
    // payment landed when nothing left the building.
    if (!state.online) {
      refuse('No connection, so this has not been sent. Nothing has left your account. Try again when you are back.')
      return
    }
    // The other side can say no, and when it does nothing is written: the
    // ledger is not touched, the sheet stays where it is, and the reason is on
    // screen rather than in a toast that has gone by the time you look up.
    if (settlement(opts.amount ?? 0) === 'declined') {
      refuse('Your bank declined this one. Nothing has left your account. Check with them, or try a smaller amount.')
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
        gate.replaceChildren(
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
          gate.replaceChildren(button)
          button.focus()
        },
      })
      gate.replaceChildren(
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
      rows.replaceChildren(skeletonList(3))
      clock.className = 'hold'
      clock.replaceChildren(h('span', { html: icon.info() }),
        h('span', { text: 'Getting you a rate.' }))
      foot.replaceChildren()
      requestQuote().then((q) => { quote = q; draw() }).catch(fail)
    }

    /** It did not arrive. Says which of the two reasons it was, and offers the
     *  only thing that helps. Nothing has moved: the confirm button does not
     *  exist in this state, so there is nothing to press by mistake. */
    const fail = (): void => {
      clearInterval(timer)
      // The skeleton goes with the attempt. Leaving it under an error message
      // says "still loading" and "it failed" at the same time.
      rows.replaceChildren()
      clock.className = 'hold expired'
      clock.replaceChildren(h('span', { html: icon.alert() }),
        h('span', { text: state.online
          ? 'Could not get a rate just now. Nothing has been sent.'
          : 'No connection, so there is no rate to hold. Nothing has been sent.' }))
      foot.replaceChildren(h('button', {
        class: 'btn btn-secondary', text: 'Try again', on: { click: ask },
      }))
    }

    const draw = (): void => {
      rows.replaceChildren(panel(...rowsNow()))
      button.textContent = actionNow()
      // A held rate does not exempt a large withdrawal from the PIN. The gate
      // is rebuilt with each quote, so a rate taken and left to expire cannot
      // leave an already-authorised button sitting there for the next one.
      foot.replaceChildren(big ? pinGate() : button)
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
      foot.replaceChildren(h('button', {
        class: 'btn btn-primary', text: 'Get a new rate', on: { click: ask },
      }))
    }
    ask()
    return el
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
      'We did not get a confirmation in time. It may still land, so it is in your activity as unsettled and nothing has been sent twice.',
      [['Reference', a.ref], ['When', longWhen(a.at)], ...extra],
      { label: 'Done', onClick: closeSheet },
      // In place. Opening a receipt used to close this sheet, navigate to
      // Activity and open it there — so asking "what exactly happened" moved
      // you off the screen you were on to answer it. The record is a dialog;
      // it belongs over whatever you are looking at.
      { label: 'See the record', onClick: () => replaceSheet('receipt', { ref: a.ref }) })
  }
  return outcome(
    title,
    line,
    [['Reference', a.ref], ['When', longWhen(a.at)], ...extra],
    { label: 'Done', onClick: closeSheet },
    { label: 'See the record', onClick: () => replaceSheet('receipt', { ref: a.ref }) }
  )
}

/* ---------------- registry ---------------- */

type Builder = (r: Route) => HTMLElement

export const SHEETS: Record<string, Builder> = {
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

  /** Change who a payment goes to, without leaving the dialog. */
  'pick-who': () =>
    sheet('Who are you sending to?',
      h('div', { class: 'sheet-list' },
        ...peopleRows((who) => {
          closeSheet()
          go('/send?to=' + encodeURIComponent(who))
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
    const c = a.kind === 'trade' ? CATALOGUE.find((x) => x.name === a.who) : undefined
    const held = c ? holding(c.ticker) : undefined
    return sheet(
      'Receipt',
      figure(a.type, (inbound ? '+' : '−') + usd(Math.abs(a.amount)),
        inbound && !isDrawdown(a) ? 'pos' : ''),
      c ? h('div', { class: 'receipt-co' },
        h('span', { class: 'two-line grow' },
          h('span', { class: 't-body-strong', text: `${c.ticker} · ${c.name}` }),
          h('small', { text: c.kind === 'etf' ? `A fund of ${c.holds ?? 'many'} companies` : c.plain })),
        h('span', { class: 'two-line right' },
          h('span', { class: 't-body-strong', text: usd(c.price) }),
          h('small', { class: c.dayPct >= 0 ? 'pos' : 'warn',
            text: (c.dayPct >= 0 ? '+' : '') + pct(c.dayPct) + ' today' }))) : null,
      c ? sparkline(YEAR, c.price, c.ticker.charCodeAt(0)) : null,
      panel(
        [inbound ? 'From' : 'To', a.who],
        // The amount, the fee and the total, the way the composer stated them
        // before the button was pressed — a receipt that reorganises the
        // arithmetic is a receipt somebody has to check.
        ...(c ? [
          [a.type === 'Sold' ? 'Sale' : 'Investment', usd(grossOf(a))] as [string, string],
          ['Shares', fmtShares(grossOf(a) / c.price)] as [string, string],
          ['Price each', usd(c.price)] as [string, string],
        ] : []),
        ['Reference', a.ref],
        ['When', longWhen(a.at)],
        // The receipt used to say "None" on every entry, including the trades
        // that charged half a per cent — the one document a person keeps,
        // stating the wrong figure for the one thing it is kept for. The fee
        // is recorded on the movement now, so this reads it rather than
        // asserting it.
        // "None — the rate above is what you get" was written for a currency
        // conversion and printed on everything, including a loan drawdown with
        // no rate anywhere on the sheet. None is the whole answer.
        ['Fee', a.fee ? usd(a.fee) : 'None'],
        ...(c ? [[a.type === 'Sold' ? 'You received' : 'Total',
          usd(Math.abs(a.amount))] as [string, string]] : []),
        ...(c && held ? [['You hold now',
          `${fmtShares(held.shares)} shares · ${usd(held.shares * c.price)}`] as [string, string]] : [])
      ),
      calloutEl(a.settled
        ? 'Settled. Nothing about this payment is going to change now.'
        : 'Still settling. It usually clears within a minute.'),
      h('button', {
        class: 'btn btn-primary', text: 'Download receipt',
        on: { click: () => toast('Receipt saved as ' + a.ref + '.pdf') },
      }),
      // The ways on. A receipt is where somebody has just answered "what did I
      // buy"; the next two questions are "how is it doing" and "what do I hold
      // altogether", and both were a dismissal and a hunt away.
      h('div', { class: 'receipt-on' },
        c ? h('button', { class: 'btn btn-secondary', text: 'See ' + c.name,
          on: { click: () => { closeSheet(); go('/invest/' + c.ticker.toLowerCase()) } } }) : null,
        h('button', { class: 'btn btn-secondary', text: 'Your portfolio',
          on: { click: () => { closeSheet(); go('/') } } }))
    )
  },

  export: () =>
    sheet('Export your history',
      panel(
        ['Rows', String(state.activity.length)],
        ['Format', 'CSV, one row per entry'],
        ['Covers', 'Payments, trades and Grow'],
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
      wrap.replaceChildren(
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
        ['One', 'Take your ' + usd(state.inEarn) + ' out of Earn'],
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
            actions.addBank(n, a.slice(-4))
            toast(n + ' added')
            closeSheet()
          },
        },
      }))
  },

  /* ----- send ----- */
  'send-review': (r) => {
    const v = num(r, 'v')
    const to = str(r, 'to')
    return review({
      title: 'Review',
      figureLabel: 'You are sending', figureValue: usd(v), amount: v,
      rows: [['To', to], ['They receive', usd(v)], ['Fee', 'None — what you send is what they get'], ['Arrives', 'In about a minute']],
      note: 'Payments cannot be recalled once they are on the network.',
      action: 'Send ' + usd(v),
      onConfirm: () => {
        const a = actions.send(to, v)
        replaceSheet('send-done', { ref: a.ref })
      },
    })
  },
  'send-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Sent', `${usd(Math.abs(a.amount))} is on its way to ${a.who}.`, a, [['Fee', 'None']])
  },

  /* ----- add money ----- */
  'add-review': (r) => {
    const v = num(r, 'v')
    const bank = state.banks[0]
    return review({
      title: 'Review',
      figureLabel: 'You are adding', figureValue: usd(v), amount: v,
      rows: [], action: '', onConfirm: () => {},
      note: '',
      hold: {
        rows: (q) => [
          ['You pay', naira(v * q.rate)],
          ['Rate', '1 dollar = ' + naira(q.rate)],
          ['Fee', 'None — the rate above is the rate you get'],
          ['You receive', usd(v)],
          ['From', bank.name + ' •••• ' + bank.last4],
          ['Lands', 'In about a minute'],
        ],
        action: () => 'Add ' + usd(v),
        onConfirm: () => {
          const a = actions.addMoney(v, bank.id)
          replaceSheet('add-done', { ref: a.ref })
        },
      },
    })
  },
  'add-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Added', `${usd(a.amount)} is in your wallet.`, a, [['From', a.who]])
  },

  /* ----- convert ----- */
  'convert-review': (r) => {
    const v = num(r, 'v')
    const bank = state.banks[0]
    return review({
      title: 'Review',
      figureLabel: 'You are withdrawing', figureValue: usd(v), amount: v,
      rows: [], action: '', onConfirm: () => {},
      note: '',
      hold: {
        rows: (q) => [
          ['Withdrawing', usd(v)],
          ['Rate', '1 dollar = ' + naira(q.rate)],
          ['Fee', 'None — the rate above is the rate you get'],
          ['You receive', naira(v * q.rate)],
          ['Into', bank.name + ' •••• ' + bank.last4],
          ['Arrives', 'Usually within a minute'],
        ],
        action: () => 'Withdraw ' + usd(v),
        onConfirm: (q) => {
          const a = actions.convert(v, bank.id)
          replaceSheet('convert-done', { ref: a.ref, rate: String(q.rate) })
        },
      },
    })
  },
  'convert-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    // The rate that was honoured, not the indicative one. Confirming against a
    // held quote and then being told a different naira figure is the exact
    // thing the hold exists to prevent.
    const rate = num(r, 'rate', state.ngnPerUsd)
    return done('Withdrawn', `${naira(Math.abs(a.amount) * rate)} is on its way to ${a.who}.`, a)
  },

  /* ----- invest ----- */
  'invest-review': (r) => {
    const v = num(r, 'v')
    const c = find(str(r, 't'))!
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
        [discount(c) >= 0 ? 'Below the real price' : 'Above the real price',
          `${pct(Math.abs(discount(c)), 2)} · ${c.name} is ${usd(c.mark)}`],
        ['You receive', fmtShares(v / c.price) + ' shares of ' + c.name],
        ['Settles', 'In about a minute'],
      ],
      // The last thing read before money moves is the one that has to carry
      // the risk, not a page in a settings menu nobody opens.
      note: c.kind === 'etf'
        ? `A fund, not a company. Its value can fall as well as rise, and you can get back less than you put in.`
        : 'Its value can fall as well as rise, and you can get back less than you put in. Sell any part of it whenever you want.',
      action: `Buy ${usd(v)} of ${c.name}`,
      onConfirm: () => {
        const { activity, shares } = actions.buy(c.ticker, v)
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
    return review({
      title: 'Review',
      figureLabel: 'You are selling', figureValue: usd(v),
      rows: [
        ['Sale', usd(v)],
        ['Fee', `${usd(tradeFee(v))} · ${state.fees.trade}%`],
        ['You receive', usd(v - tradeFee(v))],
        ['Price each', usd(c.price)],
        ['Shares sold', fmtShares(v / c.price) + ' of ' + c.name],
        ['Lands in', 'Your wallet'],
      ],
      note: 'Whatever you keep carries on tracking the price.',
      // A sale does not leave the account, but neither does a purchase, and
      // the purchase is gated. Somebody who set "ask above $500" would not
      // expect $900 of their holding to be liquidated without being asked.
      amount: v,
      action: `Sell ${usd(v)} of ${c.name}`,
      onConfirm: () => {
        const { activity, shares } = actions.sell(c.ticker, v)
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
      [['You hold now', left ? fmtShares(left.shares) + ' shares' : 'None — that was all of it']])
  },

  /* ----- the bucket ----- */
  'bucket-review': () => {
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
        const a = actions.borrow(v)
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
        const a = actions.repay(v)
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
        ['Rate', pct(state.rates.earn) + ' a year'],
        ['Pays you', 'About ' + usd(monthlyEarn(v)) + ' a month'],
        ['Paid', 'Every day'],
        ['Take out', 'Any time, no fee'],
      ],
      note: 'The rate moves with the market. It can go up as well as down.',
      action: 'Move ' + usd(v) + ' in',
      onConfirm: () => {
        const a = actions.moveIntoEarn(v)
        replaceSheet('earn-done', { ref: a.ref })
      },
    })
  },
  'earn-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Moved to Earn', `${usd(Math.abs(a.amount))} starts earning tomorrow morning.`, a,
      [['Rate', pct(state.rates.earn) + ' a year']])
  },

  /* ----- take out ----- */
  'takeout-review': (r) => {
    const v = num(r, 'v')
    const rest = Math.max(0, state.inEarn - v)
    return review({
      title: 'Review',
      figureLabel: 'You are taking out', figureValue: usd(v),
      rows: [
        ['Goes to', 'Your wallet'],
        ['Arrives', 'Straight away'],
        ['Left earning', usd(rest)],
        ['You give up', 'About ' + usd(monthlyEarn(v)) + ' a month'],
      ],
      note: 'Interest already paid stays in your wallet. Only what you leave in keeps earning.',
      action: 'Take out ' + usd(v),
      onConfirm: () => {
        const a = actions.takeOutOfEarn(v)
        replaceSheet('takeout-done', { ref: a.ref })
      },
    })
  },
  'takeout-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Taken out', `${usd(a.amount)} is in your wallet. ${usd(state.inEarn)} carries on earning.`, a)
  },
}

export function buildSheet(r: Route): HTMLElement | null {
  if (!r.sheet) return null
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
