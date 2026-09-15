/* The product, read off the DOM, as a tree Figma can be built from.

   The first converter (11g.70) was written as ad-hoc scripts and never checked
   in, which is exactly why the file drifted and then lost its screens: the only
   way to re-export was to write the exporter again. This one lives in the repo.
  
   It emits a tree, not a screenshot: every box is a frame with real geometry,
   every run of text is a text node with its own size, weight and colour, and
   every fill that matches a token is named so the builder can bind it to the
   Figma variable rather than hard-code a hex. Auto-layout is inferred from
   `display: flex` and its direction, so a card built as a column in CSS is a
   column in Figma and reflows when somebody edits it.

   Usage:  node scripts/_figma-read.mjs <flow>
   Writes: figma/flows/<flow>.json
*/
import { chromium } from 'playwright'
import { seen, fresh, locked } from './seen.mjs'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'

const B = 'http://localhost:4173/#'
const OUT = new URL('../figma/flows/', import.meta.url)

/* The product, flow by flow, screen by screen, at the two widths the file has
   always carried. The list is not invented: every address in it comes off
   `destinations.ts` — the table the product itself navigates by — and every
   one was walked before it was written down, so a page in Figma cannot name a
   screen the app does not have. The nine customer flows are 01–09; the staff
   console is 10, because it is not this person's account.

   Names are what the page in Figma is called and what the frame in it is
   called, so somebody reading the file sees the same words the product uses. */
const AT = [1440, 390]
const S = (name, route, opts = {}) => AT.map((w) => [name + ' \u00b7 ' + w, route, w, opts])
const FRESH = { fresh: true }

export const FLOWS = {
  '01 \u00b7 Getting in': [
    ...S('Welcome \u00b7 Own a piece', '/welcome/0', FRESH),
    ...S('Welcome \u00b7 Naira in', '/welcome/1', FRESH),
    ...S('Welcome \u00b7 Never closes', '/welcome/2', FRESH),
    ...S('Welcome \u00b7 Pick one', '/welcome/3', FRESH),
    ...S('Sign up', '/signup', FRESH),
    ...S('Sign in', '/signin', FRESH),
    ...S('Sign in \u00b7 Forgotten', '/signin?sheet=forgot', FRESH),
    ...S('Lock', '/', { locked: true, security: { appLock: true } }),
    ...S('Verify \u00b7 What we need', '/verify/what'),
    ...S('Verify \u00b7 Your number', '/verify/number'),
    ...S('Verify \u00b7 Your details', '/verify/details'),
    ...S('Verify \u00b7 Done', '/verify/done'),
  ],
  '02 \u00b7 Home': [
    ...S('Home \u00b7 Simple', '/', { prefs: { homeView: 'simple' } }),
    ...S('Home \u00b7 Detailed', '/', { prefs: { homeView: 'detailed' } }),
    ...S('Home \u00b7 Put this away', '/', { prefs: { homeView: 'simple', putAway: ['verify', 'money', 'first'] } }),
  ],
  '03 \u00b7 Browsing the market': [
    ...S('Invest', '/invest'),
    ...S('Popular', '/invest/list/popular'),
    ...S('ETFs', '/invest/list/etfs'),
    ...S('Technology', '/invest/list/technology'),
    ...S('Steady', '/invest/list/steady'),
    ...S('Consumer', '/invest/list/consumer'),
    ...S('Health', '/invest/list/health'),
    ...S('Everything listed', '/invest/list/everything'),
    ...S('Where people start', '/invest/list/starters'),
    ...S('Your watchlist', '/invest/list/watchlist'),
    ...S('Moving today', '/invest/list/movers'),
    ...S('S&P 500', '/invest/index/sp500'),
    ...S('Nasdaq-100', '/invest/index/nasdaq'),
    ...S('Dow Jones', '/invest/index/dow'),
  ],
  '04 \u00b7 Buying and selling': [
    ...S('Apple', '/invest/aapl'),
    ...S('A fund', '/invest/voo'),
    ...S('Buy', '/invest/aapl/invest'),
    ...S('Sell', '/invest/aapl/sell'),
    ...S('Send shares', '/invest/aapl/send'),
    ...S('Your bucket', '/bucket'),
  ],
  '05 \u00b7 Money in and out': [
    ...S('Wallet', '/wallet'),
    ...S('Your banks', '/wallet?sheet=banks'),
    ...S('Add money', '/addmoney'),
    ...S('Add money \u00b7 Bank transfer', '/addmoney/bank'),
    ...S('Add money \u00b7 USDC on Base', '/addmoney/base'),
    ...S('Add money \u00b7 Debit card', '/addmoney/card'),
    ...S('Send money', '/send'),
    ...S('Send \u00b7 Someone on Tokkenly', '/send/tokkenly'),
    ...S('Send \u00b7 A bank account', '/send/bank'),
    ...S('Send \u00b7 USDC on Base', '/send/base'),
  ],
  '06 \u00b7 Borrow & Lend': [
    ...S('Borrow & Lend', '/grow'),
    ...S('Lending', '/grow/lending'),
    ...S('Borrowing', '/grow/borrowing'),
    ...S('Lend', '/grow/earn'),
    ...S('Take out', '/grow/takeout'),
    ...S('Borrow', '/grow/borrow'),
    ...S('Repay', '/grow/repay'),
  ],
  '07 \u00b7 Spending': [
    ...S('Spend', '/spend'),
    ...S('Airtime', '/spend/airtime'),
    ...S('Data', '/spend/data'),
    ...S('Electricity', '/spend/electricity'),
  ],
  '08 \u00b7 Activity and records': [
    ...S('Activity', '/activity'),
    ...S('Activity \u00b7 Payments', '/activity?filter=payments'),
    ...S('Activity \u00b7 Trades', '/activity?filter=trades'),
    ...S('Activity \u00b7 Borrowing and lending', '/activity?filter=grow'),
    ...S('Activity \u00b7 Notifications', '/activity?filter=alerts'),
    ...S('Activity \u00b7 Export', '/activity?sheet=export'),
    ...S('Statement', '/statement'),
  ],
  '09 \u00b7 Account and settings': [
    ...S('Account', '/account'),
    ...S('Personal details', '/account/details'),
    ...S('Preferences', '/account/preferences'),
    ...S('Notifications', '/account/notifications'),
    ...S('Security', '/account/security'),
    ...S('Security \u00b7 Change your PIN', '/account/security?sheet=pin'),
    ...S('Security \u00b7 Change your password', '/account/security?sheet=password'),
    ...S('Payment methods', '/account/payments'),
    ...S('Payment methods \u00b7 Your cards', '/account/payments?sheet=cards'),
    ...S('Your wallet', '/account/wallet'),
    ...S('Your wallet \u00b7 Recovery phrase', '/account/wallet?sheet=phrase'),
    ...S('Verification', '/account/verification'),
    ...S('Support', '/account/support'),
    ...S('Support \u00b7 Email us', '/account/support?sheet=contact'),
    ...S('Risk and legal', '/account/legal'),
    ...S('Risk and disclosures', '/disclosures'),
    ...S('Everything', '/all'),
  ],
  '10 \u00b7 Operations': [
    ...S('Operations', '/admin'),
    ...S('Provider status', '/admin/status'),
    ...S('Feature switches', '/admin/switches'),
    ...S('Reconciliation', '/admin/breaks'),
    ...S('Audit history', '/admin/audit'),
    ...S('Launch readiness', '/admin/launch'),
  ],
}

