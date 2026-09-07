import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

import { h } from './ui'
import { start, current, go, openSheet, type Route } from './router'
import { state, actions, subscribe, applyTheme, recall, openBooks, IDLE_LOCK_MS } from './state'
import { onBreakpointChange } from './responsive'
import { buildSheet } from './sheets'
import { dialogClosed } from './components/sheet'
import { nameTheScreen } from './announce'
import { homeScreen } from './screens/home'
import { walletScreen } from './screens/wallet'
import { marketScreen } from './screens/market'
import { stockScreen } from './screens/stock'
import { investScreen, sellScreen } from './screens/invest'
import { growScreen, borrowScreen, repayScreen, earnScreen, takeOutScreen } from './screens/grow'
import { historyScreen } from './screens/history'
import { accountScreen } from './screens/settings'
import { statementScreen } from './screens/statement'
import { signInScreen, signUpScreen } from './screens/auth'
import { sendScreen, receiveScreen, addMoneyScreen, withdrawScreen, sendSharesScreen } from './screens/money'
import { allScreen } from './screens/all'
import { welcomeScreen } from './screens/welcome'
import { verifyScreen } from './screens/verify'
import { disclosuresScreen } from './screens/disclosures'
import { bucketScreen } from './screens/bucket'
import { lockScreen } from './screens/lock'

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
  wallet: walletScreen,
  history: historyScreen,
  send: sendScreen,
  // Withdraw and Convert were one errand each and both were Send with the
  // destination already answered. They still resolve, to the bank rail: an
  // address somebody bookmarked should not break because the product learned
  // to count the errand properly.
  withdraw: withdrawScreen,
  convert: withdrawScreen,
  receive: receiveScreen,
  addmoney: addMoneyScreen,
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
  // The lock is about the device, so it comes before everything the account
  // can see — the intro included. The address is left alone underneath it, so
  // unlocking lands on the deep link somebody actually followed rather than
  // dropping them on Home.
  if (state.security.appLock && !state.unlocked) return lockScreen()
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
  if (a === 'statement') return statementScreen()
  if (a === 'account') return accountScreen(b)
  if (a === 'security') return accountScreen('security')
  if (a === 'support') return accountScreen('support')

  if (a === 'market' || a === 'invest') {
    if (!b) return marketScreen()
    if (c === 'invest') return investScreen(b)
    if (c === 'sell') return sellScreen(b)
    if (c === 'send') return sendSharesScreen(b)
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
let hadDialog = false
function render(r: Route): void {
  const keepScroll = r.path === lastPath ? window.scrollY : 0
  const arrived = r.path !== lastPath
  lastPath = r.path
  app.replaceChildren(screenFor(r))
  const screen = app.firstElementChild as HTMLElement | null
  const sheetEl = buildSheet(r)
  if (sheetEl) {
    // Everything under the dialog leaves the tab order and the accessibility
    // tree while it is up. A composer that presents as a modal does this for
    // itself, since its scrim lives inside the screen rather than beside it.
    screen?.setAttribute('inert', '')
    app.appendChild(sheetEl)
  }
  document.body.style.overflow = sheetEl ? 'hidden' : ''
  window.scrollTo(0, keepScroll)

  // Say where we are, once per arrival rather than once per state change —
  // this function runs again every time anything at all changes, and a live
  // region that repeats the page title after every toggle is worse than one
  // that says nothing.
  if (arrived) nameTheScreen(app.querySelector('h1')?.textContent)

  // Where focus goes when a dialog closes. It cannot go back to whatever
  // opened it: this app replaces the entire tree on every change, so that
  // element no longer exists by the time the dialog is gone. The content of
  // the screen underneath is the honest answer — a keyboard user carries on
  // from the page rather than from the top of the document, above seven nav
  // rows they have already passed once.
  const open = !!sheetEl || !!app.querySelector('.scrim')
  if (hadDialog && !open) {
    dialogClosed()
    const main = app.querySelector<HTMLElement>('main.content')
    if (main && (document.activeElement === document.body || document.activeElement === null)) main.focus()
  }
  hadDialog = open
}

/** A lock that only fires on a cold start protects a phone that has been
 *  turned off, which is not the phone anybody loses. Two minutes away and it
 *  asks again — the tab being hidden is the closest this has to a pocket. */
let hiddenAt = 0
addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); return }
  if (!hiddenAt) return
  const away = Date.now() - hiddenAt
  hiddenAt = 0
  if (state.security.appLock && state.unlocked && away > IDLE_LOCK_MS) actions.lock()
})

/** Command K anywhere opens the jump-to overlay, and does not fight the
 *  browser's own find. Registered once, not per render. */
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (current().sheet !== 'jump') openSheet('jump')
  }
})

// The one genuinely asynchronous fact in the product: whether there is a
// connection. On a Lagos commute this changes several times a trip, and a
// money app that does not notice will happily tell somebody a payment went
// through while the phone was holding no signal at all.
addEventListener('online', () => actions.setOnline(true))
addEventListener('offline', () => actions.setOnline(false))

openBooks()
recall()
applyTheme()
subscribe(() => render(current()))
onBreakpointChange(() => render(current()))
start(render)
