import { h, countTo } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, headLink, kv, callout, amount, directionMark, figureWithEye, spentBar } from '../components/bits'
import { table } from '../components/table'
import { state, buyingPower, availableToBorrow, inNaira, inflightNaira, outboundNaira, rateLine, limits, leftThisMonth, verified, money } from '../state'
import { usd, naira, when, activityLabel } from '../format'
import { go, openSheet } from '../router'

function way(label: string, sub: string, ic: string, to: string): HTMLElement {
  const b = h('button', { class: 'card', style: { textAlign: 'left', flex: '1' }, on: { click: () => go(to) } })
  b.appendChild(h('div', { class: 'promo-badge', html: ic }))
  b.appendChild(h('div', { class: 'stack-8' },
    h('span', { class: 't-title', text: label }),
    h('span', { class: 'muted', text: sub })))
  return b
}

/** The centrepiece of the wallet. Not just the number: what the number is
 *  made of. Cash and what is lent out, drawn to scale so the
 *  proportions are readable at a glance.
 *
 *  What is deliberately not in the bar is what the shares would lend against.
 *  It used to be a third segment, which made a credit limit look like a third
 *  kind of balance and let the caption total all three: "$5,200.00 in total"
 *  on an account holding $3,720. Money you have and money you could owe do not
 *  add up, and a single bar said they did. Borrowing capacity is still on the
 *  screen — it is what turns the balance into buying power — but it is named
 *  as borrowing, on its own line, beside a figure that says so. */
/** The wallet's own figure, travelling rather than jumping when money moves. */
function cashFigure(): HTMLElement {
  const el = h('span', { class: 'hero-figure' })
  if (state.prefs.hideBalances) el.textContent = money(state.cash)
  else countTo(el, 'wallet.cash', state.cash, (n) => money(n))
  return el
}

/** What has actually moved through this wallet.
 *
 *  The screen listed what is still in flight — which is usually nothing — and
 *  then stopped, leaving a column that ended 160px above the one beside it. It
 *  was also the only screen in the product about your cash that never showed
 *  what happened to it: Home has a recent list, the wallet did not. The empty
 *  space and the missing list were the same hole. */
function moved(): HTMLElement {
  const rows = state.activity.filter((a) => a.kind === 'payment').slice(0, 6)
  return card(
    cardHead('Money in and out', headLink('See all', '/activity?filter=payments')),
    rows.length
      ? table(
          [{ key: 'who', label: 'Who' }, { key: 'when', label: 'When', optional: true },
           { key: 'ref', label: 'Reference', optional: true }, { key: 'amt', label: 'Amount', align: 'right' }],
          rows.map((a) => [
            h('span', { class: 'who' }, directionMark(a.amount),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: activityLabel(a) }),
                h('small', { class: 'phone-only', text: when(a.at) }))),
            h('span', { class: 'muted', text: when(a.at) }),
            h('span', { class: 'muted', text: a.ref }),
            amount(a),
          ]),
          (i) => openSheet('receipt', { ref: rows[i].ref })
        )
      : h('span', { class: 'muted', text: 'Nothing has moved through this wallet yet.' })
  )
}

