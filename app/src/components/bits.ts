import { h, link } from '../ui'
import { icon } from '../icons'
import { signed, isDrawdown, usd } from '../format'
import { state, actions, MASK, bucketTotal, bucketCost } from '../state'
import { go } from '../router'

export function card(...children: (Node | false | null)[]): HTMLElement {
  const el = h('section', { class: 'card' })
  for (const c of children) if (c) el.appendChild(c)
  return el
}

/** A card's name, as a heading. It was a span, so every screen in the product
 *  offered a screen reader exactly one heading — the page title — and no way to
 *  skim what was on it. Home has five cards, a stock page eleven. The type is
 *  unchanged: .t-caps carries it, and an <h2> at 11px caps looks like an
 *  eyebrow because that is what it is. */
export function cardHead(label: string, right?: Node | null): HTMLElement {
  return h('div', { class: 'card-head' },
    h('h2', { class: 't-caps subtle', text: label }), right ?? null)
}

/* ---------------- the bucket, standing by ----------------

   A bucket that fills and then waits for somebody to remember it is a bucket
   nobody pays for. Every shop that sells more than one thing at a time solves
   this the same way, and it is not a trick: a small standing bar that says
   what is in the basket and what it comes to, on the screens where you are
   doing the choosing. It states the total rather than nagging, and it can be
   put away — a bar you cannot dismiss is an advert. */

/** Put away for now. Not persisted: it comes back when you add the next
 *  thing, because that is a fresh decision rather than the same one repeated. */
let barHidden = false
export const showBucketBar = (): void => { barHidden = false }

export function bucketBar(): HTMLElement | null {
  const n = state.bucket.length
  if (!n || barHidden) return null
  const bar = h('div', { class: 'bucket-bar', role: 'status', ariaLive: 'polite' },
    h('span', { class: 'mark', html: icon.bucket() }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong',
        text: `${n} ${n === 1 ? 'company' : 'companies'} in your bucket` }),
      h('small', { text: `${usd(bucketTotal())} · ${usd(bucketCost())} all in` })),
    h('button', { class: 'btn btn-primary btn-sm', text: 'Review and buy',
      on: { click: () => go('/bucket') } }),
    h('button', {
      class: 'icon-btn bucket-bar-close', ariaLabel: 'Put this away', html: icon.close(),
      on: { click: () => { barHidden = true; bar.remove() } },
    }))
  return bar
}

/** A limit, a shortfall or a mistake, beside the thing it is about — and
 *  always a live region.
 *
 *  Every one of these appears without a page change: you type past a ceiling,
 *  you fill a bucket past your cash, you paste half an address. They were
 *  appearing silently, which for somebody who cannot see the sentence means
 *  the button simply stops working with no explanation. Built here rather than
 *  in five places, so the rule is one rule. */
export function fieldError(...children: (Node | string | null | false)[]): HTMLElement {
  return h('small', { class: 'field-error', role: 'status' }, ...children)
}

/** A card header link names where it goes, never "see more". Rule 49. */
export function headLink(label: string, to: string): HTMLAnchorElement {
  return link(to, 'link', label)
}

export function kv(label: string, value: string | Node, cls = ''): HTMLElement {
  return h('div', { class: 'kv' },
    h('span', { text: label }),
    typeof value === 'string' ? h('span', { class: cls, text: value }) : value)
}

/** What is not working, said where somebody meets it.
 *
 *  A provider being down is an internal fact until the moment it stops
 *  somebody adding money, and then it is theirs. The console has the metric;
 *  this has the sentence, and they read the same source so they cannot
 *  disagree about whether the thing is up. */
export function providerNote(key: string): HTMLElement | null {
  const p = state.providers.find((x) => x.key === key)
  if (!p || p.state === 'up') return null
  return callout(
    `${p.name} is ${p.state === 'down' ? 'not responding' : 'slow'} right now. ${p.fallback}`,
    p.state === 'down' ? 'warning' : 'brand')
}

export function callout(text: string, kind: 'brand' | 'warning' = 'brand'): HTMLElement {
  return h('div', { class: 'callout' + (kind === 'warning' ? ' warning' : '') },
    h('span', { html: kind === 'warning' ? icon.alert() : icon.info() }),
    h('span', { text }))
}

/** Nothing to show, and a reason why. Figma 02 Components, Empty state.
 *  A list that renders as blank space reads as a bug; this reads as an answer. */
