# Tokkenly design system

This file is the reference for every screen in the Tokkenly mobile app. Read it
before designing anything. If a value is not in this file, it does not go in the
design. If something here is wrong, change this file first and then the design.

## 0. The three hard rules

These come before everything else. A screen that breaks one of them is wrong
even if it looks fine.

1. **Two font weights per screen.** Lato SemiBold and Lato Regular. Nothing else.
2. **Every size and every gap is a multiple of 4.** Font sizes, line heights,
   spacing, padding, heights and widths.
3. **No mid tone surfaces.** A screen is near white or deep green, never a wash
   of beige in between.

Three things sit outside rule 2 on purpose. Letter spacing is optical correction
rather than layout, so it is set by eye. The pill radius is not a measurement, it
is fully round. And a width that comes from filling the space available is not a
value anyone chose, so it does not need to land on the grid. Only the gaps and
padding around it do.

## 1. The direction

Tokkenly is a light, precise financial app. Screens are near white. The ink is a
deep forest green rather than black. One bright mint accent carries positive
states. Sand appears only in small amounts.

The look rests on two ideas.

The first is precision. Data is laid out cleanly, codes are set in a monospace
font, and numbers align. This is what makes a finance app feel dependable.

The second is confidence. The number that matters is very large and everything
around it is very small. There is almost nothing in between.

## 2. Colour

### 2.1 The eight approved brand values

Fixed. Do not change them.

| Name | Hex |
| --- | --- |
| Sand | `D5A578` |
| Sand deep | `BE895C` |
| Green | `105C4C` |
| Green deep | `053329` |
| Mint | `2BBD9B` |
| Grey | `DDDED6` |
| Orange | `F85113` |
| Yellow | `F9D100` |

### 2.2 The ratio

The palette is kept. What changed is how much of each appears.

- About 70 percent of a screen is near white or white surface.
- About 20 percent is deep green ink, meaning text, icons and the primary button.
- About 10 percent is accent, meaning mint, and occasionally sand.

Sand is never a full screen background. Use it for one card or one badge at a
time.

### 2.3 Surface

The page is pure white. Everything that sits on it carries a soft green tinted
step, so the shape of a card comes from its own surface rather than from a line
drawn around it.

| Token | Value | Use |
| --- | --- | --- |
| `surface/canvas` | `FFFFFF` | The screen background. Pure white, always. |
| `surface/default` | `F1F6F3` | Cards, sheets and fields sitting on the canvas. |
| `surface/sunken` | `E7EEEA` | A panel nested inside a card. |
| `surface/inverse` | `053329` | Deep green moments such as welcome and camera. |
| `surface/accent` | `2BBD9B` | The mint accent card. Once per screen. |
| `surface/sand` | `D5A578` | The sand accent card. Once per screen. |
| `surface/frost` | `F1F6F3` at 88% | Floating surfaces that content scrolls under. Always paired with a background blur of 24. |
| `surface/scan` | `FFFFFF` | Behind a QR code. The one exception to the white rule, because a reader needs the quiet zone. |

Each step is about five percent darker than the one above it. That is enough to
separate a card from the page without turning the screen grey.

Surfaces nest in three steps and no more. White canvas holds a tinted card, and
a tinted card holds a sunken panel. Never a card inside a card of the same
value.

Nothing on a screen is pure white except the canvas itself. If a card looks
white, it is wrong.

### 2.4 Ink

| Token | Value | Contrast on canvas | Use |
| --- | --- | --- | --- |
| `ink/strong` | `053329` | 13.9 to 1 | Headings, values, body text. |
| `ink/muted` | `4D6B65` | 5.8 to 1 | Labels, captions, secondary text. |
| `ink/subtle` | `8EA39F` | 2.9 to 1 | Disabled text and placeholders only. |
| `ink/inverse` | `FFFFFF` | on deep green | Text on `surface/inverse`. |
| `ink/inverse-muted` | `A9C4BB` | 7.5 to 1 on deep green | Secondary text on deep green. |

