import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

import { h, markFocus, restoreFocus, markScroll, restoreScroll, type FocusMark } from './ui'
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
import { noteRoute } from './whence'
import {
  growScreen, borrowScreen, repayScreen, earnScreen, takeOutScreen,
  lendingScreen, borrowingScreen,
} from './screens/grow'
import { historyScreen } from './screens/history'
import { accountScreen } from './screens/settings'
import { statementScreen } from './screens/statement'
import { adminScreen } from './screens/admin'
import { signInScreen, signUpScreen } from './screens/auth'
import { sendScreen, receiveScreen, addMoneyScreen, withdrawScreen, sendSharesScreen } from './screens/money'
import { convertScreen, convertEntryScreen } from './screens/convert'
import { spendScreen } from './screens/spend'
import { indexScreen } from './screens/index-page'
import { listScreen } from './screens/lists'
import { allScreen } from './screens/all'
import { welcomeScreen } from './screens/welcome'
import { verifyScreen } from './screens/verify'
import { disclosuresScreen } from './screens/disclosures'
import { bucketScreen } from './screens/bucket'
import { lockScreen } from './screens/lock'

const app = document.getElementById('app')!

function notFound(path: string): HTMLElement {
  return h('main', { class: 'auth' },
    h('div', { class: 'auth-card' },
      h('h1', { class: 't-title flush', text: 'No screen at that address' }),
      h('p', { class: 'muted flush', text: path }),
      h('button', { class: 'btn btn-primary', text: 'Go home', on: { click: () => go('/') } })))
}

/** Flat routes first, then the two that nest. Everything the product can show
 *  is reachable from this table, which is what makes every button honest. */
const FLAT: Record<string, () => HTMLElement> = {
  transfer: walletScreen,
  activity: historyScreen,
  wallet: walletScreen,
  history: historyScreen,
  // Withdraw was one errand and it was Send with the destination already
  // answered. It still resolves, to the bank rail: an address somebody
  // bookmarked should not break because the product learned to count the
  // errand properly.
  //
  // Convert used to resolve here too, on the same argument — and it was the
  // wrong argument, because converting is not sending. Paying naira to a bank
  // converts on the way past; it also empties the balance and involves
  // somebody else's account, neither of which is what the word means. It is a
  // place of its own now, and it nests, so it is not in this table.
  withdraw: withdrawScreen,
  receive: receiveScreen,
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
  // The ops console. Its own place, because it is not this person's account.
  if (a === 'admin') return adminScreen()
  // Send is three ways, each with an address of its own, so it nests. The bare
  // /send still resolves, to the rail with nothing chosen yet.
  if (a === 'send') return sendScreen(b)
  // Spend is three ways, each with an address of its own, so it nests the
  // same way. The bare /spend is the place: the three ways, and what you
  // have already paid for.
  if (a === 'spend') return spendScreen(b)
  if (a === 'addmoney') return addMoneyScreen(b)
  // Convert is a pair, and both halves are in the address: /convert/usdc/ngn.
  // Half a pair, or a pair of one thing, resolves to the nearest sensible
  // whole one rather than refusing — the screen normalises and replaces.
  if (a === 'convert') return b ? convertScreen(b, c) : convertEntryScreen()
  if (a === 'account') return accountScreen(b)
  if (a === 'security') return accountScreen('security')
  if (a === 'support') return accountScreen('support')

  if (a === 'market' || a === 'invest') {
    if (!b) return marketScreen()
    // The three indices. `index` rather than a bare key, because everything
    // else under /invest is something you can hold and an index is not.
    if (b === 'index') return indexScreen(c)
    // The groupings Invest ends in, opened out. `list` for the same reason as
    // `index`: everything else under /invest is a thing you can hold.
    if (b === 'list') return listScreen(c)
    if (c === 'invest') return investScreen(b)
    if (c === 'sell') return sellScreen(b)
    if (c === 'send') return sendSharesScreen(b)
    return stockScreen(b)
  }

  if (a === 'grow') {
    if (!b) return growScreen()
    // The two positions. The buttons on the cards lead here rather than
    // straight into a composer: somebody with an open loan came to look at it,
    // not to take another one.
    if (b === 'lending') return lendingScreen()
    if (b === 'borrowing') return borrowingScreen()
    if (b === 'borrow') return borrowScreen()
    if (b === 'repay') return repayScreen()
    if (b === 'earn') return earnScreen()
    if (b === 'takeout') return takeOutScreen()
  }

  return notFound(r.path)
}

let lastPath = ''
let hadDialog = false
/** Whatever opened the dialog that is up now, described so it can be found
 *  again in the tree drawn after the dialog has gone. */
let opener: { path: string; mark: FocusMark } | null = null
function render(r: Route): void {
  const keepScroll = r.path === lastPath ? window.scrollY : 0
  const arrived = r.path !== lastPath
  const was = lastPath
  // What had focus, and where every scrolled box was, before the tree goes.
  // See `markFocus` in ui.ts: without this every chip, toggle and sort header
  // dropped a keyboard user back to the top of the document when pressed.
  const mark = markFocus(app)
  const scrolled = arrived ? null : markScroll(app)
  lastPath = r.path
  // Before the screen is built, because a company page reads it while it
  // builds: which grouping you came through, so its trail can say so.
  noteRoute(r)
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
  // Any dialog holds the page still, the composer's included. The composer
  // presents as a modal on a phone by drawing its own scrim inside the screen,
  // and only the registry's sheets used to lock the page — so a thumb on the
  // scrim of a phone composer scrolled the wallet underneath it.
  const open = !!sheetEl || !!app.querySelector('.scrim')
  document.documentElement.classList.toggle('is-locked', open)
  document.body.style.overflow = open ? 'hidden' : ''
  window.scrollTo(0, keepScroll)
  if (scrolled) restoreScroll(app, scrolled)

  // Say where we are, once per arrival rather than once per state change —
  // this function runs again every time anything at all changes, and a live
  // region that repeats the page title after every toggle is worse than one
  // that says nothing.
  if (arrived) nameTheScreen(app.querySelector('h1')?.textContent)

  if (open && !hadDialog) {
    // A dialog arriving takes focus for itself (see asDialog). What is kept
    // here is what opened it, so closing it can go back there.
    opener = mark ? { path: was, mark } : null
  } else if (hadDialog && !open) {
    // Where focus goes when a dialog closes: back to whatever opened it. That
    // element no longer exists — the tree was replaced — so it is found again
    // by its description. Only when it cannot be found does focus go to the
    // content of the screen, so a keyboard user carries on from the page
    // rather than from the top of the document, above seven nav rows they
    // have already passed once.
    dialogClosed()
    const back = opener && opener.path === r.path && restoreFocus(app, opener.mark)
    opener = null
    const main = app.querySelector<HTMLElement>('main.content')
    const adrift = document.activeElement === document.body || document.activeElement === null
    // Only on the same screen. A dialog that closed because the person went
    // somewhere else leaves them at the top of the new page, where the skip
    // link is the first thing Tab reaches.
    if (!back && main && adrift && !arrived) main.focus({ preventScroll: true })
  } else if (!arrived || open) {
    // The same screen drawn again, or the same dialog: the control that was
    // pressed is put back under the keyboard.
    restoreFocus(app, mark)
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
