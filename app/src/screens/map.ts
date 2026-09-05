import { h, link } from '../ui'
import { card, cardHead } from '../components/bits'
import { state } from '../state'

/** Not part of the product. A single page that lists every address the app
 *  answers to, so the whole thing can be reviewed without hunting for the
 *  button that opens each one. */
const SCREENS: [string, [string, string][]][] = [
  ['The way in', [
    ['/signin', 'Sign in'],
    ['/signup', 'Create account'],
  ]],
  ['Home', [
    ['/', 'Home, whichever view is set'],
  ]],
  ['Wallet and money', [
    ['/wallet', 'Wallet'],
    ['/addmoney', 'Buy dollars'],
    ['/send', 'Send money'],
    ['/receive', 'Receive money'],
    ['/convert', 'Convert to naira'],
  ]],
  ['Market and stocks', [
    ['/market', 'Market'],
    ['/market/aapl', 'A company page'],
    ['/market/aapl/invest', 'Invest'],
    ['/market/aapl/sell', 'Sell'],
  ]],
  ['Grow', [
    ['/grow', 'Grow'],
    ['/grow/earn', 'Move money into Earn'],
    ['/grow/takeout', 'Take money out of Earn'],
    ['/grow/borrow', 'Borrow'],
    ['/grow/repay', 'Repay'],
  ]],
  ['History', [
    ['/history', 'History, everything'],
    ['/history?filter=payments', 'History, payments'],
    ['/history?filter=trades', 'History, trades'],
    ['/history?filter=grow', 'History, Grow'],
  ]],
  ['You', [
    ['/account', 'Account'],
    ['/security', 'Security'],
    ['/support', 'Support'],
  ]],
]

const SHEETS: [string, [string, string][]][] = [
  ['Reviews and outcomes', [
    ['/send?sheet=send-review&v=120&to=Adaeze%20Okonkwo', 'Send review'],
    ['/addmoney?sheet=add-review&v=200', 'Buy dollars review'],
    ['/convert?sheet=convert-review&v=300', 'Convert review'],
    ['/market/aapl/invest?sheet=invest-review&v=500&t=AAPL', 'Invest review'],
    ['/market/aapl/sell?sheet=sell-review&v=250&t=AAPL', 'Sell review'],
    ['/grow/borrow?sheet=borrow-review&v=1150', 'Borrow review'],
    ['/grow/repay?sheet=repay-review&v=200', 'Repay review'],
    ['/grow/earn?sheet=earn-review&v=500', 'Earn review'],
    ['/grow/takeout?sheet=takeout-review&v=300', 'Take out review'],
  ]],
  ['Records', [
    ['/history?sheet=receipt&ref=' + state.activity[0].ref, 'Receipt'],
    ['/history?sheet=export', 'Export'],
  ]],
  ['You', [
    ['/account?sheet=edit&field=email', 'Change your email'],
    ['/account?sheet=edit&field=phone', 'Change your mobile number'],
    ['/account?sheet=edit&field=address', 'Change your address'],
    ['/account?sheet=close', 'Close your account'],
    ['/security?sheet=pin', 'Change your PIN'],
    ['/security?sheet=phrase', 'Recovery phrase, hidden'],
    ['/security?sheet=phrase-shown', 'Recovery phrase, shown'],
    ['/wallet?sheet=banks', 'Your banks'],
    ['/wallet?sheet=card', 'Join the card list'],
    ['/support?sheet=contact', 'Email us'],
  ]],
]

function group(title: string, rows: [string, string][]): HTMLElement {
  return card(
    cardHead(title),
    ...rows.map(([to, label]) =>
      link(to, 'kv',
        h('span', { class: 't-body-strong', text: label }),
        h('span', { class: 'muted t-caption', text: to })))
  )
}

export function mapScreen(): HTMLElement {
  return h('div', { class: 'content', style: { maxWidth: '1100px', margin: '0 auto' } },
    h('header', { class: 'stack-8' },
      h('h1', { class: 't-title', style: { margin: '0' }, text: 'Every address in the app' }),
      h('p', { class: 'muted', style: { margin: '0' },
        text: 'A sheet is an address too, so any step of any flow can be opened, linked and reloaded on its own.' })),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' } },
      ...SCREENS.map(([t, rows]) => group(t, rows))),
    h('h2', { class: 't-caps subtle', style: { margin: '8px 0 0' }, text: 'Sheets' }),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' } },
      ...SHEETS.map(([t, rows]) => group(t, rows))),
    link('/', 'btn btn-quiet', 'Back to the product'))
}
