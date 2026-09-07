import { h } from '../ui'
import { icon } from '../icons'
import { toast } from '../components/sheet'
import { fieldError } from '../components/bits'
import { actions, state } from '../state'
import { go, openSheet } from '../router'
import { say } from '../announce'

/* ------------------------------------------------------------------------
   The first screen a stranger sees, and it was the least designed one in the
   product: a card on an empty canvas, a Google button wearing an envelope, a
   password field with no way to check what you typed, no error, no loading,
   and nothing at all answering the question the screen is actually asking —
   why would I give these people my money.

   The answer was already written. /disclosures says what a tokenised share
   is, who holds it, what the rate is, and what every screen has to show
   before it moves money. It was two links away. Three of those statements
   now sit beside the form, in their own words, with the way to read the rest.
   ------------------------------------------------------------------------ */

/** Where a person's money goes, said before they hand any over. Every line is
 *  lifted from the disclosures rather than written for the occasion: a claim
 *  that only appears on the sign-in screen is a marketing claim. */
const PROMISES: { ic: () => string; title: string; body: string }[] = [
  {
    ic: icon.lock,
    title: 'Held with a regulated custodian',
    body: 'A token that tracks one real share. You get the price moves and the dividends.',
  },
  {
    ic: icon.convert,
    title: 'The rate you see is the rate you get',
    body: 'Your balance sits in dollars. Nothing is folded into a worse rate when you add money or take it out.',
  },
  {
    ic: icon.info,
    title: 'Every cost, before you confirm',
    body: 'The amount, the fee and what you get, before you press the button.',
  },
]

function aside(): HTMLElement {
  const list = h('div', { class: 'stack-16' })
  for (const p of PROMISES) {
    list.appendChild(h('div', { class: 'promise' },
      h('span', { class: 'mark', html: p.ic() }),
      h('span', { class: 'two-line' },
        h('span', { class: 't-body-strong', text: p.title }),
        h('small', { text: p.body }))))
  }
  return h('aside', { class: 'auth-aside' },
    h('h2', { class: 't-caps subtle', text: 'Before you hand anybody your money' }),
    list,
    // The counterweight. A screen listing three reassurances and no risk is an
    // advert; this is the first line of the disclosures, and it goes here.
    h('p', { class: 'auth-warn' },
      h('span', { html: icon.alert() }),
      h('span', { text: 'Shares go down as well as up. Nothing here is a savings account and nothing is guaranteed.' })),
    h('button', { class: 'link auth-more', on: { click: () => go('/disclosures') } },
      h('span', { text: 'What you own, what it costs, and what can go wrong' }),
      h('span', { html: icon.chevron() })))
}

function authCard(title: string, sub: string, body: Node[], footer: Node): HTMLElement {
  return h('div', { class: 'auth' },
    h('div', { class: 'auth-card' },
      h('div', { class: 'brand' },
        h('span', { class: 'brand-mark', text: 'T' }),
        h('strong', { text: 'Tokkenly' })),
      h('div', { class: 'stack-8' },
        h('h1', { class: 't-title', style: { margin: '0' }, text: title }),
        h('p', { class: 'muted', style: { margin: '0' }, text: sub })),
      ...body,
      footer),
    aside())
}

function field(label: string, placeholder: string, type = 'text'): { el: HTMLElement; input: HTMLInputElement } {
  const input = h('input', { type, placeholder, ariaLabel: label })
  return {
    input,
    el: h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: label }),
      h('label', { class: 'field' }, input)),
  }
}

/** A password you can look at. Typing ten characters you cannot see, on a
 *  phone keyboard, and then being told only that it was wrong, is how people
 *  end up resetting a password they had right the second time. */
function secret(label: string, placeholder: string): { el: HTMLElement; input: HTMLInputElement } {
  const input = h('input', { type: 'password', placeholder, ariaLabel: label })
  const eye = h('button', { class: 'reveal', ariaLabel: 'Show password', html: icon.eye() })
  eye.addEventListener('click', () => {
    const shown = input.type === 'text'
    input.type = shown ? 'password' : 'text'
    eye.setAttribute('aria-label', shown ? 'Show password' : 'Hide password')
    eye.setAttribute('aria-pressed', String(!shown))
    eye.innerHTML = shown ? icon.eye() : icon.eyeOff()
    input.focus()
  })
  return {
    input,
    el: h('div', { class: 'stack-8' },
      h('span', { class: 't-caps subtle', text: label }),
      h('label', { class: 'field' }, input, eye)),
  }
}

/** The password that fails, so the error state is a thing you can reach.
 *  Same idea as the cents rule in the README: a prototype where nothing can
 *  go wrong has not designed the half people judge it on. */
const WRONG = 'wrong'

/** Everything the two screens share: check the fields, refuse when there is no
 *  connection, go busy, then either fail where the mistake was made or go. */
