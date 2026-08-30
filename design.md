# Tokkenly design system

This file is the reference for every screen in the Tokkenly mobile app. Read it
before designing anything. If a value is not in this file, it does not go in the
design. If something here is wrong, change this file first and then change the
design.

## 1. The direction

Tokkenly is a light, precise financial app. Screens are near white. The ink is a
deep forest green rather than black. One bright mint accent carries positive
states. Sand appears only in small amounts.

The look comes from two ideas.

The first is precision. Data is laid out cleanly, codes are set in a monospace
font, and numbers are aligned. This is what makes a finance app feel dependable.

The second is confidence. The number that matters is very large. Everything
supporting it is very small. There is almost nothing in between.

Avoid mid tone surfaces. A screen should be near white or deep green, never a
wash of beige in between. This was the main fault in the first version of the
design and it must not come back.

## 2. Colour

### 2.1 The eight approved brand values

These are fixed. Do not change them.

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

### 2.2 The ratio rule

The approved palette is kept. What changed is how much of each one appears.

- About 70 percent of a screen is near white or white surface.
- About 20 percent is deep green ink, meaning text, icons and the primary button.
- About 10 percent is accent, meaning mint, and occasionally sand.

Sand is never a full screen background. Use it for one card, one badge or one
illustration at a time.

### 2.3 Surface tokens

| Token | Value | Use |
| --- | --- | --- |
| `surface/canvas` | `F6F8F6` | The screen background. |
| `surface/default` | `FFFFFF` | Cards and sheets that sit on the canvas. |
| `surface/sunken` | `EFF2F0` | A panel nested inside a white card. |
| `surface/inverse` | `053329` | Deep green moments such as welcome and camera. |
| `surface/accent` | `2BBD9B` | The mint accent card. Use once per screen. |
| `surface/sand` | `D5A578` | The sand accent card. Use once per screen. |

Surfaces nest in three steps and no more. Canvas holds a white card, and a white
card holds a sunken panel. Do not put a white card inside a white card.

### 2.4 Ink tokens

| Token | Value | Contrast on canvas | Use |
| --- | --- | --- | --- |
| `ink/strong` | `053329` | 13.3 to 1 | Headings, values, body text. |
| `ink/muted` | `55746E` | 4.85 to 1 | Labels, captions, secondary text. |
| `ink/subtle` | `8EA39F` | 2.9 to 1 | Disabled text and placeholders only. Never body text. |
| `ink/inverse` | `FFFFFF` | on deep green | Text on `surface/inverse`. |
| `ink/inverse-muted` | `A9C4BB` | 7.5 to 1 on deep green | Secondary text on deep green. |

### 2.5 Border tokens

| Token | Value | Use |
| --- | --- | --- |
| `border/hairline` | `DDDED6` | Card outlines and dividers. 1px. |
| `border/strong` | `B4C2BF` | Input outlines at rest. 1.5px. |
| `border/focus` | `105C4C` | The focused input. 2px. |

### 2.6 State tokens

Fill colours and text colours are different, because the bright brand values do
not have enough contrast to be read as small text.

| Token | Value | Use |
| --- | --- | --- |
| `state/positive` | `0F7A5F` | Text and icons for money received and success. 4.98 to 1. |
| `state/negative` | `C2410C` | Text and icons for errors. 4.84 to 1. |
| `state/warning` | `8A6A00` | Text and icons for warnings. 4.76 to 1. |
| `fill/positive` | `2BBD9B` | Solid mint fills, dots and large marks. |
| `fill/negative` | `F85113` | Solid orange fills and large marks. |
| `fill/warning` | `F9D100` | Solid yellow fills and large marks. |
| `tint/positive` | `E6F7F1` | Success banner background. |
| `tint/negative` | `FDEAE2` | Error banner background. |
| `tint/warning` | `FDF6DC` | Warning banner background. |
| `tint/brand` | `E8F0ED` | Quiet brand tint behind icons. |

### 2.7 Contrast rules

- Text below 24px must reach 4.5 to 1 against the surface behind it.
- Text at 24px bold or larger must reach 3 to 1.
- `ink/subtle` fails 4.5 to 1 on purpose. Use it only where the text carries no
  information the person needs, such as a placeholder or a disabled label.
