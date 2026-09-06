import { h } from '../ui'
import { icon } from '../icons'
import { shell, pageHeader } from '../components/shell'
import { card, cardHead, kv, callout, fieldError } from '../components/bits'
import { state, actions, LIMITS, verified } from '../state'
import { usd } from '../format'
import { go } from '../router'
import { toast } from '../components/sheet'

/** Four steps, because an identity check is four questions and pretending it
 *  is one long form does not make it shorter. Each step says what it needs and
 *  why, and the last one says what changed — a check that ends on "submitted"
 *  leaves the person exactly where they were.
 *
 *  Reached at /verify, and the step is in the path so Back works and a
 *  half-finished check can be linked to. */
const STEPS = ['what', 'number', 'details', 'done'] as const

export function verifyScreen(step: string): HTMLElement {
  const at = STEPS.includes(step as (typeof STEPS)[number]) ? step : 'what'
  const dots = h('div', { class: 'verify-dots' },
    ...STEPS.slice(0, 3).map((_, n) =>
      h('span', { class: 'welcome-dot' + (STEPS.indexOf(at as never) >= n ? ' on' : '') })))

  const frame = (title: string, sub: string, ...body: (Node | null)[]) =>
    shell('account',
      pageHeader('Verify your identity'),
      h('div', { class: 'row' },
        h('div', { class: 'stack col-main' },
          card(
            h('div', { class: 'stack-8' },
              dots,
              h('span', { class: 't-title', text: title }),
              h('span', { class: 'muted', text: sub })),
            ...body)),
        h('div', { class: 'stack col-side' }, whatItLifts(), whatHappensToIt())))

  /* ----- 1. what we need, and why ----- */
  if (at === 'what') {
    return frame(
      'A NIN or a BVN, and a minute',
      'We are required to check who you are before we can raise what you can move. Nothing here is shared with anyone outside the check.',
      h('div', { class: 'stack-8' },
        step2('01', 'Your number', 'Eleven digits from your NIN slip or your bank app.'),
        step2('02', 'Your details', 'We check the name and date of birth we already hold against it.'),
        step2('03', 'That is it', 'Usually instant. Your limit goes up as soon as it clears.')),
      callout('We never ask for your PIN, your password or a one-time code. Anyone who does is not us.', 'warning'),
      h('button', { class: 'btn btn-primary', text: 'Start',
        on: { click: () => go('/verify/number') } }))
  }

  /* ----- 2. the number ----- */
  if (at === 'number') {
    const input = h('input', { placeholder: '11 digits', inputmode: 'numeric', ariaLabel: 'Your NIN or BVN' })
    const field = h('label', { class: 'field' }, input)
    const err = fieldError(
      h('span', { html: icon.alert() }), h('span', { text: 'A NIN or BVN is eleven digits.' }))
    err.hidden = true
    let method: 'NIN' | 'BVN' = 'NIN'
    const pick = h('div', { class: 'chip-row' }, ...(['NIN', 'BVN'] as const).map((m) =>
      h('button', { class: 'chip', text: m, ariaPressed: m === method,
        on: { click: (e) => {
          method = m
          for (const c of pick.children) (c as HTMLElement).setAttribute('aria-pressed', String(c === e.currentTarget))
        } } })))

    const next = h('button', { class: 'btn btn-primary', text: 'Check this number', disabled: true })
    const digits = () => input.value.replace(/\D/g, '')
    input.addEventListener('input', () => {
      // The complaint waits until there is something to complain about: a
      // field that goes red on the first keystroke is a field that nags.
      const n = digits()
      err.hidden = n.length === 0 || n.length === 11
      field.classList.toggle('error', !err.hidden)
      next.toggleAttribute('disabled', n.length !== 11)
    })
    next.addEventListener('click', () => {
      actions.startVerification(method, digits())
      go('/verify/details')
    })

    return frame(
      'Your NIN or BVN',
      'Eleven digits. We check it and keep only the last four, so you can recognise it later.',
      pick, field, err,
      callout('This is the number itself, not a photograph of the slip.'),
      next,
      h('button', { class: 'btn btn-quiet', text: 'Back', on: { click: () => go('/verify') } }))
  }

  /* ----- 3. the details we already hold ----- */
  if (at === 'details') {
    const p = state.person
    return frame(
      'Do these match?',
      'They have to match the record behind the number you gave us. If anything is wrong, change it here first.',
      card(
        cardHead('What we will check',
          h('button', { class: 'link', text: 'Change', on: { click: () => go('/account') } })),
        kv('Full name', p.name),
        kv('Date of birth', p.dob),
        kv('Number', (state.kyc.method ?? 'NIN') + ' ending ' + (state.kyc.last4 ?? '••••'))),
      h('button', { class: 'btn btn-primary', text: 'Yes, check it',
        on: { click: () => { actions.finishVerification(); go('/verify/done') } } }),
      h('button', { class: 'btn btn-quiet', text: 'Back', on: { click: () => go('/verify/number') } }))
  }

  /* ----- 4. what actually changed ----- */
  return shell('account',
    pageHeader('Verify your identity'),
    h('div', { class: 'row' },
      h('div', { class: 'stack col-main' },
        card(
          h('div', { class: 'tick', html: icon.check() }),
          h('div', { class: 'figure' },
            h('span', { class: 't-title', text: 'You are verified' }),
            h('span', { class: 'muted', text: 'Checked with ' + (state.kyc.method ?? 'NIN') + ' on ' + (state.kyc.checkedOn ?? 'today') })),
          // A check that ends on "submitted" leaves you where you were. This
          // one says the two numbers that moved.
          h('div', { class: 'panel' },
            h('div', { class: 'cell' },
              h('span', { class: 't-caps subtle', text: 'Monthly limit' }),
              h('span', { class: 't-body-strong', text: `${usd(LIMITS.none.monthly, false)} → ${usd(LIMITS.verified.monthly, false)}` })),
            h('div', { class: 'cell' },
              h('span', { class: 't-caps subtle', text: 'One payment' }),
              h('span', { class: 't-body-strong', text: `${usd(LIMITS.none.single, false)} → ${usd(LIMITS.verified.single, false)}` }))),
          h('button', { class: 'btn btn-primary', text: 'Done',
            on: { click: () => { toast('Your limits are up', 'success'); go('/account') } } }))),
      h('div', { class: 'stack col-side' }, whatItLifts())))
}

