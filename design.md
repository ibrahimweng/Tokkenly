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

| Token | Value | Use |
| --- | --- | --- |
| `surface/canvas` | `F6F8F6` | The screen background. |
| `surface/default` | `FFFFFF` | Cards and sheets on the canvas. |
| `surface/sunken` | `EFF2F0` | A panel nested inside a white card. |
| `surface/inverse` | `053329` | Deep green moments such as welcome and camera. |
| `surface/accent` | `2BBD9B` | The mint accent card. Once per screen. |
| `surface/sand` | `D5A578` | The sand accent card. Once per screen. |
| `surface/frost` | `FFFFFF` at 72% | Floating surfaces that content scrolls under. Always paired with a background blur of 24. |

Surfaces nest in three steps and no more. Canvas holds a white card, and a white
card holds a sunken panel. Never a white card inside a white card.

### 2.4 Ink

| Token | Value | Contrast on canvas | Use |
| --- | --- | --- | --- |
| `ink/strong` | `053329` | 13.3 to 1 | Headings, values, body text. |
| `ink/muted` | `55746E` | 4.85 to 1 | Labels, captions, secondary text. |
| `ink/subtle` | `8EA39F` | 2.9 to 1 | Disabled text and placeholders only. |
| `ink/inverse` | `FFFFFF` | on deep green | Text on `surface/inverse`. |
| `ink/inverse-muted` | `A9C4BB` | 7.5 to 1 on deep green | Secondary text on deep green. |

### 2.5 Border

| Token | Value | Use |
| --- | --- | --- |
| `border/hairline` | `DDDED6` | Card outlines and dividers. 1px. |
| `border/strong` | `B4C2BF` | Input outline at rest. 1px. |
| `border/focus` | `105C4C` | The focused input. 2px. |

Strokes are 1 or 2. There are no other values.

### 2.6 State

Fill colours and text colours differ, because the bright brand values do not have
enough contrast to be read as small text.

| Token | Value | Use |
| --- | --- | --- |
| `state/positive` | `0F7A5F` | Text and icons for money received. 4.98 to 1. |
| `state/negative` | `C2410C` | Text and icons for errors. 4.84 to 1. |
| `state/warning` | `8A6A00` | Text and icons for warnings. 4.76 to 1. |
| `fill/positive` | `2BBD9B` | Solid mint fills, dots and large marks. |
| `fill/negative` | `F85113` | Solid orange fills and large marks. |
| `fill/warning` | `F9D100` | Solid yellow fills and large marks. |
| `tint/positive` | `E6F7F1` | Success banner background. |
| `tint/negative` | `FDEAE2` | Error banner background. |
| `tint/warning` | `FDF6DC` | Warning banner background. |
| `tint/brand` | `E8F0ED` | Quiet brand tint behind icons. |

### 2.7 Contrast

- Text below 24px must reach 4.5 to 1 against the surface behind it.
- Text at 24px or larger must reach 3 to 1.
- `ink/subtle` fails 4.5 to 1 on purpose. Use it only where the text carries no
  information the person needs.
- Never carry meaning with colour alone. A status pairs a colour with a word.

## 3. Typography

### 3.1 Families and weights

| Role | Family | Weight |
| --- | --- | --- |
| Everything | Lato | SemiBold and Regular |
| Codes | IBM Plex Mono | Regular |

The serif does not appear in the app. Sentient is a marketing typeface. It is
used on social graphics and the website, never on an app screen. This keeps
every screen at two weights with no exception to police.

IBM Plex Mono is a second family but it only uses Regular, so a screen with Lato
SemiBold, Lato Regular and Mono Regular still has two weights.

### 3.2 The scale

Five sizes. No two neighbours are closer than a 1.25 step, so nothing can drift
into a soft middle.

`12 → 16 → 20 → 28 → 40`

**SemiBold**

