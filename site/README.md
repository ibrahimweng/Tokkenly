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

The app and the site both live on `main` and both deploy from it, to two
addresses, without either one replacing the other. One repository, two Vercel
projects, each pointed at a different folder:

| Vercel project | Root Directory | Reads | Serves |
|---|---|---|---|
| the app | repository root | `vercel.json` | `cd app && npm run build` → `app/dist` |
| the site | `site` | `site/vercel.json` | this folder, as it stands |

Adding the second project is the whole job: **Add New → Project**, import the
same repository, set **Root Directory** to `site`, framework preset *Other*, no
build command and no install command. The existing project is not touched and
does not need to know this one exists.

Two directories cannot collide, so nothing here is a compromise. The root
`vercel.json` goes on building the app and is none of this folder's business;
`site/vercel.json` covers the site and is read only when Root Directory is
`site`.

`site/vercel.json` names an install command and a build command even though
there is nothing to install and nothing to build, and both are `echo`. That is
deliberate. A key left out of `vercel.json` is not a key set to nothing — it
falls through to whatever the Vercel project has saved in its dashboard, and a
project made from this repository can easily be holding the app's
`cd app && npm ci` there. Run that from inside `site/`, where there is no
`app/`, and the deploy fails on `cd: app: No such file or directory`. Saying
both explicitly closes the door, so the folder deploys the same way whatever
the dashboard happens to remember.

One ordering detail, because it is the thing that actually catches people:
Vercel's Root Directory picker only lists folders that exist **on the
repository's default branch**. Until `site/` is merged to `main`, `site` is
simply absent from that list and cannot be chosen. Merge first, then create the
project.

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

## The root `vercel.json` is main's

Earlier in this branch's life that file was rewritten to serve `site/`, because
`site/` was not on `main` and so could not be selected as a Root Directory at
all. That was a workaround for a branch that had not landed yet, and it has
been reverted: the file here is byte-for-byte `main`'s and goes on building the
app. There is nothing to be careful about when merging.
