# Tokkenly, in code

A working TypeScript build of the desktop product drawn in
[`design.md`](../design.md) and the Figma file it documents. Every screen in
section 11b exists here, every flow runs end to end, and every button either
navigates or opens a sheet. Nothing is a dead end.

```bash
npm ci
npm run dev        # http://localhost:5173 (add -- --host to reach it from a phone)
npm run build      # typecheck, then bundle to dist/ (no sourcemaps)
npm run typecheck  # tsc --noEmit on its own
npm run lint       # ESLint for correctness, and a parse check of every script
npm test           # every suite against a fresh preview of dist/
```

No framework. TypeScript, hand-written DOM, and three stylesheets.

**One codebase, two shapes.** Above 900 pixels it is the desktop product from
`06 Desktop`. Below, it is the phone drawn on `07 Mobile`: a top bar, one
column, a floating rail of four tabs plus More, and every sheet arriving from
the bottom. `src/responsive.ts` holds the single breakpoint, and the router
re-renders when it is crossed.

## How it is put together

| File | What it owns |
| --- | --- |
| `src/state.ts` | Every figure the product shows, and the only code that changes them |
| `src/router.ts` | A hash router where a sheet is an address, not a flag |
| `src/sheets.ts` | Every review and outcome sheet, in one registry |
| `src/components/` | The shell, the amount composer, tables, sheets, and the shared bits |
| `src/screens/` | One file per place, plus `all.ts`, the product's own index of everything it can do |
| `src/responsive.ts` | The one breakpoint, and the crossing event |
| `src/styles/tokens.css` | The palette and type scale from design.md section 2 |

**State is real.** Borrowing moves money into the wallet, raises what you owe,
and drops your collateral cover. Repaying puts the limit back. Buying a stock
changes the holding, the portfolio total, and the positions list on Home. Every
one of those writes appends to the activity feed, so History shows it a moment
later. That is why the flows are worth clicking rather than looking at.

**A sheet is an address.** `#/grow/borrow?sheet=borrow-review&v=1150` opens the
review over the composer, and it survives a reload. Escape and the scrim both
close it. That makes any step of any flow linkable. `#/all` is the index of
every place in the product, built from the same registry as the navigation (the
old developer route list at `#/map` now lands there too).

**Rules from design.md that live in code, not in a habit.**

- Money in is green and signed, money out is neutral. One function, `amount()`,
  so rule 43 cannot be applied by hand and get it wrong.
- Anything you can drag is also typeable. The ruler writes into the field and
  the field redraws the ruler, so the two never disagree. Rule 47.
- Colours come from `tokens.css` only. Nothing in a screen file names a hex.

## Checking it

Every `.mjs` directly in `scripts/` whose name does not start with an
underscore is a suite: a Playwright script that drives a real Chromium against
a build and prints a `PASS` or `FAIL` line per check. `npm test` runs all of
them, one after another, against a `vite preview` of `dist/` that it starts on
a free port, and exits non-zero if any check fails or any suite crashes.

```bash
npm run build && npm test
npm test -- flows fit          # just these
VERBOSE=1 npm test             # every line, not only the failures
BASE_URL=http://localhost:4173 node scripts/flows.mjs
                               # one suite against a server already running
```

What the suites share is in `scripts/lib/`: `harness.mjs` (where the app is,
which browser, `check()`, the screenshot folder, all from `BASE_URL`,
`CHROMIUM` and `SHOTS`) and `seen.mjs` (seeding a returning, a new or a locked
person, walking the identity check, and reading a figure once it has stopped
counting). Screenshots go to `shots/`, which git ignores.

`flows.mjs` is the one that matters. It verifies the account so the payment
limit is out of the way, borrows $600 and checks the button, the review and
the wallet all moved by exactly $600, repays it and checks the wallet came back
down, buys $250 of Apple and checks the holding grew by the shares the receipt
named and the wallet paid the amount and its fee, then opens six sheets from
the buttons that should open them and walks the sidebar. It asserts against
the balances it reads at the start rather than fixed figures, so a change to
the seed data does not break it.

`scripts/figma/` is not tests: it is the converter between the running product
and the Figma file (see design.md 11g.80 onwards). `read.mjs` exports a flow's
screens off the DOM into `figma/flows/`, `build.mjs` and `chrome.mjs` turn
those into `use_figma` scripts, `icons.mjs`, `art.mjs`, `artgen.mjs` and
`spark.mjs` do the same for the icons, drawings and sparkline, and `sheet.mjs`
shows every drawing at once in both themes. `art.mjs` and `sheet.mjs` read
source modules through a dev server (`npm run dev`, or `DEV_URL`). The
`_site*` scripts belong to the marketing site; see `site/README.md`.

## What is invented

The rates, the collateral ratio and the payout schedule are made up, exactly as
`design.md` 11b.4f records. So are the prices in `src/catalogue.ts`. Everything
else is arithmetic on those numbers, which is why the screens agree with one
another.
