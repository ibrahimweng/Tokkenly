import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

import { h } from './ui'
import { start, current, go, openSheet, type Route } from './router'
import { state, subscribe, applyTheme, recall } from './state'
import { onBreakpointChange } from './responsive'
import { buildSheet } from './sheets'
import { homeScreen } from './screens/home'
import { walletScreen } from './screens/wallet'
import { marketScreen } from './screens/market'
import { stockScreen } from './screens/stock'
import { investScreen, sellScreen } from './screens/invest'
import { growScreen, borrowScreen, repayScreen, earnScreen, takeOutScreen } from './screens/grow'
import { historyScreen } from './screens/history'
import { accountScreen } from './screens/settings'
import { signInScreen, signUpScreen } from './screens/auth'
import { sendScreen, receiveScreen, addMoneyScreen, convertScreen } from './screens/money'
import { allScreen } from './screens/all'
import { welcomeScreen } from './screens/welcome'
import { verifyScreen } from './screens/verify'
import { disclosuresScreen } from './screens/disclosures'
import { bucketScreen } from './screens/bucket'

const app = document.getElementById('app')!

function notFound(path: string): HTMLElement {
  return h('div', { class: 'auth' },
    h('div', { class: 'auth-card' },
      h('h1', { class: 't-title', style: { margin: '0' }, text: 'No screen at that address' }),
      h('p', { class: 'muted', style: { margin: '0' }, text: path }),
      h('button', { class: 'btn btn-primary', text: 'Go home', on: { click: () => go('/') } })))
}

/** Flat routes first, then the two that nest. Everything the product can show
 *  is reachable from this table, which is what makes every button honest. */
const FLAT: Record<string, () => HTMLElement> = {
  transfer: walletScreen,
  activity: historyScreen,
  withdraw: convertScreen,
  wallet: walletScreen,
  history: historyScreen,
  send: sendScreen,
  receive: receiveScreen,
  addmoney: addMoneyScreen,
  convert: convertScreen,
  bucket: bucketScreen,
  disclosures: disclosuresScreen,
}

function screenFor(r: Route): HTMLElement {
  const [a, b, c] = r.parts

  // /map was the developer's route list. /all is the product's own index.
  if (a === 'map' || a === 'all') return allScreen()
  if (a === 'signin') return signInScreen()
  if (a === 'signup') return signUpScreen()
  if (!state.signedIn) return signInScreen()
  if (a === 'welcome') return welcomeScreen(Number(b ?? 0))
  if (a === 'verify') return verifyScreen(b ?? 'what')
  // The intro gates the landing route only. A deep link still goes where it
  // points: being new is not a reason to be sent somewhere you did not ask for.
  if (!a && !state.seenIntro) return welcomeScreen(0)
  if (!a) return homeScreen()

  const flat = FLAT[a]
  if (flat) return flat()

  // Account is an index with groups under it. /security and /support were
  // their own addresses before the split; they still resolve, so a bookmark,
  // a palette entry from an older session and every link already in the wild
  // land where the thing they name now lives.
  if (a === 'account') return accountScreen(b)
  if (a === 'security') return accountScreen('security')
  if (a === 'support') return accountScreen('support')

  if (a === 'market' || a === 'invest') {
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

/** Command K anywhere opens the jump-to overlay, and does not fight the
 *  browser's own find. Registered once, not per render. */
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (current().sheet !== 'jump') openSheet('jump')
  }
})

recall()
applyTheme()
subscribe(() => render(current()))
onBreakpointChange(() => render(current()))
start(render)
