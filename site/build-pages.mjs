/* The company and legal pages.
   ---------------------------------------------------------------------------
   Words live in copy-pages.mjs, and every one of them is the word in Figma.
   The nav and the footer are imported from build-products.mjs rather than
   copied, so a routing change is made once and every page in the site gets it.

   Frames: About us 397:559, Blog 391:559, Contact us 394:780, Terms of service
   399:559, Privacy policy 399:785. Each closes on the shared slab, and all
   five carry the same instance of it as the landing page does — one gradient
   and one arrangement of props, from the stylesheet, with only the headline,
   the lead and the button label differing page to page. */
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGES, EMAIL } from './copy-pages.mjs'
import { APP_URL, SITE_URL, PRODUCTS } from './copy-products.mjs'
import { nav, footer, head, pageUrl, sized } from './build-products.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const esc = (s) => String(s).replace(/&(?![a-z#][a-z0-9]*;)/gi, '&amp;').replace(/</g, '&lt;')
/* The About headline is broken by hand in the frame. */
const lines = (s) => esc(s).split('\n').join('<br />')
const ARROW = '<svg class="pr-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>'

/* ---- the close --------------------------------------------------------- */
/* Every page frame in the file — the landing page and these five — closes on
   the same instance of Section / Closing call to action, and the slab inside
   it is "Slab / mint": the pink-to-sand gradient with the coin over the top
   left corner, the pen dropping off the bottom and the notes tilted into the
   right half. The four product frames are the one exception, on "Slab /
   product", which is why build-products.mjs keeps its own arrangement.

   So there is no per-page pairing here any more. The variant attribute stays
   because the stylesheet still places the props through it, and because
   checkProps below reads those rules to prove a page never emits a prop the
   stylesheet has nowhere to put. */
/* The file it comes from, and its natural size. Two of the three differ from
   the product slab's: the coin is the Dangote one, and the pen is the frame's
   own crop of the pen rather than the whole drawing. So the name a page
   writes is the prop, not the filename. */
const PROPS = {
  dangote: ['coin-dangote', 560, 593],
  pen: ['pen-slab', 710, 866],
  notes: ['notes', 488, 488],
}

const close = (p) => {
  const [h, lead, label] = p.close
  const href = label === 'Contact us' ? '/contact' : APP_URL
  return `
      <section class="closing" data-cta="${p.cta}">
        <div class="wrap">
          <div class="closing-slab reveal">
${p.props.map(([name, anchor]) => {
    const [file, w, hh] = PROPS[name]
    return `              <img class="cta-prop cta-${name} ${anchor}" src="./img/cta/${file}.webp" width="${w}" height="${hh}" loading="lazy" alt="" aria-hidden="true" />`
  }).join('\n')}
            <div class="closing-in">
              <h2>${lines(h)}</h2>
              <p class="closing-lead">${esc(lead)}</p>
              <a class="btn btn-deep" href="${href}">${esc(label)}</a>
            </div>
          </div>
        </div>
      </section>`
}

/* A page that emits a prop its variant does not place gets an unpositioned
   image at natural size across the words — which is exactly how the product
   pages broke. The stylesheet is the source of truth for which props a variant
   places, so check the markup against it here rather than finding out in a
   screenshot. */
function checkProps() {
  const css = readFileSync(resolve(HERE, 'styles.css'), 'utf8')
  for (const p of Object.values(PAGES)) {
    const placed = new Set()
    const re = new RegExp(`\\[data-cta='${p.cta}'\\]\\s+\\.cta-([a-z-]+)`, 'g')
    let m
    while ((m = re.exec(css))) placed.add(m[1])
    const emitted = p.props.map(([n]) => n)
    const missing = emitted.filter((n) => !placed.has(n))
    const unused = [...placed].filter((n) => !emitted.includes(n))
    if (missing.length || unused.length) {
      throw new Error(`${p.slug}: variant '${p.cta}' places [${[...placed].join(', ')}] but the page emits [${emitted.join(', ')}]`
        + (missing.length ? `\n  emitted with no placement: ${missing.join(', ')}` : '')
        + (unused.length ? `\n  placed but never emitted: ${unused.join(', ')}` : ''))
    }
    if (!p.props.some(([, a]) => a === 'n-tl')) throw new Error(`${p.slug}: no prop anchored n-tl, so a phone would show none`)
  }
}

