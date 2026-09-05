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
          para('The price of a share or a fund goes down as well as up. Nothing here is a savings account, nothing is guaranteed, and past performance does not tell you what happens next. Only put in money you can afford to leave alone.')),

        card(
          cardHead('What you actually own'),
          para('When you buy on Tokkenly you are buying a tokenised share: a token that tracks one share, or one fund, held with a regulated custodian. You get the economic exposure — the price movement and any dividend — rather than a certificate in your name.'),
          para('That means you do not get shareholder voting rights, and you are relying on the custodian and on Tokkenly as well as on the company itself. If either fails, that is a risk to your money separate from the share price.')),

        card(
          cardHead('Funds are not companies'),
          para('An ETF is one holding spread across many companies. That spread makes a single company failing matter less, and it also means you will never beat the group it tracks. A fund can still fall a long way if the whole market does.')),

        card(
          cardHead('Currency'),
          para('Your balance is held in dollars. If the naira strengthens against the dollar, the naira value of your money falls even if the dollar figure has not moved. The rate you see when you add money or withdraw is the rate you get; there is no spread folded into it.')),

        card(
          cardHead('What it costs'),
          kv('Buying or selling', pct(state.fees.trade, 1) + ' of the amount'),
          kv('Adding money', 'No fee'),
          kv('Withdrawing to a bank', 'No fee'),
          kv('Sending to another wallet', 'No fee'),
          para('Every screen that moves money shows the amount, the fee and what you receive before you confirm.')),

        card(
          cardHead('Eligibility and limits'),
          kv('Before verification', usd(LIMITS.none.monthly, false) + ' a month'),
          kv('After verification', usd(LIMITS.verified.monthly, false) + ' a month'),
          para('You need to be eighteen or over and resident in Nigeria. Identity checks are required before the higher limits, and we may ask for more information if we are required to.'),
          state.kyc.status === 'verified'
            ? null
            : h('button', { class: 'btn btn-primary btn-sm', text: 'Verify your identity',
                on: { click: () => go('/verify') } })),

        card(
          cardHead('If something goes wrong'),
          para('Tell us first: Support has the fastest route to a person. If we cannot put it right, you can escalate to the relevant regulator. We will tell you who that is and how, rather than leaving you to find out.'),
          h('button', { class: 'link', text: 'Contact support', on: { click: () => go('/support') } }))),

      h('div', { class: 'stack col-side' },
        card(
          cardHead('In one line'),
          h('span', { class: 't-body-strong', text: 'Investing involves risk. The value of what you hold can fall as well as rise.' }),
          callout('Nobody at Tokkenly will ever ask for your PIN, your password or a one-time code.', 'warning')),
        card(
          cardHead('Prices on this app'),
          h('span', { class: 'muted',
            text: 'Prices are indicative and can move between the moment you see one and the moment an order fills. The review screen shows the price used for your order.' })))))
}
