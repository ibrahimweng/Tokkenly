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

The page is pure white. Everything that sits on it carries a light grey step, so
the shape of a card comes from its own surface. Nothing in this system is
outlined. There are no border lines anywhere in the app.

| Token | Value | Use |
| --- | --- | --- |
| `surface/canvas` | `FFFFFF` | The screen background. Pure white, always. |
| `surface/default` | `FAFBFC` | Cards, sheets, fields and secondary buttons sitting on the canvas. |
| `surface/sunken` | `F0F2F4` | Anything nested inside a `surface/default` surface. |
| `surface/control` | `E9ECEF` | Anything a person taps that is not the primary button: secondary buttons and unselected chips. |
| `surface/control-pressed` | `DDE2E6` | A control being held down. |
| `surface/inverse` | `053329` | The camera feed, the brand mark, and the active navigation pill. Never a screen background. |
| `surface/accent` | `2BBD9B` | The mint accent card. Once per screen. |
| `surface/sand` | `D5A578` | The sand accent card. Once per screen. |
| `surface/frost` | `FAFBFC` at 88% | Floating surfaces that content scrolls under. Always paired with a background blur of 24. |
| `surface/scan` | `FFFFFF` | Behind a QR code. The one exception to the white rule, because a reader needs the quiet zone. |

The greys are neutral, with no green cast. That is deliberate. If every surface
is faintly green, the green stops reading as green when it actually appears.

`FAFBFC` sits two percent away from white. That is a deliberate whisper. It is
enough to shape a card at arm's length on a good screen, and it is not enough to
survive a cheap panel in daylight. The system carries no fallback for that,
because the fallback would be a line.

That whisper works for a card and fails for a button. A card is large and has a
24 radius, so two percent is enough to shape it. A 56 tall pill is small, and at
two percent it reads as disabled rather than as something to tap. So controls
get their own step at `E9ECEF`, which is far enough from white to look pressable
at any size. Grey therefore does two different jobs at two different depths:
`FAFBFC` and `F0F2F4` group things, `E9ECEF` invites a tap.

Surfaces step down, never sideways. A `surface/default` card on the white canvas
holds a `surface/sunken` panel. A `surface/sunken` panel holds nothing further.
Two surfaces of the same value may never touch, because with no line between
them there would be nothing left to tell them apart.

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

### 2.5 Edges

There are no border lines. No card outline, no field outline, no list divider,
no chart baseline, no chip edge. A shape is described by its own fill and by the
space around it, and by nothing else. The grey border tokens were removed from
the file so the line cannot come back by accident.

Three strokes survive, and they are named here so nothing else can creep in.

| Token | Value | Use |
| --- | --- | --- |
| `border/focus` | `105C4C` | The focused field and the selected row. 2px. |
| `chart/grid` | `E9ECEF` | Vertical gridlines inside a chart, and nowhere else. 1px. |
| `chart/tooltip` | `053329` | The dark card that shows a value on a chart. |

An error field is the other exception, at 2px in `state/negative`, and it always
appears with the helper text saying the same thing in words.

The first two mark a state rather than draw a shape. The third is different. A
chart is the one place in this product where a person reads data rather than
glances at it, so a chart is allowed axes and gridlines. That exception is
written out in 8.13 and it travels nowhere else.

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

Every text and surface pair in the file was measured after the greys were
lightened. The worst case is `ink/muted` on `tint/negative` at 4.60 to 1, and
every other pair sits above it. Lightening the greys moved every pair up.

| Surface | Value | `ink/strong` | `ink/muted` |
| --- | --- | --- | --- |
| `surface/canvas` | `FFFFFF` | 13.89 | 5.82 |
| `surface/default` | `FAFBFC` | 13.41 | 5.62 |
| `surface/sunken` | `F0F2F4` | 12.38 | 5.19 |
| `surface/control` | `E9ECEF` | 11.71 | 4.91 |
| `surface/control-pressed` | `DDE2E6` | 10.65 | 4.46 |
| `tint/brand` | `DCE9E3` | 11.12 | 4.66 |
| `tint/positive` | `D8F1E8` | 11.68 | 4.90 |
| `tint/negative` | `FBDFD3` | 10.98 | 4.60 |
| `tint/warning` | `FBF0C9` | 12.18 | 5.10 |

`ink/muted` on `surface/control-pressed` is the one pair below 4.5 to 1, at 4.46.
Nothing uses it. A pressed control always carries `ink/strong`, which reaches
10.65 to 1, and the pressed state lasts as long as a finger is down.

Contrast is not the risk here. Every pair in use passes comfortably. The risk is
surface against surface, which contrast ratios do not measure. `FAFBFC` on
`FFFFFF` is 1.04 to 1. That number is the whole argument for the design and the
whole argument against it.

### 2.8 The data palette

The brand palette carries meaning. Mint means money arrived, orange means
something failed, yellow means take care. That is why none of them can also mean
"the third series in a chart". A chart needs colours that mean nothing except
"this is not that", and the system had none, which is why every chart in the
first pass was a single thin green line.

Five slots, in a fixed order that never changes:

| Token | Value | Name |
| --- | --- | --- |
| `data/1` | `0F8F70` | teal |
| `data/2` | `9333EA` | violet |
| `data/3` | `C57A2E` | clay |
| `data/4` | `2563EB` | blue |
| `data/5` | `E11D74` | rose |

Each has a soft partner, `data/1-soft` through `data/5-soft`, for the area under
a line and for the empty dots in a matrix.

