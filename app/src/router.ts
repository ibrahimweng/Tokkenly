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

export function start(fn: Handler): void {
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
  if (!location.hash) history.replaceState(null, '', '#/')
  seen = location.hash
  handler(current())
}