export function emptyState(
  title: string,
  body: string,
  action?: { label: string; onClick: () => void },
  glyph: 'search' | 'history' | 'alert' = 'search',
): HTMLElement {
  return h('div', { class: 'empty' },
    h('span', { class: 'mark', html: icon[glyph]() }),
    // h2, not h3. An empty state sits inside a card on most screens, where it
    // would follow the card's own heading, and stands alone under the page
    // title on the bucket, where an h3 skipped a level. A sibling h2 is right
    // in both places.
    h('h2', { text: title }),
    h('p', { text: body }),
    // A quiet button inside a card. A second filled grey on a grey card is
    // one surface too many.
    action ? h('button', { class: 'btn btn-quiet', text: action.label, on: { click: action.onClick } }) : null)
}

/** The shape of an answer, before the answer. Figma 02 Components, Skeleton row. */
export function skeletonList(rows = 4): HTMLElement {
  const row = () => h('div', { class: 'skeleton-row' },
    h('span', { class: 'sk disc' }),
    h('span', { class: 'lines' },
      h('span', { class: 'sk', style: { width: '160px', height: '12px' } }),
      h('span', { class: 'sk', style: { width: '96px', height: '10px' } })),
    h('span', { class: 'sk', style: { width: '72px', height: '12px' } }))
  return h('div', { class: 'skeleton-list' }, ...Array.from({ length: rows }, row))
}

/** A control that is working. The label stays put so the page never jumps. */
export function busy(btn: HTMLButtonElement, on: boolean): void {
  btn.classList.toggle('is-busy', on)
}

export function filled(label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  return h('button', { class: 'btn btn-primary', disabled, on: { click: onClick } }, label)
}

export function quiet(label: string, onClick: () => void): HTMLButtonElement {
  return h('button', { class: 'btn btn-secondary', on: { click: onClick } }, label)
}

/** Money in is green, money out is neutral — and borrowing is the third case
 *  rule 43 did not have. A drawdown is money in, so it took the green and
 *  rendered identically to being paid: $500 borrowed at 9.4% looked exactly
 *  like a $1,500 payday, same colour, same plus, same inbound arrow. It keeps
 *  the plus, because the money did arrive in the wallet, and loses the green,
 *  because it is a debt rather than a gain.
 *
 *  It takes the entry rather than the figure so a call site cannot decide for
 *  itself which case it is in, which is the whole point of rule 43. */
export function amount(a: { amount: number; kind: string; who: string; type: string }): HTMLElement {
  const green = a.amount >= 0 && !isDrawdown(a)
  return h('span', { class: (green ? 'pos ' : '') + 't-body-strong',
    text: state.prefs.hideBalances ? MASK : signed(a.amount) })
}

/** The switch that takes your balances off the screen, sitting next to a
 *  figure rather than buried in settings — the moment you want it is the
 *  moment somebody sits down beside you, and Account is four taps away. It is
 *  also in Preferences, because a control you found by accident once is a
 *  control you cannot find again on purpose. */
function privacyToggle(): HTMLElement {
  const on = state.prefs.hideBalances
  return h('button', {
    class: 'icon-btn eye-btn',
    ariaLabel: on ? 'Show your balances' : 'Hide your balances',
    ariaPressed: on,
    html: on ? icon.eyeOff() : icon.eye(),
    on: { click: () => actions.toggleBalances() },
  })
}

/** The figure, and the switch that covers it, on one line.
 *
 *  The switch used to live in the page header: the far corner of the screen
 *  from the number it acts on, in a row with search, a view toggle and the
 *  bell, where it read as one more piece of chrome. On Grow it was not on the
 *  screen at all — so the one place a balance is masked by default had no way
 *  to uncover it short of four taps into Preferences.
 *
 *  It sits against the figure now, on the screens with a headline balance and
 *  nowhere else. One per screen, because the switch is one setting: a second
 *  eye on the same page would suggest two things to cover.
 *
 *  Which is why it left Borrow & Lend again when that screen's hero did. That
 *  page is two cards with a figure apiece, and neither is a headline — they
 *  are positions, like a holding on a company page, and they follow the
 *  setting without a switch of their own. The switch went with the figure, to
 *  the two position pages the cards now open. */
export function figureWithEye(figure: HTMLElement): HTMLElement {
  return h('div', { class: 'figure-eye' }, figure, privacyToggle())
}

export function directionMark(n: number): HTMLElement {
  return h('span', { class: 'mark', html: n >= 0 ? icon.arrowIn() : icon.arrowOut() })
}

