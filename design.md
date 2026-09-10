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
| `surface/canvas` | `FFFFFF` | `0A0A0C` | — |
| `surface/default` | `FAFBFC` | `1E1E22` | 1.19. The sidebar, and nothing in the main column |
| `surface/sunken` | `F0F2F4` | `161619` | 1.10 from canvas. Every card in the main column |
| `surface/control` | `E9ECEF` | `2D2D32` | 1.15 |
| `surface/control-pressed` | `DDE2E6` | `38383E` | 1.19 |

The dark steps are **larger** than the light ones. Light mode's canvas to card
step is 1.04 to 1, which section 2.3 admits is a whisper. Dark mode cannot afford
a whisper: there are still no border lines anywhere, so the surface step is the
only thing separating a card from the page, and dark values compress. Every dark
step is at least 1.12.

**The two grounds were the same colour until 5 September.** Seventy five panels
in the main column were painted `surface/default`, and so was the sidebar, so a
card and the navigation were the same value and no amount of darkening one of
them could separate them. The main column moved to `surface/sunken`, which now
means one thing only: a card on the canvas. `surface/default` means the sidebar
and nothing else.

| | Step from canvas |
| --- | --- |
| Card, `surface/sunken` `161619` | 1.10 |
| Sidebar, `surface/default` `1E1E22` | 1.19 |
| Card against the sidebar | 1.09 |

The sidebar went **up** while the card went **down**, which is the part that
matters. Making the card darker alone would have left it sitting at the same
value as the rail. A page and its navigation are two grounds, and two grounds
need two values.

**The dark card came down on 5 September**, from `232327` to `18181B` and then
to `161619`. Every
signed in screen paints its content area with nothing, so every card in the main
column sits straight on `surface/canvas`, and at `232327` that was a step of
1.25. One card at 1.25 is fine. Nine of them on a page reads as a grid of bright
tiles with dark grout, and it gets worse the fuller the page gets. At `18181B`
the step is 1.12, which is the same step the sidebar takes from the canvas, so a
card and the sidebar now sit at the same distance from the page.

Two things fell out of that change and both are improvements. `surface/control`
on a card went from 1.14 to 1.29, so buttons and status pills separate from the
card better than they did. And the promo panel in the sidebar, which sat on
`surface/sunken` inside a lighter `surface/default`, would have vanished at the
new value: it is `surface/canvas` now and reads as a well cut into the sidebar
rather than a card raised off it. Same visible step, 1.13, opposite direction.
A panel on a dark ground steps up. A panel on a lighter ground can step down.

**The dark greys are neutral, and that was a correction.** The first dark build
gave them a green cast, on the theory that a green tint would read as depth. It
did not. It read as green. Every card, panel and control on every screen became a
dark green box, and since surfaces are most of a screen by area, the brand colour
ended up being the colour of the room rather than a thing in it. The note that
came back was "the app looks too mint green", and it was correct. The ramp is now
neutral, and the brand appears only where it does work.

**Ink inverts with it.**

| Token | Light | on light canvas | Dark | on dark canvas |
| --- | --- | --- | --- | --- |
| `ink/strong` | `053329` | 13.89 | `DCDCE0` | 14.48 |
| `ink/muted` | `4D6B65` | 5.82 | `A6A6AD` | 8.18 |
| `ink/subtle` | `8EA39F` | 2.90 | `65656C` | 3.34 |

`ink/strong` is `DCDCE0`, not white. Pure white on near black is about 18 to 1
and halates on an OLED panel; `DCDCE0` lands at 14.48, within a whisker of light
mode's 13.89, so the two modes read as the same amount of contrast rather than
one being harsher.

`ink/subtle` still fails 4.5 to 1 on purpose, in both modes. Rule 11 is unchanged.

**The inverse pair swaps ends.** In light mode `surface/inverse` and `ink/strong`
are the same value, `053329`: a deep block carrying white text. Dark mode keeps
that symmetry and flips it, so `surface/inverse` is `DCDCE0` and `ink/inverse` is
`0A0A0C`: a pale block carrying dark text. The active navigation pill, the brand
mark and every primary button therefore invert for free, and a primary button in
dark mode is a pale pill with dark text, which is what it should be.

#### 2.9a-0 How much brand there is allowed to be

Green is a **mark**, never a material. On the desktop Home it now appears in
exactly two roles and nowhere else:

| Where | Token | Count on Home |
| --- | --- | --- |
| A gain, as a number | `state/positive` | 8 |
| The pill around a gain | `tint/positive` | 3 |

No green surface, no green button, no green card, no green cast. The one other
place it is allowed is the active navigation item, because that is the app
telling you where you are.

The test is arithmetic, not taste: count the nodes carrying a brand token on a
screen. If a surface token is among them, the brand has stopped being an accent.

#### 2.9a What must not simply invert

Three things break if `surface/inverse` is allowed to flip them, and each needed
its own token. Their light values are identical to what was there before, so
light mode did not change by a single pixel.

| Token | What it is | Light | Dark |
| --- | --- | --- | --- |
| `surface/hero` | The balance hero on the pending and first run Home screens | `053329` | `1B1B1F` |
| `surface/hero-raised` | The buttons sitting on that hero | `094135` | `2A2A30` |
| `surface/camera` | The viewfinder and the captured photo | `053329` | `1E1E22` |
| `surface/scrim` | Behind a modal. 54 percent | `001A14` | `050506` |
| `ink/on-hero` | Text on any of those | `FFFFFF` | `DCDCE0` |
| `ink/on-hero-muted` | Secondary text on any of those | `A9C4BB` | `A6A6AD` |

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

#### 2.9b-1 What a review found afterwards

The dark mode work was audited screen by screen as it went, and a review after it
was finished still turned up four things. Worth listing, because each is a
different kind of miss.

**The scrim was never a token.** Four modal screens carried a literal `001A14` at
54 percent behind the sheet. Literal, so it ignored the mode; green, so it was
the exact fault the neutral ramp had just fixed everywhere else. It is now
`surface/scrim`, dark neutral in dark mode and unchanged in light. Rule 29 exists
precisely for this and the sweep that wrote rule 29 had already run — it caught
fills on shapes and text but this one hid behind a modal on screens the sweep had
counted and the eye had not.

**The overflow warnings were false.** Five frames were reported as overflowing
their auto-layout. Every one of them has a `FILL` child, which shrinks to fit, so
nothing clips. The checker summed each child's current width without asking
whether that width was fixed. A layout check that does not read
`layoutSizingHorizontal` will cry wolf on every well-built frame in the file.

**The Foundation page documents a palette that no longer exists.** Its swatches
are bound and follow the mode correctly, but the hex captions beside them are
plain text. Twenty of them still read light values, and several of those
(`55746E`, `0F7A5F`, `E6F7F1`) were stale before dark mode ever landed. A caption
is not a token and nothing keeps it honest.

**Two Home screens were two different products, and there was a third.** Fixed;
see 11b.4a. The lesson is the one rule 34 nearly says and did not: a screen that
exists in two states is two screens, and a screen painted behind a modal is a
third. Rebuild one and you have signed up to rebuild all of them in the same
pass.

#### 2.9b-2 A chart with no scale, and two claims that were wrong

The bar chart shipped with axis labels and no gridlines. `12.5K` through `2.5K`
floated beside the plot at even pixel spacing rather than at their own values, so
the numbers named nothing and a bar's height could not be read off them. Every
chart in the file now draws a gridline per tick on a fixed 0 to 12.5K scale, in
`chart/grid`, behind the bars, with each label seated on its own line. Six
charts: both Home states and the four modal backgrounds.

Two things reported in the same critique were **not true**, and measuring them is
what showed it:

- *"The tooltip covers the data it describes."* It overlaps **zero** bars. The
  callout clears the highlighted range by 19 pixels.
- *"There is dead space under the plot."* The card wraps the panel exactly
  (`cardMinusPanel: 0`) and the 16 pixels below the lowest mark are the panel's
  own bottom padding.

Both came from reading a rendered screenshot instead of the node tree. A
screenshot is evidence that something looks wrong; it is not evidence of what is
wrong, and the difference is two false bug reports handed to the person who has
to act on them.

#### 8.12d The activity row

The row was an icon, a name, a timestamp and an amount. The reference carried two
more columns and both earn their place: **what state the money is in**, and
**which account it moved through**.

`Activity row` on `02 Components` is a six variant set,
`Direction = In, Out` by `Status = Settled, Pending, Failed`. Every activity
list on desktop is built from instances of it.

| Slot | Content | Sizing |
| --- | --- | --- |
| mark | The direction glyph, 28 | fixed |
| what | Name, and the reference and time beneath it | fill |
| status | Settled, Pending or Failed | 72 fixed |
| ref | The masked account, `•••• 2841` | 68 fixed |
| amount | The figure, right aligned | 96 fixed |

**The three right hand slots are fixed, not hugging.** Hugging made every row a
different shape: the status pill started at a different x on each line because
the amount beside it was a different length, so four rows of the same thing read
as four unrelated rows. Fixed widths make them columns. `what` takes `FILL` and
absorbs whatever the list is, which is 696 on the detailed Home, 1008 on the
gateway and 504 in the send and receive panels.

**Below 620 the account column is hidden.** Five columns do not fit in 504 and
the account is the least load bearing of them.

**The status pill is on every row, and it is grey most of the time.** Settled
uses `surface/control` with `ink/muted`: a pill you can see but never read unless
you want to. Only the states that need attention take colour, Pending on
`tint/warning` and Failed on `tint/negative`. A status column where every row
shouts is a column nobody scans, and green on every settled line would have put
the brand colour back on 28 rows for no reason. See rule 33.

**The amount colour rule.** Money in is `state/positive`, money out is
`ink/strong`, and anything not settled is `ink/muted` whichever way it points.
The last part is the older finding in 8.12c, kept: an amount that has not moved
yet should not read as one that has.

This rule is worth stating because it was not being followed. Applied by hand
across five lists, it held on most rows and broke on two, and both breaks were on
the detailed Home:

| Row | Was | Should be |
| --- | --- | --- |
| `Bought ETH -$1,200.00` | `state/positive` | `ink/strong` |
| `Dividend Received +$75.00` | `ink/strong` | `state/positive` |

The larger of those is the biggest outflow on the screen, painted green. Nobody
saw it for a week because there was no component to see it in. Fifty seven signed
amounts across eighteen screens now obey the rule, and the check that proves it
is two lines: read every text matching a signed figure, read the token painting
it, and assert the pair. See rule 43.

**What the same pass found elsewhere.** `D17 Invest` painted its order names
`ink/muted` while the number beside them was `ink/strong`, so the row label was
quieter than its own value. `D13 Add money` had invented its own words, `Done` in
green and `Waiting for your transfer`, for the two states every other screen
calls `Settled` and `Pending`, and green on a settled row is exactly what the
grey pill exists to prevent. The gateway wrote `Friday at 08:00` where four other
screens wrote `Fri at 08:00`.

**The phone row is a different component.** `Transaction row` at `74:87` is
320 by 56 with a 40 avatar and belongs to the mobile screens. It was not used by
anything on desktop and still is not. Two widths, two components, on purpose.

### 8.12e The quick action tile

Three tiles in the hero band, beside the balance: Buy, Convert, Borrow. Send and
Receive are already the hero's two buttons, so the tiles carry the three things
you cannot do from there.

Each is a card of `surface/default` at radius 20, padding 24, laid out
`SPACE_BETWEEN` so the glyph sits at the top and the words at the bottom. The
glyph is the standard 12 at stroke 2 inside a 48 `surface/control` circle. The
label is `Title`, the line under it `Body` in `ink/muted`.

They divide the hero's spare width by `FILL`, so the three are always equal and
the band needs no hand-set widths. At 1128 with a 308 balance block they come out
at 247 each.

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

### 8.12f The halftone card

The three get started cards on `D01c` carry a halftone dot field across the
bottom of each. It came from a reference the client liked, a set of dark cards
with a photograph rendered as a dot screen under the headline. Two things about
that reference were taken and two were left.

**Taken.** The dot field bleeding to the card edges, and the small pill with a
chevron in place of a bare text link.

**Left.** The serif headline, because this project has one family and two
weights and rule 1 says so. And the reference palette, because the dark data
colours here are already validated and a second set would not be.

The field is not a picture. It is a scalar function sampled on a grid, and each
sample becomes a circle whose diameter is the value at that point.

| Part | Value |
| --- | --- |
| Card | 300 tall. Buy is 400 wide, Convert and Borrow are 280 |
| Art plate | 140 tall, full width, pinned to the bottom edge, absolutely positioned inside the card |
| Grid | 12 pitch |
| Dot | 1.8 at the smallest, 10.6 at the largest, so the densest areas nearly touch |
| Cut | Below 0.10 no dot is drawn at all, which is what makes the empty regions empty |
| Dim dot | `ink/subtle` |
| Bright dot | `ink/muted`, above 0.52 |
| Accent | `data/2`, roughly five per card |

The function is three sine waves whose frequencies do not divide into each
other, so the pattern never repeats inside a card and reads as blobs rather than
as stripes. The first attempt used two related waves and looked like a barcode.

```
f = 0.5 + 0.5*(0.55*sin(6.1u + 3.7v + 0.4)
             + 0.30*sin(11.3u - 8.2v + 2.1)
             + 0.15*sin(17.7u + 13.1v + 4.3))
f = clamp((f - 0.32) / 0.46)          the stretch that creates real empty space
t = f * (0.40 + 0.60 * v^0.7)          the fade that dissolves it under the text
```

**The three cards are one field, not three.** `u` is measured against a fixed
400, not against each card's own width, and the three cards sample windows at 0,
520 and 1040. So the dots are the same size and the same spacing on every card,
and the pattern continues across the row instead of restarting. Normalising by
each card's width instead would have squeezed the same number of blobs into the
narrower cards, and the row would have read as three unrelated pictures.

**The accent may not be a state colour.** The first build painted the accent
dots `state/positive`, picked up from the delta figure above them. That put
green dots a few hundred pixels under a green `+$142.60`, which implies the dots
mean something and they do not. They are `data/2` now, which is a palette colour
with no state attached to it. There is no chart on this screen, so nothing else
is claiming that colour here. See rule 41.

**Buy Stocks is the one card that is not neutral.** Buying shares is the click
the product exists to earn, so that card carries a vertical gradient and the
other two do not. Three stops, all bound to tokens: `surface/sunken` at 0,
`surface/sunken` again at 0.42, then `surface/accent` at 1. The doubled stop is
the whole trick. It holds the card neutral through the entire text block and
only lets the green appear under the halftone, where nothing has to be read.

That order was forced by measurement, not taste. `ink/muted` on a full
`surface/accent` is 3.15 to 1, which fails. Sampled at the description's actual
position on the finished gradient it is comfortably past 4.5. A gradient
background has to be checked where the text really sits, because walking up the
tree for the nearest solid fill skips straight past it and reports a pass that
is not real. See rule 42.

The card also carries the only filled pill on the screen. Convert and Borrow
have plain text links. Colour alone would have been one signal; the button
weight is the second, and it survives being seen by someone who cannot separate
the green from the grey.

Its dots are lifted one tone, `ink/muted` where the others are `ink/subtle` and
`ink/strong` where the others are `ink/muted`, because the greens they sit on
are lighter than the neutral cards.

**Cost.** 677 dots across the three cards, 794 nodes on the screen in total.
8.12b records that the dot column chart cost 572 and that the connection dropped
at 826, so the three fields were generated in three calls rather than one and
none exceeded 340. If the file starts to struggle, the pitch goes from 12 to 14
and the count falls by about a third.

**What was removed to make room.** Each card had a 48 badge above its title. The
art is the card's identity now, so a second decorative mark above the words was
one thing too many. The band grew from 228 to 300 and the gap between bands on
`D01c` went from 48 to 40 to pay for it, which leaves 36 spare in the column.

### 8.12g The follow button

`Follow button` on `02 Components` is a two variant set, `State = Follow,
Following`. It sits first in the actions row on a company page, before Buy and
Sell.

| Part | Value |
| --- | --- |
| Shape | 48 tall, pill radius, 20 padding left, 24 right, 8 gap |
| Fill | `surface/sunken` in both states |
| Follow | A plus glyph and the word, both `ink/strong` |
| Following | A check glyph and the word, both `ink/muted` |

**It has to be quieter than Buy and Sell**, which are `surface/control`. On the
canvas that is a step of 1.45, where `surface/sunken` is 1.12. So the row reads
Buy and Sell first and Follow second, which is the right order: following a
company is not why anyone opened the page. Three pills at the same weight would
have flattened the header into a row of equal choices.

**Following is grey, not green.** A check in `state/positive` would have been the
obvious choice and it is the wrong one. Green on this page already means the
price went up, and 8.12d settled the same argument for the Settled pill: a state
that needs no action does not take colour. The past tense of the word and the
check together carry it.

**The state is not free to choose.** `D04 Market` lists AAPL in the watchlist, so
`D05 Apple` shows `Following`. Had it shown `Follow`, the two screens would have
disagreed about the same fact, which is the class of defect 11b.4b and 8.12d were
both written about. Any company page added later has to be checked against the
watchlist the same way.

**What this still owes.** The watchlist header carries a `See all` that leads
nowhere, because there is no watchlist page. That is a smaller debt than the one
this closes and it is recorded here rather than left to be found.

### 8.12h The amount field

`Amount field` on `02 Components` is a two variant set, `State = Resting,
Focused`. It replaces the bare figure that used to sit above the ruler on `D09
Send` and `D17 Invest`.

| Part | Value |
| --- | --- |
| Shape | 72 tall, radius 16, 24 padding at the sides, hugs its value |
| Resting | `surface/control` |
| Focused | `surface/control-pressed`, and a 2 by 44 caret after the value |
| Value | `Display XL` in `ink/strong` |

**The figure was not a control before, and it looked like one.** A 48 point
number centred over a ruler reads as output, not input, so the only way to set an
amount was to drag. The field shape says the number can be typed. The ruler stays
directly beneath it as the fast way in, and the line under both says so in
words: *Type an amount, or drag the ruler.*

**Typed is the source of truth.** Dragging writes into the field. Nothing else
holds the value, so the two ways in cannot disagree.

**What it cost on Invest.** The field is 20 taller than the bare figure and the
hint added another 16, which pushed the `How much` card from 600 to 652 inside a
row pinned at 600. The Buy button was cut in half and the overflow check did not
see it, because the row clipped rather than overflowed. The rows hug now, the
card gap came down from 20 to 16, the fraction note is one line, and the column
gap is 20. The screen uses 1024 of 1024.

### 8.15a Which rail is a sheet and which is a page

The five money rails were split between sheets and pages with nothing saying
which was which. The rule, stated once so it can be checked:

**If the task needs you to consult something, it gets a page. If it only needs
you to enter something, it gets a sheet.**

| Rail | Shape | Why |
| --- | --- | --- |
| Send | Sheet | A person and an amount. Nothing to look up |
| Receive | Sheet | An address to copy. Nothing to decide |
| Add money | Page | The rate, the minimum, your bank, your recent orders |
| Convert | Page | The rate, which bank it lands in, past conversions |
| Invest | Page | The price, the chart, your position, what the fee is |

A page-shaped rail still confirms in a sheet over itself, which is what 8.15
already says about anything transactional.

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

**Superseded on Home, 4 September.** Desktop Home now uses the solid bar chart
described in 11b.4a. This component still exists and the spec below still holds,
but nothing on Home instances it any more.

The chart that carried Home. It is 690 by 232 and it is made of 572 dots.

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

The library at the time of writing: Sidebar, Activity row, Delta chip, Legend
item, Detail toggle, Amount ruler, Stat card, Dot column chart, plus the older
phone components.

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
12b. Human and simple, in every word a customer reads. Say it the way a person
    would say it out loud. One idea per sentence, twenty-four words at most. No
    em dash and no semicolon: both are a full stop somebody was afraid to use.
    No word an insider forgets is a word, unless the screen also says what it
    means. Where something genuinely needs more context than a line, it goes
    behind a question mark and not into another paragraph. `words.mjs` counts
    all of it, on every route, and nothing is exempt. See 11g.41.
13. Never draw a line. No card outline, no field outline, no list divider, no
    chip edge, no rule under a heading. Outside a chart the only strokes are a
    2px green focus ring, a 2px error ring, and the glyphs themselves. If two
    things need separating, step the surface or add space. A chart is the single
    named exception, spelled out in 8.13, because reading a price is not the
    same job as glancing at a card. `lines.mjs` counts, at every route in both
    themes, and its list of exceptions is the whole list: see 11g.36 for the
    eight places this had already been broken before anything checked.
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
32. Never tint the greys with the brand colour. Surfaces are most of a screen by
    area, so a brand tint on them makes the brand the colour of the room instead
    of a thing in it. The greys are neutral in both modes. See 2.9.
33. The brand colour never fills a surface, with one exception, and the exception
    has to be argued rather than assumed. It marks a number, a chip, or the place
    you are standing in the navigation. If you can count brand-coloured nodes on
    a screen and a surface token is among them, it has stopped being an accent.
    See 2.9a-0. The exception is a single element that the whole screen exists to
    push toward, at most one per screen, never repeated: on `D01c` that is the
    Buy Stocks card. The sidebar promo failed the same test in the same week
    because an advertisement is not what the screen is for. See 8.12f.
34. Never show the same number twice on one screen as information. If a figure is
    in the hero it does not also get a card, and it does not get a panel row that
    can only ever restate it. A button may name the figure, because naming what
    you are agreeing to is the button's job, not a second reading of the number.
    See 11b.4e. This is what removed three cards from Home.
35. A screen with two states is two screens, and a screen painted behind a modal
    is another one. Rebuilding one of them commits you to all of them in the same
    pass, or the file quietly accumulates generations. Home had three. See
    11b.4a.
36. An axis label without a gridline names nothing. If a chart carries values on
    its edge, the reader has to be able to lay a straight edge from the number to
    the mark. See 2.9b-2.
37. Never report a defect you have only seen in a screenshot. Measure the node
    first. Two of the findings in the 4 September critique were false and cost
    the reader time. See 2.9b-2.
38. Never size a child by FILL before its parent has a width. Fill is a share of
    something, so a chain that has not resolved yet gives it nothing to share and
    the child collapses to one pixel or runs to thousands. Give the containers
    explicit widths, append the child, then size it. See 11b.4a-2.
39. Navigation lists places, not tasks. A place has state you return to and an
    address worth sharing. A task has an end, and when it ends you go back where
    you were. Four of the nine desktop rail entries were verbs, and taking them
    out is what let the rail drop to five. See 11b.2.
40. Anything drawn on every screen is a component before it is drawn the second
    time. The sidebar was seventeen hand built copies, so one edit changed one
    screen and left sixteen lying. Repetition is the test, not complexity.
    See 8.12c and 11b.2.
41. Decoration never wears a state colour. A green dot means the same thing a
    green number means, so the moment ornament borrows `state/positive` it starts
    making a claim. Take the accent from the data palette instead. See 8.12f.
42. Check contrast where the text actually sits. A contrast pass that walks up
    the tree looking for the nearest solid fill steps straight over a gradient
    and grades the text against something behind it. Sample the gradient at the
    text's own position instead, or the report is worth nothing. See 8.12f.
43. A rule applied by hand is not a rule. Green for money in and neutral for
    money out held on six of eight rows, and one of the two that broke it was the
    largest outflow on the screen painted as a gain. Put the rule in a variant so
    the exceptions become impossible, then write the check that proves it. See
    8.12d.
44. A variant guards only while it is the right variant. Duplicating a row keeps
    the variant of the row it was copied from, so retyping the words leaves the
    colour behind: three rows added to Simple on 4 September put a green minus
    and a neutral plus back on the screen within an hour of rule 43 being
    written. The check is the guard, not the component. Run it after every edit,
    not only after your own.
45. Check the paint, not the name. A row named `inactive Wallet` was painted
    active on three screens for a day, and the pass written to catch it read
    layer names and reported everything clean. Names are a note somebody left.
    The fill is what the reader sees. See 11b.4b.
46. A clipped child is not an overflow, and the check will not find it. A frame
    with `clipsContent` on simply cuts what will not fit, so the sums balance and
    the Buy button is still missing half its height. Where a card can grow, its
    row and its column have to hug, or the audit passes on a screen a person
    cannot use. See 8.12h.
47. Any control a person can drag must also be typeable. The ruler is faster and
    the field is exact, and a design that offers only the fast one is a design
    that cannot take 137.42. Dragging writes into the field, so the two never
    disagree. See 8.12h.
48. An audit is code, and code has bugs. Two of the three faults the Grow pass
    reported were the checker's, not the file's. Green was compared against a
    colour typed from memory rather than the resolved value of `state/positive`,
    so four correct rows were called broken. The duplicate figure count read the
    page sitting behind a scrim and the cells of a table column, where repeating
    a number is the whole point. Resolve every constant out of the file, and give
    every check the same scope a reader has. A check you have not doubted is a
    second opinion you have not got. See 11b.4f.
49. A link is a promise, and there are only three honest ways to keep it: point
    it at something real, rename it so it names where it goes, or delete it. The
    fourth, leaving it, is the one that ships. Twenty three links in this file
    led nowhere, and the largest group of them was not a link problem at all: it
    was History holding payments while three screens offered to show you loans,
    earnings and trades in it. When several links break the same way, the
    destination is usually what is wrong. See 11b.4j.
50. Measure the thing, not the box around it. A pass that read `body.height` to
    find content running under the rail flagged twenty five mobile screens. Most
    of those bodies are fixed height and always read 844, and three more ended
    in a deliberate spacer that the check counted as content. Six screens were
    genuinely wrong, and the trim ran on nineteen that were not. Sum the children
    and stop at the spacer. See 11f.2.
51. A bound paint comes back with its alpha thrown away.
    `setBoundVariableForPaint` returns a new paint at full opacity, so a ten per
    cent white lift over sand shipped as a solid white button. Nothing looked
    wrong in a sixty variant sheet; the contrast check found it at 1.37:1. Put
    the alpha back on the object the call hands you, and never trust an overlay
    you have not measured. `clone()` does it too: a scrim copied from another
    screen arrived at full opacity and painted the page it was meant to dim
    solid black. Whatever produces a paint, read the alpha back. It has now
    happened three times, so the scrim sweep runs after every clone rather
    than when something looks wrong. See 11f.3, 11f.10 and 11f.12.
52. A component can be correct and still be wrong. The place tabs passed every
    check: contrast, the four pixel grid, no overflow, one lit item, a scrolling
    strip on the phone. None of that could see the only thing that mattered,
    which is that the sidebar already listed those destinations and the row
    said Wallet eight pixels under a sidebar that said Wallet. Audits answer
    "is this built properly". They cannot answer "should this be here". Ask the
    second question out loud, before drawing it into two pages. See 11f.13.

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

A sidebar is a list of places, not a list of tasks. A place has state you come
back to and an address worth sharing. A task has an end, and when it ends you go
back to where you were. The rail carried both until 4 September, and that was
the cause of nearly everything wrong with it.

**The six places.** `Home · Wallet · Market · Grow · History`, then `Account`
on its own below them.

Home is what you own. Wallet is the money itself and how it gets in and out.
Market is what you could own. Grow is what your money can do while you hold it.
History is what already happened. Account is who you are. Nothing else is a
place.

**Wallet sits second, above Market**, even though trading is what the product is
for, because nobody can trade until they have funded the account. The rail is
ordered by what a person does first, not by what matters most.

Wallet passes the place test: it has state you return to, an address worth
sharing, and content that outlives the visit. It carries balances, the ways
money gets in and out, saved banks and cards, and what is still settling. It
must not become a second portfolio page. 11c.4 records that Portfolio was folded
into Home precisely because a second page of the same numbers is a page nobody
needs, and a Wallet that leads with the total is that page again under a new
name. Home answers how am I doing. Wallet answers where is my money and how do I
add more.

**`D18 Wallet` exists.** The rail entry was added on 4 September and the screen
followed the same day. See 11b.4d.

**The four money rails are not places.** Buy, Convert, Send and Receive used to
sit in the rail and do not any more. They are buttons on Home, which is one
click from anywhere, so the furthest any of them sits from any screen is two
clicks. Every Home variant carries all four. Wallet does not change that. A
wallet is where the money lives, not the act of moving it.

**Security and Support are not places either.** Security is part of Account.
Support lives behind the avatar, which is why the avatar now has a chevron and
is a control rather than a label.

| Part | Value |
| --- | --- |
| Width | 240 |
| Fill | `surface/default` |
| Padding | 20 at the sides, 32 at the top, 24 at the bottom |
| Brand | A 32 mark in `surface/inverse` at radius 8, 12 gap, the name in `Title` |
| Item | 40 tall, pill radius, 16 padding at the sides, a 12 glyph, 12 gap, the label in `Body strong` |
| Wallet glyph | A billfold, a rounded rectangle with a fold line across the middle. The first draft was a rectangle with a clasp dot and read as the Market square at 12 |
| Gap between items | 4 |
| Gap between groups | 32 |
| Selected item | `surface/inverse` fill, `ink/inverse` label and glyph |
| Unselected item | No fill, `ink/muted` label and glyph |
| Promo | 200 wide, radius 20, `surface/sunken`, a 48 badge, a title, one sentence and a link |
| Footer | The avatar, the name, the state, and a chevron, pinned to the bottom |

**It is one component now.** `Sidebar` on `02 Components` is a seven variant
set, `State = Home, Wallet, Market, Grow, History, Account, None`. All seventeen desktop
screens carry an instance of it. Before this it was seventeen hand built frames,
which is how the rail came to say one thing on one screen and something else on
sixteen others. A fix now happens once. The unbound badge fill was found by the
audit and corrected in the master, and all seventeen screens took the fix
without being touched.

**Which state each screen carries.** A detail page keeps its parent selected, so
`D05 Apple` and `D17 Invest` show Market. A task painted over Home keeps Home
selected, so all four Send and Receive screens, `D13 Add money` and `D14 Convert`
show Home. `D07 Security` shows Account because it is part of Account.
`D08 Support` shows None, because it is reached from the avatar and is not a
place in the rail.

**The promo slot.** The bottom of the rail holds one card, currently the debit
card. It is `surface/sunken` and flat. It was a green gradient painted straight
onto the node with no token behind it, which broke two rules at once: the brand
does not fill a surface, and nothing is painted unbound. An advertisement must
never be the loudest thing in the navigation.

**Why five and not nine.** On desktop the rail makes everything one click, so
depth is not the cost. Width is. Nine permanent entries is a nine way decision
taken on every screen, every time. 11c.4 records that the phone had eleven such
entries, measured it, and cut to five. The same arithmetic applies here, and it
is the reason desktop and mobile now agree about what a destination is instead
of differing because one of them had room.

The selected glyph does not fill on desktop, and on mobile it does. That is not
an oversight. On mobile the glyph is alone, so filling it is the only way to
show which one is active without relying on colour. On desktop the item carries
a label and a pill, so the state is already carried by shape and not by colour
alone.

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
| D01c Home — gateway | A second Home, kept alongside the first. The amount, three cards to get started, recent activity, and space. See 11b.4a-2 |
| D02 History | Search, three filters, export, twelve payments across five columns |
| D03 Grow | What is in Grow, then Earn and Borrow side by side, each led by its rate, then six questions |
| D03a Borrow | How much with the ruler, the terms, and what secures it with the cover bar |
| D03b Borrow review | The amount, the rate, the monthly cost, the sell point |
| D03c Borrowed | The outcome, with the reference |
| D03d Earn | How much with the ruler, what it pays, and where the interest comes from |
| D03e Earn review | The amount, the rate, when it pays, how to take it out |
| D03f Earning | The outcome, with the reference |
| D03g Repay | How much with the ruler, what is left owing, and what repaying frees up |
| D03h Repay review | The amount, where it comes from, what is left, what that costs |
| D03i Repaid | The outcome, with the reference |
| D03j Take out | How much with the ruler, and what the rest carries on paying |
| D03k Take out review | The amount, where it goes, when, and what you give up |
| D03l Taken out | The outcome, with the reference |
| D02a Receipt | One payment in full: who, the reference, when, the fee |
| D19 Join the list | What the card is, and the address we will write to |
| D06b Close account | The three things that have to happen first |
| D07b Recovery phrase | Hidden by default, and what the words can do |
| D07c Recovery phrase shown | The twelve words, once you have asked for them |
| D14c Your banks | Where payouts go, and how to add another |
| D04 Market | Search, seven categories, three indices, five plain language picks, what is moving today, popular |
| D05 Apple | The full chart, today's trading, growth and valuation, your position, trending, news |
| D06 Account | Personal details, your address with its warning, verification, devices |
| D07 Security | How you get in, recovery, where you are signed in |
| D08 Support | Common questions, how to reach a person, service state |
| D09 Send | Who and how much, in one modal |
| D10 Send review | What is about to happen, before it happens |
| D11 Send sent | The outcome, with the reference |
| D12 Receive | The drawn code, the address, the network warning |
| D13 Add money | Naira in, dollars out, the rate, the moving minimum, recent orders |
| D14 Convert | Dollars out, naira into a bank, capped by the balance, saved banks |
| D15 Sign in | Google first, then email and password, on a 480 card centred on white |
| D16 Create account | The same card, plus what happens next and the terms line |
| D17 Invest | How much with the ruler, what you are buying with its price line, recent orders |
| D18 Wallet | The cash you can spend, three ways to move it, what is still settling, your limits, and your banks |
| D02a Receipt | One payment in full: who, the reference, when, the fee |
| D06a Change email | Two fields and one button, the pattern behind every Change link |
| D07a Change PIN | The PIN you have, the new one, and it typed twice |

Every one of the numbered screens was checked: nothing runs past the frame,
nothing falls below the fold, every gap and padding divides by four, and no grey
line exists anywhere. `D01c` came later and carries its own audit in 11b.4a-2.

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

#### The sixth pass, 4 September

Two references came in together. A dark stock dashboard supplied the **shell**: a
neutral near black, no green cast, colour only on gains. A light finance
dashboard supplied the **layout**: a purpose line, a large amount and two buttons
on the left, an amounts card on the right, one wide chart, a transactions list.
The note attached to them was that the page was still busy and the boxes were too
green. Both were acted on; the orange gradient in the second reference was not.

| Band | Height | What it holds |
| --- | --- | --- |
| Hero | 200 | Purpose line, the portfolio value at Display XL, the day's change, Send and Receive. To the right, one 360 card holding cash, buying power and total gain |
| Chart | 348 | Portfolio over time at 744, with Borrow and Earn stacked in 360 |
| Lists | 288 | Your positions and Recent activity, 552 each |

**The three stat cards are gone.** They held the portfolio value, the day's change
and the cash figure, all of which now sit in the hero or in the amounts card
beside it. A screen should not say a number twice.

**The sand card is gone.** It was the last large block of colour on the page and it
was competing with the chart for a job the chart already had.

**The chart is bars now.** Solid columns, grey by default, with one month drawn in
`ink/strong` and a callout above it carrying the value, a delta chip and the
period. This replaces the dot column chart on Home. The dots were texture; the
bars are a reading. Section 8.12b keeps the dot chart spec because the component
still exists, but Home no longer uses it.

**Send and Receive are the same pill.** Two identical filled buttons, because
sending and receiving are the same size of decision. That is rule 12 in section
13, and the reference happens to agree.

Cards on the page went from ten to six, text nodes to 97, and the audit reports
zero contrast failures, zero overflow, zero spacing off the four grid and zero
clipped text.

#### Both states, and the four backgrounds, 4 September

The first pass rebuilt `D01 Home` and left `D01 Home — detailed` alone, which
meant the Simple and Detailed toggle switched **design** rather than density, and
the sand card the note had specifically objected to was still sitting on half of
Home. Four modal screens made it worse by painting a third, older Home behind
their scrim. Three generations of one screen.

All of them now carry the same design. Detailed differs from Simple only in how
much each line says:

| | Simple | Detailed |
| --- | --- | --- |
| Delta line | `+$142.60 (1.16%) Today` | `… Today · +$1,840.60 (17.28%) all time` |
| Amounts card | Cash, buying power, total gain | plus Invested, and the gain carries its percentage |
| Positions | `Apple` | `Apple · 23.42 shares` |
| Activity | `Today at 14:32` | `TXN-8F2K9G · Today at 14:32` |
| Borrow | `Against your shares, 9.4% a year` | `9.4% a year · 140% collateral · sold below $2,604` |
| Chart callout | value, delta, month | plus the month's high |

`D09 Send`, `D10 Send review`, `D11 Send sent` and `D12 Receive` now paint the
rebuilt Home behind their scrim, so the background of a modal is the screen you
actually came from.

The scrim itself was the quiet fault underneath all of this: a literal `001A14`
at 54 percent on four screens, which is why the modal backgrounds still looked
green after the ramp went neutral. It is `surface/scrim` now.

Whole page, measured: 26 screens, 1,305 texts, zero contrast failures, zero
overflow, zero spacing off the four grid, zero unbound fills.

### 11b.4a-2 Simple, the other Home

`D01c Home — gateway` (`565:135`) started as a second Home built to sit beside
the first so the two could be compared and one chosen. That comparison is over.
`D01 Home`, the original Simple screen, has been deleted, and this screen is
Simple now. The page went from nineteen screens to eighteen.

**The two are one destination with two views**, joined by the Simple and
Detailed toggle. Detailed sits on the left of section B, Simple on the right,
and Simple is where people land. Both carry the toggle, each showing its own
side as selected. Before 4 September only Detailed had it, so a person landing
on Simple had no way to reach the other view and no way back once they left.
A pair of views needs the switch on both, or it is not a pair.

They agree on every number they both show: the total, the day's change, and the
four activity amounts they share. Detailed shows more, which is the point of it,
and the greeting is the same on both because it is the same person at the same
moment.

The first Home answers "how am I doing". This one answers "what do I do next".
It is a way in to the three things the sidebar cannot hold, and nothing else.

What is on it, top to bottom:

| Band | What it holds | Height |
| --- | --- | --- |
| greeting | `Good morning, Chinaza`, then one line of status | 72 |
| portfolio | `TOTAL PORTFOLIO`, the amount at 48, the day's change | 104 |
| get started | Buy, Convert and Borrow as three cards of 320 | 228 |
| activity | Five rows and a `See all`, built from `Activity row` instances | 288 |

Content is 1008 wide inside 96 of padding on each side and 72 top and bottom,
with 48 between bands. That comes to 932 of the 1024 the frame gives, so about
92 is left over at the bottom. The empty space is the design, not a gap left by
accident.

What is deliberately missing, and why:

- No chart. The reading of a chart is the first Home's job.
- No stat cards. Four numbers in a row is a dashboard, and this is not one.

Each of the three cards carries a halftone dot field across its bottom 140. The
three are windows onto one continuous field rather than three separate pictures,
so the pattern runs across the row. See 8.12f.
- No cash strip, no positions table, no Earn panel, no offers.
- The activity rows were bare at first, a name, a time and an amount. They carry
  the full treatment now, a direction glyph, the reference, a status pill and the
  masked account, the same as Detailed. Two views of one destination should not
  disagree about what a row is.

