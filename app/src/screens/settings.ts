import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout, emptyState, toggle, choice, prefAction } from '../components/bits'
import { searchField, searchNote } from '../components/search'
import { rank, onlyNear } from '../match'
import { state, actions, verified, eligible, blockedBy, providersDown, LIMITS, WALLET } from '../state'
import { usd, initialsOf } from '../format'
import { openSheet, go, current } from '../router'
import { toast } from '../components/sheet'
import { isSplit } from '../responsive'

/* ------------------------------------------------------------------------
   Account is an index, not a wall.

   It carried ten cards and twenty-five controls in two columns, and the only
   way to learn what any of them was set to was to read all of them. A row
   with its value on the right answers most of those questions without a tap
   — "Notifications, 3 of 4" is the whole answer for most visits — and the
   detail lives one level down where there is room for it.

   Screen or sheet is not a coin toss. A group is a place you browse and come
   back to, so a group is a screen. A single decision with a commit — change
   the PIN, edit one field, add a bank — is a task you finish and dismiss, so
   it is a sheet. On a phone those are different gestures, and swapping them
   is what makes a settings screen feel slippery.
   ------------------------------------------------------------------------ */

interface Group {
  /** The address: /account/<key>. */
  key: string
  label: string
  ic: string
  /** What the row says on the right. The answer without the tap — so it is
   *  the current value, never a restatement of the label. */
  status: () => string
  body: () => (Node | null)[]
}

/* ---------------- personal details ---------------- */

/** A value with the one thing you would do to it. The action is on the row it
 *  belongs to rather than at the foot of the card, so "Change" can never be
 *  ambiguous about which of five lines it changes. */
function detailRow(label: string, value: string, action: string, onClick: () => void): HTMLElement {
  return h('div', { class: 'kv' },
    h('span', { text: label }),
    h('span', { class: 'kv-edit' },
      h('span', { class: 't-body-strong', text: value }),
      h('button', { class: 'link', text: action, on: { click: onClick } })))
}

const editable = (label: string, value: string, field: 'email' | 'phone' | 'address'): HTMLElement =>
  detailRow(label, value, 'Change', () => openSheet('edit', { field }))

/** Who this account belongs to, as a person rather than as five rows of a
 *  table. The group used to open with a card headed "Personal details" under
 *  a page headed "Personal details" under a crumb reading "Personal details" —
 *  three copies of a title and not one fact about whose account it is. A face,
 *  a name, and where you stand with us reads as a profile and costs the same
 *  height the third title was already taking. */
function profileHead(): HTMLElement {
  const p = state.person
  const city = p.address.split(',').map((s) => s.trim()).filter(Boolean).slice(-1)[0]
  return h('div', { class: 'profile' },
    h('span', { class: 'avatar avatar-lg', text: initialsOf(p.name) }),
    h('div', { class: 'stack-8 grow' },
      h('div', { class: 'profile-name' },
        h('strong', { class: 't-title', text: p.name }),
        // Where you stand, unless the banner is already saying it: on a split
        // screen and on the index an unverified account gets the amber bar
        // two inches above this line, and "Not verified" twice is one time
        // too many. Verified there is no banner, so the badge always shows.
        verified()
          ? h('span', { class: 'pill pos', text: 'Verified' })
          : isSplit() ? null : h('span', { class: 'pill warn', text: 'Not verified' })),
      h('small', { class: 'muted',
        text: `With Tokkenly since ${p.joined}${city ? ' · ' + city : ''}` })))
}

/** The address, middle-elided and copyable. Same anatomy as the token address
 *  on a company page, because they are the same kind of thing. */
function addressRow(address: string, said: string): HTMLElement {
  return h('button', { class: 'addr', on: { click: () => {
    navigator.clipboard?.writeText(address).catch(() => {})
    toast(said)
  } } },
    h('span', { class: 'grow', text: address.slice(0, 10) + '…' + address.slice(-6) }),
    h('span', { class: 'muted', html: icon.copy() }))
}

/** The three facts about this account that are not personal details and not
 *  settings either: where money reaches you, where it leaves to, and how much
 *  of it you are allowed to move. Each names the group that owns it rather
 *  than repeating its controls here. */
