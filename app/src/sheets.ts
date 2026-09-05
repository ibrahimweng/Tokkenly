import { h } from './ui'
import { icon } from './icons'
import { sheet, figure, panel, outcome, toast } from './components/sheet'
import { callout as calloutEl, emptyState as emptyStateEl } from './components/bits'
import {
  state, actions, owed, monthlyCost, monthlyEarn, holding, type Activity,
} from './state'
import { find } from './catalogue'
import { usd, naira, pct, shares as fmtShares, longWhen, when } from './format'
import { type Route, closeSheet, replaceSheet, go } from './router'
import { QA } from './screens/settings'
import { peopleRows } from './screens/money'
import { BEHIND_MORE } from './components/shell'

/** How long a confirmation shows its spinner. Short enough not to annoy,
 *  long enough that the state is real rather than decorative. */
export const CONFIRM_MS = 350

const num = (r: Route, k: string, d = 0): number => Number(r.query.get(k) ?? d) || d
const str = (r: Route, k: string, d = ''): string => r.query.get(k) ?? d

/** A review sheet: what is about to happen, in four rows, then one button
 *  that names the action and the amount. design.md 11b.4e. */
function review(opts: {
  title: string
  figureLabel: string
  figureValue: string
  rows: [string, string][]
  note: string
  action: string
  onConfirm: () => void
}): HTMLElement {
  return sheet(
    opts.title,
    figure(opts.figureLabel, opts.figureValue),
    panel(...opts.rows),
    calloutEl(opts.note),
    // Money takes a moment to move. The button says so, rather than pretending
    // the ledger changed the instant it was pressed. Figma Button State=Loading.
    h('button', {
      class: 'btn btn-primary', text: opts.action,
      on: {
        click: (e) => {
          const b = e.currentTarget as HTMLButtonElement
          if (b.classList.contains('is-busy')) return
          b.classList.add('is-busy')
          setTimeout(opts.onConfirm, CONFIRM_MS)
        },
      },
    })
  )
}

function done(
  title: string,
  line: string,
  a: Activity,
  extra: [string, string][] = []
): HTMLElement {
  return outcome(
    title,
    line,
    [['Reference', a.ref], ['When', longWhen(a.at)], ...extra],
    { label: 'Done', onClick: closeSheet },
    { label: 'View in History', onClick: () => { closeSheet(); go('/history?sheet=receipt&ref=' + a.ref) } }
  )
}

/* ---------------- registry ---------------- */

type Builder = (r: Route) => HTMLElement

