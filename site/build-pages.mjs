/* The company and legal pages.
   ---------------------------------------------------------------------------
   Words live in copy-pages.mjs, and every one of them is the word in Figma.
   The nav and the footer are imported from build-products.mjs rather than
   copied, so a routing change is made once and every page in the site gets it.

   Frames: About us 397:559, Blog 391:559, Contact us 394:780, Terms of service
   399:559, Privacy policy 399:785. Each closes on the shared slab, using the
   variant named in its copy entry — the gradient pairing and the arrangement
   of the 3D props are the per-page variation asked for separately, so those
   come from the stylesheet rather than from the frame, and only the slab's
   headline, lead and button label are the frame's. */
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGES, EMAIL } from './copy-pages.mjs'
import { APP_URL } from './copy-products.mjs'
import { nav, footer } from './build-products.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const esc = (s) => String(s).replace(/&(?![a-z#][a-z0-9]*;)/gi, '&amp;').replace(/</g, '&lt;')
/* The About headline is broken by hand in the frame. */
const lines = (s) => esc(s).split('\n').join('<br />')
const ARROW = '<svg class="pr-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>'

/* ---- the close --------------------------------------------------------- */
const PROP_SIZE = { coin: [967, 1024], globe: [1024, 1024], gun: [799, 1024], notes: [488, 488] }