The order is not a taste decision. It is the thing that keeps the chart readable
to someone who cannot tell red from green. Colours are handed out in this order
and never cycled, because neighbouring slots are the ones that end up touching,
and this order is the one where every neighbouring pair stays far apart. The
worst neighbouring pair is 19.2 apart under simulated protanopia and 33.9 apart
under normal vision, against a target of 8 and a floor of 15.

Two rules come out of that and both are hard:

**Only the first three slots may be used where any two marks can sit side by
side.** That means dot matrices, scatter plots and small multiples. Blue and
violet are 1.3 apart under deuteranopia, which is nothing. They are safe in a
line or a stacked bar because the fixed order keeps them two apart and they
never touch. They are not safe where anything can neighbour anything. A fourth
series in that kind of chart is not a new colour, it is a fourth chart or an
"Other" group.

**A data colour never touches text.** The tokens are scoped to fills and strokes
only, so Figma will not even offer them for a text layer. A value, a label and a
legend word all wear `ink/strong` or `ink/muted`. The coloured dot beside the
word carries the identity, and the word carries the meaning, so colour is never
the only thing telling two series apart.

### 2.8a Charts are grey by default

Having a data palette is not a reason to spend it.

A chart is drawn in greys unless colour is carrying something a grey cannot.
`ink/subtle` for a sparkline, `ink/strong` for the one line a card is about,
`chart/grid` for the gridlines, and a faint wash of `ink/strong` for the area
beneath. That is the whole language for most charts in the product.

Colour appears in exactly two places. A stock being up or down, which is
`state/positive` or `state/negative` on the number and its arrow. And the series
of a chart that genuinely has to tell several things apart, which is where the
five slots in 2.8 earn their place.

The reason is that a chart on a dashboard is competing with the figure it exists
to explain. The first version of the desktop Home had a six month chart in two
strong colours, and it took the eye before the balance did. The chart was
answering a smaller question more loudly than the screen was answering the big
one. Greying it did not make it less useful. It made it stop shouting.

The five colour palette stays in the system. It is for the charts that need it,
which are fewer than they look.

## 2b. The seventy twenty ten split

Every screen is roughly seventy percent white, twenty percent light grey and ten
percent green. The split is not a guideline to feel your way towards. It decides
what may be green.

**White is the page.** The canvas, and the inside of anything that is not a card.

**Light grey is structure, and grey is also every control that is not primary.**
`FAFBFC` on the canvas and `F0F2F4` nested inside it for cards, sheets, panels
and fields. `E9ECEF` for secondary buttons and unselected chips. Grey does all
of this alone, because there are no lines to help it.

An unselected chip is grey, never a green tint. Green on a chip means it is the
one you picked. If every chip is green, the selected one has nothing left to say.

**Green is only these five things.**

1. Primary buttons, filled.
2. Secondary buttons, as the label only. The fill is grey.
3. The selected state: the active navigation pill, a chosen chip, a selected row.
4. A toggle that is on.
5. Money that moved in the good direction, and the sparkline that shows it.

Everything else that a person might expect to be green is grey. A circle behind
a glyph is grey. The four action circles on home are grey. A row's icon is grey.
A settings tile is grey. If every icon sits on green, green stops meaning
anything and the amounts stop standing out, which is the one place on home where
green has real work to do.

The exceptions are the ones that carry a fact rather than a decoration: a status
pill, an outcome badge, a toggle that is on, a progress bar, and the information
callout. Those keep their colour because the colour is the message.

Nothing else is green. A card is never green. A header band is never green. The
balance sits on light grey with dark green figures, not on a green fill, because
one green card on its own spends the whole ten percent.

**Four screens are exempt** and always will be: the welcome screen and the three
camera screens. A welcome is a moment rather than a page, and a camera needs a
dark ground or the capture frame cannot be seen.

The deep green is still the brand. It carries more weight at ten percent of the
screen than it did at forty, because it now only ever means something.

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

Four sizes on the phone. A fifth exists on desktop and nowhere else.

`12 → 14 → 18 → 36` on mobile, plus `48` on desktop.

| Style | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `Display XL` | 48 / 52 | SemiBold | -1.6 | Desktop only. The hero figure on a wide screen. One per screen. |
| `Display` | 36 / 40 | SemiBold | -1.2 | The hero figure. One per screen, never two. |
| `Title` | 18 / 24 | SemiBold | -0.4 | Screen title and section title. |
| `Body strong` | 14 / 20 | SemiBold | -0.2 | Row title, button label, any value. |
| `Body` | 14 / 20 | Regular | 0 | Sentences, explanations, subtitles. |
| `Label caps` | 12 / 16 | SemiBold | +1.2 | Uppercase eyebrow above a value. |
| `Label` | 12 / 16 | Regular | 0 | Timestamps, chips, captions, links. |

Seven styles, six of which the phone uses. That is the whole system.

`Display XL` exists because a 36 figure that filled a 390 screen looks modest on
a 1440 one. It is the only concession desktop gets. Every other size, weight and
tracking is identical on both, so one system covers two products.

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
| 48 | 18 |
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

Separation comes from surface colour and from space. Not from lines, and not
from shadows. The only exceptions are a bottom sheet and a floating element,
which both use `0 8 24 rgba(5, 51, 41, 0.10)`, because both of them float over
content and a person has to read them as lifted.

This leaves the system with two tools where most systems have four. Where a line
would have done the work, the answer is a surface step or more space, and if
neither is available the answer is that the two things did not need separating.