/* The token behind a colour, so the builder can bind a variable rather than
   paint a hex. Built from the same snapshot figma.mjs checks. */
const snap = JSON.parse(readFileSync(new URL('../figma/tokens.json', import.meta.url), 'utf8'))
const BY_HEX = {}
for (const [fig, v] of Object.entries(snap.colour.vars)) BY_HEX[v.Dark.toLowerCase()] = fig

/* Numbers in generated SVG come out of arithmetic, so a sparkline's forty
   points carry eighteen significant digits each — 3,293 characters for a
   picture 40 pixels wide, and thirteen of those on a company page is most of a
   payload that has to fit in a 50,000-character argument. Two decimal places
   is past the resolution of anything on screen. */
const tidy = (svg) => svg.replace(/-?\d+\.\d{3,}/g, (m) => String(Math.round(Number(m) * 100) / 100))

/* Read one screen. Runs inside the page. */
const WALK = `(() => {
  const hex = (c) => {
    const m = /rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/.exec(c)
    if (!m) return null
    const a = m[4] === undefined ? 1 : Number(m[4])
    if (a === 0) return null
    const to = (v) => Number(v).toString(16).padStart(2, '0')
    return { hex: '#' + to(m[1]) + to(m[2]) + to(m[3]), alpha: a }
  }
  const root = document.querySelector('#app') || document.body
  const base = root.getBoundingClientRect()
  const SKIP = new Set(['SCRIPT', 'STYLE', 'BR'])

  const walk = (el, depth) => {
    if (SKIP.has(el.tagName)) return null
    const s = getComputedStyle(el)
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return null
    const r = el.getBoundingClientRect()
    if (r.width < 0.5 || r.height < 0.5) return null
    if (depth > 24) return null

    const node = {
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute('class') || '').split(/\\s+/).filter(Boolean).slice(0, 4).join(' '),
      x: Math.round(r.left - base.left), y: Math.round(r.top - base.top),
      w: Math.round(r.width), h: Math.round(r.height),
    }
    const bg = hex(s.backgroundColor)
    if (bg) node.fill = bg
    const radius = parseFloat(s.borderTopLeftRadius) || 0
    if (radius) node.radius = Math.min(radius, Math.min(r.width, r.height) / 2)
    if (Number(s.opacity) < 1) node.opacity = Number(s.opacity)
    if (s.display === 'flex' || s.display === 'inline-flex') {
      node.flex = {
        dir: s.flexDirection.startsWith('column') ? 'VERTICAL' : 'HORIZONTAL',
        gap: Math.round(parseFloat(s.gap) || 0),
        pad: ['Top', 'Right', 'Bottom', 'Left'].map((k) => Math.round(parseFloat(s['padding' + k]) || 0)),
        align: s.alignItems, justify: s.justifyContent, wrap: s.flexWrap,
      }
    }

    // The chrome is the same furniture on every screen: the rail is 7,573 of
    // Home's 28,116 characters, and it is that on all eighty-six. A design
    // file holding eighty-six copies of one rail is eighty-six places to
    // change it, which is the opposite of what the file is for. Named here,
    // built once on the Design system page, instanced everywhere. The name
    // carries what actually differs — which row you are on — because a rail
    // that shows Home lit on the Wallet screen would be a lie.
    if (el.classList.contains('sidebar') || el.classList.contains('railbar')) {
      const on = el.querySelector('[aria-current="page"]')
      // The phone's More button is an icon, so it has no text to take a name
      // from — but it is the thing that says you are here on the three places
      // that have no tab. Its label is the fact; the name is the short form.
      const where = !on ? 'Nowhere'
        : (on.innerText || '').trim().split('\\n')[0]
          || (on.classList.contains('rail-more') ? 'More' : 'Unnamed')
      node.part = (el.classList.contains('sidebar') ? 'Nav rail' : 'Tab bar') + ' \u00b7 ' + where
      node.chrome = true
    }

    // An svg that knows its own name is a component in Figma: record the name
    // and let the builder place an instance.
    //
    // A sparkline does not know its name and does not need to: it is forty
    // points of arithmetic, drawn thirteen times on a company page, and a
    // design file holding thirteen copies of a generated polyline is thirteen
    // copies of the same decision. One component, thirteen instances — which
    // is both what a design file is for and what makes a company page fit in
    // a 50,000-character argument. The tone rides on the parent's up or down
    // class, so the instance is told which way it went.
    if (el.tagName.toLowerCase() === 'svg') {
      const named = el.getAttribute('data-art') || el.getAttribute('data-ic')
      const spark = el.parentElement && el.parentElement.classList.contains('spark')
      if (named) node.part = named
      else if (spark) {
        node.part = el.parentElement.classList.contains('down') ? 'Sparkline down' : 'Sparkline up'
      } else node.svg = el.outerHTML.length < 40000 ? el.outerHTML : null
      return node
    }

    // A run of text with no element children is a text node.
    const kids = [...el.children]
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
    if (!kids.length && own.length) {
      node.text = own.map((n) => n.textContent).join('').replace(/\\s+/g, ' ').trim()
      const ink = hex(s.color)
      node.font = {
        size: Math.round(parseFloat(s.fontSize)),
        weight: Number(s.fontWeight) || 400,
        line: Math.round(parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.4),
        tracking: parseFloat(s.letterSpacing) || 0,
        align: s.textAlign,
        caps: s.textTransform === 'uppercase',
        ink: ink ? ink.hex : '#ffffff',
      }
      if (node.font.caps) node.text = node.text.toUpperCase()
      return node
    }

    const out = []
    for (const k of kids) { const c = walk(k, depth + 1); if (c) out.push(c) }
    if (out.length) node.kids = out
    else if (!node.fill && !node.svg) return null
    return node
  }
  return { w: Math.round(base.width), h: Math.round(root.scrollHeight), tree: walk(root, 0) }
})()`

