import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, headLink, kv, callout, amount, directionMark } from '../components/bits'
import { state, buyingPower, availableToBorrow, nairaAside, limits, leftThisMonth, verified } from '../state'
import { usd, when, activityLabel } from '../format'
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
 *  made of. Cash and what is working in Earn, drawn to scale so the
 *  proportions are readable at a glance.
 *
 *  What is deliberately not in the bar is what the shares would lend against.
 *  It used to be a third segment, which made a credit limit look like a third
 *  kind of balance and let the caption total all three: "$5,200.00 in total"
 *  on an account holding $3,720. Money you have and money you could owe do not
 *  add up, and a single bar said they did. Borrowing capacity is still on the
 *  screen — it is what turns the balance into buying power — but it is named
 *  as borrowing, on its own line, beside a figure that says so. */
function cashHero(): HTMLElement {
  const parts = [
    { label: 'Cash', value: state.cash, cls: 'a', hint: 'Ready to spend or send' },
    { label: 'In Earn', value: state.inEarn, cls: 'b', hint: 'Earning ' + state.rates.earn + '% a year' },
  ]
  const total = parts.reduce((t, p) => t + p.value, 0)

  return h('section', { class: 'card hero-cash' },
    h('div', { class: 'hero-top' },
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Cash you can spend' }),
        h('span', { class: 'hero-figure', text: usd(state.cash) }),
        nairaAside(state.cash)
          ? h('span', { class: 'muted', text: nairaAside(state.cash)! })
          : null),
      h('div', { class: 'stack-8 hero-aside' },
        h('span', { class: 't-caps subtle', text: 'Buying power' }),
        h('span', { class: 't-display', text: usd(buyingPower()) }),
        h('span', { class: 'muted',
          text: `Your cash plus the ${usd(availableToBorrow())} your shares would lend against` }))),

    h('div', { class: 'hero-bar', ariaLabel: 'How your money is arranged' },
      ...parts.map((p) =>
        h('span', { class: 'seg ' + p.cls, style: { flex: String(Math.max(p.value, 1)) },
          ariaLabel: `${p.label} ${usd(p.value)}`,
          title: `${p.label} — ${usd(p.value)}. ${p.hint}.` }))),

    h('div', { class: 'hero-legend' },
      ...parts.map((p) =>
        h('div', { class: 'leg' },
          h('span', { class: 'dot ' + p.cls }),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: `${p.label} ${usd(p.value)}` }),
            h('small', { text: p.hint }))))),

    h('span', { class: 'subtle t-caption',
      text: `${usd(total)} in total across your wallet and Earn. Borrowing is credit, not balance, so it is not in this figure.` })
  )
}

export function walletScreen(): HTMLElement {
  const pending = state.activity.filter((a) => !a.settled)

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
        h('div', { class: 'row equal' },
          way('Add money', 'Naira in, dollars out', icon.receive(), '/addmoney'),
          way('Send', 'Pay anyone, for nothing', icon.send(), '/send'),
          way('Withdraw', 'Dollars out to your bank', icon.convert(), '/withdraw')),
        card(
          cardHead('Still settling', headLink('See all', '/activity')),
          pending.length
            ? h('div', { class: 'stack-12' }, ...pending.map((a) =>
                h('div', { class: 'kv' },
                  h('span', { class: 'who' }, directionMark(a.amount),
                    h('span', { class: 'two-line' },
                      h('span', { class: 't-body-strong', text: activityLabel(a) }),
                      h('small', { text: when(a.at) }))),
                  amount(a.amount))))
            : h('span', { class: 'muted', text: 'Nothing is in flight. Everything you have sent or received has landed.' })
        )),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('Your limits'),
          kv('Monthly', usd(limits().monthly, false)),
          kv('Used this month', usd(state.usedThisMonth)),
          kv('Left this month', usd(leftThisMonth())),
          kv('One payment', usd(limits().single, false)),
          // The card that states a limit is the place to lift it.
          verified()
            ? callout('These are the verified limits. They reset on the first of the month.')
            : h('button', { class: 'btn btn-primary btn-sm', text: 'Verify to lift these',
                on: { click: () => go('/verify') } })
        ),
        card(
          cardHead('Payment methods', h('button', { class: 'link', text: 'Add a bank', on: { click: () => openSheet('banks') } })),
          ...state.banks.map((b) =>
            kv(b.name, '•••• ' + b.last4)),
          h('button', { class: 'link quiet', text: 'Manage banks', on: { click: () => openSheet('banks') } })
        )))
  )
}
