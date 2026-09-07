/** How close a query is to a candidate, and in what way.
 *
 *  Search in this product was five fields that did nothing until you pressed
 *  Enter and then matched on `includes` — so "Micrsoft" found nothing, "aple"
 *  found nothing, and the only way to learn either had happened was to look at
 *  an empty list. A search box that answers "no" to a near miss is a search box
 *  that makes people type more carefully rather than one that helps them.
 *
 *  Four ways to match, and the order between them is the whole point: a thing
 *  whose name starts with what you typed is a better answer than one that
 *  merely contains it, and one that contains it is a better answer than one
 *  your typing could be a garbled version of. */
export type How = 'prefix' | 'word' | 'contains' | 'fuzzy'

export interface Match { how: How; score: number }

const RANK: Record<How, number> = { prefix: 0, word: 1, contains: 2, fuzzy: 3 }

/** Lower case, and accents folded, so "Adaeze" answers to "adaeze". */
export const norm = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Is every letter of the query in the candidate, in order? "aple" is in
 *  "apple", "msft" is in "microsoft". Cheap, and it is what catches the
 *  dropped letter and the transposition that a substring test cannot. */
function subsequence(q: string, hay: string): number | null {
  let i = 0
  let gaps = 0
  let last = -1
  for (const ch of q) {
    const at = hay.indexOf(ch, i)
    if (at < 0) return null
    if (last >= 0) gaps += at - last - 1
    last = at
    i = at + 1
  }
  return gaps
}

/** How well `raw` matches `text`, or null if it does not at all.
 *
 *  Score is a cost: lower is closer. Ties inside a rung are broken by where
 *  the match starts and by how long the candidate is, so a short name matched
 *  early comes before a long one matched late. */
export function match(raw: string, text: string): Match | null {
  const q = norm(raw.trim())
  if (!q) return { how: 'prefix', score: 0 }
  const hay = norm(text)
  if (!hay) return null

  if (hay.startsWith(q)) return { how: 'prefix', score: hay.length }
  // The start of any word in it: "market fund" answers to "fund".
  const word = new RegExp('(?:^|[^a-z0-9])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(hay)
  if (word) return { how: 'word', score: hay.indexOf(q) + hay.length }
  const at = hay.indexOf(q)
  if (at >= 0) return { how: 'contains', score: at * 4 + hay.length }
  // A near miss is only worth offering if there is enough of it to be sure.
  // Two letters subsequence-match half the catalogue.
  if (q.length < 3) return null
  const gaps = subsequence(q, hay)
  if (gaps === null) return null
  // A fuzzy hit stretched across the whole of a long name is not a hit, it is
  // a coincidence — "aeo" is "in" almost every sentence in English.
  if (gaps > q.length * 2 + 4) return null
  return { how: 'fuzzy', score: gaps * 8 + hay.length }
}

/** The best of several fields — a company matches on its ticker, its name, or
 *  what it does, and the strongest of those decides where it ranks. */
export function matchAny(raw: string, ...texts: (string | undefined)[]): Match | null {
  let best: Match | null = null
  for (const t of texts) {
    if (!t) continue
    const m = match(raw, t)
    if (!m) continue
    if (!best || RANK[m.how] < RANK[best.how] || (RANK[m.how] === RANK[best.how] && m.score < best.score)) best = m
  }
  return best
}

/** Rank a list by how close each item is, dropping what does not match. */
export function rank<T>(raw: string, items: T[], fields: (item: T) => (string | undefined)[]): T[] {
  const scored: { item: T; m: Match }[] = []
  for (const item of items) {
    const m = matchAny(raw, ...fields(item))
    if (m) scored.push({ item, m })
  }
  scored.sort((a, b) => RANK[a.m.how] - RANK[b.m.how] || a.m.score - b.m.score)
  return scored.map((s) => s.item)
}

/** Whether anything matched exactly, or only by near miss. A list of near
 *  misses needs to say that it is one. */
export const onlyNear = <T>(raw: string, items: T[], fields: (item: T) => (string | undefined)[]): boolean =>
  raw.trim().length > 0 && items.length > 0 &&
  items.every((i) => matchAny(raw, ...fields(i))?.how === 'fuzzy')
