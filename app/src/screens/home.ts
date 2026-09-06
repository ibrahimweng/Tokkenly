import { h, link } from '../ui'
import { icon } from '../icons'
import { barChart, type Range } from '../components/chart'
import { dotArt, BUY, CONVERT, BORROW, type ArtSpec } from '../components/art'
import { shell, pageHeader, bell, jumpOpen } from '../components/shell'
import { card, cardHead, headLink, kv, amount, directionMark, privacyToggle } from '../components/bits'
import { table } from '../components/table'
import {
  state, actions, holdingsValue, availableToBorrow, buyingPower, verified, LIMITS, money,
} from '../state'
import { usd, signed, when, pct, shares, greeting, activityLabel } from '../format'
import { go } from '../router'
import { isMobile } from '../responsive'

/** The line under the greeting, which used to assert that nothing needed
 *  attention on every render — including on an account that had not verified,
 *  whose limits were a tenth of what they could be, and for whom Buy and
 *  Withdraw were both shut because of it. It says what is true instead. */
function standing(): string {
  const settling = state.activity.filter((a) => !a.settled).length
  if (settling) {
    return settling === 1
      ? 'One payment is still settling.'
      : `${settling} payments are still settling.`
  }
  if (!verified()) return 'Everything is settled. One thing is waiting on you.'
  return 'Everything is settled. Nothing needs your attention.'
}

/** The one thing standing between an account and the rest of the product. It
 *  was named on Transfer and on Account, and nowhere on the screen everyone
 *  lands on. Not dismissible: it is shut two flows, and the way to be rid of
 *  it is to do it — hiding it would leave the app broken and quiet about it. */
function verifyTask(): HTMLElement | null {
  if (verified()) return null
  const a = link('/verify/what', 'card task')
  a.appendChild(h('span', { class: 'task-ic', html: icon.lock() }))
  a.appendChild(h('span', { class: 'two-line grow' },
    h('span', { class: 't-body-strong', text: 'Verify to lift your limits' }),
    h('small', { class: 'muted',
      text: `A NIN or a BVN, and a minute. Until then you can move ${usd(LIMITS.none.single, false)} at once and ${usd(LIMITS.none.monthly, false)} a month.` })))
  a.appendChild(h('span', { class: 'muted', html: icon.chevron() }))
  return a
}

function viewToggle(): HTMLElement {
  const mk = (v: 'simple' | 'detailed', label: string) =>
    h('button', {
      class: 'chip',
      text: label,
      ariaPressed: state.prefs.homeView === v,
      on: { click: () => { actions.setHomeView(v); go('/') } },
    })
  return h('div', { class: 'chip-row' }, mk('simple', 'Simple'), mk('detailed', 'Detailed'))
}

function quickAction(label: string, sub: string, ic: string, to: string): HTMLElement {
  const a = link(to, 'card grow tile')
  a.style.textDecoration = 'none'
  a.appendChild(h('div', { class: 'promo-badge', html: ic }))
  a.appendChild(h('div', { class: 'spacer' }))
  a.appendChild(h('div', { class: 'stack-8' },
    h('span', { class: 't-title', text: label }),
    h('span', { class: 'muted', text: sub })))
  return a
}

function activityRows(limit: number) {
  return state.activity.slice(0, limit).map((a) => [
    h('span', { class: 'who' }, directionMark(a.amount),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: activityLabel(a) }),
        h('small', { text: a.ref + ' · ' + when(a.at) }))),
    h('span', { class: 'pill', text: a.settled ? 'Settled' : 'Pending' }),
    amount(a),
  ])
}

/** Six ranges of the portfolio. The percentages are the product's own
 *  figures — +1.16% today and +17.28% all in are already on this screen — and
 *  the series is pinned to them at both ends, so the caption under the chart
 *  is read off the bars rather than asserted beside them. */
const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
const day = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short' })
const date = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' })
const monthYear = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })

const RANGES: Range[] = [
  { key: '1D', days: 1, pct: 1.16, vol: 0.05, fmt: time, over: 'today' },
  { key: '1W', days: 7, pct: 2.4, vol: 0.07, fmt: day, over: 'this week' },
  { key: '1M', days: 30, pct: 4.1, vol: 0.06, fmt: date },
  { key: '3M', days: 91, pct: 8.7, vol: 0.07, fmt: date },
  { key: '1Y', days: 365, pct: 17.28, vol: 0.09, fmt: month },
  { key: 'ALL', days: 900, pct: 24.6, vol: 0.11, fmt: monthYear, over: 'all time' },
]

