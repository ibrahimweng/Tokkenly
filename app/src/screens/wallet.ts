import { h, countTo } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, headLink, kv, callout, amount, directionMark, figureWithEye, spentBar } from '../components/bits'
import { table } from '../components/table'
import { state, buyingPower, availableToBorrow, alsoIn, rateLine, limits, leftThisMonth, verified, money, moneyNaira, settlement, type Activity } from '../state'
import * as ledger from '../ledger'
import { usd, naira, when, activityLabel } from '../format'
import { go, openSheet } from '../router'
import { balanceText, balanceAlso } from '../components/purse'
import { assetOf, netsFor, type Asset } from '../assets'

/* A door, across rather than down. Stacked — badge, gap, title, sub — it was
   a 190px card holding four lines of content, and two of them side by side
   under the balance card left the page with more empty card than card. Across,
   the same four things take one line each and the door is the height of what
   is in it. The chevron is the other half of the fix: a stacked card with a
   badge on it looks like a card, and this is a way somewhere. */
function way(label: string, sub: string, ic: string, to: string | null, onClick?: () => void): HTMLElement {
  return h('button', { class: 'card way', on: { click: () => (onClick ? onClick() : go(to!)) } },
    h('div', { class: 'promo-badge', html: ic }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-title', text: label }),
      h('span', { class: 'muted', text: sub })),
    h('span', { class: 'muted way-go', html: icon.chevron() }))
}

/** The wallet's own figure, travelling rather than jumping when money moves. */
function cashFigure(): HTMLElement {
  // Everything you could spend today, whichever of the three it is in. The
  // three are listed underneath; a headline that named only the dollars would
  // be a headline that had quietly decided the naira did not count.
  const spendable = state.cash + state.naira / state.ngnPerUsd
  const el = h('span', { class: 'hero-figure' })
  if (state.prefs.hideBalances) el.textContent = money(spendable)
  else countTo(el, 'wallet.cash', spendable, (n) => money(n))
  return el
}

/** Where a movement that has not finished has actually got to.
 *
 *  Money in transit is at a named place — our collection account on the way in,
 *  the payout account on the way out — and the naira sitting there is the same
 *  naira this row is about. Read off the ledger rather than multiplied out of
 *  the dollars, so the row and the statement cannot disagree.
 *
 *  "In route but not landed" is the thing a person actually wants to know, and
 *  it is not the same sentence in both directions: on the way in nobody has
 *  been charged twice, on the way out the bank has not confirmed. */
function stage(a: Activity): string {
  const c = ledger.conversion(a.ref)
  const inbound = a.amount > 0
  if (inbound) {
    return settlement(a.amount) === 'pending'
      ? (c ? naira(c.naira) + ' in route · we have not seen it yet, and nothing was taken twice'
           : 'In route · we have not seen it yet, and nothing was taken twice')
      : (c ? naira(c.naira) + ' in route · has not landed yet'
           : 'In route · has not landed yet')
  }
  return c ? 'Dollars out · ' + naira(c.naira) + ' in route to the bank, not landed yet'
           : 'On its way · the bank has not confirmed it yet'
}

/* What has moved through this wallet, and what has not finished moving.
   -------------------------------------------------------------------------
   "Still settling" was a card of its own holding two figures: naira between
   banks on the way in, and naira on the way out. Neither is a balance anybody
   can do anything with — they are transactions that have not finished, and the
   list below was already the place this product keeps transactions. A card
   whose contents belong in the thing underneath it is a card.

   So it is gone, and what it held leads this list instead: everything unfinished
   first, each row saying where its money has actually got to. The two figures
   did not go with the card — they are on the rows whose money they are, which
   is where somebody looking at one transfer would look for them. */
function moved(): HTMLElement {
  // Unfinished first, always, however old. A transfer from Tuesday that has
  // not landed outranks a payment from this morning that has: one of them is
  // a question and the other is a record.
  const waiting = state.activity.filter((a) => !a.settled)
  const rows = [...waiting,
    ...state.activity.filter((a) => a.settled && a.kind === 'payment')].slice(0, 8)
  return card(
    cardHead('Money in and out', headLink('All payments', '/activity?filter=payments')),
    rows.length
      ? table(
          [{ key: 'who', label: 'Who' }, { key: 'when', label: 'When', optional: true },
           { key: 'ref', label: 'Reference', optional: true }, { key: 'amt', label: 'Amount', align: 'right' }],
          rows.map((a) => [
            h('span', { class: 'who' }, directionMark(a.amount),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: activityLabel(a) }),
                a.settled ? null : h('small', { class: 'inroute', text: stage(a) }))),
            h('span', { class: 'muted', text: when(a.at) }),
            h('span', { class: 'muted', text: a.ref }),
            amount(a),
          ]),
          (i) => openSheet('receipt', { ref: rows[i].ref }),
          undefined,
          { lead: 'who', detail: ['when', 'ref'], figure: ['amt'] },
        )
      : h('span', { class: 'muted', text: 'Nothing has moved through this wallet yet.' })
  )
}

