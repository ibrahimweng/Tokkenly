export const usd = (n: number, cents = true): string =>
  '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })

/** Money in is green and carries a plus. Money out is neutral and carries a
 *  minus. design.md rule 43, in one place so it cannot drift. */
export const signed = (n: number): string => (n >= 0 ? '+' : '−') + usd(Math.abs(n))

export const pct = (n: number, dp = 1): string => n.toFixed(dp) + '%'

export const shares = (n: number): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })

export const naira = (n: number): string =>
  '₦' + Math.round(n).toLocaleString('en-US')

export function when(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const y = new Date(now.getTime() - 864e5)
  const hm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return 'Today ' + hm
  if (d.toDateString() === y.toDateString()) return 'Yesterday ' + hm
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + hm
}

export function longWhen(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

export function reference(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)]
  return 'TKN-' + s
}

/** Reads "1,234.5" or "$1,234.50" as a number. Empty is zero, never NaN. */
export function parseAmount(raw: string): number {
  const n = Number(raw.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** How an entry reads in a one-line list. History has columns for who and
 *  what; a list has one line, so Grow entries name their product. */
export function activityLabel(a: { kind: string; type: string; who: string }): string {
  if (a.kind !== 'grow') return a.type + ' ' + a.who
  const map: Record<string, string> = {
    Interest: 'Interest from Earn',
    'Moved in': 'Moved into Earn',
    'Taken out': 'Taken out of Earn',
  }
  return map[a.type] ?? a.type
}
