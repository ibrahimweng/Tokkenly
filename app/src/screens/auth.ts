import { h } from '../ui'
import { icon } from '../icons'
import { actions, state } from '../state'
import { go } from '../router'

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
      footer))
}

function field(label: string, placeholder: string, type = 'text'): HTMLElement {
  return h('div', { class: 'stack-8' },
    h('span', { class: 't-caps subtle', text: label }),
    h('label', { class: 'field' }, h('input', { type, placeholder })))
}

export function signInScreen(): HTMLElement {
  const enter = () => {
    actions.signIn()
    go('/')
  }
  return authCard(
    'Sign in',
    'Your money, in dollars, on your phone.',
    [
      h('button', { class: 'btn btn-quiet', on: { click: enter } },
        h('span', { html: icon.mail() }), h('span', { text: 'Continue with Google' })),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
        h('span', { style: { flex: '1', height: '1px', background: 'var(--control)' } }),
        h('span', { class: 't-caption subtle', text: 'or' }),
        h('span', { style: { flex: '1', height: '1px', background: 'var(--control)' } })),
      field('Email', state.person.email, 'email'),
      field('Password', 'Your password', 'password'),
      h('button', { class: 'btn btn-filled', text: 'Sign in', on: { click: enter } }),
    ],
    h('p', { class: 'muted t-caption', style: { margin: '0', textAlign: 'center' } },
      h('span', { text: 'New here? ' }),
      h('button', { class: 'link', text: 'Create an account', on: { click: () => go('/signup') } }))
  )
}

export function signUpScreen(): HTMLElement {
  const enter = () => {
    actions.signIn()
    go('/')
  }
  return authCard(
    'Create your account',
    'Two minutes, then a NIN check before you can hold a balance.',
    [
      h('button', { class: 'btn btn-quiet', on: { click: enter } },
        h('span', { html: icon.mail() }), h('span', { text: 'Continue with Google' })),
      field('Full name', 'As it appears on your NIN'),
      field('Email', 'Where we send your receipts', 'email'),
      field('Password', 'At least ten characters', 'password'),
      h('div', { class: 'callout' },
        h('span', { html: icon.info() }),
        h('span', { text: 'Next we ask for your NIN or BVN. Nigerian law requires it before you can hold a balance.' })),
      h('button', { class: 'btn btn-filled', text: 'Create account', on: { click: enter } }),
    ],
    h('p', { class: 'muted t-caption', style: { margin: '0', textAlign: 'center' } },
      h('span', { text: 'Already have one? ' }),
      h('button', { class: 'link', text: 'Sign in', on: { click: () => go('/signin') } }))
  )
}