Each of the three cards is the same shape: a 48 badge on `surface/control`, the
verb as a title, one plain sentence saying what it is for, and a link at the
bottom. The sentences are written for someone who has not used the product
before. "Own a piece of Apple, Nvidia or a whole market fund. From $1." is the
Buy card, not "Purchase fractional equities".

The status line under the greeting first read "Your portfolio is up $142.60
today", which put $142.60 on the screen twice, once there and once in the
delta below the amount. That is rule 34, and the rule caught it in the audit
rather than in a review. It reads "Everything is settled. Nothing needs your
attention." now, and no figure on the screen appears more than once.

Measured after the fixes: 127 nodes, zero contrast failures, zero overflow,
zero gaps or paddings off the four grid, zero unbound fills, no data colour on
text, no text below full opacity.

The first attempt at this screen collapsed. The greeting came out 1872 tall and
the cards came out one pixel wide, because `layoutSizingHorizontal = 'FILL'` was
set on children whose parents did not have a resolved width yet. Fill is a
share of something, and there was nothing to take a share of. The rebuild gives
every container an explicit width, appends the child first and sizes it after,
and none of it moved again. See rule 38.

### 11b.4b The Market page

`D04 Market` was `D04 Stocks`. It is where you go to find something to buy, and
on 5 September it was rebuilt against how the category actually works.

**The one thing nothing else in the category can say.** Bamboo, Trove and
Risevest all trade real US equities, so they are shut from 9pm to 2:30pm the next
afternoon in Lagos. A Nigerian who opens one of those at ten in the morning can
do nothing for four and a half hours, and none of them says so on the browse
screen. Tokkenly's stocks are tokenised and trade around the clock, so the page
leads with `Open now · trades 24/7` in the header and says it again in plain
words under the search: *Everything here trades any time, day or night. No
opening bell, no waiting for New York.* That is the sentence the page exists to
deliver.

| Band | What it holds | Height |
| --- | --- | --- |
| page header | `Market`, and the open marker with a live dot | 28 |
| search | One field across the full width, not a box in the corner | 52 |
| why | The 24/7 line in plain words | 20 |
| categories | All, Popular, Technology, Funds, Dividend, Energy, New | 24 |
| markets | S&P 500, NASDAQ, DOW JONES with their sparklines | 100 |
| columns | Your watchlist on the left, Moving today on the right | 384 |
| collections | Worth a look, four plain language picks | 140 |

952 of 1024 used.

**Search stopped being a control in the page header** and became a band of its
own across all 1128. Finding a company is the reason people open this page, and
it was competing with a title for the corner.

**The watchlist is new**, and it is the thing a returning person opens the page
for. Five rows: ticker, company, price, change. It needed a follow action on the
company page to mean anything, and `D05 Apple` carries one now. See 8.12g.

**Moving today carries three tabs**, Gainers, Losers and Active, where the old
page had only a list of things going up. A browse screen that can only show good
news is not a market screen.

**What survived unchanged.** The plain language collections. Nothing else in the
category writes *One fund, five hundred companies* or *Companies that share their
profit*, and they are the reason this page reads as built for someone who has
never owned a share.

**What went.** The four popular cards, which said the same thing as the watchlist
with less information in more space, and the separate `Popular` heading above
them.

Two defects the rebuild surfaced. Four collection meta lines were `ink/subtle`
at 3.06 to 1, which is the same trap 8.12c already records: quiet is a token, and
never `ink/subtle` when the quiet thing is something a person is reading. And the
sidebar showed **two** rows lit on `D04`, `D05` and `D17`, because the Wallet row
added on 4 September was cloned from whatever Market row already existed in each
variant, and in `State=Market` that row was the active one. The clone was named
`inactive Wallet` and painted active. The first fix missed it by reading names.
See rule 45.

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

### 11b.4d The Wallet page

`D18 Wallet` (`643:1245`) is the page the rail entry has been pointing at since
4 September. It closes the debt recorded in 11b.2.

**Home answers how am I doing. Wallet answers where is my money and how do I add
more.** That sentence decided everything on the page, and mostly it decided what
is not on it. There is no portfolio total, no day's change, no positions and no
chart. 11c.4 records that Portfolio was folded into Home because a second page
of the same numbers is a page nobody needs, and a Wallet that opens with
`$12,480.60` is that page again wearing a different name.

| Band | What it holds | Height |
| --- | --- | --- |
| page header | `Wallet`, and `Add money` as the one filled button | 40 |
| balance | `AVAILABLE TO SPEND`, the cash figure at 48, and one line of state | 104 |
| rails | Send, Receive and Convert as three cards of 360 | 96 |
| columns | In progress and Your limits on the left, Payment methods on the right | 458 |

860 of 1024 used, so the page has 164 spare. It is a short page on purpose.

**The hero figure is the cash, not the portfolio.** `$2,480.00` is what can be
spent or invested today. It is the same number Home carries as one line inside
its Available card, which is correct: a summary points at the page that owns the
subject. Wallet owns cash.

**`Add money` is in the header and nowhere else.** The rails row carries the
other three movements, so no action appears twice. Buy is absent because buying
is not a money movement, it is what the money is for, and it lives on Home and
in Market.

**In progress is the reason the page earns its place.** Two pending rows, built
from `Activity row` instances in their Pending variants, and a line saying
nothing else is waiting. Home never shows this and History buries it among
everything that already finished. A person who wants to know whether their money
has arrived has had nowhere to look until now.

**Your limits** is the other thing no other screen carries: what you may send in
a day, convert in a month, and add in a day, each with what is already used.

**Two things were cut after the first build.** The right column had a debit card
panel that repeated the promo already in the sidebar, which is the same offer
twice on one screen. And the balance line read `$620.00 is on the way`, naming a
figure the pending row underneath already carried. It reads `Two payments are
still settling` now, and no figure appears twice on the page. See rule 34.

Measured: 131 nodes, no contrast failures, no overflow, no spacing off the four
grid, no unbound fills, and both amounts obey 8.12d.

### 11b.4e The five rails, finished

Send had three screens. Add money, Convert and Invest had one each, so the
product could take a person's money without ever showing them what they were
about to do or telling them it had worked. All five are complete now.

| Rail | Screens |
| --- | --- |
| Send | `D09 Send` · `D10 Send review` · `D11 Send sent` |
| Receive | `D12 Receive` |
| Add money | `D13 Add money` · `D13a Add money review` · `D13b Add money added` |
| Convert | `D14 Convert` · `D14a Convert review` · `D14b Convert done` |
| Invest | `D17 Invest` · `D17a Invest review` · `D17b Invest bought` |

**Every review and every outcome is a sheet**, including on the three rails that
are pages, which is what 8.15 already required and 8.15a now explains. The page
stays behind at 54 percent so a person can see what they were doing.

**The shape is one shape.** A 480 sheet at radius 28 with 32 of padding. A head
with the word and a close. A figure with a caps label and the amount. A panel of
four labelled rows. One callout. One filled button naming the action and the
amount. The outcome sheet swaps the figure for a 64 tick and adds a second,
quieter button.

**The four rows differ because the questions differ**, and that is the point of
having them rather than one generic receipt:

| Rail | What the panel answers |
| --- | --- |
| Send | Who, what it costs, when it lands |
| Add money | What you pay in naira, which bank it leaves, the rate, when it lands |
| Convert | What you get in naira, which bank it lands in, the rate, when |
| Invest | How many shares, the price each, the fee, when it settles |

**Two defects came out of the build.** Cloning a screen dropped the scrim's paint
opacity from 0.54 to 1, so the first two sheets were solid black with nothing
behind them. That is the same fault 2.9b-1 records from March: a bound paint
loses its alpha unless the alpha is part of the object you bind. Every scrim on
the page is checked now, and all ten carry 0.54.

And `D05 Apple` and `D17 Invest` had been sitting at the same x inside section H
since the day Invest was drawn, one on top of the other. Nobody saw it because
the section is wider than a screen.

**Rule 34, refined.** A confirm button may name the amount, because that is how a
person knows what they are agreeing to. What it may not do is show the figure
twice as *information*. `D10 Send review` did: the hero said `$120.00` and a row
called THEY RECEIVE said `$120.00` underneath it. The fee is free, so the row
could never say anything else. It is gone.

### 11b.4f Grow, finished

Grow was a hub with two dead ends. The Earn card had a button called `Move money
in` that led nowhere, and the Borrow card had a button called `Borrow $1,150`
that led nowhere and named an amount nobody had chosen. Both products now have a
page and a two sheet chain, the same shape the five rails use.

| Product | Screens |
| --- | --- |
| Borrow | `D03a Borrow` · `D03b Borrow review` · `D03c Borrowed` |
| Earn | `D03d Earn` · `D03e Earn review` · `D03f Earning` |

Three taps from the hub in both cases: the product button, `Continue`, then the
confirm. Four from anywhere in the app, counting the sidebar.

**The terms were invented and they should be read as invented.** Nothing in the
codebase sets a rate, a collateral ratio or a payout schedule, so this document
is the only place they exist, the way 11c.4a already flags the equities gap. What
the design does guarantee is that they are the *same* invented numbers
everywhere, which they were not before.

| Fact | Settled at |
| --- | --- |
| Cash in the wallet | $2,480.00 |
| In Earn | $1,240.00 |
| Earn rate | 4.8% a year, paid every day |
| Earned so far | +$18.60 |
| Shares held | $12,480.60 |
| Borrow limit | $1,860.00 in total |
| Already borrowed | $380.00 |
| Available to borrow | $1,480.00 |
| Borrow rate | 9.4% a year |
| Cover required | 140% of what is owed |
| Interest owed so far | $8.90 |

**Four screens disagreed with each other before this pass.** `D03 Grow` said
Borrow was 8.2% a year; `D01 Home — detailed` said 9.4%. Grow said you borrow
`Against $2,480.00 you hold`, which is the cash balance, not the shares the loan
is actually secured on. Five screens carried a Borrow offer card reading
`$1,860`, the full limit, on a person who has $380 out. And Earn's `Paid so far`
and Borrow's `Interest so far` were both `$12.40`, one being money received and
the other money owed.

**The sell point is derived, so it stopped being quoted as a constant.** At 140%
cover, $1,530 owed is sold below $2,142, and $1,860 owed is sold below $2,604.
The old Home line quoted $2,604 next to a person who owed nothing, so Home now
states the rule instead: `9.4% a year · 140% cover · repay any time`. Only the
Borrow composer, where an amount has actually been chosen, names a figure.

**Borrow's second column is the risk, not the product.** Invest puts the company
on the right. Borrow puts what secures the loan: the shares, a cover bar with a
notch at the minimum, three position rows, and a small table that answers the
only question that matters.

| Shares fall by | Worth | What happens |
| --- | --- | --- |
| 20% | $9,984.48 | Nothing changes |
| 50% | $6,240.30 | Nothing changes |
| 83% | $2,142.00 | We sell enough to cover |

That last row repeats the sell point stated in the summary above the button. It
is the one duplicate on the screen that earns its place, because the table is
where the number comes from.

**Earn's second column is where the money comes from.** A rate with no
explanation behind it is the thing that makes people not use these products, so
the card says plainly that the dollars sit in short term US government debt, that
the rate moves with the market, and that it is neither fixed nor guaranteed.
Above it, a projection: what $1,740 pays over a month, six months and a year.

**The Grow hub was rebuilt around the two rates.** Each product card leads with
its rate as a display figure rather than burying it in a row, then one line of
what it is, then two numbers, then the button. Under both, six questions with
plain answers, which is the only part of the page written for someone who has not
decided yet.

**The collateral meter is a bar, not a number.** 816% cover means nothing on its
own. The bar fills to where the cover sits, with a notch at the minimum, so the
distance between them is the message. The notch is painted `surface/canvas`, not
a state colour, per rule 41.

**Two of the three audit findings were the audit's.** They are written up as rule
48. The one real fault was `+$18.60` sitting neutral on all three Earn screens,
because the row it was cloned from was an outgoing figure.

**What still leads nowhere.** `See all` on both history bands, `See holdings` on
the Borrow card and `See history` on the Earn card. Repaying and taking money out
were on this list until 11b.4i; both are drawn now.

### 11b.4g History, Account, Security and Support

Four screens that showed facts and offered nothing to do with them.

| Screen | What was added |
| --- | --- |
| `D02a Receipt` | The sheet a History row opens. There was no way to see one payment in full |
| `D06a Change email` | The form sheet behind Change. Three of the five personal details now carry one |
| `D07a Change PIN` | The form sheet behind App PIN |

**A row that shows a payment has to open the payment.** `D02 History` listed
twelve and none of them led anywhere, so a person could see that $120.00 arrived
and never find out who from beyond a first name. The receipt names the sender,
the reference, the time and the fee, and says plainly that nothing about it is
going to change now. Its figure is the one green Display XL in the file, because
it is money in and rule 43 does not stop at small text.

**Three of the five personal details are things a person changes.** Name and date
of birth are what the NIN check verified, so they are facts. Mobile number, email
and home address are not, and each now carries the same `Change` link the Invest
card uses. The email sheet is the pattern: two fields, a note about what will
never be asked for, and one button.

**Support was telling people the truth from March.** It answered *When do Earn,
Borrow and Stocks open* with *They are being built. Nothing is live yet*, on a
product where all three are now drawn as working. That answer is gone. Five
questions took its place, all of them raised by what 11b.4f built, and the page
got a search because ten questions is a list you scan rather than read.

**Security says what to do, not only what is set.** Two cards were added: the
three steps to take if the phone is lost, and a flat statement that nobody at
Tokkenly will ever ask for a PIN, a recovery phrase, or a code from a text
message. That last one is the single most useful sentence on the page in a market
where the fraud arrives by phone call.

**Account gained the two things a finance app owes a person**: everything held
about them, downloadable, and a plain account of what closing the account
involves. Neither is decoration. Both were empty space before.

**Four faults, all mine, all the same shape as ones already recorded.** The
never-do paragraph was cloned from the amber recovery warning and kept its
colour, so a calm statement arrived looking like an error, which is rule 41 from
the other direction. The form fields were cloned out of the History filter, where
they were `FILL` on the vertical axis of a horizontal row; dropped into a vertical
sheet the same value collapsed them to nothing, which is rule 38 again. Their
labels kept the centre alignment of the figure caps they were cloned from. And
they were painted `surface/sunken`, the same value as the sheet, so the first
render had three invisible inputs; they take `surface/control` now, the step a
control on a card is supposed to sit on.

**`D08 Support` was lighting no sidebar row at all.** Account and Security both
light Account, because neither is a place in the rail. Support is reached the
same way and now does the same. Rule 39 says the rail lists places, and a screen
that is not a place still has to say which place it belongs to.

### 11b.4h Detailed Home, made to fit

`D01 Home — detailed` had run 1232 tall inside a 1024 frame since it was drawn.
The bottom of Recent activity and the whole of the Available card were simply
below the fold, and the audit never caught it because the frame clips rather than
overflows, which is rule 46.

Two hundred and eight had to come out. It came out of four places, none of them a
squeeze:

| Change | Reclaimed |
| --- | --- |
| Borrow and Earn, two near identical offer cards, became one Grow card | 136 |
| Recent activity went from eight rows to four, of which five ever rendered | 208 |
| The quick action cards stopped setting the summary height and started following it | 20 |
| The line above the amount became the status line the gateway already uses | — |

The page now measures 1024 of 1024 with nothing clipped.

**The two offer cards were the easy 136.** Each was a caps label, a display figure
and a caption, stacked, saying almost the same thing about two products that live
on one page. One card called GROW, two sentences, one chevron. It also fixed the
thing that made them wrong: they were the only place still quoting `$0.00 to
date`, from before Earn had a history.

**Recent activity keeps four rows and its `See all`.** Eight were in the file and
five fitted. A card that promises eight and shows five is worse than one that
shows four and points at History.

**`Your positions` was painted a raw colour.** Not a token, a hex, which is why it
alone on that page read green. Rule 3 has been in this document since March and
the audit that would have caught it, the unbound fill check, was only ever run on
screens as they were built. It is bound to `surface/sunken` now and the check runs
across all thirty six desktop screens.

**Buying power stopped adding up** when the borrow limit changed. $2,480 of cash
plus $1,480 that can be borrowed is $3,960, not the $4,280 five screens were
carrying.

**One amount was the other kind of wrong.** `D18 Wallet` shows a bank transfer of
`+$200.00` that is still in progress, painted neutral. Colour and state are two
signals with two jobs: the chip says it has not landed, the colour says which way
the money is going. It is green.

**The file passes end to end now.** Thirty six desktop screens: nothing past the
fold, nothing below 4.5 to 1, no unbound fill, no gap or padding off the four
grid, every amount coloured by direction, and every signed in screen lighting
exactly one place in the rail.

### 11b.4i Repay and take out, the way back

Every screen in Grow said the same two things: repay any time, take money out any
time. Neither had anywhere to go. A promise a screen makes often enough becomes a
claim, and a claim with no screen behind it is the kind of thing a person finds
out about at the worst moment.

| Way back | Screens |
| --- | --- |
| Repay | `D03g Repay` · `D03h Repay review` · `D03i Repaid` |
| Take out | `D03j Take out` · `D03k Take out review` · `D03l Taken out` |

**Each is its forward flow with the direction reversed**, and deliberately so.
Repay is the Borrow composer: the same ruler, the same typeable field, the same
four summary rows, the same sheet shape. A person who has borrowed once already
knows how to repay, because it is the screen they have seen. Three taps from the
hub, four from anywhere.

**Reversing a composer changes what the second column is for.** Borrow's right
column is the risk, because the question there is what happens if the shares
fall. Repay's is the cost, because the question here is what the debt is doing
while it sits:

| Repay | Left owing | Costs a month |
| --- | --- | --- |
| $100.00 | $288.90 | $2.26 |
| $250.00 | $138.90 | $1.09 |
| Everything | $0.00 | Nothing |

Under it, the thing people get wrong about repaying: your limit goes back up by
whatever you repay, and your shares were never sold either way.

Take out does the same in the other direction. Earn's right column projects what
the money will pay; Take out's projects what is left after the withdrawal pays,
on $940 rather than $1,740. Its callout answers the only real worry, which is
whether taking money out costs you the interest already earned. It does not.

**Neither screen leads with a collateral bar.** Borrow earned one because 816%
cover means something next to a 140% minimum. With $388.90 outstanding against
$12,480.60 of shares the same bar reads 3,209%, which is a true number that
teaches nothing. It was removed from the Repay clone, the same way it was removed
from Earn.

**The hub is the door.** `EARN` and `BORROW` each carry a link in their header
row, named for where it goes: `Take out` and `Repay`. Rule 39 says a rail lists
places; a card header link names an action, and it should be the action's own
name rather than a description of it.

**Two figures were nearly wrong.** The first draft put `Left earning $940.00` in
Take out's summary and `$940.00` again as the right column's figure, and gave
Repay a right column headed by `$388.90` when the page header already said it.
Both were caught before they were drawn, by working the copy out against the
duplicate figure check rather than after it.

### 11b.4j Links that led nowhere

A link is a promise. Twenty three of them were not being kept.

**Fifteen `See all` links pointed at a History that could not show what they
promised.** `YOUR LOANS`, `YOUR EARNINGS` and `RECENT ORDERS` all offered to show
you the rest, and `D02 History` held payments only: twelve rows, filtered All,
Received, Sent. The fix was not to cut the links. It was that History had been
wrong since it was drawn.

**History is now the one place for everything.** The filters are `All`,
`Payments`, `Trades` and `Grow`, and the table carries all three kinds: a payment
in, an Apple buy, a Tesla sale, a day of Earn interest, a drawdown on the loan.
That also closed a contradiction nobody had noticed. `D01 Home — detailed` has
always shown `Bought AAPL` and `Sold TSLA` in Recent activity, and the History
page those rows led to had no trades in it at all.

**The direction arrows had to be re-derived.** They had been alternating in, out,
in, out down the old list, which was right by luck rather than by rule. Ten of the
twelve were wrong the moment the rows changed, so each is now set from the sign of
its own amount. That is rule 43 again, in a column nobody thinks of as an amount.

**The rest sorted into three piles.**

| Fix | Links |
| --- | --- |
| Remove, the content is on the same page | `See history` ×6, `See loans` ×3, `See news`, the watchlist's `See all` |
| Rename, so it names where it goes | `See holdings` → `Your positions` ×3, `View loan` / `View Earn` / `View order` → `View in History` ×5, `Change` → `Change stock` ×3 |
| Build the destination | `D19 Join the list`, `D06b Close account`, `D07b Recovery phrase`, `D07c Recovery phrase shown`, `D14c Your banks` |

**Removing is a fix, not a retreat.** `See history` sat in the header of the Earn
card with the earnings table eight hundred pixels below it on the same screen.
`See news` sat next to Apple's price with a `NEWS` band further down the same
page. The watchlist's `See all` sat above a list of all five things in it. A link
to something already visible is worse than no link, because it makes a person
wonder what they are missing.

**Two of the built screens are one flow.** A recovery phrase screen that shows the
words by default is a screen that leaks them over somebody's shoulder, so `D07b`
shows `Hidden` and states plainly what the words can do, and `D07c` shows them
only after `Show the words` is pressed, with a button that says `I have written
them down` rather than `Done`.

**Closing an account is a sheet with no confirm button.** `D06b` does not offer a
red `Delete` that a mis-tap can reach. It lists the three things that have to
happen first, tells you records are kept for seven years because the law requires
it, and ends in an email. Destructive and irreversible are not the same as fast.

**Forty six desktop screens now pass**, and no text on any of them offers a
destination that does not exist.

### 11b.5 The desktop flows

The screens used to sit loose on the page in a grid of four across. They now sit
in named sections like the phone screens do, one section per flow, in the order
a person meets them.

| Flow | Screens |
| --- | --- |
| A. The way in | D15 Sign in, D16 Create account |
| B. Home | D01 Home detailed, D01c Home gateway |
| C. Wallet | D18 Wallet |
| D. Receive money | D12 Receive |
| E. Send money | D09 Send, D10 Send review, D11 Send sent |
| F. Buy and convert | D13 Add money, D14 Convert |
| G. History and receipts | D02 History, D02a Receipt |
| H. Grow and Stocks | D03 Grow, D04 Market, D05 Apple, D17 Invest, D03a–D03c Borrow, D03d–D03f Earn, D03g–D03i Repay, D03j–D03l Take out |
| I. Account, security and support | D06 Account, D06a Change email, D07 Security, D07a Change PIN, D08 Support |

**Wallet sits third, straight after Home**, for the same reason it sits second in
the rail: funding comes before anything a person can do with the money. The
section letters are positions, not names, so they were all shifted rather than
letting Wallet keep the letter it was built under.

Arrows appear only between real steps. Flow E carries two, because the send is a
chain. Flow H carries one, between Market and the company page it opens. Flows
A, B, F and I hold alternatives rather than steps, so they carry none. B holds
two views of one destination, which is not a step either.

A desktop section is 60 of padding on each side, its note at 48 from the top,
and its screens at 144. Screens sit 160 apart, and sections sit 240 apart. The
phone pages use the same shape with 48 between screens, because the frames are
narrower.

### 11d.1 The build, on a phone

`app/` is one codebase in two shapes. Above 900 pixels it is `06 Desktop`.
Below, it is `07 Mobile`, and the difference is not a squeeze.

| Desktop | Phone |
| --- | --- |
| Sidebar of six places | Top bar for identity, floating rail of four tabs, More for the other two |
| Centred modal | Sheet from the bottom, full width, radius on the top corners only |
| Composer is a page with context on the right | Composer is a sheet over the place it belongs to, because there is no right |
| Ruler and a typed field | Ruler, a typed field, and a keypad |
| Five column tables | Two columns, with what was dropped stacked under the name |

**A composer knows what it sits over.** `ComposerSpec` gained one field, `base`,
naming the screen the sheet belongs to: Borrow and Repay sit over Grow, Invest
and Sell over the company page, Send and Convert over Wallet. On the phone the
composer renders that screen and puts itself on top of it. When a review or an
outcome opens, the composer sheet steps aside rather than stacking, so a phone
only ever shows one sheet.

**Fitting the button on the screen was the real work.** The first phone
composer ran 928 tall in an 88vh sheet, which put `Borrow $1,150.00` below the
fold on the one screen where the button is the point. The ruler shortened, the
hint went because a keypad explains itself, and the callout moved to the review,
which repeated it anyway. `scripts/fit.mjs` now asserts that every one of the
nine composers has its button on screen at 390 by 844.

**Four screens scrolled sideways** before the charts were told to share the
width they have rather than the width they were drawn at. `scripts/phone.mjs`
measures `scrollWidth` against the viewport on every address, so that class of
fault reports itself.

**Send is two steps on a phone and one on desktop.** Desktop puts the list of
people in the right column, so who and how much are decided on one screen. There
is no right column on a phone, so `/send` shows the picker first and the amount
arrives as a sheet once somebody is chosen. It is the same address either way:
`/send` is the picker, `/send?to=Tunde%20Bakare` is the amount over it, and Back
returns to the list rather than out of the flow. Each person carries when they
were last paid, taken from the activity feed, because that is how people find
the one they want.

## 11e. The phone

`07 Mobile` carries the settled product at 390 by 844: forty seven screens, one
for every place and every sheet on `06 Desktop`.

**It is built on the phone language that already existed, not a new one.** Page
`04 App` had twenty nine screens from before Grow, Wallet and Market were
settled, and they had already solved the hard part: a 56 status bar, a body at 20
of side padding with a 24 gap, and a floating navigation that is four tabs in a
pill with a separate More button beside it. That component is reused unchanged.

**Four tabs and a More button.** Home, Wallet, Market and Grow sit in the pill.
More opens a bottom sheet holding History, Account, Security, Your banks,
Support and About. Six places, the same six the desktop rail lists, reached the
way a phone reaches them.

The nav component's variants are still named `Money` and `Stocks` from the older
product. They light the right icons, and renaming them would break the twenty
nine instances on `04 App`, so they stay. What a variant is called is a note to
whoever opens the file; what it paints is what a person sees. Rule 45, applied to
a name that is wrong but harmless.

**A composer is a bottom sheet, not a page.** This is the one real difference
from desktop. There, Borrow and Earn are pages with the amount on the left and
the context on the right. There is no right on a phone, so the context stays on
the Grow screen and the amount arrives as a sheet over it, with a keypad. The
review and the outcome are sheets over the same screen, so a person never leaves
the place they started from.

| Flow | Screens |
| --- | --- |
| Home | `M01` detailed, `M02` simple |
| Wallet | `M03` |
| Buy dollars | `M04` · `M05` review · `M06` bought |
| Send | `M07` who · `M08` amount · `M09` review · `M10` sent |
| Receive | `M11` |
| Convert | `M12` · `M13` review · `M14` done |
| Market | `M15` · `M16` a company · `M17` invest · `M18` review · `M19` bought · `M20` sell |
| Grow | `M21` hub |
| Earn | `M22` · `M23` review · `M24` moved in |
| Take out | `M25` · `M26` review · `M27` taken out |
| Borrow | `M28` · `M29` review · `M30` borrowed |
| Repay | `M31` · `M32` review · `M33` repaid |
| History | `M34` · `M35` receipt |
| You | `M36` Account · `M37` change email · `M38` close account · `M39` Security · `M40` change PIN · `M41` recovery phrase · `M42` shown · `M43` Support · `M44` your banks · `M45` join the list |
| The rail | `M46` More |

**The way in is not repeated.** `03 Onboarding` already runs fourteen phone
screens from welcome through the recovery phrase, the PIN, Face ID, the mobile
number and the NIN check. It is better than the two cards the desktop uses.
Section A on `07 Mobile` is a note pointing at it and nothing else.

**The whole page was in the wrong colour mode for a while.** Every fill on those
twenty nine screens is bound to a token, so nothing was painted wrong; the frames
were simply resolving `Colour` in Light. One explicit mode on the page turned
forty seven screens dark at once. A palette held in variables is worth the
trouble on exactly the day you find that out.

**What the copied screens were still saying.** Borrow at 8.2% a year against
`$2,480 you hold`, a `$1,860` limit, `Paid so far +$12.40`, an `EVERYDAY` account
label from before the product was called Tokkenly, and a `Not open yet` pill on a
product that is now drawn as working. All of it is on the settled numbers now.
Some of it was inside component instances, which the first sweep skipped, because
a text override is still a text.

**Three faults of my own, worth writing down.** The Grow hub's two new links,
`Take out` and `Repay`, were put in the slot that holds a status pill, so they
arrived amber with a dot: an action dressed as a warning, which is rule 41 from
the other side. They are neutral controls now. The sweep that applied them
matched `card > row` and hit the Account screens, overwriting a phone number with
the word `Repay` on three of them. And Support, cloned from Security, inherited a
toggle switch on `How long does a payment take`, because a list of questions and a
list of settings have the same shape and only one of them is switchable.

**Forty seven screens pass**: nothing below 4.5 to 1, no unbound fill, no gap or
padding off the four grid, and every amount coloured by direction. Two
placeholders and a button label were lifted off `ink/subtle`, and twenty figures
that were money in were painted `state/positive`.

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

Account sits at the bottom of the sidebar, away from the four above. Security
is part of Account and Support is reached from the avatar, so neither is a rail
entry any more. Buy, Receive, Send and Convert keep their routes but are reached
from buttons rather than from the rail. See 11b.2.

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

Desktop used to carry all eight and does not any more. The rail holds five
places and the four money rails are buttons, which is closer to what the phone
does than what desktop did before. See 11b.2.

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

Repaying a loan and taking money out of Earn were the two gaps left by 11b.4f.
Both are drawn now, as 11b.4i.

The staff panel is out of scope for now. It holds a list of users, a user in
full, transactions, and a log of who looked at what. It is a different audience
with different needs and it should not borrow the consumer layout unexamined.

## 11d. The build

The desktop product is written as well as drawn. `app/` holds a TypeScript
build of every screen in section 11b, with the flows running end to end. It is
not a click-through: the state is real, so borrowing moves money into the
wallet, raises what is owed and drops the collateral cover, and History shows
the entry a moment later. `npm install && npm run dev` runs it.

**Three things the code enforces that a Figma file can only ask for.**

Money in is green and signed, money out is neutral, because one function paints
every amount in the product. Rule 43 stops being a habit and becomes arithmetic.

Anything draggable is typeable, because the ruler and the field are one
component that writes both ways. Rule 47 cannot be half-implemented.

Nothing names a colour. `src/styles/tokens.css` carries the palette from section
2 and every screen file reads from it, so rule 3 holds by construction.

**A sheet is an address.** `#/grow/borrow?sheet=borrow-review&v=1150` opens the
review over the composer and survives a reload, which means any step of any flow
can be linked and reviewed on its own. `#/map` lists all of them, screens and
sheets together, on one page.

**It is checked by clicking it.** `scripts/flows.mjs` drives a real browser
through five flows and asserts what the money did: borrow $600 and the wallet
goes $2,480 to $3,080, repay it and the limit comes back, buy $250 of Apple and
the holding goes 23.42 to 24.54 shares. `scripts/walk.mjs` opens all twenty four
addresses and reports any page error. Both pass.

## 12. The prototype

Both pages are wired for a click through. The floating navigation works on
every screen that carries it, the send flow runs from picking a person to the
receipt, and the onboarding screens run in a straight line.

Figma does not allow a prototype link to cross from one page to another, so the
onboarding prototype ends at Verified and the app prototype starts at Home.
Testers open them as two separate runs.

Starting points are set. Onboarding opens at Welcome or at Restore your
account. The app opens at Home or at a brand new account.

## 11f. Tightening, and the states nobody had drawn

Three jobs in one pass: put the Send picker into the phone file, tighten the
main column on the desktop, and draw the interaction states that existed in the
code but had never been designed. Figma first, then the same changes in the app,
so the record and the product stay the same thing.

### 11f.1 The Send picker, as a screen

`M07 Send — who` already existed, but as a sheet over the wallet listing three
people by phone number. The app had moved on: the picker is a screen, it lists
four people, and each line says when you last exchanged money with them rather
than repeating a number you never dial.

The screen was rebuilt to match. A back chevron and the title, the cash you have
on the right, a search field, a card of people ordered by how recently money
moved, and a second card for pasting a Base address. The scrim and sheet are
gone, so it is a screen and not a modal.

Two things came out of rendering the live app beside it. Tunde's line wrapped to
a second line, which made his row eight pixels taller than his neighbours; a
list of people whose rows are different heights reads as a mistake, so the name
and the line under it now truncate. And the search box did nothing at all. It is
the only search in the product that was never wired, which is its own kind of
dead link: it now filters on Enter through `?q=`, the same way History, Market
and Support already did, and finds an empty state when nobody matches.

### 11f.2 Tighter, on both sides of the breakpoint

The sidebar was left alone. The main column lost, across all forty five desktop
screens:

| What | Was | Now | Times |
|---|---|---|---|
| Page padding | 32 / 36 | 24 / 32 | 41 |
| Page header to content | 32 | 24 | 35 |
| Card padding | 24 | 20 | 110 |
| Panel padding | 32 | 24 | 66 |
| Between stacked cards | 24 | 16 | 53 |
| Hero to the action tiles | 96 | 32 | 1 |

Two hundred and seventy five changes. Security got 112 pixels back, Account 88,
Home 52. Nothing overflows: the only casualty was `Vanguard S&P 500 · 5.60
shares`, which ran 16 pixels past its column once the padding shrank, and now
fills its column and truncates.

The phone got the same treatment and a real fix. Nineteen screens had their rail
at 722 and twenty six at 748; they are all at 748 now, which is
`844 − 64 − 32`, clear of the home indicator. Six screens had content running
past the bottom of the frame, by up to 88 pixels. All forty six now fit, with
nothing clipped and nothing hiding behind the rail.

The app carries the same numbers: `--content-pad-x` 36 → 32, `--content-pad-y`
32 → 24, `.content` gap 32 → 24, `.card` padding 24 → 20, `.stack` gap 24 → 16,
`.row` gap 24 → 20, and the rail at `bottom: 32px` so it lands at 748 in an 844
viewport, exactly where Figma puts it.

### 11f.3 The states

`Button` carried Default, Pressed and Disabled. It now carries six states across
five variants and two sizes, sixty in all:

| State | What it does |
|---|---|
| Default | the resting fill |
| Hover | Primary lifts to `surface/inverse-hover`, Secondary and Quiet step up the grey ramp, the coloured ones take a six per cent white lift |
| Focused | the default, ringed in `border/focus` at 2px outside |
| Pressed | 0.88, as before |
| Loading | the default, with a ring turning where the label sits |
| Disabled | `surface/sunken` and `ink/subtle`, as before |

`surface/inverse-hover` is new: `#ececed` in dark, `#02231c` in light. It exists
because the app was painting `#ececed` as a raw hex in `.btn-filled:hover`,
which is the one thing rule 3 forbids. `Icon button` had no states at all and
now has four, forty eight variants.

Three components that never existed:

- **Empty state**, three reasons — No results, Nothing yet, Failed
- **Toast**, three types — Info, Success, Error
- **Skeleton row**, for the shape of an answer before the answer

In the app, the states audit found rather more missing than the file did. There
was no `:active` anywhere, `[disabled]` styling existed only on `.btn`, and
there was no loading, no error and no empty state of any kind. Three searches
fell back to a grey sentence and one fell back to nothing.

All of it is there now, and `scripts/states.mjs` drives every one of them in a
real browser: hover changes the fill to the token and not a hex, Tab draws a 2px
ring, a real mouse press reads 0.88, a zero amount disables the action and stops
taking clicks, confirming shows a spinner and then the outcome, three searches
find an empty state that can clear itself, the picker filters, and a short Base
address is marked red where it was typed rather than in a toast that has already
gone by. Fifteen checks, no failures.

The loading state is real rather than decorative. Every confirmation in the
product goes through one `review()` helper, so the spinner was added once, and
money now takes `CONFIRM_MS` to move.

### 11f.4 What the audits caught that the eye did not

Two faults, both recorded as rules.

The mobile overflow pass read `body.height` and flagged twenty five screens.
Thirty one of the forty six bodies are fixed height and always read 844, and
three more end in a spacer frame that the check counted as content. Six screens
were genuinely wrong. The trim ran on nineteen that were not — they look fine,
and they are now on the same scale as the desktop, but the trigger was a bad
measurement and not a design decision. Rule 50.

The contrast pass found `Inverse, Hover` at 1.37:1. The six per cent white lift
had shipped at full opacity, because `setBoundVariableForPaint` returns a paint
with the alpha reset to one. Two variants were solid white buttons and I had
looked straight at them in a sixty variant sheet without seeing it. Rule 51.

After both fixes: no unbound fills outside the section frames, no spacing off
the four pixel grid, no clipped text, one overflow in forty five desktop screens
and none in forty six mobile ones, and no contrast failure in a hundred and
eight button variants. The tightest passing figures are the Disabled states at
3.12:1, which WCAG exempts.

### 11f.5 The app bar, and what the buttons are called

Two of the four open items closed.

**M07 carries the real bar.** It had a back chevron sitting in the body, which
worked but was the only sub screen not using the `App bar` component. The bar
costs 56 pixels and the screen had 16, so the cash line went with it: how much
you have belongs to the step that asks for an amount, not the step that asks
who. Content now ends at 736 with the rail at 748.

Six other bars were carrying stale titles from whatever screen they were cloned
from. History and Receipt both said `Activity`; Invest, Invest review, Invest
bought and Sell all said `Apple`. Fixed.

**The button names stop lying.** The two vocabularies had crossed:

| The app said | It actually was | Figma calls it |
|---|---|---|
| `btn-filled` | inverse fill, dark label | Primary |
| `btn-quiet` | control fill, ink label | **Secondary** |
| `btn-danger` | control fill, warning label | nothing |
| — | transparent, ink label | Quiet |
| — | sand fill | Inverse |

Counting the instances settled which way to move. Figma's Primary has 71 uses,
Secondary 47, Quiet 21, Inverse 2 — and **Destructive has none at all**. It was
drawn and never used. Meanwhile the app's `btn-danger` was a real, used pattern
with no variant to its name: a quiet danger, control fill with a coloured label,
on the two Sign out buttons.

So the file already had the answer and the code had the usage. Destructive in
Figma now is the quiet danger the product actually ships, the app renames to
Figma's five, and both sides mean the same thing by the same word:

| Class | Fill | Label | Uses |
|---|---|---|---|
| `btn-primary` | `--inverse` | `--on-inverse` | 9 files |
| `btn-secondary` | `--control` | `--ink` | 10 files |
| `btn-quiet` | none | `--ink` | the empty state action |
| `btn-destructive` | `--control` | `--negative` | Sign out, and closing an account |
| `btn-inverse` | `--sand` | `--ink` | Figma only, on `03 Onboarding` |

Two variants had no use anywhere and now have one. `btn-quiet` took the empty
state's action, because a second filled grey on a grey card is one surface too
many. `btn-destructive` took `Email us to close it`, which is the commit point
of the close account flow and had been wearing the primary button all along.

