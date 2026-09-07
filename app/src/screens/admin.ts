import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout } from '../components/bits'
import { table } from '../components/table'
import {
  state, actions, providersDown, type Provider, type Break, type Gate,
} from '../state'
import { usd, when } from '../format'
import { go, current, openSheet } from '../router'
import { toast } from '../components/sheet'

/* ---------------------------------------------------------------------------
   The console.

   §10 of the spec is the half of a money product nobody demos: invite-only
   access, switches that can stop any part of it, somewhere to look up a
   customer, provider health, reconciliation, and a record of what staff did.
   None of it is customer-facing and all of it decides what a customer can do,
   which is exactly why it belongs in the product rather than in a spreadsheet
   and a Slack channel.

   It is a separate place rather than a section of Account for one reason: it
   is not the account holder's. Everything else in this product answers to one
   person about their own money; this answers to somebody else about everybody
   else's, and dressing the two the same is how a support agent ends up
   thinking they are looking at their own settings.

   Two rules it keeps, and they are the interesting ones:

     Nothing here can move customer money. There is no "send on their behalf",
     no key, no signature, no redirect of a payout. Staff can stop things and
     look at things. That is the whole permission set, and the screen says so
     rather than leaving it to be inferred.

     Every switch names what a customer sees. "buying: off" is a boolean; "every
     buy button is replaced by a line saying trading is paused" is a decision.
     A console that shows the first is a console somebody flips without knowing
     what they did.
   --------------------------------------------------------------------------- */

const TABS = [
  { key: 'status', label: 'Status' },
  { key: 'switches', label: 'Switches' },
  { key: 'people', label: 'People' },
  { key: 'money', label: 'Money' },
  { key: 'breaks', label: 'Reconciliation' },
  { key: 'audit', label: 'Audit' },
  { key: 'launch', label: 'Launch' },
] as const

type Tab = typeof TABS[number]['key']

const TONE: Record<Provider['state'], string> = { up: 'pos', slow: 'warn', down: 'warn' }
const WORD: Record<Provider['state'], string> = { up: 'Up', slow: 'Slow', down: 'Down' }

/* ---------------- status ---------------- */

/** Every outside system, what it does, and what a customer sees when it is
 *  not working. The last column is the one that matters: a provider being down
 *  is not interesting on its own, and what it stops is. */
function statusBody(): (Node | null)[] {
  const bad = state.providers.filter((p) => p.state !== 'up')
  return [
    bad.length
      ? card(
          cardHead('What is not working', h('span', { class: 'pill warn', text: bad.length + ' of ' + state.providers.length })),
          ...bad.map((p) => h('div', { class: 'stack-8' },
            h('div', { class: 'kv' },
              h('span', { class: 'two-line' },
                h('span', { class: 't-body-strong', text: p.name }),
                h('small', { text: p.metric })),
              h('span', { class: TONE[p.state] + ' t-body-strong', text: WORD[p.state] })),
            callout(p.fallback, 'warning'))))
      : card(
          cardHead('Everything is up', h('span', { class: 'pill pos', text: 'All clear' })),
          h('span', { class: 'muted', text: 'Six providers, all healthy. Nothing is degraded and no fallback is in force.' })),
    card(
      cardHead('Providers'),
      table(
        [{ key: 'p', label: 'Provider' }, { key: 'd', label: 'Does', optional: true },
         { key: 'm', label: 'Reading', optional: true }, { key: 's', label: 'State', align: 'right' }],
        state.providers.map((p) => [
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: p.name }),
            h('small', { class: 'phone-only', text: p.does })),
          h('span', { class: 'muted', text: p.does }),
          h('span', { class: 'muted', text: p.metric }),
          h('span', { class: TONE[p.state] + ' t-body-strong', text: WORD[p.state] }),
        ]))),
    card(
      cardHead('Alerts and runbooks'),
      ...[
        ['A price goes stale', 'Trading stops on its own. Check the Chainlink feed, then the limit in Risk.'],
        ['A provider stops answering', 'The rail turns itself off and the app says which. Nothing queues silently.'],
        ['A payout is delayed past an hour', 'It stays unsettled and the customer sees the stage it is at. Chase Switch by reference.'],
        ['Our record differs from theirs', 'It opens a break. Work it on the Reconciliation tab.'],
      ].map(([t, w]) => h('div', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: t }),
        h('small', { text: w }))),
      callout('Every one of these has a screen a customer sees. None of them fails silently.')),
  ]
}

