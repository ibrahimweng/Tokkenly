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
| `surface/sand` | `D5A578` | The saturated sand. A badge, a chip, a small mark inside an accent card. Never the card itself. |
| `surface/sand-soft` | `F7EFE7` | The sand accent card. Once per screen. Warm enough to read as an accent, pale enough to carry `ink/muted`. |
| `surface/frost` | `FAFBFC` at 88% | Floating surfaces that content scrolls under. Always paired with a background blur of 24. |
| `surface/scan` | `FFFFFF` | Behind a QR code. The one exception to the white rule, because a reader needs the quiet zone. The one token that does not change in dark mode. |
| `surface/hero` | `053329` | The balance hero on the pending and first run Home screens. Its own token because it must not invert in dark mode. See 2.9a. |
| `surface/hero-raised` | `094135` | Buttons sitting on that hero. |
| `surface/camera` | `053329` | The viewfinder and the captured photo. A camera preview stays dark in both modes. |

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

These are the light mode values. Every one of them has a dark mode partner and
the dark figures are in 2.9.

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
| `surface/sand-soft` | `F7EFE7` | 12.21 | 4.74 |
| `surface/sand` | `D5A578` | 6.27 | 2.71 |

`surface/sand` at `D5A578` carries `ink/strong` at 6.27 to 1 and nothing else.
`ink/muted` on it is 2.71 to 1 and is never allowed. That is the reason the
accent card is now `surface/sand-soft` and the saturated value survives only as
a badge, where the one word on it is `ink/strong`.


`ink/muted` on `surface/control-pressed` is the one pair below 4.5 to 1, at 4.46.
Nothing uses it. A pressed control always carries `ink/strong`, which reaches
10.65 to 1, and the pressed state lasts as long as a finger is down.

Contrast is not the risk here. Every pair in use passes comfortably. The risk is
surface against surface, which contrast ratios do not measure. `FAFBFC` on
`FFFFFF` is 1.04 to 1. That number is the whole argument for the design and the
whole argument against it.

### 2.7a The check that catches this

Rule 11 has been in this file from the start: never use `ink/subtle` for text a
person needs to read. On 3 September both desktop Home screens were measured and
each had **ten outright contrast failures**, all of them mine, all of them rule
11:

| What | Measured | Needed |
| --- | --- | --- |
| The range tabs `1D 1W 1M 1Y ALL` on `surface/sunken` | 2.57 to 1 | 4.5 |
| The chart period labels `AUG` and `$6,240` | 2.37 to 1 | 4.5 |
| The fund names on the sand card, set at 70% opacity | 3.62 to 1 | 4.5 |

The lesson is not that the rule was missing. The rule was there and I broke it
anyway, in five places per screen, because `8EA39F` looks fine next to a
headline and only fails when it is measured. A rule nobody can test is a rule
that gets broken.

So the rule now has a test. Before any screen is called finished, walk every text
node, composite its own opacity and every ancestor opacity against the nearest
solid surface behind it, and compare the result against 4.5 to 1, or 3 to 1 for
text at 24 or larger, or 18.66 and bold. Three things this catches that reading a
screenshot does not:

- **Opacity is contrast.** Text at `ink/strong` and 70% is not `ink/strong`. It
  is whatever `ink/strong` mixed with the surface comes to, and on sand that is
  3.62 to 1. Opacity below 1 on a text node is a contrast bug every time, so the
  audit resets it rather than reporting it.
- **The surface behind is rarely the canvas.** `ink/subtle` is 2.90 to 1 on
  white and 2.38 to 1 on `surface/sunken`. The number in the ink table is the
  best case, not the case.
- **A component instance carries its own copies.** Fixing the dot column chart
  component fixed 2 texts and 142 dots in one place. Fixing the screens had to
  be done twice, once per screen, because Simple and Detailed are separate
  frames.

Both Home screens now report zero failures. The tightest text on either screen
is the word "Market" at 5.62 to 1 against a 4.5 requirement.

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

### 2.9 Dark mode

The whole product is dark. It is built as a second **mode on the `Colour`
variable collection**, not as a repaint. The collection now has two modes,
`Light` and `Dark`, every one of the semantic tokens carries a value in both,
and every page in the file is set to `Dark`. Nothing was recoloured by hand.