### 2.5 Border

| Token | Value | Use |
| --- | --- | --- |
| `border/hairline` | `DCE6E0` | Card outlines and dividers. 1px. |
| `border/strong` | `B4C2BF` | Input outline at rest. 1px. |
| `border/focus` | `105C4C` | The focused input. 2px. |

Strokes are 1 or 2. There are no other values.

### 2.6 State

Fill colours and text colours differ, because the bright brand values do not have
enough contrast to be read as small text.

| Token | Value | Use |
| --- | --- | --- |
| `state/positive` | `0C6B52` | Text and icons for money received. 5.45 to 1 on its own tint. |
| `state/negative` | `A8380A` | Text and icons for errors. 5.13 to 1 on its own tint. |
| `state/warning` | `7A5E00` | Text and icons for warnings. 5.37 to 1 on its own tint. |
| `fill/positive` | `2BBD9B` | Solid mint fills, dots and large marks. |
| `fill/negative` | `F85113` | Solid orange fills and large marks. |
| `fill/warning` | `F9D100` | Solid yellow fills and large marks. |
| `tint/positive` | `D8F1E8` | Success banner background. |
| `tint/negative` | `FBDFD3` | Error banner background. |
| `tint/warning` | `FBF0C9` | Warning banner background. |
| `tint/brand` | `DCE9E3` | Quiet brand tint behind icons. |

The tints are one step deeper than a card. They have to be, or a status banner
sitting inside a card would read as part of the card.

### 2.7 Contrast

- Text below 24px must reach 4.5 to 1 against the surface behind it.
- Text at 24px or larger must reach 3 to 1.
- `ink/subtle` fails 4.5 to 1 on purpose. Use it only where the text carries no
  information the person needs.
- Never carry meaning with colour alone. A status pairs a colour with a word.

Every text and surface pair in the file was measured after the surfaces were
restacked. The worst case is `ink/muted` on `tint/brand` at 4.66 to 1, and every
other pair sits above it.

| Surface | `ink/strong` | `ink/muted` |
| --- | --- | --- |
| `surface/canvas` | 13.89 | 5.82 |
| `surface/default` | 12.71 | 5.33 |
| `surface/sunken` | 11.78 | 4.94 |
| `tint/brand` | 11.12 | 4.66 |
| `tint/positive` | 11.68 | 4.90 |
| `tint/negative` | 10.98 | 4.60 |
| `tint/warning` | 12.18 | 5.10 |

## 3. Typography

### 3.1 The typeface

| Role | Family | Weight |
| --- | --- | --- |
| Everything | Geist | SemiBold and Regular |

One family, two weights, nothing else in the file. No serif, no second sans, no
monospace companion. If a screen needs a different voice it gets a different
size or a different weight, never a different family.

Geist is released under the SIL Open Font License, so the same face ships on
iOS, on Android and on the website. A platform font cannot do that.

Its figures are cut tight with flat terminals, which is why a balance set in it
reads as a number rather than as a word. That is the whole reason for the
choice.

**Codes do not line up in a column.** `Code/M` and `Code/S` set Geist like
everything else, so a wallet address or a transaction hash has uneven character
widths. This is accepted rather than solved, because one family is worth more
than aligned hashes. Where a code truly has to align, turn on tabular figures
rather than bringing a second family back.

### 3.2 The scale

Four sizes. Nothing else exists.

`12 → 14 → 18 → 36`

| Style | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `Display` | 36 / 40 | SemiBold | -1.2 | The hero figure. One per screen, never two. |
| `Title` | 18 / 24 | SemiBold | -0.4 | Screen title and section title. |
| `Body strong` | 14 / 20 | SemiBold | -0.2 | Row title, button label, any value. |
| `Body` | 14 / 20 | Regular | 0 | Sentences, explanations, subtitles. |
| `Label caps` | 12 / 16 | SemiBold | +1.2 | Uppercase eyebrow above a value. |
| `Label` | 12 / 16 | Regular | 0 | Timestamps, chips, captions, links. |