- Never use colour on its own to carry meaning. A status always pairs a colour
  with a word or an icon.

## 3. Typography

### 3.1 Families

| Role | Family | Where |
| --- | --- | --- |
| UI and numbers | Lato | Everything in the app. |
| Display | Sentient | Welcome screen and marketing only. Fraunces stands in until Sentient is installed. |
| Code | IBM Plex Mono | Wallet addresses, reference numbers, recovery words. |

The serif does not appear on ordinary app screens. Screen titles are set in the
sans. The serif is reserved for the welcome screen, result screens and anything
that goes on social media.

### 3.2 The contrast rule

The scale is built to be used at its two ends. A screen should pair very small
labels with one very large value. Sizes between 17 and 25 are deliberately
absent, so nothing drifts into a soft middle.

If a screen has three or more different sizes above 20px, it is wrong.

### 3.3 The scale

Money styles come first because they are the point of the product.

| Style | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `Money/Hero` | 48 / 50 | Bold | -1.6 | The balance on the home screen. One per screen. |
| `Money/L` | 32 / 36 | Bold | -1.0 | Amount entry and confirmation totals. |
| `Money/M` | 20 / 25 | SemiBold | -0.4 | Amounts in list rows. |
| `Money/S` | 15 / 20 | SemiBold | -0.2 | Small and secondary amounts. |

| Style | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `Display/Hero` | 44 / 46 | SemiBold | -1.2 | Welcome headline. Serif. |
| `Display/L` | 32 / 36 | SemiBold | -0.6 | Result screen headline. Serif. |
| `Title/L` | 26 / 31 | Bold | -0.5 | Screen title. |
| `Title/M` | 20 / 25 | Bold | -0.3 | Section title. |
| `Title/S` | 16 / 21 | SemiBold | -0.1 | Card title and list row title. |
| `Body/L` | 16 / 24 | Regular | 0 | Explanations and long copy. |
| `Body/M` | 14 / 21 | Regular | 0 | Default body text. |
| `Body/S` | 12 / 17 | Regular | 0 | Helper text under a field. |
| `Label/Caps` | 10 / 13 | Bold | +1.2 | Small uppercase label above a value. |
| `Label/L` | 16 / 20 | SemiBold | 0 | Primary button. |
| `Label/M` | 13 / 17 | SemiBold | +0.1 | Secondary button, tab, link. |
| `Label/S` | 11 / 14 | SemiBold | +0.3 | Chip, badge, bottom navigation. |
| `Mono/M` | 14 / 21 | Regular | +0.2 | Wallet addresses and recovery words. |
| `Mono/S` | 11 / 15 | Regular | +0.5 | Reference numbers and IDs. |

### 3.4 How to set an amount

An amount is built from three parts, not typed as one string.

- The currency symbol is 55 percent of the main size, `ink/muted`, and its
  baseline sits at the top of the digits.
- The whole number is the full size and weight.
- The decimals are 55 percent of the main size and `ink/muted`.

So `$11,240.50` at `Money/Hero` means the dollar sign and the `.50` are both
26px while `11,240` is 48px.

In a table or a list, amounts are aligned to the right so the digits line up.

### 3.5 The label and value pair

This is the most used pattern in the app.

- The label is `Label/Caps` in `ink/muted`, written in capitals.
- The value sits 4px below it in `Title/S` or `Money/M`, in `ink/strong`.
- Pairs are laid out in two columns with a 20px gap between the columns and a
  20px gap between the rows.

## 4. Spacing

### 4.1 The scale

Only these values. Nothing else.

`2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 56, 72`

### 4.2 The rhythm rule

Spacing carries grouping, so the size of a gap has to mean something.

| Relationship | Gap |
| --- | --- |
| Between a label and its value | 4 |
| Between an icon and its text | 8 |
| Between fields in the same group | 12 |
| Between rows in a list | 16 |
| Between a section title and its content | 16 |
| Between one section and the next | 32 |
| Above the primary button at the bottom | 24 |

A gap between sections must always be at least twice the gap inside a section.
If two groups have the same gap around them and inside them, a person cannot see
where one ends.