`--sand` and `--sand-hover` are new, and `surface/sand-hover` is new in Figma.
The Inverse hover had been the last overlay paint in the set, which is exactly
the shape of the fault in rule 51, so it is a flat token on both sides now and
there is no overlay left to lose its alpha.

`scripts/states.mjs` grew a parity check: it builds each of the five classes in
the page and compares the computed fill and label against the value the Figma
variant resolves to in dark. Twenty one checks, no failures.

### 11f.6 The pill that was not broken

The rendered variant sheet showed two black pills with no label, in a set where
every other cell reads fine. They are `Destructive/Large/Disabled` and
`Destructive/Medium/Disabled`: `surface/sunken` at `#161619`, which is 1.28:1
against the `#0a0a0c` canvas, with `ink/subtle` text at 3.12:1. Nothing is
wrong with them. At sheet scale a legitimately dim state reads as a hole.

Rule 48 said an audit is code and code has bugs. This is the other direction:
the audit was right twice and the eye was wrong. Both checks — structure and
contrast — passed on those cells before and after.

That reading did expose a real fault, now fixed. See 11f.7.

### 11f.7 Disabled keeps its own colour

Figma painted Disabled as `surface/sunken` with `ink/subtle` text. Every card in
the main column is also `surface/sunken`, so a disabled button sitting in one
was the same colour as the card it sat on: 1.00 to 1, no shape at all. That is
what made two cells in the variant sheet look like holes.

The app had it right. A disabled button keeps its own colour and loses its
weight, at `opacity: 0.4`. Ten Button variants and the Text field now do the
same, which also puts them in step with Icon button, which was already 0.4. One
number governs disabled everywhere.

What it buys, measured against a `surface/sunken` card:

| Variant | Was | Now |
|---|---|---|
| Primary | 1.00 | **3.12** |
| Inverse | 1.00 | **1.36** |
| Secondary | 1.00 | 1.10 |
| Destructive | 1.00 | 1.10 |
| Quiet | 1.00 | 1.00, and correctly so |

Primary is the clear win. Secondary and Destructive stay subtle because the gap
between `surface/control` and `surface/sunken` is small to begin with: an
*enabled* Secondary on a sunken card is only 1.29 to 1. Their shape was never
the signal. Their label is, and it drops from 10.1 to 1 down to 2.9 to 1 when
disabled, which is unmistakable. Quiet has no fill when it is enabled either,
so having none when disabled is right.

`scripts/states.mjs` now asserts the rule rather than the colour: a disabled
button keeps its variant's fill, carries `opacity: 0.4`, and is never repainted
to `--sunken`. Twenty five checks, no failures.

### 11f.8 Deploying it

The product is in `app/`, which is not where a host looks by default. The
repository now answers both ways an import can be pointed, because guessing
which one was chosen is not a plan:

| Root Directory | Reads | Builds |
|---|---|---|
| repository root | `vercel.json` | `cd app && npm run build` into `app/dist` |
| `app` | `app/vercel.json` | Vite detected, `dist` |

A root `package.json` exists so detection has something to read, and its
scripts delegate to `app/`. Four things were wrong or missing and are fixed.

**Nothing at the root to detect.** No `package.json`, so an import pointing at
the repository root found no project. There is one now, with `engines` naming
the Node floor.

**Playwright.** It is a dev dependency and its install hook downloads about
four hundred megabytes of browsers. Vercel installs dev dependencies by
default, so every build would have paid for browsers it will never open. Both
install commands now set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.

The first attempt at that was an `.npmrc` carrying
`playwright_skip_browser_download=1`, on the theory that npm exposes config
keys to install scripts as `npm_config_*`. npm does set it, and
`npm config get` reads it back, but Playwright never looks: the only reference
in `playwright-core` is `getAsBooleanFromENV("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD")`.
The file would have sat there looking like protection and provided none. It was
deleted and the flag put where it is actually read.

**A relative asset base under a catch-all rewrite.** `vite.config.ts` had
`base: './'`. Both configs rewrite every path to `index.html` so a link typed
without a hash still lands on the app, and that combination breaks: a request
for `/market/aapl` serves `index.html`, whose `./assets/index.js` resolves
against `/market/` and 404s. The base is `/` now.

**No rewrite when the root is `app`.** Vercel reads the config inside the root
directory, so a root-level `vercel.json` is invisible to that setup. `app/`
carries its own.

Checked by building both ways from a clean copy, then serving `dist` behind a
server that does what Vercel does, static file if it exists and `index.html`
otherwise. `/`, `/wallet`, `/market/aapl`, `/grow/borrow` and `/a/b/c` all boot
the app with no failed requests; the last three would have lost their assets
under the old base. `node_modules` comes to 63MB either way, so no browsers.

### 11f.9 Made live

Two things were wrong, and then the product went a step past the drawing.

**Send and Receive were screens, and Figma draws them as dialogs.** `D09` and
`D12` are `sidebar, content, scrim, modal`: a 480 wide dialog over the wallet.
The app had built both as full screens with a second column. Every other
composer is a screen in Figma too, so those were already right; only these two
disagreed, which is what showed up as modals opening full width.

The phone already did the right thing, so the fix was to let the composer
choose its presentation rather than assume. `present: 'modal'` puts it over its
base at any width; the phone keeps its grabber and keypad, the dialog gets the
callout and the keyboard it already has. One `modalOver` helper now serves the
composer, Receive, and anything else addressed by a path rather than a
`?sheet=`.

Building it surfaced a smaller fault: the dialog named the recipient in a `TO`
row and then again in the summary. The same fact twice in one dialog reads as a
mistake, so the summary row went. Changing who it goes to opens the same list
the phone shows as a screen, from one `peopleRows` rather than two copies.

**Every control was clicked, and the dead ones found.** A pass drove 14 routes,
clicked every button, link, chip and row, and reported anything that moved
nothing. Thirty two came back. Most were honest: clicking Home while on Home
should do nothing, and the composer quick chips write to an input value rather
than to the DOM, so the detector could not see them working. Two were real.

The portfolio chart's ranges did nothing at all. `1D` through `ALL` were six
chips with a hardcoded `aria-pressed` on `1Y` and one fixed series of 72
columns behind them. Each range now has its own column count, its own axis and
its own change, and the pressed chip follows.

The first version read the change off the drawn line, endpoint to endpoint,
which with noise reported `+51.6%` over a month. A stated figure replaced it,
anchored to the numbers already on the screen: `1D` is the `+1.16%` in the
hero, `1Y` is the `+17.28%` in Available.

And two status pills were `span`s wearing `.chip`, so they took the hover and
looked pressable. They are `.pill` now, which has no hover and no pointer.

**Things the drawing has and the code did not.** Figma `D01` carries a bell in
the header. There was none in the app, so there is now: an unread count on the
badge, a panel that marks one read as you open it, mark all read, and a badge
that disappears when it hits zero. Five notifications seeded across money,
trades, Grow and security.

History gained sortable columns. Ordering goes in the address like everything
else here, so `?sort=amt&dir=asc` can be linked and survives a reload, and the
caret shows which axis you are on. It has twenty rows to sort now rather than
twelve. Only the activity feed grew: cash, holdings, what is owed and the
borrow limit are settled figures and were left alone.

**Still missing on the Figma side.** `Sell` had no desktop frame at all, though
the phone has `M20`. It does now, `D17c Sell`, cloned from Invest with its copy
turned from buying to selling. Export, the support answer and the contact sheet
are still code-only.

`scripts/live.mjs` drives all of it: both dialogs at 480 over the wallet and
closing to it, the phone sheet keeping its grabber and keypad, Change picking a
new recipient, three ranges drawing different columns with the pressed chip
following, the notification count going down as you read and clearing on mark
all, and sorting reordering, landing in the url and surviving a reload. Sixteen
checks, no failures.

### 11f.10 The three sheets that were only ever code

Export, the support answer and Email us existed in `sheets.ts` and nowhere in
the file. Drawn now, each over the screen it opens from:

| Frame | Over | Holds |
|---|---|---|
| `D02b Export` | History | rows, format, what it covers, where it goes, then Email me the file |
| `D08a Answer` | Support | the question as the title, the answer, and Still stuck, email us |
| `D08b Email us` | Support | address, reply time, hours, urgent, then Open my email app |

All three were cloned from `D02a Receipt`, which already had the shape: a head,
a panel of label and value cells, a callout and a button. Answer keeps only the
head, a paragraph and a button, because that is all the code has.

Two things went wrong, and both were worth the trouble.

`D08 Support` is a horizontal auto layout, so appending a scrim to a copy of it
put the scrim *beside* the sidebar rather than over the page. Both overlays
need `layoutPositioning = 'ABSOLUTE'`, which is how Receipt holds its own.

Then every one of them rendered as a black rectangle with a dialog on it. The
scrim's paint carries `surface/scrim` at `opacity: 0.54`, and the clone arrived
at `1`. This is rule 51 again from a different direction: it was
`setBoundVariableForPaint` that dropped an alpha last time, and `clone()` this
time. A sweep over every scrim on the page put the alpha back on four of them,
and the fourth was `D07c Recovery phrase shown`, which had been sitting wrong
since before this pass and which nobody had noticed.

The Answer button also came through as Primary when the code calls it
`btn-secondary`, so it is control fill and ink label now.

The four new frames, `D17c Sell` included, pass the usual checks: no unbound
fills, nothing off the four pixel grid, nothing clipped, no dialog past its
frame.

### 11f.11 A column, and four ways to move

**The middle was stretching.** The desktop screens are drawn in a 1200 column,
but `.content` had no cap, so it grew with the monitor. At 2560 the side card
on Convert reached 1780 pixels beside a left card fixed at 456. `--content-max`
is 1200 now and the column is centred, so 1440, 2000 and 2560 all render the
screen the file draws.

**Then three ways to get somewhere**, all reading one registry in
`destinations.ts`. Navigators that disagree are worse than one, so they share a
source rather than each keeping a list:

| | What it does |
|---|---|
| Breadcrumbs | `Wallet › Convert to naira` above the title, each step clickable |
| Jump to | ⌘K on a desktop, the magnifier on a phone |
| Everything | `/all`, every destination grouped by place |

A fourth was built and then taken out again. See 11f.13.

The overlay is the one worth describing. It is not a route list: it searches
what she has as well as where she can go. Typing `borr` finds Borrow and Repay,
`adaeze` finds the person and offers to pay her, `nvidia` finds what she holds,
and `TKN-8F2K90` opens that receipt. Arrows move, Enter opens, Escape closes.

`/map` was a developer's index of addresses and is gone. `/all` replaces it as
the product's own, built from the registry, so a screen cannot be listed and
unreachable, or reachable and unlisted.

### 11f.12 What the audits caught this time

Three things, and the third was the interesting one.

**The sidebar was lighting the wrong row on thirteen desktop screens.** Every
Wallet family screen — Send, Receive, Add money, Convert, their reviews and
outcomes, Your banks — showed Home as the current place. A sweep set each to
the place it belongs to. One lit row that matches the screen is rule 45's
neighbour, and nothing had been checking it since the screens were first drawn.

**The scrim lost its alpha again**, on the clone into `D20 Jump to`. Third time,
same call. The sweep is now part of cloning rather than a reaction to a black
rectangle.

**And the contrast pass looked like it had found something system wide.** Six
labels in the new components sat at 3.12:1, all painted `ink/subtle`, and the
obvious reading was that every small caps heading in the product had the same
fault. Counting first said otherwise: those six were the only `ink/subtle`
texts on the whole desktop page, and all six were mine. The rest of the file
uses `ink/muted` at 7.46:1. Nothing system wide, six new mistakes. They are
`ink/muted` now, and the current breadcrumb is `ink/strong`, which is both
legible and the right emphasis for where you are.

Sixty nine spacing values in the new components were off the four pixel grid,
because I wrote the CSS first and copied its numbers. Both sides are on the
grid now: tabs at 12 and 16, the palette field at 20, its rows at 12.

### 11f.13 The tabs came out again

A row of tabs under the page header, listing the screens inside a place, was
the fourth navigator. It is gone.

It was a second navigation layer for destinations the sidebar already carries.
On Wallet the sidebar lit **Wallet** and then the row's first tab was also
**Wallet**, so the same word appeared twice, eight pixels apart, in two
different visual languages. On a phone it was worse: the rail already holds the
places, and the row repeated them in a strip that had to scroll.

It looked fine in isolation, which is how it got built and audited and drawn
into two Figma pages before anybody said anything. Measuring it never caught it,
because there was nothing wrong with it as a component: the contrast passed, the
spacing landed on the grid, it scrolled rather than overflowed. What was wrong
was that it should not have existed.

Removed from the app, from `06 Desktop`, from `07 Mobile`, and the `Place tabs`
component deleted from `02 Components` after checking nothing still pointed at
it. The registry keeps its flag, renamed from `tab` to `primary`, because it is
still the honest answer to "what should the palette list before anyone types".

The three that remain do not overlap. The sidebar and the rail hold the places.
The trail shows depth the sidebar cannot: `Market › Apple › Invest in Apple` is
three levels the six-item rail has no way to express. The palette is the fast
path. The index is the whole map, for when you do not know the name of the
thing you want.

Rule 52 comes out of this.

### 11f.14 Still open

- The nav component's variants are still named `Money` and `Stocks` from the
  older product. They light the right icons; renaming breaks twenty nine
  instances on `04 App`.
- `M36 Account` is the one screen behind More without an `App bar`, where
  Security and Support have one. Account is a place in the app's model and the
  rail is the way back, so it may be right; History has a bar and is also a
  place, so the tier is not applied consistently either way.
- Grow's rate, collateral ratio and payout schedule are still invented. See
  11b.4f.

### 11f.15 Hover, at three strengths and behind a pointer check

Hover was the state the product had never really answered with. Twenty rules
scattered down `components.css`, every one of them instant, several too faint
to find, and all of them live on a phone — where `:hover` latches after a tap,
so the row you just left stays lit while the next screen draws.

They live in one section now, behind `@media (hover: hover) and (pointer:
fine)`, at three strengths and nothing in between:

- **step** — a control moves to the next surface it already owns.
- **wash** — a row or a card takes the rung above the card it sits in.
- **lift** — a filled button or a card brightens and rises.

The transitions are one curve and one duration, 110ms on
`cubic-bezier(0.2, 0.8, 0.2, 1)`, listed by selector rather than applied with
a wildcard: a transition on everything catches layout properties too, and a
card that eases its own width is a card that lags.

Two things needed their own answer:

- A **table row** is the widest hover in the product and it was the faintest.
  `rgba(255,255,255,0.03)` over a card is about two steps of lightness, under
  what an eye finds unless it is told to look. It now takes `--sunken-hover`,
  the same rung every other row takes, and the disc at the head of the row
  goes with it so the row reads as one object rather than a stripe passing
  behind one.
- **Cards that are links** had no hover at all. The three gateway tiles on
  Home are 300 tall, navigate, and answered with nothing.

`scripts/hover.mjs` probes eighteen targets in a real browser and reports, for
each, the surface at rest, the surface under the pointer, the L\* step between
them, whether the thing moves or lifts, and the contrast of the text on the
hovered ground. All eighteen answer. It also checks the two things that are
easy to claim and hard to see: a tap on a touch context leaves nothing lit,
and `prefers-reduced-motion` keeps the colour while dropping the travel.

### 11f.16 The label rung was under AA the whole time

The row wash exposed something that had nothing to do with hover.

`--subtle` was `#65656c`, which is **3.1:1** on a card. Every eyebrow in the
product is 11px caps in `--subtle` — around thirty of them — so that was the
whole label rung sitting under AA, and the new wash pushed it to 2.8:1 on a
hovered row. Raised to `#8e8e95`, which clears 4.5:1 on `--canvas`,
`--surface`, `--sunken` and `--sunken-hover` alike, and stays a visible rung
below `--muted` (ΔL\* 9).

The sort caret was faded to `opacity: 0.45` on top of that — a 10px glyph at
**2.1:1** carrying which way the sort runs. It follows the label it belongs to
now, and turns `--positive` when the column is on.

`scripts/contrast.mjs` walks every rendered text node across ten routes, at
rest and with a row hovered, compositing alpha and inherited opacity the way a
screen does. It reports zero below AA.

53. **A state can expose a fault that was never about that state.** Nothing
    was wrong with hover here. Raising the row wash by three steps of
    lightness simply moved a label that had always been under AA far enough
    under it to notice.

### 11f.17 The market table had no gutters

Seven columns of company data, and `.table td` set `padding: 12px 0` — the
sides were nothing but the slack the browser had left over. At two or three
columns there was slack. At seven there was none, so a price ran straight into
the day's move: `+1.2%$164`.

`th + th, td + td { padding-left: 20px }` fixes the structure. Right-alignment
moved off `:last-child` and onto a `.right` class the column declares, so a
right-hand column in the middle of the row aligns too, and the sort caret sits
left of the label on those — which is what puts the label's right edge over
the numbers under it.

The table also stopped sharing its width. Seven columns cannot live in 730px
beside a side column; it takes the full 1008 now, and the watchlist, the
movers and the picks line up in a three-up row underneath.

### 11f.18 The dot fields, and the column the file could not agree on

Comparing D01c Home — gateway against what the app rendered turned up most of
a screen missing.

**The dot fields.** Each gateway tile carries one: a 12px grid of circles from
2 to 11 across, in three greys and a scatter of five violet. They are composed,
not generated — a formula that came close would still be a different picture —
so `src/components/art.ts` holds all three cell for cell, 677 dots, as two
strings per tile: diameters in base 36, tones as one letter each. Drawn as a
single SVG, because three tiles of divs is a thousand nodes for a decoration,
and clipped to the bottom edge exactly as the Figma frames clip them.

**The tiles.** 400 / 288 / 288 with 16 between, which is 1008 exactly. 300
tall, 28 of padding, 20 of radius. The wide one carries a gradient — sunken
for the first 42%, then the brand green at the bottom edge under the dots —
and a filled pill; the other two are the same words unfilled, which is what
stops three buttons competing.

Stated flex bases, not `flex: 400 1 0`. Under `box-sizing: border-box` a
`flex-basis` of 0 cannot go below the padding, so 56px floors each base and
the growth shares out over what is left. That came out 387/294/294.

**The column.** The file disagreed with itself: D01c and D19 sat at 96 down
each side for a 1008 column, the other 46 at 32 for 1136, and the app had
followed first the 46 and then the 2. All three are at 96 now. Sixteen
children were pinned to a fixed 1128 or 1136 and would have hung over the new
edge; they are FILL like the other 97, and all 116 measure 1008.

The vertical stays at 24. 72 read well on a short screen but pushed 25 of the
48 past the bottom of their own frame, and the note was about the sides —
content in the middle being stretched — not the top.

54. **Two screens drawn after a note are not the file agreeing with the note.**
    D01c and D19 carried the higher margin for weeks while 46 screens carried
    the old one, and nothing flagged it, because every screen was internally
    consistent. Consistency within a frame says nothing about consistency
    across them; only a sweep that counts does.

### 11f.20 One chart, and the card that was actually broken

The note was "this graph across the product is bad, it is not robust enough,
plus it has responsive issues". Two of those three were true of the chart. The
third was not the chart at all.

**The comb.** Home, the stock page and the wallet each drew their own bar
strip: a fixed count of `<div>`s, no axis, no hover, no way to read a value
off it. They are one component now, `components/chart.ts`, and every caller
passes the same `ChartSpec`.

**How many bars.** The count follows the width rather than the caller. A bar
is unreadable under 5px and uninteresting under twelve of them, so the width
decides, between 12 and 90 — and the gaps are part of the arithmetic. The
first version divided the width by the bar width alone and the bars collapsed
to nothing: n bars carry n−1 gaps, so it is `floor((w + GAP) / (MIN_BAR +
GAP))`. A `ResizeObserver` redraws on width change, guarded, because not every
browser the preview runs in has one.

**The baseline.** Asked whether to keep a zero baseline or zoom to the range,
the answer was zoom. This portfolio never went near zero and a zero baseline
squeezes a year of movement into the top fifth of the card. The lowest axis
label is the series low, stated, so the shape can never be misread as growth
from nothing.

**The responsive fault.** It was not the chart. The stock page put a hard
360px `.col-side` next to a main column inside 96px of page padding; at a 900
viewport the main column came out **88 pixels wide** and the chart inside it
had nothing to draw on. Two rules fix it for every page, not just this one:
`.row:has(> .col-side)` stacks below 1240, and `--content-pad-x` steps 96 → 48
below 1280.

55. **The component that looks broken is not always the one that is.** A chart
    88px wide is a layout fault wearing a chart's clothes. Measuring the
    element before rewriting it would have found the parent in a minute.

### 11f.21 Simple by default, and preferences that keep

Home opens on the gateway now, not the detailed dashboard — the simple screen
is the one a new arrival can read.

Which one it opens on is a setting, and the settings live in Account rather
than in a screen of their own: a Settings tab nobody visits is a tab. `Prefs`
holds the default home screen, the theme, whether naira sits beside dollars,
the amount a trade starts at, the figure above which the product asks again,
and four notification switches. `state.prefs` replaced a scatter of top-level
flags.

They persist — `localStorage`, one key, `{ prefs, seenIntro }` only, merged
over the defaults so a stored file from an older shape still loads, and the
whole thing in a try/catch because a browser with storage disabled should lose
the preference, not the product.

Each one had to actually do something, which is the part that is easy to skip:
the naira aside disappears from every screen that shows one but stays on
Convert, because on Convert the naira *is* the subject; turning off a
notification class removes those rows from the panel and drops the bell count;
the ask-again figure puts a tick above the confirm button and disables it
until it is ticked.

### 11f.22 The bucket

Picking one company, paying, then picking the next is three payments and three
fees. The bucket collects them: an "Add to bucket" beside every Buy, a count
in the top bar, a screen that lists what is in it with the amounts editable in
place, and one payment at the end that charges one fee for the lot.

