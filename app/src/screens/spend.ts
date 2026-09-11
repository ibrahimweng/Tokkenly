import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader, eyebrow } from '../components/shell'
import {
  card, cardHead, kv, callout, fieldError, providerNote, amount as amountCell,
} from '../components/bits'
import { table } from '../components/table'
import { composerScreen } from '../components/composer'
import { state, movementCeiling, ceilingLabel, switchOn, type Activity } from '../state'
import { usd, naira, when, activityLabel, NGN } from '../format'
import { current, go, openSheet } from '../router'
import { isSplit } from '../responsive'
import { payRow } from '../components/purse'
import { ASSETS, assetOf, type Asset } from '../assets'
import {
  NETWORKS, networkOf, guessNetwork, validNumber, digitsOf, prettyNumber,
  plansFor, planOf, DISCOS, discoOf, validMeter, resolveMeter, prettyMeter,
  type Network, type Plan, type MeterKind,
} from '../bills'

/* ---------------------------------------------------------------------------
   Spend.

   Three errands: a phone topped up, a bundle bought, a meter loaded. They are
   the reason a person in Lagos keeps a naira balance "just in case" — and a
   person who keeps a naira balance just in case has already left, because the
   dollars they came here for are now the money they do not touch.

   So the product does the errands itself, at the rate on the screen, out of
   whichever balance you point it at.

   That last clause is new, and it corrects something this file used to argue.
   It said "nothing is held in naira" — that every bill converted on the way
   out, so the dollars were always the money and naira never sat still. That
   was true of the product when it was written and it was the wrong thing to
   be true. Somebody paid in naira, or who converted a month's bills in one go
   at a rate they liked, was being told the product had no way to hold what
   they had. It has one now, and this place is the main reason to use it.

   So a bill is one of two movements depending on where it is paid from, and
   they are genuinely different rather than one wearing two labels:

     from naira        one posting. The naira you hold are the naira the
                       network takes. No desk, no rate, nothing quoted.
     from a stablecoin a conversion: two postings joined by the rate on the
                       screen, one in each currency, because a single entry
                       cannot be denominated twice.

   The shape is Send's, because it is the same shape: three ways in a rail,
   the one you picked filling the panel, and the whole errand happening in
   that panel — the target, then the amount, then a review, which is a dialog
   because it is a commit. On a phone the rail is the place's own index and
   the composer is a sheet over the step that opened it.

   What is still not here is converting for its own sake. Naira you want to
   keep arrives as naira through Add money; this place spends it.
   --------------------------------------------------------------------------- */

type Way = 'airtime' | 'data' | 'electricity'

const on = (): boolean => switchOn('spend.bills')

const WAYS: { key: Way; label: string; ic: () => string; sub: () => string }[] = [
  { key: 'airtime', label: 'Airtime', ic: icon.phone,
    sub: () => (on() ? 'Any Nigerian number' : 'Paused') },
  { key: 'data', label: 'Data', ic: icon.signal,
    sub: () => (on() ? 'Bundles from the four networks' : 'Paused') },
  { key: 'electricity', label: 'Electricity', ic: icon.bolt,
    sub: () => (on() ? 'A prepaid token, or a postpaid bill' : 'Paused') },
]

const wayLabel = (w: Way): string => WAYS.find((x) => x.key === w)!.label

/** What a network takes in one recharge. A real ceiling, and lower than the
 *  account's own on any verified account — so it is stated separately rather
 *  than folded into the limit, which is about you and not about them. */
const AIRTIME_CAP = 50000
/** And what a disco takes against one meter in one payment. */
const METER_CAP = 200000

/** The most this account can put on a bill, in naira.
 *
 *  Every ceiling in the product is a dollar figure, because dollars are what
 *  the wallet holds. A bill is typed in naira, and a ceiling somebody cannot
 *  compare against the figure in front of them is not a ceiling they can
 *  work within — so it is converted once, here, and floored to a whole naira
 *  because the composer must never offer a figure the wallet cannot cover. */
const nairaCeiling = (own: number, asset: Asset = 'usdc'): number =>
  // Paid from naira, what stops you first is the naira you hold — but the
  // monthly ceiling still applies, because item 06 is one limit policy for
  // every outflow and a bill paid out of naira is an outflow. It is a dollar
  // figure, so it is brought into naira to be compared here.
  Math.min(own,
    Math.floor(Math.min(asset === 'ngn' ? state.naira / state.ngnPerUsd : state.cash,
                        movementCeiling()) * state.ngnPerUsd))