Six styles. That is the whole system.

The sizes are not multiples of 4 and are not meant to be. The multiple of 4 rule
governs spacing and the size of boxes. Type sits on its own scale, and every
line height is a multiple of 4 so the text still lands on the grid.

**12 is for metadata only.** A timestamp, a chip, an eyebrow, a reference number.
Never a sentence a person has to read. The usual floor for body copy is 16 and
this system sets it at 14, so the 12 has to stay out of the reading path or the
screens become hard work. Nigerian apps are already criticised for small type.

The jump from 18 to 36 is deliberate. There is no middle size to drift into, so a
screen has one big thing and everything else is quiet.

### 3.3 How to set an amount

An amount is built from three parts, not typed as one string.

- The currency symbol and any sign are the size below, in the muted ink.
- The whole number is the full size and weight.
- The decimals are the size below, in the muted ink.

| Main | Symbol and decimals |
| --- | --- |
| 36 | 18 |

**Only `Display` composes.** Every other size is set flat, in one size and one
colour. At 18 and below the two parts get too close to tell apart and it reads as
fussy rather than considered.

A composed amount is the one place a text style is overridden, because the parts
need two sizes inside one node. There are 19 of them in the file and they are the
only nodes not linked to a style. If that ever needs fixing, the answer is a
component with two text nodes, not a third size.

In a table or a list, amounts align right so the digits line up.

### 3.4 The label and value pair

The most used pattern in the app.

- The label is `Label/Caps` in `ink/muted`, in capitals.
- The value sits 4px below in `Heading/M`, in `ink/strong`.
- Pairs sit in two columns, 20px between the columns and 20px between the rows.

## 4. Spacing

### 4.1 The scale

`4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80`

### 4.2 The rhythm

Spacing carries grouping, so the size of a gap has to mean something.

| Relationship | Gap |
| --- | --- |
| Between a label and its value | 4 |
| Between an icon and its text | 8 |
| Between fields in one group | 12 |
| Between rows in a list | 16 |
| Between a section title and its content | 16 |
| Between one section and the next | 32 |
| Above the primary button | 24 |

A gap between sections is always at least twice the gap inside a section. If two
groups have the same gap around them and inside them, a person cannot see where
one ends.

### 4.3 Screen layout

| Measure | Value |
| --- | --- |
| Screen size | 390 by 844 |
| Side padding | 20 |
| Status bar | 56 |
| App bar | 56 |
| Bottom navigation | 88, including 24 of safe area |
| Above the bottom button | 24 |
| Bottom padding when scrolling | 32 |

## 5. Shape

| Token | Value | Use |
| --- | --- | --- |
| `radius/pill` | full | Buttons, chips, status pills, avatars, icon buttons. |
| `radius/card` | 24 | Cards on the canvas. |
| `radius/card-lg` | 28 | Large surfaces and the top of a bottom sheet. |
| `radius/inner` | 16 | A panel nested inside a card, and text fields. |

Every button is a full pill. Rounded rectangles are not used for buttons.

## 6. Size

| Token | Value | Use |
| --- | --- | --- |
| `size/icon-sm` | 16 | Small inline icon. |
| `size/icon` | 20 | Default icon. |
| `size/icon-lg` | 24 | Navigation and app bar icon. |
| `size/touch-min` | 44 | Minimum touch target. |
| `size/icon-button` | 44 | Circular secondary action. |
| `size/avatar` | 40 | List row avatar. |
| `size/action` | 56 | Circular action button under the balance. |
| `size/button` | 56 | Primary and secondary button. |
| `size/button-md` | 48 | Medium button. |
| `size/field` | 56 | Text field. |
| `size/row` | 64 | List row. |

## 6b. Icons

