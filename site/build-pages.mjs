/* The company and legal pages.
   ---------------------------------------------------------------------------
   Words live in copy-pages.mjs. The nav and the footer are imported from
   build-products.mjs rather than copied, so a routing change is made once and
   every page in the site gets it.

   Each page closes on the shared slab, using the variant named in its copy
   entry — the pairing and the prop arrangement come from the stylesheet. */
import { writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PAGES } from './copy-pages.mjs'
import { APP_URL } from './copy-products.mjs'
import { nav, footer } from './build-products.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const esc = (s) => String(s).replace(/&(?![a-z#][a-z0-9]*;)/gi, '&amp;').replace(/</g, '&lt;')
const ARROW = '<svg class="pr-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg>'

/* ---- the close --------------------------------------------------------- */
/* Same three props as the landing page's own close. The variant on the
   section is what changes the pairing and where they sit. */
const PROP_SIZE = { coin: [967, 1024], globe: [1024, 1024], gun: [799, 1024], notes: [488, 488] }

const close = (p) => `
      <section class="closing" data-cta="${p.cta}">
        <div class="wrap">
          <div class="closing-slab reveal">
${p.props.map(([name, anchor]) => {
  const [w, h] = PROP_SIZE[name]
  return `            <img class="cta-prop cta-${name} ${anchor}" src="./img/hero/${name}.webp" width="${w}" height="${h}" loading="lazy" alt="" aria-hidden="true" />`
}).join('\n')}
            <div class="closing-in">
              <h2>${esc(p.close[0])}</h2>
              <p class="closing-lead">${esc(p.close[1])}</p>
              <a class="btn btn-deep" href="${APP_URL}">Get Started</a>
            </div>
          </div>
        </div>
      </section>`

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

/* ---- contact ------------------------------------------------------------ */
/* The frame's form is four fields on rules, 1120 wide inside the 1520, with
   the label above the value rather than floating in it — so the label is a
   real <label> and nothing depends on a placeholder being visible. */
const field = ([id, label, ph, type]) => type === 'textarea'
  ? `            <p class="cf-field cf-field-lg">
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
            <p class="lead page-lead">${esc(p.lead)}</p>
          </div>

          <form class="cf reveal" method="post" action="mailto:${p.channels[0][0]}">
${p.form.map(field).join('\n')}
            <p class="cf-send">
              <button class="cf-btn" type="submit">Send message ${ARROW}</button>
            </p>
          </form>

          <div class="cf-channels reveal">
${p.channels.map(([h, s], i) => `            <div class="cf-channel">
              <h2>${i === 0 ? `<a href="mailto:${esc(h)}">${esc(h)}</a>` : esc(h)}</h2>
              <p>${esc(s)}</p>
            </div>`).join('\n')}
          </div>
        </div>
      </section>`

/* ---- terms and privacy -------------------------------------------------- */
/* One column of prose at a readable measure, with the headings numbered by
   the list itself so adding a clause never means renumbering by hand. */
const proseBody = (p) => `
      <section class="band band-page">
        <div class="wrap">
          <div class="page-head page-head-left reveal">
            <h1>${esc(p.title)}</h1>
            <p class="lead page-lead">${esc(p.lead)}</p>
            <p class="page-updated">${esc(p.updated)}</p>
          </div>

          <ol class="prose reveal">
${p.sections.map(([h, ps]) => `            <li class="prose-part">
              <h2>${esc(h)}</h2>
${ps.map((t) => `              <p>${esc(t)}</p>`).join('\n')}
            </li>`).join('\n')}
          </ol>
        </div>
      </section>`

const BODY = { contact: contactBody, terms: proseBody, privacy: proseBody }

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
  <body>
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

checkProps()
for (const p of Object.values(PAGES)) {
  writeFileSync(resolve(HERE, `${p.slug}.html`), page(p))
  console.log('wrote ' + p.slug + '.html')
}
