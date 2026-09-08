import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, emptyState, fieldError } from '../components/bits'
import { find, aboutTheAmount } from '../catalogue'
import { state, actions, bucketTotal, bucketShortfall, bucketRefusals, bucketCost, tradeFee } from '../state'
import { usd, shares as fmtShares } from '../format'
import { go, openSheet } from '../router'

/** Everything picked out and not yet paid for, in one place, paid once.
 *  A watchlist is a list of things you are interested in. A bucket is a list
 *  of things you have decided on, with an amount against each — so it says
 *  what the whole thing costs and what is left afterwards, which is the
 *  question you are actually asking while you fill it. */
export function bucketScreen(): HTMLElement {
  // The summary repaints itself rather than re-rendering the route. Editing an
  // amount fires `change` while the field still has focus, and rebuilding the
  // screen under a focused input throws on the blur that follows it.
  const summary = h('div', { class: 'stack-12' })
  const pay = h('button', { class: 'btn btn-primary' })

  if (!state.bucket.length) {
    return shell('market',
      pageHeader('Your bucket'),
      card(emptyState('Nothing in the bucket yet',
        'Pick companies as you browse and pay for them together, once you are ready.',
        { label: 'Go to Invest', onClick: () => go('/invest') })))
  }

  // Each row keeps a way to redraw its own second line, because two of the
  // reasons a company can be refused — the size of the order against the book
  // — are functions of the amount typed into that row. A refusal that only
  // appears on the next full render is a refusal you meet at the till.
  const redraw: (() => void)[] = []
  const fields = new Map<string, HTMLInputElement>()

  const rows = state.bucket.map((b) => {
    const c = find(b.ticker)!
    const field = h('input', {
      class: 'bucket-amount', value: b.dollars.toFixed(2), inputmode: 'decimal',
      ariaLabel: `How much of ${c.name}`,
    }) as HTMLInputElement
    fields.set(b.ticker, field)
    const sub = h('small')
    // The refusal's own title, not a second wording of it. One noun per
    // thing, rule 37: the sentence the composer would show is the sentence
    // this row shows. What follows it is what fixes it, and the two kinds of
    // refusal are fixed in different places.
    const say = () => {
      const bad = bucketRefusals().find((x) => x.item.ticker === b.ticker)
      sub.className = bad ? 'warn' : ''
      sub.textContent = bad
        ? bad.bad[0].title + (aboutTheAmount(bad.bad[0])
            ? '. Try a smaller amount.'
            : '. Take it out to pay for the rest.')
        : `${usd(c.price)} each · ${fmtShares(b.dollars / c.price)} shares`
    }
    redraw.push(say)
    field.addEventListener('change', () => {
      const v = Number(field.value.replace(/[^0-9.]/g, '')) || 0
      actions.setBucketAmount(b.ticker, v)
      field.value = v.toFixed(2)
      paint()
    })
    return h('div', { class: 'bucket-row' },
      h('span', { class: 'two-line grow' },
        h('span', { class: 't-body-strong', text: `${c.ticker} · ${c.name}` }), sub),
      h('label', { class: 'field bucket-field' }, h('span', { class: 'muted', text: '$' }), field),
      h('button', {
        class: 'icon-btn', ariaLabel: 'Take ' + c.name + ' out of the bucket',
        html: icon.close(), on: { click: () => { actions.removeFromBucket(b.ticker); go('/bucket') } },
      }))
  })

  function paint(): void {
    const total = bucketTotal()
    const short = bucketShortfall()
    const refused = bucketRefusals()
    // Three things can stop this payment, and they are asked in the order that
    // costs the fewest trips. A company the product will not sell goes first:
    // taking it out changes the total, so somebody told to add money and then
    // told to take a company out has been sent twice for one problem. Then the
    // money. Costing an order against the book comes last, because a number
    // you cannot pay for is a number that is about to change anyway.
    const standing = refused.filter((x) => x.bad.some((r) => !aboutTheAmount(r)))
    const sized = refused.filter((x) => !standing.includes(x))
    const names = standing.map((x) => x.c?.name ?? x.item.ticker)
    for (const say of redraw) say()

    let stop = ''
    let label = `Buy all ${state.bucket.length}`
    let act: () => void = () => openSheet('bucket-review')
    if (standing.length) {
      stop = standing.length === 1
        ? `${names[0]}: ${lower(standing[0].bad[0].title)}. Take it out to pay for the rest.`
        : `${names.join(', ')} cannot be bought right now. Take them out to pay for the rest.`
      label = standing.length === 1
        ? 'Take out ' + names[0]
        : `Take out the ${standing.length} we cannot buy`
      act = () => {
        for (const x of standing) actions.removeFromBucket(x.item.ticker)
        go('/bucket')
      }
    } else if (short > 0) {
      stop = `That is ${usd(short)} more than you have.`
      label = 'Add ' + usd(short) + ' to cover this'
      act = () => go('/addmoney')
    } else if (sized.length) {
      const one = sized[0]
      const name = one.c?.name ?? one.item.ticker
      stop = `${name}: ${lower(one.bad[0].title)}. ${one.bad[0].why}`
      // The fix is a number on this screen, so the button goes to it rather
      // than nowhere. A control that cannot be pressed usefully is a control
      // that should not be here at all.
      label = 'Change the amount for ' + name
      act = () => {
        const f = fields.get(one.item.ticker)
        if (f) { f.focus(); f.select() }
      }
    }

    summary.replaceChildren(
      kv('Investment', usd(total)),
      kv('Fee', `${usd(tradeFee(total))} · ${state.fees.trade}%`),
      kv('Total', usd(bucketCost())),
      kv('Cash you have', usd(state.cash)),
      // The question you are actually asking while you fill a bucket.
      kv('Left after', stop ? '—' : usd(state.cash - bucketCost())),
      stop
        ? fieldError(h('span', { html: icon.alert() }), h('span', { text: stop }))
        : h('span', { class: 'muted t-caption',
            text: 'One payment, one fee. Each company still gets its own receipt.' }))
    // The button is the way out of whatever is in the way, rather than a dead
    // control sitting beside an explanation of why it is dead.
    pay.textContent = label
    pay.onclick = act
  }
  paint()

  return shell('market',
    pageHeader('Your bucket',
      h('button', { class: 'link quiet', text: 'Empty it',
        on: { click: () => { actions.clearBucket(); go('/invest') } } })),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(cardHead(state.bucket.length + (state.bucket.length === 1 ? ' company' : ' companies')),
          ...rows)),
      h('div', { class: 'stack col-side' },
        card(cardHead('What it comes to'), summary, pay))))
}

/** A refusal title starts a sentence of its own, so it is capitalised. Put
 *  after a company name it is mid-sentence, and "Apple: Not open for trading
 *  yet" reads like two labels rather than one line. Tickers keep their case. */
function lower(s: string): string {
  return /^[A-Z]{2,}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1)
}
