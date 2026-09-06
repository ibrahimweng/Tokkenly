import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead, kv, callout, emptyState, toggle, choice } from '../components/bits'
import { state, actions, verified, LIMITS } from '../state'
import { usd } from '../format'
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

function editable(label: string, value: string, field: 'email' | 'phone' | 'address'): HTMLElement {
  return h('div', { class: 'kv' },
    h('span', { text: label }),
    h('span', { class: 'kv-edit' },
      h('span', { class: 't-body-strong', text: value }),
      h('button', { class: 'link', text: 'Change', on: { click: () => openSheet('edit', { field }) } })))
}

function detailsBody(): (Node | null)[] {
  const p = state.person
  return [
    card(
      cardHead('Personal details'),
      kv('Full name', p.name),
      kv('Date of birth', p.dob),
      editable('Mobile number', p.phone, 'phone'),
      editable('Email', p.email, 'email'),
      editable('Home address', p.address, 'address')),
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
        label: 'Home screen', sub: 'Where Home opens when you arrive',
        options: [{ label: 'Simple', value: 'simple' }, { label: 'Detailed', value: 'detailed' }],
        get: () => p.homeView, set: (v) => actions.setHomeView(v as 'simple' | 'detailed'),
      }),
      choice({
        label: 'Theme', sub: 'Dark is the default. Light is for bright rooms and printing.',
        options: [{ label: 'Dark', value: 'dark' }, { label: 'Light', value: 'light' }],
        get: () => p.theme, set: (v) => actions.setPref('theme', v as 'dark' | 'light'),
      }),
      h('div', { class: 'pref-row' },
        h('span', { class: 'two-line grow' },
          h('span', { class: 't-body-strong', text: 'The introduction' }),
          h('small', { text: 'Four screens on what a tokenised share is and how to buy one' })),
        h('button', { class: 'btn btn-secondary btn-sm', text: 'Show it again',
          on: { click: () => { actions.replayIntro(); go('/welcome/0') } } }))),
    card(
      cardHead('Money'),
      toggle({
        label: 'Show naira beside dollars', ic: icon.convert(),
        sub: 'An indicative figure at today’s rate, next to the dollar amount',
        get: () => p.showNaira, set: (v) => { actions.setPref('showNaira', v); back() },
      }),
      choice({
        label: 'Add to bucket', sub: 'What goes against a company before you edit it',
        options: [25, 50, 100, 250].map((v) => ({ label: usd(v, false), value: String(v) })),
        get: () => String(p.tradeDefault), set: (v) => actions.setPref('tradeDefault', Number(v)),
      }),
      choice({
        label: 'Ask for your PIN above',
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
      toggle({ label: 'Earn interest', sub: 'The daily payout on money sitting in Earn',
        ic: icon.grow(), get: () => n.earn, set: (v) => actions.setNotify('earn', v) }),
      toggle({ label: 'Borrowing', sub: 'When what you owe gets close to what your shares can cover',
        ic: icon.alert(), get: () => n.borrowing, set: (v) => actions.setNotify('borrowing', v) })),
    callout('Four, not twenty. A list nobody can read is a list everybody turns off wholesale.'),
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
      toggle({ label: 'Ask for the PIN when the app opens',
        sub: 'Off means anyone holding your unlocked phone is already in',
        ic: icon.alert(),
        get: () => s.appLock, set: (v) => actions.setSecurity('appLock', v) })),
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
    card(
      cardHead('Your banks', h('button', { class: 'link', text: 'Add a bank',
        on: { click: () => openSheet('banks') } })),
      ...state.banks.map((b) => kv(b.name, '•••• ' + b.last4)),
      state.banks.length
        ? h('span', { class: 'muted t-caption',
            text: 'Naira arrives from these and payouts go back to them. The first one is used unless you pick another.' })
        : h('span', { class: 'muted', text: 'No bank yet. Add one to move naira in and out.' }),
      h('button', { class: 'link quiet', text: 'Manage banks', on: { click: () => openSheet('banks') } })),
    card(
      cardHead('What it costs'),
      kv('Buying or selling', state.fees.trade + '% of the amount'),
      kv('Naira to dollars', 'Nothing beyond the rate on screen'),
      kv('Sending and receiving', 'Nothing'),
      h('span', { class: 'muted t-caption', text: 'The fee is shown on every screen before you commit, never after.' })),
  ]
}

/* ---------------- verification ---------------- */