function thisAccountCard(): HTMLElement {
  const bank = state.banks[0]
  const lim = verified() ? LIMITS.verified : LIMITS.none
  return card(
    cardHead('This account'),
    h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: 'Your wallet address' }),
      addressRow(WALLET, 'Your address is copied'),
      h('span', { class: 'muted t-caption',
        text: 'Dollars sent to this address on Base land in your wallet.' })),
    detailRow('Payouts land in', bank ? bank.name + ' ' + '••••' + ' ' + bank.last4 : 'No bank yet',
      bank ? 'Change' : 'Add a bank', () => go('/account/payments')),
    verified()
      ? kv('You can move', `${usd(lim.single, false)} at a time`)
      : detailRow('You can move', `${usd(lim.single, false)} at a time`, 'Raise it', () => go('/verify')),
    kv('This month', `${usd(state.usedThisMonth, false)} of ${usd(lim.monthly, false)}`))
}

function detailsBody(): (Node | null)[] {
  const p = state.person
  return [
    profileHead(),
    card(
      cardHead('Your details'),
      kv('Full name', p.name),
      kv('Date of birth', p.dob),
      editable('Mobile number', p.phone, 'phone'),
      editable('Email', p.email, 'email'),
      editable('Home address', p.address, 'address')),
    thisAccountCard(),
    card(
      cardHead('What we hold about you'),
      h('span', { class: 'muted', text: 'You can download all of it whenever you want: your details, every payment you have made, and every document you sent us.' }),
      h('button', { class: 'link', text: 'Download my data',
        on: { click: () => toast('Your data is being prepared. We will email ' + p.email) } })),
  ]
}

/* ---------------- preferences ---------------- */

function preferencesBody(): (Node | null)[] {
  const p = state.prefs
  const back = () => go('/account/preferences')   // repaint, so dependent copy follows
  return [
    card(
      cardHead('How the product opens'),
      choice({
        label: 'Home screen', sub: 'Where Home opens when you arrive', ic: icon.home(),
        options: [{ label: 'Simple', value: 'simple' }, { label: 'Detailed', value: 'detailed' }],
        get: () => p.homeView, set: (v) => actions.setHomeView(v as 'simple' | 'detailed'),
      }),
      choice({
        label: 'Theme', sub: 'Dark is the default. Light is for bright rooms and printing.',
        ic: icon.theme(),
        options: [{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }],
        get: () => p.theme, set: (v) => actions.setPref('theme', v as 'dark' | 'light'),
      }),
      prefAction({
        label: 'The introduction', ic: icon.info(),
        sub: 'Four screens on what a tokenised share is and how to buy one',
        action: 'Show it again',
        onClick: () => { actions.replayIntro(); go('/welcome/0') },
      }),
      // Only when there is something to bring back. A row reading "0 hidden"
      // is a control for a state nobody is in.
      p.putAway.length
        ? prefAction({
            label: 'Reminders on Home', ic: icon.bell(),
            sub: p.putAway.length === 1 ? 'One is put away' : p.putAway.length + ' are put away',
            action: 'Show them again',
            onClick: () => { actions.showTasksAgain(); toast('They are back on Home') },
          })
        : null),
    card(
      cardHead('Money'),
      toggle({
        label: 'Show naira beside dollars', ic: icon.convert(),
        sub: 'Every balance in both currencies, at today’s indicative rate',
        get: () => p.showNaira, set: (v) => { actions.setPref('showNaira', v); back() },
      }),
      toggle({
        label: 'Hide my balances', ic: icon.eye(),
        sub: 'Cover every figure that is yours. Prices and rates stay put',
        get: () => p.hideBalances, set: () => { actions.toggleBalances(); back() },
      }),
      // These two were four grey chips each, side by side, identical to look
      // at — and one sets a starting amount while the other decides when the
      // product stops and asks who is holding the phone. The glyphs say which
      // is which before the words do.
      choice({
        label: 'Add to bucket', sub: 'What goes against a company before you edit it',
        ic: icon.bucket(),
        options: [25, 50, 100, 250].map((v) => ({ label: usd(v, false), value: String(v) })),
        get: () => String(p.tradeDefault), set: (v) => actions.setPref('tradeDefault', Number(v)),
      }),
      choice({
        label: 'Ask for your PIN above', ic: icon.lock(),
        sub: 'Anything larger needs your four digits — buying, selling or sending',
        options: [
          { label: usd(250, false), value: '250' }, { label: usd(500, false), value: '500' },
          { label: usd(1000, false), value: '1000' }, { label: 'Never', value: '0' },
        ],
        get: () => String(p.confirmOver), set: (v) => actions.setPref('confirmOver', Number(v)),
      })),
    h('button', { class: 'link quiet', text: 'Reset every preference to its default',
      on: { click: () => { actions.resetPrefs(); toast('Preferences are back to their defaults') } } }),
  ]
}