There is exactly one gradient in the product: the area under a chart line, the
line colour at 22 percent fading to nothing. It is part of the chart, not a
surface. Nothing else is ever a gradient.

## 8. Components

### 8.1 Buttons

| Property | Primary | Secondary | Quiet | Destructive | Inverse |
| --- | --- | --- | --- | --- | --- |
| Fill | `ink/strong` | `surface/control` | none | `state/negative` | `surface/sand` |
| Label | `ink/inverse` | `ink/strong` | `ink/strong` | `ink/inverse` | `ink/strong` |
| Border | none | none | none | none | none |
| Height | 56 | 56 | 56 | 56 | 56 |
| Radius | pill | pill | pill | pill | pill |
| Type | `Heading/M` | `Heading/M` | `Heading/M` | `Heading/M` | `Heading/M` |

Primary and Secondary must read as equal weight when they sit side by side, as
Buy and Sell do. Secondary is pressed at `surface/control-pressed` and disabled
at `surface/sunken` with an `ink/subtle` label, which is lighter than the
enabled control on purpose, so a disabled button recedes rather than shouts.

Use Inverse on a deep green screen, because a dark button on deep green
disappears. A medium button is 48 tall and uses `Label/M`. There is no small
button. Pressed is 88 percent opacity and disabled is 38 percent opacity on the
whole button. Do not use a separate grey for either.


#### Secondary

White fill, a one pixel `surface/inverse` edge, and a `surface/inverse` label.
Not a grey fill and not a green fill. Next to a solid green primary it reads as
the quieter of the pair while still carrying the brand.

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

A 44 circle filled with `surface/control` holding a 12 glyph in `ink/strong`.
The only shape for a secondary action in an app bar or beside a field. It uses
the control grey and not the card grey, because it is tapped.

The four action circles on home are the same idea at 56, with a `Label/M` caption
under each one.

### 8.3 Card

`surface/default`, 24 radius, 20 padding. No border and no shadow. A panel
nested inside it is `surface/sunken` at 16 radius with 16 padding. The radius is
doing most of the work of telling you a card is there, so it is never reduced.

### 8.4 List row

56 tall with 8 padding top and bottom. A 40 circle in `surface/sunken` holding a
12 glyph on the left, 8 gap, then
the title in `Heading/M` and the caption in `Body/S` stacked with a 4 gap. The
amount sits right in `Heading/L`.

There is no divider. Rows are separated by an 8 gap, which puts 24 between one
row's caption and the next row's title. That is the smallest gap that still
reads as two rows rather than one paragraph.

### 8.5a Chip

32 tall, full round, 12 padding left and right, the label in `Label/M`.
Unselected it is `surface/control` with an `ink/strong` label. Selected it is
`surface/inverse` with an `ink/inverse` label. There is no third state and no
border in either.

The one exception is the "Later" pill in the More sheet, which is
`surface/sunken` with `ink/muted` text. It sits lighter than a real chip because
it is not a control and tapping it does nothing.

### 8.5 Status pill

Full round, 4 padding top and bottom, 12 left and right, a tint background, a 8px
dot in the matching solid fill, 8 gap, then the word in `Label/M`.

### 8.6 Text field

56 tall, 16 radius. At rest it is a grey fill with no border, one step below
whatever it sits on: `surface/default` on the canvas, `surface/sunken` on a card
or a sheet. Focused it takes a 2px `border/focus` ring. On error it takes a 2px
`state/negative` ring and the helper text turns `state/negative` at the same
time. The label sits above in `Label/M` and `ink/muted` with an 8 gap.

A field at rest is therefore a very quiet shape. The placeholder text is what
tells a person it is a field, so it is never left empty.

### 8.7 Floating navigation

Two floating elements, 20 in from each side, 24 above the safe area, both 64
tall. On the left a rounded group of destinations. On the right a single More
button. Both use `surface/frost` with a background blur of 24 and the floating
shadow.

| Part | Value |
| --- | --- |
| Destinations | Home, Money, Grow, Stocks |
| Group | padding 8, gap 4 between items, radius pill |
| Inactive item | 48 by 48, glyph only, `ink/muted` outline |
| Active item | 64 by 48 pill in `surface/inverse`, glyph filled in `ink/inverse` |
| More | 64 circle, its own frosted element, gap 12 from the group |
| Total width | 236 group plus 12 plus 64, inside the 350 available |

The items carry no labels. Four destinations and a label on the active one does
not fit in 350, and shrinking the type or the side inset to force it would cost
more than the labels are worth. State is carried by the pill and by the glyph
filling, which is shape, not colour.

Money is one destination covering all four movements: buying, receiving,
sending and converting. It exists because the phone has four slots and the
product has eight places to go. Account and History are not on the bar at all;
they live behind More, and More fills in `surface/inverse` when the person is
somewhere that lives inside it, so the bar is never showing nothing as current.

There are five states, one per destination plus More. A screen that sits behind
a sheet keeps the state of the page underneath it.

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
| Grabber | 40 by 4 pill in `ink/subtle`, centred |
| Gap between groups | 24 |
| Scrim | `ink/strong` at 50 percent over the whole screen |

The sheet holds two groups and they are never mixed.

1. **Now.** Under a `Label/Caps` heading that reads "Now". Each item is a full
   row with a 40 tile, a `Heading/M` title, a `Body/S` line saying what it does,
   and a chevron. These open.
2. **Later.** Under a `Label/Caps` heading that reads "Later". Each item is a
   flat pill in `surface/sunken` with `ink/muted` text. No border, no tile, no
   chevron, no shadow. A `Body/S` line under the group says plainly
   that nothing there can be opened.

