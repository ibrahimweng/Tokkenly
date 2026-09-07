import { h } from '../ui'
import { icon } from '../icons'
import { state, actions } from '../state'
import { go, openSheet } from '../router'
import { pinPad } from '../components/pinpad'

/* A lock screen says one thing and shows nothing else.
 *
 * The temptation is to put the balance on it, or the notifications, or a
 * greeting with the day's move — every one of which hands the contents of the
 * account to whoever is holding the phone, which is the exact person the lock
 * is for. So: who is signed in, the pad, and the way out. Nothing else. Not
 * the nav, not the bell, not a figure.
 */

/** Five wrong tries and the pad is no use. The way out has to be on this
 *  screen, because this screen is the whole app right now — sending somebody
 *  to Security when they cannot reach Security is sending them nowhere. */
function lockedOut(): HTMLElement {
  return h('div', { class: 'lock' },
    h('div', { class: 'lock-card' },
      h('span', { class: 'mark lock-mark warn-mark', html: icon.alert() }),
      h('h1', { class: 't-title', style: { margin: '0' }, text: 'Locked' }),
      h('p', { class: 'muted', style: { margin: '0', textAlign: 'center' },
        text: 'Five wrong tries. Your money is untouched, but this device has to be proved again.' }),
      // The password is the way back, and it is the only one offered. An
      // earlier draft put "use my recovery phrase" here and cleared the count
      // to open it — which is a button that hands out five more guesses to
      // anybody who presses it. The lockout has to cost something.
      h('button', { class: 'btn btn-primary', text: 'Sign in with my password',
        on: { click: () => { actions.signOut(); go('/signin') } } }),
      h('span', { class: 'subtle t-caption', style: { textAlign: 'center' },
        text: 'Forgotten that too? Your twelve word recovery phrase sets a new one. Nobody here can read your PIN.' })))
}

export function lockScreen(): HTMLElement {
  if (actions.pinLocked()) return lockedOut()

  const first = state.person.name.split(' ')[0]
  const initials = state.person.name.split(' ').map((w) => w[0]).join('')

  const pad = pinPad({
    hint: 'Four digits',
    onFull: (v) => {
      if (actions.checkPin(v)) { actions.unlock(); return }
      if (actions.pinLocked()) { actions.lock(); return }   // repaint as locked out
      pad.reject('That is not your PIN. ' + (5 - state.security.wrongPin) + ' tries left.')
    },
  })

  // Face ID first when it is on, because it is what people actually use. It
  // is a button rather than a real biometric prompt — there is no device to
  // ask — but the shape of the flow is the shape it would have.
  const face = h('button', { class: 'btn btn-secondary lock-face' },
    h('span', { html: icon.face() }), h('span', { text: 'Use Face ID' }))
  face.addEventListener('click', () => {
    if (face.classList.contains('is-busy')) return
    face.classList.add('is-busy')
    setTimeout(() => actions.unlock(), 500)
  })

  return h('div', { class: 'lock' },
    h('div', { class: 'lock-card' },
      h('span', { class: 'avatar lock-avatar', text: initials }),
      h('h1', { class: 't-title', style: { margin: '0' }, text: 'Welcome back, ' + first }),
      h('span', { class: 'muted t-caption', text: 'Tokkenly is locked' }),
      pad.el,
      state.security.faceId ? face : null,
      h('button', { class: 'link quiet', text: 'Forgotten your PIN?',
        on: { click: () => openSheet('phrase') } })))
}
