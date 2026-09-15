/* One node of a screen, built. Shared by _figma-build.mjs, which builds the
   screens, and _figma-chrome.mjs, which builds the furniture that is on all of
   them — the same code, because a rail built by a second function is a rail
   that will drift from the screens around it.

   The scaffold that embeds this declares: PARTS (components by name), missing
   (names with no component, collected), byName (colour variables), styleFor
   and rgb. It is emitted into a use_figma script, not imported. */
const build = (n, parent) => {
  // A named part is a component in this file. Place an instance rather than a
  // copy, so editing the component edits every screen that uses it.
  if (n.p) {
    const comp = PARTS[n.p]
    let node
    if (comp) { node = comp.createInstance() }
    else {
      node = figma.createFrame()
      node.fills = []
      node.strokes = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.65 } }]
      node.dashPattern = [3, 3]
      missing.push(n.p)
    }
    node.name = n.p
    parent.appendChild(node)
    node.x = n.b[0]; node.y = n.b[1]
    try { node.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3])) } catch {}
    if (n.o !== undefined) node.opacity = n.o
    return node
  }
  if (n.g) {
    const node = figma.createNodeFromSvg(n.g)
    node.name = n.n || 'art'
    parent.appendChild(node)
    node.x = n.b[0]; node.y = n.b[1]
    try { node.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3])) } catch {}
    if (n.o !== undefined) node.opacity = n.o
    return node
  }
  // A box that carries its own text — the brand mark, a chip, the Ctrl K key,
  // the avatar, the count on the bell — is a frame with a text node in it, not
  // a text node. Reading the text first threw away the fill and the radius, so
  // the pills lost their pills and the letters sat loose on the canvas.
  if (n.t !== undefined && (n.f || n.r)) {
    const box = figma.createFrame()
    box.name = n.n || 'box'
    box.clipsContent = false
    parent.appendChild(box)
    box.x = n.b[0]; box.y = n.b[1]
    box.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3]))
    if (n.f) {
      let paint = { type: 'SOLID', color: rgb(n.f) }
      if (n.fa !== undefined) paint.opacity = n.fa
      if (n.v && byName[n.v]) paint = figma.variables.setBoundVariableForPaint(paint, 'color', byName[n.v])
      box.fills = [paint]
    } else box.fills = []
    if (n.r) box.cornerRadius = n.r
    if (n.o !== undefined) box.opacity = n.o
    // The run inside it, in the box's own coordinates, centred the way the
    // box centres it. Everything a chip is doing is one line in a pill.
    const inner = build({ ...n, f: undefined, v: undefined, r: undefined, o: undefined,
                          b: [n.b[0], n.b[1], n.b[2], n.b[3]] }, box)
    if (inner) {
      inner.x = n.ta === 'center' ? (n.b[2] - inner.width) / 2
        : (n.ta === 'right' || n.ta === 'end') ? n.b[2] - inner.width : 0
      inner.y = (n.b[3] - inner.height) / 2
    }
    return box
  }
  if (n.t !== undefined) {
    const t = figma.createText()
    t.fontName = { family: 'Geist', style: styleFor(n.wt) }
    t.characters = n.t
    t.fontSize = n.s
    t.lineHeight = { unit: 'PIXELS', value: n.lh }
    if (n.ls) t.letterSpacing = { unit: 'PIXELS', value: n.ls }
    t.fills = [{ type: 'SOLID', color: rgb(n.c) }]
    t.name = n.t.slice(0, 40)
    parent.appendChild(t)
    // A box measured off the DOM is exactly as wide as the text was, and Geist
    // in Figma sets a hair wider than Geist in the browser — so a label that
    // was one line came out as two, and Home read Hom / e. A run that did not
    // wrap in the product hugs its own width here and cannot wrap; one that
    // did keeps the width it wrapped at, so it wraps in the same places.
    const wrapped = n.b[3] > n.lh * 1.4
    if (n.ta === 'center') t.textAlignHorizontal = 'CENTER'
    if (n.ta === 'right' || n.ta === 'end') t.textAlignHorizontal = 'RIGHT'
    if (wrapped) {
      t.textAutoResize = 'HEIGHT'
      try { t.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3])) } catch {}
      t.x = n.b[0]
    } else {
      t.textAutoResize = 'WIDTH_AND_HEIGHT'
      // Hugging moves the left edge, so a centred or right-aligned label has
      // to be put back on the box it was aligned within — otherwise every
      // centred label in the product slides left by half its slack.
      t.x = n.ta === 'center' ? n.b[0] + (n.b[2] - t.width) / 2
        : (n.ta === 'right' || n.ta === 'end') ? n.b[0] + n.b[2] - t.width
        : n.b[0]
    }
    t.y = n.b[1]
    if (n.o !== undefined) t.opacity = n.o
    return t
  }
  // Reuse a frame this part's ancestors already made, so a screen built in
  // slices ends up as one tree rather than one tree per slice.
  const name = n.n || 'box'
  let f = parent.children.find((c) => c.type === 'FRAME' && c.name === name
    && Math.round(c.x) === Math.round(n.b[0] - (parent.type === 'FRAME' ? 0 : 0))
    && Math.round(c.width) === Math.max(1, n.b[2]))
  if (f) { for (const k of n.k || []) build(k, f); return null }
  f = figma.createFrame()
  f.name = name
  f.clipsContent = false
  parent.appendChild(f)
  f.x = n.b[0]; f.y = n.b[1]
  f.resize(Math.max(1, n.b[2]), Math.max(1, n.b[3]))
  if (n.f) {
    let paint = { type: 'SOLID', color: rgb(n.f) }
    if (n.fa !== undefined) paint.opacity = n.fa
    if (n.v && byName[n.v]) {
      paint = figma.variables.setBoundVariableForPaint(paint, 'color', byName[n.v])
    }
    f.fills = [paint]
  } else {
    f.fills = []
  }
  if (n.r) f.cornerRadius = n.r
  if (n.o !== undefined) f.opacity = n.o
  for (const k of n.k || []) {
    const c = build(k, f)
    // Children came out of the DOM in page coordinates; make them the frame's.
    if (c) { c.x = c.x - n.b[0]; c.y = c.y - n.b[1] }
  }
  return f
}
