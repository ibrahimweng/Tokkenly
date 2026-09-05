import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, emptyState } from '../components/bits'
import { find } from '../catalogue'
import { state, actions, bucketTotal, bucketShortfall } from '../state'
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
        { label: 'Go to the market', onClick: () => go('/market') })))
  }

  const rows = state.bucket.map((b) => {
    const c = find(b.ticker)!
    const field = h('input', {
      class: 'bucket-amount', value: b.dollars.toFixed(2), inputmode: 'decimal',
      ariaLabel: `How much of ${c.name}`,
    })
    const sub = h('small', { text: `${usd(c.price)} each · ${fmtShares(b.dollars / c.price)} shares` })
    field.addEventListener('change', () => {
      const v = Number(field.value.replace(/[^0-9.]/g, '')) || 0
      actions.setBucketAmount(b.ticker, v)
      field.value = v.toFixed(2)
      sub.textContent = `${usd(c.price)} each · ${fmtShares(v / c.price)} shares`
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
    summary.replaceChildren(
      kv('Total', usd(total)),
      kv('Cash you have', usd(state.cash)),
      // The question you are actually asking while you fill a bucket.
      kv('Left after', short > 0 ? '—' : usd(state.cash - total)),
      short > 0
        ? h('small', { class: 'field-error' },
            h('span', { html: icon.alert() }),
            h('span', { text: `That is ${usd(short)} more than you have.` }))
        : h('span', { class: 'muted t-caption',
            text: 'One payment. Each company still gets its own receipt.' }))
    pay.textContent = short > 0 ? 'Add ' + usd(short) + ' to cover this' : `Buy all ${state.bucket.length}`
    pay.onclick = () => (short > 0 ? go('/addmoney') : openSheet('bucket-review'))
  }
  paint()

  return shell('market',
    pageHeader('Your bucket',
      h('button', { class: 'link quiet', text: 'Empty it',
        on: { click: () => { actions.clearBucket(); go('/market') } } })),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(cardHead(state.bucket.length + (state.bucket.length === 1 ? ' company' : ' companies')),
          ...rows)),
      h('div', { class: 'stack col-side' },
        card(cardHead('What it comes to'), summary, pay))))
}
