export const usd = (n: number, cents = true): string =>
  '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })

/** Money in is green and carries a plus. Money out is neutral and carries a
 *  minus. design.md rule 43, in one place so it cannot drift. */
export const signed = (n: number): string => (n >= 0 ? '+' : '−') + usd(Math.abs(n))

/** Rule 43's third case: money in that is not yours. A drawdown raises the
 *  wallet, so it satisfied "money in" and took the green — $500 borrowed at
 *  9.4% rendered exactly like a $1,500 payday. It keeps the plus, because the
 *  money did arrive, and loses the green, because it is a debt. Here rather
 *  than at either call site, so the two cannot disagree about what a loan is. */
export const isDrawdown = (a: { kind: string; who: string; type: string }): boolean =>
  a.kind === 'grow' && a.who === 'Borrowing' && a.type === 'Borrowed'

export const pct = (n: number, dp = 1): string => n.toFixed(dp) + '%'

/** A quantity of shares. The same holding used to appear three ways on one
 *  screen — 2.2311 in the receipt, 23.42 in the card beside it and 23.42 sh in
 *  the table under that — which reads as three different kinds of number
 *  rather than one number written carelessly.
 *
 *  Two decimals always, so a column of them lines up, and up to four more when
 *  the figure is small enough to need them: a holding of 23.42 does not want
 *  23.4200, and a purchase of 0.0431 is nothing at two. The floor is what
 *  makes it money-shaped; the ceiling is what keeps a fraction honest. */
export const shares = (n: number): string =>
  n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: n >= 1 ? 4 : 6,
  })

export const naira = (n: number): string =>
  '₦' + Math.round(n).toLocaleString('en-US')

/** Morning, afternoon or evening, by the clock on the device. It was the
 *  fixed string "Good morning", which is a small lie at eleven at night and
 *  the kind that makes everything else on the screen easier to doubt. */
export function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

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
 *  what; a list has one line, so a borrowing or lending entry names which. */
export function activityLabel(
  a: { kind: string; type: string; who: string; asset?: { ticker: string } },
): string {
  // A share that changed hands names the share. "Sent Tunde Bakare" is what a
  // cash payment says, and the two are not the same event.
  if (a.asset) return `${a.type} ${a.asset.ticker} ${a.type === 'Sent' ? 'to' : 'from'} ${a.who}`
  if (a.kind !== 'grow') return a.type + ' ' + a.who
  const map: Record<string, string> = {
    Interest: 'Interest on what you lent',
    Lent: 'Lent out',
    'Taken back': 'Taken back from lending',
  }
  return map[a.type] ?? a.type
}

/** A name as a monogram. Three screens draw the same avatar — the sidebar, the
 *  phone's top bar and the profile — and three copies of one split is how the
 *  three end up disagreeing about a middle name. */
export const initialsOf = (name: string): string =>
  name.split(' ').filter(Boolean).map((s) => s[0]).join('').slice(0, 2).toUpperCase()