Icons carry state through shape, never through colour on its own.

| State | Treatment |
| --- | --- |
| Inactive | Stroked outline, 2px, round caps and joins, `ink/muted`. |
| Active | Solid filled glyph, no stroke. |
| Not yet built | Stroked outline, 2px, `ink/subtle` at 40 percent opacity. |

### 6b.1 The one icon size

Every glyph is drawn at 12 by 12 with a 2 point stroke. There is no second size.
A tall or wide glyph fits the 12 square on its longer side and keeps its
proportions, so a chevron is 6 by 12 rather than a squashed 12 by 12.

Draw on a 24 by 24 grid, then scale the whole glyph down to fit 12. Never resize
a vector to fill a square box, because that stretches the artwork. Centre it in
a fixed frame instead.

The stroke stays at 2 after scaling. That is deliberate. At 12 the stroke is one
sixth of the glyph, which is heavier than the usual one ninth, and it is what
gives the set its weight. Two consequences follow.

1. Pick open shapes. Fine interior detail closes up at this size, so a glyph
   needs room between its strokes.
2. Never lower the stroke to keep a detail. Simplify the drawing instead.

The box the glyph sits in does not change with the glyph. It stays 16, 20 or 24
and it stays on the multiple of 4 grid, so nothing in a row shifts and every tap
target keeps its size. A 12 glyph in a 20 box is correct.

The multiple of 4 rule stops at the edge of the 24 grid the glyph is drawn on.
What happens inside an icon is artwork, not layout. A stroke can land on 7.5 and
a corner can be 2.5, because those are drawing decisions, not spacing anyone
reads.

### 6b.2 Round badges

A badge is a filled circle holding one glyph. With a 12 glyph the circle is 40.
Anything larger leaves the glyph stranded in the middle. This covers the outcome
screens, money sent, send failed, verified, under review and nothing here yet.

The 64 circle in the floating navigation is not a badge. It is the More button,
and it stays 64 because that is a tap target, not artwork.

An icon set therefore needs two drawings of each glyph, one stroked and one
filled. Pick shapes that fill cleanly. A house, a person, a set of bars and a
grid all work. A thin pulse line does not.

## 7. Depth

Separation comes from surface colour and a one pixel hairline border, not from
shadows. The only exceptions are a bottom sheet and a floating element, which
both use `0 8 24 rgba(5, 51, 41, 0.10)`.

## 8. Components

### 8.1 Buttons

| Property | Primary | Secondary | Quiet | Destructive | Inverse |
| --- | --- | --- | --- | --- | --- |
| Fill | `ink/strong` | `surface/default` | none | `state/negative` | `surface/sand` |
| Label | `ink/inverse` | `ink/strong` | `ink/strong` | `ink/inverse` | `ink/strong` |
| Border | none | 1px `border/hairline` | none | none | none |
| Height | 56 | 56 | 56 | 56 | 56 |
| Radius | pill | pill | pill | pill | pill |
| Type | `Heading/M` | `Heading/M` | `Heading/M` | `Heading/M` | `Heading/M` |

Use Inverse on a deep green screen, because a dark button on deep green
disappears. A medium button is 48 tall and uses `Label/M`. There is no small
button. Pressed is 88 percent opacity and disabled is 38 percent opacity on the
whole button. Do not use a separate grey for either.

#### Disabled

A disabled control is inert, not faded. Never dim a live control with opacity,
because a dark pill at 38 percent on a white page turns into a grey blob.

| Variant | Fill | Label and icon |
| --- | --- | --- |
| Primary, Secondary, Destructive | `surface/sunken` | `ink/subtle` |
| Quiet | none | `ink/subtle` |
| Inverse | `surface/inverse-raised` | `ink/inverse-muted` |

`ink/subtle` is below 4.5 to 1 on purpose here. A disabled control carries no
action, so its label is the one place the rule does not apply.

### 8.2 Icon button