Now holds History, Account, Security, Limits, Support and About Tokkenly. Later
holds Bills and Spend, and nothing else.

Converting to naira used to sit under Later. It was moved out when the code was
read, because converting is live and has been for some time. A thing listed as
not built when it works is the same failure as a thing listed as working when it
is not, and it is worth checking this list against the code rather than against
memory.

The two groups must stay visibly different. A later item never borrows the row
shape of a now item, because a row with a chevron promises that tapping it does
something.

The sheet covers the floating navigation while it is open. That is correct, and
it has to be built that way: the navigation is drawn before the scrim so the
scrim and the sheet land on top of it. Drawn in the other order the navigation
punches through a sheet that is supposed to be modal.

The grabber and the scrim are both ways out.

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
as a rough draft. Tight rows read as a finished product and fit more on the
screen. Air belongs between sections, not inside them. With no dividers to lean
on, the gap inside a list has to stay smaller than the gap around it, or the
list stops being a list.

**The numbers are the product.** Money is set large, tracked tight, with the
currency mark and the decimals stepped down. Everything around a number is
smaller and quieter than the number.

**Chrome recedes.** The status bar, the header and the navigation are furniture.
They are never the most interesting thing on the screen.

**Nothing is decorative.** Every mark carries information. If a shape can be
removed and nothing is lost, remove it.

**Space is structure.** Leftover space at the bottom of a screen is a mistake.
Space that separates two ideas is a decision. The difference shows.


### 8.12a The dashboard parts

Five components carry the desktop dashboard. They live on `02 Components`.

| Component | Variants | What it is |
| --- | --- | --- |
| Delta chip | Up, Down, Flat | The change against the last period. The arrow carries the direction, so a person who cannot see the colour still reads the sign. |
| Legend item | Slot 1 to 5 | One series. A dot in its data colour and the name in `ink/muted`. |
| Detail toggle | Simple, Detailed | The one control that governs how much the whole screen says. |
| Amount ruler | one | A tick track you drag to set an amount. |
| Stat card | Line, Segments, Dots | One headline figure, its change, and a small chart. |

The **Amount ruler** is the tactile part. It is 408 by 72, a tick every 8, and
every fifth tick is taller. That taller tick is the whole point. It gives the
drag a rhythm, so a person feels where they are instead of only reading it. The
ticks fade toward both edges so the track reads as continuing past the card
rather than stopping at a wall, and one bold line in the middle is the value
under the finger. It belongs anywhere a person picks an amount, which is Send,
Buy and Convert on both products.

The **Stat card** is 360 by 176. Its three chart forms are not decoration. Line
is for one series over time. Segments is for a total split into parts. Dots is
for comparing three series, and three is the limit, because a dot matrix is a
chart where any two dots can end up neighbours. See 2.8.

### 8.13 Charts

A chart is the one place in this product where a person reads data instead of
glancing at it. It is therefore the one place allowed axes, gridlines and a
gradient. None of that travels to the rest of the product.

There are two sizes of chart and they follow different rules.

#### The sparkline

Inline in a card or a row, showing direction only. A 2 stroke in
`state/positive` when the period is up and `state/negative` when it is down,
with a gradient area under it. No axes, no gridlines, no labels, no tooltip. The
number beside it says what it is worth.

#### The full chart

On a stock page, on either product. Every part below is required.

| Part | Value |
| --- | --- |
| Plot | 624 by 288 on desktop, 294 by 200 on mobile |
| Price axis | 5 labels in `Label` and `ink/muted`, right aligned, left of the plot |
| Time axis | 4 to 6 labels in `Label` and `ink/muted`, under the plot, starting where the plot starts |
| Gridlines | Vertical only, 1px `chart/grid`, evenly spaced. Never horizontal |
| Line | 2 stroke, `state/positive` up or `state/negative` down, round cap and join |
| Area | The line colour at 22 percent under the line, fading to nothing at the bottom |
| Crosshair | 1px dashed `ink/subtle` at 50 percent, floor to ceiling |
| Point | A 12 circle, white fill, 2 stroke in the line colour |
| Tooltip | `chart/tooltip`, radius 12, the time in `Label` and `ink/inverse-muted`, then the values in `Body strong` and `ink/inverse` |
| Periods | 7 chips on desktop, 5 on mobile, the standard chip from 8.5a |

**Every line is a curve, never a run of straight segments.** Points are joined
with a monotone cubic curve, which is smooth at every point and, unlike a plain
spline, can never bulge past a real value. A chart that invents a high the stock
never reached is a lie, however pretty it looks.

**The tooltip never covers the line.** It sits above the point when there is
room and beside it when there is not. It lives inside the plot, so it is also
the one element that has to be checked against the card that clips it.

**Chart insides are not held to the divide by four rule.** A point sits where its
value puts it. The box around the chart still obeys the rule.

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
| Grabber | 40 by 4 pill in `ink/subtle`, centred |
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

### 8.17 The QR code

Drawn, not scaled. A code that has been resized has uneven modules and stops
reading as a code.

| Part | Value |
| --- | --- |
| Block | 160 square, radius 24, `surface/scan`, no border |
| Grid | 15 by 15 modules at 8 each |
| Quiet zone | 20 on every side |
| Finder | 5 modules square, 1 module ring, 1 module centre, in three corners |
| Modules | `ink/strong`, square, no rounding |

If the block ever changes size, redraw it. Pick a module size and a count whose
product plus the quiet zone lands on the new box, so every module stays whole.

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

