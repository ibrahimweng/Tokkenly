# Tokkenly — marketing site

The landing page. One static document: no framework, no build step, no
dependencies. `index.html`, `styles.css`, `site.js`, and the pictures.

```
index.html   the page, in the order the copy is written
styles.css   the product's light theme, applied to a website
site.js      the bar, the two menus, and the scroll reveal
img/         screenshots of the real product, in light mode
fonts/       Geist, the same two files the app serves
```

## Where it comes from

**The words** are the landing page copy, used as written — headings,
subheadings, product blurbs, the six questions, the footer, all verbatim.

**The layout** follows onboard.xyz: a fixed bar with a Products dropdown, a
centred hero over one large picture of the real thing, sections that alternate
between a full-width statement and a row of cards, the product list as a
numbered 01–06 grid, an accordion for the questions, a closing call to action,
and a multi-column footer.

**The colour** is the product's own light theme, lifted from
`app/src/styles/tokens.css` rather than picked again — the same canvas, ink,
accent, and sand. **The type** is the product's own face, Geist, and nothing
but it: one sans-serif family, two weights, no serif anywhere.

**The pictures** are screenshots of the actual app running in light mode, not
mockups, so the site cannot drift from the product without somebody noticing.

## Running it

Any static server. There is nothing to compile.

```bash
cd site && python3 -m http.server 4321   # http://localhost:4321
```

## Checking it

Four scripts in `app/scripts`, in the manner of the suites that check the app.
They drive a real browser against the served page.

```bash
# the pictures: against a built app on :4173
cd app && npm run build && npx vite preview --port 4173 &
node scripts/_siteshots.mjs      # capture every screen, light theme, 2x
node scripts/_siteopt.mjs        # scale to the width shown, re-encode to WebP

# the page: against the site on :4321
node scripts/_sitecheck.mjs      # 1440/834/390: broken images, overflow, errors
node scripts/_siteinteract.mjs   # the menus, the accordion, the anchors
node scripts/_sitecopy.mjs       # every line of copy.txt is on the page
```

`copy.txt` is the landing page copy as delivered. The brief was to use it as
written, and `_sitecopy.mjs` is what holds the page to that: it reads the
rendered text and fails if a line has gone missing or been tidied.

## Deploying

This directory is deployed on its own, separately from the app at the
repository root. On Vercel, create a project from this repository and set
**Root Directory** to `site`. Framework preset is *Other*; there is no build
command and no install step. `site/vercel.json` carries the rest.

The repository root still builds the product app, so the two deploy from the
same repository without touching each other.

## Why the product list is drawn rather than photographed

Every other section on the page is photographed. The six products under "Your
money, free to do more" are the exception: a number, a line icon, the words,
and a link.

That is a choice about density, not availability — all six have real screens
now, `/spend` included, so any of them could be photographed. But three
sections in a row of phone screenshots is a catalogue rather than a page, and
Onboard draws its own numbered 01–06 run with icons for the same reason: it is
the section you scan, not the one you look at. Receive, Send and Convert are
photographed a screen later under "Money movement" regardless.

If the client would rather see six pictures there, `_siteshots.mjs` takes them
and the card markup has room — it is an hour, not a rewrite.

## Still to come

The links to pages that do not exist yet — Blog, Terms of service, Privacy
policy — are inert rather than broken. `Sign up` and `Get Started` point at the
Getting started section; swap the `href` for the real app URL when there is
one.

## The root `vercel.json` on this branch

The copy of `vercel.json` at the repository root is **different on this branch
than on `main`**. On `main` it builds the app in `app/`. Here it serves `site/`.

That is a workaround, not a preference. Vercel's Root Directory picker only
lists folders that exist on the repository's default branch, and `site/` is not
on `main` — so `site` cannot be chosen there. Pointing the repository root at
`site/` is the way round it, and lets a project with Root Directory left at the
repository root deploy this page.

**If this branch is ever merged into `main`, keep `main`'s version of that
file.** Bringing this one along would stop the app deploying. The long-term
answer is a second Vercel project with Root Directory set to `site`, which
becomes available the moment `site/` exists on `main`.