/** Which ceiling is actually doing the stopping, so the message names the real
 *  one. Four can bind here — the money, the month, the single payment, and the
 *  network's own limit — and the first three already have one sentence each. */
const capLabel = (own: number, whose: string, asset: Asset = 'usdc'): string => {
  const held = asset === 'ngn' ? state.naira / state.ngnPerUsd : state.cash
  if (own < Math.floor(Math.min(held, movementCeiling()) * state.ngnPerUsd)) return whose
  if (asset === 'ngn' && held <= movementCeiling()) return 'What you hold in naira'
  return ceilingLabel(held, 'The most you can spend here')
}

/** The three, with naira first when there is naira to spend. A bill is the one
 *  errand naira is actually for, so a balance that can cover it should not be
 *  the third pill along. */
const spendAssets = (): Asset[] => ASSETS.map((a) => a.key)

/** What each balance would have to give up for a bill of this many naira.
 *  Naira pays naira; a stablecoin pays the dollars it converts to. */
const needsFor = (ngn: number) => (a: Asset): number =>
  a === 'ngn' ? ngn : ngn / state.ngnPerUsd

/** Which balance an address names, falling back to the preference. */
const assetFrom = (q: URLSearchParams): Asset =>
  (assetOf(q.get('a') ?? '') ? q.get('a') : state.prefs.payWith) as Asset

/* ------------------------------------------------------------------- rail --
   The same rows as Send's, because it is the same idea: a way you are taking,
   lit, with the others still on screen so changing your mind is one press.
   `pick` is for the phone, where these rows are the place's own index. */

function spendRail(active?: Way): HTMLElement {
  return h('nav', { class: 'set-list ways' + (active ? ' rail' : ''), ariaLabel: 'What you can pay for' },
    ...WAYS.map((w) => {
      const row = h('button', {
        class: 'set-row' + (w.key === active ? ' on' : ''),
        on: { click: () => go('/spend/' + w.key) },
      },
        h('span', { class: 'who' },
          h('span', { class: 'mark', html: w.ic() }),
          h('span', { class: 'two-line' },
            h('span', { class: 't-body-strong', text: w.label }),
            h('small', { text: w.sub() }))),
        h('span', { class: 'muted set-chev', html: icon.chevron() }))
      if (w.key === active) row.setAttribute('aria-current', 'page')
      return row
    }))
}

/* ------------------------------------------------------------ what you paid --
   The place's own memory. A bill is nearly always a repeat — the same number,
   the same meter, the same month — so what was paid before is the fastest way
   to what is being paid now, and it is a record you can open. */

const BILLS = (): Activity[] => state.activity.filter((a) => !!a.bill)

function pastBills(): HTMLElement | null {
  const rows = BILLS().slice(0, 5)
  if (!rows.length) return null
  return card(
    cardHead('What you have paid for',
      h('button', { class: 'link', text: 'All payments',
        on: { click: () => go('/activity?filter=payments') } })),
    table(
      [
        { key: 'w', label: 'What' }, { key: 'when', label: 'When', optional: true },
        { key: 'ref', label: 'Reference', optional: true },
        { key: 'amt', label: 'Amount', align: 'right' },
      ],
      rows.map((a) => [
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: activityLabel(a) }),
          h('small', { class: 'muted', text: naira(a.bill!.naira) + ' · ' + a.who })),
        h('span', { class: 'muted', text: when(a.at) }),
        h('span', { class: 'muted', text: a.ref }),
        amountCell(a),
      ]),
      (i) => openSheet('receipt', { ref: rows[i].ref }),
      undefined,
      { lead: 'w', detail: ['when', 'ref'], figure: ['amt'] },
    ))
}

/** Numbers already topped up, with your own at the head of them. A person
 *  recharging is nearly always recharging one of two or three numbers, and
 *  eleven digits is eleven digits nobody should have to type twice. */
function knownNumbers(): { number: string; sub: string }[] {
  const out = [{ number: prettyNumber(state.person.phone), sub: 'Your own number' }]
  for (const a of BILLS()) {
    if (a.type === 'Electricity') continue
    const n = a.bill!.target
    if (out.some((x) => x.number === n)) continue
    out.push({ number: n, sub: 'Last paid ' + when(a.at) })
  }
  return out
}

/** Meters already paid, the same way. A household has one.
 *
 *  The kind comes off the record rather than out of the words on it: a token
 *  is minted for a prepaid payment and for nothing else, so its presence is
 *  the fact, and a row that carried the kind as prose would be a row that
 *  drifts the first time the prose is rewritten. */
