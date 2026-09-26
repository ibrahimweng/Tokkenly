/** What somebody had typed, carried across a redraw.
 *
 *  Every change of state rebuilds the whole screen, and a change of state is
 *  not always something the person did: a payout landing, a card charge
 *  clearing, a conversion's second leg — each one redraws whatever is on
 *  screen, and each one used to wipe a half-typed amount, a half-typed
 *  account number, or a password somebody was two words into. Focus is put
 *  back by `restoreFocus` in ui.ts; this puts back what was in the fields.
 *
 *  Only for the same address. A field on a different screen, or the same
 *  screen with a different query, is a different question and starts empty.
 *  A field is recognised again by what it is — its tag, its type, its label or
 *  placeholder, and which one of those it is in the order they appear — since
 *  the element itself no longer exists.
 *
 *  A restored value is announced with an `input` event, so a composer that
 *  keeps its own figure behind the field takes it up. A handler that answers
 *  that event by changing state redraws the screen again; that inner redraw
 *  does not restore anything, so it can never loop. */

export interface FieldMark {
  key: string
  value: string
  start: number | null
  end: number | null
}

const SKIP = new Set(['checkbox', 'radio', 'hidden', 'file', 'button', 'submit', 'range'])

function fields(root: HTMLElement): { key: string; el: HTMLInputElement | HTMLTextAreaElement }[] {
  const seen = new Map<string, number>()
  const out: { key: string; el: HTMLInputElement | HTMLTextAreaElement }[] = []
  for (const el of root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')) {
    const type = el instanceof HTMLInputElement ? el.type : 'textarea'
    if (SKIP.has(type)) continue
    const what = el.getAttribute('aria-label') ?? el.getAttribute('placeholder') ?? el.name ?? ''
    const base = el.tagName + ':' + type + ':' + what
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    out.push({ key: base + '#' + n, el })
  }
  return out
}

export function markFields(root: HTMLElement): FieldMark[] {
  return fields(root)
    // Only what somebody changed. A field still showing what it was drawn
    // with has nothing to carry.
    .filter(({ el }) => el.value !== el.defaultValue)
    .map(({ key, el }) => {
      let start: number | null = null
      let end: number | null = null
      try { start = el.selectionStart; end = el.selectionEnd } catch { /* not a text field */ }
      return { key, value: el.value, start, end }
    })
}

let restoring = false
let deferred: FieldMark[] | null = null

export function restoreFields(root: HTMLElement, marks: FieldMark[], depth = 0): void {
  if (!marks.length) return
  // A redraw set off by one of the events below: its tree is the one that
  // will be left standing, so it is the one the values go back into — once
  // the events in hand have been sent, and only one level deep, so a handler
  // that always changes state cannot make this go round for ever.
  if (restoring) { deferred = marks; return }
  restoring = true
  try {
    const now = new Map(fields(root).map((f) => [f.key, f.el]))
    for (const m of marks) {
      const el = now.get(m.key)
      if (!el || !el.isConnected || el.value === m.value) continue
      el.value = m.value
      try {
        if (m.start !== null && m.end !== null) el.setSelectionRange(m.start, m.end)
      } catch { /* a field type with no caret */ }
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
  } finally {
    restoring = false
  }
  const later = deferred
  deferred = null
  if (later && depth < 1) restoreFields(root, later, depth + 1)
}
