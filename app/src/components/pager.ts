import { h } from '../ui'
import { icon } from '../icons'
import { go } from '../router'

/* Moving between screens that are a set.
   ---------------------------------------------------------------------------

   Three places in the product now hold a set of screens you step through: the
   thirteen companies (11g.63), the three indices (11g.64), and the groupings
   on Invest. Each had grown its own copy of the same two behaviours — a row of
   names with the current one lit, and a swipe that pages between them — which
   is three chances for them to drift apart and three places to fix anything
   found in one.

   One row, one gesture, one keydown listener.

   And one history entry. Every way of moving inside a set — the names, the
   chevrons, the swipe, the arrow keys — replaces the entry rather than pushing
   one, because a set is a thing you are browsing and not thirteen places you
   have been. Pushing meant somebody who swiped through nine companies pressed
   the browser's Back nine times to get out, and each press showed them a
   company they had already dismissed. Replacing leaves exactly one entry for
   the whole set, so Back goes to the list they came in from.

   Arriving is still a push: the list to the company is a real move, and it is
   the entry Back is supposed to find.

   The listener is module-level on purpose. This app rebuilds its whole tree on
   every state change, so a handler added per render leaves a stack of stale
   ones and a single arrow press walks several screens at once. One listener,
   and each render says what it should do by re-arming `armed`. */

export type Stop = { key: string; label: string; to: string }

/** The visible control: previous, the names, next.
 *
 *  Buttons rather than only a gesture. A swipe nobody is told about is a
 *  feature only the people who already know it ever find, and these sets are
 *  small enough that naming every member is cheaper than teaching a gesture. */
export function pagerRow(stops: Stop[], now: string, label: string): HTMLElement {
  const i = stops.findIndex((s) => s.key === now)
  // Wrapping. A set of three that stops dead at the third reads as broken
  // rather than as finished, and Next is the control people were promised.
  const at = (n: number) => stops[(n + stops.length) % stops.length]
  const step = (to: Stop, back: boolean) =>
    h('button', {
      class: 'icon-btn pager-step' + (back ? ' back' : ''),
      ariaLabel: (back ? 'Previous, ' : 'Next, ') + to.label,
      title: to.label,
      // One chevron, turned. A second SVG that is the first one mirrored is a
      // second drawing to keep in step with the first.
      html: icon.chevron(),
      on: { click: () => go(to.to, true) },
    })
  const tabs = h('nav', { class: 'pager-tabs', ariaLabel: label },
    ...stops.map((s) => {
      const on = s.key === now
      const b = h('button', {
        class: 'pager-tab' + (on ? ' on' : ''),
        text: s.label,
        on: { click: () => { if (!on) go(s.to, true) } },
      })
      if (on) b.setAttribute('aria-current', 'page')
      return b
    }))
  // The strip is wider than a phone and starts at its left edge, so on the
  // later stops of a set the tab you were on sat off the right side: at 360 the
  // three lists all showed "Popular" and nothing else. That is the one control
  // on the screen whose whole job is saying where you are, naming somewhere you
  // are not — and the tab carrying `aria-current` was the one nobody could see.
  //
  // Centred rather than merely nudged into view, because the point of the strip
  // is the set: the neighbours either side are what make it read as one.
  const lit = tabs.querySelector<HTMLElement>('.pager-tab.on')
  if (lit) {
    requestAnimationFrame(() => {
      if (!lit.isConnected) return
      const a = lit.getBoundingClientRect()
      const box = tabs.getBoundingClientRect()
      tabs.scrollLeft += a.left - box.left - (tabs.clientWidth - a.width) / 2
    })
  }
  // `i` is -1 when the current screen is not itself one of the stops — the
  // strip on Invest's own groupings names Popular, which lives on Invest
  // rather than on a screen of its own. Stepping from nowhere starts at the
  // ends rather than throwing.
  return h('div', { class: 'pager' },
    step(at(i < 0 ? stops.length - 1 : i - 1), true),
    tabs,
    step(at(i < 0 ? 0 : i + 1), false))
}

/** Where a drag must not start. The chart reads the pointer itself, a pager's
 *  own names scroll sideways, and a table that scrolls sideways is a third
 *  thing that owns the axis. Taking the gesture from any of them makes the
 *  page lurch when somebody meant to act inside it. */
const OWNS_THE_AXIS =
  '.ch-plot, .pager-tabs, .co-strip, .table-scroll, .chip-row, .tf-row, input, textarea'

let armed: { prev: string; next: string; alive: string } | null = null
let wired = false

/** Swipe the page, or press an arrow key, to reach the screen beside this one.
 *
 *  `alive` is a selector that proves this kind of screen is the one showing,
 *  so the single listener does nothing on every other screen in the product. */
export function pageable(
  el: HTMLElement,
  opts: { prev: string; next: string; alive: string },
): void {
  armed = opts

  let x0 = 0, y0 = 0, tracking = false
  el.addEventListener('touchstart', (e) => {
    tracking = false
    if (e.touches.length !== 1) return
    if ((e.target as Element).closest?.(OWNS_THE_AXIS)) return
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; tracking = true
  }, { passive: true })
  el.addEventListener('touchend', (e) => {
    if (!tracking || !armed) return
    tracking = false
    const dx = e.changedTouches[0].clientX - x0
    const dy = e.changedTouches[0].clientY - y0
    // Far enough to be meant, and sideways enough not to be a scroll that
    // wandered. 1.6 rather than 1: a thumb travelling up a long page is never
    // perfectly vertical, and paging the screen out from under somebody who
    // was reading it is the worst thing this gesture can do.
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.6) return
    go(dx < 0 ? armed.next : armed.prev, true)
  }, { passive: true })

  if (wired) return
  wired = true
  addEventListener('keydown', (e) => {
    if (!armed || !document.querySelector(armed.alive)) return
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
    // A dialog owns the keyboard while it is open, and so does anything
    // somebody is typing in.
    if (document.querySelector('.scrim')) return
    const t = e.target as HTMLElement | null
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
    e.preventDefault()
    go(e.key === 'ArrowLeft' ? armed.prev : armed.next, true)
  })
}

/** The two either side of a key, for a set that wraps. */
export function beside<T extends { key: string }>(all: T[], now: string): { prev: T; next: T } {
  const i = all.findIndex((x) => x.key === now)
  return {
    prev: all[(i - 1 + all.length) % all.length],
    next: all[(i + 1) % all.length],
  }
}
