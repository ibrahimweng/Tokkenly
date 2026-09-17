/* Eight product pages, from a kit of sections rather than one template.
 *
 *  The old version of this file had one page shape and filled it with seven
 *  sets of words. Convert and Pay bills came out the same page, and a reader
 *  going from one to the next had no reason to believe they had moved.
 *
 *  So the shape is data now. copy-products.mjs gives each product a `spine`:
 *  an ordered list of section types, and no two products have the same one.
 *  Every section type below is built from the vocabulary the landing page
 *  already uses — .band, .stage and its five colours, .steps, .grid-3, .faq,
 *  .head, .reveal — so eight different pages are still one site.
 *
 *  The output is committed. The site has no build step and serving it must
 *  not need one; this script only regenerates the files when the chrome, the
 *  kit or the copy changes.
 *
 *      node build-products.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PRODUCTS, APP_URL } from './copy-products.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, 'products')
export { PRODUCTS }

/* Copy is written with the odd entity in it — & and — and ₦ — so escaping
   wholesale would double them. Only the characters that break markup. */
const esc = (s) => String(s).replace(/&(?![a-z#][a-z0-9]*;)/gi, '&amp;').replace(/</g, '&lt;')
const plain = (s) => String(s).replace(/&[a-z#][a-z0-9]*;/gi, ' ').replace(/\s+/g, ' ').trim()

const ARROW = '<svg class="pr-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>'
const TICK = '<svg class="fx-i" viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8.5 3.2 3.2L13 5" /></svg>'
const CROSS = '<svg class="fx-i" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></svg>'

/* ---------------------------------------------------------------- chrome -- */
const nav = (up, current) => `
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
          <a href="${up}index.html#why">About us</a>
          <a href="#" data-soon>Blog</a>
          <a href="${up}index.html#faq">Help</a>
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
        <a href="${up}index.html#why">About us</a>
        <a href="#" data-soon>Blog</a>
        <a href="${up}index.html#faq">Help</a>
        <a class="btn btn-mint mm-cta" href="${APP_URL}">Sign up</a>
      </div>
    </header>`

const footer = (up) => `
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
              <a href="${up}index.html#why">About us</a>
              <a href="#" data-soon>Blog</a>
            </div>
            <div class="foot-col">
              <p class="foot-head">Legal</p>
              <a href="#" data-soon>Terms of service</a>
              <a href="#" data-soon>Privacy policy</a>
              <a href="${up}index.html#faq">Help</a>
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
          <div class="head reveal"><h2>${esc(s.head)}</h2></div>
          <div class="fx-stats">
${s.items.map(([fig, unit, say]) => `            <div class="fx-stat reveal">
              <p class="fx-fig">${esc(fig)}<span>${esc(unit)}</span></p>
              <p>${esc(say)}</p>
            </div>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Text and a screen, side by side, swapping sides down the page. */
  alt: (p, s, up) => `
      <section class="band band-cream">
        <div class="wrap">
          <div class="head reveal"><h2>${esc(s.head)}</h2></div>
${s.rows.map(([h, b, img, alt], i) => `          <div class="fx-alt reveal${i % 2 ? ' fx-alt-b' : ''}">
            <div class="fx-alt-text">
              <h3>${esc(h)}</h3>
              <p>${esc(b)}</p>
            </div>
            <div class="stage ${p.stage} fx-alt-stage">
              <img src="${up}img/${img}" loading="lazy" alt="${esc(alt)}" />
            </div>
          </div>`).join('\n')}
        </div>
      </section>`,

  /* A table with no table in it: the questions a person asks before they
     commit, answered in one line each. */
  facts: (p, s, up) => `
      <section class="band">
        <div class="wrap">
          <div class="head reveal"><h2>${esc(s.head)}</h2></div>
          <dl class="fx-facts reveal">
${s.rows.map(([k, v]) => `            <div class="fx-fact">
              <dt>${esc(k)}</dt>
              <dd>${esc(v)}</dd>
            </div>`).join('\n')}
          </dl>
        </div>
      </section>`,

  /* The way it usually goes, and the way it goes here. Onboard's move, and
     it earns its place on the two products with a genuine before. */
  compare: (p, s, up) => `
      <section class="band band-cream">
        <div class="wrap">
          <div class="head reveal"><h2>${esc(s.head)}</h2></div>
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

  /* Three numbered steps, each on its own coloured slab. */
  steps: (p, s, up) => `
      <section class="band">
        <div class="wrap">
          <div class="head reveal"><h2>${esc(s.head)}</h2></div>
          <div class="steps">
${s.items.map(([h, b, img], i) => `            <article class="step reveal">
              <div class="stage ${p.stage}">
                <img src="${up}img/${img}" loading="lazy" alt="" />
              </div>
              <p class="num">${i + 1}</p>
              <h3>${esc(h)}</h3>
              <p>${esc(b)}</p>
            </article>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Three plain cards. No screens: the page has enough of them by now. */
  grid: (p, s, up) => `
      <section class="band band-cream">
        <div class="wrap">
          <div class="head reveal"><h2>${esc(s.head)}</h2></div>
          <div class="grid-3 cards">
${s.items.map(([h, b]) => `            <article class="card reveal">
              <h3>${esc(h)}</h3>
              <p>${esc(b)}</p>
            </article>`).join('\n')}
          </div>
        </div>
      </section>`,

  /* Two audiences, side by side, each with its own list. Gifting has two
     completely different readers and one column would serve neither. */
  two: (p, s, up) => `
      <section class="band">
        <div class="wrap">
          <div class="head reveal"><h2>${esc(s.head)}</h2></div>
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
      <section class="band band-deep">
        <div class="wrap wrap-narrow">
          <p class="fx-quote reveal">${esc(s.text)}</p>
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
        <div class="wrap wrap-narrow">
          <div class="head reveal"><h2>Questions worth asking.</h2></div>
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
    return `
      <section class="band">
        <div class="wrap">
          <div class="head reveal"><h2>The rest of it.</h2></div>
          <div class="prod-more">
${others.map((o) => `            <a class="prod-card reveal" href="${o.slug}.html">
              <h3>${o.nav}</h3>
              <p>${esc(o.title)}</p>
              <span class="pr-link">Explore ${o.nav} ${ARROW}</span>
            </a>`).join('\n')}
          </div>
        </div>
      </section>`
  },
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

      <!-- The product hero: the landing hero's type without its globe, and
           the product's own colour under the screen. Eight pages, five stage
           colours, so no two neighbours in the menu look alike. -->
      <section class="hero hero-product">
        <div class="hero-wash" aria-hidden="true"></div>
        <div class="wrap hero-in">
          <p class="eyebrow hero-intro" style="--hero-d: 0s">${esc(p.eyebrow)}</p>
          <h1 class="hero-hl hero-product-hl hero-intro" style="--hero-d: 0.05s"><span>${esc(p.title)}</span></h1>
          <p class="lead hero-lead hero-intro" style="--hero-d: 0.1s">${esc(p.lead)}</p>
          <div class="cta-row hero-cta hero-intro" style="--hero-d: 0.2s">
            <a class="btn btn-ink" href="${APP_URL}">Get Started</a>
            <a class="btn btn-white" href="#more">See how it works</a>
          </div>
        </div>

        <div class="prod-shot hero-intro" style="--hero-d: 0.3s">
          <div class="stage ${p.stage} fx-hero-stage">
            <img src="${up}img/${p.shot}" loading="eager" alt="${esc(p.shotAlt)}" />
          </div>
        </div>
      </section>

      <span id="more"></span>
${p.spine.map((s) => KIT[s.type](p, s, up)).join('\n')}

      <section class="closing">
        <div class="wrap">
          <div class="closing-slab reveal">
            <img class="cta-prop cta-coin" src="${up}img/cta/coin.webp" width="274" height="290" loading="lazy" alt="" aria-hidden="true" />
            <img class="cta-prop cta-pen" src="${up}img/cta/pen.webp" width="302" height="369" loading="lazy" alt="" aria-hidden="true" />
            <img class="cta-prop cta-notes" src="${up}img/cta/notes.webp" width="593" height="593" loading="lazy" alt="" aria-hidden="true" />
            <div class="closing-in">
              <h2>Your money. A wider world.</h2>
              <p class="closing-lead">
                From Nigerian companies to US names, discover tokenized stocks worth a closer look.
                Keep your everyday money in the same app.
              </p>
              <a class="btn btn-deep" href="${APP_URL}">Get Started</a>
            </div>
          </div>
        </div>
      </section>
    </main>
${footer(up)}

    <script src="${up}site.js"></script>
  </body>
</html>
`
}

mkdirSync(OUT, { recursive: true })
for (const p of PRODUCTS) {
  writeFileSync(resolve(OUT, `${p.slug}.html`), page(p))
  console.log('wrote products/' + p.slug + '.html  ' + p.spine.map((s) => s.type).join(' '))
}
console.log(PRODUCTS.length + ' pages')