/* ---------------- notifications ---------------- */

function notificationsBody(): (Node | null)[] {
  const n = state.prefs.notify
  return [
    card(
      cardHead('What is worth a buzz'),
      toggle({ label: 'Money landing', sub: 'When a payment reaches you, or one you sent lands',
        ic: icon.arrowIn(), get: () => n.payments, set: (v) => actions.setNotify('payments', v) }),
      toggle({ label: 'Price moves', sub: 'When something you hold moves more than five per cent in a day',
        ic: icon.market(), get: () => n.prices, set: (v) => actions.setNotify('prices', v) }),
      toggle({ label: 'Interest paid', sub: 'The daily payout on the dollars you have lent',
        ic: icon.grow(), get: () => n.earn, set: (v) => actions.setNotify('earn', v) }),
      toggle({ label: 'Borrowing', sub: 'When what you owe gets close to what your shares can cover',
        ic: icon.alert(), get: () => n.borrowing, set: (v) => actions.setNotify('borrowing', v) })),
    callout('Four, not twenty. A list nobody can read is a list everybody turns off wholesale.'),
    // The half a switch list never admits: some of these go out whatever you
    // set, and a product that hides that is a product whose unsubscribe is a
    // lie. Saying which is which is also the only way the four above mean
    // anything.
    card(
      cardHead('Email', h('span', { class: 'pill', text: 'To ' + state.person.email })),
      h('span', { class: 'muted',
        text: 'The switches above are about what interrupts you in the app. These go to your inbox, and three of them go whatever you set.' }),
      kv('Money in or out, completed or failed', 'Always'),
      kv('An order filled, or refused', 'Always'),
      kv('A new sign in, or a change to your security', 'Always'),
      kv('Everything else', 'Follows the switches above'),
      h('span', { class: 'muted t-caption',
        text: 'A person locked out of the app is exactly the person who needs to be told their money moved, so those three are not ours to turn off.' })),
  ]
}

/* ---------------- security ---------------- */

/** A row that opens something. Unlike an index row it carries no value on the
 *  right: the sub line under the label already states it ("Four digits,
 *  changed 24 August"), and a second copy of the same fact is what turned
 *  these rows into "App PIN … •…" on a phone. A short flag is the exception —
 *  it is a call to action, not a restatement. */
function actionRow(label: string, sub: string, ic: string, onClick: () => void,
                   flag?: string): HTMLElement {
  return h('button', { class: 'set-row', on: { click: onClick } },
    h('span', { class: 'who' },
      h('span', { class: 'mark', html: ic }),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: label }),
        h('small', { text: sub }))),
    flag ? h('span', { class: 'chip warn-chip', text: flag }) : null,
    h('span', { class: 'muted set-chev', html: icon.chevron() }))
}

