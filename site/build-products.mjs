/* Seven product pages from one template.
 *
 *  There are no product page designs in Figma — only Landing, Blog, About us,
 *  Terms, Contact and Privacy exist — so these are built in code from one
 *  shape, using the copy that is already in the client's document. When a
 *  design does arrive for any one of them, that page can be written by hand
 *  and dropped out of this list without disturbing the other six.
 *
 *  The output is committed. The site has no build step and serving it must
 *  not need one; this script only regenerates the files when the shared
 *  chrome or the copy changes.
 *
 *      node build-products.mjs
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(HERE, 'products')

/* The dropdown and the footer both read this, so a product cannot exist in
   one and not the other. Order is the client's document's order. */
export const PRODUCTS = [
  {
    slug: 'tokenized-stocks',
    nav: 'Tokenized Stocks',
    eyebrow: 'Tokenized Stocks',
    title: 'From Nigeria to Wall Street.',
    lead:
      'The companies on your radar can be part of your portfolio. Invest in tokenized stocks linked to companies listed in Nigeria and the US, right from Tokkenly.',
    shot: 'invest.webp',
    shotWide: true,
    shotAlt: 'The Invest screen, listing tokenized stocks available to browse.',
    points: [
      ['Two markets. More choice.', 'Find tokenized stocks linked to Nigerian and US companies in one place. Follow your interests across markets.'],
      ['Know what you’re buying.', 'See what each tokenized stock represents and review its terms and risks. Make your choice with the details in front of you.'],
      ['Investing meets everyday money.', 'Your portfolio, naira and stablecoins belong in the same conversation. Keep them together with the tools to receive, send and pay.'],
    ],
    second: 'stock.webp',
    secondAlt: 'A single tokenized stock, with its price history and product details.',
  },
  {
    slug: 'receive',
    nav: 'Receive',
    eyebrow: 'Receive',
    title: 'Get paid. Get on with life.',
    lead: 'Receive payments and transfers into Tokkenly. Put that money towards an investment, a bill, or someone who needs it.',
    shot: 'p-receive.webp',
    shotAlt: 'Receiving money into a Tokkenly account on a phone.',
    points: [
      ['Money lands where it is already useful.', 'What arrives is in the same app as your portfolio and your bills, so the next step is one tap rather than another transfer.'],
      ['Naira or stablecoins.', 'Take what you are sent in either, and convert between them when it suits you rather than when it arrives.'],
      ['Nothing to chase.', 'Every payment shows who sent it, what it cost and when it cleared, kept with the rest of your record.'],
    ],
  },
  {
    slug: 'send',
    nav: 'Send',
    eyebrow: 'Send',
    title: 'Make someone’s day.',
    lead: 'Help family out. Pay a friend back. Send money from the same app where you keep and invest it.',
    shot: 'p-send.webp',
    shotAlt: 'Sending money to someone from the Tokkenly app on a phone.',
    points: [
      ['See the whole cost first.', 'The amount, the fee and what actually arrives are on the screen before you send, not after.'],
      ['Usually about a minute.', 'Transfers inside Tokkenly settle in the time it takes to put your phone away.'],
      ['From the money you already hold.', 'Send from naira or from stablecoins without moving anything to another app first.'],
    ],
  },
  {
    slug: 'pay-bills',
    nav: 'Pay bills',
    eyebrow: 'Pay bills',
    title: 'One less thing on your list.',
    lead: 'Take care of everyday bills in Tokkenly and get back to your day. Your money is already here. Your bill payments can be too.',
    shot: 'p-bills.webp',
    shotAlt: 'Paying a bill from the Tokkenly app on a phone.',
    points: [
      ['The bills you actually have.', 'Airtime, data, power and the rest of the monthly list, paid from the balance you keep here.'],
      ['A record that adds up.', 'Every payment sits in the same history as everything else, so the month is one list rather than five.'],
      ['No second app for it.', 'Nothing to top up somewhere else and nothing to move first.'],
    ],
  },
  {
    slug: 'earn',
    nav: 'Earn',
    eyebrow: 'Earn',
    title: 'Put idle stablecoins to work.',
    lead: 'Explore earning opportunities for the stablecoins you hold. Review the terms, choose an amount, and keep track in Tokkenly.',
    shot: 'p-earn.webp',
    shotAlt: 'The earning screen in the Tokkenly app, with the rate and the terms.',
    points: [
      ['The terms before the decision.', 'Rate, duration and what you can withdraw are on the screen while you choose the amount, not buried after it.'],
      ['Commit what you want to.', 'Put a part of what you hold to work and leave the rest where it is.'],
      ['Follow it without hunting.', 'What you have committed and what it has earned sit with the rest of your money.'],
    ],
    risk: true,
  },
  {
    slug: 'borrow',
    nav: 'Borrow',
    eyebrow: 'Borrow',
    title: 'Give yourself some breathing room.',
    lead: 'When you need extra funds, explore borrowing in Tokkenly. Review the costs and repayment terms before choosing what works for you.',
    shot: 'p-borrow.webp',
    shotAlt: 'The borrowing screen in the Tokkenly app, showing the rate and the repayment terms.',
    points: [
      ['Your shares stay yours.', 'They keep earning while you borrow. They are only sold if they fall to the level shown to you up front.'],
      ['The cost in money, not percentages.', 'The rate is there, and so is what it comes to a month, before you agree to anything.'],
      ['Repay when you can.', 'Any time, no fee, as much or as little as suits the month.'],
    ],
    risk: true,
  },
  {
    slug: 'convert',
    nav: 'Convert',
    eyebrow: 'Convert',
    title: 'Change currencies. Keep your plans.',
    lead: 'Move between naira and stablecoins for the way you want to use your money. Spend, send, or invest from one app.',
    shot: 'p-wallet.webp',
    shotAlt: 'The Wallet screen, showing naira and stablecoins side by side.',
    points: [
      ['The rate you are getting.', 'Shown before you convert, with what you will hold afterwards, so there is nothing to work out yourself.'],
      ['Both directions.', 'Naira to stablecoins for what is next, stablecoins to naira for what is now.'],
      ['Then straight on with it.', 'What you convert is ready to invest, send or spend without another step.'],
    ],
  },
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* --------------------------------------------------------------- chrome -- */
/* `up` is the path back to the site root: the pages live one folder down. */
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
                <span class="dm-name">${esc(p.nav)}</span>
                <span class="dm-say">${esc(p.title)}</span>
              </a>`).join('\n')}
            </div>
          </div>
          <a href="${up}index.html#why">About us</a>
          <a href="${up}index.html#" data-soon>Blog</a>
          <a href="${up}index.html#faq">Help</a>
        </nav>

        <div class="nav-end">
          <a class="btn btn-mint btn-sm" href="${up}index.html#get-started">Sign up</a>
          <button class="burger" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Menu">
            <span></span><span></span>
          </button>
        </div>
      </div>

      <div class="mobile-menu" id="mobile-menu" hidden>
        <p class="mm-head">Products</p>
${PRODUCTS.map((p) => `        <a href="${up}products/${p.slug}.html">${esc(p.nav)}</a>`).join('\n')}
        <p class="mm-head">Company</p>
        <a href="${up}index.html#why">About us</a>
        <a href="${up}index.html#" data-soon>Blog</a>
        <a href="${up}index.html#faq">Help</a>
        <a class="btn btn-mint mm-cta" href="${up}index.html#get-started">Sign up</a>
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
${PRODUCTS.slice(0, 4).map((p) => `                  <a href="${up}products/${p.slug}.html">${esc(p.nav)}</a>`).join('\n')}
                </div>
                <div>
${PRODUCTS.slice(4).map((p) => `                  <a href="${up}products/${p.slug}.html">${esc(p.nav)}</a>`).join('\n')}
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

/* ----------------------------------------------------------------- page -- */
function page(p) {
  const up = '../'
  const others = PRODUCTS.filter((x) => x.slug !== p.slug).slice(0, 3)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(p.nav)} — Tokkenly</title>
    <meta name="description" content="${esc(p.lead)}" />
    <link rel="icon" href="${up}favicon.svg" />
    <meta property="og:title" content="${esc(p.nav)} — Tokkenly" />
    <meta property="og:description" content="${esc(p.lead)}" />
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

      <!-- The product hero is the landing hero's wash and type without its
           globe: the same page, quieter, because the work here is the product
           rather than the pitch. -->
      <section class="hero hero-product">
        <div class="hero-wash" aria-hidden="true"></div>
        <div class="wrap hero-in">
          <p class="eyebrow hero-intro" style="--hero-d: 0s">${esc(p.eyebrow)}</p>
          <h1 class="hero-hl hero-product-hl hero-intro" style="--hero-d: 0.05s"><span>${esc(p.title)}</span></h1>
          <p class="lead hero-lead hero-intro" style="--hero-d: 0.1s">${esc(p.lead)}</p>
          <div class="cta-row hero-cta hero-intro" style="--hero-d: 0.2s">
            <a class="btn btn-ink" href="${up}index.html#get-started">Sign up on Tokkenly</a>
            <a class="btn btn-white" href="#how">How it works</a>
          </div>
        </div>

        <div class="prod-shot hero-intro" style="--hero-d: 0.3s">
          <figure class="shot ${p.shotWide ? 'shot-wide' : 'shot-phone'}">
            <img src="${up}img/${p.shot}" loading="eager" alt="${esc(p.shotAlt)}" />
          </figure>
        </div>
      </section>

      <section class="band band-ts" id="how">
        <div class="head reveal">
          <p class="eyebrow">How it works</p>
          <h2>What you get with ${esc(p.nav)}.</h2>
        </div>

        <div class="wrap">
          <div class="prod-points">
${p.points.map(([h, b], i) => `            <article class="prod-point reveal">
              <p class="prod-num">0${i + 1}</p>
              <h3>${esc(h)}</h3>
              <p>${esc(b)}</p>
            </article>`).join('\n')}
          </div>
        </div>
      </section>
${p.second ? `
      <section class="band">
        <div class="wrap">
          <figure class="shot shot-wide reveal">
            <img src="${up}img/${p.second}" loading="lazy" alt="${esc(p.secondAlt)}" />
          </figure>
        </div>
      </section>` : ''}
${p.risk ? `
      <section class="band band-risk">
        <div class="wrap">
          <p class="prod-risk reveal">
            <strong>Worth saying plainly.</strong> ${esc(p.nav)} carries risk. Rates change, and what you
            commit is not a deposit and is not guaranteed. The terms are on the screen before you
            agree to anything — read them.
          </p>
        </div>
      </section>` : ''}

      <section class="band">
        <div class="wrap">
          <div class="head reveal"><h2>The rest of it.</h2></div>
          <div class="prod-more">
${others.map((o) => `            <a class="prod-card reveal" href="${o.slug}.html">
              <h3>${esc(o.nav)}</h3>
              <p>${esc(o.title)}</p>
              <span class="pr-link">Explore ${esc(o.nav)} <svg class="pr-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" /></svg></span>
            </a>`).join('\n')}
          </div>
        </div>
      </section>

      <section class="closing">
        <div class="wrap">
          <div class="closing-slab reveal">
            <img class="cta-prop cta-coin" src="${up}img/cta/coin.webp" width="274" height="290" loading="lazy" alt="" aria-hidden="true" />
            <img class="cta-prop cta-pen" src="${up}img/cta/pen.webp" width="302" height="369" loading="lazy" alt="" aria-hidden="true" />
            <img class="cta-prop cta-notes" src="${up}img/cta/notes.webp" width="593" height="593" loading="lazy" alt="" aria-hidden="true" />
            <div class="closing-in">
              <h2>Make your next investment now.</h2>
              <p class="closing-lead">
                Explore tokenized stocks with Tokkenly and bring the rest of your money along
              </p>
              <a class="btn btn-deep" href="${up}index.html#get-started">Get started</a>
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
  const file = resolve(OUT, `${p.slug}.html`)
  writeFileSync(file, page(p))
  console.log('wrote products/' + p.slug + '.html')
}
console.log(PRODUCTS.length + ' pages')