`setBucketAmount` deliberately does not broadcast a change. Re-rendering the
route from a focused input's handler throws `NotFoundError: Failed to execute
'replaceChildren'` — the node the browser is holding a caret in is gone — so
the row updates its own summary and leaves the rest of the screen alone.

Over the balance it says how much short, and offers the fix as an amount:
"Add $98,069.25 to cover this" rather than a disabled button and no reason.

### 11f.23 An intro that teaches the one thing the product is for

Four full-screen steps before the first Home, gated on `seenIntro` alone:
naira in and dollars held, the market never closes, pick as you go and pay
once, and then the thing it taught — a button into Invest. Skip lands on Home
and does not come back; Account can bring it back.

A deep link is not a new arrival. Arriving at `/invest/aapl` with the intro
unseen goes to `/invest/aapl`; the intro is for someone who opened the
product, not for someone who was sent somewhere in it.

### 11f.24 What the devs call it

Five screenshots of the marketing site, and the instruction to keep our look
and feel but take their plans. Four decisions came out of it.

**The fee.** Theirs: 0.5% a trade, nothing on the currency conversion. Ours
now says exactly that, everywhere the money moves — the composer, the review
sheet, the ledger. A buy charges amount + fee; a sell takes the fee out of the
proceeds; "All" leaves room for the fee rather than offering a figure the
account cannot pay.

**The names.** Market → Invest, Wallet → Transfer for the movement screens,
Earn/Borrow under Grow. Their words, since they are the words the product will
be sold in.

**Earn and Borrow stay working.** The marketing lists them; leaving them as
pictures would be the one thing a demo cannot survive.

**Unverified is the starting state**, which is 11f.25.

### 11f.25 Verification, and limits that bite

An account starts unverified with a $1,000 monthly and $250 single-payment
ceiling; verified lifts those to $10,000 and $2,500. The ceilings are one
function, `movementCeiling()`, and every screen that moves money asks it — so
there is no screen where the limit is a sentence rather than a rule.

The message names which ceiling stopped you, which is the part that matters:
"Your single payment limit until you verify is $250.00" is a different problem
from "What this holding is worth is $5,248.42", and a composer that clamps
without saying which is a composer that appears to have lost your money.

Four steps: what is needed and why, the number, the details already on file,
and an end that says what changed rather than "submitted". Eleven digits or it
is refused where it was typed — and silent while the field is still empty,
because nagging someone who has not finished typing is not validation. Only
the last four digits are echoed back. Step one warns about the thing scammers
ask for.

Buying counts against the month too. A limit that only transfers can fill is
not a limit.

### 11f.26 A fund is not a company

VOO and QQQ were listed as companies. They are funds, and the difference is
the whole risk conversation: one holds 500 companies, the other 100, and
neither is a business you can form a view about.

`Instrument` carries a `kind` now. The list says "10 companies · 2 ETFs" and
tags only the funds; the column is Name, not Company; a fund's own page says
so, and its buy screen says what a fund is before the money moves rather than
after.

The long version is a screen — `/disclosures` — covering what you actually
own, that you get no votes, custodian risk, that funds are not companies, the
currency risk, what it costs, who is eligible and where to complain. Account
links to it and the market states it once at the foot. Risk belongs where the
decision is, not in a drawer.

### 11f.27 What a token screen owes a trader

Jupiter's token pages, offered as "extremely detailed", and the question of
what to copy. Five things, and none of them is a visual.

**The gap to the real share.** A tokenised AAPL is not AAPL, and the number
that says how far apart they are is the number that decides whether the price
on screen is a good one. It is on the stock page under the price, in the
market table as its own sortable column, and in the buy review beside the fee.
The twelve marks are computed from our own prices — `mark = price / (1 −
offset/100)` — because lifting Jupiter's absolute figures put an AAPL mark of
$320 against our $224.

**Four windows, not one.** 5m, 1h, 6h, 24h across the top of the price. One
percentage cannot tell a fresh move from a trend.

**The book.** Liquidity, 24h volume, holders and their change, and a sentence
that turns the first of those into advice: an order much over 1% of the pool
moves the price against you, so say so before the order.

**The token.** Its address, middle-elided, with a copy button. On a product
sold as tokenised, showing the token is the trust signal.

**Candles.** Bars became candles — wick for the range, body from open to
close — with the four numbers above the plot, the period high and low labelled
on the axis edge, and the real share's price drawn as its own line across the
whole period so the gap is a shape rather than a figure.

The high and the low come off the **wicks only**. The first version folded the
mark into them so its line would stay on screen, and the card then reported
the real share's price as the token's period high — the wrong instrument, in
the one place a trader reads without checking. The scale includes the mark;
the reported extremes do not.

56. **A number that is right for the scale is not thereby right for the label.**
    Two uses, two variables. `scaleLo`/`scaleHi` decide what fits; `lo`/`hi`
    decide what is true.

### 11f.28 What the sweep caught this time

Nine widths, twelve routes, both themes, and the offending element named — as
`scripts/sweep.mjs`, because this had been run by hand four times.

- **The composer was 456px of inline style.** `left.style.width = '456px'`
  cannot be relaxed by a media rule, so at 900 the card beside it was 88px —
  the same failure as 11f.20, in the one place the stacking rule could not
  reach. It is `.col-compose` now, and stacks at 1240 with everything else.
- **A card head could not wrap.** A label and the control beside it, `nowrap`,
  on a narrow card. The control drops to its own line now.
- **The editable value could not wrap either**, for the same reason: another
  inline flex. At 320 an email address and its Change button overflowed by
  3px. `.kv-edit`, wrapping, and the address itself may break.
- **A table has a floor.** Below about 320 the columns stop shrinking, so the
  table scrolls in its own box rather than pushing the document sideways.
- **The timeframe strip cost its own labels their contrast.** 11px caps on
  `--control` measure 4.21:1 dark and 4.26:1 light, and the strip's positive
  figure 4.22:1 in light. On the card's own ground all three clear AA with
  room. A hairline border says "segmented" as well as a fill does.

57. **An inline style is a rule no other rule can answer.** Three of the five
    faults above were a `style.width` or a `style.display: flex` that a media
    query had no way to override. If a value might need to change with the
    width, it belongs in the stylesheet.

### 11f.30 Account was a wall, and Security was a lie

Two problems, and only one of them was the one that got reported.

**Ten cards, twenty-five controls, one screen.** The note was that settings
was too crowded, and it was — but the deeper fault was the form. A card
implies content; a row implies a destination. A settings home wants
destinations, and a row can carry its own value on the right, which answers
most visits without a tap: `Notifications — 3 of 4`, `Security — 4-digit PIN`,
`Payment methods — 2 banks`. Reading ten cards to learn what a row could have
told you is the crowding.

Eight groups now, each its own address under `/account/`. Wide, the list stays
on screen and the panel changes beside it — a run of changes is one click each
instead of two. Narrow, the index and the group are separate screens. The
split is at 1024, which is a second breakpoint (`isSplit`) rather than a reuse
of the phone one: at 900 a 320 rail and a panel still fit, and forcing the
phone pattern there would waste half the width.

**Screen or sheet is not a coin toss.** A group is a place you browse and come
back to, so a group is a screen. A single decision with a commit — change the
PIN, edit one field, add a bank — is a task you finish and dismiss, so it is a
sheet. On a phone those are different gestures, back against dismiss, and
swapping them is what makes a settings screen feel slippery.

**Security was decorative.** `toggleRow()` flipped a local variable and fired
a toast; nothing persisted, and the code said so in a comment on another
function — *"which the Face ID and PIN switches on Security never did."* Every
switch reads and writes `state.security` now, which is kept.

Three more things the split turned up:

- **"Ask again for large payments" existed twice** — a real preference
  (`confirmOver`) and a fake toggle in Security saying the same thing.
- **Verification is not a setting.** It is a task with a payoff, and
  unverified it was the most valuable thing on the screen, third down the side
  column. It is a banner above the list now, and still a row, so the list
  never changes shape.
- **The crypto address is not a setting either.** It is a Receive concern, and
  it was in Account because it had nowhere else to go. Receive already draws
  it; Account no longer does.

58. **The reported symptom and the diagnosis are different documents.**
    "Too crowded" was true and fixable by splitting. It would not have found
    the switches that toasted and forgot, and those were the worse bug — a
    security screen that lies about its own state is worse than no security
    screen.

### 11f.31 Four digits, and what they are for

A PIN that unlocks the app and nothing else is theatre in a money product. It
authorises now: above the ask-again figure the review sheet has no confirm
button at all until four digits arrive.

That also fixes the preference. It was a tickbox, and a tickbox is a thing a
thumb learns to hit without reading — worse, it proves nothing about who is
holding the phone. Four digits do. Buying, selling and sending are all gated:
a sale does not leave the account, but neither does a purchase, and somebody
who set "ask above $500" would not expect $900 of their holding to be
liquidated without being asked.

`components/pinpad.ts` is one component behind three jobs — changing the PIN,
the payment challenge, and the app lock the switch now controls — because a
PIN that looks different in each place is a PIN people stop recognising. It
never echoes a digit: four dots say how far you are without putting the number
on a screen somebody can read over your shoulder. It completes itself on the
fourth digit, since asking for a Continue tap after that is asking twice. And
it takes the hardware keyboard, because a pad you can only click makes a
desktop user reach for the mouse to type four numbers.

**Refusal happens at the moment it is typed, not on save.** Five patterns are
blocked — four of the same, four in a row either way, a repeated pair, and
anything that reads as a year — and each says which one it is rather than
"weak PIN". Being told at the end that the number you confirmed twice was
never allowed is the version people abandon.

**A mismatch goes back to choosing, not round again.** Two entries disagreed
and there is no way to know which was the slip, so the one that gets retyped
is the one that decides the PIN. Confirming again would let a typo in step two
become the PIN.

59. **A confirmation nobody can fail is not a confirmation.** The tickbox
    could be ticked without reading it and by anybody holding the phone. It
    had the shape of a safeguard and none of the function.

### 11f.32 Length beats punctuation

The password rules are a floor and a blocklist, not a composition rule. "Must
contain a capital and a symbol" reliably produces `Password1!` — eleven
characters of nothing, and universally hated. Length is what actually costs an
attacker time, so: ten characters minimum, a blocklist of what people pick
anyway, a check against the person's own name, and a readout that is a
sentence about what would improve this one rather than a coloured bar with a
meaningless word on it.

Two faults the suite found in my own rules:

- The blocklist contained the seeded person's first name, which **shadowed the
  name check** — `chinaza okoro is me` was refused as "one of the passwords
  people pick most", which is both wrong and unhelpful. The name check handles
  names; the blocklist handles passwords.
- The password the product ships with was `lagos harmattan season`, and
  `lagos` is on the blocklist. **We shipped a password we would not let you
  choose.** Changed to one that passes its own rules.

There is a show toggle on both fields, because typing a long password blind on
a phone is the reason people pick short ones. And `Forgotten your password?`
sits under the field on sign-in, where somebody who has just been told their
password is wrong is already looking. It says a link is on its way whether or
not the address is known: "no account with that email" tells a stranger which
of the addresses they are guessing is real.

60. **A rule you exempt your own data from is a rule you do not believe.**
    Seed data goes through the validator like everything else.

### 11f.33 What the suites caught this time

`scripts/settings.mjs` is new — 47 assertions on the index, the eight
addresses, the two redirects, both breakpoints, the PIN and the password. The
sweep grew from twelve routes to nineteen and the contrast run from fourteen
to twenty-three.

- **A crash is not a pass.** My first run counted `FAIL` lines and reported
  `prefs` and `ftue` green; both had died on a `TimeoutError` before reaching
  a single assertion, so there were no FAIL lines to count. Exit codes now.
- **`/settings` has never been a route.** It sat in the contrast list the
  whole time, resolving to the not-found screen, so one of the fourteen routes
  being measured was measuring nothing.
- **Disabled controls were being measured.** The change-password sheet opens
  with Save disabled at 0.4 opacity, which reads 1.45:1 — but WCAG 1.4.3
  exempts inactive components, and the dimness is the product's deliberate
  signal (11f.7). The harness skips them now rather than the product changing
  a settled decision.
- Four suites pointed at addresses that had moved. Each was checked against
  the app before the test was touched: all four were stale assumptions, and
  two of them got wider assertions than they had before rather than a
  find-and-replace on the URL.

### 11f.35 The lock, and what a lock screen may show

The switch was honoured as a setting and enforced by nothing. It enforces now:
above the sign-in gate and before everything the account can see, including
the intro, because the lock is about the device and the intro is about the
product.

**It may show three things: who is signed in, the pad, and the way in.** The
temptation on a lock screen is a greeting with the balance in it, or the
notification count, or the day's move — every one of which hands the contents
of the account to the exact person the lock exists for. The suite asserts the
absence: no figure, no bell, no navigation. It does say whose phone it is,
because unlocking somebody else's account by accident is its own confusion.

**Unlocking lands where you were going.** The address underneath is left
alone, so a deep link that was locked opens on the link rather than dropping
you on Home.

**Where the unlock is kept decides what the lock means.** In memory, and every
reload asks again — accurate to a cold start, unusable in practice.
`localStorage`, and it never asks again, which is not a lock. `sessionStorage`
is the honest middle: the tab closing is the cold start, and a reload of a tab
you never closed is not one.

That only covers a phone that has been switched off, which is not the phone
anybody loses — so two minutes hidden and it asks again. The tab being hidden
is the closest a browser has to a pocket.

**A lock you can only reach by waiting is a lock nobody tests**, so Security
has a Lock now. It is also the button somebody wants when they hand the phone
across a table. It locks in place without touching the address, so unlocking
returns to Security rather than to Home.

61. **A setting that nothing reads is not a feature at half done, it is a
    claim.** The switch said the app would ask for a PIN when it opened. It
    had said that for as long as the switch existed.

### 11f.36 Two ways to be wrong about a lockout

**The recovery button handed out five more guesses.** The locked-out state
first offered "Use my recovery phrase", which cleared the attempt count to
open the phrase sheet — so anybody who pressed it got five fresh tries, and
then five more. The lockout has to cost something. The password is the only
route offered now, and it is a real one: signing in unlocks, and unlocking
resets the count.

**And the count did not survive a reload.** It was deliberately not persisted,
on the reasoning that a lockout with no server to clear it is a lockout a
person cannot escape. That reasoning stopped being true the moment the
password route existed. It is kept now, so a reload does not buy five more
guesses either.

The suite reported the second of these as a failure I nearly accepted: its own
`addInitScript` re-seeded storage on every navigation, including the reload
under test, so it was wiping the count it was checking. The app was right and
the harness was lying. Seeding once through the page rather than on every init
is what separated them.

62. **When a test and the code disagree, one of them is wrong and it is worth
    a minute to find out which.** Four times this session it was the test.
    Twice it was the code. Guessing would have been right about two thirds of
    the time and wrong in both directions.

### 11f.37 A pad that has to be focused looks like a form

The dots had a focus ring, because the pad was a `tabindex` div that focused
itself on mount so a desktop user could type. On the lock screen — where the
pad is the only thing on the page — that ring turned four dots into what read
as a text input, before anybody had touched a key.

Typing goes through the document now. No focus, no ring, no autofocus, and the
keyboard still works: the listener ignores events whose target is an input, a
textarea or anything contenteditable, so the password sheet's fields keep
their own digits. It drops itself the moment its pad leaves the document,
because this app replaces a screen wholesale rather than unmounting it and a
listener per render would pile up.

**And a grid column sized to `auto` takes its item's max-content width.** The
lock card is `width: 400px; max-width: 100%` inside `display: grid;
place-items: center` — and `100%` resolved against the 400px column the card
had itself created, constraining nothing. It hung 30px off a 390 screen.
`grid-template-columns: minmax(0, 1fr)` fixes it. `.auth` has carried the
identical bug since it was written, at 480px, and had never been caught
because the sweep did not include the sign-in screens. It does now.

63. **`max-width: 100%` is a promise about the parent, and an auto grid track
    is not a parent that keeps promises.** It sizes itself to the child.

### 11f.38 Still open

- The nav component's variants are still named `Money` and `Stocks` from the
  older product. Renaming breaks 29 instances on `04 App`.
- Grow's rate, collateral ratio and payout schedule remain invented.
- `.btn-inverse` exists in the stylesheet and as a Figma variant but has no
  instance in the app — the sand button belongs to a hero the product has not
  built yet.
- D04 Market and D18 Wallet now carry the new table and hero, but the rest of
  each screen is still the older composition.
- The Figma file still draws the old bar comb on D01 and D05, and does not
  carry the candles, the timeframe strip, the depth card, the bucket, the
  intro, the verification flow or the disclosures screen. The app is ahead of
  the file by nine sections.
- Two things from the marketing reference have never been ruled on: their
  phone lists cash as a row inside the holdings list, one "everything you own"
  list rather than our Wallet/positions split; and their down-moves are red
  where ours are amber.
- The PIN and the password are held in the clear, because there is no server.
  A real one sends the password and never stores it, and keeps the PIN in the
  device's secure enclave. The shapes are the same.
- Figma has none of this: the file still draws Account as the two-column wall
  of cards, and has no PIN pad, no password sheet, no settings rail and no
  lock screen.
- Lock now lives in Security and has no address of its own. A `/lock` route
  would be findable from the palette, but unlocking would land back on
  `/lock`, so it would need to redirect and would lose the screen you came
  from — which the button does not.
- Face ID is a button that succeeds after half a second. WebAuthn would make
  it real and is out of scope for a prototype with no server.

## 11g. An outside pass, and all six tiers of it built

The brief was to come at this the way a design associate brought in to make a
product market-ready would: criticise everything, name what is wrong rather
than what could be nicer, and rank it. The pass produced forty-four numbered
findings across six tiers, ordered by what a person loses if it is not fixed
rather than by how hard it is. All six are built, all forty-four items are
settled, and what follows is what changed.

The tiering rule worth keeping: **tier 0 is not "the important ones", it is the
ones where the product says something untrue.** Everything in it was a screen
stating a number that was wrong, or a control that did not do what it said. A
thing that is merely ugly waits.

### 11g.1 Six things that were wrong, not weak

**A button that shrinks is a height that was a wish.** `.btn` set 56px and was
almost always the last child of a flex column — a sheet, a card, a composer —
and a flex item shrinks along the main axis unless it is told not to. Measured:
the buy sheet's confirm was 30px on a 390 phone, and Send's was 20px and below
the fold on a 1366×768 laptop. Both of them the one control their screen exists
to offer. `flex: none`, and anything that genuinely needs to flex says so after
the rule.

**A composer opened above its own ceiling.** The screen handed it a comfortable
figure — $500 of a share, $300 out to a bank — without knowing what the account
is allowed to move, and an unverified account is allowed $250. So the field
read $500, the receipt priced $500, and the button was dead, with nothing on
screen saying why: the sentence that explains a cap only appeared once you had
touched something. It opens at `min(initial, max)` now and the first paint
carries the reason when the opening figure had to come down. Buy and Withdraw
both said DISABLED on first load for every new account.

That sentence costs about 38px, which pushed the buy sheet past the bottom of a
phone once the button was allowed its real height — so the action stops taking
part in the scroll and sticks to the foot of the sheet. The fit was a
coincidence anyway, one row away from breaking.

**One account, two totals.** Simple showed cash, Earn and holdings under TOTAL
PORTFOLIO. Detailed showed the holdings alone, under no label, with the day's
move and the total gain as literals. The toggle appeared to delete $3,720,
disagreed with itself about the day by $3.50, and the two literals would have
gone on saying +$142.60 and +$1,840.60 however the holdings moved. Detailed
derives all three now, and reads total gain off the range table its own chart
draws from.

**A price was a fact about the browser window.** The series was generated at
whatever bar count the row had room for, so Apple's year high came out $224.50
at 1440, $224.54 at 1280, $224.69 at 1100 and $224.55 on a phone. Reloading
agreed with itself only because the generator is seeded; resizing did not, and
the same person checking the same share on a laptop and then a phone was shown
two different histories. The range is built at a fixed resolution now and
folded into however many candles the width can hold — the buckets partition the
whole series and drop nothing, so both ends, the high and the low come out the
same at every width.

The caption had a second fault in the same sentence: its baseline was `vals[0]`,
which holds closes, so the dollar half measured close-to-now while the
percentage beside it measured open-to-now. With both fixed, Home's all-time
caption and its Total gain agree: +$3,204.16 (+24.6%) in each.

**Home said nothing was waiting on an account that had not verified.** The
standing line was the fixed string "Everything is settled. Nothing needs your
attention." — on an account whose limits were a tenth of what they could be and
for whom Buy and Withdraw were both shut because of it. The line reads state
now, and the task sits on Home in both views. It is not dismissible: it has two
flows shut, and the way to be rid of it is to do it.

Grow had the same shape. The hero was labelled "In Grow" and showed the Earn
balance alone while $380 of borrowing and $8.90 of interest were on the books
and named nowhere on the screen.

**A limit that stops the safer thing.** Sending, adding money, converting out
and buying all answered to the movement ceiling. Drawing on the credit line did
not, so an unverified account could take a $1,150 loan while being stopped from
buying $300 of a share. A drawdown puts money in the wallet that was not there
before, so it crosses the boundary a deposit crosses; it answers to the same
ceiling now. Repaying and moving in and out of Earn stay uncapped, because
those are your own money moving between your own buckets and a limit that
blocked a repayment would hold somebody at 9.4% for the sake of a cap meant to
protect them. The rule is written beside `movementCeiling()` so the next flow
added has somewhere to look.

64. **A ceiling the opening figure ignores is a screen arguing with itself.**
    Three surfaces stated the same transaction at once — the field, the
    receipt and the button — and only the button knew about the cap, so it
    expressed the disagreement as a dead control with no explanation.

65. **A figure that moves with the window is a fact about the window.** Nothing
    about the year high changed between 1100 and 1440; the sampling did. Any
    figure read off generated data has to be read off the same data at every
    size, or it is describing the renderer.

### 11g.2 Money that adds up

Tier 1 was arithmetic and vocabulary: seven places where the figures were
individually defensible and collectively incoherent.

**Money you have and money you could owe do not add up.** The wallet hero drew
cash, Earn and "Could borrow" as three segments of one bar and totalled all
three: "$5,200.00 in total" on an account holding $3,720. A credit limit
rendered as a third kind of balance, same unit, same scale, with a sentence
underneath saying so in words. The bar is what you hold now; borrowing capacity
keeps its place, because it is what turns a balance into buying power, but it
is named as borrowing. Buying power was also printed twice, 60px apart.

**Borrowing is money in that is not yours.** Rule 43 has two cases, green for
money in and neutral for money out, and a drawdown satisfies the first — the
wallet does go up — so $500 borrowed at 9.4% rendered exactly like a $1,500
payday in the list where a person reviews what happened to their money. Three
cases now: it keeps the plus, because the money arrived, and loses the green,
because it is a debt. The test lives next to `signed()` and `amount()` takes
the entry rather than the figure, so a call site cannot decide for itself which
case it is in — which is what rule 43 was about.

**Every cost in money, on the screen where you decide.** The buy composer
quoted the gap to the real share as a bare percentage among dollar figures: the
one cost on the screen that is not a fee, and the only one you could not read
in money. It says both now, "$0.42 · 0.17%", and stays out of the total because
it is inside the price per share rather than a charge on top. Add money and
Withdraw showed no fee row at all, against a pitch that promises "the amount,
the rate, the fee, and exactly what you receive, before you confirm". And the
receipt asserted "Fee: None" on every entry including the trades that charged
half a per cent — the one document a person keeps, wrong about the one thing it
is kept for. The fee is recorded on the movement now rather than recomputed, so
a receipt from last month states the fee that was charged then.

**The gap to the real share was printed three ways.** The stock page put a sign
and a word in one sentence — "−0.17% above $223.72" — which cannot both be
true. The market table printed a bare "−0.17%" in a column of prices, where a
signed percentage reads as a price move: a buyer scanning it saw Apple down and
Nvidia up, when it meant Apple's token costs 0.17% over the real share and
Nvidia's is 0.42% under. The figure loses its sign and the word carries the
direction.

**A what-if that ignored the buy.** Composing $250 of Apple, the "If it moves"
table read 23.42 shares in all three rows — the holding you arrived with. It
projects the position the order would leave now: 24.5356 shares at $250,
23.8662 at $100, moving as the amount moves.

**One quantity, three renderings.** 2.2311 in the receipt, 23.42 in the card
beside it, 23.42 sh in the table under that. Three renderings of one number
read as three kinds of number, which is bad for a product whose whole
proposition is owning a fraction of a share. `shares()` carries the rule: two
decimals always so a column lines up, up to four more when the figure is small
enough to need them. "sh" is gone.

**A ninety-second hold with nothing behind it.** "The rate is held for ninety
seconds once you confirm" had no clock, no expiry and no way to be given a new
one — a sentence about a rate, on the two screens whose whole job is to be
believed about a rate. A quote is a thing with an end now. When it runs out the
confirm button is *replaced* by "Get a new rate" rather than greyed, because a
dead control you can still press is how a stale rate gets spent. A re-quote
steps through a fixed sequence rather than being drawn at random, so a figure
on screen never moves on its own; it moves when you ask.

Two faults surfaced building it. The held branch returned before the PIN gate,
so a withdrawal over the ask-again figure would have gone through without it —
the gate is a shared function now and is rebuilt per quote. And the withdrawal
outcome reported the indicative rate rather than the one it honoured, which is
the exact surprise a hold exists to prevent.

66. **A cost stated as a percentage among dollar figures is the one cost on the
    screen nobody can act on.** Every other line was money. The reader has to
    stop and do arithmetic on precisely the number the product would rather
    they did not look at.

67. **A promise with no mechanism is worse than no promise.** Nothing enforced
    the ninety seconds, so the sentence was load-bearing for trust and carried
    by nothing at all.

### 11g.3 The phone, and the middle of the range

**The floating rail was covering content with a hard edge.** Measured at rest
on a 390×844 phone: a whole Activity row — Nvidia, bought 26 August, −$380.00 —
the borrow rate on Grow, the Dow figure on Invest and the Convert tile's own
call to action. Covered flat, so the page did not look like it carried on
underneath; it looked like it stopped. A fade says it carries on, behind the
pill in the rail's own stacking context, deaf to the pointer. The reserved band
at the foot of the scroll clears the fade as well as the rail.

**Four unlabelled glyphs in a capsule is a memory test**, in a product whose
thesis is teaching somebody their first share. The sidebar has said Home,
Invest, Transfer and Grow in words since the start; the phone, where most of
these people will be, said nothing. Icon over name, and the lit tab is told
apart by its fill rather than by being fatter than its neighbours. Below 400
the rail gives up its side gutters before it gives up a word — 360 is what most
budget Android phones actually are, and "Transfer" is the longest of the four.

**Nothing above the fold on the shopping screen was shoppable.** The first
stock sat about 805px down an 844px screen, under a title, a search field, a
paragraph repeating the title, seven filter chips on three rows, and three
full-width cards for the S&P, the Nasdaq and the Dow. The paragraph goes, the
chips become one scrolling row, the indices become a strip you push sideways,
and both bleed to the edges so a card mid-scroll is not clipped by a gutter it
cannot cross. The first company lands at 464px and four rows fit above the rail
at 390 and at 360.

**One greeting, one search.** Mobile Home said "Good morning, Chinaza" in the
top bar and again as its own title 180px below, and carried two search buttons
40px apart: roughly 200px of the screen with the least of it, spent saying
things twice. And it was the fixed string "Good morning" at every hour of the
day. A product asking to be believed about money should not be visibly wrong
about what time it is.

**Four ways to enter one number is indecision, not generosity.** A field, a
drag-ruler, four quick chips and a keypad, stacked, pushing the confirm off the
bottom. The phone keeps the keypad and the chips, which are the two a thumb
wants; the ruler goes, because at 390 it is sixty-five unlabelled lines with no
range, no unit and no scale. The buy sheet's content came down from 788px to
732. The desktop keeps it, where it is the only way to move the figure without
typing, and its caption now says what it does and where it stops.

**The middle of the device range was designed for neither end.** There was one
breakpoint, at 899, so a 900px window and a 1440px monitor got the same 240px
sidebar and the same 96px gutters. On a 1024×768 iPad that left about 688px of
content: the three doors on Home crushed to slots, "Borrow or Lend" wrapped to
two lines, the dot field cropped to a sliver. Between 900 and 1199 the sidebar
keeps its places and gives up its width — icon over name, the way the phone's
rail now reads — and the gutters come in to 32. Content at 1024 goes from 688px
to 936. The promo card goes at this width rather than shrinking: a heading, a
paragraph and a button squeezed into 72px is an advert nobody can read.

68. **A range with one breakpoint has two designs and pretends to have one.**
    Everything between them is an interpolation nobody looked at. The tablet
    tier was not a new idea; it was the admission that 900 to 1199 existed.

### 11g.4 What it does when it goes wrong

**Nothing in the product knew whether there was a connection.** Every
confirmation wrote to the ledger and reported success, so on a dropped signal —
which on a Lagos commute happens several times a trip — the app would tell
somebody a payment had landed while the phone was holding no signal at all.
That is the worst thing a money app can say.

The browser's own `online` and `offline` events write to state, and the bar
says what still works as well as what does not, because "offline" alone reads
as "the app is broken" when everything you can read is still there. Every
review refuses in place, under the receipt, with the wallet unchanged and the
URL still on the review. And the rate becomes a request: a quote is the one
figure the product cannot know on its own, so it is the honest place to model a
round trip — skeleton rows while it waits, two named reasons if it fails, no
confirm button in that state so there is nothing to press by mistake.
`skeletonList()` had been in the codebase since the start and had never once
been called.

**Every flow in this product succeeded.** No decline, no timeout, no reversal,
and `toast()` carried an `'error'` tone nothing had ever called — so the thing
people actually judge a money app on had never been designed. Two failures now,
both in the one seam every confirmation passes through.

Declined: the sheet stays where it is, the reason is on screen under the
receipt rather than in a toast that has gone by the time you look up, and
nothing is written.

Unanswered is the honest one and the harder one. It may still land, so the
movement is recorded unsettled rather than claimed either way. That turned on a
whole chain the product had built and could never reach: Home's standing line
says "One payment is still settling", the Activity row wears its Pending pill,
the wallet's Still Settling card has something in it for the first time, and
the receipt reads "Still settling. It usually clears within a minute." All of
that UI existed. Nothing could produce the state it was for.

Which movements fail is deterministic, on the cents, the way a payment sandbox
uses a magic value: `.99` declines, `.98` goes unanswered. A prototype that
declines one payment in ten is unusable for a demo and untestable in a suite.
It is in the README so the team can aim at it.

69. **A product where nothing can fail has not designed the half people judge
    it on.** Eleven screens of success and no failure state is not an
    optimistic product, it is an unfinished one — and the giveaway was a whole
    chain of pending UI that no code path could reach.

### 11g.5 Risk where it is taken, and a balance you can cover

**The best writing in the product was two screens from where it mattered.**
`/disclosures` says what a tokenised share actually is, that it is held with a
regulated custodian, that you get the exposure and not the voting rights, what
happens to your money if the custodian or Tokkenly fails, and who to escalate
to. It was reachable from two text links buried in settings. It is now under
the button that takes the risk — buying, selling and borrowing each carry a
quiet line to it beneath the confirm — and under the sign-in and sign-up cards.

Deliberately not on Add money, Withdraw or Send. Those move your own money
between your own accounts and carry none of what that page describes, and noise
is how people learn to skip the ones that matter.

**Balances come off the screen.** People here check their money on buses and in
queues, and a $16,229 figure at 48px is readable from the next seat. One
function decides what is covered, so a balance somebody forgot to wrap is not
one call site away from undoing the whole thing. What is yours goes — the
portfolio, cash, Earn, what you owe, every amount in Activity, and the naira
line under a dollar figure, because covering one and printing the other in
naira covers nothing. What is not yours stays: share prices, index levels, the
rates, the limits. Hiding public figures protects nobody and makes the screen
useless. The switch sits next to the figure it covers as well as in
Preferences, because the moment you want it is the moment somebody sits down
beside you and Account is four taps away. Tooltips and aria-labels are covered
too: a balance read out to a screen reader is still a balance on the screen.

### 11g.6 Two charts, and naira as a currency

**A balance is a line; a share is candles.** Home drew the portfolio as
candlesticks — open, high, low and close, four numbers per period. A savings
balance does not have an intraday range. It has a value, and the four numbers
under the chart were filled with figures that meant nothing about it. It also
made the busiest, most saturated block on Home out of the calmest data in the
product, which is the wrong way round. The portfolio is a line now with a soft
body under it and a mark where the money is; no OHLC row, because there is
nothing honest to put in it. The stock page keeps its candles, because those
four are real facts about a traded thing.

**Naira is a currency, not an ornament.** The audit left this as a product
decision; the call is that for a product whose README opens "Stablecoin and
stocks, for Nigeria", naira is the unit people here think in and dollars are
the thing they bought with it. It was an aside behind a toggle, real on two
screens out of twenty-four, which is localisation done to a product rather than
a product built for a place. Every balance the app states carries it now.

And the rate stops being a fact of nature. It is the one number here a person
cannot check for themselves, so Transfer says what it is and when it was taken:
"₦1,500 to the dollar · indicative, quoted 09:40". A rate with no time and no
name on it is a rumour.

The preference stays, because wanting one currency on screen is a real
preference rather than a default to be argued with — and because the decision
reverses cleanly if it is the wrong one.

70. **A preference is where a decision goes when nobody will make it.** Naira
    was a switch because deciding whether this is a Nigerian product or an
    American one with a Nigerian option is harder than shipping both. Two of
    the twenty-four screens honoured the switch, which is the tell: nobody
    owned it.

### 11g.7 A palette that knows about things, and motion that carries the eye

**The palette did not know the catalogue.** Typing "Microsoft" found nothing
unless you already owned some, which is the wrong way round for the search box
on a shop. Every company and fund is findable now, by ticker, by name or by
what it is — "health" finds Johnson & Johnson — and the ones you hold stay
under Your shares rather than appearing twice. An amount is a thing you can
type as well: "50" offers Send, Add and Withdraw with the figure already in
them.

Only when the *whole* query is an amount. Stripping the digits out of anything
turned the reference TKN-8F2K90 into "Send $8,290.00" — a suggestion nobody
asked for, attached to a number that does not exist. And hits were in source
order, so the destination registry always outranked the company being looked
for; a label that starts with what you typed comes first.

**Motion had one curve and one duration and no choreography.** That discipline
was already right. What was missing is that after a payment the balance simply
became a different number, with nothing connecting the figure you were looking
at to the one you are looking at now. The balance travels now — sending $120
walks the wallet from $2,480.00 through $2,439.54, $2,403.26 and $2,383.83 —
and the portfolio line draws itself, its ground fading up under it with the end
mark arriving last. `pathLength` normalises the stroke so a year and a day take
the same time to draw. Both stop under `prefers-reduced-motion`.

**The first version of that was half broken and the suite half hid it.** The
app rebuilds the whole tree twice in a row, once for the state and once for the
route, and the discarded render was writing the *destination* into the memory
on its way out. Whichever render got a frame first decided the outcome: usually
the survivor read from and to as the same number and painted the answer, so
Home travelled and the wallet jumped. Occasionally it raced the other way and
the wallet travelled for real — which is when `bucket.mjs`, reading
`.hero-figure` a fixed 350ms after a navigation and comparing to within five
cents, failed. One defect, showing up as a missing animation on half the
screens and as an intermittent test failure on the other half.

The memory holds the figure actually on screen now, updated frame by frame, so
a discarded render leaves it where the eye last saw it and the next one carries
on from there. A generation per key stops two runs writing to one key at once.

71. **Motion earns its place by connecting two states, not by decorating one.**
    Everything here already animated; nothing carried anything across a change.
    The cheapest thing in interface design that reads as expensive is also the
    only one a person feels without being able to name it.

### 11g.8 An intro that ends on a choice

The intro made four claims and then handed you an empty market with a button
saying "Buy your first share", which is not a thing the market screen does. A
person finished onboarding having done nothing, holding four claims they had no
way to check, on a screen answering a question they had not asked.

**The last step stops talking.** It offers the three companies the market
already puts forward, each with what the starting amount actually buys of it —
`$50 buys 0.223115 shares` — which is screen one's claim made good on something
you can press. Pressing one puts it in the bucket, ends the intro and lands on
the bucket with the pick in it: one deliberate press from a first purchase,
with the amount and the total in front of you.

**Picking is not buying, and it stays that way.** Onboarding is the worst place
to slide somebody into a financial commitment, so the money decision stays in
the composer where the cost is stated. The screen says nothing is bought until
you say so, and the suite proves it by reading the wallet before and after.

**Screen one stopped quoting the person's balance.** It ended on "You have
$2,480.00 ready to spend." — an account balance, to the cent, told to somebody
who has not added a naira. On a real first run it is either untrue or it is
somebody else's money, and either way it teaches a person that the figures here
are decoration. The claim above it is about a share price, so it says the share
price and what a dollar buys of one, which anybody can go and check.

The pick step drops the dot art and lays the three across the width. The other
steps carry decoration bottom-right and a solid Next; this one is deliberately
unlike them, because it asks rather than tells — and a pressable card floating
on a field of dots reads as ornament, which is the opposite of what these are.

72. **An intro that ends on a slogan ends nowhere.** Four claims and a button
    to a screen that cannot honour it is a carousel, not an onboarding. The
    test of the last step is whether anything is different afterwards.

### 11g.9 What the suites were not testing

**Six suites were driving the lock screen.** The app lock landed and six of the
seven suites that build their own page stopped seeding the unlock, so every
route they visited was the PIN pad. Three failed loudly. The other three did
not, which was worse:

    fit    reported "no sheet" for all nine composers, and passed
    phone  measured overflow on 23 routes, all of them the lock screen
    walk   screenshotted 24 routes, all of them the lock screen

Fixing that surfaced staleness underneath from changes that predate the lock:
`flows` read the wallet's cash from `.t-display-xl`, which the hero stopped
using when it was rewritten; walked the rail by its old names, Wallet, Market
and History; clicked two controls that had moved to their own addresses when
Account became an index; and read the holding from "the first `.kv` in the side
column", which the token card above it turned into Liquidity — an unchanging
number reported twice as the holding, without ever failing.

**Two more were reporting on nothing.** `fit` measured `/send` on the phone,
which is the list of people rather than a composer, so it printed "no sheet"
and checked no fit at all; it measures the sheet one step in now. And `walk`
had no font refusal, so this sandbox's unreachable Google Fonts arrived in its
ERRORS line as if the app had raised them.

**And three were reading a figure while it moved.** `bucket`, `fees` and
`trade` all compared the wallet before and after a movement, sampled a fixed
350ms after a navigation — `trade` to within two cents. `seen.mjs` gained
`settled()`, which polls until the text repeats itself and then takes it.

**Contrast had never been measured on the intro at all.** `seen()` seeds a
returning visitor, which is exactly what skips the intro, so the one part of
the product that puts text on a green gradient was the one part never checked.
The same shape of gap as 11f.37, where the sweep had never covered the sign-in
screens: a suite's seeding decides what it can reach, and what it cannot reach
is invisible rather than reported. Four steps, both themes, and the card under
the pointer: 17 texts on the pick step, nothing below AA.

73. **A gate that reports on a screen nobody asked it about is not a gate.**
    Passing is not evidence. Three suites passed while looking at a PIN pad,
    and the only thing that separated them from the three that failed was
    whether their assertions happened to be satisfiable by the wrong screen.

74. **Reading a figure that moves, at a fixed time, is a coin toss.** It was
    stable only for as long as the animation was broken. Fixing the product
    would have broken three suites; both faults came from the same commit.

### 11g.10 Where the audit was wrong

An audit is a document with claims in it, and it does not get to skip the
check it is applying. Three findings did not survive contact with the code.

**The buy premium was misquoted.** The audit said the gap to the real share was
"about 85¢" on a $250 order and implied it was missing from the total. It is
$0.42, and it is correctly absent from the total: it is embedded in the price
per share rather than added on top, and the total is what leaves the wallet.
What was actually wrong was quoting it as a bare percentage — which is the
finding that survived.

**The palette already searched more than the routes.** The audit said it knew
only the twenty-four destinations. It had searched holdings, people paid and
receipt references since it was written. The real gaps were the catalogue and
amounts.

**The dot art is not generated.** The audit's item 30 assumed a formula and
proposed replacing it with a meaningful one. `art.ts` holds three hand-composed
12px grids lifted cell for cell from Figma 06 Desktop D01c with the accent
cells placed by hand, and the file argues explicitly against generating them.
The item was held back pending a decision, because "make the art mean
something" read as a proposal to redraw artwork somebody made deliberately. It
was built once that decision came, and without generating anything: see
11g.18. The finding was right that the fields carried no information. It was
wrong about the only way to give them some.

75. **The audit is not exempt from the audit.** Two of the three were wrong in
    the direction that made the finding sound worse, which is the direction an
    audit is biased in. Checking the three cost twenty minutes and removed one
    item, corrected another and stopped a third from vandalising a deliberate
    piece of work.

### 11g.11 Tier 4: what the product owed somebody not using a mouse

Contrast was already clean across every route in both themes, which is rare
and was worth protecting. Everything else in this category was absent rather
than wrong, which is why none of it had been caught: the product works
perfectly well if you can see it and are holding a mouse.

**A sheet was a div over a scrim.** It looked modal and behaved like a panel
that happened to be on top: no role, nothing naming it, focus left wherever it
already was, and Tab walking straight out of it. Open Send with a keyboard and
the third Tab reached Convert on the wallet underneath. Both shapes — the
`?sheet=` dialog and the composer that presents as a modal — go through one
function now: `role="dialog"`, `aria-modal`, named by its own heading, focus
moved in on open, Tab and Shift-Tab held inside, and the screen beneath
`inert`, which takes it out of the tab order and the accessibility tree rather
than only deafening it to the pointer.

**Focus cannot go back to what opened it**, and pretending otherwise would
have been the wrong fix. This app replaces the whole tree on every state
change, so the invoking element does not exist by the time the dialog closes.
Focus goes to the content of the screen underneath instead, which is at least
past the seven nav rows a keyboard user has already walked. The same rebuild
is why a dialog takes focus only when it is new or has lost it: focusing on
every mount would drag the caret off whatever was being typed into it — the
same double-render trap that broke the counting balance in 11g.7.

**Every screen offered exactly one heading.** The page title, and then
nothing: heading navigation, which is how a screen reader user skims a page,
gave one rung and stopped. A card's name is an `<h2>` now, which is three to
eleven rungs a screen, and it looks identical because `.t-caps` was always
carrying the type. Two things were actively in the way: the sidebar promo
emitted an `<h3>` before the page's `<h1>` on all sixteen signed-in routes, so
that navigation landed on an advert first; and `outcome()` emitted an empty
`<h2>` on every successful payment, which is a rung to nowhere. The outcome
names itself under the tick instead, which is also what its dialog is now
labelled by.

**There were no live regions at all.** Arriving somewhere said nothing, and
the tab said "Tokkenly" on all twenty-six routes — which makes a browser
history and a row of tabs useless as well as being silent. Both name the
screen now. Every field error appears without a page change — a ceiling, a
shortfall, half an address — and appeared silently, so for somebody who cannot
see the sentence the button simply stopped working with no reason given. They
are built by one helper that makes them a status, rather than by five call
sites that each have to remember.

**A toast took itself away after 2,600ms with no way to hold it.** Unannounced
as well. That is a WCAG 2.2.1 failure on the timing alone and, more plainly,
it is how somebody who reads slowly never finds out what happened to their
money. Announced, held while it is hovered or focused, and dismissible.

**And a skip link, which is a button rather than an anchor.** The customary
`<a href="#main">` cannot work here: the address bar is the router, so a
fragment link navigates to `/main` and lands on the not-found screen. A button
that moves focus does the part of a skip link that actually does the work.

76. **A rebuild is an accessibility problem, not only a rendering one.** Focus
    lives on an element. If the tree is replaced wholesale, focus is a thing
    the app has to put back deliberately, in three places at least: when a
    dialog opens, when one closes, and when the same dialog is redrawn under
    somebody's hands.

### 11g.12 Forty-four pixels, and what a target costs

Eleven kinds of control measured under 44px on a phone across twenty-two
routes: chips at 32, sort headers at 28, the sheet close at 32 square, the
account avatar at 40, small buttons at 40, the amount field at 42, and four
sorts of text link between 16 and 20 tall.

The first attempt tried to get the height for free. The text links got an
invisible hit area — a `::after` reaching 44px out of a 20px link — so no row
would have to grow. Measured, it did not work: a pseudo-element paints in its
parent's place in the order, so the card that followed the link in the
document sat on top of it, and `elementFromPoint` answered "card" over half
the band. Raising it above the card would have fixed the miss and started
taking taps meant for whatever was underneath, which is worse than the thing
being fixed.

So the rows grew. A card header on a phone goes from about 20px to 44. Invest's
first company moved from 464px down the screen to 492, and four companies
still stand above the rail at 390 and at 360.

77. **A target costs what it costs.** You cannot get 44px out of a 20px row
    without taking the difference from somewhere, and taking it from a
    neighbour takes their taps with it. Every way of avoiding that is a way of
    hiding it.

### 11g.13 A candle that is not only a colour

Up and down were encoded in colour alone: mint against amber in the dark
theme, mid-green against a muddy brown in the light one. That pair flattens to
two similar browns with a red-green deficiency, on the one chart in this
product somebody is reading in order to decide what to buy — and amber for
down is not a convention anybody arrives with anyway.

A rise is hollow now and a fall is filled, the way every candlestick chart
ever drawn has done it. The constraint that decided the implementation is the
narrowest bar the row will draw, which is five pixels: a 1px inset ring leaves
three pixels of hole, which reads at 76 candles in both themes. A thicker ring
would have closed it. The latest period keeps its own outer ring, so the two
shadows combine rather than the later rule quietly filling the hollow body
back in.

78. **The second channel has to survive the smallest instance.** Hollow-versus-
    filled is the right answer and would have been a decorative one at 1.5px
    of ring: at the density this chart actually draws, the hollow candle would
    have been a filled candle with a slightly different colour.

### 11g.14 Tier 5: the ones nobody files a bug for

Eight items, individually small and collectively the difference between
nearly-finished and finished.

**One name per thing.** Add money had five surfaces and three names: the
registry, the breadcrumb, the palette and the wallet tile called it Add money;
the screen called itself Buy dollars, the button said Buy, and the review said
"You are buying". The place called Invest was still the Market in two leaves —
an empty bucket offering to send you "to the market", a missing company
offering "back to Market". And Home's third door said "Convert money" and
opened a screen headed "Withdraw to your bank"; its own copy describes both
directions, which is the Transfer place rather than the Withdraw action, so
that is where it goes now.

**Preferences was six settings in five shapes.** Half the rows had a glyph and
half did not, the introduction was a hand-built div rather than a control, and
two chip groups sat identical to each other while one sets a starting amount
and the other decides when the product stops and asks who is holding the
phone. Every row is glyph, label, description, control now, and the two chip
groups tell themselves apart by a bucket and a padlock before the words do.

Two flex faults surfaced doing it, and the first is worth writing down:
`.grow` is `flex: 1 1 auto`, so a label's basis is the width of its longest
sentence. On a wrapping row that pushes the label onto a line of its own and
leaves the glyph sitting alone above it — on exactly the settings whose
description runs past one line, and only those, which is why it looked
arbitrary rather than broken.

**The Settled pill was on all twenty activity rows**, which is a column of
grey rather than a status. It appears only when there is something to say.

**The chart's overlay was inset by nothing**, so it spanned the plot including
the 56px gutter the y-axis labels live in: the real-price line started
underneath them and its tag sat on top of one. "$220" read through a purple
badge on every stock page, in both themes, at every width. Two of the four
things this item listed were already gone — Account's eyebrow stopped
overlapping its title when Account became an index, and the Low label stopped
being under the rail when item 15 gave the rail a fade. Checked rather than
assumed.

79. **A label placed relative to a container is placed relative to its
    padding too.** The overlay was correct about the plot and wrong about the
    gutter, and the gutter is where the labels are.

### 11g.15 The first screen, and what it was not saying

Sign-in was the least designed screen in the product and the first one a
stranger sees: a 480px card alone in the middle of a 1440px canvas, a Google
button wearing an envelope, the seeded person's own address in the email
placeholder, a password field with no way to check what you typed, no error
state, no loading state, and nothing answering the question the screen is
actually asking — why would I give these people my money.

The answer was already written and was two links away. Three statements from
`/disclosures` sit beside the form now, in their own words, with the first line
of the disclosures under them as the counterweight: shares go down as well as
up, nothing here is a savings account. A screen carrying three reassurances and
no risk is an advert.

The form has states. Empty fields are named where they are empty, the button
goes busy, a refusal leaves you on the screen with the reason under the fields,
and offline refuses like every other action. Which sign-in fails is
deterministic — the password `wrong` — the same idea as the cents rule, and in
the README beside it. The password can be looked at, because typing ten
characters you cannot see on a phone keyboard and then being told only that it
was wrong is how somebody resets a password they had right the second time.

The envelope is gone rather than replaced: it said "email" on the one button
that is not email, and drawing somebody else's mark from memory is a worse
answer than drawing none.

80. **Every claim on a sign-in screen should exist somewhere else in the
    product.** One that appears only there is a marketing claim, and a money
    product cannot afford to make its first statement its least accountable.

### 11g.16 Serving our own type, and what that revealed

Two weights of Geist came from `fonts.googleapis.com` with no local copy.
`display=swap` meant nothing ever blocked on it, which is exactly why this
never looked broken — but on the connections this market has, a real share of
sessions rendered the whole product in `ui-sans-serif`. Measured, "$2,480.00"
at 48/600 is 245px in Geist and 192 in the fallback: a quarter narrower, on a
screen where every figure is a number. Those sessions were not seeing a
slightly different font. They were seeing a different design.

Two files, 46KB together, because Google serves Geist as a variable font — one
face covers 400 and 600. Both subsets are kept: latin-ext holds U+20A0–20AB
and the naira sign is U+20A6, so dropping it to save 16KB would take ₦ out of
a product for Nigeria.

Which means every fit and overflow figure in this repository had been measured
in the wrong font. Re-run in the real one: the composer sheets grew — Borrow's
content from 740 to 786, Invest's to 814 — and the button is still on screen on
all nine, which is what the sticky footer from item 02 was for.

81. **A fallback that never blocks is a fallback nobody notices shipping.**
    The failure mode of a webfont is not a blank screen, it is a different
    product rendered to a fraction of your users, and no test will find it
    while the tests are rendering the fallback too.

### 11g.17 Filling a hole with the thing that was missing

Three screens ended halfway down the window with one column trailing the other,
and in two of them the empty space and a missing answer were the same hole.

Transfer listed what was still in flight — usually nothing — and stopped. It
was also the only screen in the product about your cash that never showed what
had happened to it: Home carries a recent list, the wallet did not. Verify sat
under a 192px card with four hundred pixels of nothing below it, and somebody
about to type a national ID number into a phone has three questions, all three
of which were already answered elsewhere in this product.

Add money and Withdraw now carry their recent movements, the way Invest and
Sell already carry their recent orders. The first version filtered on `kind ===
'payment' && amount > 0`, which put "Received Adaeze Okonkwo" under a heading
reading "Money you have added" — a card wrong about the one thing it was for.
And it is not rendered at all when there is nothing in it.

What is not fixed, and is not pretended otherwise: the composer's own two
columns still come out 722 against 336. A tall form beside a short context card
is the shape of that pattern, and the only way to balance it would be to invent
a card — which is the filler this item is about.

82. **Dead space is a symptom; the diagnosis is usually a missing answer.**
    Two of these three screens were short because they were not saying
    something they should have been. The third is short because it is short,
    and the right response to that is to leave it alone.

### 11g.18 The dot fields, keyed to the money they are doors to

The last of the forty-four, and the one held back until it was asked for,
because the audit's answer to it was wrong. It proposed generating the fields
from data. That would have thrown the artwork away: 11f.18 records how these
were made — three 12px grids lifted cell for cell from D01c, 677 dots,
composed rather than computed — and the argument there still stands. A formula
that came close would be a different picture.

**So nothing is generated.** Not one dot moves and not one changes size. The
composition Figma drew is the top of the scale, and the account decides how
much of it is awake. The three doors are the three places money can be, so
together they read as one portfolio spread across three tiles: what is in
shares, what is cash, and what is working in Earn. On the seeded account that
is 77, 15 and 8 per cent, and the three fields look nothing like each other
for the first time.

Two things had to be right for it to be a reading rather than a mood.

**A field keyed straight to its proportion goes dark.** On an account holding
most of its money in one place, two of the three doors would have read as
broken rather than as informative. The value moves the level between a floor
and the whole field, so the quietest door is still a picture.

**A sleeping cell needs a rung of its own.** The first version dimmed each tone
by one step — c to b, b to a — which reads well until you notice that a dim
cell has nowhere to go. Moving $1,000 into Earn changed that tile's level and
not one pixel of it, because the cells being woken were composed dim in the
first place. `--dot-sleep` is a fourth rung nothing else uses, in both themes.

The field stays `aria-hidden` and always will: a dot field is not a thing to
read a figure off. Each tile says its reading in words instead. The sentence is
the reading; the field is the feeling of it.

83. **Data-driven does not have to mean generated.** The choice looked like
    one between a composed picture that means nothing and a computed one that
    means something. It was a false choice: the composition can be the scale
    and the data can be the level, and then the artwork is not competing with
    the information, it is carrying it.

84. **An encoding is only as good as its worst case.** Dimming by one rung
    was a defensible rule that happened to encode nothing on the tile whose
    data moved, and the test that caught it was moving money and looking, not
    reading the code.

### 11g.19 Search that answers while you are typing

Five fields — Invest, Activity, Send, Support and Everything — did nothing
until Enter, and then matched on `includes`. "Micrsoft" found nothing, "aple"
found nothing, and the only way to learn either had happened was to look at an
empty list. The palette behind ⌘K had done this properly since it was written;
the five fields people actually land on had not.

**Two things happen on every keystroke.** The list under the field narrows,
because that list is the answer and watching it shrink is the fastest way to
know the search heard you. And a panel offers the closest matches, including
the ones the narrowing cannot reach: a company you do not hold, a screen, a
person you have not paid, the receipt behind a reference.

**Ranked, in four rungs, and the order between them is the point.** A name that
starts with what you typed beats one that merely contains it, which beats one
your typing could be a garbled version of. The fuzzy rung is a subsequence with
a gap budget — enough for a dropped letter or a transposition, tight enough
that "aeo" does not match every sentence in English, and off entirely under
three characters. A list of near misses says that it is one.

**The address stays the record and typing does not touch it.** A query
parameter per keystroke is a history nobody can walk back through, and a route
change rebuilds this app's whole tree, which takes the focus out of the field
being typed into — the same fault the bucket's amount field hit in 11f.22, for
the same reason. Each screen repaints its own list; Enter commits; a link into
a search still arrives narrowed.

85. **A search box that says nothing between the first keystroke and Enter is
    a search box people assume is broken.** The five fields worked exactly as
    written, and every one of them read as a dead control until the moment it
    suddenly reloaded the page.

86. **Show what matched, not only what was found.** Typing "recovry" on
    Support offered "What happens if I lose my phone", which reads as a wrong
    answer — the word is in the answer, not the question. A row that cannot
    show why it is there is a row that looks like a mistake.

### 11g.20 The gradient as the hover, not one door's decoration

Three doors on Home, one of them already lit: the lead tile carried the green
permanently, so at rest the row read as one live tile and two dead ones. The
hover on top of that was `a.card`'s flat `--sunken-hover`, which painted
straight over the gradient — the wide tile's answer to being pointed at was to
go out.

The gradient is the hover now, on all three. At rest they are the same flat
card; the one under the pointer washes green up from its bottom edge, under the
dots. Buy Stocks keeps its emphasis by being wider and by being the one with a
button on it rather than a link.

The dot fields are untouched — every cell, size and tone as composed, still
keyed to the account. The green is a layer of its own beneath them rather than
the card's background, because a background-image cannot be transitioned
between two values and a green that snaps on reads as a bug.

87. **A permanent version of a state is a state that cannot be entered.** The
    gradient was the product's strongest visual moment and it was spent
    standing still on one tile, which left the hover with nowhere to go and no
    choice but to paint over it.

### 11g.21 Celebrating the choice, not the trade

The ask was confetti — GSAP was named — when a company goes in the bucket and
again when one is bought. Half of that is a bad idea with a paper trail:
Robinhood put confetti on executed trades, a securities regulator's complaint
named it as gamifying investing, and it came out of the product in 2021. This
app tells somebody their first share is not a lottery ticket. It cannot then
throw a party the moment they buy one.

So the celebration moved one step earlier. Adding a company to the bucket is
choosing, not committing: nothing has been paid, nothing can go wrong, and it
is exactly the moment a person is deciding whether this is for them. Fourteen
bits fan up from the button, fall under gravity and fade — 900ms, and nothing
in the page moves. Buying gets the other treatment: the outcome sheet resolves
rather than appears, a wash of colour up to the accent, the tick drawn rather
than stamped, then the figure, the panel and the buttons rising in turn. It
reads as a settling.

No dependency. GSAP is about 70KB for a burst that is thirty lines of canvas
and four keyframes, on a product that has just self-hosted its own typeface to
keep third parties out of it. Both effects sit inside
`prefers-reduced-motion: no-preference`.

Two things the build got wrong on the way. The burst never appeared, because
`addToBucket` broadcasts and every listener rebuilds the whole tree — the
button was detached and its rectangle was zeros by the time `celebrate` ran.
It is called before the action now, at both sites. And the toast that used to
confirm the add landed on top of the new standing bar: three confirmations of
one press. The toast went; the bar is a live region, so the announcement
survived.

88. **Celebrate the decision, not the transaction.** A burst on a completed
    trade tells somebody the outcome was good. Nobody knows that yet, least of
    all the product.

### 11g.22 A receipt worth opening, opened where you are

The old receipt was a list of fields and a button that threw you onto another
screen. It now says what was bought: ticker and name, the one plain line about
the company, the price and the day's move, a year sparkline behind it, then
investment, shares, price each, reference, when, fee, total and what you hold
now. It ends with a way on to the company and to the portfolio, because a
record you cannot act on is a dead end.

And it opens in place. "See the record" used to navigate to `/activity` first
and open the sheet there; it replaces the sheet on whatever screen you were on
now, so a receipt read from a buy on the stock page leaves you on the stock
page — with a link inside it to where the record lives. Home's receipt rows do
the same.

One number was wrong the whole time. Shares were derived from the fee-inclusive
amount, so a $200 buy of Nvidia read 1.6905 shares where 1.6821 were bought.
`grossOf()` lives beside `buy()` and `sell()` now, so the figure a receipt
derives and the figure a trade records cannot drift apart.

89. **A modal opens on the screen you are on.** Navigating first, then opening,
    loses the place the person was and makes the dismiss button a trap door.
    The way to the modal's home screen belongs inside the modal.

### 11g.23 An account that says who you are, once

Opening Personal details on a phone produced three copies of its own title
within 100px: a crumb reading `Account › Personal details`, an `<h1>` reading
Personal details, and a card headed PERSONAL DETAILS. Under them were five rows
of a table. Nothing on the screen said whose account it was.

The trail goes. A trail is for a parent you cannot see — on a wide screen the
settings rail is lit two inches to the left, so it said nothing new; on a phone
its last name was the page title word for word. In its place on the phone is
one step up, carrying the parent's name, at 44px rather than the trail's 37.
`pageHeader` takes `{ crumbs: false }` or `{ back }` and every other screen in
the product keeps its trail, because on those the parent really is off screen.

The group itself is a profile now: the monogram at 64px, the name, where you
stand with us, and how long you have been here. Then the details, then the
three facts that are this product rather than this person — the wallet address
that money reaches you at, the bank payouts land in, and what the account is
allowed to move — each naming the group that owns it rather than repeating its
controls.

Three more copies of one word went with it. "Verified" was in the page header
eyebrow, on the rail row, and on the profile badge at the same time; the badge
and the row are enough, and the date of the check belongs to the group that
owns the check. Unverified, the badge does not appear on a screen where the
amber banner is already saying it at length.

Two things surfaced on the way. `.addr` is a `<button>`, so it had been
centring the token address on every company page while the copy button sat
adrift at its end — the one control on that row nowhere near what it copies.
And the wallet address existed as a literal inside the Receive screen, where
nothing else could reach it; it is a constant beside `LIMITS` now.

90. **A trail is for a parent you cannot see.** Where the parent is on the
    screen — a lit rail, a tab strip — the trail restates it, and the restating
    costs a line at the top of every page.

91. **A control belongs beside the thing it changes.** Stated here because the
    address row broke it in the smallest possible way and nobody noticed for
    eleven screens.

### 11g.24 The switch against the number

The privacy switch lived in two page headers, in a row with search, a view
toggle and the bell — three hundred pixels from the figure it covers, reading
as one more piece of chrome. On Grow it was not on the screen at all, so the
one place a balance is masked by default had no way to uncover it short of four
taps into Preferences.

It sits on the figure's own line now, on the four screens with a headline
balance and nowhere else: Home in both views, Transfer, Grow. (Grow's went
where Grow's headline figure went, when that screen lost its hero: 11g.43.)
Quiet at rest —
a filled circle beside a 40px number is a second thing to look at — and it
takes its surface under the pointer, the way a control should. One per screen,
because it is one setting: a second eye on the same page would suggest two
things to cover.

`prefs.mjs` now covers it, which nothing did before. The test names the figure
as "whatever the switch was paired with", so the pairing cannot be broken
without the test noticing.

92. **A control belongs beside the thing it changes, and only there.** Rule 91
    said this about an address row. It is worth its own number because the
    header is where controls go to be forgotten: near the logo, far from the
    work, in a row of four where none of them is about anything on the page.

### 11g.25 The bell's panel becomes a place

Notifications were a modal. Five announcements floated over whatever screen the
bell happened to be on, dismissed by the same gesture that dismisses a payment
you are halfway through, and reachable from one header — Home's. On a phone
that meant the only route to them was going Home first.

They are a section of Activity now, behind a chip of their own, and the unread
count moved from the bell onto the chip. Beside the money rather than mixed
into it: a notification has no amount and no reference, so a row of it in the
table would mean two empty columns and a sort by amount that cannot order it.
The bell still exists and still carries the count; it navigates rather than
opening a panel. The phone's More list gained a row to them, which it never
had.

Every row now goes to the thing it is about. "Adaeze Okonkwo paid you $120.00"
opens that receipt, in place, on the screen you are already on; the sign-in
notice goes to Security; the interest one goes to Grow. A row that greys out
and does nothing else is a list of things you have already read, which is not
what anybody opens a notification for.

Two nouns nearly collided. The Account group of switches is also called
Notifications, and rule 37 says one noun per thing — but these are two things:
the messages, and the switches that decide which get sent. They are told apart
in the palette by their group and by a hint each ("What we have told you",
"Choose what is worth a buzz") rather than by renaming one of them into
something nobody says out loud.

93. **A modal is for a task, not for a list.** A panel that only shows things
    has no commit, nothing to cancel, and no reason to take the screen — and
    being a panel, it can only be reached from wherever somebody thought to put
    the button.

### 11g.26 Composing is a screen, committing is a dialog

Eight ways of moving money, and two of them were dialogs. Send and Receive
opened over the wallet; Add money, Withdraw, Invest, Sell, Earn, Take out,
Borrow and Repay were screens of their own. Nothing separated the two groups
except which one Figma happened to draw as D09 and D12.

It cost both of them something real. Send is the one composer that needs a list
beside it — who you are paying — and as a dialog it had nowhere to put one, so
picking a person meant a "Change" link that opened a second dialog on top of
the first. Receive is a page anybody might want to send to somebody else, and
as a dialog it had no address to link to; its warning about the network — the
one line on that screen that costs real money to get wrong — sat in a box you
dismiss.

Both are screens now, and the option that let a composer be a dialog is gone
from `ComposerSpec` rather than left unused. Send is the amount on the left and
the people plus an address field on the right; the Change link stands down at
that width, because a link that opens a dialog to do what the next column
already does is a second way to one place. Receive is the code and the address
on the left, what happens when somebody pays you and the last four payments in
on the right.

The phone is unchanged and was already consistent: every composer is a sheet
over its place, because there is no second column to put context in. Receive
composes nothing, so it is a screen at both widths — as is the people list that
opens Send on a phone.

94. **Composing is a place; committing is a dialog over it.** The review, the
    PIN and the outcome take the screen because they are the moment something
    becomes true. Choosing an amount is not that moment, and a dialog around it
    only removes the room the choice needed.

### 11g.27 Can somebody send a share to somebody else?

Researched rather than guessed, because the answer decides whether a Send
screen ever holds anything but dollars. What follows is what the market does
today, what it would take here, and a recommendation. Nothing has been built.

**The incumbents mostly say no, and the ones that say yes say it on paper.**

The rail in the United States is ACATS, and ACATS moves an account, or part of
one, between two firms *for the same beneficial owner*. The names have to
match. A change of owner is a different animal: it needs a stock power, a
medallion signature guarantee above a threshold, and manual handling at both
ends.

- **Robinhood** does not support transferring, gifting or receiving assets to
  or from another person's account at all. Its "gift stock" is a referral
  promotion, not a transfer.
- **Interactive Brokers** accepts position transfers only between accounts of
  like ownership and identical title. Third-party transfers are not permitted
  except donations to qualified charities; anything else goes to Compliance and
  may be refused.
- **Fidelity** does it, and is the clearest example of what it costs: a form
  called *Transfer Shares as a Gift — Nonretirement* for shares leaving to
  another firm, and a separate internal form for Fidelity to Fidelity.
- **Trading 212** does not do it. It is an open feature request on their forum.

The pattern is worth stating plainly: **every platform that optimised for speed
turned this off, and the platforms that kept it kept it as paperwork.** The
obstacle is not technical. A change of beneficial ownership pulls in AML and
source-of-funds checks on a transfer nobody paid for, gift reporting, and a
cost basis the receiving firm has to inherit — a same-name ACATS carries the
basis automatically, a gift does not.

**The tokenised platforms split three ways, and only one of them can do it.**

1. **Free token, gated mint and redeem.** Backed's xStocks, as sold through
   Kraken and Bybit. KYC sits at the issuer for minting and redeeming; once
   minted the token is an ordinary SPL or ERC-20 and can be withdrawn to a
   self-custody wallet and moved anywhere. So yes, one holder can send one to
   another person. The catch is the other half of the same decision: xStocks
   are for non-US persons only, and redemption for the real share is limited to
   KYC'd qualified investors dealing with Backed directly. Retail exits by
   selling, not by redeeming.
2. **Whitelisted token, gated transfer.** Dinari's dShares, on ERC-3643. The
   whitelist is in the contract, so a transfer to an unverified address
   reverts. Person to person works only between two verified wallets.
3. **Closed book, no transfer at all.** Robinhood's EU stock tokens cannot be
   moved to another broker, wallet or platform. You sell to get out.

**Could we do it?**

Technically, almost for free. The product already holds positions as tokens on
Base and already has a Send screen with a people list and an address field.
Sending 1.68 NVDA is the same transaction as sending $120; the difference is
which contract's transfer is called. The composer would count in shares
instead of dollars, and the receipt already knows how to say both.

Legally, it depends on two things, neither of which is code.

The first is the issuer's transfer restrictions, which we do not control. On a
Backed-style token it already works. On a Dinari-style token it works only
between wallets the issuer has whitelisted, which in practice means Tokkenly
user to Tokkenly user. On a Robinhood-style token it cannot be done at all.

The second is Nigerian law. The Investments and Securities Act 2025 classifies
digital assets, tokenised real-world assets included, as securities; platforms
that facilitate them need SEC Nigeria licensing, and the 2026 guidelines put
₦1bn of capital behind a Digital Asset Offering Platform and ₦2bn behind an
exchange or custodian, to be met by 30 June 2027. So this sits inside a
securities perimeter, not a payments one, and a user-to-user transfer is a
change of beneficial ownership. That drags in recipient KYC before delivery,
travel-rule data on the transfer, a source-and-purpose question above a
threshold, and a cost basis the product has no concept of today. And it cannot
be undone: cash sent to the wrong address is bad, and shares sent to the wrong
address are bad and have moved in price by the time anybody notices.

**Three ways to answer it, in rising order of cost.**

- **A. Don't move the security.** "Send Chinaza $50 towards Apple." One
  payment, nothing changes owner, no licence question. This is what most of the
  market does. Cheapest, safest, weakest.
- **B. Send inside Tokkenly only.** Both sides verified, both wallets ours, the
  transfer is a movement against a token we already hold. It fits the app that
  exists: the Send screen has the people list already, and the recipient is
  KYC'd by definition. It also lets the product refuse honestly — an unverified
  recipient gets a screen that says why, not a failed transaction.
- **C. Send to any Base address.** Only possible on a free-floating token, and
  it makes us the point at which a security leaves the regulated perimeter.
  Not before a licence and an opinion naming which token classes are eligible.

**B, with A as the fallback** — "they are not on Tokkenly yet: send the cash
and an invitation instead" — is the recommendation. And the first thing to
build is not the transfer; it is the refusal, because the refusal is the part
that has to be right on day one.

Open questions for the person deciding: A, B or C; and whether sending shares
belongs on the Send screen as a second thing it can carry, or as its own action
from a holding.

### 11g.28 Handing a share over, and refusing to

11g.27 laid out three ways to answer this and recommended the middle one. It
was chosen, and built: a share can go to another verified Tokkenly account and
to nobody else. The action starts on the holding — beside Buy and Sell in Your
position, on the thing it moves — and only appears when there is a position to
move.

**The refusal was built first**, because it is the part that has to be right on
the first day, and because a refusal nobody can reach is a refusal nobody has
tested. Two of the four people in the list hold no account, the way `.99`
declines and `.98` goes unanswered. Picking one of them is a real address with
a real screen: it names them, says in one sentence why a security is not a
payment, and offers the same gift as cash with them already in it. Nothing
leaves the holding on the way. The list does not hide them either — they are
listed under their own heading, marked "Cash only", because a row that does
nothing when pressed teaches nobody anything.

The composer is priced in dollars and settles in shares, which is what the buy
screen already does and what a person already means. Its label says "How much"
rather than "How many", because the field takes dollars and a label naming a
unit the field will not accept is the shortest way to make somebody type the
wrong number. The summary does the converting: they receive 1.00 AAPL, at
$224.10 a share, fee none either side, you keep 22.42.

Three things it inherits rather than reinvents. Item 06's rule — one limit
policy for every outflow — applies, because an unverified account handing
somebody $5,000 of Apple is exactly what a ceiling is for; the ceiling is the
smaller of the holding and what the account may still move, and the hint names
whichever is binding. The last quick chip says which one it reached: "All" when
the holding is the limit, "The most" when the month is, because a chip labelled
All that stops short of all is worse than no chip. And the PIN stands in front
of a large one, from the same preference that guards a payment.

The wallet does not move. That is the whole difference between this and
selling, and the suite asserts it.

Two model changes carry it. An `Activity` can name an `asset` — ticker, shares
and the price of the day — so a receipt for a transfer states what actually
left rather than dividing a dollar figure by a price that has since moved. And
a `Person` carries whether they are on Tokkenly, on the person rather than
derived, because the flag is the whole rule.

95. **Build the refusal before the thing it refuses.** The happy path of a
    regulated action is the easy half. The screen that says no is the one
    somebody meets on their first attempt, it is the one a regulator reads,
    and it is the one that is still missing when a feature ships late.

### 11g.29 Two reminders, moved and made dismissible

Home opened with two standing rows above everything: verify your identity, and
three companies are waiting in your bucket. Above the balance, above the doors
— which is where a bank puts the thing it wants from you rather than the thing
you came for.

They sit under the doors now and against the recent activity, in both
compositions. Somebody arriving sees what they came for; somebody who has done
it meets the reminder on the way out.

And they can be put away, which they could not be before. A reminder that
cannot be dismissed is an advert, and this one is on the screen the product
opens on. Not by a stray tap though: one of the two is what lifts an account's
limits, so the close asks first, and what it asks names what is being hidden
and what is not — the account stays unverified and the limits stay with it; the
bucket keeps every company in it and only Home stops mentioning them. Each says
where the thing still lives.

It is a preference, so it survives a reload, and Preferences grows a row that
counts what is hidden and brings it back. The row is absent when nothing is,
because a control for a state nobody is in is noise.

96. **Anything that stands on a screen uninvited must be dismissible, and
    anything dismissible in one press must ask.** The two halves are one rule:
    without the first it is an advert, and without the second it is a trapdoor
    under the one thing that lifts a limit.

### 11g.30 The card that stops a payment, made to look like it

"Your limits" was four rows of a table in a plain panel, beside another plain
panel listing bank accounts. Four numbers of equal weight, none of them the one
anybody wants, on the card that is actually stopping payments on an unverified
account.

It leads with what is left, because that is the question. Under it, a bar for
how much of the month has gone — which no arrangement of four numbers shows as
fast — amber while the ceiling is one you have not lifted. Then the two
supporting figures, then the way to lift it.

Unverified it takes the same tint as the reminder on Home, because it is the
same subject and the same offer, and one of them should not be a notice while
the other is furniture. Verified it goes calm and loses the button: a limit you
are nowhere near is information, not a warning.

`spentBar` is not `meter`. The meter auto-scales and carries a tick, because a
cover ratio has no natural ceiling and has a minimum worth marking. A month's
allowance has both, and a bar that rescales itself is a bar that cannot be
compared with the same bar yesterday.

### 11g.31 A coin, and the end of the gradient

The outcome sheet washed green up from its own bottom edge. It was one flat
colour doing the work of saying "this went well", and it read as a filter over
the sheet rather than as anything to do with the trade.

It is a coin now, in dots, turning. Home's three doors are dot fields, a
receipt's history is a sparkline, and nothing in this product is a photograph —
so the celebration is a dot field too. A disc seen face on, rotating about its
vertical axis: it squashes to a line as it passes edge on and opens out again,
the side turning towards you catches the light, and a struck $ on its face
squashes with it. It bobs a little faster than it turns, and the two being out
of phase is the whole difference between a coin spinning and a coin pleased
with itself.

One canvas, 95 x 95, about three hundred circles a frame, and it stops the
moment it leaves the document — this app rebuilds its whole tree on every
change, so a loop that does not check that is a loop that runs for the life of
the tab. Reduced motion gets one still frame at three quarters on, where both
the rim and the face read.

It only turns for an outcome worth turning for. A payment that did not come
back confirmed keeps the tick, because a coin spinning happily over "Still
settling" would be the product cheering its own failure. 11g.21 still holds:
what is celebrated is completion, not the trade.

### 11g.32 One size of pop-up

Measured rather than eyeballed, and the measurement was embarrassing: the two
tallest dialogs in the product were the review where money is agreed to (832px,
scrolling on a phone) and the receipt that is the record of it (952px,
scrolling on both). The two screens where a line below the fold matters most
were the two with the most of it.

Three changes, in the order they were worth making.

**The panel pairs up.** Past four facts it becomes two columns. Nothing is
hidden and the height halves; a value too long to sit in half a sheet takes the
whole width rather than wrapping every cell into two ragged lines. That alone
took the buy review from 832 to 712 and off the phone's scroll.

**A record folds; a review does not.** The receipt keeps the four facts
somebody opens it to check — who it was with, what they got, what it came to,
and the reference they are matching against a statement — and folds the
arithmetic behind the total and the state of the holding afterwards, one press
away. A review states every term it is asking agreement to, and folding one of
those would be hiding a term behind a button.

**The status left its box.** "Settled. Nothing about this is going to change
now" was a 68px callout at the foot of the sheet — the last place anybody looks
for the status of the number at the top. It is a caption under that number now.

The receipt is 728 on a desktop and 688 on a phone, and `sheets.mjs` holds the
line: every dialog in the product opens, none of them scrolls at 390 x 844, and
none is more than four fifths of the screen it is on.

97. **A dialog you read may fold. A dialog you agree to may not.** The
    difference is whether pressing the button changes anything, and it decides
    what is allowed to be one press away.

### 11g.33 Borrow & Lend, and two cards that are not the same card

**The place had no name anybody says out loud.** The tab said Grow, the door on
Home said "Borrow or Lend", and the product inside said Earn. Three words for
one thing, and the loudest of them — Grow — names a feeling rather than an
action. Somebody who wants to borrow against their shares does not go looking
for growth.

It is Borrow & Lend now: the tab, the page, the door, the registry, the
activity filter. Earn is Lend, because the account is lending its dollars and
"earn" was the marketing word for it. Every string that a person reads moved,
and so did the identifiers behind them — `inEarn` is `lent`, `moveIntoEarn` is
`lend`, `rates.earn` is `rates.lend` — because a file that says Earn about a
thing called Lend is the first step of the drift this record exists to prevent.
The `/grow` routes stay: a bookmark is not a place to make a point.

No single word was found that points at both halves. Credit and lending each
name one side; interest names the fee rather than the act. Two words that both
say what you can do beat one that says neither.

The phone tab wraps to two lines rather than reading "Borrow & Le…". Two lines
of 12px plus an 18px glyph still sit inside the 52 the tab already had, and it
holds at 320.

**The two cards were the same card twice.** A caps eyebrow, the rate at 32px,
the pitch, then rows — which made the loudest thing on each of them the one
fact they have in common, and left EARN and BORROW as 11px labels doing all the
work of telling them apart.

Now the name leads. Each card says what you can do in ink and finishes the
sentence in grey, and the rate lives inside that sentence where it belongs: a
fact about the offer rather than the offer itself. "Lend your dollars. 4.8% a
year, paid into your wallet every morning." "Borrow against your shares. 9.4% a
year, and they stay yours the whole time."

And they are mirrored rather than identical. One composition — the field Home's
third door already carries — reflected: the lending card leads with it in
green, the borrowing card closes with it in amber. Same anatomy, no chance of
mistaking one for the other from across a room, and no second drawing to keep
in step with the first. Each field is keyed to its own figure the way the doors
on Home are: how much of your spendable money is out on loan, and how much of
your limit you have drawn. A ramp swaps which colour each of the three rungs
resolves to, so the composition survives — dropping one flat colour over a
field would flatten every tone it was drawn in.

98. **The name goes where the eye goes.** A card whose largest text is the one
    thing it shares with the card beside it has spent its emphasis telling you
    nothing. The rate is not what the product is; it is a detail of it.

99. **A pair should be one thing reflected, not two things drawn.** Two
    compositions have to be kept in step by hand forever. A mirror cannot drift.

### 11g.34 A halftone, not a ball pit

Measured: the two Borrow & Lend cards were drawing their field at 20.6px
between dot centres with a 17.2px dot in each. That is not a dot field, it is a
row of balls, and it was loud enough to compete with the words beside it.

The cause is that a composed field has a fixed number of cells, so the bigger
the box it is stretched into, the further apart its dots land — and because the
crop scales by whichever axis needs more, it was the field's twelve rows
against the band's height setting the pitch, not its columns against the width.
Repeating it sideways alone changed nothing.

So the field repeats in both axes now, and every other copy is reflected, so
the joins are folds rather than seams and it reads as one continuous texture
rather than as wallpaper. Each dot also gives up 40% of its composed diameter.
Every field in the product now lands at about six pixels between centres with a
three pixel dot: the doors on Home went from 12px and 11px to 6.0 and 3.3, and
the two cards from 20.6 and 17.2 to 5.5 and 2.8.

And the buttons align. The mirror had put the field last on the borrowing card,
which meant its action sat 128px higher than the lending one and read as
floating in the middle of the card — the two mirrored halves cannot both end on
their action if one of them ends on a picture. The field moved to sit under the
figures and the button is last on both. The conditions came out of the
headlines with it: a sell price and a monthly cost were sitting in the one line
whose job is to say what the product is.

100. **A texture is a pitch, not a picture.** Whether a dot field reads as
     halftone or as polka dots is decided by how many cells land in the box,
     which is a property of the box and not of the drawing — so it has to be
     measured on every surface the drawing is used, not settled once.

### 11g.35 Where the money comes from

The question was asked plainly: when I add money, where is it coming from? I
press a button and the balance goes up. Where did it come from, and where does
it end up, and where do the shares come from — make it make sense end to end,
with no contradiction about where money is lost or where it arrived out of thin
air.

There was no good answer, because there was no answer at all. `addMoney` was
`state.cash += amount`. Nothing was debited. A withdrawal was the same line with
a minus. A share bought came from nowhere in particular and a share sent
vanished. Every screen was honest about its own arithmetic and the product as a
whole was not honest about anything: it was a set of balances that could be
made to disagree, and the only reason they did not was that nothing had tried.

So the product got a ledger, and every figure in it is now read out of that
ledger rather than kept beside it.

**Three books, and named accounts.** `theirs` is outside Tokkenly — somebody's
Nigerian bank, a card issuer, the Base network, the venue a tokenised share is
bought from. `ours` is Tokkenly's own: the naira account money is paid into, the
one payouts leave from, the desk where two currencies meet, the fees, and the
interest the pool pays and charges. `yours` is the balances the app shows: the
wallet, what has been lent, what is owed. Fourteen fixed accounts, and
counterparty ones made the first time they are used, so the statement can name
your GTBank account and Tunde Bakare's without the ledger having to know every
bank in Nigeria in advance.

**A posting sums to zero in every currency it touches, or it does not happen.**
`post()` throws. Not logs, not flags for a later reconciliation — a movement
with one end is refused before it is written, because a prototype that
tolerates an unbalanced posting is a prototype that will ship one. It is the
one rule the screens cannot get around by forgetting a leg.

**A conversion is two postings, not one entry with two currencies.** Adding
money is naira leaving your bank and arriving in Tokkenly's collection account,
and then dollars leaving the desk and arriving in your wallet: two movements,
joined by a shared reference and the rate you were shown. That is how a real
ledger does it, because one entry cannot be denominated twice, and it is also
the honest answer to the question — the naira are in a Nigerian account with a
name, and the dollars came off a desk that now holds naira against them.

**Balances are derived.** `state.cash` is a getter over `balanceOf('wallet')`.
Making the five money balances read-only produced fourteen `TS2540 Cannot
assign` errors, which was the point: every one of them was a place that used to
move money by assignment, and each was rewritten as a posting. There is no
second copy of the truth left to drift from the first.

**Shares are in the ledger too, and not as a dollar value.** An account holding
"the value of your Apple" would move every time the market did, which is not a
thing a ledger account does. So a ticker is a currency: `held:AAPL` is what a
custodian holds in your name, `float:AAPL` is what the market has, `sent:AAPL`
is what has gone to somebody else. A buy is one posting with five legs that
balances twice over — dollars from your wallet to the market and to our fees,
and Apple from the market into custody. A share handed to another Tokkenly
account has two legs and neither is money, which is the ledger saying exactly
what the screen says: this is not a sale, nobody was paid.

`state.holdings` is a reading of those accounts, not a list kept beside them, so
a position cannot be credited without the trade that bought it. It caught a
name collision on the way: the fund was `Vanguard S&P 500` in the holdings and
`S&P 500 ETF` in the catalogue, two names for one thing surviving because
nothing had ever had to join them up.

**The opening position is named rather than hidden.** Twenty-one movements the
account already had are replayed oldest first, and the difference between where
they land and where the account actually stands is posted from an account
called "Before this record". That is not a fudge. An account open for months
has a history this file does not contain, and naming it is more honest than
pretending the first row is the beginning of the world. Each ticker balances
against its own opening account, because a posting has to come to nothing in
every currency it touches and Apple and Tesla are two of them.

**And a screen that proves it.** `/statement` is not a debugging view. The left
column is every movement with both its ends, each leg naming the account and
what it gained or gave up. The right column is the trial balance: every account
grouped by whose it is, with a total that has to read zero. Dollars and naira
get a card each; the four tickers share one, because a card per company would
push the money off the screen by the fourth holding. The total stays even when
a currency is empty — a claim that disappears when it is easy to meet is not
one anybody should believe.

Measured after ten actions in a row — add, withdraw, send, buy, sell, borrow,
repay, lend, take back, send shares — thirty-three movements, no movement with
fewer than two legs, and six totals reading `$0.00`, `₦0`, `0.00 AAPL`,
`0.00 NVDA`, `0.00 VOO`, `0.00 TSLA`. The wallet on Transfer, the lending
figure on Borrow & Lend and the position on a company page are the same numbers
the statement shows, because they are the same numbers.

101. **A balance is a reading, not a variable.** The moment a figure is stored
     beside the movements that produced it there are two truths, and the only
     question left is when they diverge. Derive it, and make the compiler say
     so: a read-only getter turns every place that used to move money by
     assignment into an error you have to answer.

102. **A movement has two ends or it does not happen.** Enforce it where the
     movement is written, not where it is later checked, and throw rather than
     log. A product that can invent money quietly will, and the screen that
     shows the books has to be a screen a person can read — the proof is worth
     nothing if only the build can check it.

### 11g.36 Rule 13, and the eight places it had already been broken

Adding the statement meant adding a line: a hairline over the reference at the
foot of each movement card. Rule 13 forbids it, in the first sentence — never
draw a line, no card outline, no field outline, no list divider, no chip edge,
no rule under a heading. Taking it out again raised the obvious question, which
is whether anything else in the product had done the same thing quietly. Eight
things had, over four tiers.

- A hairline between every **preference row**, and another between every
  **bucket row**. Both are list dividers, which the rule names. The rows are
  12px padded top and bottom, so 24px already separated them further than the
  16px inside them; the line was saying what the space had said.
- The **four timeframe percentages** on a company page were boxed and divided
  in hairlines, three of them per strip. The comment above it argued the case:
  `--subtle` on `--control` measures 4.21:1, under AA for an 11px caps label,
  so the cells could not take a fill and a hairline said "segmented" just as
  well. The reasoning was right about the contrast and wrong about the
  conclusion — the gutters carry no text, so they can be any ground at all. The
  strip sits on `--control` now with 4px gutters and the cells keep the card's
  ground, which reads as segmented, draws nothing, and leaves the small text on
  exactly the surface it was measured against.
- Outlines around the two **floating panels**: the search suggestions and the
  bucket bar. Both already have `--shadow-float`, which is what rule 12 gives a
  floating element, so the outline was the same statement in the one language
  the product does not speak.
- The **command palette** was fenced: a hairline under the field and another
  over the foot. The well steps down to `--canvas` instead, so the chrome and
  the results separate by surface. The **key cap** beside the field was a chip
  edge — filled now, which also puts its radius back on the grid.
- The **skip link** was a 10px rounded rectangle with an outline, breaking rule
  6 as well: buttons are pills. It floats over content, so the shadow it
  already had is what separates it.

None of these looked wrong on its own. That is the point, and it is why the fix
is not the eight edits but `lines.mjs`: nineteen routes in both themes, walking
every element's computed style and reporting any visible stroke. Three
exceptions are named in the file rather than tolerated — a chart, which the
rule names as its own exception; the empty PIN dot, where the outline is the
drawing; and the busy button's spinner, a glyph on a pseudo-element. It reads
`nothing draws a line`.

103. **A rule nobody can check is a preference.** Rule 13 was written at the
     start and broken eight times in four tiers, by people — the same one —
     reasoning carefully each time about why this case was different. Two of
     those arguments were even correct about the constraint they named. What
     was missing was not judgement, it was a count: a rule stated in prose
     drifts, and a rule with a suite behind it does not.

### 11g.37 Where the money comes from, part two: time

The ledger made the accounts honest. It did not make the clock honest. Adding
money still credited the wallet the instant the button was pressed — the
postings named the right accounts now, and they all happened in the same
millisecond, on a bank transfer nobody had told. The one event the whole flow
is about, the money actually arriving, was still invented.

**Two ways in, and they are genuinely different.** A transfer is pushed by a
person from their own bank app; a card is pulled by us. That difference decides
everything else, so both are on the screen rather than one of them dressed up
as a choice:

| | Bank transfer | Card |
|---|---|---|
| Who moves it | You do | We do |
| How long | A minute or two | Seconds |
| What it costs | Nothing | 1.4% of the naira |
| The rate | Struck when it lands | Held firm for ninety seconds |

The last row is the one that matters and it is the one a prototype would fudge.
Nobody can hold a rate for ninety seconds while somebody types an account
number into a different app. So the transfer screen says the rate is struck on
arrival, quotes today's as indicative, and promises "about $200" rather than
$200 exactly. The card, which clears in seconds, gets the firm quote the rest of
the product already knew how to hold.

**A dedicated account, not a reference.** Every Nigerian payments provider
issues a virtual account per customer, and that is why a transfer there needs
no reference at all: the account number *is* the reference, and money reaching
it can only be yours. It is a permanent property of the account, so it sits in
state beside the Base address and appears on Payment methods as well as on the
screen that needs it, rather than being generated at a review.

**And a leg that is genuinely pending.** Adding money is two steps now.
`startAddMoney` writes what left — naira out of a bank or a card, into
`inflight`, an account that is neither yours nor ours, which is exactly what
money between two banks is. `landAddMoney` writes what arrived: into the
Tokkenly naira account, on to the currency desk, and out the other side as
dollars in the wallet. Four postings, three moments, and every one of them a
thing that really happens.

The wallet does not move until step two, and because every balance is derived
there is no way to make it. That is the whole return on the ledger: the
pending state is not a flag on a row that the balance politely ignores, it is
the money sitting in a named account you can look at. Transfer shows it —
"On its way to us, ₦450,000" — read off `inflight` rather than totalled from
the rows beside it.

`.98`, the magic value for "no answer", finally has a state to mean. With money
genuinely in flight, a transfer that never arrives sits in `inflight` and stays
there, and the waiting sheet says so: nothing lost, nothing credited, nothing
sent twice. The rule is in `landAddMoney` rather than on the screen, because a
rule that only exists in a view is a rule one route around the view undoes.

A card fee needed a naira fee account of its own. It could not be folded into
`fees`, which is denominated in dollars, because a posting has to come to
nothing in every currency it touches — the ledger refusing to let two
currencies share an account is the ledger doing its job.

### 11g.38 One Send, and the question it asks first

"Why is there a send and there is a withdrawal?" The honest answer is that
there is not. Both took dollars out of the same wallet. The split into two
screens hid the only thing that actually differs, which is that a payout into
naira is a *conversion* — two postings joined by a rate — and the other rails
are dollars at both ends.

So there is one Send, and the destination is what it asks first. Everything
else falls out of that one answer:

- **Someone on Tokkenly** — dollars, instantly, free. The far end is
  `person:<name>`, an account with a name on it rather than "the network".
- **A Base address** — dollars, on the network, free and final. The warning
  says what an address cannot do, which is be checked.
- **A Nigerian bank account** — yours or anybody's. Dollars out of the wallet,
  naira into the account, at the rate. Your own banks are listed first because
  that is the old Withdraw, and it is now one row rather than one screen.

**A name before a number.** The third rail gained the step that every Nigerian
transfer has and this product did not: you type ten digits, the bank returns a
name, and you check it against the person you meant to pay. It is the one thing
that catches a wrong digit while the money is still yours. The button to
continue does not exist until a name comes back, and an account ending 99
resolves to nobody — so the refusal is on a path anybody can walk rather than a
state nobody has seen.

`/withdraw` and `/convert` still resolve. They render the same composer with the
destination already answered rather than redirecting, because a redirect would
paint the picker for a frame and then jump. An address somebody bookmarked
should not break because the product learned to count the errand properly.

Transfer went from three doors to two. The measurements: adding $300 by
transfer leaves the wallet at $2,480 and ₦450,000 in `inflight` while it is in
the air, then $2,780 and nothing in flight; a card add of $100 charges
₦2,100 in fees in naira and credits exactly $100; a $120 payout to GTBank takes
$120 from the wallet and pays naira at the held rate, in two postings. Twenty
four assertions in `inflow.mjs`.

104. **A pending state is an account, not a flag.** "Still settling" written
     beside a balance that has already moved is decoration. Money that has left
     one place and not arrived at another is somewhere, and naming that
     somewhere is what makes the waiting screen true rather than reassuring.

105. **Two ways to do one thing must differ in something the person pays.**
     Cost, or speed, or what can be promised about the rate. If they differ in
     none of those, they are one way with two buttons, and the choice is work
     the product has pushed onto the reader.

106. **The destination is the question.** Send and Withdraw were one errand
     wearing two names, and splitting them hid the fact that only one of the
     two changes currency. Where the money goes decides the rail, the fee, the
     speed and the checks; ask that first and the rest of the screen follows
     from it.

### 11g.39 Three things a real pending leg turned up

Making the wait real made three other things wrong that had not been wrong
before, which is what a prototype does when one of its fictions is removed.

**Nothing in the product had ever written a notification.** The five in the
list are seeded, and the switch in Preferences filtered a fixed set — a control
that changes what you can see and never what happens. That was survivable while
every movement completed inside the dialog that started it. It stopped being
survivable the moment the waiting sheet said "you can close this and carry on",
because carrying on then meant never being told the money arrived. A transfer
landing is the only genuinely asynchronous event in this product, so it is the
one that writes a notification, and it is the first the product has ever
written: *"$300.00 landed in your wallet · ₦450,000 from GTBank, at ₦1,500 to
the dollar."*

**A receipt for money that changed currency stated one of its two figures.** It
said "+$300.00, from GTBank" and stopped, which is the wrong half for the one
document a person keeps: what they need for their own records is the naira that
left. It reads both off the ledger now — `conversion(ref)` returns the naira leg
and the rate from the paired postings — rather than multiplying the dollars by
whatever the rate is this morning. A record written a fortnight ago at ₦1,494
that reprints itself at today's rate is not a record.

**And "still settling · it usually clears within a minute" was a promise the
stuck one cannot keep.** `.98` now means a transfer that never arrives, so its
receipt says what is actually true: we have not seen it, and nothing has been
taken twice.

One more, from the other direction: money can now reach you two ways — dollars
to a Base address, naira to a virtual account — and they were described on two
screens with neither mentioning the other. Somebody asking "how do I get paid"
would have found half the answer. Receive names both.

107. **Removing a fiction exposes the ones leaning on it.** The wait was fake,
     so nothing needed to tell you it had ended, so the notification list could
     stay a decoration and the receipt could state one currency. Each was
     defensible on its own and none of them survived the first honest thing
     built next to it. When you make one part of a product true, walk the parts
     that were quietly relying on it being false.

### 11g.40 The rest of the MVP, with dummy data behind it

A read of the MVP spec against the build turned up three lists: things half
built, things not started, and two things built that the spec puts outside the
MVP. This tier is all three, on the principle that a prototype's job is to show
every feature working — the wiring is the engineers' problem and the screens
are not.

**A token is not a share, and now the product says which.** Everything you hold
is `AAPLc`, not `AAPL`: the suffix is the whole point of a tokenised product
and hiding it makes the app a broker pretending. `find()` answers to both, so
every route, bookmark, palette entry and test written against the bare symbol
still lands — a naming convention that breaks addresses has cost more than it
is worth.

The company page gained the card that makes it tokenised rather than brokered:
**one AAPLc is 1.0043 × AAPL**, above one because a tokenised share cannot pay
a dividend into your wallet or split into two tokens, so both accrue into a
B20 multiplier instead. The corporate actions that moved it are folded
underneath. It is the single most confusing thing about the instrument and the
product had never mentioned it.

Twelve assets, four of them the approved launch set. The other eight are
visible and cannot be bought, which is what a market that is honest about its
pipeline looks like: hiding them makes the product look smaller than it is,
and letting somebody compose an order in one and refusing at the review wastes
their afternoon.

**A trade is checked against a price the venue did not supply.** Price impact,
minimum received, and the gap to the Chainlink reference are on the composer,
and four refusals sit in front of the button rather than behind it: stale
reference, deviation over 1.5%, impact over 2%, and an order bigger than the
book. All of them show their arithmetic — a refusal that does not show its
working reads as the app being broken.

Two findings came out of building it. The impact curve was purely quadratic
and read `0.00%` on every order a person could afford, which made both the
figure and the refusal behind it decoration; it is linear-dominant now, and a
$2,400 order against METAc's thin book reads 3.56% and is refused. And the
catalogue briefly carried **two independent prices** — `mark` and a new
`chainlink` — which are the same fact from the same kind of source, and the
review printed both. One number, named by where it comes from, with an age on
it.

**A portfolio knows what it cost.** Average cost and gain per holding, derived
from the trades that built the position exactly the way the quantity is, so
the two cannot drift. `basis()` walks the postings and reduces cost
proportionally on a sale. It went in wrong first: the opening posting is one
movement carrying every account the replay could not reach, so reading its
wallet leg as the price of its Apple leg put the average cost at −$39.87 a
share. A posting that balances Apple against "Apple before this record" is an
opening position and is priced as one.

**A bank payout is two stages**, because there are two: the dollars leave the
wallet when it is authorised and the naira reach somebody's bank when the banks
get round to it. Nothing calls it complete until the second, the naira wait in
a named account in between, and Transfer shows both directions of flight.

**Identity and permission are different facts.** Five checks — who you are,
over eighteen, resident, sanctions, and may-hold-this-instrument — each with
its own state and its own sentence. The last can fail while the others pass,
which is the commonest real answer and the one a single verified/not-verified
badge cannot express. There is a button on the screen that produces that
ending, because a state nobody has seen is a state nobody has designed.

**The wallet says who holds the key.** The product's central claim — that we
cannot move your money and cannot be made to — was invisible: the address was
on Receive, the balance on Transfer, and nowhere did it say who could sign. Now
it is a group of its own, with the export flow, the sponsored-gas ceiling, and
the invite that let this person in.

**And there is a console.** `/admin`, its own place rather than a section of
Account, because it is not this person's account: it answers to somebody else
about everybody else's money, and dressing the two the same is how a support
agent ends up thinking they are looking at their own settings. Provider health
with the customer-facing fallback beside each one, nine switches, the pilot
list, deposits and orders and withdrawals, reconciliation breaks you can work,
the staff audit log, and the launch gates from "Required before launch" as a
screen rather than a paragraph in a document.

Two rules it keeps. **Nothing in it can move customer money** — there is no
key, so this is not a policy anybody has to enforce. And **every switch names
what a customer sees**: "buying: off" is a boolean, "every buy button is
replaced by a line saying trading is paused" is a decision.

The switches are wired all the way through. Card funding ships off, so Add
money shows the card rail as paused rather than hiding it; METAc ships off, so
its buy button is a sentence; turning off Buying replaces the buy composer's
button with the reason. `mvp.mjs` flips them from the console and checks the
customer screen on the very next render, which is the only way to know a switch
is not decoration.

**Left as they are, on request:** Borrow & Lend and sending a share to another
person both work and both sit outside the MVP the spec describes. They are the
two future product families, and they stay demoable.

108. **A switch that changes nothing is a lie with a toggle on it.** An ops
     console full of booleans nobody has wired is worse than no console: it
     tells the person flipping it that they have done something. Wire it to the
     screen, name the consequence in the customer's words on the row, and test
     the customer screen rather than the state.

109. **Show the pipeline, refuse the order.** A market that hides what is not
     tradable looks smaller than it is; one that lets you compose an order and
     refuses at the review wastes the composing. Both, on the thing itself,
     before the amount.

110. **Two numbers for one fact is one number and a bug waiting.** The
     catalogue carried a venue price, a "real" price and a Chainlink reference
     for the same instrument, and the review printed two of them side by side.
     When a second source arrives, check whether it is a second fact.

### 11g.41 Human and simple

The brief arrived as one sentence: the words in this product have to be human
and simple, so that somebody who has never bought a share can read a screen
once and act on it. It came with a specific complaint — the two Borrow & Lend
cards — and the complaint turned out to be the whole argument in miniature.

**The buttons were sawn off.** A `width: 100%` button with 24px side margins is
48px wider than the card it sits in, and `overflow: hidden` on the card turns
that into a button whose right end is missing. The margins were doing the
padding job every other child of that card gets from a rule above them;
`width: auto` lets the flex column stretch the button into the space the
margins leave, which is what the margins were for. Measured: 24px inset on both
sides, nothing clipped, at both widths.

**And each card carried five pieces of text to say one word.** An eyebrow
reading LENDING, a headline reading "Lend your dollars.", a grey clause
finishing the sentence, three figures, and a caption underneath explaining the
terms. Six lines for a feature whose whole idea is one word — and the one word
*was* the eyebrow, set in the smallest, quietest type on the card.

So the eyebrow becomes the title. **Lend**. **Borrow**. Under it, one sentence
saying what you get, in the words somebody would use telling a friend: "Earn
4.8% a year on cash you are not using." "Get cash without selling your shares."
Then the figures. Then the button. Nothing else.

**Where the caption carried something real, it moved behind a question mark.**
Both captions held one fact worth keeping — what we would sell, and that
nothing is locked up — and neither was deleted. Nielsen Norman's rule for
progressive disclosure is that the trigger has to be persistent and
discoverable and has to work on a press, not only on a hover: a hover tooltip
is a tooltip a phone cannot open and a keyboard cannot reach. So it is a real
button, in the tab order, with a label, opening a small panel in place.

Three rules keep it from becoming clutter. One per idea, and only where the
idea is genuinely not in the words already. Forty words or fewer, because a
popover that scrolls is a screen that lost an argument with itself. And it
never holds a fact that only lives there.

It is 24px, and rule 35 wants 44 under a thumb. The first version faked that
with an invisible `::after` — real to a finger, invisible to the checker, and
overlapping the next hint's hit area if two ever sat close. The button is
genuinely 44 on a phone now and gives the 20 back as negative margin: the box
a thumb hits is 44, the space it takes in the row is 24, and the circle is
drawn by a pseudo-element inset inside it.

**Then the same rule, everywhere.** The product's voice was long sentences
joined with em dashes: "None — the rate above is the rate you get." That is two
sentences pretending to be one, and the second half was answering a question
the row above it had already answered. It is "No fee" now. Sixty-one strings
across every customer screen, the disclosures, the onboarding and the console
were rewritten the same way.

And it is a suite, because a rule nobody can check is a preference — the lesson
rule 13 cost four tiers to learn. `words.mjs` walks thirty-two routes and
counts the three things that actually make copy hard: sentences over
twenty-four words, em dashes and semicolons, and jargon appearing on a screen
that does not also explain it. It found the last of each: a 46-word sentence on
the statement, "Born 14 March 1996 — over eighteen", and "Collateral cover" on
the borrowing screen. That last one is now "Shares against the loan", with the
140% rule behind its question mark.

The suite began with two exemptions — the disclosures and the
questions-people-ask block, on the reasoning that a legal page is read rather
than scanned. Both then passed without them. Breaking the risk warnings into
short sentences cost them nothing and they are plainly better for it, so
**nothing is exempt**.

111. **Human and simple, or it does not ship.** Say it the way a person would
     say it out loud. One idea per sentence. If a sentence needs an em dash it
     needs a full stop. If a word needs explaining it is the wrong word, unless
     the screen explains it. This governs every string a customer can read, and
     `words.mjs` counts it.

112. **A question mark instead of a paragraph.** Text that explains a thing
     sits beside it forever, read once by the person who needed it and re-read
     by nobody. Put the explanation behind a press: persistent trigger, real
     button, forty words, and never the only place the fact lives.

113. **A hit area you cannot see is a hit area you cannot check.** An invisible
     pseudo-element that makes a 24px control 44px passes a finger and fails a
     measurement, and two of them side by side overlap in a way nothing on
     screen explains. Make the box the size it claims to be and give the space
     back with margin.

### 11g.42 The screens the sweep never saw

The voice sweep in 11g.41 reported clean across thirty-two routes. Widening it
to every screen and every dialog took it to ninety-three, and the widening is
the finding.

**It had never opened a dialog.** `words.mjs` walked pages and looked only
inside `.content`, so it had never read a review, a receipt, an outcome, a
refusal or an empty state — which between them are most of the sentences
somebody reads on the day something goes wrong. Thirty-one more addresses, one
per dialog, at the address that opens it.

**And it read nothing at all on six screens.** Sign-in, sign-up, the lock
screen and all four onboarding screens render their own shell rather than
`.content`, so the selector matched zero elements and the suite passed them in
silence. Those are the six screens a newcomer meets first.

That is the failure mode of every check written against a selector, and the fix
is the same one every time: **make it prove it read something**. Each address
now has to come back with at least eight words on it, and the total is printed
— 897 sentences across 93 screens. A suite that walks ninety addresses and
reads none of them should fail loudly, not pass quietly.

**The jargon check had a rule that could never fire.** `['custodian', /custodian/i]`
allows the word wherever the word appears. Two of the ten entries were written
that way. Once the pattern was changed to a different phrase — the word is
allowed only where the screen also says "holds the real share" — it found
"custodian" on the statement and the disclosures and "self-custodial" on every
Account page, from a hint in the destination registry.

The lock screen took one more fix. It is not at an address: it renders over
whatever you were looking at, and `locked()` is an init script, so it needs a
page of its own. Reading it by container rather than by leaf then reported the
keypad's ten digits and four labels as a twenty-five word sentence, which is
why one reader now serves both.

114. **A check must prove it looked.** A selector that matches nothing passes
     everything, silently, forever. Every sweep over a set of screens should
     count what it read and fail when a screen comes back empty — the count is
     the difference between "nothing is wrong" and "nothing was examined".

115. **An exception whose pattern contains the rule is not an exception.**
     Allowing "custodian" wherever "custodian" appears is a check that can
     never fire. When a rule carries a get-out, the get-out has to be a
     different string from the thing it excuses.

### 11g.43 A card is a door, and a position is a page

Borrow & Lend opened with a hero: "Lent out" and "You owe" in display type,
side by side, above two cards that showed the same two figures again forty
pixels lower. The page said everything twice and led with the half that is not
a decision. It is deleted. The page is two cards and the questions people ask,
and nothing else.

**The figure goes on the handle.** Each card now carries one figure — what you
have lent, what you owe — immediately above the button that acts on it, at
28px rather than the hero's 56. That is the whole of the hero's content, in the
place where it is the reason to press something rather than an announcement.

**The corner links are gone.** "Repay" and "Take it back" sat beside each
button in eleven-pixel type, and between them they were the entire set of
things somebody with an open position could do. Two words in the quietest type
on the card, for the thing the person came to the screen for. The button leads
to a page per side instead — `/grow/lending` and `/grow/borrowing` — and the
page holds what the position is, what it costs, what backs it, everything that
built it, and the two or three things to do next. The composers still live at
the addresses they always had; these are the pages that send you to them.

One honest limitation is stated on the borrowing page rather than designed
around: a loan is one balance, not a stack of separate loans. Money is
fungible, so there is no "repay this draw". Repaying reduces the balance. The
history below it is what happened, not a list of things that can each be
settled on their own, and pretending otherwise would be a fiction that costs
somebody money the first time they believed it.

**The mirror cost 128 pixels.** The dot field used to bleed off the top of the
lending card and the bottom of the borrowing one — one composition reflected,
which is a nicer idea than it is a layout. Putting the band above the lending
card's words started that card's title level with the other card's figures and
left the two buttons 128 pixels apart. Two cards side by side with their names
at different heights and their actions at different heights do not read as a
mirrored pair; they read as one card that has slipped.

So the field goes under the button on both, against the card's own bottom edge,
and the order is identical: the name, the sentence, the figures, your position,
the button, the field. The mirror is now the field itself — flipped, and lit in
the other colour — rather than which end of the card it sits at. Measured: both
cards 460 tall, both buttons at 252.

That also settles what the band was doing in the middle of the borrowing card,
between the figures and the action. A picture between a sentence and the button
that answers it makes the button read as belonging to the picture.

**The switch went with the figure.** The privacy eye sat on the hero, which is
the rule — it belongs beside the number it covers and nowhere else (11g.24).
Deleting the hero deleted the only way to uncover a masked balance on this
screen, which is the exact failure that put the eye there in the first place,
and `prefs.mjs` caught it on the first run. It did not go back on a card. A
card figure is a position, like a holding on a company page, and positions
follow the setting without a switch of their own; two eyes on one screen would
suggest two things to cover. It went where the headline figure went: to the top
of each position page. The suite walks those two routes now, and asserts the
other half as well — that Borrow & Lend masks both cards and offers no switch.

**Hover is a step in the surface.** The whole card answers the pointer, because
the whole card is one offer — background only, no shadow, no gradient, no lift,
and the button inside it steps with it so the card lighting up does not leave
the one thing you came to press looking flat against it. A card that moves
under the cursor reads as selected rather than as hovered. Movement is what a
press is for.

**The cover ratio read 3,217%.** The borrowing page showed the shares as a
percentage of the debt — $12,509 of shares against a $389 loan — under a bar
that was pinned full. It is a true number and nobody thinks in it. The same
fact, in the words somebody would use to ask for it, is *how far can it fall
before you touch it*: 96%. The bar underneath is now what the shares are worth
with the sell price marked on it, so the gap between the fill and the line is
the answer drawn. Two rows lost their fragment labels the same way — "About a
month" became "A month pays" on one page and "A month costs" on the other,
because a row is a sentence read across, not a heading with a number beside it.

The borrowing composer carried the identical figure under the identical label,
so it got the identical fix, and the scenarios table under it — "if your shares
fall 96%, we sell enough to cover" — now reads the same variable rather than
recomputing it, so the two cannot drift apart.

Chasing the number turned up a smaller thing: the rule was written against one
quantity and measured against another. The sell price is 140% of what you
*borrowed*; three screens said "140% of what you owe", which on this account is
a different number — $380 against $388.90 — sitting a few rows up the same
page. The words now say what the model measures. Whether the model is right is
a separate question, and it is in Still open: a real maintenance requirement is
against the whole debit balance, interest included.

**And the cross-reference.** The MVP brief lists ten features, and borrowing
and lending are not among them. They are in the section headed *Not included in
the MVP* — "Earn or yield products", "Stock-backed credit or any other
lending" — with a note that Earn & Credit is a future product family needing
its own legal and risk review. So there is no specification to check the
repayment flow against: this whole place is ahead of the brief, and what a
borrower can do here was decided in this file, not in that one. It is left
standing and working, because a prototype's job is to show the product; the
gap is recorded here so nobody mistakes it for a requirement that was met.

**Then the phone found three more.** None of them is about Borrow & Lend; all
three were found by opening it at 390 wide, which is the argument for looking
at every screen on a phone rather than trusting that the rules held.

*The question mark was a plain grey disc.* Rule 35 wants 44px under a thumb and
a 44px question mark would be a button the size of the figure it annotates, so
the mobile rule makes the button really 44, gives 20 back as negative margin,
and draws the visible 24px circle with a positioned pseudo-element inside it
(11g.42). A positioned pseudo-element paints above its parent's inline content.
The circle was painting over the "?". `isolation: isolate` on the button and
`z-index: -1` on the circle put it back underneath.

No suite caught it because every check on that button measures its box, and
painted-or-not-painted is a question about pixels. So `a11y.mjs` now asks about
pixels: it shoots the button, sets `color: transparent` on it, shoots it again,
and fails if the two images are identical — because that means the glyph was
never being drawn. Two viewports, since this one only ever went wrong on the
phone.

*Six answers in three 100px columns.* "Questions people ask" carried
`gridTemplateColumns: repeat(3, 1fr)` as an inline style, and an inline style
cannot be asked how wide the screen is. Every answer read two words to a line.
It is a class now: three columns, two on a tablet, one on a phone.

*And a class name collided.* The help button took the name `.hint`, which had
belonged since item 19 to the caption under the amount ruler — "Drag to adjust,
or type. Up to $2,480.00." The button's block sits later in the stylesheet, so
it won, and that caption became a 24px grey circle with the sentence clipped
inside it. On every composer in the product: lend, take out, borrow, repay,
buy, sell, add money, send. It shipped in the previous commit and nothing
failed, because no suite reads a caption's shape and the words themselves were
still in the DOM for `words.mjs` to find. The caption is `.ruler-note` now.

116. **A pair is read across.** Two cards side by side are scanned as rows —
     name against name, figure against figure, button against button. A
     composition that is beautiful in one card and shifts the other by a
     hundred pixels has broken the row to keep the idea. Align first, and let
     the mirror be colour, direction and content.

117. **A ratio is not a sentence.** Any figure that needs the reader to hold
     two quantities and a direction in their head — cover, exposure, a
     multiple — is arithmetic shown instead of the answer. Print the thing they
     would have asked for: not "3,217% covered" but "your shares can fall 96%".

118. **A row is a sentence read across.** "About a month — $4.96" is a heading
     with a number beside it. "A month pays — $4.96" is a sentence. The label
     is the first half, the value is the second, and a label that cannot finish
     in the value is the wrong label.

119. **A class name is a noun, and rule 37 applies to it.** One noun per thing,
     in the stylesheet as much as on the screen. Two different things sharing a
     class name is not a naming problem that someone will tidy later — the
     later block silently wins on every property they share, on every screen
     that uses the older one, and the build stays green. Before taking a name,
     grep for it.

120. **A check that measures a box cannot see paint.** Every assertion about a
     control being big enough, present, labelled and in the tab order can pass
     while the thing is invisible. When a rule is about what somebody sees,
     find a way to ask about pixels — two screenshots that must differ is
     usually enough, and needs no image library.

### 11g.44 One frame, and two objects in it

Three things, from three sentences: the cards still looked empty, Home was
handling money it has no business handling, and the whole product moved under
the cursor when you walked between two pages.

**The field becomes an object.** The three dot fields in this product are
compositions — cells placed by hand, lifted from Figma, then tiled four across
and twice down into a texture. A texture is the right answer behind a heading
and the wrong one on a card whose job is to say what the card is about. Tiled
four times across 494 pixels it says nothing, which is why both cards read as
having art on them rather than art about them.

So the two product cards carry an object each: three overlapping coins for
lending, a bifold wallet for borrowing. One simple thing per card, stated once,
at a size you can see.

Composing a wallet by hand at the resolution a wallet needs is four thousand
characters of base 36, so these are generated — from a shape, then broken up.
That is a departure from the note at the top of `art.ts`, and a deliberate one:
that note is about not re-deriving a drawing somebody made, and nobody drew
these. The style is the reference's — a form stippled solid at one end coming
apart into loose specks at the other — and it is three things:

- **the form**, cells inside the shape, kept with a probability that falls
  along a drift axis, so the left stays solid and the right opens up;
- **the break**, cells just outside the shape near where it is coming apart,
  thinning with distance from it;
- **the dust**, a far sparser scatter carrying on past the form, so the band
  has something in it rather than ending on a hard edge.

Each of those is decided by a hash of the cell's own coordinates. The tree here
is rebuilt on every state change; a field that used `Math.random` would boil.
Distance to the form is a two-pass chamfer transform rather than a search per
cell, so the whole grid costs one sweep each way.

Two drawing tricks worth keeping. Dots cannot occlude, so three overlapping
discs are one blob: each coin is cut by the one in front of it, and the cut is
what makes them read as a stack. And the seam on the wallet — the flap edge,
the gap beside the strap, the line under the card — is *subtracted*. A missing
row of dots is the only line this field can draw.

**The level moves the scatter, not the form.** The old field was a gauge: it
woke from the bottom in proportion to your position, which is rule 30 and
11g.18. A wallet with 45% of it drawn is not a level, it is a rendering fault.
So the form is always whole and the level decides how far the break and the
dust carry — a position you have barely opened shows the thing itself and
little else; a full one throws it across the band. The colour keying stays as
it was, green for lending and amber for borrowing.

The cards grew to 528 to hold it, and the band to 188.

**Send and Receive leave Home.** This is a place for buying and selling shares.
Paying a person is not what somebody opens it to do, and two buttons for it
under the portfolio figure said otherwise — on both views. They live on the
wallet, which is where the money is, and Home goes back to being a gateway: the
three doors, the reminders, the recent rows. The sentence that used to sit
under the greeting moved into the body, where the other view already had it.

Taking them off Home found that **Receive had nowhere else to be**. The wallet
carried two doors, Add money and Send, and never one for Receive: it had only
ever been the second button under Home's portfolio figure. Removing it from
there left it reachable through search and nowhere else — a screen with no door.
So the wallet has three doors now: money in by bank or card, money out, and
your address for somebody to pay. Moving something is not finished until it has
arrived.

**And the frame.** Walking between two pages moved the page. Measured across
twenty-five routes at 1440:

| | values |
|---|---|
| title top | 24, 28, 32, 48, 56, 58 |
| header height | 24, 32, 40, 48, 58, 64, 72 |
| first card top | 72, 80, 88, 96, 106, 112, 120 |

Invest started 48 pixels higher than Home. A company page put its title 32
pixels below the list it came from. None of that is visible in a screenshot of
any one screen, which is why nothing had ever caught it: it exists only in the
navigation, and only a measurement across routes can see it.

The header is a grid of two rows that are always there. A **routing row** for
the back link or the breadcrumbs, which keeps its height when it holds neither,
because a row that collapses is a row that moves everything under it. And a
**title row**, fixed, tall enough for the largest heading in the product, with
the line box set to the track — so a 32px greeting and an 18px page name occupy
the same rectangle rather than two boxes that merely share a centre. Nothing
else may live in there; a subtitle under the title is what made Home 72 tall.

Two intermediate versions were wrong in instructive ways. Bottom-anchoring the
row alone left four values, because the row still grew to whatever sat beside
the title — a page with a bell and a view toggle centred its heading in a
taller box than a page with nothing. Setting the h1's line height without
raising the selector's specificity did nothing at all, because `.page-header
h1` already set it and came later.

It now measures one value for every route at every width: header 66 and body
114 on desktop and tablet, 88 and 188 on a phone. `frame.mjs` walks
forty-three routes at three widths and asserts exactly that. Reverting the grid
makes it fail on all five measures at once, which is how I know it is looking.

It also names the seven screens that are *not* in the frame — sign-in, sign-up,
the lock screen and the four onboarding steps, which draw their own shell
because a form that fills the window is not a page — and asserts that none of
them has grown a page header. An exception that is listed is a decision; an
exception that is merely absent from the list is an omission nobody will ever
notice (rule 114).

The cost is real and worth naming: pages without a back link start 42 pixels
lower than they did, because they now reserve the routing row they were not
using. That is the trade — a page that never moves, against forty-two pixels of
what used to be above the fold.

121. **A picture is not a texture.** Repeating a composition until it fills a
     box makes wallpaper, and wallpaper is what a surface wears when nobody
     decided what should be on it. If a panel is about something, put that
     thing in it once, at a size you can see.

122. **When a picture carries data, the data moves what surrounds the subject,
     not the subject.** A gauge that dissolves the thing it is drawn on stops
     being read as a level and starts being read as a fault. Keep the form
     whole and let the level move everything else — how far it scatters, how
     far it reaches, how much of the field it fills.

123. **A frame is fixed or it is not a frame.** The title, the routing row and
     the top of the body belong at one height on every page in the product, and
     a row that has nothing in it keeps its height anyway. Sizing a header to
     its contents means every page has its own, and the difference is invisible
     on any single screen and obvious the moment somebody navigates. Measure it
     across routes, because that is the only place it exists.

### 11g.45 The four that were waiting, and cards half again as tall

Four things had been flagged and left standing because they were the owner's to
decide. All four were decided at once, so they land together.

**The cards are 792, not 528.** Half again as tall, in one axis only: same
width, same anatomy, more height — and the height goes to the field rather than
to the gap. A first pass gave it to the spacer, which made the card taller and
emptier at the same time, which is the fault this was meant to fix. The band is
442 and the content above it is 322, so the picture is most of the card.

That changed the field's shape, and a field is composed for the shape it lands
in. A picture laid out for a 2.8 band and cropped into a 1.25 one loses most of
itself: `slice` is the right crop for a texture and the wrong one for a
subject. So there are two boxes now — **TALL** for the product cards, **WIDE**
for the doors on Home and the onboarding panels — and nothing is laid out
twice, because no object appears in both.

The dust also had to learn to fan. In a band half as wide as it is, a trail
that runs horizontally leaves the lower half bare, so its vertical reach now
opens with the drift. That is what the reference does with a mane and a wheel.

**Three more objects, for the three doors.** Home shows all of them at once, so
they have to be tellable apart at a glance, and none of them may be the wallet
or the coins — those belong to the two product cards a click away, and a door
that previews what is behind it is only useful if it previews the right thing.

- **Invest** is a disc with one wedge cut out and set down beside the hole it
  came from. Own a piece. The only one of the three that is an idea rather than
  an object, and the one that reads best.
- **Wallet** is two banknotes, the front over the back, each with the oval
  window every note in the world has.
- **Borrow & Lend** is a wallet with a coin standing against it — two products,
  so two things.

They forced a change to the door itself. At 140 the band was the height of a
texture: a note's window and a slice's cut are three pixels each, and the whole
thing reads as noise. The band is 196 and the door is 368 rather than 300,
because the words take the top 170 whatever the box is, and a picture needs the
rest to be clear of them. The field also dissolves into the card before it
reaches the words — the words already sat above it in the stacking order, which
stops them being covered and does nothing whatever for reading grey text over a
field of dots.

**The place is called Wallet.** It had three names: the code called it the
wallet, the rail called it Transfer, and Home called it Convert Cash — a door
naming an operation that had had no page since the one Send landed in 11g.38.
The product's own copy settles it. "Your wallet" appears in sixty-one sentences
— it lands in your wallet, moves cash from your wallet, in your wallet in
seconds — and "your transfer" in none. So Wallet, everywhere, and every door
now carries the name of the place it opens: Invest, Wallet, Borrow & Lend.

`names.mjs` is the check that should have existed before somebody had to point
this out. It reads every label that leads somewhere — the three doors, the
seven rail rows, the three quick actions — follows it, and compares it to the
name the destination gives itself. It found one more on its first run: the
quick action reading "Buy" opened a page called Invest. Home's greeting is the
one heading that is not a page name, and it is listed as such rather than
skipped.

That fault could not have been caught by any suite in here, and it is worth
being precise about why: every other check tests a screen, and this one lives
in the gap between two screens. So does the frame in 11g.44. Both were found by
a person walking around the product, which is the argument for doing that.

**Add money leaves Home, and the slot becomes a door.** Same argument that took
Send and Receive off it: money movement is the wallet's. Rather than dropping to
two, the slot becomes the door to the wallet, so the row is three ways into the
product instead of two doors and an errand.

**And the frame costs ten pixels less.** Reserving the routing row is what buys
a page that never moves, and it cannot be had for nothing — but what is
reserved can be no bigger than it has to be. The routing row is 22 rather than
26, which is what a 12px back link needs; the title row is 34 rather than 40,
which is what the largest heading in the product needs once that heading is 26
rather than 32. Header 66 → 56, first card 114 → 104, still one value on all
forty-three routes at all three widths. The phone cannot be trimmed: both rows
are 44 there because rule 35 says a thumb needs 44.

124. **A label is a promise about a destination, and only walking it can check
     it.** Every check in a suite of screen tests passes while a door says one
     thing and opens another, because the fault is in neither screen. Read the
     labels, follow them, compare them to the name the page gives itself — and
     list the exceptions, because an exception nobody wrote down is an omission.

125. **A picture is composed for the box it lands in.** The same subject in a
     wide band and a tall one is two layouts, not one layout cropped. Cropping
     is what you do to a texture, which has no subject to lose.

### 11g.46 Into the corner, and a button that stops floating

**The objects sit in the bottom-left corner and run off both edges.** They were
placed in the band rather than composed into it — centred vertically, clear of
every edge, which is the arrangement of something dropped in rather than
something belonging there. They are half again as large now, anchored to the
bottom-left, and they overrun the card on two sides: part of the front coin and
part of the wallet's body are simply not drawn, because the field's grid stops
at zero and the renderer only visits cells inside it. Nothing is scaled to fit,
so nothing is distorted; the crop is the composition.

The anchor moved with them. `preserveAspectRatio` was `xMinYMid slice`, which
centred the field vertically; it is `xMinYMax slice` now, so the corner the
object sits in is the corner that survives, and what is lost to the crop is the
top right — which is where the dust was heading anyway.

**And the card no longer answers the pointer.** 11g.43 gave it a surface step
on the argument that the whole card is one offer. Nothing on it is clickable
except the button, and the surface stepping up toward the button's own tone is
what made the button look like it had a shadow under it. The card is inert; the
button steps, and that is all.

**The shadow under a hovered button is gone, everywhere.** Chasing the one on
this card found a global rule: every filled button rose a pixel and cast
`--shadow-hover` — twenty pixels of blur at 45% black. The note beside it
argued that a lighter fill alone is easy to miss on a page this dark. It is not
easy to miss, and the shadow was the loudest thing on any screen carrying a
button: it reads as an object floating over the page rather than a control
answering the pointer. Rule 46 said this about the doors on Home and 11g.43
said it about a card; it is now true of the last thing in the product that was
still doing it. A button steps along its own ramp and does nothing else.

126. **Bleed is a composition, not an accident.** A picture that clears every
     edge of its box reads as placed in the box. One that runs off two of them
     reads as belonging to it — and the way to do that is to let the crop cut
     the drawing, never to scale the drawing until it fits.

### 11g.47 One door for money coming in

Add money asked how much and then handed over an account number. Receive was a
separate screen showing a Base address. Both answer the same question — how does
money get into this wallet — and asking somebody to know which of two screens
holds their answer is asking them to know the plumbing.

**And two of the three take no amount at all.** A bank transfer and a Base
payment are *pushed*: the product hands over details and waits. Being asked
"how much?" before being given an account number is being asked to commit to a
figure nothing will hold you to — the money that arrives is whatever the person
sends. Only a card is *pulled*, and only the card asks.

So: one door, three tabs, and the tab is in the address so it can be linked to
and returned to. Bank transfer and Base are details and history. Card is the one
that asks, and the fee is on it rather than on the review behind it.

It opens **in place**, over the wallet, with the full page one link away — the
standing rule about dialogs. The dialog and the page are the same panels at two
sizes rather than two things to keep in step: `addPanels(tab, full)` builds
both, and `full` decides whether the provider note and the wide table come
along.

**The ceiling did the design work.** Item 61 caps a dialog at 82% of a 390×844
phone, and the first build came in at 774 for the bank tab and 1104 for Base.
Getting under 692 meant deciding what a dialog is actually for. The answer:

- **One card, not three.** A details card, a provider note and a history card
  spend 112 pixels on padding and gaps before saying anything. What has arrived
  goes inside the details card; the provider note is the page's.
- **Two rows of history, not four**, and as a list rather than a table — a
  header row over two rows of data costs more than it explains.
- **The QR is 84 rather than 160**, and loses the caption and the wide copy
  button under it. The field beside the address carries a copy button already,
  so the wide one was 56 pixels repeating it.

Base lands at 688 against a cap of 692, which is tight and is the honest
number. Both tabs are in `sheets.mjs` now, so the next thing added to them has
to answer to the same ceiling.

**A rail that is off is shown as off.** The first version of the tab row simply
omitted the card tab when operations had switched it off, which quietly
reversed a rule this file already had: a door that vanishes makes people think
they misremembered it, one that says "not right now" tells them to come back.
`inflow.mjs` caught it, having been written against the rail picker that got it
right. The tab is there, disabled, and says Paused.

That suite also had to stop counting positions. It asserted things about
`rails[1]`, which was the card when there were two rails and is Base now there
are three. It looks the card tab up by name.

**And the deposits are split by rail, which meant recording it.** Each tab lists
what came in that way, and which way a deposit came in cannot be worked out
from the payer's name without guessing that anybody called "Payroll" used a
bank. `Activity` carries a `rail` now, set where money lands and seeded on the
four inbound rows.

The wallet drops to two doors: money in, money out. `/receive` still resolves,
to the Base tab, because somebody has it bookmarked — the same arrangement
`/withdraw` and `/convert` have had since 11g.38.

127. **Ask for an amount only where an amount does something.** A figure typed
     before a set of bank details is a figure nothing will honour: what arrives
     is what the sender sends. Push rails hand over details; pull rails ask.
     Putting one composer in front of both makes the product look like it is
     collecting the number for its own benefit.

128. **A ceiling is a brief.** The dialog got smaller by deciding what a dialog
     is for, not by shrinking type. Three cards became one, a table became a
     list, and a 160px code became 84 — and every one of those is a better
     dialog, not a compromised one.

### 11g.48 One feed, and the sweep that was lying

Activity held two lists that never met: a table of money, and behind its own
chip a list of notifications. Somebody who remembered "Adaeze paid me" had to
know whether they were remembering the payment or the announcement of it,
because those lived in different places. They are the same day in somebody's
life and they belong in one column.

What the reading changed, and where it came from:

**One item per underlying event.** Monzo's account of merging their feeds is
explicit: work out the source and destination of each item and keep the one
that represents the whole transfer. Three of the five seeded notifications
carry the reference of a transaction that is already a row. Showing both is the
fault this file has spent five tiers removing — the page saying everything
twice. So a notification about a movement folds into that movement's row, which
carries a bell to say it was announced. A notification with nothing behind it —
a sign in — is a row of its own. Doing it turned up a data gap: the interest
notification pointed at `/grow` rather than at the interest payment's
reference, so the feed showed that one twice until the seed was corrected.

**A glyph per nature, in a fixed place.** NN/g on list entries: pair the
important pieces with iconography, and hold every element in a fixed position
so the eye learns the row once. Eleven natures — bought, sold, shares sent,
added, received, sent, withdrawn, borrowed, repaid, lent, taken back, interest —
plus security and notice. The glyph is recognition; the tag beside it is the
answer for anybody who does not recognise the glyph, and it is what tells a
movement from an announcement.

**Day headers, compared against the row above.** Today, Yesterday, then the
date, emitted when the day turns rather than computed per row. Times are short:
their job is roughly how long ago, not exactly when.

Ordering by size is still in the address and turns the grouping off, because a
list ordered by size has no days in it. Ordering by who, by type and by
reference went with the table — a feed has no columns to sort. The statement is
where a row is proved.

**And the sweep was lying.** `all.sh` counted lines matching FAIL. A suite that
*crashes* prints no such line, so a dead suite read as a clean one — and ten of
them have been dead for several tiers while this file recorded "thirty-three
suites green". They died on selectors that moved under them: "Borrow money" now
opens a position page rather than a composer (11g.43), so `flows` was clicking
into a screen with no amount box on it and timing out.

That is rule 114 — a check must prove it looked — turned on the thing doing the
checking. `all.sh` now fails a suite that exits non-zero or prints a stack
trace, and it is in `scripts/` rather than in a scratch directory, because a
harness nobody can read is a harness nobody can audit.

The ten are listed in Still open. They are not this tier's regressions: every
one of them crashes at the previous commit too, which is how it was established
that they predate it rather than assumed.

129. **A test harness needs its own rule 114.** Counting failures is not the
     same as counting suites that ran. A runner that reports on output alone
     will report silence as success, and a suite that dies is silent. Check the
     exit code, and treat a stack trace as a failure.

### 11g.50 The ten dead suites, and two faults they were standing on

Ten suites had been crashing rather than failing, some of them for several
tiers, and 11g.48 caught the runner that was hiding it. This tier walked them.

Nine were selector repairs — a screen had moved and the suite had not — and
each is written up in one line because that is all it is worth:

- `flows`, `send`, `verify`, `states`, `phone-flows`, `ledger` were clicking
  into composers reached through a position page since 11g.43, or reading rows
  by a class the feed replaced in 11g.48.
- `settings` picked the *last* `.btn-primary` on Send. Send grew a second one —
  "Use this account", revealed when a typed account number resolves to a name —
  and it is hidden until then, so the suite was waiting six seconds for a
  button nobody can press. Visible ones only.
- `inflow` was written against three rail cards that are three tabs now, and
  against an Add money that asked for an amount before it handed over an
  account number. Its assertion is document order now rather than presence:
  the bank tab does carry an amount, under the details, for somebody who has
  paid and wants to watch it arrive. Nothing asks how much before it says
  where.
- `trade` and `token` were both buying a company the product refuses to sell.
  Coca-Cola and Nike are in the catalogue and outside the launch set, so their
  buy buttons are correctly disabled, and both suites were timing out on a
  refusal that is the product working. They buy Alphabet now — in the launch
  set, not paused, and not in the opening holdings, which is what "a first buy"
  actually needs. Meta looked like the better choice until the probe: it is
  seeded paused, which is a state worth having and a bad one to test a purchase
  through.

The tenth was not a selector at all. `token` asserts that the review carries
the gap to the real share, and it was looking for the words "real price". The
review said **Below Chainlink**. The composer behind it said **Below the real
price**. One fact, two names, one dialog apart — and the second of them is a
vendor's brand, which is the thing rule 37 and the plain-words pass exist to
keep out of a sentence somebody agrees to money on. The label is the
composer's words now; the source keeps its name in the value, where it is what
makes the number worth believing rather than a heading nobody asked for:

    Below the real price    1.24% · $166.77 on Chainlink, 15s ago

The refusal panel had the same fault twice over — "Venue price" against
"Chainlink" — and reads "Price here" against "The real price" now.

**And then the trail.** Chasing that wording meant reading page headers, and
the header was saying the name of the place twice. The breadcrumb ended on the
page you were standing on, drawn from the registry's label — which is written
to be *searched* — while the `<h1>` a line below it is written to be *read*.
Where the two agree that is a repetition. Where they do not it is a
contradiction, and on seven routes they did not:

| route | trail said | the page said |
|---|---|---|
| `/receive` | Receive money | Add money |
| `/withdraw` | Send to your bank | Send money |
| `/grow/earn` | Lend your dollars | Lend |
| `/grow/takeout` | Take back what you lent | Take out |
| `/invest/aapl/invest` | Invest in Apple | Invest |
| `/invest/aapl/sell` | Sell Apple | Sell |
| `/invest/aapl/send` | Send Apple to someone | Send Apple |

Neither name is wrong. "Take back what you lent" is what somebody types into
the palette and "Take out" is what a title should be at 18px, and the answer is
not to make one of them worse. It is that a trail is for the step you *cannot*
see. The step you can see is the title. So the trail names parents only, and
every step in it is a link — which is the whole job of a trail, and the last
one never was.

**The second fault was underneath it.** `trailTo` found a screen's root with
`DESTINATIONS.find(d => d.place === here.place && d.kind === 'place')` — the
first place in the group. Operations, the staff console, is filed under
`account` so that it sorts with the rest of the settings, and it is written
first. So every customer screen in that group — verify your identity, the risk
disclosures, the index of every screen in the product — told a customer they
were standing inside the staff console. Nobody had looked at that header,
because nothing in the sweep had ever read a breadcrumb except to check that
one existed.

The root is the place the screen actually sits under now: a prefix of its own
path if there is one, otherwise the first place in the group that is not
`staff: true`. Two lines, one new flag, no new `Place` — a Place is a tab in
the navigation and Operations is not one.

`names.mjs` grew the check that would have caught all of it. A crumb earns its
place three ways: it goes somewhere that is not here, it goes somewhere a
person could have come from — a tab in the navigation, or a step above this
path — and the page it opens answers to the name the crumb gave it. Run
against the old code it fails seventeen of seventeen trails, naming both
faults separately; that was checked before it was kept, per rule 114.

The sweep is thirty-four suites and all of them run. That sentence has not been
true in this file for five tiers.

130. **A trail is for the step you cannot see.** The page you are on is the
     title. A breadcrumb that ends on it either says the same thing twice or,
     where the label and the title were written for different jobs, says two
     different things about one place. Name the parents, link every one of
     them, and stop.

131. **A search label and a title are not the same string.** One is written to
     be typed at, the other to be read at the top of a screen, and a registry
     that serves both will be asked for the wrong one somewhere. Decide which
     surface gets which, rather than making one of them worse until they match.

### 11g.51 The doors answer with the field

A door on Home is 368 tall, navigates, and used to answer a pointer with a
green gradient washing up from its bottom edge. That is a light coming on. It
was the same wash wherever the cursor was, it told you nothing about where you
were pointing, and it put a colour under a title that is supposed to be the
loudest thing on the card. It is gone.

What answers now is the picture. Every field in this product is a few thousand
loose dots, and loose dots are a thing a hand can push through — so the pointer
pushes. Dots inside its reach drift away from it, hardest under the pointer and
fading to nothing at the edge, and drift home when it leaves. Nothing changes
colour. The picture is already the quiet half of the card and a colour arriving
under a title is the same competition by another name.

**The reach is 420px and the falloff is `t^1.6`,** which is two decisions
arguing and the argument is worth writing down. A tight reach gives a crisp
hole under the pointer and nothing at all when the cursor is up in the words,
where it spends most of its time on a card whose object sits in the opposite
corner. A wide one is felt everywhere but slides the whole field as one piece,
which reads as a picture being dragged rather than pushed. Between them: wide
enough that the words reach the object — from the title the nearest dots move
about 15px, which is a lean rather than a shove — and steep enough that under
the pointer the field opens a hole with a rim of dots pressed around it.

**And the corner.** The three objects were asked to move to the bottom right.
The first attempt changed one attribute — `xMinYMax slice` to `xMaxYMax` — and
made the pictures worse: every object in this file is composed into the left of
its box and dissolves rightward, because that is the one direction the drift in
`makeField` runs. Cropping from the right keeps the dust and throws the subject
away. It is not a crop, it is a mirror: the object goes to the far end and the
drift goes with it, so the dust still trails away from the subject rather than
piling up against it. `flip` does that, order preserved — `objectArt` wakes the
first n loose specks in the array, so a mirrored field wakes the same specks in
the same sequence and the reading of the portfolio is the same reading.

**The fields are at a third.** They were drawn at full ink and read as the
subject of the card: three tiles of texture with some words on them. A third is
the weight at which the title wins and the object is still an object.

**What it cost, and what that cost was.** The first working version ran at 19
frames a second — 53ms a frame, 123 at worst. The obvious suspect was the
thousand style writes, and the obvious suspect was wrong: the writes are
nothing. The cost was a `transition: transform 160ms` on every circle, which
meant a thousand transitions being *restarted* every frame. Taking it off took
the frame from 53ms to 16.7 — a clean 60 — and cost nothing visible, because
the pointer is already moving continuously and there is nothing for an eased
follow to smooth. The one movement that does need easing is the way home, so
that is the one that has a transition: a `.homing` class goes on for 260ms
when the pointer leaves and comes straight off again.

Two smaller things fell out of it. A dot moving less than half a pixel is not
moving, and dropping those is a real slice of a wide field. And the pointer is
converted into the field's coordinates off the matrix — `getScreenCTM()` —
rather than off the box and the ratio, because the field is cropped with
`slice` and a cropped ratio is exactly where doing it by hand goes wrong.

`hover.mjs` measures every hover in the product by the surface under the
pointer, and this is the first one that is not a surface change at all, so it
gets its own reading: at rest nothing has moved, under the pointer a hundred
dots or more have and the furthest has gone a long way, from the words some
have and the furthest has gone a short way, after leaving none have, and for
somebody who asked for no motion none of it happens at any point.

132. **A corner is a composition, not a crop.** Moving a picture to the other
     side of its frame by changing which edge survives the crop keeps the part
     that was meant to be thrown away. Mirror the composition and the light,
     the drift and the bleed go with it.

133. **A transition is a cost per element, per frame.** A thousand transforms
     is nothing; a thousand transitions restarting every frame is a third of a
     second of work. Transition the movement that needs easing — usually the
     one back to rest — and let the one that is already following a hand
     follow it.

### 11g.52 The same stir, on a picture drawn a fifth larger

The two product cards on Borrow & Lend take the effect the doors took in
11g.51, and their fields come down to a third with them. On these two it was
worse than on the doors, because the ramps put colour in the field: a green one
and an amber one, at full strength, under a title and a figure somebody is
actually there to read.

Giving them the stir turned up the thing 11g.51 had got away with. Reach and
push were in CSS pixels — "because that is the space a hand is in", which is
true of the hand and false of the picture. The doors draw their field at 0.37px
a unit and these cards draw theirs at 0.44, so the same 420px reach covers a
fifth less of the composition here, and a fifth less of a picture is a
different effect rather than the same effect on a bigger card. What has to stay
the same is what the field does: the same number of dots moving by the same
fraction of their own spacing. So reach and push are in the field's units now —
1130 and 81, about 94 cells and 6.7 — and the same pointer opens the same hole
in both. Measured: 80 units on a door, 81 on a card.

The one quantity that stays in pixels is the floor. Half a *drawn* pixel is not
a movement to an eye whatever it is to the arithmetic, and that one is
converted back through the matrix.

**And a second cost, which was not the writes either.** 2,291 dots is twice a
door's, and the frame went to 18ms with 38 at worst. The fix was not fewer dots
or a shorter reach: it was noticing that out in the tail of the falloff a dot's
offset changes by a fraction of a unit a frame however fast the pointer moves.
Rounding the offset to a whole field unit — under half a drawn pixel — and
skipping the write when it has not changed took the worst frame from 38ms to
25. On the larger field that is most of the field, most frames.

`hover.mjs` reads both surfaces and compares them in field units, which is the
only place the property this tier is about can be seen at all: pixels would
report the two as different and be right, and the effect would still be wrong.
Run against a pixel-defined reach it fails, naming 80 against 68.

134. **Say a size in the units of the thing it is a size of.** A reach across a
     picture is a number of the picture's own cells; a floor under what an eye
     can see is a number of screen pixels. Writing both in pixels made the
     first one wrong on the second surface that used it, and there is no
     surface count at which that gets easier to notice.

### 11g.53 Three doors across, not three doors down

The phone's Home opened with six hundred pixels of gateway. Three cards, two
hundred tall each, stacked — and the first thing that had actually happened to
somebody's money started at 1144 on an 844 screen. A screen and a half of doors
before a single fact.

A door only has to be big enough to open. The three are a row now: a glyph, a
word, 92 tall, one finger reaching all three without moving. Everything below
comes up by about five hundred pixels, which is what puts the feed on the first
screen — the activity heading lands at 626 and its first row at 672, both above
the fold, on the same screen as the balance and the doors.

What the tile drops, and why. At 110 wide the sentence is two words a line, the
percentage is a third line, the call to action is a fourth, and the dot field
is a smudge. Each of them was a good idea at 288. The glyph and the word are
the door. The field stays on the desktop, where a picture has room to be a
picture, and the glyph stays off it for the same reason — two of them would be
one too many.

The labels sit in a two-line box whether they need two lines or not, so the
three glyphs are at one height. A row whose icons step up and down reads as
three unrelated things rather than one rank.

**And the header underneath it was broken.** The greeting truncated to "Good
evening…", the Simple/Detailed chips sat on top of it, and the bell sat on top
of the line under that. Six controls across 390 pixels: an avatar, a search, a
bucket, a bell and two chips. The chips left. Simple/Detailed is a preference
somebody sets once, not a thing they flip on a visit, and it is in the nav
bar's panel now with the rest of the settings (11g.54). The greeting reads
whole again.

`viewToggle` moved from the Home screen into `shell.ts` on the way, because it
is chrome rather than screen content: it is in the header on a desktop and in
the panel on a phone, and one control written twice is two controls that will
drift.

### 11g.54 The capsule becomes the list

The reference was a screen recording of somebody else's app, and what is worth
taking from it is not a look. It is a structure, and the structure is that
there are **two objects down there rather than one bar**.

What the video actually does, frame by frame — 495 of them at 60fps, measured
rather than admired:

- A pill capsule of four icon-only tabs, about 67% of the screen wide, and a
  circle beside it whose diameter is exactly the capsule's height, with a gap
  of about 2.7%. The pair is centred as a group with equal margins, floating
  clear of the bottom edge.
- The active tab is a soft blurred patch behind the glyph. Not a filled pill —
  a light left on.
- Pressing the circle does not open a sheet. **The capsule becomes a panel**:
  same width, same bottom edge, growing upward. The tabs are gone while it is
  open. The circle does not move a pixel, and its glyph becomes a cross.
- The panel is a four-column grid of rounded-square buttons with the label
  *under* the button. Eleven items flowing 4 / 4 / 3, and the short last row
  stays where it falls rather than recentring.
- It arrives out of focus: a scale that is mostly across, from a narrower box,
  with a blur that resolves as it lands. The circle flashes lighter on press.

Two of those are decisions this file had already made in the other direction,
and both are worth saying out loud.

**The tabs keep their words.** The reference's are glyphs alone, and 11f.16 put
the words there on purpose: four unlabelled glyphs is a memory test, and this
product's whole thesis is teaching somebody their first share. The words stay.
What that costs is the capsule's height, and it is worth it.

**Which turned out to be why the fourth tab was broken.** "Borrow & Lend" is 78
pixels wide and a quarter of a 390 phone is 65, so it wrapped — and the second
line fell through the capsule's rounded bottom, because a 32px corner radius
eats exactly the place the fourth tab's second line lands. The fix is not a
shorter name. It is that a tab is as wide as its word rather than a quarter of
the capsule: Home is 48, Invest 50, Wallet 51, Borrow & Lend 91, and the slack
goes between them.

**The panel is the "more" sheet, in place.** Same seven places, same `?sheet=more`
in the address, so the back gesture still closes it and a reload still reopens
it. What changed is where it is drawn. This is the rule about not sending a
dialog to a screen of its own, applied to the one piece of chrome that was
still breaking it — and the button that opened it is under the thumb the whole
time, which a bottom sheet's close button never is.

The eighth thing in the panel is not a place. Simple/Detailed comes down from
the Home header (11g.53) and sits under a rule at the foot of the grid, with
its own label, because a preference in a grid of destinations is a preference
pretending to be a destination.

**And a menu is not a modal.** There is no scrim: the page above stays lit. What
a menu needs instead of a scrim is somewhere to press that is not the menu, so
there is an invisible catcher behind it, and Escape closes it, and so does the
button itself. Three ways out, because a menu with one way out is a trap on a
phone. Pressing a place in it navigates in **one** step rather than closing and
then going — those were two history entries and they raced, which is how a
press on Support landed back on Home.

`phone.mjs` holds the thirteen assertions: the capsule and the circle are
separate objects of one height, every label is on one line, the panel is the
capsule's exact footprint, the circle has not moved, nothing is under 44,
all three ways out work, and back from a place it sent you to is the screen you
opened it on rather than the panel again.

135. **A reference is a structure, not a look.** What was worth taking from
     eight seconds of somebody else's app was that the bar is two objects and
     the second one becomes the list. What was not worth taking was the thing
     it does that this product had already decided against for a reason it
     wrote down.

136. **A tab is as wide as its word.** Equal columns are a layout, not a
     reading. When one of four names is half again as long as the others, an
     equal quarter is the thing that breaks it, and the fix is to stop
     dividing by four rather than to shorten the name.

### 11g.55 A table is a shape for comparing across, and a phone has no across

Fifteen customer screens, audited at 390 rather than looked at. Three faults,
and one thing that looked like a fault and was not.

**A title beside three labelled buttons.** Activity read **"Acti…"** under a
two-line block saying Mark all read / Statement / Export. The company page did
the same with two pills and three buttons beside a company's name. It is the
collision 11g.53 fixed on Home, in two more places, and the answer is the one
the nav bar took: one thing visible, the rest one press away.

`headActions` is that rule as a component. On a desktop it is what it always
was — every action, labelled. On a phone it is the first one as a 44px glyph
and an overflow for the rest, except where the screen has a thing it is *for*:
a company page whose Buy button became an unlabelled glyph would be a company
page that had hidden its own point, so an action can be `strong` and keep its
words. A `said` entry is a state rather than an action — "All caught up" is
still in the list, because a control that quietly vanishes is not an answer to
the question it used to answer.

The menu is the question mark's popover, generalised. That machinery already
handled everything a menu needs and had been handling it for one caller: it
closes on the next trigger, on Escape, on a press anywhere else, and when the
app rebuilds its tree underneath it — which this app does on every state
change. `popover()` is the same code with the hint's content taken out of it.

**Five screens still drew a table.** Nine columns became four became three, and
three columns of eleven-pixel headers with sort carets on them is a spreadsheet
somebody has been asked to use with a thumb. Invest showed NAME / PRICE / TODAY
and fitted three companies.

`table()` takes a `RowShape` now and draws the same cells as the row anatomy
the activity feed already uses. Columns are named rather than numbered in it,
so a column moving in the table cannot silently move the phone's second line
onto a different fact. The lead cell keeps its own structure wherever it has
one — most of these are already a two-line, or a glyph beside one, because that
is what they are on a desktop too — so the detail goes *into* the structure
that is there rather than around it. Wrapping a two-line in a two-line indents
the row inside itself.

Invest gets the shape that needed the most from it: the company, its price with
today's move stacked under it, and the bucket button still on the row, because
deciding while you scan is the point of a bucket and it is the one control
there that is not "open this company". Six other columns are on the company's
own page, which is one tap away.

**Two hundred pixels of controls before anything had happened.** Activity spent
a search field, five filter chips wrapped onto two rows, and an order row —
420 of an 844 screen. The five go behind one chip that says which one is on and
carries the unread count, and the order goes behind another beside it. 298
now, and four rows of the feed are on the first screen instead of one and a
half.

**And the thing that was not a fault.** Four routes have a different `<h1>` on a
phone than on a desktop — `/invest/aapl/invest` says "Apple", not "Invest".
That is the composer correctly presenting as a bottom sheet over its parent
screen, which is item 54's decision; the sheet's own heading says "Invest". It
is checked, and it stays.

Two things fell out of the audit that nobody had asked about. The two product
cards on Borrow & Lend were 578 tall each on a phone, so Borrow started at 782
on an 844 screen: one card a screen, and the second only findable by scrolling
past a picture. The desktop keeps its 442 of field exactly as it was asked for;
the phone's band is 160, which is what the object needs to still read as an
object at 350 wide, and both cards are on the first screen. And `contrast.mjs`
found the "Open for trading" pill at 4.44 against the 4.5 a 13px pill needs in
the light theme — which it had been finding for some time, because **it printed
its findings and never failed**. That is rule 129 again, on a second harness:
it says FAIL now, and the tint moved rather than the ink, since the ink is
every positive figure in the light theme and already clears on the page itself.

137. **A component that changes shape by width belongs in the component.** The
     phone's version of a table is not a screen's problem to solve five times
     over — it is the table's, and the screens describe what their columns
     mean rather than how they stack.

138. **A control that vanishes has not answered the question it used to
     answer.** "All caught up" is a sentence somebody needs precisely when
     there is nothing left to press. Moving an action into a menu is fine;
     letting the state it replaced disappear is not.

### 11g.56 A tablet held upright

The tablet tier has existed in CSS since 11f.20 and had never been looked at.
Eight sizes, both ways up, audited rather than admired — and the tier that was
defined turned out not to be the one that needed the work.

**900 and up is fine.** Sidebar, real tables, header actions labelled, filter
chips on one row, both products beside each other. No overflow, no clipped
title, at 900, 1024, 1112, 1194 or 1366. The one thing it spends is 192px of
gutter at 1366, which is a decision rather than a fault.

**Everything below 900 was the phone.** `MOBILE_MAX` is 899, and 768, 810 and
834 are every iPad there is in portrait — so an iPad Pro held upright was
getting a layout drawn for 390 pixels, at twice the width. None of it survives
being stretched:

- Three doors 92 tall across 260 wide each: letterboxes with a glyph floating
  in the middle of them.
- A row with the name at one edge and the figure at the other, and four
  hundred pixels of nothing between.
- A 160px band of picture pulled across 754.
- Body text running to a 794px measure.

The shell is right and stays: a finger is still a finger at 834, so the
floating nav bar, the 44px targets and the sheets from the bottom are all the
correct answers. What was wrong was every decision underneath them, and all of
those were decisions about width.

So the doors get their pictures back — 249 wide against the desktop's 288,
which is very nearly the box those compositions were drawn for — and the glyph
that stood in for them is put away. What splits in two goes in two: the task
beside the feed on Home, the company list in two columns, both products side by
side. What does not split stops being one very wide column instead: Activity's
feed is grouped under day headers, and a day whose rows carry on in the next
column is a day nobody can read, so it is capped at 620 and left alone.

**The trap, and it is the whole reason this tier has a height in it.** A phone
lying on its side is 844 wide. That is inside the band. It is also 390 tall,
and two columns of doors with the pictures back is exactly the wrong answer for
it. `(min-height: 700px)` is what tells a tablet from a phone that has been
turned over, and `isWideTouch` in responsive.ts is the same query in
TypeScript — the two have to be changed together, which is written on both of
them.

One thing that had to be undone twice. The phone tier hands every child of a
row `width: 100% !important`, which is right for a phone and is why the two
product cards came back as a column with the second one off the side of the
screen. A width taken with an `!important` has to be given back with one.

`frame.mjs` reads both sizes and the trap: the shell is still the finger's, the
doors are 300 tall with their art and no glyph, the pair is a grid, both
products are beside each other and level, nothing on any of the forty-three
routes runs off the side — and a phone at 844×390 has none of it.

139. **A breakpoint is a width, and a device is not.** The band a tablet held
     upright occupies is the same band a phone lying on its side occupies, and
     they want opposite layouts. Where a rule is really about how much room
     there is *in both directions*, ask about both.

### 11g.57 A back door into the same shop

The pass over the whole product turned up fifteen things. Three of them were
blocking, and one of those three was wrong: see the end of this section for
what the probe got wrong and why, because the mistake is more useful than the
finding was.

The first two were the same mistake in two places. The product has one gate in
front of buying — `refusals()` in catalogue.ts, seven checks, returned as a
list rather than a boolean so that a trade refused for two reasons says both.
Every composer runs it on every keystroke. The bucket did not run it at all.

So: open Coca-Cola, which is verified on Base and not in the approved launch
set, and the composer refuses it in as many words. Press the `+` on the same
company in the market list instead, go to the bucket, press Buy all 1, and you
own it. `$50.25`, a receipt, a row in the ledger, a holding on the home screen.
Every check in the product, walked round by pressing a different button on the
same row.

The second was the same hole with the product's own hand on it. The last screen
of the intro offers three companies to start with, and two of the three —
the S&P 500 fund and Coca-Cola — were outside the launch set. Pressing either
of them filled a bucket and went to pay for it, so the first thing the product
asked of somebody was the first thing it should have said no to. It did not say
no, because of the hole above; had the hole been closed first, the intro would
have ended on a refusal instead. Both readings are bad and they are one fix.

**The door and the till are different questions.** `addToBucket` now refuses
anything outside the launch set, and the `+` is not drawn on those rows at all
— the state is drawn where the button was, which is the market list's version
of the pill the company's own page already carried. `bucketAdd` on the company
page goes the same way, and so does its entry in the phone's overflow, beside
the Buy button that was already withheld there.

But the door only asks what can *never* be bought. A company that operations
paused this morning is a perfectly reasonable thing to put by for this
afternoon, and refusing to let it into a bucket would be the product being
strict where it has no reason to be. So the till asks the harder question:
`bucketRefusals()` runs the full `refusals()` over every line, with the
switches and the paused assets in it, and both the bucket screen and the
payment sheet read it. META is in the seed as launch-set-and-paused, which is
exactly that case, and `bucket.mjs` walks it.

`payBucket` is a loop over `buy`, so a basket has to be refused for every
reason a single trade is refused. Checking only the launch set at the till
would have left a paused asset or a stale reference price to be discovered one
order into a payment that cannot be undone.

**Three ways to be stopped, in the order that costs the fewest trips.** Once
the till checks everything, the bucket screen has three things it might have to
say and can only say one. Ordering them turned out to matter more than
expected, and the suite found it: typing `99999` into a row produced *"this
order is too big for the book"*, which is true, and which sends somebody with
`$2,480` off to think about market depth instead of about money.

  1. A company the product will not sell. First, because taking it out changes
     the total — somebody told to add money and then told to take a company out
     has been sent twice for one problem.
  2. Not enough money. `Add $X to cover this`, as before.
  3. The order is too big for the book. Last, because a number you cannot pay
     for is a number that is about to change anyway.

`aboutTheAmount()` in catalogue.ts is the one place that says which refusals
are about the size of the order rather than about the company. The two kinds
need different sentences (*"try a smaller amount"* against *"take it out to pay
for the rest"*) and different buttons, and the third case gets a real one:
`Change the amount for Apple`, which focuses and selects that row's field. The
fix is on this screen, so the button goes to it.

**The refusal's own words, not a second set of them.** Every line the bucket
shows is the `title` from the refusal that produced it. There is no second
wording of *"METAc is paused"* anywhere in bucket.ts, which is rule 37 applied
to a sentence rather than to a noun.

140. **A queue of purchases is a purchase.** Anything that ends in a payment
     runs the checks the payment runs. A second way to reach the same till is
     a second front door, not a shortcut, and it needs the same lock.

141. **Ask the cheapest question first.** When several things can stop one
     action and only one of them can be said, say the one whose fix changes
     the others. Ordering reasons is part of writing them.

142. **A screen that offers a choice must be able to honour every one of it.**
     The intro's three cards were a promise the catalogue could keep for one
     of them. A list of things to press is a list of commitments.

**And the one that was wrong.** The third blocking finding said that with no
connection the final button does nothing at all — press it and nothing
happens, no message, no refusal. It was wrong, and the way it was wrong is
worth writing down: the probe read `.scrim` and sliced the result at 120
characters. The refusal is real, it is `sheets.ts` line 114, and it says *"No
connection, so nothing was sent. Try again when you are back online."* — it was
simply past the 120th character. A measurement that crops its evidence will
report the crop.

What was actually left was smaller and still worth fixing: the button looked
ready right up until it was pressed. Whether there is a connection is known
before the sheet is drawn, so it is said there now, and the button that cannot
work is not drawn — the same treatment an expired rate already got two tiers
ago. The check on the button stays as the floor under it. The held-rate path
arrives at the same place by its own route, because the quote request rejects
while offline and leaves no confirm button either.

`bucket.mjs` grew nine assertions and every one of them fails against the code
as it was an hour ago; `ftue.mjs` grew three, one per card, because the check
that was already there only ever pressed the middle one — which is why it never
caught that the other two were unbuyable.

### 11g.58 Four doors, and the one that led nowhere

The audit's four serious findings, and one the person using it found while
these were being fixed, which was the worst of the five.

**The shop window.** Nine of the thirteen companies cannot be bought. 11g.57
put the state on every row where the `+` had been, which is honest and is also
nine rows of scrolling past things that are not for sale. Honesty about what
you cannot do is not the same as help doing what you can, so there is a filter
now: one press, `?open=1`, and the list is the four. Off by default, because
a market that hides what is coming looks smaller than it is — which is the
whole reason the nine are on the page.

It is not a seventh category. A category asks what kind of thing this is and
the filter asks what you can do with it, and the two are not alternatives —
somebody can want the funds *and* want them buyable. So it wears a tick, it
stands on the other side of a hairline rule, and it does not scroll away with
the categories on a phone. The tick is drawn whether it is on or off, at a
third opacity: a chip that grows a glyph when pressed moves the six chips
beside it, and a control that shifts the row under your thumb is a control you
press twice.

An empty list now says which of the two things emptied it. Asking for the
buyable companies inside ETFs — where there are none — used to answer "try
another company, fund or ticker", which sends somebody to fix the wrong thing.

**The two doors on Borrow & Lend.** "Borrow money" opened a page headed
*Borrowing* whose own main button says *Repay*. "Lend dollars" opened
*Lending*. Neither destination has an amount field on it. That is the old
"Convert Cash" fault — a door promising an action and delivering a report — in
two more places, and it survived three tiers because `names.mjs` reads the
gates on Home, the rail, the quick actions and the wallet's two doors, and a
product card is none of those.

The doors are named for what they open: **See your borrowing**, **See your
lending**. The composers stay one press further in, from the report's own
primary button, which is where somebody who has just read their balance
actually wants them. `names.mjs` presses both cards now rather than reading
them, because the CTA is a button with a handler and not an anchor — following
what a control does is a check, and reading an attribute it does not have
would not have been one.

**The link.** Ten card headers said "See all", which names nothing and which
rule 49 has forbidden since the tier that wrote it. They say where they go
now: *All activity*, *All trades*, *All payments*, *All borrowing and
lending*. The one on Home mattered most — on a phone it is the whole route to
Activity, which is the finding this started as.

**One company, two addresses.** The Invest list linked to `/invest/aaplc` and
the registry, the trail and every other internal link used `/invest/aapl`.
Both render Apple, so nothing broke and nothing caught it; what it costs is
two bookmarks, two shared links, and a trail that disagrees with the address
bar about where somebody is standing. `catalogue.ts` had already decided which
one wins and written down why — the suffix arrived after every route in the
product was written against the bare symbol. Nothing builds a company's
address by hand any more: `pathOf()` does, in one place, and the sixteen sites
that were building their own now call it.

**And the one the audit missed.** On a phone, Activity and Account had no way
back and no lit tab. They are places, so on a desktop the rail lights them and
that is the whole answer; on a phone the capsule holds four tabs and these two
live behind More, so nothing was lit anywhere. Four unlit tabs, a grey button,
and a screen you reached through a menu that no longer exists. That is what a
missing back button feels like, and it is what it was reported as.

There is no step above a top-level place to go back to, and inventing one —
a ← *Home* on Activity — would claim a hierarchy the rest of the product does
not have, where all six places are siblings. What was missing is the thing a
tab does, which is say you are here. So the More button lights, by the same
recipe the tabs use: the light left on, the word at full contrast. The panel
marks the cell you are standing on. And the four tabs are still four ways out,
one press each, which is the same answer the desktop rail gives.

It was already known in the code and only ever said to a screen reader, and
said wrongly: `aria-expanded` was set true on Activity, which claims the menu
is open when it is shut. Expanded is about the panel and current is about the
place. They are different facts and they are two attributes now.

`names.mjs` walks thirty-one routes at 390 and fails if any of them offers no
back link, no trail, no lit tab, no lit More and no close on its sheet. It
found the three; it now guards all thirty-one.

143. **Where you are is owed at every width.** A navigation that answers the
     question with a lit tab has to answer it some other way wherever that tab
     does not exist. A screen that lights nothing reads as a screen you have
     fallen into.

144. **An address is a name.** Rule 37 stops at the words on the page and it
     should not: two URLs for one thing are two names for one thing, and the
     trail, the bookmark and the shared link will disagree about which. Build
     them in one place.

145. **Saying what you cannot do is not the same as helping with what you
     can.** A row that admits it is unbuyable has been honest. The person
     scrolling past nine of them still has to do the work. Both are owed, and
     they are two different pieces of work.

### 11g.59 The ground stops competing with the words

The last eight of the audit, and three more of its findings that did not
survive being re-checked. That is four wrong out of sixteen, all four wrong the
same way: a measurement that could not see something reported the thing as
absent. 03 sliced a dialog at 120 characters. 15 said the empty bucket had no
action and it has had one all along, drawn by the same helper every other empty
state uses. 12 said Send opens with nothing to do, on a screen carrying four
labelled cards, four people, two banks and two forms. 13 said the statement had
nothing to press, and it had one button — in the wrong place, which is a
different and smaller thing. **A finding is a measurement, and a measurement
that cannot see something is not evidence that the thing is not there.**

**The fields.** Three palettes were in use: the text greys for the gateways,
green for lending, amber for borrowing, and a purple cell inside the first of
them. The top rung was `#dcdce0`, which is text white. All of it sat under one
flat `opacity: 0.34` chosen against a near-black card and then applied
unchanged to a near-white one, where a third of a pale grey is a ghost.