function securityBody(): (Node | null)[] {
  const s = state.security
  return [
    card(
      cardHead('How you get in'),
      actionRow('App PIN', 'Four digits, changed ' + s.pinChanged, icon.lock(),
        () => openSheet('pin')),
      actionRow('Password', 'For signing in, changed ' + s.passwordChanged, icon.key(),
        () => openSheet('password')),
      toggle({ label: 'Face ID', sub: 'Unlock without typing your PIN', ic: icon.face(),
        get: () => s.faceId, set: (v) => actions.setSecurity('faceId', v) }),
      toggle({ label: 'Lock the app',
        sub: 'Asks for your PIN when you open it, and after two minutes away. Off means anyone holding your unlocked phone is already in.',
        ic: icon.alert(),
        get: () => s.appLock, set: (v) => actions.setSecurity('appLock', v) }),
      // A lock you can only reach by waiting is a lock nobody tests. This is
      // also the button somebody wants when they hand the phone over.
      s.appLock
        ? h('button', { class: 'btn btn-secondary btn-sm', text: 'Lock now',
            on: { click: () => actions.lock() } })
        : null),
    card(
      cardHead('Recovery'),
      actionRow('Recovery phrase',
        state.phraseWrittenDown ? 'Twelve words, written down' : 'Twelve words, not yet written down',
        icon.key(), () => openSheet('phrase'),
        state.phraseWrittenDown ? undefined : 'Do this'),
      callout('If you lose your phrase, nobody at Tokkenly can restore your account.', 'warning')),
    card(
      cardHead('Where you are signed in'),
      ...state.devices.map((d) => kv(d.name, d.current ? 'This one' : d.seen)),
      h('button', {
        class: 'btn btn-destructive btn-sm', text: 'Sign out everywhere else',
        on: {
          click: () => {
            actions.signOutEverywhere()
            toast('Every other device has been signed out')
            go('/account/security')
          },
        },
      })),
    card(
      cardHead('If you lose your phone'),
      h('span', { class: 't-body-strong', text: '1.  Sign in on another device with your twelve word recovery phrase.' }),
      h('span', { class: 't-body-strong', text: '2.  Use Sign out everywhere else, so the old phone is dropped.' }),
      h('span', { class: 't-body-strong', text: '3.  Change your PIN, because somebody may have watched you type it.' })),
    card(
      cardHead('What we will never do'),
      h('span', { class: 'muted', text: 'We will never ask you for your PIN, your password, your recovery phrase, or a code from a text message. Anybody who asks is not us, however well they know your name.' })),
  ]
}

/* ---------------- payment methods ---------------- */

function paymentsBody(): (Node | null)[] {
  return [
    // Where naira reaches you, which is a permanent detail of the account
    // rather than something generated per payment — so it belongs here, beside
    // the banks, and not only on the screen that happens to need it.
    card(
      cardHead('Your naira account'),
      kv('Bank', state.va.bank),
      kv('Account number', state.va.number),
      kv('Account name', state.va.name),
      h('span', { class: 'muted t-caption',
        text: 'Yours, and it does not change. Anything sent to it becomes dollars in your wallet at the rate when it lands.' })),
    card(
      cardHead('Your banks', h('button', { class: 'link', text: 'Add a bank',
        on: { click: () => openSheet('banks') } })),
      ...state.banks.map((b) => kv(b.name, '•••• ' + b.last4)),
      state.banks.length
        ? h('span', { class: 'muted t-caption',
            text: 'Payouts go to these. The first one is used unless you pick another.' })
        : h('span', { class: 'muted', text: 'No bank yet. Add one to move naira out.' }),
      h('button', { class: 'link quiet', text: 'Manage banks', on: { click: () => openSheet('banks') } })),
    card(
      cardHead('Your cards', h('button', { class: 'link', text: 'Manage cards',
        on: { click: () => openSheet('cards') } })),
      ...state.cards.map((c) => kv(c.brand + ' •••• ' + c.last4, 'Expires ' + c.expiry)),
      h('span', { class: 'muted t-caption',
        text: 'A card is seconds and costs ' + state.fees.card + '%. A transfer is free and takes a minute or two.' })),
    card(
      cardHead('What it costs'),
      kv('Buying or selling', state.fees.trade + '% of the amount'),
      kv('Adding money by transfer', 'Nothing beyond the rate on screen'),
      kv('Adding money by card', state.fees.card + '% of the naira'),
      kv('Sending and receiving', 'Nothing'),
      h('span', { class: 'muted t-caption', text: 'The fee is shown on every screen before you commit, never after.' })),
  ]
}

/* ---------------- the wallet ---------------- */