export const SHEETS: Record<string, Builder> = {
  /** The rest of the rail. Four places are tabs; these five are behind More. */
  /** The bell's panel. Reading one marks it read; the count on the bell drops
   *  as you go, which is the whole point of a count. */
  notifications: () => {
    const unread = state.notifications.filter((n) => !n.read).length
    const GLYPH = { money: icon.wallet, trade: icon.market, grow: icon.grow, security: icon.lock }
    return sheet('Notifications',
      h('div', { class: 'sheet-head', style: { marginTop: '-8px' } },
        h('span', { class: 'muted', text: unread ? unread + ' unread' : 'All caught up' }),
        unread
          ? h('button', { class: 'link', text: 'Mark all read',
              on: { click: () => actions.readAllNotifications() } })
          : null),
      state.notifications.length
        ? h('div', { class: 'sheet-list' },
            ...state.notifications.map((n) =>
              h('button', {
                class: 'sheet-row' + (n.read ? ' read' : ''),
                on: { click: () => actions.readNotification(n.id) },
              },
                h('span', { class: 'mark', html: GLYPH[n.kind]() }),
                h('span', { class: 'two-line' },
                  h('span', { class: 't-body-strong', text: n.title }),
                  h('small', { text: n.body })),
                h('span', { class: 'muted t-caption nowrap', text: when(n.at) }))))
        : emptyStateEl('Nothing yet', 'Payments, orders and sign ins show up here.', undefined, 'history'))
  },

  /** Change who a payment goes to, without leaving the dialog. */
  'pick-who': () =>
    sheet('Who are you sending to?',
      h('div', { class: 'sheet-list' },
        ...peopleRows((who) => {
          closeSheet()
          go('/send?to=' + encodeURIComponent(who))
        })),
      calloutEl('Only people already in your list can be paid without a second check.')),

  more: () =>
    sheet('More',
      h('div', { class: 'sheet-list' },
        ...BEHIND_MORE.map((p) =>
          h('button', {
            class: 'sheet-row',
            on: { click: () => { closeSheet(); go(p.to) } },
          },
            h('span', { class: 'mark', html: p.ic() }),
            h('span', { class: 'two-line' },
              h('span', { class: 't-body-strong', text: p.label }),
              h('small', { text: p.sub })),
            h('span', { class: 'muted', html: icon.chevron() })))),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Coming' }),
        h('div', { class: 'chip-row' },
          h('button', { class: 'chip', text: 'Debit card', on: { click: () => replaceSheet('card') } }),
          h('span', { class: 'pill', text: 'Bills' }))),
      h('p', { class: 'muted t-caption', style: { margin: '0' },
        text: 'These are parts of Tokkenly that are not built yet.' })),

  /* ----- receipts and records ----- */
  receipt: (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))
    if (!a) return sheet('Receipt', h('p', { class: 'muted', text: 'That reference is not in your history.' }))
    const inbound = a.amount >= 0
    return sheet(
      'Receipt',
      figure(a.type, (inbound ? '+' : '−') + usd(Math.abs(a.amount)), inbound ? 'pos' : ''),
      panel(
        [inbound ? 'From' : 'To', a.who],
        ['Reference', a.ref],
        ['When', longWhen(a.at)],
        ['Fee', 'Free, Tokkenly covers it']
      ),
      calloutEl(a.settled
        ? 'Settled. Nothing about this payment is going to change now.'
        : 'Still settling. It usually clears within a minute.'),
      h('button', {
        class: 'btn btn-primary', text: 'Download receipt',
        on: { click: () => toast('Receipt saved as ' + a.ref + '.pdf') },
      })
    )
  },

  export: () =>
    sheet('Export your history',
      panel(
        ['Rows', String(state.activity.length)],
        ['Format', 'CSV, one row per entry'],
        ['Covers', 'Payments, trades and Grow'],
        ['Sent to', state.person.email]
      ),
      calloutEl('The file lists every reference, so it reconciles against your bank.'),
      h('button', {
        class: 'btn btn-primary', text: 'Email me the file',
        on: { click: () => { toast('On its way to ' + state.person.email); closeSheet() } },
      })),

  answer: (r) => {
    const q = str(r, 'q')
    const found = QA.find(([question]) => question === q)
    return sheet(q || 'Answer',
      h('p', { class: 'muted', style: { margin: '0' }, text: found ? found[1] + '.' : 'No answer for that yet.' }),
      h('button', { class: 'btn btn-secondary', text: 'Still stuck, email us', on: { click: () => replaceSheet('contact') } }))
  },

  contact: () =>
    sheet('Email us',
      panel(
        ['Address', state.person.email],
        ['Reply time', 'Within one working day'],
        ['Hours', 'Monday to Friday, 9 to 6 Lagos time'],
        ['Urgent', 'Sign out everywhere first, then write']
      ),
      calloutEl('Tell us the reference of anything you are asking about and it will be answered faster.'),
      h('button', {
        class: 'btn btn-primary', text: 'Open my email app',
        on: { click: () => { toast('Opening a draft to ' + state.person.email); closeSheet() } },
      })),

  /* ----- account ----- */
  card: () =>
    sheet('Join the list',
      figure('The Tokkenly card', 'Coming soon'),
      panel(
        ['What it is', 'A naira card, funded by your dollars'],
        ['Where it works', 'Anywhere in Nigeria that takes a card'],
        ['What it costs', 'Nothing to join the list'],
        ['We will email', state.person.email]
      ),
      calloutEl('We will only write to you about the card, once, when it is ready.'),
      state.cardWaitlist
        ? h('button', { class: 'btn btn-secondary', text: 'You are on the list', on: { click: closeSheet } })
        : h('button', {
            class: 'btn btn-primary', text: 'Add me to the list',
            on: { click: () => { actions.joinCardWaitlist(); toast('You are on the list'); closeSheet() } },
          })),

  edit: (r) => {
    const field = str(r, 'field', 'email') as 'email' | 'phone' | 'address'
    const label = { email: 'email', phone: 'mobile number', address: 'home address' }[field]
    const input = h('input', { placeholder: 'Type your new ' + label, value: '' })
    const confirm = h('input', { placeholder: 'Type it a second time', value: '' })
    return sheet('Change your ' + label,
      h('p', { class: 'muted', style: { margin: '0' },
        text: field === 'email'
          ? 'We will send a six digit code to the new address. The one you have now keeps working until you type that code in.'
          : 'We check the new details before anything moves.' }),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'New ' + label }),
        h('label', { class: 'field' }, input)),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Type it again' }),
        h('label', { class: 'field' }, confirm)),
      calloutEl('We will never email you asking for your PIN or your recovery phrase.'),
      h('button', {
        class: 'btn btn-primary', text: 'Save the change',
        on: {
          click: () => {
            const v = input.value.trim()
            if (!v) { toast('Type the new ' + label + ' first'); return }
            if (v !== confirm.value.trim()) { toast('The two do not match'); return }
            actions.updatePerson(field, v)
            toast('Your ' + label + ' has been updated')
            closeSheet()
          },
        },
      }))
  },

  pin: () =>
    sheet('Change your PIN',
      h('p', { class: 'muted', style: { margin: '0' },
        text: 'Six digits. Not your date of birth, and not six of the same number.' }),
      ...['PIN you use now', 'New PIN', 'Type it again'].map((l, i) =>
        h('div', { class: 'stack-8' },
          h('span', { class: 't-caps subtle', text: l }),
          h('label', { class: 'field' },
            h('input', { type: 'password', placeholder: i === 0 ? '••••••' : 'Six digits' })))),
      calloutEl('If you forget your PIN you will need your recovery phrase to get back in.'),
      h('button', {
        class: 'btn btn-primary', text: 'Save the new PIN',
        on: { click: () => { toast('Your PIN has been changed'); closeSheet() } },
      })),

  phrase: () =>
    sheet('Your recovery phrase',
      figure('Twelve words', 'Hidden'),
      panel(
        ['Where to keep it', 'On paper, somewhere only you can reach'],
        ['Never', 'A photo, a note app, or a message'],
        ['If somebody asks', 'They are stealing from you. Nobody here will ask'],
        ['Written down', '12 August 2026']
      ),
      calloutEl('Anyone with these twelve words can move your money. We cannot stop them and we cannot get it back.', 'warning'),
      h('button', { class: 'btn btn-primary', text: 'Show the words', on: { click: () => replaceSheet('phrase-shown') } })),

  'phrase-shown': () => {
    const words = ['ridge', 'olive', 'cargo', 'siren', 'palm', 'unfold', 'quilt', 'rocket', 'dolphin', 'marble', 'tenant', 'glide']
    const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' } })
    words.forEach((w, i) =>
      grid.appendChild(h('div', { class: 'field', style: { height: '44px' } },
        h('span', { class: 'subtle t-caption', text: String(i + 1) }),
        h('span', { class: 't-body-strong', text: w }))))
    return sheet('Your recovery phrase',
      h('p', { class: 'muted', style: { margin: '0' },
        text: 'Write them on paper, in this order. Do not photograph this screen and do not type them anywhere.' }),
      grid,
      calloutEl('Anyone with these twelve words can move your money.', 'warning'),
      h('button', {
        class: 'btn btn-primary', text: 'I have written them down',
        on: { click: () => { actions.markPhraseWritten(); toast('Keep it somewhere safe'); closeSheet() } },
      }))
  },

  close: () =>
    sheet('Close your account',
      figure('This cannot be undone', 'Three things first'),
      panel(
        ['One', 'Take your ' + usd(state.inEarn) + ' out of Earn'],
        ['Two', 'Repay the ' + usd(owed()) + ' you owe'],
        ['Three', 'Move the rest of your money out'],
        ['Then', 'Email us and we close it within one working day']
      ),
      calloutEl('We keep your records for seven years because Nigerian law requires it. Nothing else is kept.', 'warning'),
      h('button', {
        // The commit point of the close-account flow. It was wearing the
        // primary button; the danger variant is what it has always been.
        class: 'btn btn-destructive', text: 'Email us to close it',
        on: { click: () => { toast('Opening a draft to ' + state.person.email); closeSheet() } },
      })),

  banks: () => {
    const name = h('input', { placeholder: 'Bank name' })
    const acct = h('input', { placeholder: 'Account number' })
    return sheet('Your banks',
      h('div', { class: 'stack-12' },
        ...state.banks.map((b) =>
          h('div', { class: 'kv' },
            h('span', { class: 'who' },
              h('span', { class: 'mark', html: icon.wallet() }),
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: b.name }),
                h('small', { text: '•••• ' + b.last4 + ' · ' + b.holder }))),
            h('span', { class: 'muted t-caption', text: 'Verified' })))),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Add a bank' }),
        h('label', { class: 'field' }, name),
        h('label', { class: 'field' }, acct)),
      calloutEl('A bank account has to be in your own name. We check that before the first payout.'),
      h('button', {
        class: 'btn btn-primary', text: 'Add this bank',
        on: {
          click: () => {
            const n = name.value.trim()
            const a = acct.value.trim()
            if (!n || a.length < 4) { toast('Add a bank name and account number'); return }
            actions.addBank(n, a.slice(-4))
            toast(n + ' added')
            closeSheet()
          },
        },
      }))
  },

  /* ----- send ----- */
  'send-review': (r) => {
    const v = num(r, 'v')
    const to = str(r, 'to')
    return review({
      title: 'Review',
      figureLabel: 'You are sending', figureValue: usd(v),
      rows: [['To', to], ['They receive', usd(v)], ['Fee', 'Free, Tokkenly covers it'], ['Arrives', 'In about a minute']],
      note: 'Payments cannot be recalled once they are on the network.',
      action: 'Send ' + usd(v),
      onConfirm: () => {
        const a = actions.send(to, v)
        replaceSheet('send-done', { ref: a.ref })
      },
    })
  },
  'send-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Sent', `${usd(Math.abs(a.amount))} is on its way to ${a.who}.`, a, [['Fee', 'Free']])
  },

  /* ----- add money ----- */
  'add-review': (r) => {
    const v = num(r, 'v')
    const bank = state.banks[0]
    return review({
      title: 'Review',
      figureLabel: 'You are buying', figureValue: usd(v),
      rows: [
        ['You pay', naira(v * state.ngnPerUsd)],
        ['From', bank.name + ' •••• ' + bank.last4],
        ['Rate', '1 dollar = ' + naira(state.ngnPerUsd)],
        ['Lands', 'In about a minute'],
      ],
      note: 'This rate is held for ninety seconds.',
      action: 'Buy ' + usd(v),
      onConfirm: () => {
        const a = actions.addMoney(v, bank.id)
        replaceSheet('add-done', { ref: a.ref })
      },
    })
  },
  'add-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Added', `${usd(a.amount)} is in your wallet.`, a, [['From', a.who]])
  },

  /* ----- convert ----- */
  'convert-review': (r) => {
    const v = num(r, 'v')
    const bank = state.banks[0]
    return review({
      title: 'Review',
      figureLabel: 'You are converting', figureValue: usd(v),
      rows: [
        ['You get', naira(v * state.ngnPerUsd)],
        ['Into', bank.name + ' •••• ' + bank.last4],
        ['Rate', '1 dollar = ' + naira(state.ngnPerUsd)],
        ['Arrives', 'Usually within a minute'],
      ],
      note: 'The naira amount is fixed once you confirm.',
      action: 'Convert ' + usd(v),
      onConfirm: () => {
        const a = actions.convert(v, bank.id)
        replaceSheet('convert-done', { ref: a.ref })
      },
    })
  },
  'convert-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Converted', `${naira(Math.abs(a.amount) * state.ngnPerUsd)} is on its way to ${a.who}.`, a)
  },

  /* ----- invest ----- */
  'invest-review': (r) => {
    const v = num(r, 'v')
    const c = find(str(r, 't'))!
    return review({
      title: 'Review',
      figureLabel: 'You are buying', figureValue: usd(v),
      rows: [
        ['You get', fmtShares(v / c.price) + ' shares of ' + c.name],
        ['Price each', usd(c.price)],
        ['Fee', 'Free, Tokkenly covers it'],
        ['Settles', 'In about a minute'],
      ],
      note: 'You are buying part of a share. Sell any part of it whenever you want.',
      action: `Buy ${usd(v)} of ${c.name}`,
      onConfirm: () => {
        const a = actions.buy(c.ticker, v)
        replaceSheet('invest-done', { ref: a.ref, t: c.ticker })
      },
    })
  },
  'invest-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const c = find(str(r, 't'))!
    const held = holding(c.ticker)
    return done('Bought', `You now own ${held?.shares.toFixed(2)} shares of ${c.name}.`, a,
      [['Price each', usd(c.price)]])
  },

  /* ----- sell ----- */
  'sell-review': (r) => {
    const v = num(r, 'v')
    const c = find(str(r, 't'))!
    return review({
      title: 'Review',
      figureLabel: 'You are selling', figureValue: usd(v),
      rows: [
        ['You sell', fmtShares(v / c.price) + ' shares of ' + c.name],
        ['Price each', usd(c.price)],
        ['Fee', 'Free, Tokkenly covers it'],
        ['Lands in', 'Your wallet'],
      ],
      note: 'Whatever you keep carries on tracking the price.',
      action: `Sell ${usd(v)} of ${c.name}`,
      onConfirm: () => {
        const a = actions.sell(c.ticker, v)
        replaceSheet('sell-done', { ref: a.ref, t: c.ticker })
      },
    })
  },
  'sell-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Sold', `${usd(a.amount)} is in your wallet.`, a)
  },

  /* ----- borrow ----- */
  'borrow-review': (r) => {
    const v = num(r, 'v')
    const after = state.borrowed + v
    return review({
      title: 'Review',
      figureLabel: 'You are borrowing', figureValue: usd(v),
      rows: [
        ['Rate', pct(state.rates.borrow) + ' a year'],
        ['Costs you', 'About ' + usd(monthlyCost(v)) + ' a month'],
        ['Repay', 'Any time, no fee'],
        ['Sold if shares fall below', usd(after * (state.rates.collateral / 100))],
      ],
      note: 'Your shares stay yours and keep earning. We only sell if they fall to that level.',
      action: 'Borrow ' + usd(v),
      onConfirm: () => {
        const a = actions.borrow(v)
        replaceSheet('borrow-done', { ref: a.ref })
      },
    })
  },
  'borrow-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Borrowed', `${usd(a.amount)} is in your wallet. Repay any time.`, a,
      [['Rate', pct(state.rates.borrow) + ' a year']])
  },

  /* ----- repay ----- */
  'repay-review': (r) => {
    const v = num(r, 'v')
    const left = Math.max(0, owed() - v)
    return review({
      title: 'Review',
      figureLabel: 'You are repaying', figureValue: usd(v),
      rows: [
        ['Comes from', 'Your wallet'],
        ['Left owing', usd(left)],
        ['Rate on what is left', pct(state.rates.borrow) + ' a year'],
        ['Costs you after', left === 0 ? 'Nothing' : 'About ' + usd(monthlyCost(left)) + ' a month'],
      ],
      note: 'Repaying frees the same amount up to borrow again whenever you want.',
      action: 'Repay ' + usd(v),
      onConfirm: () => {
        const a = actions.repay(v)
        replaceSheet('repay-done', { ref: a.ref })
      },
    })
  },
  'repay-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    const left = owed()
    return done('Repaid',
      left === 0 ? 'Nothing left to clear. Your limit is back to full.' : `${usd(left)} left to clear. Repay the rest whenever you want.`,
      a, [['From', 'Your wallet']])
  },

  /* ----- earn ----- */
  'earn-review': (r) => {
    const v = num(r, 'v')
    return review({
      title: 'Review',
      figureLabel: 'You are moving in', figureValue: usd(v),
      rows: [
        ['Rate', pct(state.rates.earn) + ' a year'],
        ['Pays you', 'About ' + usd(monthlyEarn(v)) + ' a month'],
        ['Paid', 'Every day'],
        ['Take out', 'Any time, no fee'],
      ],
      note: 'The rate moves with the market. It can go up as well as down.',
      action: 'Move ' + usd(v) + ' in',
      onConfirm: () => {
        const a = actions.moveIntoEarn(v)
        replaceSheet('earn-done', { ref: a.ref })
      },
    })
  },
  'earn-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Moved to Earn', `${usd(Math.abs(a.amount))} starts earning tomorrow morning.`, a,
      [['Rate', pct(state.rates.earn) + ' a year']])
  },

  /* ----- take out ----- */
  'takeout-review': (r) => {
    const v = num(r, 'v')
    const rest = Math.max(0, state.inEarn - v)
    return review({
      title: 'Review',
      figureLabel: 'You are taking out', figureValue: usd(v),
      rows: [
        ['Goes to', 'Your wallet'],
        ['Arrives', 'Straight away'],
        ['Left earning', usd(rest)],
        ['You give up', 'About ' + usd(monthlyEarn(v)) + ' a month'],
      ],
      note: 'Interest already paid stays in your wallet. Only what you leave in keeps earning.',
      action: 'Take out ' + usd(v),
      onConfirm: () => {
        const a = actions.takeOutOfEarn(v)
        replaceSheet('takeout-done', { ref: a.ref })
      },
    })
  },
  'takeout-done': (r) => {
    const a = state.activity.find((x) => x.ref === str(r, 'ref'))!
    return done('Taken out', `${usd(a.amount)} is in your wallet. ${usd(state.inEarn)} carries on earning.`, a)
  },
}

export function buildSheet(r: Route): HTMLElement | null {
  if (!r.sheet) return null
  const make = SHEETS[r.sheet]
  if (!make) return null
  try {
    return make(r)
  } catch {
    return sheet('Something is missing',
      h('p', { class: 'muted', style: { margin: '0' },
        text: 'That sheet needs a record that is no longer here. Close it and try again.' }))
  }
}

export { when }