function step2(n: string, title: string, sub: string): HTMLElement {
  return h('div', { class: 'pref-row' },
    h('span', { class: 'mark', text: n }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: title }),
      h('small', { text: sub })))
}

/** The questions somebody has when they are about to type a national ID
 *  number into a phone, answered beside the field rather than in a policy.
 *  Every line is already stated somewhere in this product — the disclosures on
 *  eligibility, Account on what it holds, this screen's own first paragraph on
 *  where the number goes. It sat under a 192px card on a 1000px screen with
 *  four hundred pixels of nothing under it; these are the answers that were
 *  missing, not filler to fill it. */
function whatHappensToIt(): HTMLElement {
  const line = (title: string, body: string, ic: string) =>
    h('div', { class: 'promise' },
      h('span', { class: 'mark', html: ic }),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: title }),
        h('small', { text: body })))
  return card(
    cardHead('What happens to it'),
    line('It goes to the check and nowhere else', 'Not to a company that wants to sell you something, and not to anybody outside the check itself.', icon.lock()),
    line('You can have it all back', 'Your details, every payment and every document you sent us, downloadable whenever you want.', icon.download()),
    line('Eighteen or over, resident in Nigeria', 'That is the rule this check exists to satisfy. We may have to ask for more if we are required to.', icon.info()),
    h('button', { class: 'link quiet', text: 'What we hold about you',
      on: { click: () => go('/account/details') } }))
}

/** The same card the Account and Transfer screens show, so the reason to do
 *  this is next to the doing of it rather than two screens back. */
export function whatItLifts(): HTMLElement {
  const now = verified() ? LIMITS.verified : LIMITS.none
  return card(
    cardHead('What it lifts',
      h('span', { class: verified() ? 'chip pos' : 'pill', text: verified() ? 'Verified' : 'Not yet' })),
    kv('Monthly', usd(now.monthly, false) + (verified() ? '' : ' → ' + usd(LIMITS.verified.monthly, false))),
    kv('One payment', usd(now.single, false) + (verified() ? '' : ' → ' + usd(LIMITS.verified.single, false))),
    h('span', { class: 'muted t-caption',
      text: verified()
        ? 'Checked with ' + (state.kyc.method ?? 'NIN') + '. You can move up to your monthly limit.'
        : 'You can browse, add money and buy small amounts without this. Verifying raises both.' }))
}
