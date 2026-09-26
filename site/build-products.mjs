/* The six product pages, from the frames in Figma.
 *
 *  Each product in copy-products.mjs carries `sections`: an ordered list of
 *  bands, each one a type the KIT2 renderers below know how to draw, with the
 *  numbers its frame gives it. The shape of a page is data, so no two product
 *  pages have to be the same page with different words.
 *
 *  There used to be a second, older kit here too — a `spine` of section
 *  types drawn in the landing page’s bento vocabulary — which carried the
 *  pages while they were rebuilt from their frames one at a time. Every
 *  product has been rebuilt, so that kit and its data are gone; git history
 *  has them if they are ever wanted.
 *
 *  The output is committed. The site has no build step and serving it must
 *  not need one; this script only regenerates the files when the chrome, the
 *  kit or the copy changes.
 *
 *      node build-products.mjs            write the six pages
 *      node build-products.mjs --check    write nothing, fail if any is stale
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRODUCTS, APP_URL, SITE_URL } from './copy-products.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, 'products')
export { PRODUCTS }

/* Copy is written with the odd entity in it — &amp; and &#8212; and &#8358; —
   so escaping wholesale would double them. Only the characters that break
   markup, and only where they are not already an entity. */
const esc = (s) => String(s).replace(/&(?![a-z#][a-z0-9]*;)/gi, '&amp;').replace(/</g, '&lt;')
/* The same copy as text, for a <title> or a meta attribute: entities decoded
   to the characters they stand for, then only what an attribute cannot hold
   escaped again. The first version replaced every entity with a space, which
   is how the Gifting page came to be titled "Gifting Rewards". */
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', middot: '\u00b7', mdash: '\u2014', ndash: '\u2013', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201c', rdquo: '\u201d', hellip: '\u2026' }
export const decode = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (NAMED[e.toLowerCase()] ?? m))
export const plain = (s) => decode(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
export const attr = (s) => plain(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const ARROW = '<svg class="pr-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>'
/* The frames break several headlines by hand; a \n in the copy is that break. */
const lines2 = (s) => esc(s).split('\n').join('<br />')

/* The chip drawings. Same grid, same stroke and same 24-box as the four the
   landing page draws inline, so a chip on a product page and a chip on the
   landing page are the same object. */
const ICONS = {
  updown: 'M 8.5 4 L 8.5 15 M 8.5 15 L 5 11.5 M 8.5 15 L 12 11.5 M 16.5 20 L 16.5 9 M 16.5 9 L 13 12.5 M 16.5 9 L 20 12.5',
  down: 'M 12 4 L 12 14 M 12 14 L 8 10 M 12 14 L 16 10 M 5 16 L 5 19 L 19 19 L 19 16',
  search: 'M 10.5 4 A 6.5 6.5 0 1 0 10.5 17 A 6.5 6.5 0 1 0 10.5 4 M 15.4 15.4 L 20 20',
  book: 'M 6 4 L 18 4 L 18 20 L 6 20 Z M 9 9 L 15 9 M 9 13 L 15 13 M 9 17 L 13 17',
  receipt: 'M 7 5 L 17 5 L 17 20 L 14.5 18 L 12 20 L 9.5 18 L 7 20 Z M 10 9 L 14 9 M 10 13 L 14 13',
  clock: 'M 12 4 A 8 8 0 1 0 12 20 A 8 8 0 1 0 12 4 M 12 8 L 12 12 L 15 14',
  wallet: 'M 4 8 L 17 8 A 3 3 0 0 1 20 11 L 20 17 A 3 3 0 0 1 17 20 L 7 20 A 3 3 0 0 1 4 17 Z M 4 8 L 4 6.5 L 16 6.5 M 16 14 L 16.01 14',
  card: 'M 3.5 6 L 20.5 6 A 1.5 1.5 0 0 1 22 7.5 L 22 16.5 A 1.5 1.5 0 0 1 20.5 18 L 3.5 18 A 1.5 1.5 0 0 1 2 16.5 L 2 7.5 A 1.5 1.5 0 0 1 3.5 6 M 2 10 L 22 10 M 5.5 14.5 L 9 14.5',
  swap: 'M 4 8 L 17 8 M 17 8 L 13.5 4.5 M 17 8 L 13.5 11.5 M 20 16 L 7 16 M 7 16 L 10.5 12.5 M 7 16 L 10.5 19.5',
  back: 'M 5 9 L 5 4 M 5 9 L 10 9 M 5 9 A 8 8 0 1 1 5.6 15.5',
  split: 'M 12 4 L 12 20 M 4 8 L 20 8 M 7 8 L 4 14 A 3 3 0 0 0 10 14 Z M 17 8 L 14 14 A 3 3 0 0 0 20 14 Z',
  gift: 'M 4 10 L 20 10 L 20 20 L 4 20 Z M 4 10 L 4 7 L 20 7 L 20 10 M 12 7 L 12 20 M 12 7 A 2.6 2.6 0 1 0 8.5 7 M 12 7 A 2.6 2.6 0 1 1 15.5 7',
}
/* ---------------------------------------------------------------- images -- */
/* Every <img> the builders write gets its file's own width and height, read
   from the file, so the browser can hold the space before the picture
   arrives and nothing jumps when it does. Read, not typed: an image that is
   re-exported at another size cannot leave stale numbers behind. An <img>
   that already carries a width is left alone — some of those numbers are
   layout, set on purpose.

   The same pass adds a srcset where a smaller cut of the file exists, with
   the sizes it is laid out at: the full file for a wide screen at 2x, the
   smaller one for a phone. */
const SRCSET = {
  'about/cloud.webp': [['about/cloud-800.webp', 800], '(max-width: 1040px) 68vw, 44vw'],
  'cv/compare-portrait.webp': [['cv/compare-portrait-800.webp', 800], '(max-width: 1040px) 90vw, 52vw'],
  'ts/slab-fractions.webp': [['ts/slab-fractions-600.webp', 600], '(max-width: 1040px) 76vw, 30vw'],
}
const dims = new Map()
function sizeOf(rel) {
  if (dims.has(rel)) return dims.get(rel)
  const b = readFileSync(resolve(HERE, 'img', rel))
  let wh = null
  if (rel.endsWith('.svg')) {
    const t = b.toString('utf8')
    const w = t.match(/<svg[^>]*\swidth="([\d.]+)"/), h = t.match(/<svg[^>]*\sheight="([\d.]+)"/)
    const vb = t.match(/viewBox="[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)"/)
    wh = w && h ? [+w[1], +h[1]] : vb ? [+vb[1], +vb[2]] : null
  } else if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16)
    if (kind === 'VP8X') wh = [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]
    else if (kind === 'VP8 ') wh = [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]
    else if (kind === 'VP8L') { const n = b.readUInt32LE(21); wh = [(n & 0x3fff) + 1, ((n >>> 14) & 0x3fff) + 1] }
  }
  if (!wh) throw new Error('cannot read the size of img/' + rel)
  dims.set(rel, wh.map(Math.round))
  return dims.get(rel)
}
export function sized(html) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    const m = tag.match(/\ssrc="([^"]*?)img\/([^"]+)"/)
    if (!m) return tag
    const [, pre, rel] = m
    let out = tag
    if (!/\swidth="/.test(tag)) {
      const [w, h] = sizeOf(rel)
      out = out.replace(m[0], `${m[0]} width="${w}" height="${h}"`)
    }
    if (SRCSET[rel] && !/\ssrcset="/.test(tag)) {
      const [[small, sw], sizes] = SRCSET[rel]
      out = out.replace(m[0], `${m[0]} srcset="${pre}img/${small} ${sw}w, ${pre}img/${rel} ${sizeOf(rel)[0]}w" sizes="${sizes}"`)
    }
    return out
  })
}

