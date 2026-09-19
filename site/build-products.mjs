/* Eight product pages, from a kit of sections rather than one template.
 *
 *  The first version of this file had one page shape and filled it with seven
 *  sets of words. Convert and Pay bills came out the same page, and a reader
 *  going from one to the next had no reason to believe they had moved. So the
 *  shape is data: copy-products.mjs gives each product a `spine`, an ordered
 *  list of section types, and no two products have the same one.
 *
 *  The second version fixed the shapes and got the furniture wrong. It put a
 *  whole 780x1600 phone screenshot on a coloured slab beside every paragraph,
 *  which is not what the landing page does with a screen — it never shows one.
 *  It shows a receipt: a white panel of four rows and a button, built in
 *  markup, about 300 tall, sitting in the corner of a dark card. That panel
 *  says more about a product than a photograph of the screen it came from, and
 *  it cannot grow taller than the words beside it.
 *
 *  So everything below is the landing page's own vocabulary: .pr-* for the
 *  deep-green bento of #00221a cards, .ts-* for the stone-and-gradient trio,
 *  .points for the ruled split, .pn for the panel. A person arriving from the
 *  landing page should recognise the furniture.
 *
 *  The output is committed. The site has no build step and serving it must
 *  not need one; this script only regenerates the files when the chrome, the
 *  kit or the copy changes.
 *
 *      node build-products.mjs
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRODUCTS, PROPS, APP_URL } from './copy-products.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, 'products')
export { PRODUCTS }

/* Copy is written with the odd entity in it — &amp; and &#8212; and &#8358; —
   so escaping wholesale would double them. Only the characters that break
   markup, and only where they are not already an entity. */