That was only possible because the file was already disciplined: a sweep of all
three screen pages found **11,559 bound fills and strokes and exactly two literal
ones** — a stray `FAFBFC` frame and a stray black vector. Both are now bound. The
lesson is worth keeping: a design system pays for itself the first time somebody
asks for a theme.

**The surface ramp inverts.** In light mode surfaces step *down* from white. In
dark mode they step *up* from near black, because a card has to be lighter than
the page when the page is dark.

| Token | Light | Dark | Step from the one above |
| --- | --- | --- | --- |
| `surface/canvas` | `FFFFFF` | `080F0D` | — |
| `surface/default` | `FAFBFC` | `111D1A` | 1.12 |
| `surface/sunken` | `F0F2F4` | `192926` | 1.14 |
| `surface/control` | `E9ECEF` | `223531` | 1.17 |
| `surface/control-pressed` | `DDE2E6` | `2B403C` | 1.17 |

The dark steps are **larger** than the light ones. Light mode's canvas to card
step is 1.04 to 1, which section 2.3 admits is a whisper. Dark mode cannot afford
a whisper: there are still no border lines anywhere, so the surface step is the
only thing separating a card from the page, and dark values compress. Every dark
step is at least 1.12.

The greys keep a green cast in dark mode where light mode's were neutral. On
white a green tint would compete with the brand green. On near black it reads as
depth rather than colour, and a pure neutral black next to the brand green looks
broken.

**Ink inverts with it.**

| Token | Light | on light canvas | Dark | on dark canvas |
| --- | --- | --- | --- | --- |
| `ink/strong` | `053329` | 13.89 | `D6E2DD` | 14.55 |
| `ink/muted` | `4D6B65` | 5.82 | `96ADA6` | 8.14 |
| `ink/subtle` | `8EA39F` | 2.90 | `5E736D` | 3.83 |

`ink/strong` is `D6E2DD`, not white. Pure white on near black is about 18 to 1
and halates on an OLED panel; `D6E2DD` lands at 14.55, within a whisker of light
mode's 13.89, so the two modes read as the same amount of contrast rather than
one being harsher.

`ink/subtle` still fails 4.5 to 1 on purpose, in both modes. Rule 11 is unchanged.

**The inverse pair swaps ends.** In light mode `surface/inverse` and `ink/strong`
are the same value, `053329`: a deep block carrying white text. Dark mode keeps
that symmetry and flips it, so `surface/inverse` is `D6E2DD` and `ink/inverse` is
`080F0D`: a pale block carrying dark text. The active navigation pill, the brand
mark and every primary button therefore invert for free, and a primary button in
dark mode is a pale pill with dark text, which is what it should be.

#### 2.9a What must not simply invert

Three things break if `surface/inverse` is allowed to flip them, and each needed
its own token. Their light values are identical to what was there before, so
light mode did not change by a single pixel.

| Token | What it is | Light | Dark |
| --- | --- | --- | --- |
| `surface/hero` | The balance hero on the pending and first run Home screens | `053329` | `0C2620` |
| `surface/hero-raised` | The buttons sitting on that hero | `094135` | `143530` |
| `surface/camera` | The viewfinder and the captured photo | `053329` | `141F1C` |
| `ink/on-hero` | Text on any of those | `FFFFFF` | `D6E2DD` |
| `ink/on-hero-muted` | Secondary text on any of those | `A9C4BB` | `96ADA6` |

The hero is the clearest case. Flipped, it became a 350 by 220 near white slab on
an otherwise dark screen, which is a lot of light to throw at somebody, and worse,
it made the **verification pending** state louder than the verified one. A state
that means "you cannot send yet" must not shout at the person more than the state
that means everything works.

The viewfinder is the blunt one. A camera preview is dark because a camera
preview is dark. `surface/camera` steps 1.17 up from the canvas so the block is
still visible on a page with no border lines.

**`surface/scan` stays `FFFFFF` in both modes.** It is the quiet zone behind a QR
code, and a reader needs the light. This is the one token in the system that is
deliberately identical in dark mode, and it is the reason the QR quiet zone is a
separate token from `surface/canvas` in the first place.

#### 2.9b The dark data palette

The five data colours were re-derived, not tinted. Each was converted to OKLCH,
its lightness set to **0.62** to land inside the 0.48 to 0.67 band the dark mode
check requires, and its hue and chroma kept. They were then run through the same
six-check validator as the light palette, against `surface/default` at `111D1A`.

