import { DESTINATIONS } from './destinations'
import { find } from './catalogue'
import type { Route } from './router'

/* The grouping you came through.
   ---------------------------------------------------------------------------

   A company can be met in six or seven places: under any of the chips on
   Invest, in any of the three groupings it ends in, or in the table on any of
   the three index pages. The address is the same from all of them — one
   company, one address (see the note on `pathOf`) — so the address cannot say
   which one you took, and the trail was reading `Invest › Disney` no matter
   how you got there.

   This holds the last one you stood in, so the trail can read
   `Invest › Moving today › Disney`. It is memory, not address: somebody
   opening a link you sent them did not come through anything, and their trail
   correctly reads `Invest › Disney`.

   It survives the strip. Swiping from Disney to Nike keeps the grouping,
   because you are still standing where the list left you — and it is dropped
   the moment you leave the set, so a company opened later from the wallet
   does not claim you arrived through a list you saw an hour ago. */

export type Step = { label: string; to: string }

let held: Step | null = null

/** The bare path of a destination, without its query. */
const bare = (to: string) => to.split('?')[0]

/** Is this address a company — its page, or one of its three actions?
 *
 *  Asked of the catalogue rather than by pattern, because `/invest/list` and
 *  `/invest/index` sit at the same depth and are not companies. */
function isCompany(r: Route): boolean {
  const [a, b] = r.parts
  return a === 'invest' && !!b && !!find(b)
}

/** The grouping you are standing in, if this screen is one.
 *
 *  Invest itself counts, and the chip is the part worth naming: the table is
 *  filtered, and `Invest › Consumer › Disney` says something `Invest › Disney`
 *  does not. The list and index screens take their names from the registry, so
 *  a screen renamed there is renamed here without anybody remembering to. */
function groupingAt(r: Route): Step | null {
  if (r.path === '/invest') {
    // Searching is not a grouping. The chip is still set underneath, but it is
    // not what the results came from, and naming it would be a trail that
    // disagrees with the screen above it.
    if (r.query.get('q')) return null
    const cat = r.query.get('cat') ?? 'Popular'
    return { label: cat, to: '/invest?cat=' + encodeURIComponent(cat) }
  }
  if (/^\/invest\/(list|index)\//.test(r.path)) {
    const d = DESTINATIONS.find((x) => bare(x.to) === r.path)
    return d ? { label: d.label, to: d.to } : null
  }
  return null
}

/** Called once per route change, before the screen is built. */
export function noteRoute(r: Route): void {
  const g = groupingAt(r)
  if (g) { held = g; return }
  // Inside the set of companies, keep what the list handed over — that is the
  // whole point of holding it, and the strip moves between companies without
  // passing back through the list.
  if (isCompany(r)) return
  held = null
}

/** The grouping to name in a company's trail, or nothing if there isn't one. */
export const cameThrough = (): Step | null => held

/** For the suites: start from nowhere. */
export const forget = (): void => { held = null }