/* ------------------------------------------------------------------ head -- */
/* Everything above the stylesheet that every page carries, written once so a
   page cannot forget its canonical address or its preview picture.

   Addresses are extensionless because vercel.json has cleanUrls on: a link to
   /about.html is answered with a 308 to /about, so writing the .html costs
   every click a round trip. The canonical and og:url are the same extensionless
   address, absolute, on SITE_URL. A page with no address of its own — the
   404, which answers at whatever was asked for — passes no path and gets
   neither.

   The latin-ext cut of Geist carries the naira sign and nothing else this site
   uses, so it is preloaded only on a page whose markup has a ₦ in it; the
   browser would fetch it anyway when the glyph is drawn, just later. */
const NAIRA = /&#8358;|₦/
export const pageUrl = (path) => SITE_URL + (path === '/' ? '/' : path)
export const head = ({ title, desc, path, image, up, noindex, body }) => `    <title>${attr(title)}</title>
    <meta name="description" content="${attr(desc)}" />
${noindex ? '    <meta name="robots" content="noindex" />\n' : ''}${path ? `    <link rel="canonical" href="${pageUrl(path)}" />\n` : ''}    <link rel="icon" href="${up}favicon.svg" />
    <meta property="og:site_name" content="Tokkenly" />
    <meta property="og:title" content="${attr(title)}" />
    <meta property="og:description" content="${attr(desc)}" />
    <meta property="og:type" content="website" />
${path ? `    <meta property="og:url" content="${pageUrl(path)}" />\n` : ''}    <meta property="og:image" content="${SITE_URL}/img/${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${SITE_URL}/img/${image}" />
    <link rel="preload" href="${up}fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin />
${NAIRA.test(body) ? `    <link rel="preload" href="${up}fonts/geist-latin-ext.woff2" as="font" type="font/woff2" crossorigin />\n` : ''}    <link rel="stylesheet" href="${up}styles.css" />`

/* ---------------------------------------------------------------- chrome -- */
/* The bar, the phone menu and the footer list the products in one order, the
   order PRODUCTS is written in, and by one name, `nav`. The landing page's
   hand-written copies of these follow the same list. */
export const nav = (up, current) => `
    <header class="nav" id="nav">
      <div class="nav-in">
        <a class="brand" href="/" aria-label="Tokkenly, home">
          <span class="brand-mark" aria-hidden="true">T</span>
          <span class="brand-word">Tokkenly</span>
        </a>

        <nav class="nav-links" aria-label="Primary">
          <div class="drop">
            <button class="drop-btn" type="button" aria-expanded="false" aria-controls="products-menu">
              Products
              <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
            </button>
            <div class="drop-menu" id="products-menu" hidden>
${PRODUCTS.map((p) => `              <a href="/products/${p.slug}"${p.slug === current ? ' aria-current="page"' : ''}>
                <span class="dm-name">${esc(p.nav)}</span>
                <span class="dm-say">${esc(p.title)}</span>
              </a>`).join('\n')}
            </div>
          </div>
          <a href="/about"${current === 'about' ? ' aria-current="page"' : ''}>About us</a>
          <a href="/blog"${current === 'blog' ? ' aria-current="page"' : ''}>Blog</a>
          <a href="/contact"${current === 'contact' ? ' aria-current="page"' : ''}>Help</a>
        </nav>

        <div class="nav-end">
          <a class="btn btn-mint btn-sm" href="${APP_URL}">Sign up</a>
          <button class="burger" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Menu">
            <span></span><span></span>
          </button>
        </div>
      </div>

      <div class="mobile-menu" id="mobile-menu" hidden>
        <p class="mm-head">Products</p>
${PRODUCTS.map((p) => `        <a href="/products/${p.slug}"${p.slug === current ? ' aria-current="page"' : ''}>${esc(p.nav)}</a>`).join('\n')}
        <p class="mm-head">Company</p>
        <a href="/about">About us</a>
        <a href="/blog">Blog</a>
        <a href="/contact">Help</a>
        <a class="btn btn-mint mm-cta" href="${APP_URL}">Sign up</a>
      </div>
    </header>`

/* Four columns, as the landing page copy lays them out: Products, Company,
   Support and Legal. Help used to sit under Legal, which it is not.

   The row of social icons is gone until the accounts exist. Three links to
   "#" were three tab stops that went nowhere; when there is a real profile,
   a <ul class="socials"> of plain links under the tagline is the whole job. */
export const footer = (up) => `
    <footer class="foot">
      <div class="wrap">
        <div class="foot-top">
          <div class="foot-brand">
            <a class="brand" href="/" aria-label="Tokkenly, home">
              <span class="brand-mark" aria-hidden="true">T</span>
              <span class="brand-word">Tokkenly</span>
            </a>
            <p>Your money, free to do more.</p>
          </div>

          <nav class="foot-cols" aria-label="Footer">
            <div class="foot-col foot-col-products">
              <p class="foot-head">Products</p>
              <div class="foot-split">
                <div>
${PRODUCTS.slice(0, Math.ceil(PRODUCTS.length / 2)).map((p) => `                  <a href="/products/${p.slug}">${esc(p.nav)}</a>`).join('\n')}
                </div>
                <div>
${PRODUCTS.slice(Math.ceil(PRODUCTS.length / 2)).map((p) => `                  <a href="/products/${p.slug}">${esc(p.nav)}</a>`).join('\n')}
                </div>
              </div>
            </div>
            <div class="foot-col">
              <p class="foot-head">Company</p>
              <a href="/about">About us</a>
              <a href="/blog">Blog</a>
            </div>
            <div class="foot-col">
              <p class="foot-head">Support</p>
              <a href="/contact">Help</a>
            </div>
            <div class="foot-col">
              <p class="foot-head">Legal</p>
              <a href="/terms">Terms of service</a>
              <a href="/privacy">Privacy policy</a>
            </div>
          </nav>
        </div>

        <div class="foot-end">
          <p class="foot-word" aria-hidden="true" data-word="Tokkenly"></p>
          <p class="risk">Investments and earning products involve risk. Returns are not guaranteed.</p>
        </div>
      </div>
    </footer>`