A 44 circle filled with `surface/sunken` holding a 20px icon in `ink/strong`.
The only shape for a secondary action in an app bar or beside a field.

### 8.3 Card

White, 24 radius, 1px `border/hairline`, 20 padding, no shadow. A panel nested
inside it is `surface/sunken` at 16 radius with 16 padding.

### 8.4 List row

64 tall. A 40 circle icon on the left, 8 gap, then the title in `Heading/M` and
the caption in `Body/S` stacked with a 4 gap. The amount sits right in
`Heading/L`. A divider is 1px `border/hairline` and starts where the text starts.

### 8.5 Status pill

Full round, 4 padding top and bottom, 12 left and right, a tint background, a 8px
dot in the matching solid fill, 8 gap, then the word in `Label/M`.

### 8.6 Text field

56 tall, 16 radius, white fill. At rest the border is 1px `border/strong`. Focused
it is 2px `border/focus`. On error it is 2px `state/negative` and the helper text
turns `state/negative` at the same time. The label sits above in `Label/M` and
`ink/muted` with an 8 gap.

### 8.7 Floating navigation

Two floating elements, 20 in from each side, 24 above the safe area, both 64
tall. On the left a rounded group of destinations. On the right a single More
button. Both use `surface/frost` with a background blur of 24 and the floating
shadow.

| Part | Value |
| --- | --- |
| Destinations | Home, Grow, Stocks, Account |
| Group | padding 8, gap 4 between items, radius pill |
| Inactive item | 48 by 48, glyph only, `ink/muted` outline |
| Active item | 64 by 48 pill in `surface/inverse`, glyph filled in `ink/inverse` |
| More | 64 circle, its own frosted element, gap 12 from the group |
| Total width | 236 group plus 12 plus 64, inside the 350 available |

The items carry no labels. Four destinations and a label on the active one does
not fit in 350, and shrinking the type or the side inset to force it would cost
more than the labels are worth. State is carried by the pill and by the glyph
filling, which is shape, not colour.

A screen that shows the navigation needs 88 of bottom padding, and no element in
its body may reach below the top of the navigation at y 722. A bottom anchored
button on such a screen is a collision, so actions on those screens live inside
their cards.

### 8.8 Balance and the home actions

The balance sits directly on the canvas, not in a card, so the number is the
loudest thing on the screen. `Label/Caps` above it, `Heading/XXL` for the amount
with the symbol and decimals at 20, then `Body/S` for the naira value.

Below it, with a 24 gap, sit the actions a person can actually take today. In
Phase 1 that is two, so they are two equal buttons splitting the width with a 12
gap, each 56 tall at pill radius, each holding a 20 icon, an 8 gap and a label in
`Heading/M`.

Send uses the Primary style and Receive uses Secondary, because sending is the
action with consequence and receiving only shares an address.

Nothing that is not built appears here. No greyed out tiles and no teasers. The
roadmap lives behind More in the navigation and nowhere else.

When a later phase ships, its action joins this row. At three or more the row
returns to circular 56 actions with a `Label/M` word beneath each.

### 8.9 The More sheet

More is the only place a feature that is not built yet is allowed to appear. It
is a bottom sheet, not a screen, so the person keeps their place behind it.

| Part | Value |
| --- | --- |
| Surface | `surface/default`, top corners 28, no bottom corners |
| Shadow | 0 by -8, blur 32, black at 12 percent |
| Padding | 20 at the sides, 12 at the top, 40 at the bottom |
| Grabber | 40 by 4 pill in `border/strong`, centred |
| Gap between groups | 24 |
| Scrim | `ink/strong` at 50 percent over the whole screen |

The sheet holds two groups and they are never mixed.

1. **Now.** Under a `Label/Caps` heading that reads "Now". Each item is a full
   row with a 40 tile, a `Heading/M` title, a `Body/S` line saying what it does,
   and a chevron. These open.