/* ---------------------------------------------------------------------------
   One card, because it was one subject.

   "Money you can spend" was a figure, a bar and a legend; "What you hold" was
   the three balances as rows. The legend was already a small version of those
   rows — the same names, the same figures, twelve pixels apart in two cards —
   so the two were one card that had been cut in half.

   Merged, the anatomy is: the two figures that differ by exactly what you have
   lent, the bar that splits them, and the rows that name each part. The bar's
   legend *is* the balance list now; there is nothing said twice, and the
   caption that used to total it in prose is gone because the second figure
   says it.

   Buying power went with it. It is not a balance — it is your cash plus a
   credit limit — and sitting it beside three balances under a heading about
   money you can spend was inviting somebody to add four numbers that do not
   add up. It has its own card, beside the limits, where the other thing about
   credit already lives.

   What has never been in the bar, and still is not, is what the shares would
   lend against. It was a segment once, which made a credit limit look like a
   kind of balance and let the caption total it with the rest: "$5,200.00 in
   total" on an account holding $3,720. Money you have and money you could owe
   do not add up, and a single bar said they did.
   --------------------------------------------------------------------------- */
function cashHero(): HTMLElement {
  // What the bar is made of, and what the rows under it are. One list, read
  // twice — as widths and as figures — rather than two lists that can drift.
  const nairaUsd = state.naira / state.ngnPerUsd
  const parts: { key: Asset | 'lent'; value: number; cls: string }[] = [
    { key: 'usdc', value: state.usdc, cls: 'a' },
    { key: 'usdt', value: state.usdt, cls: 'd' },
    { key: 'ngn', value: nairaUsd, cls: 'c' },
    { key: 'lent', value: state.lent, cls: 'b' },
  ]
  const total = parts.reduce((t, p) => t + p.value, 0)
  const name = (k: Asset | 'lent') => (k === 'lent' ? 'Lent out' : assetOf(k)!.name)
  const figure = (p: { key: Asset | 'lent'; value: number }) =>
    p.key === 'lent' ? money(p.value) : balanceText(p.key)

  return h('section', { class: 'card hero-cash' },
    h('div', { class: 'hero-top' },
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Money you can spend' }),
        figureWithEye(cashFigure()),
        alsoIn(state.cash + nairaUsd)
          ? h('span', { class: 'stack-8' },
              h('span', { class: 'muted', text: alsoIn(state.cash + nairaUsd)! }),
              // The rate, its time and what it is: the one number here that a
              // person cannot check for themselves, so it says where it came
              // from rather than appearing as a fact of nature.
              h('span', { class: 'subtle t-caption', text: rateLine() }))
          : null),
      // The same money with what you have lent added back. Two figures rather
      // than a sentence, because the difference between them is the one thing
      // this card is trying to say about lending.
      h('div', { class: 'stack-8 hero-aside' },
        h('span', { class: 't-caps subtle', text: 'Including what you lent' }),
        h('span', { class: 't-display', text: money(total) }),
        h('span', { class: 'muted',
          text: 'Borrowing is credit rather than balance, so it is not in either figure.' }))),

    h('div', { class: 'hero-bar', ariaLabel: 'How your money is arranged' },
      ...parts.map((p) =>
        h('span', { class: 'seg ' + p.cls, style: { flex: String(Math.max(p.value, 1)) },
          ariaLabel: `${name(p.key)} ${figure(p)}`,
          title: `${name(p.key)} — ${figure(p)}` }))),

    // The legend and the balance list, which were the same list. A dot to tie
    // each row to its width, the name, what it is or where it travels, the
    // figure, and what that is in the other currency.
    h('div', { class: 'hero-rows' },
      ...parts.map((p) => {
        const nets = p.key === 'lent' ? [] : netsFor(p.key)
        return h('div', { class: 'hero-row ' + p.cls },
          h('span', { class: 'dot ' + p.cls }),
          h('span', { class: 'two-line grow' },
            h('span', { class: 't-body-strong', text: name(p.key) }),
            h('small', { text: p.key === 'lent'
              ? 'Paying ' + state.rates.lend + '% a year'
              : nets.length ? nets.map((n) => n.name).join(' · ') : assetOf(p.key)!.what })),
          h('span', { class: 'two-line right' },
            h('span', { class: 't-body-strong', text: figure(p) }),
            h('small', { class: 'muted', text: p.key === 'lent'
              ? moneyNaira(p.value * state.ngnPerUsd)
              : balanceAlso(p.key) })))
      }))
  )
}