function knownMeters(): { meter: string; sub: string; who: string; kind: MeterKind }[] {
  const out: { meter: string; sub: string; who: string; kind: MeterKind }[] = []
  for (const a of BILLS()) {
    if (a.type !== 'Electricity') continue
    const m = a.bill!.target
    if (out.some((x) => x.meter === m)) continue
    out.push({ meter: m, who: a.who, kind: a.bill!.token ? 'prepaid' : 'postpaid',
               sub: 'Last paid ' + when(a.at) })
  }
  return out
}

/* --------------------------------------------------------------- the parts -- */

/** The switch is off. Said once, in the panel, rather than as a refusal after
 *  somebody has typed a number and an amount. */
function pausedPanel(w: Way): HTMLElement {
  return card(
    cardHead(wayLabel(w), h('span', { class: 'pill warn', text: 'Paused' })),
    h('span', { class: 'muted',
      text: 'Paying bills is off right now. Everything else in your wallet still works, '
        + 'and anything already paid has gone through.' }))
}

/** Who it is for, above the amount. On a wide screen the rail two inches to
 *  the left is where you change it, so this states the target; on a phone the
 *  row is the way back to the step that set it. */
function targetRow(title: string, sub: string, ic: () => string, back: string): Node {
  const split = isSplit()
  return h('div', { class: 'stack-8' },
    h('span', { class: 't-caps subtle compose-label', text: 'For' }),
    h(split ? 'div' : 'button', {
      class: 'sheet-row', style: { background: 'var(--control)' },
      on: split ? {} : { click: () => go(back) },
    },
      h('span', { class: 'mark', html: ic() }),
      h('span', { class: 'two-line grow' },
        h('span', { class: 't-body-strong', text: title }),
        h('small', { text: sub })),
      split ? null : h('span', { class: 'link quiet', text: 'Change' })))
}

/** A phone number, typed or picked. Airtime and Data ask the same question and
 *  ask it the same way, so they ask it with the same thing.
 *
 *  The network is named as it is typed, off the prefix, and named as a guess —
 *  a number ported to another network keeps the prefix it was born with, so
 *  the prefix is a good default and never an assertion. */
function numberPanel(w: Way): (Node | null)[] {
  const input = h('input', {
    type: 'tel', inputmode: 'tel', placeholder: '0803 123 4567', ariaLabel: 'Phone number',
  })
  const field = h('label', { class: 'field' }, input)
  const err = fieldError(
    h('span', { html: icon.alert() }),
    h('span', { text: 'Eleven digits, starting 070, 071, 080, 081, 090 or 091.' }))
  err.hidden = true

  /* Whose network it is, answered here rather than a screen later.
     The prefix names it and the chips correct it, because a number ported to
     another network keeps the prefix it was born with — so the guess is a good
     default and never an assertion. It sits on this step and on no other: the
     network is part of who you are paying, the same as the number is, and the
     screen after this one asks how much. Putting it there as well would have
     been the same question in two places, and on a phone it would have been
     sixty-four pixels of a dialog that has to fit in 844. */
  let picked: Network | undefined
  const chips = h('div', { class: 'chip-row' })
  const netBox = h('div', { class: 'stack-8', hidden: true },
    h('span', { class: 't-caps subtle', text: 'Network' }), chips)
  const guess = h('span', { class: 'muted t-caption' })

  const netNow = (): Network | undefined => picked ?? guessNetwork(input.value)
  const paint = (): void => {
    const n = netNow()
    const ready = validNumber(input.value)
    netBox.hidden = !ready
    guess.textContent = ready && n && !picked
      ? `Looks like ${n.name}, by the prefix. Change it if the number was ported.`
      : ''
    for (const c of chips.children) {
      const el = c as HTMLElement
      el.setAttribute('aria-pressed', String(el.dataset.value === n?.key))
    }
  }
  for (const n of NETWORKS) {
    chips.appendChild(h('button', {
      class: 'chip', text: n.name, dataset: { value: n.key },
      on: { click: () => { picked = n; paint() } },
    }))
  }

  const submit = (): void => {
    if (!validNumber(input.value)) {
      field.classList.add('error')
      err.hidden = false
      input.focus()
      return
    }
    const n = netNow()
    go(`/spend/${w}?to=${digitsOf(input.value)}` + (n ? '&net=' + n.key : ''))
  }
  input.addEventListener('input', () => {
    field.classList.remove('error')
    err.hidden = true
    // A number retyped is a different number, so the correction goes with it.
    picked = undefined
    paint()
  })
  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') { e.preventDefault(); submit() }
  })
  paint()

  const known = knownNumbers()
  return [
    card(
      cardHead('Which number'),
      field, err, guess, netBox,
      h('button', { class: 'btn btn-secondary', text: 'Continue', on: { click: submit } })),
    card(
      cardHead('Numbers you have used'),
      h('div', { class: 'sheet-list' },
        ...known.map((k) => {
          const n = guessNetwork(k.number)
          return h('button', {
            class: 'sheet-row',
            on: { click: () => go(`/spend/${w}?to=${digitsOf(k.number)}`
              + (n ? '&net=' + n.key : '')) },
          },
            h('span', { class: 'mark', html: icon.phone() }),
            h('span', { class: 'two-line grow' },
              h('span', { class: 't-body-strong', text: k.number }),
              h('small', { text: (n?.name ?? 'Unknown network') + ' · ' + k.sub })),
            h('span', { class: 'muted', html: icon.chevron() }))
        })),
      providerNote('baxi')),
    card(
      cardHead(w === 'airtime' ? 'What airtime is' : 'What data is'),
      kv('Arrives', 'In a few seconds'),
      kv('Fee', 'No fee'),
      kv('Paid with', 'Your dollars'),
      kv('Rate', naira(state.ngnPerUsd) + ' to the dollar')),
  ]
}

