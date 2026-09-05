import { h } from '../ui'
import { icon } from '../icons'
import { dotArt, BUY, CONVERT, BORROW } from '../components/art'
import { state, actions } from '../state'
import { usd } from '../format'
import { go } from '../router'

/** The first thing Chinaza sees. Four screens, each making one claim that the
 *  product has to earn, in the order the questions actually arrive: can I even
 *  afford this, what am I holding, when can I sell, and how do I start.
 *
 *  It gates the landing route only. A deep link still goes where it points,
 *  because being new is not a reason to be sent somewhere you did not ask for.
 */
interface Step {
  eyebrow: string
  title: string
  body: string
  art: () => SVGSVGElement
  lead?: boolean
}

const STEPS: Step[] = [
  {
    eyebrow: 'What this is',
    title: 'Own a piece of Apple,\nfrom one dollar',
    body: 'A share in Apple costs more than $200. You do not have to buy a whole one. Put in a dollar and you own a dollar of it, and it rises and falls the same way.',
    art: () => dotArt(BUY),
    lead: true,
  },
  {
    eyebrow: 'What you hold',
    title: 'Naira in,\ndollars held',
    body: 'You add naira from your bank and it becomes dollars. Your money sits in dollars, so it holds its value while the naira moves. Take it out to any bank you have added.',
    art: () => dotArt(CONVERT),
  },
  {
    eyebrow: 'When you can sell',
    title: 'The market\nnever closes',
    body: 'These shares are tokenised, so they trade at any hour, any day. Sell part of a holding on a Sunday night if you want to. Cash is in your wallet in about a minute.',
    art: () => dotArt(BORROW),
  },
  {
    eyebrow: 'How to start',
    title: 'Pick as you go,\npay once',
    body: 'Browse the market and drop companies into your bucket as you find them. When you are ready, one payment buys the lot — and every company still gets its own receipt.',
    art: () => dotArt(BUY),
    lead: true,
  },
]

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

  return h('div', { class: 'welcome' + (s.lead ? ' lead' : '') },
    h('header', { class: 'welcome-top' },
      h('div', { class: 'brand' },
        h('span', { class: 'brand-mark', text: 'T' }), h('strong', { text: 'Tokkenly' })),
      h('button', { class: 'link quiet', text: 'Skip', on: { click: done('/') } })),

    h('div', { class: 'welcome-body' },
      h('span', { class: 't-caps subtle', text: s.eyebrow }),
      h('h1', { class: 'welcome-title', text: s.title }),
      h('p', { class: 'welcome-text', text: s.body }),
      // The one number that makes the first claim concrete rather than a
      // slogan, sitting with the claim rather than at the foot of the page.
      i === 0
        ? h('span', { class: 'welcome-note muted t-caption',
            text: `You have ${usd(state.cash)} ready to spend.` })
        : null,
      last
        ? h('button', { class: 'link quiet welcome-later', text: 'Look around first',
            on: { click: done('/') } })
        : null),

    h('div', { class: 'welcome-art' }, s.art()),

    h('footer', { class: 'welcome-foot' },
      dots,
      h('div', { class: 'welcome-actions' },
        i > 0
          ? h('button', { class: 'btn btn-quiet btn-sm', text: 'Back',
              on: { click: () => go('/welcome/' + (i - 1)) } })
          : null,
        last
          ? h('button', { class: 'btn btn-primary btn-sm', text: 'Buy your first share',
              on: { click: done('/market') } })
          : h('button', { class: 'btn btn-primary btn-sm',
              on: { click: () => go('/welcome/' + (i + 1)) } },
              h('span', { text: 'Next' }), h('span', { class: 'ic', html: icon.chevron() })))),

  )
}
