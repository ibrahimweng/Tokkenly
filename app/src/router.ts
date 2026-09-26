/** Hash router. A route is a path plus an optional sheet segment, so a modal
 *  is a real address: #/grow/borrow?sheet=review can be linked and reloaded. */

export interface Route {
  path: string
  parts: string[]
  query: URLSearchParams
  sheet: string | null
}

type Handler = (r: Route) => void
let handler: Handler = () => {}

export function parse(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/'
  const [pathPart, queryPart] = raw.split('?')
  const query = new URLSearchParams(queryPart ?? '')
  const path = pathPart.replace(/\/+$/, '') || '/'
  return {
    path,
    parts: path.split('/').filter(Boolean),
    query,
    sheet: query.get('sheet'),
  }
}

export const current = (): Route => parse(location.hash)

export function go(to: string, replace = false): void {
  const url = '#' + to
  if (replace) history.replaceState(null, '', url)
  else history.pushState(null, '', url)
  seen = location.hash
  handler(current())
}

/** Opens a sheet over whatever screen is showing, without losing it. */
export function openSheet(name: string, params: Record<string, string> = {}): void {
  const r = current()
  const q = new URLSearchParams(r.query)
  q.set('sheet', name)
  for (const [k, v] of Object.entries(params)) q.set(k, v)
  go(r.path + '?' + q.toString())
}

export function closeSheet(): void {
  const r = current()
  const q = new URLSearchParams(r.query)
  q.delete('sheet')
  const rest = q.toString()
  go(r.path + (rest ? '?' + rest : ''), true)
}

export function replaceSheet(name: string, params: Record<string, string> = {}): void {
  const r = current()
  const q = new URLSearchParams(r.query)
  q.set('sheet', name)
  for (const [k, v] of Object.entries(params)) q.set(k, v)
  go(r.path + '?' + q.toString(), true)
}

/** Sets values on the current address without adding a history entry, for a
 *  choice that changes what a screen can offer — which balance is paying, say
 *  — so the screen is rebuilt around it and a reload keeps it. */
export function setParams(params: Record<string, string>): void {
  const r = current()
  const q = new URLSearchParams(r.query)
  for (const [k, v] of Object.entries(params)) q.set(k, v)
  go(r.path + '?' + q.toString(), true)
}

/** The address last handed to the handler by the browser's own events. */
let seen = ''

/** The hash an address typed without one stands for.
 *
 *  The host rewrites every path to index.html (vercel.json), so a link like
 *  https://host/market/aapl?sheet=x reaches the app with no hash at all. It
 *  used to be reset to `#/`, which meant the rewrite saved the visit and then
 *  threw away where it was going. Now the path and its query become the hash
 *  route they name, /market/aapl?sheet=x → #/market/aapl?sheet=x. A path the
 *  app has no screen for (`known` says which first segments it has) still
 *  falls back to Home rather than to "No screen at that address", because
 *  the stray path came from outside — a mistyped link, a crawler — not from
 *  anywhere in the product. */
export function fromPathname(pathname: string, search: string, known: (first: string) => boolean): string {
  const path = pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/'
  const first = path.split('/').filter(Boolean)[0]
  if (first !== undefined && !known(first)) return '#/'
  return '#' + path + (search.length > 1 ? search : '')
}

export function start(fn: Handler, known: (first: string) => boolean = () => false): void {
  handler = fn
  // Back, forward and an address typed into the bar fire both `popstate` and
  // `hashchange`, and each used to render the whole app — twice per step back,
  // with every timer and quote that implies. One render per address change:
  // whichever event arrives first handles it, and the other finds nothing new.
  const onNav = (): void => {
    if (location.hash === seen) return
    seen = location.hash
    handler(current())
  }
  addEventListener('hashchange', onNav)
  addEventListener('popstate', onNav)
  // No hash: translate the path into the route it names, and put the address
  // bar on the root so every address after this one is a plain hash change.
  if (!location.hash) history.replaceState(null, '', '/' + fromPathname(location.pathname, location.search, known))
  seen = location.hash
  handler(current())
}