/** What the wallet actually is, and the one thing that makes it self-custodial
 *  rather than a balance we keep for you.
 *
 *  This card exists because the product's central claim — that we cannot move
 *  your money and cannot be made to — is invisible everywhere else. The
 *  address is on Receive, the balance is on Transfer, and nowhere did the
 *  product say who holds the key. A claim nobody can find is a claim nobody
 *  believes. */
function walletBody(): (Node | null)[] {
  return [
    card(
      cardHead('Your wallet', h('span', { class: 'pill', text: 'Base' })),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Address' }),
        addressRow(WALLET, 'Your address is copied')),
      kv('Kind', 'Smart account'),
      kv('Made by', 'Coinbase CDP, when you signed up'),
      kv('Network', 'Base'),
      kv('Holds', 'Native USDC and your tokenised shares'),
      h('span', { class: 'muted t-caption',
        text: 'Everything you own sits at this address on a public chain. It is not a balance we keep for you.' })),
    card(
      cardHead('Who holds the key', h('span', { class: 'pill pos', text: 'You do' })),
      h('span', { class: 'muted',
        text: 'Tokkenly never stores your private key and cannot sign a transaction for you. Every movement out of this wallet is one you authorised, which is also why we cannot reverse one.' }),
      kv('Key held by', 'You, through Coinbase'),
      kv('Tokkenly can sign', 'Nothing'),
      kv('Staff access', 'None, at any level'),
      h('button', { class: 'btn btn-secondary', text: 'Take the wallet elsewhere',
        on: { click: () => openSheet('export-wallet') } }),
      h('span', { class: 'muted t-caption',
        text: 'You can move this wallet to any other app that supports Base. Nothing here holds it hostage.' })),
    card(
      cardHead('Gas', h('span', { class: 'pill pos', text: 'We pay it' })),
      h('span', { class: 'muted',
        text: 'Every transaction on Base costs a small fee in ETH. You do not hold ETH and should not have to, so we sponsor it for the things the product is for.' }),
      kv('Sponsored', 'Buying, selling, sending, and cashing out'),
      kv('Used this month', '$0.42 of $5.00'),
      kv('What you pay', 'Nothing'),
      h('span', { class: 'muted t-caption',
        text: 'Past the monthly ceiling the wallet still works; the fee comes out of your USDC and the screen says so before you confirm.' })),
    card(
      cardHead('How you got in'),
      kv('Invite code', state.invite.code),
      kv('From', state.invite.by),
      kv('Joined', new Date(state.invite.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })),
      h('span', { class: 'muted t-caption',
        text: 'Tokkenly is invite-only while the pilot runs. Everybody in it came through a code, and that is on your record rather than in a spreadsheet.' })),
  ]
}

/* ---------------- verification ---------------- */

/** The five checks, each with its own state.
 *
 *  One row per question, because a person who is refused wants to know which
 *  one and a support agent needs to know before they pick up the phone. The
 *  tone carries the state and the glyph carries it as well, so the row is not
 *  reading on colour alone. */
function checkRows(): HTMLElement {
  const TONE: Record<string, [string, string]> = {
    passed: ['pos', '✓'], failed: ['warn', '✕'], review: ['warn', '…'], pending: ['muted', '·'],
  }
  const WORD: Record<string, string> = {
    passed: 'Passed', failed: 'Not passed', review: 'With a person', pending: 'Not run yet',
  }
  return h('div', { class: 'stack-12' },
    ...state.checks.map((c) => {
      const [tone, mark] = TONE[c.state]
      return h('div', { class: 'kv' },
        h('span', { class: 'who' },
          h('span', { class: 'mark ' + tone, text: mark }),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: c.label }),
            h('small', { text: c.detail || c.what }))),
        h('span', { class: tone + ' t-caption nowrap', text: WORD[c.state] }))
    }))
}

