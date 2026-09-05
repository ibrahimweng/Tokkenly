import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import { card, cardHead, kv, callout, emptyState, toggle, choice } from '../components/bits'
import { state, actions, verified, LIMITS } from '../state'
import { usd } from '../format'
import { openSheet, go, current } from '../router'
import { toast } from '../components/sheet'

/* ---------------- account ---------------- */

function editable(label: string, value: string, field: 'email' | 'phone' | 'address'): HTMLElement {
  return h('div', { class: 'kv' },
    h('span', { text: label }),
    h('span', { style: { display: 'flex', gap: '16px', alignItems: 'baseline' } },
      h('span', { class: 't-body-strong', text: value }),
      h('button', { class: 'link', text: 'Change', on: { click: () => openSheet('edit', { field }) } })))
}

/** Everything the person can decide about how the product behaves, in one
 *  card. Every control here reads and writes state and survives the trip to
 *  another screen and back — which the Face ID and PIN switches on Security
 *  never did. */
function preferences(): HTMLElement {
  const p = state.prefs
  const back = () => go('/account')   // repaint, so dependent copy follows
  return card(
    cardHead('Preferences',
      h('button', { class: 'link quiet', text: 'Reset to defaults',
        on: { click: () => { actions.resetPrefs(); toast('Preferences are back to their defaults') } } })),

    h('div', { class: 'pref-row' },
      h('span', { class: 'two-line grow' },
        h('span', { class: 't-body-strong', text: 'The introduction' }),
        h('small', { text: 'Four screens on what a tokenised share is and how to buy one' })),
      h('button', { class: 'btn btn-secondary btn-sm', text: 'Show it again',
        on: { click: () => { actions.replayIntro(); go('/welcome/0') } } })),
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
      label: 'Ask again above', sub: 'A second confirmation before anything larger leaves',
      options: [
        { label: usd(250, false), value: '250' }, { label: usd(500, false), value: '500' },
        { label: usd(1000, false), value: '1000' }, { label: 'Never', value: '0' },
      ],
      get: () => String(p.confirmOver), set: (v) => actions.setPref('confirmOver', Number(v)),
    }))
}

/** Which events are worth a phone buzzing. Four, because a list of twenty is a
 *  list nobody reads and everybody turns off wholesale. */
function notifications(): HTMLElement {
  const n = state.prefs.notify
  return card(
    cardHead('Notifications'),
    toggle({ label: 'Money landing', sub: 'When a payment reaches you, or one you sent lands',
      ic: icon.arrowIn(), get: () => n.payments, set: (v) => actions.setNotify('payments', v) }),
    toggle({ label: 'Price moves', sub: 'When something you hold moves more than five per cent in a day',
      ic: icon.market(), get: () => n.prices, set: (v) => actions.setNotify('prices', v) }),
    toggle({ label: 'Earn interest', sub: 'The daily payout on money sitting in Earn',
      ic: icon.grow(), get: () => n.earn, set: (v) => actions.setNotify('earn', v) }),
    toggle({ label: 'Borrowing', sub: 'When what you owe gets close to what your shares can cover',
      ic: icon.alert(), get: () => n.borrowing, set: (v) => actions.setNotify('borrowing', v) }))
}

/** Where money comes from and goes back to. It was a sheet reachable only
 *  from the Wallet; a bank you added is a setting, so it lives here too. */
function payments(): HTMLElement {
  return card(
    cardHead('Payment methods',
      h('button', { class: 'link', text: 'Add a bank', on: { click: () => openSheet('banks') } })),
    ...state.banks.map((b) => kv(b.name, '•••• ' + b.last4)),
    state.banks.length
      ? h('span', { class: 'muted t-caption',
          text: 'Naira arrives from these and payouts go back to them. The first one is used unless you pick another.' })
      : h('span', { class: 'muted', text: 'No bank yet. Add one to move naira in and out.' }),
    h('button', { class: 'link quiet', text: 'Manage banks', on: { click: () => openSheet('banks') } }))
}

/** What the check is worth, and the way into it. Unverified this is the most
 *  useful card on the screen; verified it is a receipt. */
function verification(): HTMLElement {
  if (verified()) {
    return card(
      cardHead('Verification', h('span', { class: 'chip pos', text: 'Verified' })),
      kv('Checked with', state.kyc.method ?? 'NIN'),
      kv('Number', 'ending ' + (state.kyc.last4 ?? '••••')),
      kv('Checked on', state.kyc.checkedOn ?? ''),
      kv('Monthly limit', usd(LIMITS.verified.monthly, false)),
      h('button', { class: 'link quiet', text: 'Start again',
        on: { click: () => { actions.resetVerification(); toast('Verification cleared') } } }))
  }
  return card(
    cardHead('Verification', h('span', { class: 'pill', text: 'Not done' })),
    h('span', { class: 'muted',
      text: 'You can browse, add money and buy small amounts without this. Verifying raises what you can move.' }),
    kv('Monthly limit', `${usd(LIMITS.none.monthly, false)} → ${usd(LIMITS.verified.monthly, false)}`),
    kv('One payment', `${usd(LIMITS.none.single, false)} → ${usd(LIMITS.verified.single, false)}`),
    h('button', { class: 'btn btn-primary btn-sm', text: 'Verify with NIN or BVN',
      on: { click: () => go('/verify') } }))
}