/* The close is the same on every product page, so it is one function that a
   page’s `pclose` section calls with its own spacing. */
const closingProd = (p, up, s) => `
      <section class="closing closing-prod${s && s.tall ? ' closing-prod-tall' : ''}" data-cta="product"${(s && (s.pad || s.h2)) ? ` style="${[
        s.pad ? `--cpad:min(${s.pad}px, ${(s.pad / 19.2).toFixed(3)}vw)` : '',
        s.h2 ? `--cfs:clamp(${Math.round(s.h2[0] * 0.5)}px, ${(s.h2[0] / 19.2).toFixed(3)}vw, ${s.h2[0]}px);--clh:${s.h2[1]}` : '',
      ].filter(Boolean).join(';')}"` : ''}>
        <div class="wrap">
          <div class="closing-slab reveal">
            <img class="cta-prop cta-coin n-tl" src="${up}img/cta/coin.webp" width="274" height="290" loading="lazy" alt="" aria-hidden="true" />
            <img class="cta-prop cta-pen n-bl" src="${up}img/ts/pen.webp" width="302" height="369" loading="lazy" alt="" aria-hidden="true" />
            <img class="cta-prop cta-notes n-r" src="${up}img/cta/notes.webp" width="593" height="593" loading="lazy" alt="" aria-hidden="true" />
            <div class="closing-in">
              <h2>${esc(p.close[0])}</h2>
              <p class="closing-lead">${esc(p.close[1])}</p>
              <a class="btn btn-deep" href="${APP_URL}">${esc(p.close[2] || 'Get started')}</a>
            </div>
          </div>
        </div>
      </section>`

/* ------------------------------------------------------- the second kit ---
   The frames in Section 1 redraw every product page, and these are their
   renderers: one per section type a page’s `sections` list can name.

   Everything here is measured off its frame at 1920. Where a number is a
   share of the column it is written as a percentage; where it is a share of
   the page's own height it is written as min(px, vw), because a section in
   code takes its height from its words and a percentage of that would slide
   the moment a line wrapped differently. */

/* The six products, as the sibling cards name them. The href is resolved
   once, here, so the rebuild can move a page without hunting through copy. */
/* The frame types these as glyphs rather than drawing them, so they are
   characters here too and inherit the line's colour. */
/* Art the hero draws in front of its words, and which the frame lets hang
   over the foot of the band rather than cutting at it. Everything else is
   behind the words and is cut. */
const FRONT_ART = new Set(['inset', 'coin'])

const CROSS2 = '&#10005;'
const TICK2 = '&#10003;'

/* The words are the frames': every sibling band across Section 1 writes the
   product in sentence case and the line under it the same way. */
const SIBS = {
  'tokenized-stocks':   ['Tokenized stocks', 'Invest in Nigerian and US companies from one app.', 'tokenized-stocks', 'search'],
  'gifting-and-rewards':['Gifting and rewards', 'Make their day, and start their portfolio.', 'gifting-and-rewards', 'gift'],
  'receive-and-send':   ['Receive and send', 'Get paid into Tokkenly, and send from the same place.', 'receive-and-send', 'updown'],
  'pay-bills':          ['Pay bills', 'Airtime, data and electricity from the balance you hold.', 'pay-bills', 'receipt'],
  'convert':            ['Convert', 'Move between naira and stablecoins without leaving the app.', 'convert', 'swap'],
  'borrow-and-earn':    ['Borrow and earn', 'Put stablecoins to work, or borrow against what you hold.', 'borrow-and-earn', 'split'],
}

/* The hero receipt: a white card the frame floats over the art, written out
   rather than screenshotted, the same way the landing page's panels are. */
const panel2 = (n) => `
        <div class="p2-pn${n.big ? ' p2-pn-lg' : ''}${n.pay ? ' p2-pn-pay' : ''}" style="left:${n.l}%;top:calc(${n.t} * var(--u));width:${n.w}%">
${n.swap ? `          <div class="p2-sw">
${n.swap.map(([k, v, tag]) => `            <div class="p2-sw-f"><span class="p2-sw-l"><i>${esc(k)}</i><b>${v}</b></span><span class="p2-sw-t">${esc(tag)}</span></div>`).join('\n')}
          </div>` : ''}