| Slot | Light | Dark | vs dark card |
| --- | --- | --- | --- |
| `data/1` teal | `0F8F70` | `009F7B` | 5.14 |
| `data/2` violet | `9333EA` | `A064DB` | 4.40 |
| `data/3` clay | `C57A2E` | `B4772E` | 4.63 |
| `data/4` blue | `2563EB` | `5783DC` | 4.68 |
| `data/5` rose | `E11D74` | `D54E86` | 4.33 |

All six checks pass. The worst adjacent pair is rose against blue at ΔE 13.9
under protanopia, comfortably above the 8.0 target.

**The three slot cap carries over unchanged.** Under `--pairs all`, dark blue and
dark violet collapse to ΔE 0.7 under deuteranopia, exactly as their light
counterparts do. Rule 20 needs no dark mode exception, which is a good sign that
the light palette was derived properly rather than picked.

#### 2.9c What dark mode does not solve

**Shadows are near invisible.** The file carries 59 drop shadows, all deep green
at 10 percent, and on a near black canvas they do essentially nothing. They were
left alone rather than rewritten, because a Figma effect colour does not follow a
variable mode the way a fill does, so a dark shadow value would be wrong the
moment anyone looks at light mode. This costs less than it sounds: section 7 says
depth in this system comes from the surface step, and the surface steps in dark
mode are larger than in light. The floating navigation still reads, because it is
a lighter surface on a darker page. If shadows are ever needed in dark mode they
have to become their own mode-aware token, not an edited effect.

**Light mode is still there and still correct.** Every token has both values and
the pages carry an explicit mode. Switching the file back is one setting per page,
and no screen was flattened to get here.

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
| Amount ruler | one | A tick track you drag to set an amount. Used on Send and Invest. |
| Stat card | Line, Segments, Dots | One headline figure, its change, and a small chart. |
| Dot column chart | one | Two periods of dot columns in two tones of grey. See 8.12b. |

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

All three cards in a row take the same form. Home's figures row began with
Segments, Dots and Segments side by side, and a row that changes chart form card
by card has to be read three times instead of once. The variants exist so that
different rows on different pages can differ, not so that neighbours can. Home
now uses Segments three times.

### 8.12b The dot column chart

The chart that carries Home. It is 690 by 232 and it is made of 572 dots.

| Part | Value |
| --- | --- |
| Column | One day. 69 of them, two months |
| Dot | 4 across, on a 10 pitch, so there is as much gap as dot |
| Rows | 20 in a 200 tall plot, and the columns start at zero |
| Previous period | `ink/subtle` at full opacity |
| Current period | `ink/strong` at full opacity |
| Labels | The period in `Label caps` and its value in `Label`, in `ink/muted` for the previous period and `ink/strong` for the current one, under its own half |

Neither the dots nor the labels carry opacity. The first build set the previous
period to `ink/subtle` at 50 percent and the labels to `ink/subtle`, which put
the labels at 2.37 to 1 on `surface/sunken`. Tone is a token, not a transparency:
`ink/subtle` and `ink/strong` already differ enough to separate the two halves,
and the labels have to be readable in both. See 2.7a and rule 28.

Three things about it are deliberate.

**The columns start at zero.** A column says "this much" by its height, so a
column chart that starts anywhere else lies about the size of the difference. It
works here because the account genuinely began near nothing two months ago. If
that ever stops being true, this becomes a line chart, not a truncated column
chart.

**The two periods are told apart by tone, not by colour.** Pale for what has
happened, solid for what is happening. That is one less thing for the palette to
carry and it survives being printed or photocopied.

**The texture is the reason it exists.** A smooth line and a dot column chart
carry the same numbers. The dots read as a shape from a distance and as
individual days up close, and they give the largest surface on the screen
something to look at. That is what makes a quiet screen interesting rather than
empty.

It costs 572 nodes, which is heavy for a Figma file and slow to generate. The
first build was 826 and the Figma connection dropped repeatedly while writing it,
so it was cut to 69 columns. If the file starts to struggle again, the same look
can be had with one rectangle per column at about a twentieth of the nodes,
losing the individual dots at close range.

### 8.12c When a thing becomes a component

Four tests. A thing becomes a component when it passes any two.

1. **It appears three times or more**, across at least two screens. Twice on one
   screen is a copy, not a pattern.
2. **Getting it wrong would be visible.** A delta chip with the arrow pointing
   the wrong way, or a legend dot in the wrong slot, is a mistake a reader would
   catch. Those are worth locking.