1. Two font weights per screen. Geist SemiBold and Geist Regular.
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
13. Never draw a line. No card outline, no field outline, no list divider, no
    chip edge, no rule under a heading. Outside a chart the only strokes are a
    2px green focus ring, a 2px error ring, and the glyphs themselves. If two
    things need separating, step the surface or add space. A chart is the single
    named exception, spelled out in 8.13, because reading a price is not the
    same job as glancing at a card.
14. Never nest more than three surface levels.
15. Never compose an amount below 36. Set it flat.
16. Never draw a glyph at any size but 12, and never at any stroke but 2. The
    box around it changes, the glyph does not.
17. Never put an unbuilt part of a product onto the home screen. It goes behind
    More, under the "Later" heading, as a flat pill that carries no chevron and
    opens nothing. A whole product may show a hint on home, because it has a
    place in the navigation to lead to. The hint carries a "Soon" marker.
18. A whole product is the exception. It may sit in the navigation before it
    opens, because it is what the account grows into. While it is not open it
    carries a "Not open yet" pill on its own page. A part of a product never
    gets this exception, only a product does. **Superseded for Grow and Market
    on 3 September**, which are now treated as live and carry no marker. See
    11c.4a for what that costs.
19. Never put a data colour on text. `data/1` to `data/5` are scoped to fills
    and strokes so the picker will not offer them for a text layer. The dot
    beside a word carries the identity, the word carries the meaning, and no
    reader ever depends on colour alone.
20. Never hand out data colours out of order, and never cycle them. The order is
    what keeps the chart readable to a colour blind reader. Where any two marks
    can end up neighbours, only the first three slots exist. See 2.8.
21. Never size a card by eye. Measure what its content needs, then set the
    height. Every card on the desktop Home was solved this way, which is why the
    two states of it have different row heights.
22. Never draw a chart in colour by default. Grey is the default and colour is
    the exception, earned only by a rise or fall, or by a series that has to be
    told apart from another. See 2.8a.

## 11. The screens, by flow

Every screen sits inside a named section in Figma. A section holds one flow, a
short note that says what the flow is for, and an arrow between each step. Where
two screens are alternatives rather than steps there is no arrow between them.

Every section is filled `surface/default`. That matters more than it sounds.
Figma gives a new section a dark fill, and a white screen sitting on a dark
section reads as a card with a heavy shadow behind it, which is not what the
screen looks like. The pale fill lets the screen read as the white page it is.
No screen sits loose on a page.

### 11.1 Onboarding, page `03 Onboarding`

| Flow | Screens |
| --- | --- |
| A. Set up a new account | Welcome, How this works, Recovery phrase hidden, Recovery phrase revealed, Confirm your phrase, Create a PIN, Confirm your PIN, Unlock with your face |
| B. Confirm your mobile number | Your mobile number, Enter the code |
| C. Verify your identity | Verify your identity, Choose NIN or BVN, Enter your NIN, Check your details, Photograph your ID, Check the photo, Take a selfie, Review and submit |
| D. After you submit | Under review, Verified, More information needed |
| E. Come back to your account | Restore your account |
| F. Sign in and sign up | Sign in, Create account |

Flow D holds three outcomes of the same check, so its screens carry no arrows.
Flow F holds the two ways in, so its screens carry no arrows either.

Every onboarding screen sits on `surface/canvas`. There are no deep green
screens. Welcome used to be deep green and the three camera steps used to be
deep green, and they are now white like the rest of the product. The only deep
green left in the flow is the camera feed itself on Photograph your ID, Check
the photo and Take a selfie. That block is not a background choice. It stands
for what the lens is seeing before the picture is taken, so it has to be dark
for the sand guide drawn on top of it to read.

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
| N. Earn and Borrow | Move money in, Borrow amount, Borrow review, Borrow done |
| O. Buying and selling | Stock detail, Buy amount, Buy review, Buy done, Sell |
| P. Money | Money, Buy, Convert |

Flow F holds two states of one screen, so its screens carry no arrows. In flow H
the last two screens are the two endings of the same send, so the arrow stops at
the review screen. In flow P, Buy and Convert are two sheets that open from
Money, so they are alternatives to each other and carry no arrows either.

### 11.3 What every screen has to satisfy

17. The frame is 390 by 844 and nothing spills past it.
18. Side padding is 20. The status bar is 56 and an app bar, when there is one,
   is another 56.
19. A screen that shows the floating navigation ends its content 88 above the
   bottom, and no element reaches into the navigation.
20. A screen without the navigation ends its content 32 above the bottom.
21. Two font weights, and every size and gap a multiple of 4.

## 11b. The desktop product

The desktop product is the same account on a wider screen. Same balance, same
send and receive, same Grow and Stocks, same colours, same type, same rules.
What changes is the shape of the page, because a monitor is not a phone held in
one hand.

### 11b.1 The canvas and the grid

| Part | Value |
| --- | --- |
| Canvas | 1440 by 1024 |
| Sidebar | 240, fixed, always visible |
| Content | 1200 |
| Content padding | 36 on each side |
| Columns | 12 at 72 |
| Gutter | 24 |

The numbers close exactly: 240 plus 1200 is 1440, and 36 plus 864 of column plus
264 of gutter plus 36 is 1200. Every one of them is a multiple of 4, so the
divide by four rule survives the move to desktop untouched.

Home uses an 8 and 4 split: 744 for the money column and 360 for the side
column, with the 24 gutter between them.

### 11b.2 The sidebar