/* ---- about -------------------------------------------------------------- */
/* Masthead (443:494): 919 tall at 1920 on flat #1e1818 — no photograph and no
   scrim any more. The words hold the left 800 of the column and the 3D cloud
   (698:1789) sits to their right, a 843 x 613 rectangle turned 16.83 degrees
   and run off the bottom edge, which the section clips.

   The cloud ships as its own transparent drawing and the stylesheet does the
   turning, the crop and the cut — a render of the rectangle would have the
   section's ink baked into it, which is fine on the section and nowhere else.

   It is written after the words rather than before them because that is the
   order it wants narrow, where it stops being positioned and becomes the
   block under the last line. Wide it is taken out of the flow, so where it
   sits in the markup costs nothing.

   Values (397:605): two columns of 744 in the 1520, 32 apart, each a card in
   white at five per cent with a 90 icon over the words, which are pinned to
   the foot of the card rather than following the icon. */
const aboutBody = (p) => `
      <section class="ab-mast">
        <div class="wrap ab-mast-in">
          <div class="ab-mast-text reveal">
            <p class="eyebrow eyebrow-mint">${esc(p.eyebrow)}</p>
            <h1>${esc(p.title)}</h1>
            <div class="ab-mast-body">
${p.leads.map((l, i) => `              <p class="ab-lead-${i + 1}">${esc(l)}</p>`).join('\n')}
            </div>
          </div>
        </div>
        <img class="ab-mast-art" src="./img/about/cloud.webp" alt="" aria-hidden="true" />
      </section>

      <section class="ab-body">
        <div class="wrap">
          <div class="ab-statement reveal">
            <div class="ab-statement-l">
              <h2>${esc(p.statement.h)}</h2>
              <p>${esc(p.statement.p)}</p>
            </div>
            <div class="ab-stats">
${p.statement.stats.map(([k, v]) => `              <div class="ab-stat"><p class="ab-stat-k">${esc(k)}</p><p class="ab-stat-v">${esc(v)}</p></div>`).join('\n')}
            </div>
          </div>
        </div>

        <div class="wrap">
          <div class="ab-values-head reveal">
            <p class="eyebrow eyebrow-ondeep">${esc(p.values.eyebrow)}</p>
            <h2>${esc(p.values.h)}</h2>
            <p class="ab-values-intro">${esc(p.values.intro)}</p>
          </div>
          <div class="ab-grid reveal">
${p.values.items.map(([icon, h, t]) => `            <div class="ab-value">
              <img class="ab-icon" src="./img/about/v-${icon}.webp" width="270" height="270" loading="lazy" alt="" aria-hidden="true" />
              <div class="ab-value-t">
                <h3>${esc(h)}</h3>
                <p class="ab-p">${esc(t)}</p>
              </div>
            </div>`).join('\n')}
          </div>
        </div>

        <div class="wrap ab-narrative">
          <img class="ab-photo reveal" src="./img/about/narrative.webp" width="864" height="1184" loading="lazy" alt="" aria-hidden="true" />
          <div class="ab-narrative-t reveal">
            <p class="eyebrow eyebrow-ondeep">${esc(p.narrative.eyebrow)}</p>
            <h2>${esc(p.narrative.h)}</h2>
${p.narrative.ps.map((t) => `            <p>${esc(t)}</p>`).join('\n')}
          </div>
        </div>
      </section>`

/* ---- the forms ---------------------------------------------------------- */
/* Both forms post to api/contact.js, the site's one serverless function, which
   sends the message on through Resend. With the script running, site.js sends
   them with fetch and writes the outcome into the form's status line; without
   it they are ordinary form posts, and the function answers with a redirect
   back to this page at #sent or #failed. Those two notes are in the markup
   already and only show when they are the :target, so the thank-you works
   with no script at all.

   The `website` field is a honeypot: hidden from people and from assistive
   technology, and filled in only by a bot that fills in every field. */
const honeypot = (id) => `            <p class="hp" aria-hidden="true">
              <label for="${id}-website">Leave this empty</label>
              <input id="${id}-website" name="website" type="text" tabindex="-1" autocomplete="off" />
            </p>`
