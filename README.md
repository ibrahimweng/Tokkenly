# Tokkenly

Stablecoin and stocks, for Nigeria. Hold dollars, buy fractions of real shares,
earn on what is idle, borrow against what you own, and cash out to a Nigerian
bank.

```
app/          the product: Vite + TypeScript, no framework
site/         the marketing site: static pages, two of whose generators
              (build-pages.mjs, build-products.mjs) write the HTML that is
              committed; served as it stands, no build on deploy
design.md     the design record: every screen, every figure, the numbered rules
docs/prd.md   the product requirements the build started from
CLAUDE.md     project memory
vercel.json   deployment of the app
```

## Running it

Node 20.19 or later (`.nvmrc` says 22).

```bash
npm install        # installs app/'s dependencies (a postinstall runs npm ci in app/)
npm run dev        # http://localhost:5173, this machine only
npm run build      # typecheck, then bundle to app/dist
npm run typecheck
npm run lint       # ESLint, and a parse check of every script
npm test           # every suite against a fresh preview of app/dist
```

Every script at the root delegates to `app/` without reinstalling anything. You
can also work inside `app/` directly, where the scripts are the same. To reach
the dev server from a phone on the same network, opt in from `app/`:
`npm run dev -- --host`.

## Deploying

It is a static bundle, so any host will do. For Vercel, either import setting
works and the repository carries the config for both:

| Root Directory | Reads | Builds |
|---|---|---|
| repository root (default) | `vercel.json` | `cd app && npm ci && npm run build` → `app/dist` |
| `app` | `app/vercel.json` | `npm ci`, then Vite detected → `dist` |

The marketing site in `site/` is a **second Vercel project** on this same
repository, with Root Directory set to `site` — no build command, no install,
the folder served as it stands. Two projects, two addresses, one branch, and
neither replaces the other: they are different directories and cannot collide.
See `site/README.md`.

Three details that matter.

- **Dev dependencies are installed on deploy**, because the build needs Vite
  and TypeScript. Playwright is among them, but it costs only its package:
  Playwright has no install hook and downloads no browser unless somebody runs
  `npx playwright install`. (An earlier version of this README said the
  opposite and set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` to stop a download that
  never happened; it is gone.)
- **Every path is rewritten to `index.html`**, so a link typed without a hash
  gets the app rather than a 404. With no hash, the router reads the path as
  the route it names, so `/market/aapl?sheet=x` opens `#/market/aapl?sheet=x`;
  only a path the app has no screen for opens at Home.
- **Headers.** Both configs send `X-Frame-Options: DENY` and
  `frame-ancestors 'none'`, `nosniff`, a strict referrer policy, a
  Permissions-Policy that turns off camera, microphone, location and payment,
  and HSTS. `/assets/*` is content-hashed and cached for a year as immutable;
  everything else is `no-cache`, so a deploy is seen on the next load. The
  Content Security Policy proper is written into the built `index.html` by
  `app/vite.config.ts`, because it names the inline theme script by a hash
  that has to be computed from the script as built. No sourcemaps are built or
  deployed.

## Checking it

`npm test` builds nothing: it starts `vite preview` on a free port against
`app/dist`, runs every suite in `app/scripts` one after another against it, and
prints one line per suite. It exits non-zero if any check fails or any suite
crashes. Build first.

```bash
npm run build && npm test
npm test -- flows walk                         # some suites, by name
cd app && BASE_URL=http://localhost:4173 node scripts/flows.mjs
                                               # one suite, against a server you started
```

The suites drive a real Chromium against the built bundle rather than
inspecting source. What they share lives in `app/scripts/lib/harness.mjs`, and
all of it is set by the environment:

| Variable | Means | Default |
|---|---|---|
| `BASE_URL` | the app to drive | a fresh preview under `npm test`; `http://localhost:4173` for a suite run on its own |
| `CHROMIUM` | the browser to launch | Playwright's own, else `/opt/pw-browsers/chromium` |
| `SHOTS` | where screenshots go | `app/shots/` (ignored by git) |
| `DIST` | the build `npm test` serves | `app/dist` |
| `VERBOSE` | print every suite's whole output | only the failures |

Running them needs a Chromium: `cd app && npx playwright install chromium`, or
point `CHROMIUM` at one you already have. CI (`.github/workflows/ci.yml`) runs
typecheck, lint, build and `npm test` on every push, and a second job checks
the marketing site.

### Making something fail

Which movements fail is deterministic, so every unhappy path is reachable on
purpose rather than one run in ten. The rule is carried on the cents, the way a
payment sandbox uses a magic value, so any amount becomes a failure by changing
the pennies:

| Amount | What happens |
|---|---|
| ends `.99` | the bank declines. Nothing is written and nothing leaves. |
| ends `.98` | no answer in time. Recorded unsettled, it sits in Still settling for two minutes, and is then reversed: the money comes back and so does the part of your limit it used. |
| anything else | settles. |

It applies to payments and trades — the movements with somebody else in the
middle, including a send to another Tokkenly account, which can go unanswered
like any other. Moving your own money between your own buckets has nobody to
decline it.

Signing in works the same way. Any email and password gets you in, except one:

| Password | What happens |
|---|---|
| `wrong` | the sign-in is refused, and says so under the fields. |
| anything else | you are in, after the moment it takes to look busy. |

An account starts unverified, and unverified accounts have a single-payment
limit that caps every amount crossing into or out of the account, borrowing
included. A suite that wants the amount it typed to be the amount that moves
walks the identity check first (`verify()` in `app/scripts/lib/seen.mjs`).