function cashHero(): HTMLElement {
  const parts = [
    { label: 'Cash', value: state.cash, cls: 'a', hint: 'Ready to spend or send' },
    { label: 'Lent out', value: state.lent, cls: 'b', hint: 'Paying ' + state.rates.lend + '% a year' },
  ]
  const total = parts.reduce((t, p) => t + p.value, 0)

  return h('section', { class: 'card hero-cash' },
    h('div', { class: 'hero-top' },
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Cash you can spend' }),
        figureWithEye(cashFigure()),
        inNaira(state.cash)
          ? h('span', { class: 'stack-8' },
              h('span', { class: 'muted', text: inNaira(state.cash)! }),
              // The rate, its time and what it is: the one number here that a
              // person cannot check for themselves, so it says where it came
              // from rather than appearing as a fact of nature.
              h('span', { class: 'subtle t-caption', text: rateLine() }))
          : null),
      h('div', { class: 'stack-8 hero-aside' },
        h('span', { class: 't-caps subtle', text: 'Buying power' }),
        h('span', { class: 't-display', text: money(buyingPower()) }),
        h('span', { class: 'muted',
          text: `Your cash plus the ${money(availableToBorrow())} your shares would lend against` }))),

    h('div', { class: 'hero-bar', ariaLabel: 'How your money is arranged' },
      ...parts.map((p) =>
        h('span', { class: 'seg ' + p.cls, style: { flex: String(Math.max(p.value, 1)) },
          ariaLabel: `${p.label} ${money(p.value)}`,
          title: `${p.label} — ${money(p.value)}. ${p.hint}.` }))),

    h('div', { class: 'hero-legend' },
      ...parts.map((p) =>
        h('div', { class: 'leg' },
          h('span', { class: 'dot ' + p.cls }),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: `${p.label} ${money(p.value)}` }),
            h('small', { text: p.hint }))))),

    h('span', { class: 'subtle t-caption',
      text: `${money(total)} in total across your wallet and what you have lent. Borrowing is credit, not balance, so it is not in this figure.` })
  )
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
  const pending = state.activity.filter((a) => !a.settled)
  const flight = inflightNaira()
  const outbound = outboundNaira()

  return shell(
    'wallet',
    // No eyebrow: it printed buying power 60px above the card that prints
    // buying power, which reads as two facts rather than one repeated.
    pageHeader('Transfer'),
    // The hero takes the whole column. It is the centrepiece of the page, and
    // sharing the width with the limits card left the two figures in it 20px
    // from wrapping onto separate lines — which they did, once the column came
    // in to the 1008 the file draws.
    cashHero(),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        // Two doors, not three. Withdraw was Send with the destination already
        // answered, and a third tile for it made one errand look like two.
        h('div', { class: 'row equal' },
          way('Add money', 'Naira in, dollars out', icon.receive(), '/addmoney'),
          way('Send', 'To a person, a wallet or a bank', icon.send(), '/send')),
        card(
          cardHead('Still settling', headLink('See all', '/activity')),
          // What is genuinely between two banks, named in the currency it is
          // sitting in. It is the balance of the account the money waits in
          // rather than a total of the rows below, so a wallet that has not
          // gone up and a figure that says why cannot disagree.
          flight > 0
            ? h('div', { class: 'kv' },
                h('span', { class: 't-caps subtle', text: 'On its way to us' }),
                h('span', { class: 't-body-strong', text: naira(flight) }))
            : null,
          // And the other direction. Dollars that have left the wallet but
          // whose naira have not reached anybody's bank are in an account with
          // a name, not in a state of hopefulness.
          outbound > 0
            ? h('div', { class: 'kv' },
                h('span', { class: 't-caps subtle', text: 'On its way out' }),
                h('span', { class: 't-body-strong', text: naira(outbound) }))
            : null,
          pending.length
            ? h('div', { class: 'stack-12' }, ...pending.map((a) =>
                h('div', { class: 'kv' },
                  h('span', { class: 'who' }, directionMark(a.amount),
                    h('span', { class: 'two-line' },
                      h('span', { class: 't-body-strong', text: activityLabel(a) }),
                      h('small', { text: when(a.at) }))),
                  amount(a))))
            : h('span', { class: 'muted', text: 'Nothing is in flight. Everything you have sent or received has landed.' })
        ),
        moved()),
      h('div', { class: 'stack col-side' },
        limitsCard(),
        card(
          cardHead('Payment methods', h('button', { class: 'link', text: 'Add a bank', on: { click: () => openSheet('banks') } })),
          ...state.banks.map((b) =>
            kv(b.name, '•••• ' + b.last4)),
          h('button', { class: 'link quiet', text: 'Manage banks', on: { click: () => openSheet('banks') } })
        )))
  )
}
