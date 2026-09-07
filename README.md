# Tokkenly

Stablecoin and stocks, for Nigeria. Hold dollars, buy fractions of real shares,
earn on what is idle, borrow against what you own, and cash out to a Nigerian
bank.

```
app/         the product: Vite + TypeScript, no framework
design.md    the design record: every screen, every figure, 51 rules
CLAUDE.md    project memory
vercel.json  deployment
```

## Running it

```bash
npm install        # installs app/ and builds nothing
npm run dev        # http://localhost:5173
npm run build      # typecheck, then bundle to app/dist
npm run typecheck
```

Every script at the root delegates to `app/`. You can also work inside `app/`
directly; the scripts are the same.

## Deploying

It is a static bundle, so any host will do. For Vercel, either import setting
works and the repository carries the config for both:

| Root Directory | Reads | Builds |
|---|---|---|
| repository root (default) | `vercel.json` | `cd app && npm run build` → `app/dist` |
| `app` | `app/vercel.json` | Vite detected → `dist` |

Two details that matter. Both install commands set
`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`, because Playwright is a dev dependency
whose install hook pulls about 400MB of browsers a deploy will never open, and
Vercel installs dev dependencies by default. And both configs rewrite every
path to `index.html`, so a link typed without a hash still lands on the app
rather than a 404.

## Checking it

Seven Playwright suites live in `app/scripts`. They drive a real browser
against the built bundle rather than inspecting source.

```bash
cd app && npm run build && npx vite preview --port 4173 &
node scripts/walk.mjs         # 24 desktop routes, screenshots, page errors
node scripts/flows.mjs        # five money flows, asserting what the money did
node scripts/phone.mjs        # 23 routes at 390px, horizontal overflow
node scripts/fit.mjs          # every composer sheet, button above the fold
node scripts/phone-flows.mjs  # the keypad, the rail, the breakpoint
node scripts/send.mjs         # the Send picker, both widths
node scripts/states.mjs       # 25 interaction-state checks
```

### Making something fail

Which movements fail is deterministic, so every unhappy path is reachable on
purpose rather than one run in ten. The rule is carried on the cents, the way a
payment sandbox uses a magic value, so any amount becomes a failure by changing
the pennies:

| Amount | What happens |
|---|---|
| ends `.99` | the bank declines. Nothing is written and nothing leaves. |
| ends `.98` | no answer in time. Recorded unsettled, and it shows up in Still settling. |
| anything else | settles. |

It applies to payments and trades — the movements with somebody else in the
middle. Moving your own money between your own buckets has nobody to decline it.

Signing in works the same way. Any email and password gets you in, except one:

| Password | What happens |
|---|---|
| `wrong` | the sign-in is refused, and says so under the fields. |
| anything else | you are in, after the moment it takes to look busy. |

Running them needs a Chromium. Either `npx playwright install chromium` or
point `executablePath` at one you already have.