function verificationBody(): (Node | null)[] {
  const stop = blockedBy()
  if (verified()) {
    return [card(
      cardHead('Verification',
        h('span', { class: 'pill' + (eligible() ? ' pos' : ' warn'),
          text: eligible() ? 'Cleared to trade' : 'Identity checked' })),
      // The distinction the spec insists on, said out loud. Knowing who
      // somebody is and being allowed to sell them a security are two
      // different facts, and a product with one badge for both cannot tell a
      // person the true thing: we know exactly who you are, and you still
      // cannot buy this.
      h('span', { class: 'muted',
        text: eligible()
          ? 'Both halves are done: we know who you are, and you may hold tokenised shares in Nigeria.'
          : 'We know who you are. Permission to hold this instrument is a separate question, and it is the one below that has not passed.' }),
      checkRows(),
      stop ? callout(stop.detail, 'warning') : null,
      kv('Checked with', state.kyc.method ?? 'NIN'),
      kv('Number', 'ending ' + (state.kyc.last4 ?? '••••')),
      kv('Checked on', state.kyc.checkedOn ?? ''),
      kv('Screened by', 'Didit'),
      kv('Monthly limit', usd(LIMITS.verified.monthly, false)),
      kv('One payment', usd(LIMITS.verified.single, false)),
      h('div', { class: 'chip-row' },
        h('button', { class: 'link quiet', text: 'Start again',
          on: { click: () => { actions.resetVerification(); toast('Verification cleared') } } }),
        // The refusal is on a path anybody can walk. A state nobody has seen
        // is a state nobody has designed.
        h('button', { class: 'link quiet', text: 'Show a refused eligibility check',
          on: { click: () => { actions.failEligibility(); toast('Eligibility refused, for the demo') } } })))]
  }
  return [card(
    cardHead('Verification', h('span', { class: 'pill', text: 'Not done' })),
    h('span', { class: 'muted',
      text: 'You can browse, add money and buy small amounts without this. Verifying raises what you can move.' }),
    checkRows(),
    kv('Monthly limit', `${usd(LIMITS.none.monthly, false)} → ${usd(LIMITS.verified.monthly, false)}`),
    kv('One payment', `${usd(LIMITS.none.single, false)} → ${usd(LIMITS.verified.single, false)}`),
    kv('Screened by', 'Didit'),
    h('button', { class: 'btn btn-primary btn-sm', text: 'Verify with NIN or BVN',
      on: { click: () => go('/verify') } }))]
}

/* ---------------- support ---------------- */

const QA: [string, string][] = [
  ['How long does a payment take', 'Usually under a minute, any day of the week'],
  ['What does it cost to send money', 'Nothing. Tokkenly covers the network cost'],
  ['Why do you need my NIN or BVN', 'Nigerian law requires it before you hold a balance'],
  ['What happens if I lose my phone', 'Sign in on another one with your recovery phrase'],
  ['Can I take back what I have lent at any time', 'Yes, with no notice and no fee. It lands in your wallet the same day'],
  ['What happens if my shares fall while I owe', 'We only sell if your cover drops under 140%, and not before'],
  ['Do you charge me to buy a stock', 'Half a per cent of the amount, shown before you commit'],
  ['How do I change my PIN', 'Account, then Security, then App PIN'],
  ['What if I forget my password', 'Use Forgotten your password on the sign in screen'],
  ['Can I send money at the weekend', 'Yes. Payments run every day, public holidays included'],
  ['Why is my payment still settling', 'The network is busy. It clears on its own, usually within a minute'],
]

/** The answers, lifted out so the search can repaint them without rebuilding
 *  the page around the field being typed into. */
function qaCard(list: readonly (readonly [string, string])[], term: string): HTMLElement {
  return card(
    cardHead('Common questions'),
    searchNote(term, list.length, onlyNear(term, [...list], ([q, a]) => [q, a])),
    ...(list.length
      ? list.map(([q, a]) =>
          h('button', { class: 'set-row', on: { click: () => openSheet('answer', { q }) } },
            h('span', { class: 'who' },
              h('span', { class: 'mark', html: icon.info() }),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: q }),
                h('small', { text: a }))),
            h('span', { class: 'muted set-chev', html: icon.chevron() })))
      : [emptyState('Nothing matches that',
          'No answer here covers it. A person will.',
          { label: 'Email us', onClick: () => openSheet('contact') })]))
}

