import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead, headLink, kv, callout, amount, directionMark } from '../components/bits'
import { state, buyingPower, availableToBorrow } from '../state'
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

export function walletScreen(): HTMLElement {
  const pending = state.activity.filter((a) => !a.settled)

  return shell(
    'wallet',
    pageHeader('Wallet', eyebrow('Buying power', usd(buyingPower()))),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          cardHead('Cash you can spend'),
          h('span', { class: 't-display-xl', text: usd(state.cash) }),
          h('span', { class: 'muted', text: `Plus ${usd(availableToBorrow())} you could borrow against your shares.` })
        ),
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