const outcome = (id, done) => `          <p class="form-note form-done" id="${id}-sent" tabindex="-1">${esc(done)}</p>
          <p class="form-note form-fail" id="${id}-failed" tabindex="-1">That did not go through. Please email us at <a href="mailto:${EMAIL}">${EMAIL}</a> instead.</p>`

/* ---- blog --------------------------------------------------------------- */
/* Six posts, three across at 485 with 32 between and 56 down. The frame's
   thumbnails are empty grey rectangles — the artwork has not been chosen — so
   they are empty grey rectangles here too rather than something invented to
   fill them.

   None of them is written yet, so a card is a heading and a "Coming soon"
   rather than a link with a date. The chips filter the cards by category:
   site.js hides the others and keeps aria-pressed on the chip in step. Without
   the script every card shows, which is what "All" means anyway. */
const blogBody = (p) => `
      <section class="band bl">
        <div class="wrap">
          <div class="bl-head reveal">
            <h1>${esc(p.title)}</h1>
            <p class="bl-lead">${esc(p.lead)}</p>
          </div>

          <div class="bl-filters reveal" role="group" aria-label="Show posts about">
${p.filters.map((f, i) => `            <button class="bl-chip${i === 0 ? ' is-on' : ''}" type="button" data-filter="${i === 0 ? '' : esc(f)}" aria-pressed="${i === 0}">${esc(f)}</button>`).join('\n')}
          </div>

          <p class="bl-count" role="status" aria-live="polite"></p>
          <div class="bl-grid reveal">
${p.posts.map(([cat, title]) => `            <article class="bl-post" data-cat="${esc(cat)}">
              <span class="bl-thumb" aria-hidden="true"></span>
              <p class="bl-cat">${esc(cat)}</p>
              <h2 class="bl-title">${esc(title)}</h2>
              <p class="bl-meta">${esc(p.soon)}</p>
            </article>`).join('\n')}
          </div>

          <div class="bl-news reveal">
            <h2>${esc(p.newsletter.h)}</h2>
            <p class="bl-news-p">${esc(p.newsletter.p)}</p>
            <form class="bl-form" method="post" action="/api/contact" data-form="newsletter">
              <input type="hidden" name="kind" value="newsletter" />
              <label class="bl-vh" for="bl-email">Email</label>
              <input class="bl-input" id="bl-email" name="email" type="email" autocomplete="email" required placeholder="${esc(p.newsletter.ph)}" />
              <button class="btn btn-deep bl-sub" type="submit">${esc(p.newsletter.btn)}</button>
${honeypot('bl')}
              <p class="form-status" role="status" aria-live="polite"></p>
            </form>
${outcome('bl', p.newsletter.done)}
          </div>
        </div>
      </section>`

/* ---- contact ------------------------------------------------------------ */
/* The frame's form is four fields on rules, 1120 wide inside the 1520, with
   the label above the value rather than floating in it — so the label is a
   real <label> and nothing depends on a placeholder being visible. */
const field = ([id, label, ph, type, auto, req]) => {
  const a = `id="cf-${id}" name="${id}" autocomplete="${auto}"${req ? ' required' : ''} placeholder="${esc(ph)}"`
  return `            <p class="cf-field">
              <label class="cf-label" for="cf-${id}">${esc(label)}${req ? '' : ' <span class="cf-opt">(optional)</span>'}</label>
              ${type === 'textarea'
    ? `<textarea class="cf-input" ${a} rows="3" maxlength="5000"></textarea>`
    : `<input class="cf-input" ${a} type="${type}" maxlength="${type === 'email' ? 254 : 200}" />`}
            </p>`
}

const contactBody = (p) => `
      <section class="band band-page">
        <div class="wrap">
          <div class="page-head reveal">
            <h1>${esc(p.title)}</h1>
            <p class="page-lead">${esc(p.lead)}</p>
          </div>

          <form class="cf reveal" method="post" action="/api/contact" data-form="contact">
            <input type="hidden" name="kind" value="contact" />
${p.form.map(field).join('\n')}
${honeypot('cf')}
            <p class="cf-send">
              <button class="cf-btn" type="submit">Send message ${ARROW}</button>
            </p>
            <p class="form-status" role="status" aria-live="polite"></p>
          </form>
${outcome('cf', p.sent)}

          <div class="cf-channels reveal">
${p.channels.map(([h, s, links], i) => `            <div class="cf-channel">
              <h2>${i === 0 ? `<a href="mailto:${esc(h)}">${esc(h)}</a>` : esc(h)}</h2>
              <p>${esc(s)}</p>