So a picture behind a heading was painted in three hues, reaching full
contrast, at a strength tuned for the wrong ground. That is not ground. It is a
second foreground, and the two of them fight — which is what "noisy and
distracting" means when somebody says it about a decoration.

One ramp now, four rungs, all grey, living in the lower half of the range;
`--field-*` rather than `--dot-*`, because the loose dots — the coin that spins
on a buy, the burst out of the bucket — are a different job and want to stay
bright. And the veil is a token with a value per theme rather than one number,
because matching two grounds that are not the same measurement is done by eye.

Nothing is lost by dropping the hue, because the hue was never what a field
said. What it says is how much of it is awake, and that is a count of cells.
`objectArt` lost its `ramp` parameter along with the two ramps, and
`--lend-*`/`--owe-*` went with them.

**The disabled button.** `opacity: 0.4` over the primary's own fill, measuring
3.25:1 in dark and 2.52:1 in light — the least readable label in the product,
on the one control somebody is staring at while working out why they cannot
continue. WCAG exempts disabled controls, which is why the contrast sweep never
flagged it, and is not a reason for it to be unreadable.

A state is a pair of colours, not a dimmer. `--off` sits one rung below
`--control` so the button reads as recessed rather than as a secondary, and
`--off-ink` clears 4.5 on it: 5.39:1 in dark, 5.69:1 in light. `contrast.mjs`
drives two composers to zero and measures the result, because this is the one
state a sweep of rendered text cannot reach on its own.