There is no More sheet on desktop. More only ever existed because a phone can
show four destinations and no more. A sidebar shows seven with their names, so
everything that hid behind More now sits in the open.

| Part | Value |
| --- | --- |
| Width | 240 |
| Fill | `surface/default` against the white content area |
| Padding | 20 at the sides, 32 at the top, 24 at the bottom |
| Brand | A 32 mark in `surface/inverse` at radius 8, 12 gap, the name in `Title` |
| Item | 40 tall, pill radius, 16 padding at the sides, a 12 glyph, 12 gap, the label in `Body strong` |
| Gap between items | 4 |
| Gap between groups | 32 |
| Selected item | `surface/inverse` fill, `ink/inverse` label and glyph |
| Unselected item | No fill, `ink/muted` label and glyph |
| Footer | The avatar, the name in `Body strong` and the state in `Label`, pinned to the bottom |

The sidebar holds two groups. First the places money lives, then the places the
account is managed: Account, Security and Support.

The first group is now ordered by what the product is for, not by what it can
do alphabetically:

`Home · Market · Buy · Grow · Convert · Receive · Send · History`

Market comes second, right under Home, because trading is the reason the
product exists. It was called Stocks until Home took over the portfolio, at
which point Stocks and Home were two names for the same idea. Home is now what
you own. Market is what you could own. Sending and receiving sit at the bottom
of the group because they support the trading rather than being the point of it.

The selected glyph does not fill on desktop, and on mobile it does. That is not
an oversight. On mobile the glyph is alone, so filling it is the only way to show
which one is active without relying on colour. On desktop the item carries a
label and a deep green pill, so the state is already carried by shape and not by
colour alone.

### 11b.3 What desktop does differently

- **Scan is gone.** A person cannot point a monitor at a QR code. Home offers
  Receive and Send, and nothing else.
- **Receive and Send carry equal weight.** Both are `surface/control` pills of
  the same size, because they are the same size of decision. Neither is filled
  green, which would make a claim the product does not mean.
- **Activity is a table, not a list.** It gains a `Label caps` heading row and a
  Type column, because a wide screen has room to say what a payment was as well
  as who it was with. There are still no dividers and no lines. Rows are 56 tall
  with an 8 gap, exactly as on mobile.
- **Home shows more.** Eight payments instead of three, and the side column
  carries Stocks, Grow and the people you send to most.
- **Home still shows no address, no token and no chain.** Rule 8.16 does not
  relax because the screen got bigger.
- **A sheet becomes a centred modal.** Same job, same content, different arrival.
  480 wide, radius 28, 32 padding, `surface/default`, over the same
  `ink/strong` scrim at 50 percent. It is centred in the window and it never
  runs past the bottom of it.

### 11b.4 The desktop screens

| Screen | What it holds |
| --- | --- |
| D01 Home | Cash strip, the portfolio and its positions, Borrow, Earn, activity. Drawn in both Simple and Detailed |
| D02 Activity | Search, three filters, export, twelve payments across five columns |
| D03 Grow | The hero figure, then Earn and Borrow side by side |
| D04 Market | Search, seven categories, three indices, five plain language picks, what is moving today, popular |
| D05 Apple | The full chart, today's trading, growth and valuation, your position, trending, news |
| D06 Account | Personal details, your address with its warning, verification, devices |
| D07 Security | How you get in, recovery, where you are signed in |
| D08 Support | Common questions, how to reach a person, service state |
| D09 Send | Who and how much, in one modal |
| D10 Send review | What is about to happen, before it happens |
| D11 Send sent | The outcome, with the reference |
| D12 Receive | The drawn code, the address, the network warning |
| D13 Buy | Naira in, dollars out, the rate, the moving minimum, recent orders |
| D14 Convert | Dollars out, naira into a bank, capped by the balance, saved banks |
| D15 Sign in | Google first, then email and password, on a 480 card centred on white |
| D16 Create account | The same card, plus what happens next and the terms line |

Every one of the sixteen was checked: nothing runs past the frame, nothing falls
below the fold, every gap and padding divides by four, and no grey line exists
anywhere.

The first twelve were drawn before the code was readable. D13 and D14 came
after, and D15 and D16 after those. All sixteen sit on `surface/canvas`, and the
fourteen that are signed in carry the same eleven sidebar entries from 11c.4.
D15 and D16 carry no sidebar, because nobody is signed in yet.

Five screens survive the audit in 11c unchanged: Home, Account, Security,
Support and Receive. Activity becomes History and takes on the filter that
replaces Withdrawals. Grow and Stocks keep their place but must lead somewhere
honest. The send flow needs rebuilding around sending to a wallet, which is the
only rail the product has. Portfolio and Withdrawals do not exist here yet.

### 11b.4a Home is the portfolio

Home has been rebuilt twice. The first version reported and nothing more. The
second put a money in and out chart at the centre of it. That chart was the
loudest thing on the screen and it was answering a question nobody opens this
product to ask, so it is gone.

Tokkenly sells stocks trading. Home now says so.

| Band | Height | What it holds |
| --- | --- | --- |
| Header | 44 | The greeting, the Simple and Detailed toggle, notifications |
| Cash | 76 | The cash balance, what it is ready for, Add money and Convert |
| Portfolio | 400 | Left 744: the value, the change, the range, the chart. Right 360: five positions and what is still uninvested |
| Offers | 360 | Borrow, Earn and Recent activity, three cards of 360 |

The order is the priority: stocks first and largest, then borrowing and lending,
then a little of converting. Cash is a thin strip at the top rather than a card,
because it is not the product, it is what funds the product. Converting lives in
that strip as one control beside Add money, which is the "a little" it was
asked for.