| Style | Size / line | Tracking | Use |
| --- | --- | --- | --- |
| `Heading/XXL` | 40 / 44 | -1.6 | The balance. One per screen, never two. |
| `Heading/XL` | 28 / 32 | -0.8 | Screen title and amount entry. |
| `Heading/L` | 20 / 24 | -0.4 | Section title and the amount in a list row. |
| `Heading/M` | 16 / 20 | -0.2 | Card title, list row title, button label, small amount. Set flat. |
| `Label/Caps` | 12 / 16 | +1.2 | Uppercase label above a value. Set the layer to uppercase. |
| `Label/M` | 12 / 16 | +0.4 | Tab, chip, badge, bottom navigation, link. |

**Regular**

| Style | Size / line | Tracking | Use |
| --- | --- | --- | --- |
| `Body/L` | 16 / 24 | 0 | Explanations and long copy. |
| `Body/S` | 12 / 16 | 0 | Helper text and captions. |
| `Mono/M` | 16 / 24 | +0.2 | Wallet addresses and recovery words. |
| `Mono/S` | 12 / 16 | +0.4 | Reference numbers and IDs. |

Ten styles. That is the whole system.

### 3.3 How to set an amount

An amount is built from three parts, not typed as one string.

- The currency symbol and any sign are half the main size, in `ink/muted`.
- The whole number is the full size and weight.
- The decimals are half the main size, in `ink/muted`.

Half of every size on the scale is also on the scale, so the parts never leave
the grid.

| Main | Symbol and decimals |
| --- | --- |
| 40 | 20 |
| 28 | 16 |

Only compose at 28 and above. Below that an amount is set flat, in one size and
one colour. A composed amount in a list row reads as fussy, and the parts get too
close in size to tell apart.

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

Every icon is drawn on a 24 by 24 grid. Never resize a vector to fit a square
box, because that stretches the artwork. Centre it in a fixed frame instead.

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

The navigation floats clear of the screen edge. It is two separate elements in
one row, not a single bar.

| Measure | Value |
| --- | --- |
| Distance from each side | 20 |
| Distance above the safe area | 24 |
| Row height | 64 |
| Gap between the group and the More button | 12 |
| Group padding | 8 |
| Gap between items in the group | 4 |
| More button | 64 circle |

Both elements use `surface/frost` with a background blur of 24, a 1px
`border/hairline`, and the floating shadow. Content genuinely blurs as it passes
underneath, so a scrolling screen needs 88 of bottom padding to clear the bar.

The group holds the destinations that work today. Anything not yet built lives
behind More, not as a disabled tab, because a permanently dead tab wastes a slot.

| Item | Size | Treatment |
| --- | --- | --- |
| Inactive | 48 square | 24 stroked icon in `ink/muted`, no label. |
| Active | 48 tall capsule, 16 side padding | `ink/strong` fill, pill radius, 24 filled glyph in `ink/inverse`, 8 gap, name in `Label/M` in `ink/inverse`. |
| More | 64 circle | 24 stroked icon in `ink/strong`. |

The active item changes in four ways at once. It gains a background, it changes
shape, its glyph fills, and it gains a label. A person who cannot separate the
colours can still see which one is selected.

A badge on the More button is a 20 circle in `fill/negative`, sitting on the top
right, with the number in `Label/M` in white.

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
| A reference code such as IN-001 | 12 | `Mono/S` 12 |
| A value in a data table | 16 | `Heading/M` 16 |
| A confirmation headline | 28 | `Heading/XL` 28 |
| An event name on a ticket | 20 | `Heading/L` 20 |

## 10. Rules that must not be broken

1. Two font weights per screen. Lato SemiBold and Lato Regular.
2. Every size and gap is a multiple of 4.
3. Never use a colour, size, gap or radius that is not in this file.
4. Never fill a whole screen with sand or any other mid tone.
5. Never use a rounded rectangle for a button. Buttons are pills.
6. Never put more than one `Heading/XXL` on a screen.
7. Never use the serif anywhere in the app.
8. Never let a gap inside a group equal the gap around it.
9. Never carry meaning with colour alone. An active icon fills, it does not
    merely change colour.
10. Never use `ink/subtle` for text a person needs to read.
11. Never add a shadow except to a bottom sheet or a floating element.
12. Never nest more than three surface levels.
13. Never compose an amount below 28px. Set it flat.
14. Never put a feature that is not built into the navigation or onto the home
    screen. Not as a greyed tile, not as a teaser. It goes behind More.