**The advert.** 202 pixels of permanent chrome on all forty-three routes,
advertising a thing that does not exist, to somebody who has already signed up,
with no way to close it. An advert nobody can close is not an advert, it is
furniture. It is put away by the same mechanism the home tasks use — one list,
`prefs.putAway`, so Account's row already brings it back and there are not two
lists of dismissed things. That row stopped saying "Reminders on Home", which
was true while the tasks were the only thing in it.

**Four quick amounts, one answer.** Borrow offered `$500 / $1,000 / $1,480 /
Max` against a `$250` ceiling. Every one of them clamped to $250, and two of
the four were the same number before the clamp ran. A row of choices where
every choice gives the same result is not a row of choices.

The screen proposes, because it knows what a sensible amount of its own thing
looks like. The ceiling disposes, because only the composer knows what this
account may move today. Anything above the ceiling is dropped, duplicates go,
and where fewer than two survive the ceiling proposes for itself — quarters,
rounded down to something a person would say out loud. Borrow now offers `$60 /
$120 / Max`. Down and never up: a proposed half that is more than half is a
chip that lies about itself.

**Eighteen stops to the button that spends money.** Nine of them are the
sidebar, which the skip link has answered since 11f. Five are inside the
screen: the amount field and the four quick amounts sitting between it and the
button. Enter in the field is the action now, through the same guard the button
runs — a keystroke that skips a check the button makes is a second door. The
promo going takes one more, so it is seventeen for anybody who tabs the whole
way and two for anybody who does what a form invites.

