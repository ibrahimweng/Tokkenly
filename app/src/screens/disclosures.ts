import { h } from '../ui'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout } from '../components/bits'
import { state, LIMITS } from '../state'
import { usd, pct } from '../format'
import { go } from '../router'

/** The long version, in one place, written to be read rather than to be
 *  survived. The short version lives where the decision is made — on the
 *  invest screen and on its review — because a disclosure nobody reads at the
 *  moment they need it is a disclosure in name only. */
export function disclosuresScreen(): HTMLElement {
  const para = (t: string) => h('p', { class: 'muted', style: { margin: '0' }, text: t })

  return shell('account',
    pageHeader('Risk and disclosures'),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          cardHead('The short version'),
          h('span', { class: 't-title', text: 'You can get back less than you put in.' }),
          para('Prices go down as well as up. Nothing here is a savings account. Nothing is guaranteed. What a share did last year tells you nothing about next year.'),
          para('Only put in money you can afford to leave alone.')),

        card(
          cardHead('What you actually own'),
          para('You are buying a token that tracks one real share. The real share is held by a regulated custodian.'),
          para('You get the price moves and the dividends. You do not get a share certificate in your name.'),
          para('You do not get a vote at the company. And you are relying on the custodian and on us, not only on the company.'),
          para('If either of us fails, that is a risk to your money on top of the share price.')),

        card(
          cardHead('Funds are not companies'),
          para('A fund spreads your money across many companies. One company failing matters less. You also never beat the group it tracks.'),
          para('A fund can still fall a long way if the whole market does.')),

        card(
          cardHead('Currency'),
          para('Your money is held in dollars. If the naira gets stronger, your money is worth fewer naira, even though the dollar figure has not moved.'),
          para('The rate you see is the rate you get. We do not hide a margin inside it.')),

        card(
          cardHead('What it costs'),
          kv('Buying or selling', pct(state.fees.trade, 1) + ' of the amount'),
          kv('Adding money', 'No fee'),
          kv('Sending to a bank', 'No fee beyond the rate on screen'),
          kv('Adding money by card', pct(state.fees.card, 1) + ' of the naira'),
          kv('Sending to another wallet', 'No fee'),
          para('Every screen that moves money shows the amount, the fee and what you receive before you confirm.')),

        card(
          cardHead('Eligibility and limits'),
          kv('Before verification', usd(LIMITS.none.monthly, false) + ' a month'),
          kv('After verification', usd(LIMITS.verified.monthly, false) + ' a month'),
          para('You must be eighteen or over and living in Nigeria. We check your identity before the higher limits. Sometimes we have to ask for more.'),
          state.kyc.status === 'verified'
            ? null
            : h('button', { class: 'btn btn-primary btn-sm', text: 'Verify your identity',
                on: { click: () => go('/verify') } })),

        card(
          cardHead('If something goes wrong'),
          para('Tell us first. Support is the fastest route to a person.'),
          para('If we cannot put it right, you can take it to the regulator. We will tell you who and how.'),
          h('button', { class: 'link', text: 'Contact support', on: { click: () => go('/support') } }))),

      h('div', { class: 'stack col-side' },
        card(
          cardHead('In one line'),
          h('span', { class: 't-body-strong', text: 'Investing involves risk. The value of what you hold can fall as well as rise.' }),
          callout('Nobody at Tokkenly will ever ask for your PIN, your password or a one-time code.', 'warning')),
        card(
          cardHead('Prices on this app'),
          h('span', { class: 'muted',
            text: 'Prices move. The one on a list can change before your order fills. The review screen shows the price your order used.' })))))
}