${links ? `              <ul class="cf-links">
${links.map(([label, href]) => `                <li><a href="${href}">${esc(label)} ${ARROW}</a></li>`).join('\n')}
              </ul>` : ''}
            </div>`).join('\n')}
          </div>
        </div>
      </section>`

/* ---- terms and privacy -------------------------------------------------- */
/* Both frames are the same object: a head, the dashed placeholder warning,
   then a 330 index and a column of clauses 120 apart. Three kinds of clause —
   a numbered one, the definition list, and the boxed one the frame marks READ
   THIS ONE — plus the 20px spacers, which the copy file carries because the
   frame puts them in an irregular pattern.

   The index is derived from the clause list rather than written twice: in the
   frame they are the same list. */
const indexOf = (blocks) => blocks.flatMap((b) => {
  if (b[0] === 'part') return [`                <li class="lg-index-part">PART ${esc(b[1])} \u00B7 ${esc(b[2])}</li>`]
  if (b[0] === 'sp') return []
  return [`                <li><a href="#clause-${b[1]}">${esc(b[1])}. ${esc(b[2])}</a></li>`]
})

const blockOf = (b) => {
  if (b[0] === 'sp') return '              <div class="lg-sp" aria-hidden="true"></div>'

  if (b[0] === 'part') return `              <div class="lg-part">
                <p class="lg-part-n">${esc(b[1])}</p>
                <div class="lg-part-t">
                  <h2>${esc(b[2])}</h2>
                  <p>${esc(b[3])}</p>
                </div>
              </div>`

  if (b[0] === 'defs') return `              <section class="lg-defs" id="clause-${b[1]}">
                <h3>${esc(b[1])}. ${esc(b[2])}</h3>
                <div class="lg-sp" aria-hidden="true"></div>
                <dl class="lg-def-list">
${b[3].map(([t, d]) => `                  <div class="lg-def"><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join('\n')}
                </dl>
              </section>`

  if (b[0] === 'callout') return `              <section class="lg-callout" id="clause-${b[1]}">
                <p class="lg-callout-k">READ THIS ONE</p>
                <h3>${esc(b[1])}. ${esc(b[2])}</h3>
                <p class="lg-callout-p">${esc(b[3])}</p>
              </section>`

  return `              <section class="lg-clause" id="clause-${b[1]}">
                <p class="lg-n">${esc(b[1])}</p>
                <div class="lg-c">
                  <h3>${esc(b[2])}</h3>
                  <p>${esc(b[3])}</p>
                </div>
              </section>`
}

const legalBody = (p) => `
      <section class="band lg">
        <div class="wrap">
          <div class="lg-head reveal">
            <p class="eyebrow">${esc(p.eyebrow)}</p>
            <h1>${esc(p.title)}</h1>
            <p class="lg-sub">${esc(p.sub)}</p>
          </div>

          <div class="lg-warn reveal">
            <p class="lg-warn-k">${esc(p.warning[0])}</p>
            <p class="lg-warn-p">${esc(p.warning[1])}</p>
          </div>

          <div class="lg-split">
            <nav class="lg-index reveal" aria-labelledby="lg-index-h">
              <p class="lg-index-k" id="lg-index-h">On this page</p>
              <ol>
${indexOf(p.blocks).join('\n')}
              </ol>
            </nav>

            <div class="lg-clauses reveal">
${p.blocks.map(blockOf).join('\n')}
            </div>
          </div>
        </div>
      </section>`

/* ---- not found ---------------------------------------------------------- */
/* Vercel serves 404.html for any address that matches nothing, at that
   address — /products/nope/deeper as readily as /nope — so every asset on this
   page is written from the root rather than relative to where it was asked
   for. The generated pages are written relative; this one cannot be. */
const notFound = () => {
  const body = `
      <section class="band nf">
        <div class="wrap nf-in">
          <p class="eyebrow">404</p>
          <h1>This page is not here.</h1>
          <p class="page-lead">The link may be old, or the address mistyped. Everything Tokkenly does is a click from the home page.</p>
          <div class="cta-row">
            <a class="btn btn-ink" href="/">Go to the home page</a>
            <a class="btn btn-white" href="/contact">Ask us</a>
          </div>
          <ul class="nf-links">