/** How much of a fixed allowance is gone. Not `meter`: that one auto-scales
 *  and carries a tick, because a cover ratio has no natural ceiling and a
 *  minimum worth marking. A month's allowance has both — the scale is the
 *  allowance and there is nothing to mark. */
export function spentBar(part: number, whole: number, cls = ''): HTMLElement {
  const filled = whole > 0 ? Math.max(0, Math.min(100, (part / whole) * 100)) : 0
  return h('div', { class: 'meter-track ' + cls },
    h('div', { class: 'meter-fill', style: { width: filled + '%' } }))
}

/** A value, with a mark on it, on a scale that fits both.
 *
 *  Both arguments are in whatever unit the caller is showing — the one caller
 *  passes what the shares are worth and the price we would sell at. It used to
 *  take two percentages, and its caller used to pass a cover ratio: shares as
 *  a percentage of the debt, which reads 3,217% for somebody holding $12,500
 *  against a $389 loan and pins the bar full every time. */
export function meter(value: number, mark: number): HTMLElement {
  const scale = Math.max(value, mark) * 1.1
  const fill = scale > 0 ? Math.min(100, (value / scale) * 100) : 0
  const tick = scale > 0 ? Math.min(100, (mark / scale) * 100) : 0
  return h('div', { class: 'meter-track' },
    h('div', { class: 'meter-fill', style: { width: fill + '%' } }),
    h('div', { class: 'meter-tick', style: { left: `calc(${tick}% - 1px)` } }))
}

export function statLine(label: string, value: string, cls = ''): HTMLElement {
  return h('div', { class: 'stack-8' },
    h('span', { class: 't-caps subtle', text: label }),
    h('span', { class: 't-body-strong ' + cls, text: value }))
}

/* --------------------------------------------------------------- controls --
   A preference is a control that remembers. The toggles on Security were
   inline-styled buttons that lit up, said "Face ID is on" and forgot — they
   looked like settings without being any. These read and write state. */

export function toggle(opts: {
  label: string
  sub: string
  /** Required. Half these rows had a glyph and half did not, which is what
   *  made a list of six settings read as five different kinds of thing. */
  ic: string
  get: () => boolean
  set: (on: boolean) => void
}): HTMLElement {
  const knob = h('span', { class: 'switch' }, h('span', { class: 'switch-knob' }))
  const row = h('button', { class: 'pref-row' },
    h('span', { class: 'mark', html: opts.ic }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: opts.label }),
      h('small', { text: opts.sub })),
    knob)
  const paint = (): void => {
    const on = opts.get()
    knob.classList.toggle('on', on)
    row.setAttribute('aria-pressed', String(on))
    row.setAttribute('aria-label', `${opts.label}, ${on ? 'on' : 'off'}`)
  }
  row.addEventListener('click', () => { opts.set(!opts.get()); paint() })
  paint()
  return row
}

/** A choice between a few named things, where seeing the alternatives is the
 *  point. Anything longer than four belongs in a sheet. */
export function choice(opts: {
  label: string
  sub: string
  ic: string
  options: { label: string; value: string }[]
  get: () => string
  set: (v: string) => void
  onPick?: () => void
}): HTMLElement {
  const chips = h('div', { class: 'chip-row' })
  const paint = (): void => {
    for (const c of chips.children) {
      const el = c as HTMLElement
      el.setAttribute('aria-pressed', String(el.dataset.value === opts.get()))
    }
  }
  for (const o of opts.options) {
    chips.appendChild(h('button', {
      class: 'chip', text: o.label, dataset: { value: o.value },
      on: { click: () => { opts.set(o.value); paint(); opts.onPick?.() } },
    }))
  }
  paint()
  return h('div', { class: 'pref-row pref-choice' },
    h('span', { class: 'mark', html: opts.ic }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: opts.label }),
      h('small', { text: opts.sub })),
    chips)
}

/** The third shape: a setting whose control is a button rather than a switch
 *  or a set of values — replaying the intro is the only one. Same anatomy as
 *  the other two, so a settings list is one row repeated rather than five
 *  arrangements of the same parts. */
export function prefAction(opts: {
  label: string
  sub: string
  ic: string
  action: string
  onClick: () => void
}): HTMLElement {
  return h('div', { class: 'pref-row pref-act' },
    h('span', { class: 'mark', html: opts.ic }),
    h('span', { class: 'two-line grow' },
      h('span', { class: 't-body-strong', text: opts.label }),
      h('small', { text: opts.sub })),
    h('button', { class: 'btn btn-secondary btn-sm', text: opts.action, on: { click: opts.onClick } }))
}