function verificationBody(): (Node | null)[] {
  if (verified()) {
    return [card(
      cardHead('Verification', h('span', { class: 'chip pos', text: 'Verified' })),
      kv('Checked with', state.kyc.method ?? 'NIN'),
      kv('Number', 'ending ' + (state.kyc.last4 ?? '••••')),
      kv('Checked on', state.kyc.checkedOn ?? ''),
      kv('Monthly limit', usd(LIMITS.verified.monthly, false)),
      kv('One payment', usd(LIMITS.verified.single, false)),
      h('button', { class: 'link quiet', text: 'Start again',
        on: { click: () => { actions.resetVerification(); toast('Verification cleared') } } }))]
  }
  return [card(
    cardHead('Verification', h('span', { class: 'pill', text: 'Not done' })),
    h('span', { class: 'muted',
      text: 'You can browse, add money and buy small amounts without this. Verifying raises what you can move.' }),
    kv('Monthly limit', `${usd(LIMITS.none.monthly, false)} → ${usd(LIMITS.verified.monthly, false)}`),
    kv('One payment', `${usd(LIMITS.none.single, false)} → ${usd(LIMITS.verified.single, false)}`),
    h('button', { class: 'btn btn-primary btn-sm', text: 'Verify with NIN or BVN',
      on: { click: () => go('/verify') } }))]
}

/* ---------------- support ---------------- */

const QA: [string, string][] = [
  ['How long does a payment take', 'Usually under a minute, any day of the week'],
  ['What does it cost to send money', 'Nothing. Tokkenly covers the network cost'],
  ['Why do you need my NIN or BVN', 'Nigerian law requires it before you hold a balance'],
  ['What happens if I lose my phone', 'Sign in on another one with your recovery phrase'],
  ['Can I take money out of Earn at any time', 'Yes, with no notice and no fee. It lands in your wallet the same day'],
  ['What happens if my shares fall while I owe', 'We only sell if your cover drops under 140%, and not before'],
  ['Do you charge me to buy a stock', 'Half a per cent of the amount, shown before you commit'],
  ['How do I change my PIN', 'Account, then Security, then App PIN'],
  ['What if I forget my password', 'Use Forgotten your password on the sign in screen'],
  ['Can I send money at the weekend', 'Yes. Payments run every day, public holidays included'],
  ['Why is my payment still settling', 'The network is busy. It clears on its own, usually within a minute'],
]

function supportBody(): (Node | null)[] {
  const r = current()
  const term = (r.query.get('q') ?? '').toLowerCase()
  const list = QA.filter(([q, a]) => !term || (q + ' ' + a).toLowerCase().includes(term))
  const at = (v: string) => '/account/support' + (v ? '?q=' + encodeURIComponent(v) : '')
  return [
    h('label', { class: 'field' },
      h('span', { html: icon.search() }),
      h('input', {
        placeholder: 'Search help', value: r.query.get('q') ?? '',
        on: {
          keydown: (e) => {
            if ((e as KeyboardEvent).key !== 'Enter') return
            go(at((e.target as HTMLInputElement).value))
          },
        },
      })),
    card(
      cardHead('Common questions'),
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
            { label: 'Email us', onClick: () => openSheet('contact') })])),
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
      h('span', { class: 'muted', text: 'Move your money out first. Anything sitting in Earn has to come out and any loan has to be repaid, then we can close the account and delete what we hold.' }),
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
  { key: 'verification', label: 'Verification', ic: icon.check(),
    status: () => (verified() ? 'Verified' : 'Not done'), body: verificationBody },
  { key: 'support', label: 'Support', ic: icon.mail(),
    status: () => '1 working day', body: supportBody },
  { key: 'legal', label: 'Risk and legal', ic: icon.info(),
    status: () => 'Disclosures', body: legalBody },
]

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

/** Verified, the header says so. Unverified it says nothing, because the
 *  banner two inches below already says it, at length, with the way out. */
function accountEyebrow(): HTMLElement | null {
  if (!verified()) return null
  return eyebrow('Verified', (state.kyc.method ?? 'NIN') + ' checked ' + (state.kyc.checkedOn ?? ''))
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
      pageHeader('Account', accountEyebrow()),
      verifyBanner(),
      indexList(),
      footer())
  }

  // Wide: the list stays put and the panel changes beside it, so a run of
  // changes is one click each instead of two.
  if (isSplit()) {
    return shell('account',
      pageHeader('Account', accountEyebrow()),
      verifyBanner(),
      h('div', { class: 'row set-split' },
        h('div', { class: 'stack set-col' }, indexList(group.key), footer()),
        h('div', { class: 'stack grow set-panel' }, ...group.body())))
  }

  // Narrow: one group fills the screen, with the way back in the trail.
  return shell('account',
    pageHeader(group.label),
    h('div', { class: 'stack col-main' }, ...group.body()))
}

export { QA }
