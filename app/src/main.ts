import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

import { h } from './ui'
import { start, current, go, type Route } from './router'
import { state, subscribe } from './state'
import { buildSheet } from './sheets'
import { homeScreen } from './screens/home'
import { walletScreen } from './screens/wallet'
import { marketScreen } from './screens/market'
import { stockScreen } from './screens/stock'
import { investScreen, sellScreen } from './screens/invest'
import { growScreen, borrowScreen, repayScreen, earnScreen, takeOutScreen } from './screens/grow'
import { historyScreen } from './screens/history'
import { accountScreen, securityScreen, supportScreen } from './screens/settings'
import { signInScreen, signUpScreen } from './screens/auth'
import { sendScreen, receiveScreen, addMoneyScreen, convertScreen } from './screens/money'
import { mapScreen } from './screens/map'

const app = document.getElementById('app')!

function notFound(path: string): HTMLElement {
  return h('div', { class: 'auth' },
    h('div', { class: 'auth-card' },
      h('h1', { class: 't-title', style: { margin: '0' }, text: 'No screen at that address' }),
      h('p', { class: 'muted', style: { margin: '0' }, text: path }),
      h('button', { class: 'btn btn-filled', text: 'Go home', on: { click: () => go('/') } })))
}

/** Flat routes first, then the two that nest. Everything the product can show
 *  is reachable from this table, which is what makes every button honest. */
const FLAT: Record<string, () => HTMLElement> = {
  wallet: walletScreen,
  history: historyScreen,
  account: accountScreen,
  security: securityScreen,
  support: supportScreen,
  send: sendScreen,
  receive: receiveScreen,
  addmoney: addMoneyScreen,
  convert: convertScreen,
}

function screenFor(r: Route): HTMLElement {
  const [a, b, c] = r.parts

  if (a === 'map') return mapScreen()
  if (a === 'signin') return signInScreen()
  if (a === 'signup') return signUpScreen()
  if (!state.signedIn) return signInScreen()
  if (!a) return homeScreen()

  const flat = FLAT[a]
  if (flat) return flat()

  if (a === 'market') {
    if (!b) return marketScreen()
    if (c === 'invest') return investScreen(b)
    if (c === 'sell') return sellScreen(b)
    return stockScreen(b)
  }

  if (a === 'grow') {
    if (!b) return growScreen()
    if (b === 'borrow') return borrowScreen()
    if (b === 'repay') return repayScreen()
    if (b === 'earn') return earnScreen()
    if (b === 'takeout') return takeOutScreen()
  }

  return notFound(r.path)
}

let lastPath = ''
function render(r: Route): void {
  const keepScroll = r.path === lastPath ? window.scrollY : 0
  lastPath = r.path
  app.replaceChildren(screenFor(r))
  const sheetEl = buildSheet(r)
  if (sheetEl) app.appendChild(sheetEl)
  document.body.style.overflow = sheetEl ? 'hidden' : ''
  window.scrollTo(0, keepScroll)
}

subscribe(() => render(current()))
start(render)