2. **Later.** Under a `Label/Caps` heading that reads "Later". Each item is a
   flat pill in `surface/sunken` with `ink/muted` text and a hairline border. No
   tile, no chevron, no shadow. A `Body/S` line under the group says plainly
   that nothing there can be opened.

The two groups must stay visibly different. A later item never borrows the row
shape of a now item, because a row with a chevron promises that tapping it does
something.

The sheet covers the floating navigation while it is open. That is correct. The
grabber and the scrim are both ways out.

### 8.10 Vertical composition

A white page shows every loose gap, so nothing sits at an arbitrary height.

1. A screen has at most one fixed spacer. Everything else that separates groups
   is the body gap.
2. Space that is left over goes into a flexible spacer, never into a fixed one.
   A fixed 200 spacer is a guess. A flexible one is a rule.
3. A screen whose job is one focal element between a header and a control puts a
   flexible spacer on both sides of that element, so it centres. The PIN dots
   work this way.
4. An outcome screen, the kind that reports what happened, centres its whole
   block the same way and anchors its actions to the bottom.
5. Two stacked buttons are one group with a gap of 12, not two items in the body
   rhythm.

### 8.11 The covered phrase

Before the recovery phrase is revealed it is not a blank panel. It shows the
twelve word slots it is about to fill, redacted, at half opacity, with the lock
and the label sitting on a small raised card in the middle. A person can see
there is something there and what shape it takes.

### 8.12 The four products

The account is one balance with four products on top of it. Only Everyday is
open.

| Product | State | What it is |
| --- | --- | --- |
| Everyday | Open | Hold, send and receive digital dollars. Convert to naira, bills and spend are not built. |
| Earn | Not open | A floating rate on the balance, compounding daily, no lockups. |
| Borrow | Not open | Borrow against what you hold instead of selling it. Paid out in naira. |
| Stocks | Not open | US stocks and funds in fractional shares, funded from the same balance. |

There is one balance, not four. Stocks buys from the money you already hold, and
Borrow lends against it. Nothing in the app should suggest a person moves money
between four separate pots.

Earn and Borrow share one page called Grow, because borrowing is priced off what
you are earning on and the two only make sense next to each other. Stocks has
its own page.

Activity is no longer a destination in the navigation. It is reached by See all
on the home screen and by a row in the More sheet, and it opens as a pushed
screen with a back bar rather than a tab.

## 13. What makes it beautiful

The system so far says what is allowed. It does not say what is good. These are
the tests a screen has to pass before it is finished.

**One thing lands first.** Look at the screen for half a second and something
should have caught the eye. If everything is the same weight, nothing is. The
balance is that thing on home. A screen with no focal object is not calm, it is
empty.

**Colour is spent once, at full strength.** Deep green appears in one place per
screen and does real work there. Spreading it thinly across five elements makes
none of them read. A tint is not a weaker version of a colour, it is a different
material.

**Equal things get equal weight.** Receive and Send are the same size of
decision, so one must not be a heavy filled pill next to a pale outline. When
the design makes one look louder, it is making a claim about the product.

**Density is a kindness.** A list of three payments separated by 16 of air reads
as a rough draft. Hairline dividers and tighter rows read as a finished product
and fit more on the screen. Air belongs between sections, not inside them.

**The numbers are the product.** Money is set large, tracked tight, with the
currency mark and the decimals stepped down. Everything around a number is
smaller and quieter than the number.

**Chrome recedes.** The status bar, the header and the navigation are furniture.
They are never the most interesting thing on the screen.

**Nothing is decorative.** Every mark carries information. If a shape can be
removed and nothing is lost, remove it.

**Space is structure.** Leftover space at the bottom of a screen is a mistake.
Space that separates two ideas is a decision. The difference shows.


### 8.13 Charts