${n.head ? `          <div class="p2-pn-head"><span>${esc(n.head[0])}</span><b>${esc(n.head[1])}</b></div>` : ''}
${n.pairs ? `          <div class="p2-pn-rows">
${n.pairs.map(([k, v]) => `            <div class="p2-pn-row"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
          </div>` : ''}
${n.stack ? `          <div class="p2-pn-rows p2-pn-stack">
${n.stack.map(([k, v]) => `            <div class="p2-rrow"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
          </div>` : ''}
${n.note ? `          <p class="p2-pn-note">${esc(n.note)}</p>` : ''}
          <span class="p2-pn-btn${n.pay ? ' p2-pn-btn-deep' : ''}">${n.btn}</span>
        </div>`

/* The panels on Borrow and earn: the same card, placed on a stage or inside
   a half, with either a grid of pairs, a stack of rows, or a split bar. */
const bePanel = (n, cls) => `
            <div class="be-pn${cls ? ' ' + cls : ''}${n.spread ? ' be-pn-spread' : ''}"${cls ? '' : ` style="left:${n.l}%;top:${n.t}%;width:${n.w}%"`} aria-hidden="true">
              <div class="be-pn-head"><span>${esc(n.head[0])}</span><b>${n.head[1]}</b></div>
${n.pairs ? `              <div class="be-pn-pairs">
${n.pairs.map(([k, v]) => `                <div class="be-kv"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
              </div>` : ''}
${n.stack ? `              <div class="be-pn-rows">
${n.stack.map(([k, v]) => `                <div class="p2-rrow"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
              </div>` : ''}
${n.bar ? `              <div class="be-track">
${n.bar.map(([, w], i) => `                <i class="be-seg-${i}" style="--w:${w}%"></i>`).join('\n')}
              </div>
              <div class="be-legend">
${n.bar.map(([k], i) => `                <span class="be-li"><i class="be-dot-${i}"></i>${esc(k)}</span>`).join('\n')}
              </div>` : ''}
              <p class="be-pn-note">${esc(n.note)}</p>
${n.btn ? `              <span class="be-pn-btn">${esc(n.btn)}</span>` : ''}
            </div>`

/* The white card that bleeds out of a gradient side: a head, a list of three
   routes, and the line under them. Same object on both sides of the band. */
const sidePanel = (n) => `
            <div class="p2-sp" style="left:${n.l}%;top:${n.t}%;width:${n.w}%" aria-hidden="true">
              <div class="p2-sp-head"><span>${esc(n.head[0])}</span><b>${esc(n.head[1])}</b></div>
              <div class="p2-sp-list">
${n.list.map(([badge, name, sub, val]) => `                <div class="p2-frow">
                  <span class="p2-badge p2-badge-lg">${esc(badge)}</span>
                  <span class="p2-fmid"><b>${esc(name)}</b><i>${esc(sub)}</i></span>
                  <span class="p2-fval">${esc(val)}</span>
                </div>`).join('\n')}
              </div>
              <p class="p2-sp-note">${esc(n.note)}</p>
            </div>`

const KIT2 = {
  /* The frame's hero: one centred column of words on a radial wash, with the
     coins laid across the whole band behind them. Nothing in it is lazy, and
     the picture that is the page's largest paint — a portrait behind the
     words, or the masked photograph — is fetched ahead of the rest. */
  phero: (p, s, up) => `
      <section class="p2-hero${s.align === 'left' ? ' p2-hero-left' : ''}${s.align === 'mid' ? ' p2-hero-mid' : ''}" style="${[
        s.height ? `--hh:${s.height}vw;--hhp:${(s.height * 19.2).toFixed(0)}px` : '',
        s.padTop ? `--hpt:min(${s.padTop}px, ${(s.padTop / 19.2).toFixed(3)}vw)` : '',
        s.padBot ? `--hpb:min(${s.padBot}px, ${(s.padBot / 19.2).toFixed(3)}vw)` : '',
        s.leadLh ? `--hll:${s.leadLh}` : '',
        s.hW ? `--hw:min(${(s.hW * 15.2).toFixed(0)}px, ${s.hW}%)` : '',
        s.leadW ? `--hlw:min(${(s.leadW * 15.2).toFixed(0)}px, ${s.leadW}%)` : '',
        s.hSize ? `--hfs:clamp(${Math.round(s.hSize[0] * 0.4)}px, ${(s.hSize[0] / 19.2).toFixed(3)}vw, ${s.hSize[0]}px);--hflh:${s.hSize[1]}` : '',
        s.gaps ? `--hg1:min(${s.gaps[0]}px, ${(s.gaps[0] / 19.2).toFixed(3)}vw);--hg3:min(${s.gaps[1] - s.gaps[0]}px, ${((s.gaps[1] - s.gaps[0]) / 19.2).toFixed(3)}vw)` : '',
      ].filter(Boolean).join(';')}">
        <div class="p2-hero-clip" aria-hidden="true">
${s.wash ? `          <div class="p2-wash"
               style="--w: ${typeof s.wash === 'string' ? s.wash : `radial-gradient(118% 92% at 50% -2%, ${s.wash.join(', ')})`}${s.washH ? `;--wh:min(${(s.washH * 19.2).toFixed(0)}px, ${s.washH}vw)` : ''}"></div>` : ''}
          <div class="p2-hero-art">
${s.mask ? `            <span class="p2-mask" style="left:${s.mask.l}%;top:calc(${s.mask.t} * var(--u));width:${s.mask.w}%;aspect-ratio:${s.mask.w} / ${s.mask.h}"><img src="${up}img/${s.mask.src}" alt="" fetchpriority="high" /></span>` : ''}
${s.coins ? `            <div class="p2-coins">
${s.coins.map(([name, w, d, fx, sl, st, sw]) => `              <span class="p2-coin${fx ? ' p2-coin-fx' : ''}" style="--b:${w}%;--d:${d}s;--sl:${sl}%;--st:calc(${st} * var(--u));--sw:${sw}%"><img src="${up}img/ts/coin-${name}.webp" alt="" /></span>`).join('\n')}
            </div>` : ''}
${(s.art || []).filter(([kind]) => !FRONT_ART.has(kind)).map(([kind, src, l, t, w]) => `            <img class="p2-art p2-art-${kind}" src="${up}img/${src}" style="left:${l}%;top:calc(${t} * var(--u));width:${w}%" alt=""${kind === 'photo' ? ' fetchpriority="high"' : ''} />`).join('\n')}
          </div>
        </div>
        <div class="wrap p2-hero-in">
${s.eyebrow ? `          <p class="eyebrow hero-intro" style="--hero-d: 0s">${esc(s.eyebrow)}</p>` : ''}
${s.pill ? `          <span class="p2-pill${s.caps ? ' p2-pill-caps' : ''} hero-intro" style="--hero-d: 0s">${esc(s.pill)}</span>` : ''}
          <h1 class="hero-intro" style="--hero-d: 0.05s">${lines2(s.h)}</h1>
          <p class="p2-hero-lead hero-intro" style="--hero-d: 0.1s">${lines2(s.lead)}</p>
          <div class="cta-row${s.align === 'left' ? '' : ' centred'} hero-intro" style="--hero-d: 0.2s">
${s.ctas.map(([label, tone, href]) => `            <a class="btn btn-${tone}" href="${href || APP_URL}">${esc(label)}</a>`).join('\n')}
          </div>
        </div>
${((s.art || []).some(([kind]) => FRONT_ART.has(kind)) || s.panel) ? `        <div class="p2-hero-art p2-hero-front" aria-hidden="true">
${(s.art || []).filter(([kind]) => FRONT_ART.has(kind)).map(([kind, src, l, t, w]) => `          <img class="p2-art p2-art-${kind}" src="${up}img/${src}" style="left:${l}%;top:calc(${t} * var(--u));width:${w}%" alt="" />`).join('\n')}
${s.panel ? panel2(s.panel) : ''}
        </div>` : ''}
      </section>`,

  /* Three 485 cards on the 1520, each a gradient with a white fragment of the
     product sitting in it. The third card puts its words under the fragment
     rather than over it, which is the only variation the frame draws. */
  cards3: (p, s, up) => `
      <section class="band p2-cards">
        <div class="wrap">
          <div class="p2-head${s.centred ? ' p2-head-mid' : ''} reveal">
            <h2>${esc(s.h)}</h2>
            <p>${esc(s.lead)}</p>
          </div>
          <div class="p2-card-row" style="--cols:${s.cols || 3}">
${s.cards.map((c) => `            <article class="p2-card${c.foot ? ' p2-card-foot' : ''}${c.big ? ' p2-card-big' : ''} reveal" style="--grad: linear-gradient(to bottom, ${c.grad.join(', ')})">
              <div class="p2-card-copy">
                <h3>${esc(c.h)}</h3>
                <p>${esc(c.p)}</p>
              </div>
${c.list ? `              <div class="p2-frag">
${c.list.map(([badge, name, sub, val]) => `                <div class="p2-frow">
                  <span class="p2-badge">${esc(badge)}</span>
                  <span class="p2-fmid"><b>${esc(name)}</b><i>${sub}</i></span>
                  <span class="p2-fval">${val}</span>
                </div>`).join('\n')}
              </div>` : ''}
${c.gift ? `              <div class="p2-stack">
                <span class="p2-ghost p2-ghost-g1" aria-hidden="true"></span>
                <span class="p2-ghost p2-ghost-g2" aria-hidden="true"></span>
                <div class="p2-frag p2-frag-gift">
                  <div class="p2-frow">
                    <span class="p2-badge p2-badge-lg">${esc(c.gift.badge)}</span>
                    <span class="p2-fmid"><b>${esc(c.gift.name)}</b><i>${c.gift.sub}</i></span>
                  </div>
                  <p class="p2-quote">${esc(c.gift.note)}</p>
                </div>
              </div>` : ''}
${c.rules ? `              <div class="p2-frag p2-frag-rules">
                <div class="p2-fhead"><span>${esc(c.rules.k)}</span><b>${esc(c.rules.v)}</b></div>
${c.rules.rows.map(([k, v]) => `                <div class="p2-rrow"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
              </div>` : ''}
${c.stack ? `              <div class="p2-stack">
                <span class="p2-ghost p2-ghost-1" aria-hidden="true"></span>
                <span class="p2-ghost p2-ghost-2" aria-hidden="true"></span>
                <div class="p2-frag p2-frag-lg">
${c.stack.rows.map(([k, v]) => `                  <div class="p2-srow"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
                  <p class="p2-snote">${esc(c.stack.note)}</p>
                </div>
              </div>` : ''}
            </article>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* 750 of words and a 660 slot, 110 apart, with the slot on the right in
     the a row and on the left in the b row. */
  prow: (p, s, up) => `
      <section class="band p2-row p2-row-${s.side}">
        <div class="wrap p2-row-in">
          <div class="p2-row-copy reveal">
            <span class="p2-pill">${esc(s.pill)}</span>
            <h2>${lines2(s.h)}</h2>
            <p>${esc(s.p)}</p>
            <a class="btn btn-mint" href="${APP_URL}">${esc(s.btn)}</a>
          </div>
          <div class="p2-slot reveal" style="--grad: linear-gradient(to bottom, ${s.slot.grad.join(', ')})">
${s.slot.photo ? `            <img class="p2-slot-photo" src="${up}img/${s.slot.photo}" alt="" aria-hidden="true" loading="lazy" />` : ''}
${(s.slot.chips || []).map(([name, sub, l, t, w]) => `            <span class="p2-chip" style="left:${l}%;top:${t}%;width:${w}%"><b>${esc(name)}</b><i>${esc(sub)}</i></span>`).join('\n')}
${s.slot.prop ? `            <img class="p2-slot-prop" src="${up}img/${s.slot.prop[0]}" style="left:${s.slot.prop[1]}%;top:${s.slot.prop[2]}%;width:${s.slot.prop[3]}%" alt="" aria-hidden="true" loading="lazy" />` : ''}
${s.slot.slab ? `            <img class="p2-slot-slab" src="${up}img/${s.slot.slab[0]}" style="left:${s.slot.slab[1]}%;top:${s.slot.slab[2]}%;width:${s.slot.slab[3]}%" alt="" aria-hidden="true" loading="lazy" />
            <svg class="p2-slot-bracket" viewBox="0 0 374 266" aria-hidden="true" preserveAspectRatio="none"><path d="M373.5 80V25a25 25 0 0 0-25-25H25A25 25 0 0 0 0 25v240.5" /></svg>` : ''}
          </div>
        </div>
      </section>`,

  /* The head holds the left 656 and the questions the right 800, which is the
     landing page's FAQ turned into a product band. */
  pfaq: (p, s, up) => `
      <section class="band p2-faq${s.loose ? ' p2-faq-loose' : ''}"${(s.pad || s.cols || s.h2) ? ` style="${[
        s.pad ? `--spt:min(${s.pad[0]}px, ${(s.pad[0] / 19.2).toFixed(3)}vw);--spb:min(${s.pad[1]}px, ${(s.pad[1] / 19.2).toFixed(3)}vw)` : '',
        s.cols ? `--fc1:${s.cols[0]}%;--fc2:${s.cols[1]}%;--fcg:${s.cols[2]}%` : '',
        s.h2 ? `--fh:clamp(${Math.round(s.h2[0] * 0.5)}px, ${(s.h2[0] / 19.2).toFixed(3)}vw, ${s.h2[0]}px);--flh:${s.h2[1]}` : '',
      ].filter(Boolean).join(';')}"` : ''}>
        <div class="wrap faq-in">
          <div class="head faq-head reveal">
${s.eyebrow ? `            <p class="eyebrow">${esc(s.eyebrow)}</p>` : ''}
            <h2>${esc(s.h)}</h2>
          </div>
          <div class="faq reveal">
${s.items.map(([q, a]) => `            <details>
              <summary><span>${esc(q)}</span><span class="plus" aria-hidden="true"></span></summary>
              <div class="answer"><p>${esc(a)}</p></div>
            </details>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Three sand cards, the other products this one sits beside. */
  siblings: (p, s, up) => `
      <section class="band p2-sibs${s.badge === 'letter' ? ' p2-sibs-letter' : ''}${s.divided ? ' p2-sibs-div' : ''}" style="${[
        s.hSize ? `--sh:${s.hSize[0] || s.hSize}px${s.hSize[1] ? `;--slh:${s.hSize[1]}` : ''}` : '',
        s.pad ? `--spt:min(${s.pad[0]}px, ${(s.pad[0] / 19.2).toFixed(3)}vw);--spb:min(${s.pad[1]}px, ${(s.pad[1] / 19.2).toFixed(3)}vw)` : '',
        s.gap ? `--sg:min(${s.gap}px, ${(s.gap / 19.2).toFixed(3)}vw)` : '',
        s.cardGap ? `--scg:min(${s.cardGap}px, ${(s.cardGap / 15.2).toFixed(3)}%)` : '',
        s.cardH ? `--sch:min(${s.cardH}px, ${(s.cardH / 19.2).toFixed(3)}vw)` : '',
      ].filter(Boolean).join(';')}">
        <div class="wrap">
          <div class="p2-head reveal">
${s.eyebrow ? `            <p class="eyebrow">${esc(s.eyebrow)}</p>` : ''}
            <h2>${lines2(s.h)}</h2>
          </div>
          <div class="prod-more">
${s.cards.map((c) => {
    /* A page may name a product and take the shared words, or write the card
       out itself: the frames do both, and two of them use a letter where the
       others use an icon. */
    const [href, badge, title, sub, link] = Array.isArray(c) ? c : [SIBS[c][2], SIBS[c][3], SIBS[c][0], SIBS[c][1], 'Explore ' + SIBS[c][0]]
    return `            <article class="prod-card reveal">
              <div class="pr-title">
                <span class="pr-chip" aria-hidden="true">${s.badge === 'letter' ? esc(title.replace(/[^A-Za-z]/g, '')[0]) : `<svg viewBox="0 0 24 24"><path d="${ICONS[badge]}" /></svg>`}</span>
                <h3>${title}</h3>
                <p>${esc(sub)}</p>
              </div>
              <a class="pr-link" href="/products/${href}">${esc(link)} ${ARROW}</a>
            </article>`
  }).join('\n')}
          </div>
        </div>
      </section>`,

  /* 660 of words beside a 660 photograph, 200 apart, both centred. */
  psplit: (p, s, up) => `
      <section class="band p2-split p2-split-${s.side}"${(s.h2 || s.gaps) ? ` style="${[
        s.h2 ? `--sh:clamp(${Math.round(s.h2[0] * 0.441)}px, ${(s.h2[0] / 19.2).toFixed(3)}vw, ${s.h2[0]}px);--slh:${s.h2[1]}` : '',
        s.gaps ? `--sgp:max(${s.gaps[0]}px, ${(s.gaps[0] / 19.2).toFixed(3)}vw);--sgb:max(${s.gaps[1]}px, ${(s.gaps[1] / 19.2).toFixed(3)}vw)` : '',
      ].filter(Boolean).join(';')}"` : ''}>
        <div class="wrap p2-split-in"${s.cols ? ` style="--c1:${s.cols[0]}%;--c2:${s.cols[1]}%;--cg:${s.cols[2]}%"` : ''}>
          <div class="p2-split-copy reveal">
${s.pill ? `            <span class="p2-pill${s.caps ? ' p2-pill-caps' : ''}">${esc(s.pill)}</span>` : ''}
            <h2>${lines2(s.h)}</h2>
            <p>${esc(s.p)}</p>
${s.btn ? `            <a class="btn btn-mint" href="${APP_URL}">${esc(s.btn)}</a>` : ''}
          </div>
${s.photo ? `          <img class="p2-split-photo reveal" src="${up}img/${s.photo}" style="aspect-ratio:${s.ratio}" alt="" aria-hidden="true" loading="lazy" />` : ''}
${s.stage ? `          <div class="p2-stage reveal" style="aspect-ratio:${s.stage.ratio}">
            <img class="p2-stage-photo" src="${up}img/${s.stage.photo}" alt="" aria-hidden="true" loading="lazy" />
            <div class="p2-pn p2-pn-flat${s.stage.panel.pay ? ' p2-pn-pay' : ''}" style="left:${s.stage.panel.l}%;top:${s.stage.panel.t}%;width:${s.stage.panel.w}%" aria-hidden="true">
              <div class="p2-pn-head"><span>${esc(s.stage.panel.head[0])}</span><b>${s.stage.panel.head[1]}</b></div>
              <div class="p2-pn-rows p2-pn-stack">
${s.stage.panel.rows.map(([k, v]) => `                <div class="p2-rrow"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
              </div>
              <p class="p2-pn-note">${esc(s.stage.panel.note)}</p>
            </div>
          </div>` : ''}
        </div>
      </section>`,

  /* Three numbered steps: a gradient card holding a fragment, then the number,
     the heading and a line under it. */
  steps3: (p, s, up) => `
      <section class="band p2-steps">
        <div class="wrap">
          <h2 class="p2-steps-h reveal">${lines2(s.h)}</h2>
          <div class="p2-steps-row">
${s.steps.map((st, i) => `            <div class="p2-step reveal">
              <div class="p2-step-card" style="--grad: linear-gradient(to bottom, ${st.grad.join(', ')})">
                <div class="p2-frag p2-frag-step">
                  <div class="p2-fhead"><span>${esc(st.frag.k)}</span><b>${esc(st.frag.v)}</b></div>
${st.frag.rows.map(([k, v]) => `                  <div class="p2-rrow"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
                </div>
              </div>
              <div class="p2-step-t">
                <div class="p2-step-top"><span class="p2-num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(st.h)}</h3></div>
                <p>${esc(st.p)}</p>
              </div>
            </div>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Money in and money out: a centred head, then two 744 gradients with a
     white panel bleeding out of each — up and left on one, down and right on
     the other, which is what stops the pair reading as one object twice. */
  twoside: (p, s, up) => `
      <section class="band p2-two">
        <div class="wrap">
          <div class="p2-head p2-head-mid p2-two-head reveal">
            <h2>${lines2(s.h)}</h2>
            <p>${esc(s.lead)}</p>
            <a class="btn btn-mint" href="${APP_URL}">${esc(s.btn)}</a>
          </div>
          <div class="p2-two-row">
${s.cards.map((c) => `            <article class="p2-side${c.foot ? ' p2-side-foot' : ''} reveal" style="--grad: linear-gradient(to bottom, ${c.grad.join(', ')})">
              <div class="p2-side-copy">
                <span class="p2-pill">${esc(c.pill)}</span>
                <h3>${esc(c.h)}</h3>
                <p>${esc(c.p)}</p>
              </div>
${sidePanel(c.panel)}
            </article>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* The dark band: a head with its button out to the right, then two rows of
     a wide card and a narrow one, swapping sides. */
  intransit: (p, s, up) => `
      <section class="band p2-transit">
        <div class="wrap">
          <div class="p2-transit-head reveal">
            <div>
              <h2>${lines2(s.h)}</h2>
              <p>${esc(s.lead)}</p>
            </div>
            <a class="btn btn-mint" href="${APP_URL}">${esc(s.btn)}</a>
          </div>
${s.rows.map((row) => `          <div class="p2-transit-row">
${row.map((c) => `            <article class="p2-tcard${c.wide ? ' p2-tcard-wide' : ''}${c.tight ? ' p2-tcard-tight' : ''} reveal" style="--grad: ${c.grad ? `linear-gradient(to bottom, ${c.grad.join(', ')})` : c.bg}">
${c.art ? `              <img class="p2-tcard-art" src="${up}img/${c.art.src}" alt="" aria-hidden="true" loading="lazy"
                   style="left:${c.art.l}%;top:${c.art.t}%;width:${c.art.w}%;aspect-ratio:${c.art.ar[0]} / ${c.art.ar[1]}" />` : ''}
${c.mini ? `              <div class="p2-mini${c.mini.tone === 'tan' ? ' p2-mini-tan' : ''}" style="--ml:${c.mini.l}%;--mt:${c.mini.t}%;--mw:${c.mini.w}%;--mh:${c.mini.h}%">
${c.mini.rows.map(([k, v]) => `                <div class="p2-rrow"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('\n')}
              </div>` : ''}
              <div class="p2-tcard-t${c.textAt ? ' p2-tcard-t-at' : ''}"${c.textAt ? ` style="--tl:${c.textAt.l}%;--tt:${c.textAt.t}%;--tw:${c.textAt.w}%"` : ''}>
                <h3>${esc(c.h)}</h3>
                <p>${esc(c.p)}</p>
              </div>
${c.cursor ? `              <img class="p2-tcard-cur" src="${up}img/rs/cursor.svg" alt="" aria-hidden="true"
                   style="left:${c.cursor.l}%;top:${c.cursor.t}%;width:${c.cursor.w}%" />` : ''}
            </article>`).join('\n')}
          </div>`).join('\n')}
        </div>
      </section>`,

  /* Three 488 tiles, each a gradient with a white fragment placed by its own
     left and width: the frame does not centre them, it nudges each one. */
  tiles3: (p, s, up) => `
      <section class="band p2-tiles">
        <div class="wrap">
          <div class="p2-head p2-tiles-head reveal">
            <h2>${esc(s.h)}</h2>
            <p>${esc(s.lead)}</p>
            <a class="btn btn-mint" href="${APP_URL}">${esc(s.btn)}</a>
          </div>
          <div class="p2-tiles-row">
${s.tiles.map((t) => `            <article class="p2-tile reveal" style="--grad: linear-gradient(to bottom, ${t.grad.join(', ')})">
              <div class="p2-tile-t">
                <h3>${esc(t.h)}</h3>
                <p>${esc(t.p)}</p>
              </div>
              <div class="p2-frag p2-frag-tile" style="left:${t.l}%;width:${t.w}%">
                <div class="p2-fhead"><span>${esc(t.frag.k)}</span><b>${t.frag.v}</b></div>
${t.frag.rows.map(([k, v]) => `                <div class="p2-rrow"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
              </div>
            </article>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Convert's two ways of doing it: a portrait on a mauve stage with a card
     either side of it, offset so they read as a before and an after, and the
     receipt fragment sitting between them. */
  cmp2: (p, s, up) => `
      <section class="band cv-cmp">
        <div class="wrap">
          <div class="head cv-cmp-head reveal">
            <h2>${lines2(s.h)}</h2>
            <p>${esc(s.lead)}</p>
          </div>
          <div class="cv-stage reveal">
            <!-- Not lazy: on a tablet or a phone this band starts inside the
                 first screen, and a lazy image there waits for layout before
                 it is even asked for. -->
            <img class="cv-stage-photo" src="${up}img/${s.photo}" alt="" aria-hidden="true" decoding="async" />
${[['a', s.a, CROSS2], ['b', s.b, TICK2]].map(([k, side, mark]) => `            <div class="cv-side cv-side-${k}">
              <span class="p2-pill p2-pill-caps">${esc(side.pill)}</span>
              <ul>
${side.items.map((x) => `                <li><i aria-hidden="true">${mark}</i>${esc(x)}</li>`).join('\n')}
              </ul>
            </div>`).join('\n')}
            <div class="p2-frag cv-frag" aria-hidden="true">
              <div class="p2-fhead"><span>${esc(s.frag.k)}</span><b>${s.frag.v}</b></div>
${s.frag.rows.map(([k, v]) => `              <div class="p2-rrow"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
            </div>
          </div>
          <div class="cta-row centred"><a class="btn btn-mint" href="${APP_URL}">${esc(s.btn)}</a></div>
        </div>
      </section>`,

  /* The balances slab: a photograph with the split of what you hold drawn on
     it, the words beside it, and the coin falling off the bottom corner. */
  cvband: (p, s, up) => `
      <section class="band cv-band">
        <div class="wrap cv-band-in">
          <div class="cv-slab reveal">
            <img class="cv-slab-photo" src="${up}img/cv/band-photo.webp" alt="" aria-hidden="true" loading="lazy" />
            <div class="cv-pn" aria-hidden="true">
              <div class="cv-pn-head"><span>${esc(s.panel.head[0])}</span><b>${s.panel.head[1]}</b></div>
              <div class="cv-pn-bar">
                <div class="cv-track">
${s.panel.bar.map(([, , w]) => `                  <i style="--w:${w}%"></i>`).join('\n')}
                </div>
                <div class="cv-keys">
${s.panel.bar.map(([k, v]) => `                  <div class="cv-key"><span>${esc(k)}</span><b>${v}</b></div>`).join('\n')}
                </div>
              </div>
              <p class="cv-pn-note">${esc(s.panel.note)}</p>
            </div>
            <img class="cv-slab-coin" src="${up}img/cta/coin.webp" alt="" aria-hidden="true" loading="lazy" />
          </div>
          <div class="cv-text reveal">
            <p class="eyebrow">${esc(s.eyebrow)}</p>
            <h2>${lines2(s.h)}</h2>
            <p class="cv-lead">${s.lead}</p>
            <div class="cv-points">
${s.points.map(([h, t]) => `              <div class="cv-point">
                <h3>${esc(h)}</h3>
                <p>${esc(t)}</p>
              </div>`).join('\n')}
            </div>
            <a class="btn btn-mint" href="${APP_URL}">${esc(s.btn)}</a>
          </div>
        </div>
      </section>`,

  pclose: (p, s, up) => closingProd(p, up, s),

  /* Borrow and earn's hero: the words over the landing page's wash, then a
     stage carrying both panels with the cloud between them. */
  behero: (p, s, up) => `
      <section class="p2-hero p2-hero-mid be-hero" style="${[
        `--hh:${s.height}vw;--hhp:${(s.height * 19.2).toFixed(0)}px`,
        s.padTop ? `--hpt:min(${s.padTop}px, ${(s.padTop / 19.2).toFixed(3)}vw)` : '',
        s.hW ? `--hw:min(${(s.hW * 15.2).toFixed(0)}px, ${s.hW}%)` : '',
        s.gaps ? `--hg1:min(${s.gaps[0]}px, ${(s.gaps[0] / 19.2).toFixed(3)}vw);--hg3:min(${s.gaps[1] - s.gaps[0]}px, ${((s.gaps[1] - s.gaps[0]) / 19.2).toFixed(3)}vw)` : '',
      ].filter(Boolean).join(';')}">
        <div class="p2-wash" aria-hidden="true"
             style="--w: radial-gradient(118% 92% at 50% -2%, ${s.wash.join(', ')});--wh:min(${(s.washH * 19.2).toFixed(0)}px, ${s.washH}vw)"></div>
        <div class="wrap p2-hero-in">
          <p class="eyebrow hero-intro" style="--hero-d: 0s">${esc(s.eyebrow)}</p>
          <h1 class="hero-intro" style="--hero-d: 0.05s">${lines2(s.h)}</h1>
          <p class="p2-hero-lead hero-intro" style="--hero-d: 0.1s">${lines2(s.lead)}</p>
          <div class="cta-row centred hero-intro" style="--hero-d: 0.2s">
${s.ctas.map(([label, tone, href]) => `            <a class="btn btn-${tone}" href="${href || APP_URL}">${esc(label)}</a>`).join('\n')}
          </div>
        </div>
        <div class="wrap be-stage-wrap" style="--st:${s.stage.top}vw">
          <div class="be-stage reveal">
            <img class="be-cloud" src="${up}img/be/cloud.webp" alt="" aria-hidden="true"
                 style="left:${s.stage.cloud.l}%;top:${s.stage.cloud.t}%;width:${s.stage.cloud.w}%;height:${s.stage.cloud.h}%" />
${s.stage.panels.map((n) => bePanel(n)).join('\n')}
          </div>
        </div>
      </section>`,

  /* Two cards side by side, the second dropped 144 so they read as a pair
     rather than a row, each with its own panel. */
  halves: (p, s, up) => `
      <section class="band be-halves">
        <img class="be-halves-cloud" src="${up}img/be/cloud.webp" alt="" aria-hidden="true" loading="lazy" />
        <div class="wrap">
          <div class="head be-halves-head reveal">
            <h2>${esc(s.h)}</h2>
            <p>${esc(s.lead)}</p>
          </div>
          <div class="be-halves-row">
${s.sides.map((n) => `            <div class="be-half${n.low ? ' be-half-low' : ''} reveal">
              <div class="be-half-card" style="--grad: linear-gradient(to bottom, ${n.grad.join(', ')})">
                <div class="be-half-copy">
                  <span class="p2-pill p2-pill-caps">${esc(n.pill)}</span>
                  <h3>${esc(n.h)}</h3>
                  <p>${esc(n.p)}</p>
                  <a class="btn btn-${n.btn[1]}" href="${APP_URL}">${esc(n.btn[0])}</a>
                </div>
${bePanel(n.panel, 'be-half-pn')}
              </div>
            </div>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Three steps, each a tall card with the number and the line under it, and
     a rule between the columns. */
  besteps: (p, s, up) => `
      <section class="band be-steps">
        <div class="wrap">
          <h2 class="be-steps-h reveal">${esc(s.h)}</h2>
          <div class="be-steps-row">
${s.steps.map((n) => `            <article class="be-step reveal">
              <span class="be-step-art" style="--fill:${n.fill}" aria-hidden="true">
                <span class="p2-frag be-step-frag">
                  <span class="p2-fhead"><span>${esc(n.frag.k)}</span><b>${n.frag.v}</b></span>
${n.frag.rows.map(([k, v]) => `                  <span class="p2-rrow"><span>${esc(k)}</span><b>${v}</b></span>`).join('\n')}
                </span>
              </span>
              <span class="be-step-n" aria-hidden="true">${n.n}</span>
              <h3>${esc(n.h)}</h3>
              <p>${esc(n.p)}</p>
            </article>`).join('\n')}
          </div>
        </div>
      </section>`,
}

/* ----------------------------------------------------------------- page -- */
/* Every band carries an id, s-<name>, so another page can point into it: the
   contact page links straight to two products' questions. The name is the
   band's `id` if the copy gives it one, else a readable name for its type,
   numbered from the second time a page uses the same one.

   The hero's "See how it works" goes to #more, which is the point just after
   the hero, whatever band happens to come next. */
const ANCHOR = { phero: 'hero', behero: 'hero', pfaq: 'faq', pclose: 'close', steps3: 'steps', besteps: 'steps', cards3: 'cards', tiles3: 'tiles', prow: 'row', psplit: 'split', twoside: 'sides', intransit: 'transit', cmp2: 'compare', cvband: 'balances' }
function bands(p, up) {
  const seen = {}
  return p.sections.map((s, i) => {
    let key = s.id || ANCHOR[s.type] || s.type
    seen[key] = (seen[key] || 0) + 1
    if (seen[key] > 1) key += '-' + seen[key]
    const html = KIT2[s.type](p, s, up).replace('<section ', `<section id="s-${key}" `)
    return i === 0 ? html + '\n      <span id="more"></span>' : html
  }).join('\n')
}

function page(p) {
  const up = '../'
  const body = bands(p, up)
  return sized(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${head({ title: `${plain(p.nav)} — Tokkenly`, desc: p.lead, path: `/products/${p.slug}`, image: p.image, up, body })}
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
${nav(up, p.slug)}

    <main id="main">
      <span id="top"></span>
${body}
    </main>
${footer(up)}

    <script src="${up}site.js"></script>
  </body>
</html>
`)
}

/* build-pages.mjs imports nav and footer from here, so writing on import would
   rebuild the product pages every time that runs. Only write when this file is
   the thing being run. */
/* `--check` writes nothing and reports any committed page this script would
   not produce.

   These pages are generated AND committed, which is a trap with a name: an
   edit made to one of them by hand survives exactly until the next person
   runs the builder. That has already happened — a fix for the closing slab
   was written into all eight files, and a regeneration one commit later, made
   for an unrelated footer link, took it back out. Nothing complained, because
   nothing was watching. This is what watches. */
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const check = process.argv.includes('--check')
  mkdirSync(OUT, { recursive: true })
  const stale = []
  for (const p of PRODUCTS) {
    const file = resolve(OUT, `${p.slug}.html`)
    const html = page(p)
    if (check) {
      if (!existsSync(file) || readFileSync(file, 'utf8') !== html) stale.push(p.slug)
      continue
    }
    writeFileSync(file, html)
    console.log('wrote products/' + p.slug + '.html  ' + p.sections.map((s) => s.type).join(' '))
  }
  if (!check) console.log(PRODUCTS.length + ' pages')
  else if (stale.length) {
    console.error('STALE — edited by hand, or built from an older copy: ' + stale.join(', '))
    console.error('Run `node site/build-products.mjs` and commit what it writes.')
    process.exit(1)
  } else console.log(`${PRODUCTS.length} pages, all in step with the builder`)
}
