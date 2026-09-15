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
import { seen } from './seen.mjs'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'

const B = 'http://localhost:4173/#'
const OUT = new URL('../figma/flows/', import.meta.url)

/* The nine flows, and the screens in each. Names are what the page in Figma is
   called and what the frame in it is called, so a person reading the file sees
   the same words the product uses. */
export const FLOWS = {
  'R1 Getting in': [
    ['Welcome · what this is', '/welcome/0', 1440, { fresh: true }],
    ['Welcome · what you hold', '/welcome/1', 1440, { fresh: true }],
    ['Welcome · when you can sell', '/welcome/2', 1440, { fresh: true }],
    ['Welcome · pick one', '/welcome/3', 1440, { fresh: true }],
    ['Sign in', '/signin', 1440, { fresh: true }],
  ],
  'R2 Home': [
    ['Home · simple', '/', 1440, { prefs: { homeView: 'simple' } }],
    ['Home · detailed', '/', 1440, { prefs: { homeView: 'detailed' } }],
    ['Home · phone', '/', 390],
  ],
  'R3 Browsing the market': [
    ['Invest', '/invest', 1440],
    ['Invest · phone', '/invest', 390],
    ['Company · Apple', '/invest/aapl', 1440],
    ['Company · a fund', '/invest/voo', 1440],
    ['Where people start', '/invest/list/starters', 1440],
    ['Your watchlist', '/invest/list/watchlist', 1440],
    ['Moving today', '/invest/list/movers', 1440],
    ['An index', '/invest/index/sp500', 1440],
    ['The bucket', '/bucket', 1440],
  ],
  'R4 Buying and selling': [
    ['Buy', '/invest/aapl/invest', 1440],
    ['Sell', '/invest/aapl/sell', 1440],
    ['Send shares · who', '/invest/aapl/send', 1440],
    ['Buy · phone', '/invest/aapl/invest', 390],
  ],
  'R5 Money in and out': [
    ['Wallet', '/wallet', 1440],
    ['Wallet · phone', '/wallet', 390],
    ['Add money · bank', '/addmoney/bank', 1440],
    ['Add money · Base', '/addmoney/base', 1440],
    ['Add money · card', '/addmoney/card', 1440],
    ['Send', '/send', 1440],
    ['Send · to a Tokkenly account', '/send/tokkenly', 1440],
    ['Send · to a bank', '/send/bank', 1440],
    ['The statement', '/statement', 1440],
  ],
  'R6 Borrow and Lend': [
    ['Borrow & Lend', '/grow', 1440],
    ['Borrow & Lend · phone', '/grow', 390],
    ['Lending', '/grow/lend', 1440],
    ['Borrowing', '/grow/borrow', 1440],
    ['Lend cash', '/grow/earn', 1440],
  ],
  'R7 Spending': [
    ['Spend', '/spend', 1440],
    ['Spend · phone', '/spend', 390],
    ['Airtime', '/spend/airtime', 1440],
    ['Electricity', '/spend/light', 1440],
  ],
  'R8 Activity and records': [
    ['Activity', '/activity', 1440],
    ['Activity · phone', '/activity', 390],
    ['Alerts', '/activity?filter=alerts', 1440],
  ],
  'R9 Account and settings': [
    ['Account', '/account', 1440],
    ['Preferences', '/account/preferences', 1440],
    ['Security', '/account/security', 1440],
    ['Payment methods', '/account/payments', 1440],
    ['Your wallet', '/account/wallet', 1440],
    ['Support', '/account/support', 1440],
    ['Risk and disclosures', '/disclosures', 1440],
    ['Everything', '/all', 1440],
  ],
}

/* The token behind a colour, so the builder can bind a variable rather than
   paint a hex. Built from the same snapshot figma.mjs checks. */
const snap = JSON.parse(readFileSync(new URL('../figma/tokens.json', import.meta.url), 'utf8'))
const BY_HEX = {}
for (const [fig, v] of Object.entries(snap.colour.vars)) BY_HEX[v.Dark.toLowerCase()] = fig

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

    // An svg that knows its own name is a component in Figma: record the name
    // and let the builder place an instance. One that does not — a chart, a
    // sparkline, a ruler, all of them generated per screen — goes in whole.
    if (el.tagName.toLowerCase() === 'svg') {
      const named = el.getAttribute('data-art') || el.getAttribute('data-ic')
      if (named) node.part = named
      else node.svg = el.outerHTML.length < 24000 ? el.outerHTML : null
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
  if (opts.fresh) {
    await p.addInitScript(`try { localStorage.removeItem('tokkenly.prefs.v1'); sessionStorage.setItem('tokkenly.unlocked','1') } catch {}`)
  } else {
    await seen(p, opts.prefs ?? {})
  }
  await p.goto(B + route, { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  const got = await p.evaluate(WALK)
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