A price line is not an icon and is not held to the 12 rule. It is drawn at the
width of its container with a 2 stroke in `state/positive` when the period is up
and `state/negative` when it is down, over a single hairline baseline. No axes,
no gridlines, no labels on the line itself. The number above the chart says what
it is worth. The chart only says which way it went.

The period chips under it are the standard pill, with the selected one filled in
`surface/inverse`.

### 8.14 Screens that scroll

Most screens fit. Home does not, and should not.

A screen whose job is a feed sets its body to hug its content and lets the list
run under the floating navigation and off the bottom of the frame. The cut is the
point. A list that stops neatly above the navigation tells a person there is
nothing more, which on home is a lie.

Two rules make the cut read as scrolling rather than as breakage.

1. The cut lands inside a row, never on a section heading. A heading sliced in
   half looks like a bug. A row sliced in half looks like a list.
2. Nothing below the fold is the only copy of anything. Everything under the
   navigation is also reachable another way.

Every other screen still ends above the navigation, or above the bottom padding
where there is no navigation.

### 8.15 Sheets, not pages

Anything transactional is a bottom sheet over the page that started it. The page
stays behind, dimmed. A person never loses their place, and nothing in the app is
more than four taps from home.

Pages are only for destinations: home, Grow, Stocks, Account, Activity, Security
and a stock in full. Everything else, fifteen screens of it, is a sheet.

| Part | Value |
| --- | --- |
| Scrim | `ink/strong` at 50 percent over the whole page |
| Sheet | `surface/default`, top corners 28, no bottom corners |
| Shadow | 0 by -8, blur 32, black at 14 percent |
| Padding | 20 at the sides, 12 at the top, 32 at the bottom |
| Grabber | 40 by 4 pill in `border/strong`, centred |
| Gap | 24 between blocks |
| Header | Title on the left, a 32 close circle on the right. Outcome sheets have no header. |
| Height | Hugs its content. Never more than 720, or it stops reading as a sheet. |

Three things dismiss a sheet: the scrim, the close control and the grabber. All
three are wired, because a person will reach for whichever is nearest.

A sheet arrives from the bottom. A page pushes from the side. The transition is
how a person knows which one they are in.

### 8.16 The chain is not the product

A person holding dollars should not have to learn what a chain is.

| Where | What is shown |
| --- | --- |
| Home | A balance in dollars and a naira estimate. No token, no chain, no address. |
| Send | Who, how much, the fee and when it arrives. No network row. |
| Receive | The address, the network and the warning. This is the one place it all appears. |
| A receipt | The reference and the transaction hash, because a receipt has to be complete. |
| Account | The address, for anyone who wants it. |

The Base warning on Receive stays and is not negotiable. Sending the wrong asset
to that address loses the money, and a warning cannot be given for something the
app never mentions.

## 9. How this maps to the reference work

Checked before the system was built. Every element in the references lands on the
scale.

| Reference element | Needs | Style |
| --- | --- | --- |
| Small label above a name | 11 | `Body/S` 12 |
| A person's name in a header | 17 | `Heading/M` 16 |
| An uppercase field label | 10 to 11 | `Label/Caps` 12 |
| The main balance | 38 | `Heading/XXL` 40 |
| The decimals on the balance | 21 | 20 |
| Action labels under circular buttons | 11 | `Label/M` 12 |
| An amount on a card | 20 | `Heading/L` 20 |
| A section title | 16 | `Heading/M` 16 |
| Bottom navigation labels | 10 | `Label/M` 12 |
| A screen title such as "Invoice" | 26 | `Heading/XL` 28 |
| A reference code such as IN-001 | 12 | `Code/S` 12 |
| A value in a data table | 16 | `Heading/M` 16 |
| A confirmation headline | 28 | `Heading/XL` 28 |
| An event name on a ticket | 20 | `Heading/L` 20 |

## 10. Rules that must not be broken