/** What you could put to work, which is not a balance. */
function buyingPowerCard(): HTMLElement {
  return card(
    cardHead('Buying power', headLink('Borrow & Lend', '/grow')),
    h('span', { class: 't-display', text: money(buyingPower()) }),
    h('span', { class: 'muted',
      text: `Your cash plus the ${money(availableToBorrow())} your shares would lend `
        + 'against. Credit, not balance.' }))
}

/** What is left of the month, and what is stopping you.
 *
 *  It was four rows of a table in a plain panel beside another plain panel —
 *  four numbers of equal weight, none of which was the one anybody wants. On
 *  an unverified account this card is the thing that actually stops a payment,
 *  and it looked exactly like the list of bank accounts next to it.
 *
 *  The figure is what is left, because that is the question. The bar is how
 *  much of the month has gone, which no arrangement of four numbers can show
 *  as fast. And unverified it takes the same tint as the reminder on Home,
 *  because it is the same subject and one of them should not be a notice while
 *  the other is furniture. Verified there is nothing to lift, so it goes calm:
 *  a limit you are not near is information, not a warning. */
function limitsCard(): HTMLElement {
  const done = verified()
  const left = leftThisMonth()
  const c = card(
    cardHead('Your limits',
      h('span', { class: 'pill' + (done ? ' pos' : ' warn'), text: done ? 'Verified' : 'Not verified' })),
    h('div', { class: 'stack-8' },
      h('span', { class: 't-display', text: money(left) }),
      h('span', { class: 'muted',
        text: `left of your ${usd(limits().monthly, false)} this month` }),
      spentBar(state.usedThisMonth, limits().monthly, done ? '' : 'warn')),
    kv('Used this month', money(state.usedThisMonth)),
    kv('One payment', usd(limits().single, false)),
    // The card that states a limit is the place to lift it.
    done
      ? callout('These reset on the first of the month.')
      : h('button', { class: 'btn btn-primary', text: 'Verify to lift these',
          on: { click: () => go('/verify') } }))
  if (!done) c.classList.add('limits-open')
  return c
}

export function walletScreen(): HTMLElement {
  return shell(
    'wallet',
    // No eyebrow: it printed buying power 60px above the card that prints
    // buying power, which reads as two facts rather than one repeated.
    pageHeader('Wallet'),
    // The hero takes the whole column. It is the centrepiece of the page, and
    // sharing the width with the limits card left the two figures in it 20px
    // from wrapping onto separate lines — which they did, once the column came
    // in to the 1008 the file draws.
    cashHero(),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        // Two doors: money in and money out. Receive was a third, and it was
        // the same question as Add money asked twice — how does money get into
        // this wallet. It is a way inside the one door now.
        //
        // Both doors are addresses. Add money opened a dialog in place, on the
        // argument that handing over an account number needs no screen change
        // — true of the account number, and not true of the question in front
        // of it. There are three ways in, and 11g.61 made both doors ask which
        // one before answering: on a phone that ask is a sheet over this
        // screen, and on a wide one it is the rail beside the panel. A door
        // that skipped the question left Add money answering it two different
        // ways depending on which control you pressed.
        //
        // They lead the column rather than spanning the page. Full width they
        // were two 660px cards holding one line each, and a door twice the
        // width of the list it sits above reads as the page's subject rather
        // than as a way out of it. The column is the width of what they act on.
        h('div', { class: 'row equal' },
          way('Add money', 'A bank, a stablecoin or a card', icon.receive(), '/addmoney'),
          way('Send', 'To a person, a wallet or a bank', icon.send(), '/send')),
        moved()),
      h('div', { class: 'stack col-side' },
        // Beside the limits, because both are about what you may spend rather
        // than what you hold, and the other thing about credit already lives
        // here.
        buyingPowerCard(),
        limitsCard(),
        card(
          cardHead('Payment methods', h('button', { class: 'link', text: 'Add a bank', on: { click: () => openSheet('banks') } })),
          ...state.banks.map((b) =>
            kv(b.name, '•••• ' + b.last4)),
          h('button', { class: 'link quiet', text: 'Manage banks', on: { click: () => openSheet('banks') } })
        )))
  )
}