3. **It carries a rule.** The legend item exists so slots are never cycled. The
   delta chip exists so direction is never carried by colour alone. The
   component is where the rule lives, so the rule cannot be forgotten by
   whoever builds the next screen.
4. **It has states.** Anything with an on and an off, or a rest and a pressed,
   belongs in a variant set rather than being redrawn each time.

And two tests for when it should **not** be a component.

- **It is layout, not a part.** A row of three cards is an arrangement. Making
  it a component freezes a decision that should stay free.
- **The data is the whole thing.** A chart whose shape comes entirely from its
  numbers cannot be reused without those numbers. The dot column chart is a
  component anyway, because the form and the rules are the reusable part and the
  numbers are placeholder, but that is a judgement call rather than a rule.

The library at the time of writing: Delta chip, Legend item, Detail toggle,
Amount ruler, Stat card, Dot column chart, plus the older phone components.

A component is also where a bug gets fixed once instead of thirty times. The
`Transaction row` set had the amount on `ink/subtle` in its Pending and Failed
variants, which is 2.90 to 1 in light mode and 3.83 in dark, and it was wrong in
both. It reached five screens through instances and none of them showed it as
their own defect. Both variants now use `ink/muted`, which keeps a pending or
failed amount quieter than a settled one without dropping it below 4.5 to 1.
Quiet is a token, not a transparency, and never `ink/subtle` when the quiet thing
is a number somebody is looking for.

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
23. Quiet is not the same as flat. A screen that has given up colour has to earn
    its interest somewhere else, which means texture, a real range of scale, and
    cards that are not all the same size. See 11b.4a.
24. A note about one element is not a new direction for the screen. If someone
    says a chart is too loud, quieten the chart. Do not quieten everything
    around it as well. See 11b.4a for the time this went wrong.
25. Colour belongs in many small places, not a few large ones. Bars, dots, chips
    and legends, not card backgrounds. The one exception is the single accent
    card the seventy twenty ten rule asks for, and there is only ever one.
26. Never call a screen finished without measuring it. Walk every text node,
    composite its opacity and its ancestors' against the surface behind it, and
    check the ratio. Rule 11 was broken ten times on one screen because nobody
    was measuring. See 2.7a.
27. An accent card is a warm surface, not a saturated one. The card takes
    `surface/sand-soft`, and the saturated `surface/sand` appears inside it in
    one small place, such as a badge. A saturated card that big beats the chart
    it sits beside, and the chart is the point of the screen.
28. Never set text below full opacity. If it needs to recede, use `ink/muted`.
    Opacity on a text node is a contrast bug wearing a hierarchy costume.
29. Never paint a colour that is not bound to a variable. A literal fill is a
    node that will not follow a theme, and you will not find it by looking. Two
    of them survived in this file and both were only caught by a sweep. See 2.9.
30. Never let a state that restricts a person shout louder than the state where
    everything works. The verification pending hero was brighter than the
    verified one for exactly as long as it took to measure it. See 2.9a.
31. Never assume a token should invert just because the mode inverted. A camera
    preview, a QR quiet zone and a brand hero each stay dark or stay light for a
    reason that has nothing to do with the theme. Give them their own token
    rather than bending `surface/inverse`. See 2.9a.

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
| D01 Home | Cash strip, the portfolio with its dot column chart, positions, activity, Borrow and Earn. Drawn in both Simple and Detailed |
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
| D17 Invest | How much with the ruler, what you are buying with its price line, recent orders |

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

Home has been rebuilt four times, and the fourth is the one to keep. Version
three made the screen quiet, and quiet turned out to mean flat. The mistake was
mine and it is worth recording, because it is easy to repeat.

Two references were in play. One was a rich blue dashboard, sent with the words
"make it more interesting". The other was a grey dot column card, sent later
with the words "this chart is very distracting, make it a bit more subtle". The
second reference was about **the chart**. I applied it to the whole screen and
threw away everything the first reference asked for.

The rule that comes out of it: **a note about one element is not a new direction
for the screen.**

| Band | Height | What it holds |
| --- | --- | --- |
| Header | 44 | The greeting, the Simple and Detailed toggle, notifications |
| Figures | 176 | Portfolio, Today and Cash ready, three cards of 360 |
| Over time | 344 | The dot column chart at 744, the sand pick at 360 |
| Lists | 316 | Positions 456, activity 360, then Borrow and Earn stacked in 264 |