**The end of the statement.** 1,318 words proving the ledger balances, and one
`btn-sm` in the side column 3,772 pixels above the bottom of a 5,792-pixel
page. Somebody who read the whole thing arrived at nothing. The way on is at
the end now, where the reading stops.

**And the tenth verb.** *See your lending → Lending → Lend more → Lend →*
"Move $500.00 in". Nine of the ten composers name their own verb on their own
button. That was the tenth.

**Two checks that were not checking.** Both turned up while this tier was being
verified, and both are the same fault as the four wrong findings above.

`live.mjs` counts how much of each field is awake by matching `dot-sleep` in a
cell's `fill`. The token became `field-sleep` here, so nothing matched, every
cell counted as awake, and the count became the number of circles in the
composition — a number that cannot change. The gauge check under it then
compared three constants and passed. It matches the rung rather than the
token's full name now, and it fails first if it cannot find a sleeping cell at
all.

`phone.mjs` watches for a heading that clips. Home's heading is a greeting, so
its length is a function of the time of day: "Good afternoon, Chinaza" is 296px
in a 290px box at 390, and "Good morning, Chinaza" is not. The check passed
every morning for three tiers and failed the first time this session ran into
the afternoon. It measures the longest greeting the heading can hold now,
whatever the clock says — and the greeting takes the width it is given, down to
a size still larger than a page name.

146. **A measurement that cannot see something is not evidence of absence.**
     Four of sixteen findings were wrong, and every one of them was a probe
     reporting its own blind spot as a fact about the product. Before writing
     down that a thing is missing, check that the instrument could have seen
     it.

147. **A state is a pair of colours, not a dimmer.** An opacity applied over a
     whole control veils the one part of it that still has a job — its label.
     Wherever a control has to look different, give it colours; save opacity
     for things that are genuinely fading.

148. **The screen proposes and the ceiling disposes.** A screen knows what a
     sensible amount of its own thing looks like; only the composer knows what
     the account may move today. Offering a shortcut that is about to be
     clamped is offering a press that does nothing.

149. **A check whose input is the clock is only sometimes running.** Anything
     the product derives from the time, the date or the account's own state
     gives a suite a different question every run. Feed it the worst case
     rather than whichever case turned up.

### 11g.60 The trail ends where you are

Three things, and the first two are the same thing.

**The trail stopped at the parents.** 11g.50 took the last step off it, and the
argument was good: the last step of a trail is the page you are standing on,
that page is the `<h1>` one line below, so printing it again is a repetition
where the two agree and a contradiction where they do not — the registry's
label is written to be searched ("Take back what you lent") and a title is
written to be read ("Take out"). Seven headers named one screen twice.

What that missed is that the contradiction was the fault and the repetition was
the price of the fix, and the fix chosen threw away what a trail is for. Asked
where the routing was on Invest and on Borrow & Lend, the answer was that a
person three steps into an errand could see the steps they had passed and not
the one they were on. So the trail ends where you are, and the contradiction is
solved properly: the last crumb takes its words from the screen's own title,
not from the registry. It is not a link — a crumb you can press to go where you
already are is a control that does nothing — and it is a rung quieter than the
steps that are.

A trail of one step is still no trail: a place lights its own row in the
navigation and that is the answer at the top level.

The two Borrow & Lend positions were the only screens under a place with no
trail at all, because asking for a `back` link suppressed it. One target is the
right answer on 390 pixels and the wrong one on 1440, where the question is not
only how to leave but where you have been — so a header with both takes the
trail where there is room for one and the single step up where there is not.

And `/invest/aapl/invest` was headed "Invest", which is the name of the place it
sits inside: the trail read *Invest › Apple › Invest* the moment it started
naming where you are. Invest is the place, buying is what you do in it, and the
button on the company page that opens the screen already said Buy. It is
**Buy** now.

**Send was four cards, and then it was none of them.** Someone on Tokkenly,
your own bank, somebody else's account, a Base address — and the moment you
picked one, the composer replaced the lot, so the way you had chosen stopped
being on screen. Picking the wrong one cost a trip back, and the trail said
*Wallet › Send money* at every step of an errand with three of them.

It is the shape Account already uses: the ways in a rail on the left, the one
you picked filling the panel on the right, and the whole errand happening in
that panel — the list, then the amount, then the review, which stays a dialog
because it is a commit. The rail never moves, and the row you are on stays lit
while the review is open.

The two bank cards became one. They were split because one needs a name check
from the bank and the other does not, which is a fact about the second step and
not a reason for two doors: a bank account is a bank account, and whose it is is
the first thing the panel asks.

Add money got the same treatment, from three chips to three rows, and
`/receive` — which was a second name for the Base one — goes to it.

**And every way has an address.** `/send/tokkenly`, `/send/bank`, `/send/base`,
`/addmoney/bank`, `/addmoney/base`, `/addmoney/card`. That is what lets the
trail name the step, because a trail is built from an address; it is also rule
144 applied to a screen that was six places at two addresses. Everything that
pointed at the old ones goes to the new ones — `/send?to=`, `/send?rail=chain`,
`/withdraw`, `/convert`, `/receive` — rather than rendering a second copy of
the same place.

A redirect during a render is a trap worth writing down. `go` calls the route
handler synchronously, so redirecting inside a render paints the destination
and then has the calling render's own result mounted on top of it: the redirect
works and is immediately undone. It goes in a `queueMicrotask`. Two of them
queued at once is a second trap — the picker queues one of its own, and the
second landed last and dropped the query the first was carrying.

`names.mjs` was written against the old contract and is written against this
one: every step but the last is a link that goes somewhere genuinely above
here, and the last is not a link because it is here. It also learned that a
crumb pointing at a rail-and-panel screen is answered by the lit row rather
than by the title, which is how Account has worked since it was split and was
never checked.

150. **A trail that stops at the parents answers half the question.** Where you
     came from is only useful beside where you are. If the two disagree, fix
     the disagreement; do not delete one of them.

151. **A control that is still needed after it is used stays on screen.** The
     ways to send were a question the screen asked and then threw away, so
     changing your mind cost a trip back to a screen that no longer existed.
     Anything a person may want to revise belongs beside what it produced.

152. **Redirect after the render, never during it.** A router that dispatches
     synchronously will run the new screen inside the old one and let the old
     one win. The fix is one queue tick, and the symptom is a redirect that
     looks like it did not happen.