const close = (p) => {
  const [h, lead, label] = p.close
  const href = label === 'Contact us' ? './contact.html' : APP_URL
  return `
      <section class="closing" data-cta="${p.cta}">
        <div class="wrap">
          <div class="closing-slab reveal">
${p.props.map(([name, anchor]) => {
    const [w, hh] = PROP_SIZE[name]
    return `              <img class="cta-prop cta-${name} ${anchor}" src="./img/hero/${name}.webp" width="${w}" height="${hh}" loading="lazy" alt="" aria-hidden="true" />`
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
/* Masthead (443:494): a dark section the photograph fills, 1024 tall at 1920,
   with the picture 2153.863 wide and 1211.548 high centred on it and clipped —
   so it is placed as a share of the section rather than at a fixed size, and
   goes on overflowing the bottom edge at every width.

   Values (397:605): three columns of 506 in the 1520, each a rule with the
   words stopping 48 short of the next one. */
const aboutBody = (p) => `
      <section class="ab-mast">
        <img class="ab-mast-img" src="./img/about/masthead.webp" width="1264" height="722" alt="" aria-hidden="true" />
        <div class="wrap ab-mast-in">
          <div class="ab-mast-text reveal">
            <p class="eyebrow eyebrow-mint">${esc(p.eyebrow)}</p>
            <h1>${esc(p.title)}</h1>
            <div class="ab-mast-body">
${p.leads.map((l, i) => `              <p class="ab-lead-${i + 1}">${esc(l)}</p>`).join('\n')}
            </div>
          </div>
        </div>
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
            <p class="eyebrow">${esc(p.values.eyebrow)}</p>
            <h2>${esc(p.values.h)}</h2>
            <p class="ab-values-intro">${esc(p.values.intro)}</p>
          </div>
          <div class="ab-grid reveal">
${p.values.items.map(([cat, h, t]) => `            <div class="ab-value">
              <p class="ab-cat">${esc(cat)}</p>
              <h3>${esc(h)}</h3>
              <p class="ab-p">${esc(t)}</p>
            </div>`).join('\n')}
          </div>
        </div>

        <div class="wrap ab-narrative">
          <img class="ab-photo reveal" src="./img/about/narrative.webp" width="864" height="1184" loading="lazy" alt="" aria-hidden="true" />
          <div class="ab-narrative-t reveal">
            <p class="eyebrow">${esc(p.narrative.eyebrow)}</p>
            <h2>${esc(p.narrative.h)}</h2>
${p.narrative.ps.map((t) => `            <p>${esc(t)}</p>`).join('\n')}
          </div>
        </div>
      </section>`

/* ---- blog --------------------------------------------------------------- */
/* Six posts, three across at 485 with 32 between and 56 down. The frame's
   thumbnails are empty grey rectangles — the artwork has not been chosen — so
   they are empty grey rectangles here too rather than something invented to
   fill them. */
const blogBody = (p) => `
      <section class="band bl">
        <div class="wrap">
          <div class="bl-head reveal">
            <h1>${esc(p.title)}</h1>
            <p class="bl-lead">${esc(p.lead)}</p>
          </div>

          <div class="bl-filters reveal">
${p.filters.map((f, i) => `            <button class="bl-chip${i === 0 ? ' is-on' : ''}" type="button"${i === 0 ? ' aria-pressed="true"' : ' aria-pressed="false"'}>${esc(f)}</button>`).join('\n')}
          </div>

          <div class="bl-grid reveal">
${p.posts.map(([cat, title, meta]) => `            <article class="bl-post">
              <span class="bl-thumb" aria-hidden="true"></span>
              <p class="bl-cat">${esc(cat)}</p>
              <h2 class="bl-title">${esc(title)}</h2>
              <p class="bl-meta">${esc(meta)}</p>
            </article>`).join('\n')}
          </div>

          <div class="bl-news reveal">
            <h2>${esc(p.newsletter.h)}</h2>
            <p class="bl-news-p">${esc(p.newsletter.p)}</p>
            <form class="bl-form" method="post" action="mailto:${EMAIL}">
              <label class="bl-vh" for="bl-email">Email</label>
              <input class="bl-input" id="bl-email" name="email" type="email" placeholder="${esc(p.newsletter.ph)}" />
              <button class="btn btn-deep bl-sub" type="submit">${esc(p.newsletter.btn)}</button>
            </form>
          </div>
        </div>
      </section>`

/* ---- contact ------------------------------------------------------------ */
/* The frame's form is four fields on rules, 1120 wide inside the 1520, with
   the label above the value rather than floating in it — so the label is a
   real <label> and nothing depends on a placeholder being visible. */
const field = ([id, label, ph, type]) => type === 'textarea'
  ? `            <p class="cf-field">
              <label class="cf-label" for="cf-${id}">${esc(label)}</label>
              <textarea class="cf-input" id="cf-${id}" name="${id}" rows="3" placeholder="${esc(ph)}"></textarea>
            </p>`
  : `            <p class="cf-field">
              <label class="cf-label" for="cf-${id}">${esc(label)}</label>
              <input class="cf-input" id="cf-${id}" name="${id}" type="${type}" placeholder="${esc(ph)}" />
            </p>`

const contactBody = (p) => `
      <section class="band band-page">
        <div class="wrap">
          <div class="page-head reveal">
            <h1>${esc(p.title)}</h1>
            <p class="page-lead">${esc(p.lead)}</p>
          </div>

          <form class="cf reveal" method="post" action="mailto:${EMAIL}">
${p.form.map(field).join('\n')}
            <p class="cf-send">
              <button class="cf-btn" type="submit">Send message ${ARROW}</button>
            </p>
          </form>

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

const BODY = { about: aboutBody, blog: blogBody, contact: contactBody, terms: legalBody, privacy: legalBody }
/* About is the one page whose first section is dark, so the bar over it is
   the light-on-dark one until it goes solid. */
const NAVTONE = { about: ' data-navtone="over-dark"' }

function page(p) {
  const title = `${p.nav} — Tokkenly`
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(p.meta)}" />
    <link rel="icon" href="./favicon.svg" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(p.meta)}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preload" href="./fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body${NAVTONE[p.slug] || ''}>
    <a class="skip" href="#main">Skip to content</a>
${nav('./', null)}

    <main id="main">
      <span id="top"></span>
${BODY[p.slug](p)}
${close(p)}
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
for (const p of Object.values(PAGES)) {
  const file = resolve(HERE, `${p.slug}.html`)
  const html = page(p)
  if (check) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== html) stale.push(p.slug)
    continue
  }
  writeFileSync(file, html)
  console.log('wrote ' + p.slug + '.html')
}
if (check) {
  if (stale.length) {
    console.error('STALE — edited by hand, or built from an older copy: ' + stale.join(', '))
    console.error('Run `node site/build-pages.mjs` and commit what it writes.')
    process.exit(1)
  }
  console.log(`${Object.keys(PAGES).length} pages, all in step with the builder`)
}