${PRODUCTS.map((p) => `            <li><a href="/products/${p.slug}">${esc(p.nav)} ${ARROW}</a></li>`).join('\n')}
          </ul>
        </div>
      </section>`
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${head({ title: 'Page not found — Tokkenly', desc: 'This page is not here. Everything Tokkenly does is a click from the home page.', path: null, image: DEFAULT_IMAGE, up: '/', noindex: true, body })}
  </head>
  <body>
    <a class="skip" href="#main">Skip to content</a>
${nav('/', null)}

    <main id="main">
      <span id="top"></span>
${body}
    </main>
${footer('/')}

    <script src="/site.js"></script>
  </body>
</html>
`
}

/* ---- for crawlers ------------------------------------------------------- */
/* The sitemap lists every page a search engine is welcome to: the home page,
   the six products and the company pages. Terms and Privacy carry noindex
   while they are drafts, so they are left out of it, and so is the 404. */
const sitemap = () => {
  const paths = ['/', ...PRODUCTS.map((p) => '/products/' + p.slug),
    ...Object.values(PAGES).filter((p) => !p.noindex).map((p) => '/' + p.slug)]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((u) => `  <url><loc>${pageUrl(u)}</loc></url>`).join('\n')}
</urlset>
`
}
/* /api/ is the contact function: nothing there is a page. The drafts are kept
   out of results by their own noindex, not here — a Disallow would stop a
   crawler reading the noindex and could leave the bare URL listed. */
const robots = () => `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`

const BODY = { about: aboutBody, blog: blogBody, contact: contactBody, terms: legalBody, privacy: legalBody }
/* About is the one page whose first section is dark, so the bar over it is
   the light-on-dark one until it goes solid. */
const NAVTONE = { about: ' data-navtone="over-dark"' }
/* What a shared link to a page without a picture of its own shows: the globe
   from the landing page's hero. */
const DEFAULT_IMAGE = 'hero/globe.webp'

function page(p) {
  const body = BODY[p.slug](p) + '\n' + close(p)
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${head({ title: `${p.nav} — Tokkenly`, desc: p.meta, path: '/' + p.slug, image: p.image || DEFAULT_IMAGE, up: './', noindex: p.noindex, body })}
  </head>
  <body${NAVTONE[p.slug] || ''}>
    <a class="skip" href="#main">Skip to content</a>
${nav('./', p.slug)}

    <main id="main">
      <span id="top"></span>
${body}
    </main>
${footer('./')}

    <script src="./site.js"></script>
  </body>
</html>
`
}

/* `--check` writes nothing and reports any committed page this script would
   not produce.

   checkProps above asks whether the stylesheet has a placement for every prop
   a page emits. This asks the other half: whether the file on disk is still
   the file this script makes. They are generated AND committed, so an edit
   made to one of them by hand survives exactly until the next person runs the
   builder — and that is not a hypothetical. The eight product pages were
   fixed for the cta variants by hand, and a regeneration one commit later,
   made for a footer link, took the fix back out of all eight without a word.

   These five are more exposed than they look: their nav and footer are
   imported from build-products.mjs, so a routing change regenerates both
   sets, which is precisely the edit that did the damage last time. */
const check = process.argv.includes('--check')
checkProps()
const stale = []
const OUTPUTS = [
  ...Object.values(PAGES).map((p) => [`${p.slug}.html`, sized(page(p))]),
  ['404.html', sized(notFound())],
  ['sitemap.xml', sitemap()],
  ['robots.txt', robots()],
]
for (const [name, text] of OUTPUTS) {
  const file = resolve(HERE, name)
  if (check) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== text) stale.push(name)
    continue
  }
  writeFileSync(file, text)
  console.log('wrote ' + name)
}
if (check) {
  if (stale.length) {
    console.error('STALE — edited by hand, or built from an older copy: ' + stale.join(', '))
    console.error('Run `node site/build-pages.mjs` and commit what it writes.')
    process.exit(1)
  }
  console.log(`${OUTPUTS.length} files, all in step with the builder`)
}