### 11g.61 The index or the thing, never both

11g.60 gave Send and Add money a rail on the left and a panel on the right, and
the phone got the same two pieces stacked. So on 390 pixels the screen read:
trail, title, *the three ways again*, and only then the thing you had asked
for. The people list started at 456 of an 844-pixel screen. Two hundred and
forty-four of what it had lost were three rows saying, a second time, what the
trail one line above already said — and the row you had chosen was lit, with
the two you had not sitting between you and the list you came for.

Account has had the answer since it was split: at this width it drops its index
entirely and gives the group the whole screen. It was the model for the rail
and it was the model for this too. The way you picked is the screen now, and
the trail's middle crumb is how you get back to the three. The panel starts at
188.

**Which leaves: where do you pick one?** It was a page — `/send` on a phone
held a title, three rows and nothing else, and closing it had nowhere sensible
to land. A question with three answers is a dialog. It comes up from the bottom
over the wallet, so pressing Send does not cost you the screen you were
reading, and closing it puts you back exactly where you pressed. Picking a way
takes you to the way. That is rule 151 running the other direction: the control
is still needed *before* it is used, and the screen it is used from should
survive it.

**And the two of them had stopped agreeing.** `/send` on a phone asked. Add
money went straight to Bank transfer without asking, because its redirect was
unconditional while Send's was gated on the width. Same question, same width,
two answers. Both ask now, and an address that already names a way — or that
has a dialog open on it — still goes where it says.

**`/addmoney/card` was three names and none of them was Card.** Card funding is
switched off in the seed, and the way it was switched off was to fall the tab
back to bank: the address stayed `/addmoney/card`, the trail read *Bank
transfer*, and the panel handed over a naira account number. Reachable from
search in one keystroke — "debit card" returns exactly one hit — and from any
bookmark. The switch decides what the card panel *says*, not which panel you
are standing on. It says Card, it says Paused, it says nothing is wrong with
your card, and it offers the two ways that do work.

The rail's card row was also `disabled`, which is a door nobody can come back
through — the only routes left to that screen were the two that reached the
wrong one. A door that vanishes makes people think they misremembered it; a
door that cannot be opened is a label. It opens, and what is behind it says
why it is shut.

The switch's own `effect` line still claimed the card rail *disappears* from
Add money, which stopped being true in 11g.47, where a rail that is off started
being shown as off. The console had been describing a build it had outlived.

**The wallet's own two doors had stopped matching.** Send went to `/send`; Add
money opened a dialog in place, on the argument that handing over an account
number does not need a screen change. That was true of the account number and
not of the question in front of it — and once `/addmoney` started asking which
way, the door that skipped the ask meant Add money behaved differently
depending on which control you pressed. Both doors are addresses now, and both
end up asking the same question in the same shape at the same width.

That leaves the `add-money` dialog with no door — it is still registered, still
addressable at `?sheet=add-money`, and still covered by `sheets.mjs`, but
nothing in the product opens it. It is either a dialog wanting a caller or a
dialog wanting deleting, and it is written down here rather than guessed at.

153. **A narrow screen shows the index or the thing, never both.** There is one
     column, and an index repeated above the thing it led to is the width spent
     twice on the same sentence. If the index is still needed, it is a dialog;
     if the way back is all that is needed, the trail is already carrying it.

154. **A switch changes what a screen says, not which screen you get.** Routing
     around a paused feature leaves an address, a trail and a panel disagreeing
     about where somebody is standing, and search will keep sending them there.
     Turn the door grey, leave it openable, and let the room explain itself.

### 11g.62 A light around the thing that just happened

Asked for a more celebratory confirmation, and given the thing itself to look
at: Spectrum UI's Beam Card, and inside it `border-beam` by Jakub Antalík
(MIT). Two beams on that page — one that travels the edge and one that
breathes. The breathing one.

**What was taken, and what was not.** The install line is
`shadcn@latest add @spectrumui/beam-card`, which wants shadcn, React 18 and
Tailwind; this product has none of the three and no runtime dependencies at
all. But the React component's whole job is to build a stylesheet string, so
what came across is the recipe, not the package: three stacked layers of radial
gradient — a one-pixel ring on the sheet's own edge, a soft core six pixels
beyond it, a wide halo past that — and seventeen custom properties breathing
their size, position and per-corner opacity on seventeen periods, none of them
a multiple of another. That last part is why it reads as something alive rather
than as a pulse, and it is why the breath is driven from one frame loop capped
near thirty frames a second rather than from keyframes: seventeen numbers out
of step is not a thing CSS can say in one animation. Geometry, blur radii,
phase offsets and opacities are the shipped `pulse-outside` figures.

**Two deliberate departures, and one forced one.**

The palette. It ships nine hues on a rainbow, cycling a full hue revolution
every fourteen seconds. Dropped in here it would be the loudest thing in the
product, and 11g.59 spent a whole tier taking colour *out* of the ground so the
words could be read. So the nine slots are nine greens — the product's own —
and the revolution is narrowed to fourteen degrees either side, which keeps the
light moving between a cooler and a warmer green rather than through
everything.

Brightness, which followed from that. The shipped multiplier is 1.9, and on
nine hues blowing a channel out only slides you along the rainbow. On a single
green it slides you off it: blue clips first and the whole beam reads teal. The
first build was measurably correct and visibly the wrong colour. Pulled back to
1.45, with the layer opacities lifted to buy back the light that gave up.

And the geometry, which was not a choice. The component sizes its glow in
pixels tuned for a card about 348 by 200, and pulls the layers in with
`scale(0.95, 0.9)` so the light hugs rather than boxes. On a card that leaves
the halo spilling about seventeen pixels past the edge. On this sheet — 480 by
675 — the same numbers put the halo at 513 by 662, which is *narrower than the
sheet it is supposed to be glowing around*: the entire effect rendered
faithfully and then hid behind the panel. The blobs are proportions of the
reference card now, and the outsets are percentages of the sheet. `sheets.mjs`
measures the spill on both axes, because a halo that has vanished behind its
own card looks exactly like a halo nobody wrote.

**Where it goes.** Every outcome that is glad about itself: Sent, Paid, Sent
shares, Bought, Sold, Borrowed, Repaid, Lent, Taken back. "Still settling" gets
neither the coin nor the beam, for the reason it already got neither the coin
nor the wash — that one has not come back confirmed, and a product pleased
about its own silence is a product lying.

The coin stays. They are different jobs: the coin is the moment landing, the
beam is the frame being pleased about it, and the coin is inside the sheet
while the beam is outside it. Which is not a figure of speech — the beam
*cannot* be inside. Two of its three layers sit behind the panel and are only
ever seen where they spill past its edge, and the sheet is a scrolling box with
`overflow: auto` that crops them to nothing. So the panel is wrapped, and the
wrapper is what breathes.

On a phone the sheet comes up flush to the left, right and bottom of the
screen, so the light has one edge to spill from and the other three go over the
side. That is the right answer and not a fault: the top edge and its two
corners are where the eye already is when a sheet arrives.

Somebody who has asked for less motion keeps the halo and loses the breath. The
frame loop never registers, the seventeen properties hold their initial values,
and the confirmation is still framed in green.

155. **A ported effect keeps its numbers and loses its dimensions.** Opacities,
     periods, blur radii and phase offsets travel; anything measured in pixels
     was measured against the box the original sat in. Re-express it as a
     proportion of the box it is going into, or ship something that renders
     perfectly and cannot be seen.

156. **An effect that is invisible fails silently, so check the geometry and
     not the styles.** Every computed value can be correct while the thing is
     hidden behind the object it decorates. Assert the overlap — how far it
     reaches past what it is drawn around — because that is the claim, and it
     is the one a screenshot of a dark sheet on a dark scrim will not make for
     you.

### 11g.63 A name, the market beside it, and one Buy

A company page carried a kind, a trading state, Follow, Add to bucket and Buy
across the top: five things beside a name, two of which were never controls at
all. Together they read as a toolbar, and the two pills read as buttons that did
not work. Each has a truer home, and the header is a name.

**The two pills are facts, so they are rows.** Company or ETF, and whether it can
be bought — these are things about the token, and the card that explains the
token is where the other things about it already live, beside the reference
price and the multiplier. The colour survives the move: "Not open yet" is the
reason there is no Buy button on the screen, and a grey row would leave that
unsaid. The phone had worked this way since 11g.43, which dropped both pills out
of its header for exactly this argument; the desktop simply never got it.

**Follow and the bucket sit beside the price.** Both mean "come back to this",
and the price is the thing you would be coming back to look at. The bucket is
the plus the market list carries, not a labelled button: a second call to action
standing next to the purchase is two things asking to be pressed. Follow stops
going primary when you are not following — the loudest button on a screen should
not belong to a control that changes what a list shows you.

**And Buy was on the screen twice**, in the header and on the position. Once
now, and in a different place at each width, because the two widths are not the
same problem. On a wide screen the position card is beside the chart and on
screen the whole time. On a phone it is the last of six cards and the button
landed 2,876 pixels down a 3,232-pixel page — the one thing the screen is for,
off the end of it. So a phone gets a standing bar at the foot and the card gives
its button up. Sticky rather than fixed, and sharing a container with the bucket
bar so the two stack instead of landing on each other.

**The market comes with you.** All thirteen companies as a strip along the top,
each with its name, its day and its year drawn small; the one you are on is lit
and is scrolled into view on arrival. Swipe the page and it pages to the next
company; the strip scrolls sideways under a thumb of its own; left and right do
the same on a keyboard, which is also what makes the feature reachable without
a pointer. A company page was a dead end before this — you arrived from Invest,
read it, and went back to the list to reach the next one.

Two gestures on one screen work only because the page refuses any drag that
starts inside something that owns the horizontal axis: the strip, the chart,
a table that scrolls sideways. And it refuses anything under 64 pixels or
steeper than 1.6 to 1, because a thumb travelling up a long page is never
perfectly vertical and paging the screen out from under somebody who was
reading it is the worst thing this gesture can do.

The sparklines are each company's own year. The receipt's version pins the
percentage at a constant, which nobody can catch on a screen showing one
company; thirteen side by side would have drawn thirteen identical climbs.

**And two things the checks were not seeing.**

`trade.mjs` asserts that the buy composer keeps its button on screen on a phone.
It was reading the first `.btn-primary` in the document — and on a phone the
composer is a dialog *over* the company page, which had a Buy in its header at
bottom 164. So the check passed for years by measuring a button on the page
behind the thing it was checking. Taking the header's Buy away is what made it
look, and what it found was the composer's own button at 891 on an 844-pixel
screen: 127 pixels of a purchase dialog below its own fold, against item 61's
rule that no dialog scrolls on a phone.

Fixed by folding the composer's terms on a phone to the three that are money —
what it costs, the fee, what it comes to — with the rest one tap away and all of
them stated again on the review, which is the commit point. That got most of the
way; the last of it came out of the dialog's own chrome, and the keypad's keys
stopping at the 44-pixel tap minimum rather than 48. Buy now ends at 771 of 844
at 360, 390 and 414.

The bucket's absence check had the same shape of fault waiting: it asked whether
any button's *text* said "Add to bucket", and the control is an icon now, so it
would have found nothing whether the button was there or not.

157. **A control is not a fact, and a fact is not a control.** A pill that
     cannot be pressed sitting in a row of buttons teaches somebody that some of
     the buttons do not work. States belong in the page, beside the other things
     that are true about the thing; the header is for its name.

158. **The same action can want a different place at each width without wanting
     two.** A button that is on screen throughout on a desktop and two thousand
     pixels down on a phone is not one design serving both — it is one design
     and one accident. Move it, do not duplicate it.

### 11g.64 Three numbers that led nowhere

Invest carried the S&P 500, the Nasdaq and the Dow Jones across the top, and
there was nothing behind any of them. They were the only figures on a screen
where every other number opens something — a company, a holding, a receipt —
and a number that cannot be pressed among numbers that can does not read as
information. It reads as broken.

Each has a page: where it stands, a year of it, what the number actually
measures, how to read it, and the companies inside it by weight. Next and
Previous at the top walk the three and wrap round, because three pages that
stop dead at the third read as unfinished; the three are named between the
arrows so the pager is also an index; and the swipe and the arrow keys from
11g.63 work here too, because it is the same idea about the same kind of set.

**The table is the page, and it is the awkward part.** Tokkenly lists thirteen
instruments. The S&P has five hundred. So a table of what is in an index is
mostly a table of things this product does not sell, and there were two ways to
handle that and only one of them is honest. A row Tokkenly lists opens the
company and carries the plus that fills the bucket. A row it does not carries
its name, its weight and an indicative price, and says **Not listed here**.
Twenty-eight of the S&P's thirty-two rows say it.

That ratio is the point rather than an embarrassment. It is what the launch set
looks like at index scale, and `indices.mjs` asserts it directly — every row
must either offer a plus or say why it does not, and the shut ones must
outnumber the live ones. The tempting failure here is dressing dead rows as
live, and the check exists to make that fail loudly.

The Dow is the one index this product can show whole, because it only has
thirty companies. It says so, and it is the one with no fund on Tokkenly to
buy it in a single holding — which the page states rather than leaving the
card empty.

**A chart that argued with the page it was on.** The level card prints "an
index level is not a price. Nobody holds one, and it cannot be bought" — and
the chart under it drew a dollar sign on every axis label, every high and low,
and all four OHLC figures. `barChart` formatted with `usd` at nine call sites,
which is the right answer on the eight screens that came before this one and
the wrong one here. It takes a `unit` now, and one formatter serves all nine.

Membership is not invented. Coca-Cola is in the S&P and the Dow and is not on
the Nasdaq; the Nasdaq-100 excludes banks by rule, which is why JPMorgan is
missing from it and why the page says so. Weights and levels are indicative and
labelled as such, on the same footing as every other price in this prototype.
Two Tokkenly companies — Nike and Disney — sit below the S&P's top thirty and
are listed anyway, because cutting them would show somebody a company they can
own and an index it is in without putting the two together.

`INDICES` in the catalogue held a name, a level and a move for each. The array
with the whole index in it is the one that stays.

159. **A figure among figures that lead somewhere has to lead somewhere.**
     Consistency of behaviour is read before content: three cards that look
     like the pressable ones and are not teach somebody that pressing things
     here sometimes fails. Either give it a destination or stop it looking like
     the things that have one.

160. **A component that formats money will format anything as money.** A
     helper called at nine sites with no way to say what the number is will be
     right until the first screen where it is not, and then it will contradict
     the sentence printed beside it. The unit belongs to the caller.

### 11g.65 Four rows is not an answer

Invest ended in three cards holding three, four and however-many rows, with no
way to see the rest and nothing to do from any of them but leave. Each is a
question somebody is actually asking — what should I start with, what am I
following, what is moving — and each answer was four rows long.

Three screens, and each had to earn its address, because a screen that is the
same table under a different heading is a second door to one room.

**Where people start** carries the reason the product puts each company
forward, which the card never had room for, and then separates two things the
rest of the product blurs: `tradable` means "in the approved launch set", not
"you can buy it this afternoon". Meta is in the set and switched off. On the
one screen whose job is to tell somebody where to begin, a first buy landing on
a paused company is the wrong outcome, so what is open and what is paused are
two cards rather than one list. The paused one is named rather than dropped —
a company that vanishes makes people think they misremembered it.

**Your watchlist** does the thing the card could not: stop following, from the
list, rather than by opening thirteen company pages. Emptied, it says what
following is for instead of showing a blank.

**Moving today** splits up from down. "Moving" without a direction is two
questions in one list — the thing that is up four per cent and the thing that
is down four are both moving and nobody is looking for both at once — and it
leads with the widest move, which is the thing the card's four rows were
approximating.

**Popular is deliberately not among them.** It is a chip on Invest that filters
the market table, the table is not capped, and a fourth screen would have been
that same list at a second address — rule 144, and the thing four sections
opening out would most easily have got wrong. The strip names it and sends you
to the chip.

**And the third copy of one idea became one.** Three sets of screens now step
through each other — the thirteen companies, the three indices, these
groupings — and each had grown its own row of names and its own swipe handler.
Three chances to drift, three places to fix anything found in one, and by the
third it was plainly a component: `components/pager.ts` holds the row, the
gesture and the single keydown listener, and the company page and the index
page were moved onto it in the same change rather than left as the two that
came first.

The cards on Invest keep their rows and gain a link in the heading, the same
"All activity" pattern the wallet already uses. Invest stays a page you scan;
the screens are for when four rows is not enough.

All three of those links said "See all" when they were written, and `names.mjs`
failed on all three: rule 49 has held since 11g, and "See all" names nothing.
They say what is on the other side now — *Why these three*, *Everything you
follow*, *Up and down today*. Worth writing down that the rule caught it rather
than a person, which is the whole point of having put it in a suite.

161. **A section that opens out has to open onto more than the same rows.** The
     easy version of "give it a screen" is the list it already showed at a new
     address. If nothing can be added — an order that means something, a
     control the card had no room for, a distinction the summary blurred — then
     the card was the right size and the heading should lead to what already
     exists.

162. **The third copy is the one that proves it was a component.** Two similar
     things can be a coincidence; three is a shape. Extract it when the third
     arrives and move the first two across in the same change, or ship three
     versions of one idea that will drift.

### 11g.66 A strip that named everywhere but here

Six new screens — three indices, three groupings — checked at 390 and 360.

Most of it held. No horizontal overflow on any of the six at either width; no
tap target under 44px; no desktop table left on a phone, every
one of them becoming a list of `.feed-row`s — 32, 30, 30, 5 and 13, plus the
four `.start-row`s that are all Where people start has; titles whole; the trail right; the
pager above the fold. Swiping pages the set, and the chart and the strip both
refuse the gesture, so a drag inside them does not throw the screen sideways.

Two things did not.

**The strip never scrolled to the screen you were on.** It is wider than a
phone — by 74 to 104px on the indices and 261 to 291px on the lists — and it
started at its left edge every time, `scrollLeft` 0 on all six at both widths.
So Dow Jones showed a row reading *S&P 500 · Nasdaq-100*, and at 360 the three
lists each showed *Popular* and nothing else. The one control on the screen
whose entire job is saying where you are was naming two places you are not, and
the tab carrying `aria-current="page"` was the one nobody could see. Five of six
screens were wrong at 360, three of six at 390.

The lit tab is centred on mount now, in one `requestAnimationFrame` after the
tree is connected, by arithmetic on `scrollLeft` rather than by
`scrollIntoView`, which also scrolls every ancestor and would have moved the
page. Centred rather than merely brought inside the box, because the point of
the strip is the set: the neighbours either side are what make it read as one.
At the ends the browser clamps it, which is right — the last tab cannot be
centred and should sit against the edge.

**And the company description clipped on every list row.** `listTable` put
`c.plain` in the name cell at every width. On a phone that cell is about 190px
and the sentence wants about 280, so all five watchlist rows were over by 133 to
149px at 390 and 163 to 179px at 360, and twelve of movers' thirteen by 61 to
206px and 91 to 236px. `text-overflow: ellipsis` meant it truncated on a word
rather than mid-letter, which makes it tidy and still unreadable.

The market's own list had already solved this, and had left the reason in a
comment: the same `<small>` is `desk-only` there because the sentence wrapped to
four lines and turned a list of companies into a wall. The new table copied that
list's columns and its plus button and not the argument underneath them. Four
options, measured on movers at 360, where the rows are 68px and the page 1810:

| | row | page | |
|---|---|---|---|
| ellipsised | 68px | 1810 | unreadable on every row |
| clamped to two lines | 84px | 2028 | seven of thirteen still cut |
| wrapping freely | 68–144px | 2208 | the wall the market list removed |
| desktop only | 68px | 1738 | the sentence is one tap away |

Dropping it costs nothing per row, because the 44px bucket button already sets
the row's floor. It is the market list's answer, which is the point: a company
should read the same wherever it is met.

Where people start escaped both the clip and, at 390, the strip — the first by
accident. Its `listTable` has no rows at all today, because the launch set is
four companies, three of them are the picks and the fourth is paused. Switch
Meta back on and the same rows appear there.

Worth writing down how both got through. The phone checks these screens already
had — no sideways scroll, controls at 44px, the title not cut — all passed
while both faults were live. They were the right checks for the faults of the
tier that wrote them, and neither of them asks whether the thing on screen can
be read or whether the control that says where you are is showing. Both suites
now fail on both faults with the fix reverted, which is the only evidence that a
new check is a check.

163. **A strip that scrolls has to open at the thing you are on.** A horizontal
     set of names wider than the screen starts at its left edge unless something
     moves it, so the later members show a row of everywhere except here. If one
     item is marked as current, that is the item that has to be visible — and
     centred, so the set still reads as a set.

164. **A second view of the same row inherits the first one's arguments, not
     just its columns.** Copying a table's shape copies what it looks like and
     none of what it learned. Before shipping the copy, find the decisions the
     original made against itself — the column it hides, the width it refuses —
     and either carry them or say why this one is different.

### 11g.67 Twelve pages with no way back

A screenshot of Disney's page, and a question: why is there no routing on this
screen. There was none, and there was none on eleven others.

**The registry held four hand-written lines for Apple.** `DESTINATIONS` is what
the breadcrumbs read, so Apple's page said `Invest › Apple` and every other
company's said nothing at all — no trail, no back button, a bare title on the
screen the whole product exists for. Disney, Nike, Coca-Cola, Johnson &
Johnson, Nvidia, Microsoft, Meta, Alphabet, Tesla, Amazon and both funds. The
same registry is what Everything reads, so twelve of the thirteen were missing
from the index of every screen too.

It survived because one of the two navigators that could see them was already
right: `search` walks the catalogue itself in a second pass, so typing "Disney"
always found Disney. The product looked findable and was not navigable, and
`names.mjs` sampled `/invest/aapl` — the one that worked.

So the list is derived now. Every company gets a destination built from
`CATALOGUE`; the three actions are built only for the ones that can actually be
bought, because offering "Invest in Disney" in a search box, against a screen
that then says Disney is not open for trading, is a button that refuses wearing
a different hat. A fourteenth company is covered the day it is added, which is
the only version of this that stays true.

Registering them exposed a second fault underneath. `trailFor` falls back to a
registered *ancestor* for an address that is not its own destination — the
steps inside a flow, and the twenty-seven action addresses under the nine
companies that cannot be bought. It took the first match, and `/invest` matches
`/invest/dis/invest` as surely as `/invest/dis` does, so the place landed at the
end of its own trail: `Disney › Invest`. It takes the deepest match now, and
appends a placeholder for the screen itself, because the caller replaces the
last entry with the screen's own title and an ancestor is not that.

**And the strip was thirteen places you had been.** Every step pushed a history
entry: from Invest into a company and five steps along the strip grew history
by six, and the browser's Back walked you back through five companies you had
already dismissed before it let you out. Now it grows by one. Arriving is still
a push, because tapping a company on a list is a real move and it is the entry
Back is supposed to find; moving *inside* the set replaces, whether by the
names, the chevrons, the swipe or the arrow keys, on all three sets at once —
they share one component, so they share the answer.

**The trail names the list you came through.** One company has one address from
every way in — that is 11g.34's rule and it is the right one — so the address
cannot say whether you tapped Disney on Moving today, under the Consumer chip
or in the S&P's own table. `whence.ts` holds the last grouping you stood in, so
the trail reads `Invest › Moving today › Disney`. It is memory rather than
address: it survives the strip, because swiping from Disney to Nike leaves you
where the list put you; it is dropped the moment you leave Invest, so a company
opened later from the wallet does not claim a list you saw an hour ago; and
somebody opening a link you sent them came through nothing, so theirs reads
`Invest › Disney`, which is the truth for that visit.

The suite takes the thirteen from the product rather than typing them, which is
the actual repair to what let this through: reverted, it names all twelve.

**And then the index said the product had thirty-three places under Invest.**
Registering the companies fixed the trails and broke the thing the registry
also feeds: Everything is an index of screens, and it grew from eight entries
under Invest to thirty-three, twelve of them reading "Sell Meta" or "Send
Alphabet to someone". A company is a row on a page, not a page. Two jobs were
sharing one list — addressing, which every company needs, and enumerating the
screens, which is about pages — so a destination can now say it is an item:
addressable, trailed and findable, and not listed as a screen. Everything is
back to eight under Invest, and the palette drops the duplicate it had started
offering, since the catalogue pass beneath it already names every company with
its ticker and its price.

165. **A list written by hand beside a list that grows will fall behind it.**
     The catalogue gained nine companies and the registry gained none, and
     nothing failed — the screens all rendered, the search all worked, and the
     only symptom was an absence. Derive the second list from the first, or
     accept that it is a snapshot of the day somebody typed it.

166. **Moving inside a set is not a place you have been.** A strip, a carousel
     or a pager is one screen you are browsing. Push the entry that got you
     into it and replace every step within it, or the way out is as many
     presses as the number of things somebody looked at.

169. **Addressable is not the same as listed.** A registry that answers "what
     is above this screen" and a registry that answers "what screens are there"
     are two questions, and a row that must be in the first is not automatically
     wanted in the second. Give the entry a way to say which it is before the
     index fills with things that are rows on a page.

167. **One address reached several ways cannot say which way you took.** That
     is the price of one company having one address, and it is worth paying.
     If the screen needs to know, hold it in memory, drop it when you leave,
     and make sure the screen still reads correctly for somebody who arrives
     with none of it.

### 11g.68 A button wearing the card

The company page on a phone, at 390 and 360, on a company you hold, one you do
not, one that cannot be bought and a fund.

Nearly all of it held. No horizontal overflow and no clipped text on any of the
four at either width; titles whole, including "S&P 500 ETF"; the trail there on
all of them, which is 11g.67's; the strip's thirteen cells at 60px, scrolling
the company you are on into view on arrival; the swipe paging both ways,
wrapping past the ends, and adding no history entry, with a drag begun on the
chart correctly doing nothing. Nothing is stranded at the bottom either: the
last card clears the standing Buy bar by 24px where there is one, and the
navigation by 52px where there is not.

One thing. **The plus beside Following had no body.** `.icon-btn` fills itself
with `--sunken`, and `--sunken` is the card colour — the token file says so in
its own comment, *every card in the main column* — so a control resting on a
card had a surface identical to the thing behind it. Measured, the plus and the
card were both `rgb(22, 22, 25)`: a contrast ratio of exactly 1. Eight pixels to
its left, Following was filled at `rgb(45, 45, 50)`. Two controls side by side,
one with a body and one without, which reads as a button and a decoration.

It is the plus the market's own rows carry, which is what was asked for and is
right there: alone in its column, position is what says it is pressable. Beside
a filled pill it is not, so this one takes the same ramp Following takes and the
list's is left exactly as it was.

Giving it a body exposed four pixels nobody could see before. `.btn-sm` is 40
high with a mouse and 44 with a thumb; `.icon-btn` is a flat 44 at every width.
Two unfilled shapes at different heights is nothing; two filled pills beside
each other at different heights is a misalignment. The plus follows the pill
now, at both sizes.

The suite reads the colours rather than the screenshot — both controls against
the card they sit on, both against each other, both heights, and the market
list's plus still flat.

168. **A surface token names a surface, not a control.** `--sunken` is what a
     card is made of, so anything else painted with it disappears the moment it
     sits on one. A control needs a colour chosen against its own background,
     and the check is arithmetic on the two values rather than a look at it —
     the glyph stays perfectly legible while the button around it vanishes.

### 11g.69 Five rows, and a door to the rest

The card on Invest held the whole category. Thirteen rows on Everything, eleven
on Popular before the chips were counted — which put the three index cards and
the three grouping cards a screen and a half below it, on the screen that is
meant to show somebody what they can buy.

Five rows now, with `‹ 1 of 3 ›` at the foot of the card and a link to all of
them beside it. The arrows repaint the card and never touch the address: paging
a card is not somewhere you have been (rule 166), and a route change here would
rebuild the tree and take the focus out of the search field above it, which is
the fault 11g.19 fixed and the reason this card already repainted itself while
somebody types.

The arrows stop at the ends. The strips on the company and index pages wrap,
because a set of three or four has no natural end and stopping dead at the last
reads as broken; a list of thirteen read five at a time does have one, and an
arrow that quietly returns to the first row looks like the list restarted rather
than finished. A control that refuses is dimmed rather than removed — at the
ends it still has to say it is an arrow.

**And each chip is a screen.** 11g.65 argued the opposite and was right at the
time: a screen showing the same rows at a second address is a second door to one
room, and the card held every row. The card is a five-row preview now, so the
room has one door and the seven chips have seven screens — Popular, ETFs,
Technology, Steady, Consumer, Health and Everything listed — each with the whole
category, the strip of the seven at the top, the swipe and the arrow keys. The
fourth stop on the groupings strip led to `/invest?cat=Popular` and leads to a
screen like its three neighbours now.

The link is not "View more". Rule 49 has held since 11g and it is the same
species: it says `All 13 in Everything`, `All 6 in Popular`, `The one in Health`
— the count and the category, which is what somebody wants to know before
deciding to press.

Two things the change made honest by accident. "Everything you can buy" was the
obvious title for the seventh screen and it is false — nine of the thirteen
cannot be bought, and the card three lines below says so — so it is *Everything
listed*. And the sentence under each heading counts what is closed rather than
implying everything on it is for sale.

Capping the card broke two claims that had been true of it, and `etf.mjs` is
what said so. The ETF tag was on the market's rows and not on `listTable`'s, so
the moment the full mixed list moved to a screen of its own the funds stopped
being marked anywhere — a list that calls a fund a company, which is the exact
thing that tag exists to prevent. And the two tables disagreed about the first
column: the market's says *Name*, this one said *Company*, on a list where two
of the thirteen rows are not one. Both were written in 11g.65 and neither showed
until the card stopped being the only place the list lived.

The seven measured clean on a phone at 390 and 360 — no overflow, nothing cut,
no target under 44, the strip scrolling the chip you are on into view, the swipe
wrapping both ways and adding no history, and Back from one returning to Invest
with that chip still set. Two things were found and deliberately left, and one
was cut.

Left: the ETF badge takes 34px out of a lead cell that has 192px at 390 and
162px at 360, so `QQQc · Nasdaq-100 ETF` runs to three lines and stands 84px
against everyone else's 68 — and both fund names end in "ETF" already, so on
those rows the badge is the word twice. And four of the seven do not fill a
phone: Health ends 302px above the navigation, ETFs 218, Consumer 208, Steady
170. Rule 82 says dead space is a symptom of a missing answer, and 11g.17 says
the cure is not an invented card; a category holding one company is honestly one
row.

Cut: the card said the same thing twice. `2 listed · 0 open for trading` in the
heading, and underneath it *"2 of these are listed but not open for trading
yet"* — the same fact in two registers on a card holding two rows. The count
stays; it costs the sentence's second half, which said what you can still do
with a company you cannot buy, and that is on the company's own page.

170. **A preview is five rows and a door; a list is all of them.** A card that
     holds everything is a card the next section hides behind. Cap it, page it
     in place, and put the whole thing one press away — and do not cap the page
     you land on, because a preview inside a destination is a door to a room you
     are standing in.

### 11g.49 Still open

- All forty-four items of the audit are settled, and seven more that came from
  using the product afterwards. Item 30 was held back until it was asked for,
  and was then built without generating anything: see 11g.18, and 11g.10 for
  why the audit's own account of it was wrong.
- Four things the audit missed entirely and the person using it did not: that
  every search field was a dead control until Enter (11g.19), that the gateway
  tiles had spent their one gradient standing still (11g.20), that a receipt
  named the wrong number of shares (11g.22), and that Account said its own name
  three times before saying anybody else's (11g.23). An audit reads a build; it
  does not use one.
- The bucket can be filled and paid for in one go, and now says so from
  wherever it was filled. What it still cannot do is take a payment from
  anything but the wallet balance: "add money" and "buy the bucket" are two
  errands where a card or a bank debit at the point of purchase would be one.
- The launch set is four companies out of thirteen, and the market shows all
  thirteen on purpose (11g.34). Nine of them can be looked at and not bought,
  every row says so, and one press takes them away (11g.58). What is still not
  decided is whether a market this lopsided should be *sorted* by it — the
  filter is a choice somebody makes and a default order is one the product
  makes for them, and nobody has asked for the second.
- Every finding of the audit that produced 11g.57 to 11g.59 is settled: twelve
  fixed, and four that were wrong, corrected on the page rather than quietly
  dropped. What still needs a decision rather than a fix: the default order of
  a market that is two thirds unbuyable, above; and whether a paused company
  should be addable to a bucket at all — the door lets it in today on the
  argument that a pause is temporary, which is a judgement and not a fact.
- The dot fields are one grey ramp now (11g.59). What that costs is the one
  thing the three palettes bought: a Borrow & Lend card no longer says which of
  the two it is in its own colour, and the two products are told apart by their
  words alone. Nobody has looked at whether that matters on a phone, where the
  two cards stack and the titles are further apart.
- `--dot-*` is now only the coin and the confetti. Two tokens for a family of
  three dots is right while the two families want opposite things, and it is
  worth re-reading if the coin is ever quietened.
- Activity is still three presses from Home on a phone, and 11g.58 did not
  change that: it made the screen say where you are once you are there. Whether
  Activity deserves a tab — which would cost Borrow & Lend its own, and that is
  two of the three products — was put and left open.
- The ledger is built and the statement proves it (11g.35); adding money has a
  real pending leg and two rails (11g.37); Send asks where the money is going
  and Withdraw is one of the answers (11g.38). What is still missing from the
  money model is the other side of a card: a charge can be reversed weeks
  later, and there is no chargeback in here at all — the ledger would need a
  reversing posting and the wallet would need somewhere to take it from.
- A transfer lands on a timer, because there is no webhook to wait for. That is
  the seam a real backend arrives at, and it is one `setTimeout` wide.
- Every provider is dummy data: CDP, Didit, Switch, 0x, Chainlink and viem are
  named, their health is shown, their fallbacks are written and none of them is
  called. That is the seam, and it is the whole remaining engineering job.
- The sell price is 140% of the principal, not of the whole balance — interest
  accrued is outside the requirement. Every screen now says so in those words
  (11g.43), which makes the product honest rather than right: a real
  maintenance requirement counts the interest too. `sellPoint()` and `cover()`
  are one line each and the change would ripple into the borrow composer's
  projection, which is why it is written down here rather than guessed at.
- Every field in the product is an object now (11g.45), so the three
  compositions lifted cell for cell from Figma, and the renderer that tiled
  them into a texture, are used nowhere and have been deleted — `art.ts` went
  from 486 lines to 330. They are in the history if the texture is ever wanted
  back. What this costs is the one thing those fields had that a generated
  object does not: somebody drew them.
- The ten crashing suites are fixed and the sweep is thirty-four green
  (11g.50). What is not fixed is the reason they went unnoticed for five
  tiers: every one of them is run by hand. There is no hook, no CI and nothing
  that runs `all.sh` unless somebody types it.
- `/receive` and `/addmoney` are two addresses for one screen, and so are
  `/withdraw` and `/send`. Both aliases are deliberate — they are what people
  search for, and the registry says so in a hint — and both now open a screen
  whose title and trail agree with each other (11g.50). What has not been
  decided is whether an alias should redirect, so that the address bar carries
  one name too.
- The console has no roles. Anybody who can reach `/admin` sees everything, and
  a real one separates support from risk from engineering.
- Borrow & Lend is not in the MVP brief at all — it is in that brief's *Not
  included* list, as a future product family needing its own legal and risk
  review (11g.43). Everything in it works and nothing in it has been specified
  by anyone but this file. The two things it would need first from a real one
  are a margin call — a notification, and a screen for the day the shares fall
  — and a policy for what happens to an open loan when somebody wants to sell
  the shares backing it. Neither exists here.
- One notification is written by the product and five are seeded. Every other
  event still completes inside the dialog that started it, so nothing else has
  anything to announce — but a real product would have a price alert and a
  margin call in here, and neither exists.
- The name a Nigerian account resolves to comes from a table indexed by the
  last digit. The step is real and the refusal is real; the directory is not.
- The recipient of a share transfer is still nobody: `sent:AAPL` is an account
  outside the books, which is truthful for a single-account prototype and is
  the seam a real one fills with the other person's `held:AAPL`.
- The rate on a conversion is honoured and recorded on both halves of the
  posting, but the desk it passes through never runs out. A real one has a
  position and a limit.
- The privacy switch covers the headline figure on four screens. Every other
  masked figure in the product — a position on a company page, an amount in a
  history row — follows the same setting and has no switch of its own, which is
  deliberate: see 11g.24.
- The composer's two columns are 722 against 336 and stay that way. See 11g.17.
- Sign-in refuses the password `wrong` and accepts everything else, which is a
  prototype's shape of a real check, not a real one.
- Tier 4 covered what was absent. What it did not do is put the product in
  front of a real screen reader: every assertion in `a11y.mjs` is about the
  DOM, and a tree that is correct on paper can still read badly aloud.
- `main` takes focus when a dialog closes, which is a compromise and is
  recorded as one in 11g.11. A product that did not rebuild its whole tree
  would return focus to the control that opened the dialog.
- Item 07, receive handles, needs a backend and a naming policy.
- Sending a share to another person is built, inside Tokkenly only: 11g.27 for
  the market survey, 11g.28 for what shipped. What is not built is the other
  half of it — the recipient's copy. This is a single-account prototype, so a
  share leaves one holding and arrives nowhere; a real one owes the other side
  an activity row, a notification and a cost basis.
- Sending to an arbitrary Base address is deliberately absent. It is possible
  on a free-floating token and it is the point at which a security leaves the
  regulated perimeter, so it waits for a licence and an opinion naming the
  eligible token classes.
- Rate history — a chart of the naira against the dollar, the missing half of
  item 23 — needs a series the product does not have.
- Everything in 11f.38 that has not been superseded still stands, and the file
  is now further behind: Figma has none of the last four tiers either.
- The tablet tier is defined by the sidebar and the gutters, and 900–1199 was
  never the tier that needed the work: it measured clean (11g.56). What did was
  768–899, where every iPad in portrait had been getting the phone's layout at
  twice the width. Both are now built and checked, and neither has been drawn
  in Figma.
- `settlement()` decides failure on the cents. That is right for a prototype
  and wrong for anything else, and the seam is one function wide when a real
  backend arrives.
- The trail on a share send repeats the company: `Invest › Disney › Send
  Disney`, because the registry's label and the screen's title both name it.
  It predates 11g.67 — Apple read the same way — and it is either a shorter
  title or a shorter crumb, which is a decision about words rather than a bug.
- Where people start renders no table. `tradable` is four companies, three of
  them are the picks and the fourth is paused, so "everything else you can buy
  today" has nothing to hold and the card does not appear at all. The screen is
  correct and thin, and it fills itself the day the launch set grows.
- The add-money dialog has no door. It is registered, reachable at
  `?sheet=add-money`, and covered by `sheets.mjs`, and nothing in the product
  opens it. It is either a dialog wanting a caller or a dialog wanting
  deleting.