function supportBody(): (Node | null)[] {
  const r = current()
  const term = r.query.get('q') ?? ''
  const FIELDS = ([q, a]: readonly [string, string]) => [q, a]
  const at = (v: string) => '/account/support' + (v ? '?q=' + encodeURIComponent(v) : '')

  // The answers narrow as you type, and the panel goes straight to one — a
  // question you can see the answer to is faster than a filtered list of
  // questions you still have to open.
  const answers = h('div', { class: 'stack' })
  const paint = (t: string): void => {
    const list = t.trim() ? rank(t, QA, FIELDS) : [...QA]
    answers.replaceChildren(qaCard(list, t))
  }
  paint(term)

  return [
    searchField({
      placeholder: 'Search help',
      value: term,
      // The answer on the row as well as the question. Typing "recovry" finds
      // "What happens if I lose my phone", which reads as a wrong answer until
      // you can see that the answer is the recovery phrase.
      suggest: (t) => rank(t, QA, FIELDS).slice(0, 6).map(([q, a]) => ({
        label: q, sub: a, group: 'Answers', pick: () => openSheet('answer', { q }),
      })),
      onType: paint,
      onCommit: (v) => go(at(v)),
    }),
    answers,
    card(
      cardHead('Talk to a person'),
      actionRow('Email us', state.person.email + ' · replies within one working day',
        icon.mail(), () => openSheet('contact'))),
    card(
      cardHead('Service'),
      kv('Payments', h('span', { class: 'pos t-body-strong', text: 'Working' })),
      kv('Verification', h('span', { class: 'pos t-body-strong', text: 'Working' })),
      kv('App version', '2.4.0')),
  ]
}

/* ---------------- legal ---------------- */

function legalBody(): (Node | null)[] {
  return [
    card(
      cardHead('Risk and disclosures'),
      h('span', { class: 'muted', text: 'What you actually own, what it costs, what happens to your money if something goes wrong, and who to go to if we cannot put it right.' }),
      h('button', { class: 'btn btn-secondary btn-sm', text: 'Read the disclosures',
        on: { click: () => go('/disclosures') } })),
    card(
      cardHead('Closing your account'),
      h('span', { class: 'muted', text: 'Move your money out first. Anything you have lent has to come back and any loan has to be repaid, then we can close the account and delete what we hold.' }),
      h('button', { class: 'link', text: 'Close my account', on: { click: () => openSheet('close') } })),
  ]
}

/* ---------------- the index ---------------- */

const onCount = (): number => Object.values(state.prefs.notify).filter(Boolean).length

export const GROUPS: Group[] = [
  { key: 'details', label: 'Personal details', ic: icon.account(),
    // The first name, not the full one: the row has to hold the longest label
    // in the list beside it, and whose account this is takes one word.
    status: () => state.person.name.split(' ')[0], body: detailsBody },
  { key: 'preferences', label: 'Preferences', ic: icon.grid(),
    status: () => (state.prefs.homeView === 'simple' ? 'Simple' : 'Detailed') + ' · ' +
      (state.prefs.theme === 'dark' ? 'Dark' : 'Light'), body: preferencesBody },
  { key: 'notifications', label: 'Notifications', ic: icon.bell(),
    status: () => onCount() + ' of 4', body: notificationsBody },
  { key: 'security', label: 'Security', ic: icon.lock(),
    status: () => '4-digit PIN', body: securityBody },
  { key: 'payments', label: 'Payment methods', ic: icon.card(),
    status: () => state.banks.length + (state.banks.length === 1 ? ' bank' : ' banks'),
    body: paymentsBody },
  { key: 'wallet', label: 'Your wallet', ic: icon.wallet(),
    status: () => 'Base · self-custodial', body: walletBody },
  { key: 'verification', label: 'Verification', ic: icon.check(),
    status: () => (verified() ? (eligible() ? 'Cleared to trade' : 'Not eligible') : 'Not done'),
    body: verificationBody },
  { key: 'support', label: 'Support', ic: icon.mail(),
    status: () => '1 working day', body: supportBody },
  { key: 'legal', label: 'Risk and legal', ic: icon.info(),
    status: () => 'Disclosures', body: legalBody },
]

/** The way into the console, for the people who have one. It sits under the
 *  groups rather than among them because it is not a setting: it is a
 *  different product wearing the same shell, and putting it in the list would
 *  make an account holder think it was theirs. */