/* ---------------- switches ---------------- */

/** One row per switch, with the consequence spelled out under it. Turning
 *  something off is a decision about what a customer meets, so the row says
 *  what they meet before you can flip it. */
function switchesBody(): (Node | null)[] {
  const off = state.switches.filter((s) => !s.on)
  return [
    off.length
      ? callout(`${off.length} ${off.length === 1 ? 'switch is' : 'switches are'} off: ${off.map((s) => s.label).join(', ')}. Customers are meeting the consequences below right now.`, 'warning')
      : callout('Everything is on. This is how the product ships. Every switch below takes part of it away.'),
    card(
      cardHead('What the product can do'),
      ...state.switches.map((sw) => h('div', { class: 'kv sw-row' },
        h('span', { class: 'two-line grow' },
          h('span', { class: 't-body-strong', text: sw.label }),
          h('small', { text: sw.effect }),
          sw.by ? h('small', { class: 'subtle', text: `${sw.on ? 'On' : 'Off'} since ${when(sw.at ?? '')} · ${sw.by}` }) : null),
        h('button', {
          class: 'btn btn-sm ' + (sw.on ? 'btn-secondary' : 'btn-destructive'),
          text: sw.on ? 'On' : 'Off',
          on: {
            click: () => {
              actions.flipSwitch(sw.key)
              toast(sw.label + (sw.on ? ' turned off' : ' turned on'))
            },
          },
        })))),
    card(
      cardHead('What staff cannot do', h('span', { class: 'pill pos', text: 'By design' })),
      kv('Reach a private key', 'No'),
      kv('Sign a customer transaction', 'No'),
      kv('Redirect a payout', 'No'),
      kv('Move a customer asset', 'No'),
      h('span', { class: 'muted t-caption',
        text: 'Customers hold their own keys, so this is not a rule anybody has to keep. There is nothing here that could sign.' })),
  ]
}

/* ---------------- people ---------------- */

function peopleBody(): (Node | null)[] {
  const KYC: Record<string, [string, string]> = {
    verified: ['pos', 'Verified'], checking: ['warn', 'Checking'], none: ['muted', 'Not done'],
  }
  return [
    card(
      cardHead('The pilot', h('span', { class: 'pill', text: state.members.length + ' invited' })),
      h('span', { class: 'muted',
        text: 'Invite-only while the pilot runs. Everybody below came through a code, and the code is on the record.' }),
      table(
        [{ key: 'n', label: 'Who' }, { key: 'k', label: 'Identity', optional: true },
         { key: 'e', label: 'Eligible', optional: true }, { key: 'f', label: 'Funded', align: 'right' }],
        state.members.map((m) => [
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: m.name }),
            h('small', { text: m.invite + ' · joined ' + m.joined })),
          h('span', { class: KYC[m.kyc][0], text: KYC[m.kyc][1] }),
          h('span', { class: m.eligible ? 'pos' : 'warn', text: m.eligible ? 'Yes' : 'No' }),
          h('span', { class: 't-body-strong', text: usd(m.funded, false) }),
        ]),
        (i) => openSheet('admin-person', { id: state.members[i].id }))),
    card(
      cardHead('Identity and eligibility'),
      kv('Verified', String(state.members.filter((m) => m.kyc === 'verified').length)),
      kv('Cleared to trade', String(state.members.filter((m) => m.eligible).length)),
      kv('Restricted', String(state.members.filter((m) => m.state === 'restricted').length)),
      callout('Verified and eligible are different counts on purpose. Somebody can be exactly who they say and still not be allowed to hold these.')),
  ]
}

/* ---------------- money ---------------- */

