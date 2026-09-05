import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead, headLink, kv, callout, amount, directionMark } from '../components/bits'
import { state, buyingPower, availableToBorrow } from '../state'
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
 *  made of. Cash, what is working in Earn, and what the shares would lend
 *  against, drawn to scale so the proportions are readable at a glance. */
function cashHero(): HTMLElement {
  const parts = [
    { label: 'Cash', value: state.cash, cls: 'a', hint: 'Ready to spend or send' },
    { label: 'In Earn', value: state.inEarn, cls: 'b', hint: 'Earning ' + state.rates.earn + '% a year' },
    { label: 'Could borrow', value: availableToBorrow(), cls: 'c', hint: 'Against the shares you own' },
  ]
  const total = parts.reduce((t, p) => t + p.value, 0)

  return h('section', { class: 'card hero-cash' },
    h('div', { class: 'hero-top' },
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Cash you can spend' }),
        h('span', { class: 'hero-figure', text: usd(state.cash) }),
        h('span', { class: 'muted', text: `About ${naira(state.cash * state.ngnPerUsd)} at today's indicative rate` })),
      h('div', { class: 'stack-8 hero-aside' },
        h('span', { class: 't-caps subtle', text: 'Buying power' }),
        h('span', { class: 't-display', text: usd(buyingPower()) }),
        h('span', { class: 'muted', text: 'Cash plus what you could borrow' }))),

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
      text: `${usd(total)} in total across your wallet, Earn and what your shares would lend against.` })
  )
}

export function walletScreen(): HTMLElement {
  const pending = state.activity.filter((a) => !a.settled)

  return shell(
    'wallet',
    pageHeader('Wallet', eyebrow('Buying power', usd(buyingPower()))),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        cashHero(),
        h('div', { class: 'row' },
          way('Add money', 'Naira in, dollars out', icon.receive(), '/addmoney'),
          way('Send', 'Pay anyone, for nothing', icon.send(), '/send'),
          way('Convert', 'Dollars out to a bank', icon.convert(), '/convert')),
        card(
          cardHead('Still settling', headLink('See all', '/history')),
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
          kv('Monthly', usd(10000, false)),
          kv('Used this month', usd(3180)),
          kv('Single payment', usd(2500, false)),
          callout('Limits lift once you have been verified for ninety days.')
        ),
        card(
          cardHead('Payment methods', h('button', { class: 'link', text: 'Add a bank', on: { click: () => openSheet('banks') } })),
          ...state.banks.map((b) =>
            kv(b.name, '•••• ' + b.last4)),
          h('button', { class: 'link quiet', text: 'Manage banks', on: { click: () => openSheet('banks') } })
        )))
  )
}