const esc = (s) => String(s).replace(/&(?![a-z#][a-z0-9]*;)/gi, '&amp;').replace(/</g, '&lt;')
const plain = (s) => String(s).replace(/&[a-z#][a-z0-9]*;/gi, ' ').replace(/\s+/g, ' ').trim()

const ARROW = '<svg class="pr-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>'
/* The frames break several headlines by hand; a \n in the copy is that break. */
const lines2 = (s) => esc(s).split('\n').join('<br />')
const TICK = '<svg class="fx-i" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.5 3.2 3.2L13 5" /></svg>'
const CROSS = '<svg class="fx-i" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></svg>'

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
const chip = (tone, icon) =>
  `<span class="pr-chip pr-chip-${tone}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${ICONS[icon]}" /></svg></span>`

const FLIP = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.5v11M5 13.5 2.5 11M5 13.5 7.5 11M11 13.5v-11M11 2.5 8.5 5M11 2.5 13.5 5" /></svg>'

/* --------------------------------------------------------------- panel -- */
/* Interface, in markup. A list of blocks, in order — see the note at the top
   of copy-products.mjs for what each one takes. */
function panel(blocks) {
  const row = ([k, v]) => `<div class="pn-row"><p class="pn-k">${esc(k)}</p><p class="pn-v">${esc(v)}</p></div>`
  const parts = blocks.map((b) => {
    const [kind, a, c] = b
    if (kind === 'head') return `<div class="pn-head"><p class="pn-k">${esc(a)}</p><p class="pn-fig">${esc(c)}</p></div>`
    if (kind === 'rows') return `<div class="pn-rows">${a.map(row).join('')}</div>`
    if (kind === 'pairs') {
      /* Two at a time, because a pair of short answers side by side is how the
         landing page's receipt reads and it halves the panel's height. */
      const out = []
      for (let i = 0; i < a.length; i += 2) out.push(`<div class="pn-pair">${a.slice(i, i + 2).map(row).join('')}</div>`)
      return `<div class="pn-rows">${out.join('')}</div>`
    }
    if (kind === 'list') return `<div class="pn-list">${a.map(([badge, name, sub, val, tone]) => `
              <div class="pn-item">
                <span class="pn-badge" aria-hidden="true">${esc(badge)}</span>
                <div><p class="pn-name">${esc(name)}</p><p class="pn-sub">${esc(sub)}</p></div>
                <p class="pn-val${tone === 'up' ? ' pn-up' : tone === 'down' ? ' pn-down' : ''}">${esc(val)}</p>
              </div>`).join('')}</div>`
    if (kind === 'swap') return `<div class="pn-swap">${a.map(([k, big, unit]) => `
              <div class="pn-field">
                <div><p class="pn-k">${esc(k)}</p><p class="pn-big">${esc(big)}</p></div>
                <p class="pn-unit">${esc(unit)}</p>
              </div>`).join('')}<span class="pn-flip" aria-hidden="true">${FLIP}</span></div>`
    if (kind === 'bar') return `<div class="pn-bar">
              <div class="pn-track">${a.map(([, , pc]) => `<span class="pn-seg" style="flex: ${pc}"></span>`).join('')}</div>
              <div class="pn-keys">${a.map(([k, v]) => `<div class="pn-key"><p class="pn-k pn-dot">${esc(k)}</p><p class="pn-v">${esc(v)}</p></div>`).join('')}</div>
            </div>`
    if (kind === 'note') return `<p class="pn-note">${esc(a)}</p>`
    if (kind === 'btn') return `<p class="pn-btn">${esc(a)}</p>`
    throw new Error('unknown panel block: ' + kind)
  })
  return `<div class="pn">${parts.join('')}</div>`
}

/* A panel standing on the product's own colour, with one object bleeding out
   of the bottom corner. */
const slab = (stage, prop, blocks, up) => {
  const p = PROPS[prop]
  return `<div class="slab ${stage}">
            ${p ? `<img class="slab-prop" style="--w2: ${p.w2 || '56%'}${p.r2 ? `; --r: ${p.r2}` : ''}" src="${up}img/${p.src}" loading="lazy" alt="" aria-hidden="true" />` : ''}
            ${panel(blocks)}
          </div>`
}

/* The art slot inside a bento card: pinned to the card's bottom edge and
   clipped by it, holding one or two of the placed objects. */
const artSlot = (names, up) => `<div class="pr-stage" aria-hidden="true">${names.split(',').map((n) => {
  const p = PROPS[n.trim()]
  if (!p) throw new Error('unknown prop: ' + n)
  return `<img class="pr-prop" style="--l: ${p.l}; --t: ${p.t}; --w: ${p.w}${p.r ? `; --r: ${p.r}` : ''}${p.fx ? `; --fx: ${p.fx}` : ''}" src="${up}img/${p.src}" loading="lazy" alt="" />`
}).join('')}</div>`

/* ---------------------------------------------------------------- chrome -- */
export const nav = (up, current) => `
    <header class="nav" id="nav">
      <div class="nav-in">
        <a class="brand" href="${up}index.html" aria-label="Tokkenly, home">
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
${PRODUCTS.map((p) => `              <a href="${up}products/${p.slug}.html"${p.slug === current ? ' aria-current="page"' : ''}>
                <span class="dm-name">${p.nav}</span>
                <span class="dm-say">${esc(p.title)}</span>
              </a>`).join('\n')}
            </div>
          </div>
          <a href="${up}about.html">About us</a>
          <a href="${up}blog.html">Blog</a>
          <a href="${up}contact.html">Help</a>
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
${PRODUCTS.map((p) => `        <a href="${up}products/${p.slug}.html">${p.nav}</a>`).join('\n')}
        <p class="mm-head">Company</p>
        <a href="${up}about.html">About us</a>
        <a href="${up}blog.html">Blog</a>
        <a href="${up}contact.html">Help</a>
        <a class="btn btn-mint mm-cta" href="${APP_URL}">Sign up</a>
      </div>
    </header>`

export const footer = (up) => `
    <footer class="foot">
      <div class="wrap">
        <div class="foot-top">
          <div class="foot-brand">
            <a class="brand" href="${up}index.html" aria-label="Tokkenly, home">
              <span class="brand-mark" aria-hidden="true">T</span>
              <span class="brand-word">Tokkenly</span>
            </a>
            <p>Your money, free to do more.</p>
            <ul class="socials">
              <li><a href="#" data-soon aria-label="Tokkenly on X"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.7 3h3.3l-7.2 8.3L22.4 21h-6.6l-5.2-6.8L4.6 21H1.3l7.7-8.8L1.6 3h6.8l4.7 6.2L17.7 3Zm-1.2 16h1.8L7.6 4.9H5.7L16.5 19Z" /></svg></a></li>
              <li><a href="#" data-soon aria-label="Tokkenly on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true" class="ic-stroke"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></svg></a></li>
              <li><a href="#" data-soon aria-label="Tokkenly on LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.56 4.78 5.89V21h-4v-5.2c0-1.24-.02-2.84-1.77-2.84-1.78 0-2.05 1.35-2.05 2.75V21h-4V9.5Z" /></svg></a></li>
            </ul>
          </div>

          <nav class="foot-cols" aria-label="Footer">
            <div class="foot-col foot-col-products">
              <p class="foot-head">Products</p>
              <div class="foot-split">
                <div>
${PRODUCTS.slice(0, 4).map((p) => `                  <a href="${up}products/${p.slug}.html">${p.nav}</a>`).join('\n')}
                </div>
                <div>
${PRODUCTS.slice(4).map((p) => `                  <a href="${up}products/${p.slug}.html">${p.nav}</a>`).join('\n')}
                </div>
              </div>
            </div>
            <div class="foot-col">
              <p class="foot-head">Company</p>
              <a href="${up}about.html">About us</a>
              <a href="${up}blog.html">Blog</a>
            </div>
            <div class="foot-col">
              <p class="foot-head">Legal</p>
              <a href="${up}terms.html">Terms of service</a>
              <a href="${up}privacy.html">Privacy policy</a>
              <a href="${up}contact.html">Help</a>
            </div>
          </nav>
        </div>

        <div class="foot-end">
          <p class="foot-word" aria-hidden="true">Tokkenly</p>
          <p class="risk">Investments and earning products involve risk. Returns are not guaranteed.</p>
        </div>
      </div>
    </footer>`

/* ------------------------------------------------------------- the kit ----
   One function per section type. Each takes the product and its own slice of
   the spine, and returns a <section>. Nothing here knows the order it will be
   called in, which is why the order can be data. */
const KIT = {
  /* Figures, three across. The one section that says how big the thing is
     before saying what it does. */
  stats: (p, s, up) => `
      <section class="band">
        <div class="wrap">
          <div class="head px-head reveal"><h2>${esc(s.head)}</h2></div>
          <div class="fx-stats">
${s.items.map(([fig, unit, say]) => `            <div class="fx-stat reveal">
              <p class="fx-fig">${esc(fig)}<span>${esc(unit)}</span></p>
              <p>${esc(say)}</p>
            </div>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* The landing page's product grid, carrying this product's own facets. Wide
     cards hold a panel, narrow cards hold an object; the rows alternate which
     side is which, which is the whole trick of that section. */
  bento: (p, s, up) => `
      <section class="band band-products">
        <div class="wrap">
          <div class="head head-ondeep bx-head reveal">
            <p class="eyebrow">${esc(s.eyebrow)}</p>
            <h2>${s.head}</h2>
${s.lead ? `            <p class="lead">${esc(s.lead)}</p>` : ''}
          </div>

          <div class="pr-grid">
${s.rows.map(([side, ...cards]) => `            <div class="pr-row pr-row-${side}">
${cards.map((c) => (c.panel ? `              <article class="pr-card pr-wide reveal">
                <div class="pr-body">
                  <div class="pr-top">
                    <div class="pr-title">${chip(c.chip, c.icon)}<h3>${esc(c.h)}</h3></div>
                    <div class="pr-paras">
${c.p.map((x) => `                      <p>${esc(x)}</p>`).join('\n')}
                    </div>
                  </div>
${c.link ? `                  <a class="pr-link" href="${c.link[1]}">${esc(c.link[0])} ${ARROW}</a>` : ''}
                </div>
                ${panel(c.panel)}
              </article>` : `              <article class="pr-card pr-narrow reveal">
                <div class="pr-top">
                  <div class="pr-title">${chip(c.chip, c.icon)}<h3>${esc(c.h)}</h3></div>
${c.p.map((x) => `                  <p>${esc(x)}</p>`).join('\n')}
                </div>
                ${artSlot(c.prop, up)}
              </article>`)).join('\n')}
            </div>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Three cards, deliberately uneven: two stone with the words at the top, a
     gradient one between them reading bottom-up. Straight off the landing
     page's tokenized-stocks row. */
  trio: (p, s, up) => `
      <section class="band band-ts">
        <div class="wrap">
          <div class="head tx-head reveal">
            <p class="eyebrow">${esc(s.eyebrow)}</p>
            <h2>${s.head}</h2>
          </div>
          <div class="ts-cards tx-cards">
${s.cards.map(([h, b, art], i) => {
  const copy = `              <div class="ts-copy${i === 1 ? ' ts-copy-end' : ''}">
                <h3>${esc(h)}</h3>
                <p>${esc(b)}</p>
              </div>`
  const slot = `              <div class="ts-slot">
                <div class="ts-stage" style="--ar: 461.333 / 388">
${art.split(',').map((n) => {
  const q = PROPS[n.trim()]
  if (!q) throw new Error('unknown prop: ' + n)
  return `                  <img class="ts-prop" style="--l: ${q.l}; --t: ${q.t}; --w: ${q.w}${q.r ? `; --r: ${q.r}` : ''}${q.fx ? `; --fx: ${q.fx}` : ''}" src="${up}img/${q.src}" width="700" height="742" loading="lazy" alt="" />`
}).join('\n')}
                </div>
              </div>`
  return `            <article class="ts-card ${i === 1 ? 'ts-card-grad' : 'ts-card-stone'} reveal">
${i === 1 ? slot + '\n' + copy : copy + '\n' + slot}
            </article>`
}).join('\n')}
          </div>
        </div>
      </section>`,

  /* The gifting section's shape: a headline big enough to be the point, two
     ruled points, a mint pill, and the product on its own colour beside it. */
  split: (p, s, up) => `
      <section class="band">
        <div class="wrap sp-in${s.side === 'b' ? ' sp-in-b' : ''}">
          <div class="sp-text reveal">
            <div class="sp-head">
              <p class="eyebrow">${esc(s.eyebrow)}</p>
              <h2>${s.head}</h2>
              <p class="lead">${esc(s.lead)}</p>
            </div>
            <div class="sp-body">
              <div class="points">
${s.points.map(([h, b]) => `                <div class="point">
                  <div class="point-copy">
                    <h3>${esc(h)}</h3>
                    <p>${esc(b)}</p>
                  </div>
                </div>`).join('\n')}
              </div>
              <a class="btn btn-mint" href="${s.cta[1]}">${esc(s.cta[0])}</a>
            </div>
          </div>

          <div class="reveal">
            ${slab(s.stage, s.prop, s.panel, up)}
          </div>
        </div>
      </section>`,

  /* A table with no table in it: the questions a person asks before they
     commit, answered in one line each. */
  facts: (p, s, up) => `
      <section class="band">
        <div class="wrap">
          <div class="head px-head reveal"><h2>${esc(s.head)}</h2></div>
          <dl class="fx-facts reveal">
${s.rows.map(([k, v]) => `            <div class="fx-fact">
              <dt>${esc(k)}</dt>
              <dd>${esc(v)}</dd>
            </div>`).join('\n')}
          </dl>
        </div>
      </section>`,

  /* The way it usually goes, and the way it goes here. Stone against the
     landing page's card green, so the two columns are the site's own two
     grounds rather than a grey box and a green one. */
  compare: (p, s, up) => `
      <section class="band">
        <div class="wrap">
          <div class="head px-head reveal"><h2>${esc(s.head)}</h2></div>
          <div class="fx-cmp">
            <div class="fx-col fx-col-before reveal">
              <p class="fx-col-head">Without Tokkenly</p>
              <ul>
${s.before.map((x) => `                <li>${CROSS}${esc(x)}</li>`).join('\n')}
              </ul>
            </div>
            <div class="fx-col fx-col-after reveal">
              <p class="fx-col-head">With Tokkenly</p>
              <ul>
${s.after.map((x) => `                <li>${TICK}${esc(x)}</li>`).join('\n')}
              </ul>
            </div>
          </div>
        </div>
      </section>`,

  /* Three numbered steps, under a mint rule each. No pictures: the bento and
     the split carry those, and repeating them here is what made every page
     read as the same page. */
  steps: (p, s, up) => `
      <section class="band">
        <div class="wrap">
          <div class="head px-head reveal"><h2>${esc(s.head)}</h2></div>
          <div class="steps">
${s.items.map(([h, b], i) => `            <article class="step reveal">
              <p class="num">Step ${i + 1}</p>
              <h3>${esc(h)}</h3>
              <p>${esc(b)}</p>
            </article>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Two audiences, side by side, each with its own list. Gifting has two
     completely different readers and one column would serve neither. */
  two: (p, s, up) => `
      <section class="band band-cream">
        <div class="wrap">
          <div class="head px-head reveal"><h2>${esc(s.head)}</h2></div>
          <div class="fx-two">
${s.cols.map(([h, b, list]) => `            <article class="fx-half reveal">
              <h3>${esc(h)}</h3>
              <p>${esc(b)}</p>
              <ul class="fx-list">
${list.map((x) => `                <li>${TICK}${esc(x)}</li>`).join('\n')}
              </ul>
            </article>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* One sentence, large, on the deep ground. For the thing a page most wants
     somebody to leave knowing. */
  quote: (p, s, up) => `
      <section class="band">
        <div class="wrap">
          <div class="fx-slab reveal">
            <p class="fx-quote-k">Worth knowing</p>
            <p class="fx-quote">${esc(s.text)}</p>
          </div>
        </div>
      </section>`,

  /* Said plainly, and said where it cannot be missed. Two products lead with
     it rather than burying it at the bottom. */
  risk: (p, s, up) => `
      <section class="band band-risk">
        <div class="wrap wrap-narrow">
          <p class="prod-risk reveal">
            <strong>Worth saying plainly.</strong> ${p.nav} carries risk. Rates change, what you
            commit is not a deposit and is not guaranteed, and you can get back less than you put
            in. The terms are on the screen before you agree to anything &#8212; read them.
          </p>
        </div>
      </section>`,

  faq: (p, s, up) => `
      <section class="band band-cream">
        <div class="wrap faq-in">
          <div class="head faq-head reveal">
            <p class="eyebrow">Questions</p>
            <h2>Worth asking.</h2>
          </div>
          <div class="faq reveal">
${s.items.map(([q, a]) => `            <details>
              <summary>${esc(q)}<span class="plus" aria-hidden="true"></span></summary>
              <div class="answer"><p>${esc(a)}</p></div>
            </details>`).join('\n')}
          </div>
        </div>
      </section>`,

  related: (p, s, up) => {
    const i = PRODUCTS.findIndex((x) => x.slug === p.slug)
    const others = [PRODUCTS[(i + 1) % PRODUCTS.length], PRODUCTS[(i + 2) % PRODUCTS.length], PRODUCTS[(i + 3) % PRODUCTS.length]]
    const tones = ['mint', 'yellow', 'orange']
    const icons = { 'tokenized-stocks': 'search', 'gifting-and-rewards': 'gift', receive: 'down',
                    send: 'updown', 'pay-bills': 'receipt', convert: 'swap', earn: 'split', borrow: 'clock' }
    return `
      <section class="band band-products band-more">
        <div class="wrap">
          <div class="head head-ondeep bx-head reveal">
            <p class="eyebrow">The rest of it</p>
            <h2>There is more<br />in the app.</h2>
          </div>
          <div class="prod-more">
${others.map((o, n) => `            <a class="prod-card reveal" href="${o.slug}.html">
              <div class="pr-title">${chip(tones[n], icons[o.slug])}<h3>${o.nav}</h3></div>
              <p>${esc(o.title)}</p>
              <span class="pr-link">Explore ${o.nav} ${ARROW}</span>
            </a>`).join('\n')}
          </div>
        </div>
      </section>`
  },
}

/* The close is the same on every product page, spine or sections, so it is a
   function rather than two copies of the same markup. */
const closingProd = (p, up) => `
      <section class="closing closing-prod" data-cta="product">
        <div class="wrap">
          <div class="closing-slab reveal">
            <img class="cta-prop cta-coin n-tl" src="${up}img/cta/coin.webp" width="274" height="290" loading="lazy" alt="" aria-hidden="true" />
            <img class="cta-prop cta-pen n-bl" src="${up}img/cta/pen.webp" width="302" height="369" loading="lazy" alt="" aria-hidden="true" />
            <img class="cta-prop cta-notes n-r" src="${up}img/cta/notes.webp" width="593" height="593" loading="lazy" alt="" aria-hidden="true" />
            <div class="closing-in">
              <h2>${esc(p.close[0])}</h2>
              <p class="closing-lead">${esc(p.close[1])}</p>
              <a class="btn btn-deep" href="${APP_URL}">Get Started</a>
            </div>
          </div>
        </div>
      </section>`

/* ------------------------------------------------------- the second kit ---
   The frames in Section 1 redraw every product page. Those pages are built
   from `sections` rather than `spine`, and these are their renderers. A page
   that still has only a spine goes on using KIT above, so the two can live
   side by side while the rebuild runs page by page.

   Everything here is measured off its frame at 1920. Where a number is a
   share of the column it is written as a percentage; where it is a share of
   the page's own height it is written as min(px, vw), because a section in
   code takes its height from its words and a percentage of that would slide
   the moment a line wrapped differently. */

/* The six products, as the sibling cards name them. The href is resolved
   once, here, so the rebuild can move a page without hunting through copy. */
const SIBS = {
  'tokenized-stocks':   ['Tokenized Stocks', 'Nigerian and US companies, in one list.', 'tokenized-stocks', 'search'],
  'gifting-and-rewards':['Gifting &amp; Rewards', 'Make their day. Start their portfolio.', 'gifting-and-rewards', 'gift'],
  'receive-and-send':   ['Receive and send', 'Get paid. Make someone&#8217;s day.', 'receive', 'updown'],
  'pay-bills':          ['Pay bills', 'Airtime, data and electricity, in one place.', 'pay-bills', 'receipt'],
  'convert':            ['Convert', 'Naira and stablecoins, at the rate on the screen.', 'convert', 'swap'],
  'borrow-and-earn':    ['Borrow and earn', 'Put it to work, or borrow against it.', 'earn', 'split'],
}

/* left and width are shares of the 1920 hero; top is a share of its 1169, so
   it is turned into a viewport length rather than a percentage of a box whose
   height the words decide. */
const coinTop = (pc) => {
  const px = pc / 100 * 1169
  return `min(${px.toFixed(0)}px, ${(px / 1920 * 100).toFixed(3)}vw)`
}

const KIT2 = {
  /* The frame's hero: one centred column of words on a radial wash, with the
     coins laid across the whole band behind them. */
  phero: (p, s, up) => `
      <section class="p2-hero">
        <div class="p2-wash" aria-hidden="true"
             style="--w: radial-gradient(118% 92% at 50% -2%, ${s.wash.join(', ')})"></div>
${s.coins.map(([name, l, t, w, fx]) => `        <img class="p2-coin${fx ? ' p2-coin-fx' : ''}" src="${up}img/ts/coin-${name}.webp" style="left:${l}%;top:${coinTop(t)};width:${w}%" alt="" aria-hidden="true" />`).join('\n')}
        <div class="wrap p2-hero-in">
          <p class="eyebrow hero-intro" style="--hero-d: 0s">${esc(s.eyebrow)}</p>
          <h1 class="hero-intro" style="--hero-d: 0.05s">${lines2(s.h)}</h1>
          <p class="p2-hero-lead hero-intro" style="--hero-d: 0.1s">${esc(s.lead)}</p>
          <div class="cta-row centred hero-intro" style="--hero-d: 0.2s">
${s.ctas.map(([label, tone, href]) => `            <a class="btn btn-${tone}" href="${href || APP_URL}">${esc(label)}</a>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Three 485 cards on the 1520, each a gradient with a white fragment of the
     product sitting in it. The third card puts its words under the fragment
     rather than over it, which is the only variation the frame draws. */
  cards3: (p, s, up) => `
      <section class="band p2-cards">
        <div class="wrap">
          <div class="p2-head reveal">
            <h2>${esc(s.h)}</h2>
            <p>${esc(s.lead)}</p>
          </div>
          <div class="p2-card-row">
${s.cards.map((c) => `            <article class="p2-card${c.foot ? ' p2-card-foot' : ''} reveal" style="--grad: linear-gradient(to bottom, ${c.grad.join(', ')})">
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
      <section class="band p2-faq">
        <div class="wrap faq-in">
          <div class="head faq-head reveal">
            <p class="eyebrow">${esc(s.eyebrow)}</p>
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
      <section class="band p2-sibs">
        <div class="wrap">
          <div class="p2-head reveal">
            <p class="eyebrow">${esc(s.eyebrow)}</p>
            <h2>${lines2(s.h)}</h2>
          </div>
          <div class="prod-more">
${s.cards.map((key) => {
    const [title, sub, href, icon] = SIBS[key]
    return `            <article class="prod-card reveal">
              <div class="pr-title">
                <span class="pr-chip" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${ICONS[icon]}" /></svg></span>
                <h3>${title}</h3>
                <p>${sub}</p>
              </div>
              <a class="pr-link" href="${up}products/${href}.html">Explore ${title} ${ARROW}</a>
            </article>`
  }).join('\n')}
          </div>
        </div>
      </section>`,

  pclose: (p, s, up) => closingProd(p, up),
}

/* ----------------------------------------------------------------- page -- */
function page(p) {
  const up = '../'
  const desc = plain(p.lead)
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${plain(p.nav)} &#8212; Tokkenly</title>
    <meta name="description" content="${desc}" />
    <link rel="icon" href="${up}favicon.svg" />
    <meta property="og:title" content="${plain(p.nav)} &#8212; Tokkenly" />
    <meta property="og:description" content="${desc}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preload" href="${up}fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="${up}styles.css" />
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
${nav(up, p.slug)}

    <main id="main">
      <span id="top"></span>
${p.sections ? p.sections.map((s) => KIT2[s.type](p, s, up)).join('\n') : `
      <!-- The hero: the landing page's wash and type, but in two columns.
           The landing hero is centred because it has a globe under it; a
           product page has one panel of the product instead, and putting it
           beside the words is what keeps the whole introduction — headline,
           lead, buttons and the thing itself — inside one screen. -->
      <section class="hero hero-product">
        <div class="hero-wash" aria-hidden="true"></div>
        <div class="wrap ph-in">
          <div class="ph-text">
            <p class="eyebrow hero-intro" style="--hero-d: 0s">${esc(p.eyebrow)}</p>
            <h1 class="ph-hl hero-intro" style="--hero-d: 0.05s">${esc(p.title)}</h1>
            <p class="lead ph-lead hero-intro" style="--hero-d: 0.1s">${esc(p.lead)}</p>
            <div class="cta-row ph-cta hero-intro" style="--hero-d: 0.2s">
              <a class="btn btn-ink" href="${APP_URL}">Get Started</a>
              <a class="btn btn-white" href="#more">See how it works</a>
            </div>
          </div>
          <div class="ph-art hero-intro" style="--hero-d: 0.3s">
            ${slab(p.stage, p.prop, p.panel, up)}
          </div>
        </div>
      </section>

      <span id="more"></span>
${p.spine.map((s) => KIT[s.type](p, s, up).replace('<section class="band', `<section id="s-${s.type}" class="band`)).join('\n')}

${closingProd(p, up)}`}
    </main>
${footer(up)}

    <script src="${up}site.js"></script>
  </body>
</html>
`
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
    console.log('wrote products/' + p.slug + '.html  ' + p.spine.map((s) => s.type).join(' '))
  }
  if (!check) console.log(PRODUCTS.length + ' pages')
  else if (stale.length) {
    console.error('STALE — edited by hand, or built from an older copy: ' + stale.join(', '))
    console.error('Run `node site/build-products.mjs` and commit what it writes.')
    process.exit(1)
  } else console.log(`${PRODUCTS.length} pages, all in step with the builder`)
}