function submit(opts: {
  email: HTMLInputElement
  password: HTMLInputElement
  button: HTMLButtonElement
  error: HTMLElement
  check?: () => string | null
}): void {
  const fail = (why: string): void => {
    opts.error.replaceChildren(h('span', { html: icon.alert() }), h('span', { text: why }))
    opts.error.hidden = false
    say(why)
  }
  opts.button.addEventListener('click', () => {
    if (opts.button.classList.contains('is-busy')) return
    opts.error.hidden = true
    if (!state.online) return fail('No connection. Nothing has been sent.')
    const extra = opts.check?.()
    if (extra) return fail(extra)
    if (!opts.email.value.trim()) return fail('Enter the email on your account.')
    if (!opts.password.value) return fail('Enter your password.')
    opts.button.classList.add('is-busy')
    setTimeout(() => {
      opts.button.classList.remove('is-busy')
      if (opts.password.value === WRONG) return fail('We do not recognise that email and password.')
      actions.signIn()
      go('/')
    }, 700)
  })
}

export function signInScreen(): HTMLElement {
  const email = field('Email', 'The email you signed up with', 'email')
  const password = secret('Password', 'Your password')
  const error = fieldError()
  error.hidden = true
  const button = h('button', { class: 'btn btn-primary', text: 'Sign in' })
  submit({ email: email.input, password: password.input, button, error })

  return authCard(
    'Sign in',
    'Your money, in dollars, on your phone.',
    [
      // No envelope on it any more. The glyph said "email" on the one button
      // that is not email, and drawing somebody else's mark from memory is a
      // worse answer than drawing none.
      h('button', { class: 'btn btn-secondary', text: 'Continue with Google',
        on: { click: () => { actions.signIn(); go('/') } } }),
      h('div', { class: 'auth-or' },
        h('span', { class: 'rule' }), h('span', { class: 't-caption subtle', text: 'or' }), h('span', { class: 'rule' })),
      email.el,
      password.el,
      // The link belongs here, under the field that failed, not in a footer.
      // Somebody looking for it has just been told their password is wrong.
      h('div', { class: 'auth-forgot' },
        h('button', { class: 'link quiet', text: 'Forgotten your password?',
          on: { click: () => openSheet('forgot') } })),
      error,
      button,
    ],
    h('p', { class: 'muted t-caption', style: { margin: '0', textAlign: 'center' } },
      h('span', { text: 'New here? ' }),
      h('button', { class: 'link', text: 'Create an account', on: { click: () => go('/signup') } }))
  )
}

export function signUpScreen(): HTMLElement {
  // Invite-only while the pilot runs, and the field says so rather than the
  // product accepting anybody and refusing them three screens later. Any code
  // starting TKN- works here; a real one is checked against a list, and the
  // shape of the screen is the same either way.
  const invite = field('Invite code', 'Tokkenly is invite-only during the pilot')
  const name = field('Full name', 'As it appears on your NIN')
  const email = field('Email', 'Where we send your receipts', 'email')
  const password = secret('Password', 'At least ten characters')
  const error = fieldError()
  error.hidden = true
  const button = h('button', { class: 'btn btn-primary', text: 'Create account' })
  submit({
    email: email.input, password: password.input, button, error,
    // The rules this screen owns: the invite, and the password floor the
    // product enforces everywhere else. Both said before the button is
    // pressed rather than after.
    check: () => {
      const code = invite.input.value.trim().toUpperCase()
      if (!code) return 'You need an invite code. Join the waitlist and we will send you one.'
      if (!/^TKN-[A-Z0-9-]{4,}$/.test(code)) return 'That is not a Tokkenly invite code. They look like TKN-PILOT-0148.'
      if (!name.input.value.trim()) return 'Enter your name as it appears on your NIN.'
      if (password.input.value && password.input.value.length < 10)
        return 'A password needs ten characters or more.'
      return null
    },
  })

  return authCard(
    'Create your account',
    'Invite-only during the pilot. Two minutes, then a NIN check before you can hold a balance.',
    [
      h('button', { class: 'btn btn-secondary', text: 'Continue with Google',
        on: { click: () => { actions.signIn(); go('/') } } }),
      h('div', { class: 'auth-or' },
        h('span', { class: 'rule' }), h('span', { class: 't-caption subtle', text: 'or' }), h('span', { class: 'rule' })),
      invite.el,
      name.el,
      email.el,
      password.el,
      h('div', { class: 'callout' },
        h('span', { html: icon.info() }),
        h('span', { text: 'Next we ask for your NIN or BVN. Nigerian law requires it before you can hold a balance.' })),
      error,
      button,
    ],
    h('p', { class: 'muted t-caption', style: { margin: '0', textAlign: 'center' } },
      h('span', { text: 'Already have one? ' }),
      h('button', { class: 'link', text: 'Sign in', on: { click: () => go('/signin') } }),
      h('br'),
      h('span', { text: 'No code? ' }),
      h('button', { class: 'link', text: 'Join the waitlist',
        on: { click: () => toast('We will email you when the next cohort opens') } }))
  )
}