### 4.3 Screen layout

| Measure | Value |
| --- | --- |
| Screen size | 390 by 844 |
| Side padding | 20 |
| Status bar height | 54 |
| App bar height | 56 |
| Bottom navigation height | 88, including 26 of safe area |
| Space above the bottom button | 24 |
| Bottom padding on a scrolling screen | 32 |

## 5. Shape

| Token | Value | Use |
| --- | --- | --- |
| `radius/pill` | 999 | Buttons, chips, status pills, avatars, icon buttons. |
| `radius/card` | 24 | Cards sitting on the canvas. |
| `radius/card-lg` | 28 | The balance card and other large surfaces. |
| `radius/inner` | 16 | A panel nested inside a card. |
| `radius/input` | 16 | Text fields. |
| `radius/sheet` | 28 | The top corners of a bottom sheet. |

Every button is a full pill. This is not optional. Rounded rectangles are not
used for buttons anywhere in the app.

## 6. Depth

The app does not use drop shadows to separate content. Separation comes from
surface colour and a one pixel hairline border.

There are two exceptions. A bottom sheet carries a soft shadow above it, and a
floating element carries a soft shadow. Both use the same value.

`0 8 24 rgba(5, 51, 41, 0.10)`

## 7. Components

### 7.1 Buttons

| Property | Primary | Secondary | Quiet | Destructive |
| --- | --- | --- | --- | --- |
| Fill | `ink/strong` | `surface/default` | none | `state/negative` |
| Label | `ink/inverse` | `ink/strong` | `ink/strong` | `FFFFFF` |
| Border | none | 1px `border/hairline` | none | none |
| Height | 56 | 56 | 56 | 56 |
| Radius | pill | pill | pill | pill |
| Type | `Label/L` | `Label/L` | `Label/L` | `Label/L` |

On a deep green screen the primary button is filled with `surface/sand` and its
label is `ink/strong`, because a deep green button on deep green disappears.

A medium button is 48 tall and uses `Label/M`. There is no small button.

Pressed means 88 percent opacity on the whole button. Disabled means 38 percent
opacity on the whole button. Do not use a separate grey for either.

### 7.2 Icon button

A 44 circle filled with `surface/sunken`, holding a 20px icon in `ink/strong`.
This is the only shape for a secondary action in an app bar or beside a field.

### 7.3 Card

White, 24 radius, 1px `border/hairline`, 20 padding. No shadow. A nested panel
inside it is `surface/sunken` at 16 radius with 16 padding.

### 7.4 List row

64 tall. A 40 circle icon on the left, 12 gap, then title in `Title/S` and
caption in `Body/S` stacked with a 2 gap. Values sit on the right in `Money/M`.
A divider is 1px `border/hairline` and starts where the text starts, not at the
edge of the screen.

### 7.5 Status pill

Full round, 5 padding top and bottom, 10 left and right, tinted background, a 6px
dot in the matching solid fill, 6 gap, then the word in `Label/S`.

### 7.6 Text field

56 tall, 16 radius, white fill. At rest the border is 1.5px `border/strong`. When
focused it is 2px `border/focus`. On error it is 1.5px `state/negative` and the
helper text below turns `state/negative` at the same time. The label sits above
the field in `Label/M` and `ink/muted`, with an 8 gap.

### 7.7 Bottom navigation

88 tall. Four items. A 24 icon above a `Label/S` word with a 4 gap. The active
item is `ink/strong` with a 2.4 stroke. Inactive items are `ink/muted` with a 2
stroke. An item that is not yet built is `ink/subtle` at 45 percent opacity.

## 8. Rules that must not be broken

1. Never use a colour, size, spacing value or radius that is not in this file.
2. Never fill a whole screen with sand or any other mid tone.
3. Never use a rounded rectangle for a button. Buttons are pills.
4. Never put more than one very large number on a screen.
5. Never use the serif on an ordinary app screen.
6. Never let a gap inside a group equal the gap around it.
7. Never carry meaning with colour alone.
8. Never use `ink/subtle` for text a person needs to read.
9. Never add a drop shadow except to a bottom sheet or a floating element.
10. Never nest more than three surface levels.