function chart(): HTMLElement {
  return h('section', { class: 'card' }, barChart({
    ranges: RANGES,
    initial: '1Y',
    title: 'Portfolio over time',
    endValue: state.cash + state.inEarn + holdingsValue(),
    shape: 'area',
  }))
}

export function homeScreen(): HTMLElement {
  return state.prefs.homeView === 'simple' ? gateway() : detailed()
}

/** What a range's change is worth in money, read off the same table the chart
 *  on this screen draws from. A figure stated beside a chart and the chart
 *  itself have to be the same claim. */
function gainOver(key: string, endValue: number): { amount: number; pct: number } {
  const r = RANGES.find((x) => x.key === key) ?? RANGES[RANGES.length - 1]
  return { amount: endValue - endValue / (1 + r.pct / 100), pct: r.pct }
}

function detailed(): HTMLElement {
  // The same number Simple shows, because it is the same account. This view
  // used to show holdings alone under no label at all, so switching Simple to
  // Detailed appeared to delete the cash and the Earn balance — $16,229.18
  // became $12,509.18 with nothing to explain it.
  const value = state.cash + state.inEarn + holdingsValue()
  const move = dayMove()
  const all = gainOver('ALL', value)
  const positions = card(
    cardHead('Your positions', headLink('Invest', '/invest')),
    ...state.holdings.map((p) => {
      const row = h('div', { class: 'kv', style: { cursor: 'pointer' } },
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: p.ticker }),
          h('small', { text: `${p.name} · ${shares(p.shares)} shares` })),
        h('span', { class: 'two-line right' },
          h('span', { class: 't-body-strong', text: money(p.shares * p.price) }),
          h('small', { class: p.dayPct >= 0 ? 'pos' : 'muted', text: (p.dayPct >= 0 ? '+' : '') + pct(p.dayPct) })))
      row.addEventListener('click', () => go('/invest/' + p.ticker.toLowerCase()))
      return row
    })
  )

  const growCard = card(
    cardHead('Grow', headLink('Open Grow', '/grow')),
    h('span', { class: 't-body-strong', text: `${usd(availableToBorrow(), false)} to borrow against your shares, at ${pct(state.rates.borrow)} a year` }),
    h('span', { class: 't-body-strong', text: `${pct(state.rates.earn)} a year on dollars you are not using, paid every day` })
  )

  const available = card(
    cardHead('Available'),
    kv('Cash', money(state.cash)),
    kv('Buying power', money(buyingPower())),
    kv('Total gain', h('span', {
      class: (all.amount >= 0 ? 'pos' : 'warn') + ' t-body-strong',
      text: `${signed(all.amount)} (${all.pct >= 0 ? '+' : ''}${pct(all.pct)})`,
    }))
  )

  return shell(
    'home',
    pageHeader(greeting() + ', ' + state.person.name.split(' ')[0],
      h('div', { class: 'header-actions' },
        isMobile() ? null : jumpOpen(), viewToggle(), privacyToggle(), bell())),
    verifyTask(),
    h('div', { class: 'row' },
      h('div', { class: 'stack', style: { width: '308px', flex: 'none' } },
        h('div', { class: 'stack-8' },
          h('span', { class: 'muted', text: standing() }),
          h('span', { class: 't-caps subtle', text: 'Total portfolio' }),
          h('span', { class: 't-display-xl', text: money(value) }),
          h('span', {},
            h('span', { class: (move.amount >= 0 ? 'pos' : 'warn') + ' t-body-strong',
              text: `${move.amount >= 0 ? '+' : ''}${money(move.amount)} (${move.amount >= 0 ? '+' : ''}${pct(move.pct)})` }),
            h('span', { class: 'muted', text: '  Today' }))),
        h('div', { class: 'chip-row' },
          h('button', { class: 'btn btn-primary btn-sm', text: 'Send', on: { click: () => go('/send') } }),
          h('button', { class: 'btn btn-secondary btn-sm', text: 'Receive', on: { click: () => go('/receive') } }))),
      h('div', { class: 'row grow tiles' },
        quickAction('Buy', 'Shares and funds', icon.buy(), '/invest'),
        quickAction('Convert', 'Naira and dollars', icon.convert(), '/withdraw'),
        quickAction('Borrow', 'Against your shares', icon.download(), '/grow/borrow'))),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        chart(),
        card(
          cardHead('Recent activity', headLink('See all', '/activity')),
          table(
            [{ key: 'who', label: '' }, { key: 'state', label: '' }, { key: 'amt', label: '', align: 'right' }],
            activityRows(4),
            (i) => go('/activity?sheet=receipt&ref=' + state.activity[i].ref)
          )
        )),
      h('div', { class: 'stack col-side' }, growCard, positions, available))
  )
}