**Colour is back, in many small places rather than a few large ones.** That is
what the first reference actually does. The portfolio card carries a three part
allocation bar in `data/1` to `data/3` with the holdings named. Today carries a
two part bar in `state/positive` and `state/negative` with the up and down day
counts beside it. Cash ready carries a single `data/4` fill on a
`surface/sunken` track. None of it is a large coloured fill, so the screen still
reads as green and white.

**The chart stays grey.** It is the one element the second reference was about,
and it is the largest, so it is the one thing that must not compete. See 8.12b.

**One sand card, once.** The seventy twenty ten rule asks for about a tenth of a
screen in accent, and version three had none. The accent is a single sand card
carrying a market pick, which puts the warm moment on something worth looking at
rather than on a control.

#### The fifth pass, 3 September

The note was "this doesn't have enough contrast and the page is now too busy",
pointed at the sand card. Both halves of it were right, and both were
measurable.

Contrast: ten failures per screen, all of them rule 11. What was wrong and how
it is checked from now on is 2.7a.

Busy: three counts made it concrete. Three cards in the figures row carried
three different chart forms, so the eye had to learn the row three times. Seven
distinct hues sat inside 176 vertical pixels. The sand card held fourteen pieces
of text and was the most saturated block on a screen whose hero is a grey chart.

Four changes, and nothing else moved:

| Change | Why |
| --- | --- |
| Today's thirty dot matrix became a two part bar | Three cards, one form. The row is read once, not three times. Thirty marks became two, and the dot texture belongs to the hero chart alone. |
| Cash ready's two part bar became one fill on a track | Cash against total is one quantity, not two categories. Seven hues in the row became six. The bar no longer restates the portfolio figure sitting two cards to its left. |
| The sand card lost its tickers and kept the fund names | It said "VOO" and "Vanguard S&P 500" on the same line. The plain name is the half a beginner can use, and the row went from three texts to two. |
| The sand card went to `surface/sand-soft`, with the saturated sand kept as a "This week" badge | A 360 by 344 block of `D5A578` beat the chart beside it. Rules 25 and 27. |

Text on the screen went from 85 nodes to 82, hues in the figures row from seven
to six, and contrast failures from ten to zero.

What was **not** done, deliberately: no card was removed, no row was
re-proportioned, nothing was redesigned. Rule 24. The note named the sand card,
so the work stayed on the sand card and on the two measurements that named
themselves.

**Scale runs from 36 to 12.** Three figures at Display, the lists at Body
strong, the labels at Label. The cards are not a grid either: 360 three times,
then 744 and 360, then 456, 360 and a stack of two.

The send ruler is not on Home. It belongs on Send and on Invest, which is
reached from the Invest control on the Cash ready card.

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

### 11b.4c Invest, and where the ruler lives

`D17 Invest` is where the Amount ruler earns its place. It is reached from the
Invest control on the Cash ready card on Home, and from any stock on the Market
page. The sidebar shows Market as the active item, because Invest is a thing you
do from the market rather than a separate destination. It has no entry of its
own, since Buy already means something else in this product: turning naira into
dollars.

| Band | Height | What it holds |
| --- | --- | --- |
| Header | 44 | The title and the cash available |
| Choose | 600 | How much at 456, what you are buying at 648 |
| Orders | 260 | The last three orders in five columns |

The left card is the tactile one. The amount in `Display XL`, the ruler under
it, four quick amounts under that, then what the money actually buys: the number
of shares, the price each, the fee and how long it takes. A `tint/brand` note
says that a part of a share is a real thing you can sell, because that is the
question a first time buyer asks and the answer is not obvious.

The right card is the case for the purchase. The company, the price, a grey
price line, and four facts. The chart is a line rather than dot columns, because
a price history is a level rather than a flow, and a column that does not start
at zero lies about the size of a move. See 8.12b.

**The ruler now appears in two places.** On `D09 Send`, in the modal, where the
amount used to be a plain field. And on `D17 Invest`, as the main control. It is
not on Home. Home is where you see what you have; these are where you decide a
number, and a ruler is only worth its space where there is a number to decide.

While updating Send, the Home screen behind its modal was two versions out of
date, so `D09`, `D10` and `D11` all have a current background again. That is a
standing cost of drawing a modal over a real screen: the screen underneath keeps
moving.

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
| G. Grow and Market | D03 Grow, D04 Market, D05 Apple, D17 Invest |
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
