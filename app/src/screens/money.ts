import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead, kv, callout } from '../components/bits'
import { composerScreen } from '../components/composer'
import { state } from '../state'
import { walletScreen } from './wallet'
import { usd, naira, when } from '../format'
import { openSheet, current, go } from '../router'
import { isMobile } from '../responsive'
import { toast } from '../components/sheet'

const PEOPLE = ['Adaeze Okonkwo', 'Tunde Bakare', 'Chidi Nwosu', 'Ngozi Eze']

const initials = (name: string) => name.split(' ').map((s) => s[0]).join('')

/** When someone was last paid, so the list is ordered by memory rather than
 *  alphabet. Nothing beats "the person you paid on Tuesday". */
function lastPaid(name: string): string {
  const a = state.activity.find((x) => x.who === name && x.kind === 'payment')
  return a ? (a.amount < 0 ? 'You sent ' : 'They sent ') + usd(Math.abs(a.amount)) + ' · ' + when(a.at) : 'No payments yet'
}

/** Step one of Send on a phone. There is no second column to hold the list,
 *  so who comes first and how much follows as a sheet. Figma M07. */
export function sendWhoScreen(): HTMLElement {
  const rows = [...PEOPLE]
    .sort((a, b) => {
      const ia = state.activity.findIndex((x) => x.who === a)
      const ib = state.activity.findIndex((x) => x.who === b)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
    })
    .map((p) =>
      h('button', {
        class: 'sheet-row',
        on: { click: () => go('/send?to=' + encodeURIComponent(p)) },
      },
        h('span', { class: 'avatar', text: initials(p) }),
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: p }),
          h('small', { text: lastPaid(p) })),
        h('span', { class: 'muted', html: icon.chevron() })))

  const address = h('input', { placeholder: 'Paste a Base address' })

  return shell(
    'wallet',
    pageHeader('Send money', eyebrow('Cash available', usd(state.cash))),
    h('label', { class: 'field' },
      h('span', { html: icon.search() }),
      h('input', { placeholder: 'Search a name' })),
    card(
      cardHead('People you can pay'),
      h('div', { class: 'sheet-list' }, ...rows)
    ),
    card(
      cardHead('Or send to an address'),
      h('label', { class: 'field' }, address),
      h('button', {
        class: 'btn btn-quiet', text: 'Continue',
        on: {
          click: () => {
            const v = address.value.trim()
            if (v.length < 8) { toast('Paste a full Base address'); return }
            go('/send?to=' + encodeURIComponent(v.slice(0, 6) + '…' + v.slice(-4)))
          },
        },
      }),
      callout('Base network only. Sending any other asset to this address loses it.', 'warning')
    )
  )
}

export function sendScreen(): HTMLElement {
  const r = current()
  const chosen = r.query.get('to')
  // On a phone, who comes first. On desktop the list is the right column.
  if (isMobile() && !chosen && !r.sheet) return sendWhoScreen()
  const to = chosen ?? PEOPLE[0]
  return composerScreen({
    place: 'wallet',
    base: walletScreen,
    title: 'Send money',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Cash ' + usd(state.cash),
    initial: Math.min(120, state.cash),
    max: state.cash,
    note: 'Arrives in under a minute, any day of the week.',
    quick: [
      { label: usd(20, false), value: 20 },
      { label: usd(50, false), value: 50 },
      { label: usd(120, false), value: 120 },
      { label: 'All', value: state.cash },
    ],
    summary: () => [
      ['To', to],
      ['Fee', 'Nothing, Tokkenly covers it'],
      ['Arrives', 'In about a minute'],
      ['Network', 'Base'],
    ],
    callout: 'Payments run every day of the year, including public holidays.',
    action: (v) => 'Send ' + usd(v),
    onAction: (v) => openSheet('send-review', { v: String(v), to }),
    right: () =>
      card(
        cardHead('Who it goes to'),
        ...PEOPLE.map((p) =>
          h('button', {
            class: 'kv',
            style: { textAlign: 'left', width: '100%' },
            on: { click: () => go('/send?to=' + encodeURIComponent(p)) },
          },
            h('span', { class: 'who' },
              h('span', { class: 'avatar', text: initials(p) }),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: p }),
                h('small', { text: lastPaid(p) }))),
            h('span', { class: p === to ? 'pos t-body-strong' : 'muted', text: p === to ? 'Selected' : 'Pick' }))),
        callout('Only people already in your list can be paid without a second check.')
      ),
  })
}