/* ---------------------------------------------------------------- airtime -- */

function airtimeScreen(num: string): HTMLElement {
  const q = current().query
  const net = networkOf(q.get('net') ?? '') ?? guessNetwork(num) ?? NETWORKS[0]
  const rate = state.ngnPerUsd
  // The address wins over the preference, so a link that names a balance opens
  // on it. Nothing in the product writes one today; the review reads `a` and
  // so should the screen that fills it, or the two disagree about the same
  // address.
  let asset: Asset = assetFrom(q)
  const max = nairaCeiling(AIRTIME_CAP, asset)
  const steps = [{ label: 'Airtime', to: '/spend/airtime' }, { label: prettyNumber(num) }]

  const spec = {
    place: 'spend' as const,
    base: () => spendPicker('airtime'),
    title: 'Airtime',
    eyebrow: ['Cash available', usd(state.cash)] as [string, string],
    cardLabel: 'How much',
    cardRight: 'Cash ' + usd(state.cash),
    unit: NGN,
    initial: Math.min(1000, max),
    max,
    maxLabel: capLabel(AIRTIME_CAP, 'The most a network takes in one recharge', asset),
    pay: {
      assets: spendAssets(),
      get: () => asset,
      set: (a: Asset) => { asset = a },
      needs: needsFor(1000),
    },
    note: 'Goes straight onto the number. Usually within a few seconds.',
    quick: [
      { label: naira(200), value: 200 },
      { label: naira(500), value: 500 },
      { label: naira(1000), value: 1000 },
      { label: naira(2000), value: 2000 },
    ],
    lede: () => targetRow(prettyNumber(num), net.name + ' · phone number', icon.phone,
      '/spend/airtime'),
    // The naira figure is the one that was typed, so it leads. What it costs
    // is the fact this product exists to make plain, so it is next, and the
    // rate that turns one into the other is under both of them.
    // Four rows, and none of them said anywhere else on the card. There is no
    // 'Number' because the lede names it, and no 'Arrives' because the line
    // under the figure says it — and on a phone a fifth row is the one that
    // pushes this dialog past 743 and puts a fold button under the fold.
    summary: (v: number): [string, string, string?][] => asset === 'ngn'
      // Nothing converts, so there is no cost in another currency and no rate:
      // the figure typed is the figure that leaves, and printing a rate here
      // would be printing a number nobody was quoted.
      ? [
          ['Comes out of', 'Your naira'],
          ['Fee', 'No fee'],
          ['Network', net.name],
        ]
      : [
          ['Costs you', usd(v / rate)],
          ['Rate', '1 dollar = ' + naira(rate)],
          ['Fee', 'No fee'],
          ['Network', net.name],
        ],
    callout: 'Paid straight out of the balance above. What reaches the network is naira.',
    action: (v: number) => 'Buy ' + naira(v) + ' airtime',
    onAction: (v: number) => openSheet('spend-review', {
      way: 'airtime', to: num, net: net.key, v: String(v), a: asset,
    }),
  }

  if (isSplit()) {
    return shell('spend',
      pageHeader('Spend', eyebrow('Cash available', usd(state.cash)), { steps }),
      h('div', { class: 'row set-split' },
        h('div', { class: 'stack set-col' }, spendRail('airtime')),
        h('div', { class: 'stack grow set-panel' },
          composerScreen({ ...spec, inline: true }),
          pastBills())))
  }
  return composerScreen({ ...spec, bottom: pastBills() ?? undefined })
}