export function opsDoor(): HTMLElement {
  const down = providersDown()
  return card(
    cardHead('Operations', h('span', { class: 'pill' + (down ? ' warn' : ' pos'),
      text: down ? down + ' degraded' : 'All up' })),
    h('span', { class: 'muted',
      text: 'Provider health, the switches that can stop any part of the product, the pilot list, reconciliation and the audit log.' }),
    h('button', { class: 'btn btn-secondary', text: 'Open the console',
      on: { click: () => go('/admin') } }),
    h('span', { class: 'muted t-caption',
      text: 'Staff only. Nothing in it can move customer money.' }))
}

const groupFor = (key?: string): Group | undefined => GROUPS.find((g) => g.key === key)

/** Unverified, the most useful thing on this screen is not a setting at all —
 *  it is the check that lifts the ceiling. So it sits above the list where it
 *  cannot be missed, and stays a row as well so the list never changes shape. */
function verifyBanner(): HTMLElement | null {
  if (verified()) return null
  return h('div', { class: 'set-banner' },
    h('span', { class: 'mark warn-mark', html: icon.alert() }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: 'You are not verified' }),
      h('small', { text: `${usd(LIMITS.none.single, false)} a payment and ${usd(LIMITS.none.monthly, false)} a month until you are.` })),
    h('button', { class: 'btn btn-primary btn-sm', text: 'Verify with NIN or BVN',
      on: { click: () => go('/verify') } }))
}

function indexList(activeKey?: string): HTMLElement {
  return h('nav', { class: 'set-list' + (activeKey ? ' rail' : ''), ariaLabel: 'Account settings' },
    ...GROUPS.map((g) => h('button', {
      class: 'set-row' + (g.key === activeKey ? ' on' : ''),
      ariaCurrent: g.key === activeKey ? 'page' : undefined,
      on: { click: () => go('/account/' + g.key) },
    },
      h('span', { class: 'who' },
        h('span', { class: 'mark', html: g.ic }),
        h('span', { class: 't-body-strong', text: g.label })),
      h('span', { class: 'set-value muted', text: g.status() }),
      h('span', { class: 'muted set-chev', html: icon.chevron() }))))
}

function footer(): HTMLElement {
  // Apart, and at the end. A destructive action beside a routine one is a
  // mis-tap waiting to happen.
  return h('div', { class: 'set-foot' },
    h('button', { class: 'btn btn-secondary', text: 'Sign out',
      on: { click: () => { actions.signOut(); go('/signin') } } }),
    h('span', { class: 'subtle t-caption', text: 'Tokkenly 2.4.0' }))
}

export function accountScreen(sub?: string): HTMLElement {
  const group = groupFor(sub)

  // An address that names no group is the index. On a wide screen the index
  // is never alone — the panel shows the first group, because a column of
  // rows next to nothing is a screen that looks broken.
  if (!group) {
    if (isSplit()) return accountScreen(GROUPS[0].key)
    return shell('account',
      pageHeader('Account'),
      verifyBanner(),
      indexList(),
      opsDoor(),
      footer())
  }

  // Wide: the list stays put and the panel changes beside it, so a run of
  // changes is one click each instead of two.
  if (isSplit()) {
    return shell('account',
      // No trail: the row it would name is lit two inches to the left. And no
      // eyebrow: it read "Verified · NIN checked 6 Sept" beside a rail row
      // reading "Verification · Verified" beside a profile badge reading
      // "Verified". The row and the badge are enough; the date belongs to the
      // group that owns the check.
      pageHeader('Account', null, { crumbs: false }),
      verifyBanner(),
      h('div', { class: 'row set-split' },
        h('div', { class: 'stack set-col' }, indexList(group.key), opsDoor(), footer()),
        h('div', { class: 'stack grow set-panel' }, ...group.body())))
  }

  // Narrow: one group fills the screen, and the way back is one step rather
  // than a trail whose last name was the page title repeated.
  return shell('account',
    pageHeader(group.label, null, { back: { label: 'Account', to: '/account' } }),
    h('div', { class: 'stack col-main' }, ...group.body()))
}

export { QA }