function moneyBody(): (Node | null)[] {
  const deposits = state.activity.filter((a) => a.note === 'Bought dollars').slice(0, 5)
  const orders = state.activity.filter((a) => a.kind === 'trade').slice(0, 5)
  const outs = state.activity.filter((a) => a.note === 'Converted to naira' || a.note === 'Paid out in naira').slice(0, 5)
  const rows = (list: typeof deposits) =>
    list.length
      ? table(
          [{ key: 'w', label: 'What' }, { key: 't', label: 'When', optional: true },
           { key: 'r', label: 'Reference', optional: true }, { key: 'a', label: 'Amount', align: 'right' }],
          list.map((a) => [
            h('span', { class: 'two-line' },
              h('span', { class: 't-body-strong', text: a.type + ' · ' + a.who }),
              h('small', { text: a.settled ? 'Settled' : 'Open' })),
            h('span', { class: 'muted', text: when(a.at) }),
            h('span', { class: 'muted', text: a.ref }),
            h('span', { class: 't-body-strong', text: usd(Math.abs(a.amount)) }),
          ]))
      : h('span', { class: 'muted', text: 'Nothing yet.' })
  return [
    card(cardHead('Deposits', h('span', { class: 'pill', text: String(deposits.length) })), rows(deposits)),
    card(cardHead('Orders', h('span', { class: 'pill', text: String(orders.length) })), rows(orders)),
    card(cardHead('Withdrawals', h('span', { class: 'pill', text: String(outs.length) })), rows(outs)),
    card(
      cardHead('Exposure'),
      kv('Pilot cap', usd(50000, false)),
      kv('Funded so far', usd(state.members.reduce((t, m) => t + m.funded, 0), false)),
      kv('Gas sponsored this month', '$0.42 of $5.00'),
      h('button', { class: 'btn btn-secondary btn-sm', text: 'Open the ledger',
        on: { click: () => go('/statement') } })),
  ]
}

/* ---------------- reconciliation ---------------- */

const BREAK_TONE: Record<Break['state'], string> = { open: 'warn', working: 'warn', cleared: 'pos' }

function breaksBody(): (Node | null)[] {
  const open = state.breaks.filter((b) => b.state !== 'cleared')
  return [
    card(
      cardHead('Differences', h('span', { class: 'pill' + (open.length ? ' warn' : ' pos'),
        text: open.length ? open.length + ' open' : 'All clear' })),
      h('span', { class: 'muted',
        text: 'Our record against theirs, on every provider that holds money. A difference opens a break. Nothing is corrected quietly.' }),
      ...state.breaks.map((b) => h('div', { class: 'stack-8' },
        h('div', { class: 'kv' },
          h('span', { class: 'two-line grow' },
            h('span', { class: 't-body-strong', text: b.what }),
            h('small', { text: `${b.id} · opened ${when(b.opened)}` })),
          h('span', { class: BREAK_TONE[b.state] + ' t-body-strong nowrap',
            text: b.state === 'cleared' ? 'Cleared' : b.state === 'working' ? 'Being worked' : 'Open' })),
        h('div', { class: 'row equal' },
          kv('We say', b.ours), kv('They say', b.theirs)),
        b.state !== 'cleared'
          ? h('div', { class: 'chip-row' },
              b.state === 'open'
                ? h('button', { class: 'btn btn-secondary btn-sm', text: 'Pick it up',
                    on: { click: () => { actions.workBreak(b.id, 'working'); toast(b.id + ' picked up') } } })
                : null,
              h('button', { class: 'btn btn-secondary btn-sm', text: 'Mark cleared',
                on: { click: () => { actions.workBreak(b.id, 'cleared'); toast(b.id + ' cleared') } } }))
          : null))),
    card(
      cardHead('What is reconciled'),
      kv('Provider records', 'Switch, every hour'),
      kv('Blockchain receipts', 'Base, every block we care about'),
      kv('Balances', 'Onchain against the ledger, every hour'),
      kv('Orders and fees', '0x fills against our own record, daily'),
      kv('Payouts', 'Switch settlements against queued payouts, hourly'),
      callout('We reconcile against the ledger, and it is the same one a customer can open. There is no second set of books.')),
  ]
}

/* ---------------- audit ---------------- */

function auditBody(): (Node | null)[] {
  return [
    card(
      cardHead('What staff did', h('span', { class: 'pill', text: state.audit.length + ' entries' })),
      h('span', { class: 'muted',
        text: 'Staff actions only. What a customer did is in the ledger. This list answers one question: did anybody here touch this account.' }),
      table(
        [{ key: 'w', label: 'What' }, { key: 'o', label: 'Who', optional: true },
         { key: 't', label: 'When', align: 'right' }],
        state.audit.map((a) => [
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: a.what }),
            h('small', { text: a.target })),
          h('span', { class: 'muted', text: a.who }),
          h('span', { class: a.kind === 'change' ? 'warn' : 'muted', text: when(a.at) }),
        ]))),
    card(
      cardHead('Kept for'),
      kv('Staff actions', 'Seven years'),
      kv('Customer movements', 'Seven years, in the ledger'),
      kv('Identity documents', 'Seven years after the account closes'),
      h('span', { class: 'muted t-caption', text: 'Nigerian law sets the seven. Nothing is kept beyond what it requires.' })),
  ]
}