/* ------------------------------------------------------------------- data -- */

/** The plans, for the network the number is on. No composer: the price of a
 *  bundle is the price of the bundle, and a keypad in front of a fixed price
 *  is a question with one right answer. */
function dataPanel(num: string, n: Network): (Node | null)[] {
  const q = current().query
  const asset: Asset = assetFrom(q)
  const ceiling = nairaCeiling(METER_CAP, asset)

  const list = h('div', { class: 'sheet-list' })
  {
    const plans = plansFor(n.key)
    list.replaceChildren(...plans.map((p) => {
      const tooMuch = p.price > ceiling
      return h('button', {
        class: 'sheet-row', disabled: tooMuch,
        on: { click: () => openSheet('spend-review',
          { way: 'data', to: num, net: n.key, plan: p.key, a: asset }) },
      },
        h('span', { class: 'mark', html: icon.signal() }),
        h('span', { class: 'two-line grow' },
          h('span', { class: 't-body-strong', text: p.size }),
          h('small', { text: p.lasts + ' · ' + usd(p.price / state.ngnPerUsd) })),
        h('span', { class: 't-body-strong', text: naira(p.price) }),
        tooMuch
          ? h('span', { class: 'pill warn', text: 'Over your limit' })
          : h('span', { class: 'muted', html: icon.chevron() }))
    }))
  }

  return [
    card(
      cardHead('Which bundle', h('span', { class: 'muted', text: 'Cash ' + usd(state.cash) })),
      targetRow(prettyNumber(num), n.name + ' · phone number', icon.phone, '/spend/data'),
      // A page rather than a dialog, so this navigates: the choice has to
      // survive into the review, and the list of plans has to redraw against
      // the balance that would pay for them.
      payRow({
        assets: spendAssets(), get: () => asset, needs: needsFor(1500),
        set: (a) => go(`/spend/data?to=${digitsOf(num)}&net=${n.key}&a=${a}`),
      }),
      list,
      callout(asset === 'ngn'
        ? 'Every price is what the network charges, paid straight out of your naira. '
          + 'Nothing is converted.'
        : 'Every price is what the network charges. Paid out of your dollars at '
          + `${naira(state.ngnPerUsd)} to the dollar, with no fee on top.`)),
    card(
      cardHead('What a bundle is'),
      kv('Starts', 'The moment it lands'),
      kv('Fee', 'No fee'),
      kv('Paid with', 'Your dollars'),
      // The one thing worth saying twice, because it is the one thing nobody
      // can undo: the network credits the number it was given.
      kv('Wrong number', 'The network keeps it')),
  ]
}

/* ------------------------------------------------------------ electricity -- */

/** Whose meter it is, and which kind. The disco is the first question because
 *  a meter number only means anything to the company that issued it. */
function discoPanel(): (Node | null)[] {
  const known = knownMeters()
  return [
    known.length
      ? card(
          cardHead('Meters you have paid'),
          h('div', { class: 'sheet-list' },
            ...known.map((k) => {
              const d = DISCOS.find((x) => x.name === k.who)
              return h('button', {
                class: 'sheet-row',
                on: { click: () => go('/spend/electricity?disco=' + (d?.key ?? DISCOS[0].key)
                  + '&kind=' + k.kind + '&meter=' + k.meter.replace(/[^0-9]/g, '')) },
              },
                h('span', { class: 'mark', html: icon.bolt() }),
                h('span', { class: 'two-line grow' },
                  h('span', { class: 't-body-strong', text: k.meter }),
                  h('small', { text: `${k.who} · ${k.kind === 'prepaid' ? 'Prepaid' : 'Postpaid'} · ${k.sub}` })),
                h('span', { class: 'muted', html: icon.chevron() }))
            })))
      : null,
    card(
      cardHead('Who supplies you'),
      h('div', { class: 'sheet-list' },
        ...DISCOS.map((d) => h('button', {
          class: 'sheet-row',
          on: { click: () => go('/spend/electricity?disco=' + d.key) },
        },
          h('span', { class: 'mark', html: icon.bolt() }),
          h('span', { class: 'two-line grow' },
            h('span', { class: 't-body-strong', text: d.name }),
            h('small', { text: d.where })),
          h('span', { class: 'muted', html: icon.chevron() })))),
      providerNote('baxi')),
  ]
}