export function accountScreen(): HTMLElement {
  const p = state.person
  return shell(
    'account',
    pageHeader('Account', verified()
      ? eyebrow('Verified', (state.kyc.method ?? 'NIN') + ' checked ' + (state.kyc.checkedOn ?? ''))
      : eyebrow('Not verified', 'Limits are low until you are')),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        preferences(),
        card(
          cardHead('Personal details'),
          kv('Full name', p.name),
          kv('Date of birth', p.dob),
          editable('Mobile number', p.phone, 'phone'),
          editable('Email', p.email, 'email'),
          editable('Home address', p.address, 'address')
        ),
        card(
          cardHead('Your address'),
          h('div', { class: 'kv' },
            h('span', { class: 'muted', style: { wordBreak: 'break-all' },
              text: '0x7a3F4b91Ce2D8a06F5b17d3E4c8B29aA5f0e9c21' }),
            h('button', { class: 'link', html: icon.copy(),
              on: { click: () => toast('Address copied') } })),
          callout('Base network only. Sending any other asset to this address loses it.', 'warning')
        ),
        card(
          cardHead('What we hold about you'),
          h('span', { class: 'muted', text: 'You can download all of it whenever you want: your details, every payment you have made, and every document you sent us.' }),
          h('button', { class: 'link', text: 'Download my data',
            on: { click: () => toast('Your data is being prepared. We will email ' + p.email) } })
        ),
        card(
          cardHead('Risk and disclosures'),
          h('span', { class: 'muted', text: 'What you actually own, what it costs, what happens to your money if something goes wrong, and who to go to if we cannot put it right.' }),
          h('button', { class: 'link', text: 'Read the disclosures', on: { click: () => go('/disclosures') } })
        ),
        card(
          cardHead('Closing your account'),
          h('span', { class: 'muted', text: 'Move your money out first. Anything sitting in Earn has to come out and any loan has to be repaid, then we can close the account and delete what we hold.' }),
          h('button', { class: 'link', text: 'Close my account', on: { click: () => openSheet('close') } })
        )),
      h('div', { class: 'stack col-side' },
        notifications(),
        payments(),
        verification(),
        card(
          cardHead('Devices', h('button', { class: 'link quiet', text: 'Security', on: { click: () => go('/security') } })),
          ...state.devices.map((d) => kv(d.name, d.current ? 'This one' : d.seen))
        ),
        h('button', { class: 'btn btn-destructive', text: 'Sign out',
          on: { click: () => { actions.signOut(); go('/signin') } } })))
  )
}

/* ---------------- security ---------------- */

function toggleRow(label: string, sub: string, ic: string, on: boolean): HTMLElement {
  const knob = h('span', {
    style: {
      width: '44px', height: '26px', borderRadius: '999px', flex: 'none',
      background: on ? 'var(--positive)' : 'var(--control-pressed)', position: 'relative',
      transition: 'background 120ms ease',
    },
  }, h('span', {
    style: {
      position: 'absolute', top: '3px', left: on ? '21px' : '3px', width: '20px', height: '20px',
      borderRadius: '999px', background: on ? 'var(--canvas)' : 'var(--muted)',
      transition: 'left 120ms ease',
    },
  }))
  let value = on
  const row = h('button', { class: 'kv', style: { width: '100%', textAlign: 'left' } },
    h('span', { class: 'who' },
      h('span', { class: 'mark', html: ic }),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: label }),
        h('small', { text: sub }))),
    knob)
  row.addEventListener('click', () => {
    value = !value
    const inner = knob.firstElementChild as HTMLElement
    knob.style.background = value ? 'var(--positive)' : 'var(--control-pressed)'
    inner.style.left = value ? '21px' : '3px'
    inner.style.background = value ? 'var(--canvas)' : 'var(--muted)'
    toast(label + (value ? ' is on' : ' is off'))
  })
  return row
}

