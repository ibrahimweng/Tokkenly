import { h } from '../ui'
import { icon } from '../icons'
import { objectArt, PIECE, NOTES, PURSE } from '../components/art'
import { PICKS, find, tradable, type Instrument } from '../catalogue'
import { state, actions } from '../state'
import { usd, shares as fmtShares } from '../format'
import { go } from '../router'

/** The first thing Chinaza sees. Four screens, each making one claim that the
 *  product has to earn, in the order the questions actually arrive: can I even
 *  afford this, what am I holding, when can I sell, and how do I start.
 *
 *  The fourth does not answer its question in words. An intro that ends on a
 *  slogan and a button to the market leaves a person on an empty screen having
 *  done nothing, holding four claims they have no way to check. This one ends
 *  with them choosing a company, which is the smallest real thing this product
 *  does, and hands them to the bucket with their choice already in it — one
 *  deliberate press from their first purchase, with the amount and the total in
 *  front of them. Picking is not buying, and the screen says so: the money
 *  decision stays where a money decision belongs, in the composer.
 *
 *  It gates the landing route only. A deep link still goes where it points,
 *  because being new is not a reason to be sent somewhere you did not ask for.
 */
interface Step {
  eyebrow: string
  title: string
  body: string
  art?: () => SVGSVGElement
  lead?: boolean
  /** A figure under the claim. It has to be a fact about the market, which
   *  anybody can check, rather than a fact about this account. */
  note?: () => string | null
  /** The step where the intro stops talking. */
  pick?: boolean
}

const STEPS: Step[] = [
  {
    eyebrow: 'What this is',
    title: 'Own a piece of Apple,\nfrom one dollar',
    body: 'One Apple share costs over $200. You do not need a whole one. Put in $1 and you own $1 of Apple.',
    art: () => objectArt(PIECE()),
    lead: true,
    // What screen one used to say here was "You have $2,480.00 ready to
    // spend." — an account balance, quoted to the cent, to somebody who has
    // not added a naira yet. On a real first run it is either untrue or it is
    // somebody else's money, and either way it teaches a person that the
    // figures in this product are decoration. The claim above is about a share
    // price, so the number under it is the share price.
    note: () => {
      const c = find('AAPL')
      if (!c) return null
      return `Apple is ${usd(c.price)} a share today. A dollar buys ${fmtShares(1 / c.price)} of one.`
    },
  },
  {
    eyebrow: 'What you hold',
    title: 'Naira in,\ndollars held',
    body: 'Send naira from your bank and it becomes dollars. Your money stays in dollars while the naira moves. Take it out to your bank any time.',
    art: () => objectArt(NOTES()),
  },
  {
    eyebrow: 'When you can sell',
    title: 'The market\nnever closes',
    body: 'Buy and sell at any hour, any day. Sell on a Sunday night if you want. The cash is in your wallet a minute later.',
    art: () => objectArt(PURSE()),
  },
  {
    eyebrow: 'How to start',
    title: 'Pick one\nto start with',
    body: 'Pick a few companies, then pay once for all of them. Nothing is bought until you say so.',
    pick: true,
  },
]

/** One of the three the market already puts forward, as a thing to press.
 *  The figure on the right is the claim from screen one, made good: this is
 *  what the starting amount actually buys of this company. */
function pickCard(c: Instrument, why: string): HTMLElement {
  const put = state.prefs.tradeDefault
  return h('button', {
    class: 'card welcome-pick',
    on: { click: () => { actions.addToBucket(c.ticker, put); actions.finishIntro(); go('/bucket') } },
  },
    h('span', { class: 't-title', text: c.name }),
    h('span', { class: 'muted grow', text: why }),
    h('span', { class: 't-body-strong welcome-pick-buys',
      text: `${usd(put, false)} buys ${fmtShares(put / c.price)} shares` }))
}

/** The last screen of the intro is a list of things to press, and pressing
 *  one fills a bucket and goes to pay for it. So it can only offer companies
 *  the product will actually sell: two of the three here were outside the
 *  launch set, which made the first thing the product asked of somebody the
 *  first thing it said no to. PICKS is written against the launch set and this
 *  filters on it as well, so a company leaving the set drops out of the intro
 *  instead of breaking it. */
function picks(): HTMLElement {
  const list = h('div', { class: 'welcome-picks' })
  for (const p of PICKS) {
    const c = find(p.ticker)
    if (c && tradable(c)) list.appendChild(pickCard(c, p.line))
  }
  return list
}

export function welcomeScreen(at: number): HTMLElement {
  const i = Math.max(0, Math.min(STEPS.length - 1, at))
  const s = STEPS[i]
  const last = i === STEPS.length - 1

  const dots = h('div', { class: 'welcome-dots', ariaLabel: `Step ${i + 1} of ${STEPS.length}` })
  for (let n = 0; n < STEPS.length; n++) {
    dots.appendChild(h('button', {
      class: 'welcome-dot' + (n === i ? ' on' : ''),
      ariaLabel: 'Step ' + (n + 1), ariaCurrent: n === i ? 'step' : undefined,
      on: { click: () => go('/welcome/' + n) },
    }))
  }

  const done = (to: string) => () => { actions.finishIntro(); go(to) }
  const note = s.note?.() ?? null

  return h('div', { class: 'welcome' + (s.lead ? ' lead' : '') + (s.pick ? ' picking' : '') },
    h('header', { class: 'welcome-top' },
      h('div', { class: 'brand' },
        h('span', { class: 'brand-mark', text: 'T' }), h('strong', { text: 'Tokkenly' })),
      h('button', { class: 'link quiet', text: 'Skip', on: { click: done('/') } })),

    h('div', { class: 'welcome-body' },
      h('span', { class: 't-caps subtle', text: s.eyebrow }),
      h('h1', { class: 'welcome-title', text: s.title }),
      h('p', { class: 'welcome-text', text: s.body }),
      // The one number that makes the claim concrete rather than a slogan,
      // sitting with the claim rather than at the foot of the page.
      note ? h('span', { class: 'welcome-note muted t-caption', text: note }) : null,
      s.pick ? picks() : null),

    s.art ? h('div', { class: 'welcome-art' }, s.art()) : null,

    h('footer', { class: 'welcome-foot' },
      dots,
      h('div', { class: 'welcome-actions' },
        i > 0
          ? h('button', { class: 'btn btn-quiet btn-sm', text: 'Back',
              on: { click: () => go('/welcome/' + (i - 1)) } })
          : null,
        last
          // Not the primary action any more: the three above it are. This is
          // for the person who does not want any of them.
          ? h('button', { class: 'btn btn-quiet btn-sm', text: 'Browse all',
              on: { click: done('/invest') } })
          : h('button', { class: 'btn btn-primary btn-sm',
              on: { click: () => go('/welcome/' + (i + 1)) } },
              h('span', { text: 'Next' }), h('span', { class: 'ic', html: icon.chevron() })))),

  )
}