/** The meter, checked with the disco before anybody pays.
 *
 *  The name coming back is the whole point of the step: paying the wrong meter
 *  is money gone and there is nobody to ask for it back. So the check is live,
 *  the answer is a name and an address, and a number that is not on the
 *  register cannot get past this panel. */
function meterPanel(disco: string, kind: MeterKind, start: string): (Node | null)[] {
  const d = discoOf(disco)!
  const input = h('input', {
    type: 'text', inputmode: 'numeric', placeholder: '4512 3456 780',
    ariaLabel: 'Meter number', value: start ? prettyMeter(start) : '',
  })
  const field = h('label', { class: 'field' }, input)
  const err = fieldError(h('span', { html: icon.alert() }), h('span', { text: '' }))
  err.hidden = true
  const found = h('div', { class: 'stack-8' })
  const go2 = h('button', { class: 'btn btn-primary', text: 'Continue', disabled: true })

  const paint = (): void => {
    const raw = input.value.replace(/[^0-9]/g, '')
    found.replaceChildren()
    field.classList.remove('error')
    err.hidden = true
    go2.toggleAttribute('disabled', true)
    if (!raw) return
    if (!validMeter(raw)) {
      // Not an error while somebody is still typing: eleven digits arrive one
      // at a time, and a field that goes red on the third of them is a field
      // shouting at somebody who has done nothing wrong yet.
      if (raw.length < 11) return
      field.classList.add('error')
      err.hidden = false
      err.lastElementChild!.textContent = 'A meter number is eleven to thirteen digits.'
      return
    }
    const m = resolveMeter(raw)
    if (!m) {
      field.classList.add('error')
      err.hidden = false
      err.lastElementChild!.textContent =
        `${d.name} has no meter with that number. Check the digits on the meter itself.`
      return
    }
    found.replaceChildren(
      h('div', { class: 'set-banner' },
        h('span', { class: 'mark', html: icon.check() }),
        h('span', { class: 'two-line grow' },
          h('span', { class: 't-body-strong', text: m.name }),
          h('small', { text: m.address + ' · ' + d.name }))))
    go2.toggleAttribute('disabled', false)
  }

  const submit = (): void => {
    const raw = input.value.replace(/[^0-9]/g, '')
    if (!resolveMeter(raw)) return
    go(`/spend/electricity?disco=${disco}&kind=${kind}&meter=${raw}`)
  }
  input.addEventListener('input', paint)
  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') { e.preventDefault(); submit() }
  })
  go2.addEventListener('click', submit)
  paint()

  const kindChip = (k: MeterKind, label: string, sub: string) =>
    h('button', {
      class: 'chip', text: label, title: sub, ariaPressed: k === kind,
      on: { click: () => go(`/spend/electricity?disco=${disco}&kind=${k}`
        + (input.value ? '&meter=' + input.value.replace(/[^0-9]/g, '') : '')) },
    })

  return [
    card(
      cardHead(d.name, h('button', { class: 'link', text: 'Change',
        on: { click: () => go('/spend/electricity') } })),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Which kind of meter' }),
        h('div', { class: 'chip-row' },
          kindChip('prepaid', 'Prepaid', 'You buy units in advance'),
          kindChip('postpaid', 'Postpaid', 'You are billed for what you used')),
        h('span', { class: 'muted t-caption', text: kind === 'prepaid'
          ? 'You get a twenty digit token to type into the meter.'
          : 'This comes off what you owe on your next bill.' })),
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Meter number' }),
        field, err, found),
      go2),
    card(
      cardHead('Before you pay'),
      kv('Checked', 'The name comes back from ' + d.name),
      kv('Fee', 'No fee'),
      kv('Paid with', 'Your dollars'),
      kv('Wrong meter', 'It cannot be recalled')),
  ]
}

