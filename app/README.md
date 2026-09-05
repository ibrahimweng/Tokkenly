# Tokkenly, in code

A working TypeScript build of the desktop product drawn in
[`design.md`](../design.md) and the Figma file it documents. Every screen in
section 11b exists here, every flow runs end to end, and every button either
navigates or opens a sheet. Nothing is a dead end.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck, then bundle to dist/
npm run typecheck  # tsc --noEmit on its own
```

No framework. TypeScript, hand-written DOM, and three stylesheets.

## How it is put together

| File | What it owns |
| --- | --- |
| `src/state.ts` | Every figure the product shows, and the only code that changes them |
| `src/router.ts` | A hash router where a sheet is an address, not a flag |
| `src/sheets.ts` | Every review and outcome sheet, in one registry |
| `src/components/` | The shell, the amount composer, tables, sheets, and the shared bits |
| `src/screens/` | One file per place, plus `map.ts`, which lists every address |
| `src/styles/tokens.css` | The palette and type scale from design.md section 2 |

**State is real.** Borrowing moves money into the wallet, raises what you owe,
and drops your collateral cover. Repaying puts the limit back. Buying a stock
changes the holding, the portfolio total, and the positions list on Home. Every
one of those writes appends to the activity feed, so History shows it a moment
later. That is why the flows are worth clicking rather than looking at.

**A sheet is an address.** `#/grow/borrow?sheet=borrow-review&v=1150` opens the
review over the composer, and it survives a reload. Escape and the scrim both
close it. That makes any step of any flow linkable, which is what
`#/map` is for: one page listing every screen and every sheet in the product.

**Rules from design.md that live in code, not in a habit.**

- Money in is green and signed, money out is neutral. One function, `amount()`,
  so rule 43 cannot be applied by hand and get it wrong.
- Anything you can drag is also typeable. The ruler writes into the field and
  the field redraws the ruler, so the two never disagree. Rule 47.
- Colours come from `tokens.css` only. Nothing in a screen file names a hex.

## Checking it

Two Playwright scripts, run against a build:

```bash
npm run build && npx vite preview --port 4173 &
node scripts/walk.mjs    # opens all 24 addresses, screenshots each, reports page errors
node scripts/flows.mjs   # clicks five flows through and prints what the money did
```

`flows.mjs` is the one that matters. It borrows $600 and checks the wallet went
from $2,480 to $3,080, repays it, buys $250 of Apple and checks the holding went
from 23.42 to 24.54 shares, then opens six sheets from the buttons that should
open them.

## What is invented

The rates, the collateral ratio and the payout schedule are made up, exactly as
`design.md` 11b.4f records. So are the prices in `src/catalogue.ts`. Everything
else is arithmetic on those numbers, which is why the screens agree with one
another.