export function securityScreen(): HTMLElement {
  return shell(
    'account',
    pageHeader('Security', eyebrow('Signed in on', state.devices.length + ' devices')),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          cardHead('How you get in'),
          toggleRow('Face ID', 'Unlock without typing your PIN', icon.face(), true),
          h('button', {
            class: 'kv', style: { width: '100%', textAlign: 'left' },
            on: { click: () => openSheet('pin') },
          },
            h('span', { class: 'who' },
              h('span', { class: 'mark', html: icon.lock() }),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: 'App PIN' }),
                h('small', { text: 'Six digits, changed 12 days ago' }))),
            h('span', { class: 'muted', html: icon.chevron() })),
          toggleRow('Ask again for large payments', 'Anything over ' + usd(500, false), icon.alert(), true)
        ),
        card(
          cardHead('Recovery'),
          h('button', {
            class: 'kv', style: { width: '100%', textAlign: 'left' },
            on: { click: () => openSheet('phrase') },
          },
            h('span', { class: 'who' },
              h('span', { class: 'mark', html: icon.key() }),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: 'Recovery phrase' }),
                h('small', { text: state.phraseWrittenDown ? 'Written down' : 'Twelve words. Written down on 12 Aug 2026' }))),
            h('span', { class: 'muted', html: icon.chevron() })),
          callout('If you lose your phrase, nobody at Tokkenly can restore your account.', 'warning')
        ),
        card(
          cardHead('If you lose your phone'),
          h('span', { class: 't-body-strong', text: '1.  Sign in on another device with your twelve word recovery phrase.' }),
          h('span', { class: 't-body-strong', text: '2.  Use Sign out everywhere, so the old phone is dropped.' }),
          h('span', { class: 't-body-strong', text: '3.  Change your PIN, because somebody may have watched you type it.' })
        ),
        card(
          cardHead('What we will never do'),
          h('span', { class: 'muted', text: 'We will never ask you for your PIN, your recovery phrase, or a code from a text message. Anybody who asks is not us, however well they know your name.' })
        )),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('Where you are signed in'),
          ...state.devices.map((d) => kv(d.name, d.current ? 'Now' : d.seen))
        ),
        h('button', {
          class: 'btn btn-destructive', text: 'Sign out everywhere',
          on: {
            click: () => {
              actions.signOutEverywhere()
              toast('Every other device has been signed out')
              go('/security')
            },
          },
        })))
  )
}

/* ---------------- support ---------------- */

const QA: [string, string][] = [
  ['How long does a payment take', 'Usually under a minute, any day of the week'],
  ['What does it cost to send money', 'Nothing. Tokkenly covers the network cost'],
  ['Why do you need my NIN or BVN', 'Nigerian law requires it before you hold a balance'],
  ['What happens if I lose my phone', 'Sign in on another one with your recovery phrase'],
  ['Can I take money out of Earn at any time', 'Yes, with no notice and no fee. It lands in your wallet the same day'],
  ['What happens if my shares fall while I owe', 'We only sell if your cover drops under 140%, and not before'],
  ['Do you charge me to buy a stock', 'No. Tokkenly covers the cost of the trade'],
  ['How do I change my PIN', 'Open Security from Account, then choose App PIN'],
  ['Can I send money at the weekend', 'Yes. Payments run every day, public holidays included'],
  ['Why is my payment still settling', 'The network is busy. It clears on its own, usually within a minute'],
]

export function supportScreen(): HTMLElement {
  const r = current()
  const term = (r.query.get('q') ?? '').toLowerCase()
  const list = QA.filter(([q, a]) => !term || (q + ' ' + a).toLowerCase().includes(term))

  return shell(
    'account',
    pageHeader('Support', eyebrow('Reply time', 'Within one working day')),
    h('label', { class: 'field' },
      h('span', { html: icon.search() }),
      h('input', {
        placeholder: 'Search help', value: r.query.get('q') ?? '',
        on: {
          keydown: (e) => {
            if ((e as KeyboardEvent).key !== 'Enter') return
            const v = (e.target as HTMLInputElement).value
            go('/support' + (v ? '?q=' + encodeURIComponent(v) : ''))
          },
        },
      })),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          cardHead('Common questions'),
          ...(list.length
            ? list.map(([q, a]) =>
                h('button', {
                  class: 'kv', style: { width: '100%', textAlign: 'left' },
                  on: { click: () => openSheet('answer', { q }) },
                },
                  h('span', { class: 'who' },
                    h('span', { class: 'mark', html: icon.info() }),
                    h('span', { class: 'two-line' },
                      h('span', { class: 't-body-strong', text: q }),
                      h('small', { text: a }))),
                  h('span', { class: 'muted', html: icon.chevron() })))
            : [emptyState('Nothing matches that',
                'No answer here covers it. A person will.',
                { label: 'Email us', onClick: () => openSheet('contact') })])
        )),
      h('div', { class: 'stack col-side' },
        card(
          cardHead('Talk to a person'),
          h('button', {
            class: 'kv', style: { width: '100%', textAlign: 'left' },
            on: { click: () => openSheet('contact') },
          },
            h('span', { class: 'who' },
              h('span', { class: 'mark', html: icon.mail() }),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: 'Email us' }),
                h('small', { text: state.person.email }))),
            h('span', { class: 'muted', html: icon.chevron() })),
          kv('Reply time', 'Within one working day')
        ),
        card(
          cardHead('Service'),
          kv('Payments', h('span', { class: 'pos t-body-strong', text: 'Working' })),
          kv('Verification', h('span', { class: 'pos t-body-strong', text: 'Working' })),
          kv('App version', '2.4.0')
        )))
  )
}

export { QA }