const flow = process.argv[2]
if (!flow || !FLOWS[flow]) {
  console.log('flows:\n  ' + Object.keys(FLOWS).join('\n  '))
  process.exit(flow ? 1 : 0)
}

mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const screens = []
for (const [name, route, width, opts = {}] of FLOWS[flow]) {
  const c = await b.newContext({ viewport: { width, height: width < 500 ? 844 : 1000 } })
  const p = await c.newPage()
  await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort())
  if (opts.fresh) await fresh(p)
  // The lock is a screen in its own right, and the only way to get it is a
  // cold tab: seeded unlocked, every other screen would paint over it.
  else if (opts.locked) await locked(p, opts.security ?? {})
  else await seen(p, opts.prefs ?? {}, opts.security ?? {})
  await p.goto(B + route, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  const got = await p.evaluate(WALK)
  const trim = (n) => {
    if (n.svg) n.svg = tidy(n.svg)
    for (const k of n.kids ?? []) trim(k)
  }
  trim(got.tree)
  screens.push({ name, route, width, ...got })
  console.log(`  ${name.padEnd(34)} ${got.w}x${got.h}`)
  await c.close()
}
await b.close()

// The hex of every fill that is a token, named, so the builder binds rather
// than paints.
const file = new URL(flow.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase() + '.json', OUT)
writeFileSync(file, JSON.stringify({ flow, tokens: BY_HEX, screens }, null, 1))
console.log('wrote ' + file.pathname)