export function receiveScreen(): HTMLElement {
  const address = '0x7a3F4b91Ce2D8a06F5b17d3E4c8B29aA5f0e9c21'
  const qr = h('div', {
    style: {
      width: '220px', height: '220px', borderRadius: '16px', background: 'var(--inverse)',
      display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: '2px', padding: '14px',
    },
  })
  let seed = 42
  for (let i = 0; i < 121; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    const on = seed % 100 > 45
    qr.appendChild(h('span', { style: { background: on ? '#0a0a0c' : 'transparent', borderRadius: '2px' } }))
  }

  return shell(
    'wallet',
    pageHeader('Receive money', eyebrow('Cash available', usd(state.cash))),
    h('div', { class: 'row' },
      card(
        cardHead('Your address'),
        h('div', { style: { display: 'grid', placeItems: 'center', padding: '8px 0' } }, qr),
        h('p', { class: 'muted', style: { margin: '0', wordBreak: 'break-all' }, text: address }),
        h('button', {
          class: 'btn btn-filled', text: 'Copy the address',
          on: {
            click: () => {
              navigator.clipboard?.writeText(address).catch(() => undefined)
              toast('Address copied')
            },
          },
        })
      ),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('How to use it'),
          kv('Network', 'Base only'),
          kv('Asset', 'USDC'),
          kv('Arrives', 'Usually within a minute'),
          kv('Fee', 'Nothing on our side'),
          callout('Base network only. Sending any other asset to this address loses it.', 'warning')
        ),
        card(
          cardHead('Or ask by name'),
          h('span', { class: 'muted', text: 'Anyone already on Tokkenly can pay you by searching your name. They do not need the address.' }),
          h('button', { class: 'btn btn-quiet', text: 'Share my name', on: { click: () => toast('Sharing sheet would open here') } })
        )))
  )
}

export function addMoneyScreen(): HTMLElement {
  const bank = state.banks[0]
  return composerScreen({
    place: 'wallet',
    base: walletScreen,
    title: 'Buy dollars',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Minimum ' + usd(10, false),
    initial: 200,
    max: 5000,
    note: 'Pay from your bank in naira, receive dollars.',
    quick: [
      { label: usd(50, false), value: 50 },
      { label: usd(100, false), value: 100 },
      { label: usd(200, false), value: 200 },
      { label: usd(500, false), value: 500 },
    ],
    summary: (v) => [
      ['You pay', naira(v * state.ngnPerUsd)],
      ['Rate', '1 dollar = ' + naira(state.ngnPerUsd)],
      ['From', bank.name + ' •••• ' + bank.last4],
      ['Lands', 'In about a minute'],
    ],
    callout: 'The rate is held for ninety seconds once you confirm.',
    action: (v) => 'Buy ' + usd(v),
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
  })
}

export function convertScreen(): HTMLElement {
  const bank = state.banks[0]
  return composerScreen({
    place: 'wallet',
    base: walletScreen,
    title: 'Convert to naira',
    eyebrow: ['Cash available', usd(state.cash)],
    cardLabel: 'How much',
    cardRight: 'Cash ' + usd(state.cash),
    initial: Math.min(300, state.cash),
    max: state.cash,
    note: 'Dollars out of your wallet, naira into your bank.',
    quick: [
      { label: usd(50, false), value: 50 },
      { label: usd(100, false), value: 100 },
      { label: usd(300, false), value: 300 },
      { label: 'All', value: state.cash },
    ],
    summary: (v) => [
      ['You get', naira(v * state.ngnPerUsd)],
      ['Rate', '1 dollar = ' + naira(state.ngnPerUsd)],
      ['Into', bank.name + ' •••• ' + bank.last4],
      ['Arrives', 'Usually within a minute'],
    ],
    callout: 'Payouts run every day. Weekend transfers can take a few minutes longer.',
    action: (v) => 'Convert ' + usd(v),
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
  })
}