/* ---------------- launch ---------------- */

const GATE_TONE: Record<Gate['state'], [string, string]> = {
  done: ['pos', 'Done'], 'in-progress': ['warn', 'In progress'], 'not-started': ['muted', 'Not started'],
}

/** The list from "Required before launch", as a thing you can look at rather
 *  than a paragraph in a document. It is the screen that answers "can we
 *  invite people yet", and the answer is no until every row is done. */
function launchBody(): (Node | null)[] {
  const done = state.gates.filter((g) => g.state === 'done').length
  const ready = done === state.gates.length
  return [
    card(
      cardHead('Before external users are invited',
        h('span', { class: 'pill' + (ready ? ' pos' : ' warn'),
          text: ready ? 'Ready' : done + ' of ' + state.gates.length })),
      h('span', { class: 'muted',
        text: ready
          ? 'Every gate is closed. The pilot can open.'
          : 'The pilot stays invite-only until all six are done. Nothing below is optional and none of it is engineering-only.' }),
      ...state.gates.map((g) => {
        const [tone, word] = GATE_TONE[g.state]
        return h('div', { class: 'kv' },
          h('span', { class: 'who' },
            h('span', { class: 'mark ' + tone,
              text: g.state === 'done' ? '✓' : g.state === 'in-progress' ? '·' : '·' }),
            h('span', { class: 'two-line' },
              h('span', { class: 't-body-strong', text: g.what }),
              h('small', { text: g.who + ' · ' + g.note }))),
          h('span', { class: tone + ' t-caption nowrap', text: word }))
      })),
    card(
      cardHead('The complete journey'),
      h('span', { class: 'muted',
        text: 'Eight steps, and the MVP is done when one invited and eligible person can walk all of them.' }),
      ...[
        ['Sign in and get a wallet', true],
        ['Verify identity and eligibility', true],
        ['Fund with USDC or naira', true],
        ['Buy, with the checks in front of it', true],
        ['See it in the portfolio', true],
        ['Sell back to USDC', true],
        ['Send out, or cash out to a bank', true],
        ['Accurate activity, receipts and status throughout', true],
      ].map(([w, ok], i) => h('div', { class: 'kv' },
        h('span', { class: 'who' },
          h('span', { class: 'mark ' + (ok ? 'pos' : 'muted'), text: String(i + 1) }),
          h('span', { class: 't-body-strong', text: String(w) })),
        h('span', { class: (ok ? 'pos' : 'muted') + ' t-caption', text: ok ? 'Walkable' : 'Not yet' }))),
      callout('Walkable in this prototype, with dummy data behind every provider. The gates above are what has to be true before it carries real money.')),
  ]
}

/* ---------------- the screen ---------------- */

const BODIES: Record<Tab, () => (Node | null)[]> = {
  status: statusBody, switches: switchesBody, people: peopleBody,
  money: moneyBody, breaks: breaksBody, audit: auditBody, launch: launchBody,
}

export function adminScreen(): HTMLElement {
  const tab = (current().parts[1] ?? 'status') as Tab
  const now = TABS.find((t) => t.key === tab) ? tab : 'status'
  const down = providersDown()
  const off = state.switches.filter((s) => !s.on).length

  return shell(
    'account',
    pageHeader('Operations',
      h('div', { class: 'chip-row' },
        h('span', { class: 'pill' + (down ? ' warn' : ' pos'),
          text: down ? down + ' provider' + (down === 1 ? '' : 's') + ' degraded' : 'Providers up' }),
        h('span', { class: 'pill' + (off ? ' warn' : ''),
          text: off ? off + ' switch' + (off === 1 ? '' : 'es') + ' off' : 'All switches on' }))),
    // Not a customer's account. It answers to somebody else about everybody
    // else's money, and it says so before it says anything.
    callout('Staff view. Nothing here can move customer money. There is no key to sign with. You can stop things and look at things.'),
    h('div', { class: 'chip-row' },
      ...TABS.map((t) => h('button', {
        class: 'chip' + (t.key === now ? ' on' : ''),
        on: { click: () => go('/admin/' + t.key) },
      }, h('span', { text: t.label })))),
    ...BODIES[now](),
  )
}
