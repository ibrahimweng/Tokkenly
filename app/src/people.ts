/** The people this account pays, and how they are listed.
 *
 *  Shared by the Send screen and by the dialog that changes who a payment is
 *  for. It lived on the Send screen, so the dialog imported it from a screen;
 *  it is about the person's own history, not about any one screen, so it is
 *  here. */

import { h } from './ui'
import { icon } from './icons'
import { state } from './state'
import { usd, when } from './format'

/** Names only. Cash goes to anybody, so the Tokkenly flag on a person is
 *  nothing to do with paying them — it is what decides whether a share can be
 *  handed over, and that lives on the share screen. */
export const PEOPLE = (): string[] => state.people.map((p) => p.name)

/** Ordered by memory rather than alphabet: the person you paid on Tuesday
 *  first. Shared, because the picker and the column beside Send must not
 *  disagree about who is at the top. */
export function byRecent(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const ia = state.activity.findIndex((x) => x.who === a)
    const ib = state.activity.findIndex((x) => x.who === b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
}

export const initials = (name: string) => name.split(' ').map((s) => s[0]).join('')

/** When someone was last paid, so the list is ordered by memory rather than
 *  alphabet. Nothing beats "the person you paid on Tuesday". */
export function lastPaid(name: string): string {
  const a = state.activity.find((x) => x.who === name && x.kind === 'payment')
  return a ? (a.amount < 0 ? 'You sent ' : 'They sent ') + usd(Math.abs(a.amount)) + ' · ' + when(a.at) : 'No payments yet'
}

/** Step one of Send on a phone. There is no second column to hold the list,
 *  so who comes first and how much follows as a sheet. Figma M07. */
/** The same list the phone shows as a screen, as a sheet for the dialog's
 *  Change row. One source of people, two presentations. */
export function peopleRows(onPick: (who: string) => void): HTMLElement[] {
  return byRecent(PEOPLE())
    .map((p) =>
      h('button', { class: 'sheet-row', on: { click: () => onPick(p) } },
        h('span', { class: 'avatar', text: initials(p) }),
        h('span', { class: 'two-line' },
          h('span', { class: 't-body-strong', text: p }),
          h('small', { text: lastPaid(p) })),
        h('span', { class: 'muted', html: icon.chevron() })))
}