function meterCompose(disco: string, kind: MeterKind, meter: string): HTMLElement {
  const d = discoOf(disco)!
  const m = resolveMeter(meter)!
  const rate = state.ngnPerUsd
  let asset: Asset = assetFrom(current().query)
  const max = nairaCeiling(METER_CAP, asset)
  const steps = [
    { label: 'Electricity', to: '/spend/electricity' },
    { label: d.name, to: `/spend/electricity?disco=${disco}&kind=${kind}` },
    { label: prettyMeter(meter) },
  ]

  const spec = {
    place: 'spend' as const,
    base: () => spendShell('electricity',
      [{ label: 'Electricity', to: '/spend/electricity' }, { label: d.name }],
      meterPanel(disco, kind, meter)),
    title: 'Electricity',
    eyebrow: ['Cash available', usd(state.cash)] as [string, string],
    cardLabel: kind === 'prepaid' ? 'How many units' : 'How much off the bill',
    cardRight: 'Cash ' + usd(state.cash),
    unit: NGN,
    initial: Math.min(10000, max),
    max,
    maxLabel: capLabel(METER_CAP, 'The most a disco takes against one meter', asset),
    pay: {
      assets: spendAssets(),
      get: () => asset,
      set: (a: Asset) => { asset = a },
      needs: needsFor(10000),
    },
    note: kind === 'prepaid'
      ? 'You get a token to type into the meter.'
      : 'Comes off what you owe on your next bill.',
    quick: [
      { label: naira(2000), value: 2000 },
      { label: naira(5000), value: 5000 },
      { label: naira(10000), value: 10000 },
      { label: naira(20000), value: 20000 },
    ],
    lede: () => targetRow(m.name, prettyMeter(meter) + ' · ' + d.name, icon.bolt,
      `/spend/electricity?disco=${disco}&kind=${kind}&meter=${meter}`),
    summary: (v: number): [string, string, string?][] => asset === 'ngn'
      ? [
          ['Comes out of', 'Your naira'],
          ['Fee', 'No fee'],
          ['Arrives', kind === 'prepaid' ? 'Straight away' : 'Against your next bill'],
        ]
      : [
          ['Costs you', usd(v / rate)],
          ['Rate', '1 dollar = ' + naira(rate)],
          ['Fee', 'No fee'],
          // Not 'Kind': the line under the figure already says which, in the
          // words that matter — a token you type in, or money off the bill.
          ['Arrives', kind === 'prepaid' ? 'Straight away' : 'Against your next bill'],
        ],
    callout: kind === 'prepaid'
      ? 'The token comes back on the next screen and stays on the receipt.'
      : 'This is a payment against the account, not a settlement of it.',
    action: (v: number) => 'Pay ' + naira(v),
    onAction: (v: number) => openSheet('spend-review', {
      way: 'electricity', disco, kind, meter, v: String(v), a: asset,
    }),
  }

  if (isSplit()) {
    return shell('spend',
      pageHeader('Spend', eyebrow('Cash available', usd(state.cash)), { steps }),
      h('div', { class: 'row set-split' },
        h('div', { class: 'stack set-col' }, spendRail('electricity')),
        h('div', { class: 'stack grow set-panel' },
          composerScreen({ ...spec, inline: true }),
          pastBills())))
  }
  return composerScreen({ ...spec, bottom: pastBills() ?? undefined })
}

/* ------------------------------------------------------------------ shell -- */

/** The rail beside a panel on a wide screen, the panel alone on a phone. One
 *  shape, so the place is not written three times. */
function spendShell(w: Way, steps: { label: string; to?: string }[],
                    body: (Node | null)[]): HTMLElement {
  const head = pageHeader('Spend', eyebrow('Cash available', usd(state.cash)),
    steps.length ? { steps } : {})
  if (!isSplit()) return shell('spend', head, ...body, pastBills())
  return shell('spend', head,
    h('div', { class: 'row set-split' },
      h('div', { class: 'stack set-col' }, spendRail(w)),
      h('div', { class: 'stack grow set-panel' }, ...body, pastBills())))
}

function wayPanel(w: Way): (Node | null)[] {
  if (!on()) return [pausedPanel(w)]
  if (w === 'electricity') return discoPanel()
  return numberPanel(w)
}

function spendPicker(w: Way): HTMLElement {
  return spendShell(w, [{ label: wayLabel(w) }], wayPanel(w))
}

/** The place, with nothing chosen yet.
 *
 *  On a wide screen the first way fills the panel, because a column of rows
 *  beside nothing is a screen that looks broken — and the address says so,
 *  because a screen showing one thing under an address that names another is
 *  the fault rule 144 exists to stop. On a phone the three ways are the whole
 *  screen, which is what a place looks like at that width. */