/** Figma 06 Desktop, D01c Home — gateway. Three tiles, 400 / 288 / 288 in a
 *  1008 column with 16 between them, each 300 tall with 28 of padding, and a
 *  dot field bleeding to the bottom edge. The first one is wider and carries
 *  the gradient, because buying a share is the thing this screen is for. */
function gateway(): HTMLElement {
  const tile = (
    opts: { title: string; sub: string; cta: string; to: string; art: ArtSpec; lead?: boolean },
  ) => {
    const a = link(opts.to, 'card gate' + (opts.lead ? ' gate-lead' : ''))
    a.style.textDecoration = 'none'
    a.appendChild(h('div', { class: 'gate-words' },
      h('span', { class: 't-title', text: opts.title }),
      h('span', { class: 'muted', text: opts.sub })))
    a.appendChild(h('span', { class: 'gate-cta' },
      h('span', { text: opts.cta }),
      h('span', { class: 'ic', html: icon.chevron() })))
    a.appendChild(h('div', { class: 'gate-art' }, dotArt(opts.art)))
    return a
  }
  // Two rows, the way D01c has them: the greeting carries the name and the
  // one line of reassurance, the portfolio carries the number and the two
  // things you would do with it. The search and the bell are the app's own
  // and stay beside the toggle.
  const total = state.cash + state.inEarn + holdingsValue()
  const move = dayMove()
  return shell(
    'home',
    // The greeting is the page's title here, so it takes the header row and the
    // toggle sits beside it, the way D01c has it — not on a line of its own
    // above an empty heading.
    h('header', { class: 'page-header' },
      h('div', { class: 'page-header-row' },
        h('div', { class: 'stack-12' },
          h('h1', { class: 't-display', text: greeting() + ', ' + state.person.name.split(' ')[0] }),
          h('span', { class: 'muted', text: standing() })),
        h('div', { class: 'header-actions' },
          // The phone's top bar already carries a search; two of them 40px
          // apart is not twice as findable.
          isMobile() ? null : jumpOpen(), viewToggle(), privacyToggle(), bell()))),
    verifyTask(),
    h('div', { class: 'headline' },
      h('div', { class: 'stack-8' },
        h('span', { class: 't-caps subtle', text: 'Total portfolio' }),
        h('span', { class: 't-figure', text: money(total) }),
        h('span', { class: 'delta' },
          h('span', { class: (move.amount >= 0 ? 'pos' : 'warn') + ' t-body-strong',
            text: `${move.amount >= 0 ? '+' : ''}${money(move.amount)} (${move.amount >= 0 ? '+' : ''}${pct(move.pct)})` }),
          h('span', { class: 'muted', text: 'today' }))),
      h('div', { class: 'headline-actions' },
        link('/send', 'btn btn-primary btn-wide', 'Send'),
        link('/receive', 'btn btn-secondary btn-wide', 'Receive'))),
    h('div', { class: 'gates' },
      tile({ lead: true, art: BUY, to: '/invest', title: 'Buy Stocks', cta: 'Buy shares',
        sub: 'Own a piece of Apple, Nvidia or a whole market fund. From $1.' }),
      tile({ art: CONVERT, to: '/withdraw', title: 'Convert Cash', cta: 'Convert money',
        sub: 'Move between naira and dollars at the rate you see.' }),
      tile({ art: BORROW, to: '/grow', title: 'Borrow or Lend', cta: 'See your limit',
        sub: 'Borrow against your shares without selling them.' })),
    // D01c draws the activity straight onto the canvas, with no card behind
    // it — the tiles above are the objects on this screen, and a fourth panel
    // under them flattens all four.
    h('section', { class: 'stack-8' },
      cardHead('Recent activity', headLink('See all', '/activity')),
      table(
        [{ key: 'who', label: '' }, { key: 'state', label: '' }, { key: 'amt', label: '', align: 'right' }],
        activityRows(5),
        (i) => go('/activity?sheet=receipt&ref=' + state.activity[i].ref)
      )
    )
  )
}

/** What the portfolio did today: the holdings' own day moves against the cash
 *  and Earn balances, which do not move with the market. */
function dayMove(): { amount: number; pct: number } {
  const now = holdingsValue()
  const before = state.holdings.reduce((t, p) => t + (p.shares * p.price) / (1 + p.dayPct / 100), 0)
  const total = state.cash + state.inEarn + now
  const amount = now - before
  return { amount, pct: total - amount ? (amount / (total - amount)) * 100 : 0 }
}