1. Two font weights per screen. Lato SemiBold and Lato Regular.
2. Every size and gap is a multiple of 4.
3. Never use a colour, size, gap or radius that is not in this file.
4. Never fill a whole screen with sand or any other mid tone.
5. Never paint anything pure white except the canvas. A card that reads as
    white has lost its surface step.
6. Never use a rounded rectangle for a button. Buttons are pills.
7. Never put more than one `Heading/XXL` on a screen.
8. Never use the serif anywhere in the app.
9. Never let a gap inside a group equal the gap around it.
10. Never carry meaning with colour alone. An active icon fills, it does not
    merely change colour.
11. Never use `ink/subtle` for text a person needs to read.
12. Never add a shadow except to a bottom sheet or a floating element.
13. Never nest more than three surface levels.
14. Never compose an amount below 28px. Set it flat.
15. Never draw a glyph at any size but 12, and never at any stroke but 2. The
    box around it changes, the glyph does not.
16. Never put an unbuilt part of a product onto the home screen. It goes behind
    More, under the "Later" heading, as a flat pill that carries no chevron and
    opens nothing. A whole product may show a hint on home, because it has a
    place in the navigation to lead to. The hint carries a "Soon" marker.
17. A whole product is the exception. Grow and Stocks sit in the navigation
    before they open, because they are what the account grows into and the
    website already promises them. Each carries a "Not open yet" pill on its own
    page. A part of a product never gets this exception, only a product does.

## 11. The screens, by flow

Every screen sits inside a named section in Figma. A section holds one flow, a
short note that says what the flow is for, and an arrow between each step. Where
two screens are alternatives rather than steps there is no arrow between them.

### 11.1 Onboarding, page `03 Onboarding`

| Flow | Screens |
| --- | --- |
| A. Set up a new account | Welcome, How this works, Recovery phrase hidden, Recovery phrase revealed, Confirm your phrase, Create a PIN, Confirm your PIN, Unlock with your face |
| B. Confirm your mobile number | Your mobile number, Enter the code |
| C. Verify your identity | Verify your identity, Choose NIN or BVN, Enter your NIN, Check your details, Photograph your ID, Check the photo, Take a selfie, Review and submit |
| D. After you submit | Under review, Verified, More information needed |
| E. Come back to your account | Restore your account |

Flow D holds three outcomes of the same check, so its screens carry no arrows.

### 11.2 The app, page `04 App`

| Flow | Screens |
| --- | --- |
| F. Home | Home verified, Home verification pending |
| G. Receive money | Receive |
| H. Send money | Send who, Send amount, Send review, Send sent, Send failed |
| I. Activity and receipts | Activity, Transaction detail |
| J. Account and security | Account, Security |
| K. The More sheet | More |
| L. First run and empty states | Home first run, Activity nothing yet |
| M. Grow and Stocks | Grow, Stocks |
| O. Earn and Borrow | Move money in, Borrow amount, Borrow review, Borrow done |
| P. Buying and selling | Stock detail, Buy amount, Buy review, Buy done, Sell |

Flow F holds two states of one screen, so its screens carry no arrows. In flow H
the last two screens are the two endings of the same send, so the arrow stops at
the review screen.

### 11.3 What every screen has to satisfy

17. The frame is 390 by 844 and nothing spills past it.
18. Side padding is 20. The status bar is 56 and an app bar, when there is one,
   is another 56.
19. A screen that shows the floating navigation ends its content 88 above the
   bottom, and no element reaches into the navigation.
20. A screen without the navigation ends its content 32 above the bottom.
21. Two font weights, and every size and gap a multiple of 4.

## 12. The prototype

Both pages are wired for a click through. The floating navigation works on
every screen that carries it, the send flow runs from picking a person to the
receipt, and the onboarding screens run in a straight line.

Figma does not allow a prototype link to cross from one page to another, so the
onboarding prototype ends at Verified and the app prototype starts at Home.
Testers open them as two separate runs.

Starting points are set. Onboarding opens at Welcome or at Restore your
account. The app opens at Home or at a brand new account.