function spendIndex(): HTMLElement {
  if (isSplit()) {
    queueMicrotask(() => go('/spend/airtime', true))
    return spendPicker('airtime')
  }
  return shell('spend',
    pageHeader('Spend', eyebrow('Cash available', usd(state.cash))),
    on() ? null : card(
      cardHead('Bills', h('span', { class: 'pill warn', text: 'Paused' })),
      h('span', { class: 'muted',
        text: 'Paying bills is off right now. Everything else in your wallet still works.' })),
    card(cardHead('What would you like to pay for'), spendRail()),
    pastBills())
}

export function spendScreen(sub?: string): HTMLElement {
  const q = current().query
  const w = WAYS.find((x) => x.key === sub)?.key
  if (!w) return spendIndex()
  if (!on()) return spendShell(w, [{ label: wayLabel(w) }], [pausedPanel(w)])

  if (w === 'electricity') {
    const disco = q.get('disco') ?? ''
    if (!discoOf(disco)) return spendPicker('electricity')
    const kind: MeterKind = q.get('kind') === 'postpaid' ? 'postpaid' : 'prepaid'
    const meter = (q.get('meter') ?? '').replace(/[^0-9]/g, '')
    // A meter that resolves is a meter you can pay; anything else lands on the
    // panel that asks for one, with what was typed still in the field.
    if (meter && resolveMeter(meter)) return meterCompose(disco, kind, meter)
    return spendShell('electricity',
      [{ label: 'Electricity', to: '/spend/electricity' }, { label: discoOf(disco)!.name }],
      meterPanel(disco, kind, meter))
  }

  const to = digitsOf(q.get('to') ?? '')
  if (!validNumber(to)) return spendPicker(w)
  if (w === 'airtime') return airtimeScreen(to)
  const net = networkOf(q.get('net') ?? '') ?? guessNetwork(to) ?? NETWORKS[0]
  return spendShell('data',
    [{ label: 'Data', to: '/spend/data' }, { label: prettyNumber(to) }],
    dataPanel(to, net))
}

/* --------------------------------------------------------- read by sheets -- */

/** What a review is about, rebuilt from the address it was opened at. A dialog
 *  that cannot be reconstructed from the route is a dialog that loses its
 *  subject on a refresh — and this one carries the only copy of what somebody
 *  is about to pay for. */
export interface BillOrder {
  way: Way
  /** What the activity row will be called. */
  what: string
  /** Who takes the money. */
  who: string
  /** What it is for, as a person would read it back. */
  target: string
  naira: number
  /** What you get for the money, when it is a thing rather than an amount. A
   *  bundle's size and length is the whole product; airtime and units are the
   *  figure itself and have nothing to add. */
  note?: string
  /** Whose meter it is, as the disco's register has it. The reason the check
   *  exists, so it is stated again at the commit. */
  holder?: string
  kind?: MeterKind
  /** Which balance pays for it. Carried on the address so the review is
   *  rebuildable from it — a dialog that lost this on a refresh would be a
   *  dialog about a different payment. */
  asset: Asset
}

export function billFrom(q: URLSearchParams): BillOrder | null {
  const way = q.get('way') as Way | null
  const asset = assetFrom(q)
  if (way === 'airtime') {
    const to = digitsOf(q.get('to') ?? '')
    const net = networkOf(q.get('net') ?? '') ?? guessNetwork(to)
    const v = Number(q.get('v') ?? 0)
    if (!validNumber(to) || !net || !(v > 0)) return null
    return { way, what: 'Airtime', who: net.name, target: prettyNumber(to), naira: v, asset }
  }
  if (way === 'data') {
    const to = digitsOf(q.get('to') ?? '')
    const p: Plan | undefined = planOf(q.get('plan') ?? '')
    if (!validNumber(to) || !p) return null
    const net = networkOf(q.get('net') ?? '') ?? guessNetwork(to) ?? NETWORKS[0]
    return { way, what: 'Data', who: net.name, target: prettyNumber(to),
             naira: p.price, note: `${p.size} for ${p.lasts}`, asset }
  }
  if (way === 'electricity') {
    const d = discoOf(q.get('disco') ?? '')
    const meter = (q.get('meter') ?? '').replace(/[^0-9]/g, '')
    const m = resolveMeter(meter)
    const v = Number(q.get('v') ?? 0)
    if (!d || !m || !(v > 0)) return null
    const kind: MeterKind = q.get('kind') === 'postpaid' ? 'postpaid' : 'prepaid'
    return { way, what: 'Electricity', who: d.name, target: prettyMeter(meter), naira: v,
             holder: m.name, kind, asset }
  }
  return null
}
