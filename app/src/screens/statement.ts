import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout } from '../components/bits'
import { usd, naira, shares, longWhen } from '../format'
import { go } from '../router'
import * as ledger from '../ledger'

/* ---------------------------------------------------------------------------
   The proof.

   The rest of the product asks to be believed. This screen does not: it shows
   every account the money passes through, what each one holds, and both ends
   of every movement that put it there. Two claims are made on it and both are
   checkable without leaving the page.

   One: within a currency, the three books come to nothing between them. What
   is yours and what is ours is exactly what came in from outside, so a total
   of anything other than zero would mean the product had invented money.

   Two: every line has two ends. There is no "and then $200 appeared".

   It is not a debugging view. A person who wants to know where their money
   went is the reader, and the reason to build it is that a product which
   cannot show its own workings is a product asking for trust it has not
   earned.
   --------------------------------------------------------------------------- */

const BOOKS: { key: ledger.Book; title: string; what: string }[] = [
  { key: 'yours', title: 'Yours', what: 'The balances the rest of the app shows you' },
  { key: 'ours', title: 'Tokkenly', what: 'Our own accounts, in the middle of every movement' },
  { key: 'theirs', title: 'Outside', what: 'Banks, cards, the network and the market' },
]

/** A negative balance is not "$-380.00". The minus goes in front of the
 *  currency, the way it does everywhere else in the product.
 *
 *  Three kinds of thing appear here and only two of them are money. A ticker
 *  is counted in shares — "23.4200 AAPL" — because printing a share count with
 *  a dollar sign in front of it is exactly the confusion this screen exists to
 *  remove. */
function show(n: number, c: ledger.Currency): string {
  const sign = n < 0 ? '\u2212' : ''
  const m = Math.abs(n)
  if (c === 'NGN') return sign + naira(m)
  if (c === 'USD') return sign + usd(m)
  return sign + shares(m) + ' ' + c
}

/** One side of a movement: the account, and what it gained or gave up. */
function leg(e: ledger.Entry): HTMLElement {
  const a = ledger.account(e.account)
  const out = e.amount < 0
  return h('div', { class: 'leg' },
    h('span', { class: 'leg-dir ' + (out ? 'out' : 'in'), text: out ? '−' : '+' }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: a.name }),
      h('small', { text: a.what })),
    h('span', { class: (out ? '' : 'pos ') + 't-body-strong nowrap',
      text: show(Math.abs(e.amount), a.currency) }))
}

function movement(p: ledger.Posting): HTMLElement {
  return h('section', { class: 'card post' },
    h('div', { class: 'card-head' },
      h('h2', { class: 't-body-strong', text: p.what }),
      h('span', { class: 'subtle t-caption nowrap', text: longWhen(p.at) })),
    h('div', { class: 'stack-8' }, ...p.entries.map(leg)),
    h('div', { class: 'post-foot' },
      h('span', { class: 'subtle t-caption', text: p.ref }),
      p.rate
        ? h('span', { class: 'subtle t-caption',
            text: 'At ' + naira(p.rate) + ' to the dollar' })
        : null))
}

const zero = (t: ledger.Trial): boolean => Math.abs(t.sum) < 0.005

const balancedPill = (level: boolean, off: string): HTMLElement =>
  h('span', { class: 'pill' + (level ? ' pos' : ' warn'),
    text: level ? 'Balanced' : 'Off by ' + off })

/** One row per account, grouped by whose it is. */
function rowsFor(t: ledger.Trial): HTMLElement[] {
  const out: HTMLElement[] = []
  for (const b of BOOKS) {
    const rows = t.rows.filter((r) => r.account.book === b.key)
    if (!rows.length) continue
    out.push(h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: b.title }),
      ...rows.map((r) => kv(r.account.name, show(r.balance, t.currency),
        r.balance < 0 ? 'warn t-body-strong' : 't-body-strong'))))
  }
  return out
}

const sumRow = (t: ledger.Trial, label: string): HTMLElement =>
  h('div', { class: 'trial-sum' + (zero(t) ? '' : ' off') },
    h('span', { class: 't-caps', text: label }),
    h('span', { class: 't-body-strong', text: show(t.sum, t.currency) }))

/** Every account and what it holds, per currency, with the total that has to
 *  be nothing.
 *
 *  The two money currencies get a card each. The tickers share one, because a
 *  card per company would push the money — the thing somebody came here to
 *  check — off the screen by the fourth holding, and because they all make the
 *  same claim: what is in custody for you is exactly what left the market. */
function balances(): HTMLElement[] {
  const all = ledger.trial()
  const money = all.filter((t) => ledger.MONEY.includes(t.currency))
  const tickers = all.filter((t) => !ledger.MONEY.includes(t.currency))

  const cards = money.map((t) => card(
    cardHead(t.currency === 'NGN' ? 'Naira' : 'Dollars',
      balancedPill(zero(t), show(t.sum, t.currency))),
    // Nothing in a currency is a state worth naming. An empty card under a
    // "Balanced" pill otherwise reads as a screen that failed to load, when
    // what it means is that no naira has moved through the account yet.
    h('div', { class: 'stack' },
      t.rows.length ? null : h('span', { class: 'muted',
        text: 'Nothing yet. Naira shows up here when you add money or send some out.' }),
      ...rowsFor(t),
      // The total stays even when there is nothing to total. It is the claim
      // the screen makes, and a claim that disappears when it is easy to
      // meet is not one anybody should believe.
      sumRow(t, 'The three books together'))))

  if (tickers.length) {
    cards.push(card(
      cardHead('Shares', balancedPill(tickers.every(zero), 'a share')),
      h('span', { class: 'muted',
        text: 'Counted in shares, not in dollars. Each company balances on its own. ' +
          'What is held for you is what left the market.' }),
      ...tickers.map((t) => h('div', { class: 'stack-8' },
        h('span', { class: 't-caps', text: t.currency }),
        ...rowsFor(t), sumRow(t, 'Together')))))
  }
  return cards
}

export function statementScreen(): HTMLElement {
  const book = [...ledger.postings()].reverse()
  return shell(
    'history',
    pageHeader('Statement'),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          cardHead('Every movement, both ends'),
          h('span', { class: 'muted',
            text: `${book.length} movements, oldest at the bottom. ` +
              'Each one names where the money left and where it arrived. ' +
              'Money cannot appear here from nowhere. ' +
              'A trade has four ends: dollars one way, shares the other.' }),
          callout('Changing currency takes two movements, one in naira and one in dollars. They share a reference and a rate.')),
        ...book.map(movement),
        // Where the reading actually ends. There was one control on this
        // screen and it sat in the side column, 3,772 pixels above the bottom
        // of a 5,792-pixel page: somebody who scrolled the whole ledger
        // arrived at nothing. The side card keeps its explanation; this is the
        // way on, at the end.
        card(
          h('span', { class: 'muted',
            text: 'That is every movement on the account. Nothing is left out and nothing is rounded.' }),
          h('div', { class: 'chip-row' },
            h('button', { class: 'btn btn-secondary btn-sm', text: 'Back to Activity',
              on: { click: () => go('/activity') } }),
            h('button', { class: 'btn btn-quiet btn-sm', text: 'Back to the top',
              on: { click: () => scrollTo({ top: 0, behavior: 'smooth' }) } })))),
      h('div', { class: 'stack col-side' },
        ...balances(),
        card(
          cardHead('What this is for'),
          h('span', { class: 'muted',
            text: 'Every figure in the app is read from these accounts. ' +
              'Your wallet, what you lent, what you owe, every share you hold. ' +
              'There is no second copy to go wrong.' })))))
}