The send ruler moved off Home to the Send screen. It was the single biggest
block of space on the previous version, and sending is not what this product is
selling. The component is unchanged and still belongs on Send, Buy and Convert.

**Charts are grey here.** See 2.8a. The portfolio line is `ink/strong` on a
faint wash of the same ink, every sparkline is `ink/subtle` at 1.5, and the only
colour on the screen is the numbers that say up or down. That is the whole point
of the change: a chart that shouts is a chart competing with the figure it
exists to explain.

### 11b.4b The Market page

`D04 Market` was `D04 Stocks`. It is where you go to find something to buy, and
it is built to be browsed rather than searched:

| Band | What it holds |
| --- | --- |
| Header | The title and one search field |
| Categories | All, Popular, Technology, Funds, Dividend, Energy, Recently listed |
| Indices | S&P 500, Nasdaq, Dow Jones, with grey sparklines |
| Worth a look | Five picks written as plain sentences, not tickers |
| Moving today | Three up and three down |
| Popular | Four cards |

The Worth a look card is the one that matters. A market page full of tickers
only helps a person who already knows what they are looking for. Each row leads
with what the thing is in plain words, "One fund, five hundred companies",
and keeps the tickers as small grey text at the end for the person who does
know. It carries the line "Picked weekly, not advice", because a list of
suggestions inside a product that takes your money has to say what it is.

### 11b.5 The desktop flows

The sixteen screens used to sit loose on the page in a grid of four across.
They now sit in named sections like the phone screens do, one section per flow,
in the order a person meets them.

| Flow | Screens |
| --- | --- |
| A. The way in | D15 Sign in, D16 Create account |
| B. Home | D01 Home, D01 Home detailed |
| C. Receive money | D12 Receive |
| D. Send money | D09 Send, D10 Send review, D11 Send sent |
| E. Buy and convert | D13 Buy, D14 Convert |
| F. Activity and receipts | D02 Activity |
| G. Grow and Market | D03 Grow, D04 Market, D05 Apple |
| H. Account, security and support | D06 Account, D07 Security, D08 Support |

Arrows appear only between real steps. Flow D carries two, because the send is a
chain. Flow G carries one, between Stocks and the company page it opens. Flows
A, E and H hold alternatives rather than steps, so they carry none.

A desktop section is 60 of padding on each side, its note at 48 from the top,
and its screens at 144. Screens sit 160 apart, and sections sit 240 apart. The
phone pages use the same shape with 48 between screens, because the frames are
narrower.

## 11c. What the product actually does

Everything above this section was designed before anyone had read the code. On
2 September the frontend repository was finally readable, and it says the
product is not quite the one the design assumed. This section records what is
really there, so nothing after it is invented.

Source: `tokkenly-frontend`, a workspace holding three applications and two
shared packages. `apps/web` is the marketing site, exported as static HTML.
`apps/dashboard` is the signed in product, rendered on a server because a
session cookie has to be set by one. `apps/admin` is a separate panel for staff.

### 11c.1 What a person can do today

| Route | What it is |
| --- | --- |
| `/` | Home. Balance, recent movement |
| `/buy` and `/buy/[id]` | Buying a balance with local currency |
| `/deposit`, `/deposit/crypto`, `/deposit/crypto/address` | Receiving. Either buy with naira or receive on a chain |
| `/send`, `/send/wallet`, `/send/recipient` | Sending out to a wallet |
| `/convert` | Turning a balance into local currency, paid to a bank |
| `/transactions` and `/transactions/[id]` | History, and one movement in full |
| `/portfolio` | What is held, reached from the balance card |
| `/withdrawals` and `/withdrawals/[id]` | Money on its way out, reached from a completed send |
| `/settings` plus account, security, payout, alerts | Settings |

Signing in is its own set: `login`, `signup`, `verify-email`,
`forgot-password`, `reset-password`, `activate` and `locked`. It is an email
and a password with a Google option, an emailed verification, and a lock that
takes over after a period of no activity.

### 11c.2 Facts that constrain every screen

- **One asset. USDC and nothing else.** Naira and Tether appear in the registry
  and are not supported.
- **The interface returns no dollar valuation at all.** A balance is its own
  dollar value because a USDC is a dollar. A second asset would need a rate
  from somewhere that does not exist yet, so no screen may show a converted
  total until it does.
- **Buying and cashing out are separate corridors.** The countries the product
  collects money in are not the same list as the ones it pays out to, and both
  lists come from the server. A screen that names Nigeria in its own text is
  wrong the day a second country opens.
- **Buying is not capped by your balance.** Cashing out is. That is the whole
  difference between the two amount screens.
- **Verification gates whether money can move at all**, and it can also be
  switched off entirely, in which case nothing is gated and no screen should
  imply otherwise.
- **Money leaving has six states, not three.** One of them means the payment
  was sent to the network, has not been picked up, and is neither finished nor
  failed. Calling that failed would tell someone their money is safe when it
  may still be moving, and invite them to send it twice.
- **An unrecognised state reads as in flight, never as failed.** The words that
  mean trouble are a closed list. Anything outside it is far more likely to be
  a new step than a new failure.

### 11c.3 What the code disagrees with in this document

Their team already cut the navigation from eleven destinations to five, and
deleted the screens behind Cards, Earn, Markets, Borrow, Promotions, Pay Bills
and Refer. Their stated reason was that a navigation full of things you cannot
do is worse than no entry at all.

This document said the opposite in rule 18. Rule 18 stood until 3 September:
Grow and Stocks kept their place and carried a marker. On 3 September the
markers were removed and both are treated as live, because trading is the
selling point of the product. 11c.4a records that decision and the risk in it.

### 11c.4 The routing, after the revamp

Four ways money moves, each with its own destination, exactly as the code has
them. Their names stay, because Buy, Receive, Send and Convert are already the
words a person would use.

| Rail | Route |
| --- | --- |
| Home | `/` |
| Buy | `/buy` |
| Receive | `/deposit` |
| Send | `/send` |
| Convert | `/convert` |
| Grow | `/grow` |
| Market | `/market`, was `/stocks` |
| History | `/transactions` |

Account, Security and Support sit at the bottom of the sidebar, away from the
eight above.

**Two screens stop being destinations.** Portfolio folds into Home, because the
balance card is already there and a second page of the same numbers is a page
nobody needs. Withdrawals folds into History, which gains a filter for
everything, money in, and money out. Their detail pages stay, reached from a
row, because a movement in full is worth its own address.

**The phone cannot carry eight.** The tab bar holds four and a More control. It
carries Home, Money, Grow and Stocks, and the Money screen is `27 Money` on the
app page. Account and History moved behind More. Money is one destination covering all four
movements, which frees two tabs for the products that are coming.

That choice was made knowing its price, and the price is written here so nobody
has to rediscover it. Paying somebody is the most common thing anyone does in
this app, and it now costs one extra tap on a phone. Two of the four tabs lead
to things that do not work yet. Their team had eleven such entries, measured the
result and cut it to five. If the tabs are ever reconsidered, this is the
paragraph to read first.

Desktop has room for all eight and uses them, so the two products differ here on
purpose. It is the same reason More exists on one and not the other.

**Grow and Stocks carry a marker in the rail itself**, a six pixel dot in
`fill/warning` after the label. A destination that does not work should say so
before it is opened, not after.

### 11c.4a Stocks and lending are treated as live

On 3 September the direction changed. Stocks trading is the selling point of the
product, so it leads the desktop Home, and borrowing and lending come second.
Every Not open yet marker has been removed: the two amber dots in the sidebar,
the pill on the Grow page and the pill on the Market page.

This is the riskiest thing in this file and it needs saying plainly.

Section 11c.2 records what the code says, and the code says the opposite. There
is one supported asset and it is USDC. There is no USD valuation anywhere in
their API. The Markets, Earn and Borrow screens were deleted by their own team
because they were coming soon against nothing. The design now shows a portfolio
of five holdings, a borrowing rate, a collateral level and a liquidation price,
and none of that exists in the code that was read on 2 September.

Two things can make that fine and only two. Either the build is ahead of what
was readable, or these screens ship at the same time as the product behind
them. If neither is true, this is a design that promises a person their money is
invested and earning when it is not, which is the exact failure the audit in 11c
was written to catch.

The decision was made by the person who owns the product, with the conflict
stated. It is recorded here so nobody later mistakes it for something the code
supported.

### 11c.5 Signing in

Google first, an email and a password underneath it. Their code already carries
the Google control, so this is a change of layout and not of the server.

The twenty two screens in section 11.1 describe a different product, one where
a person holds their own recovery phrase. That is not what was built. Those
screens stay in this file as a record and are not the plan.

The verification screens are the exception and they survive, because the code
does gate money movement on a verified account and has no screens for getting
verified.

Four screens now carry this. On the phone they are `23 Sign in` and
`24 Create account`. On desktop they are `D15 Sign in` and `D16 Create account`.
All four share the same order. The Google button comes first as a full width
control on `surface/control`. Under it sits the label `OR USE YOUR EMAIL` in
`Label caps` and `ink/muted`, which does the work a divider line would do
without drawing a line. Then the email field, then the password field with a
Show control inside it. The primary button is last.

Sign in adds a Forgot your password link above the button and a link to create
an account below it. Create account adds the terms sentence under the button and
a link back to sign in. Neither screen shows the floating navigation, because
there is no account to navigate yet.

Desktop puts all of this on a 480 wide card in `surface/default`, centred on
`surface/canvas`, with the fields in `surface/sunken`. The phone uses the full
width inside the usual 20 of side padding.

The example address in every field is `ibrahimweng0@gmail.com`.

### 11c.5a Sending

Paying a person stays the front door, with sending to a wallet behind it.

The code has only the wallet rail. Sending to another Tokkenly account by its
reference was withdrawn, so the person flow in this file is ahead of what
ships and needs that rail brought back before any of it can be built.

### 11c.6 Not designed yet

Buy and Convert are now drawn on both products, as `D13` and `D14` on desktop
and as `28 Buy` and `29 Convert` on the phone. Signing in and signing up are
drawn on both as well. Portfolio and Withdrawals are still missing, though both
fold into screens that exist: Portfolio into Home, Withdrawals into History with
its filter.

The staff panel is out of scope for now. It holds a list of users, a user in
full, transactions, and a log of who looked at what. It is a different audience
with different needs and it should not borrow the consumer layout unexamined.

## 12. The prototype

Both pages are wired for a click through. The floating navigation works on
every screen that carries it, the send flow runs from picking a person to the
receipt, and the onboarding screens run in a straight line.

Figma does not allow a prototype link to cross from one page to another, so the
onboarding prototype ends at Verified and the app prototype starts at Home.
Testers open them as two separate runs.

Starting points are set. Onboarding opens at Welcome or at Restore your
account. The app opens at Home or at a brand new account.
