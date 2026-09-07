/** A coin, in dots, turning.
 *
 *  The outcome sheet used to wash green from its bottom edge. The wash was
 *  doing the job of saying "this went well" with the one thing the product has
 *  no other use for — a big flat colour — and it read as a filter over the
 *  sheet rather than as anything about the trade.
 *
 *  This is the same idea in the language the product already speaks. Home's
 *  three doors are dot fields; a receipt's history is a sparkline; nothing here
 *  is a photograph. So the celebration is a dot field too: a coin seen face on,
 *  turning about its vertical axis, squashing to a line as it passes edge on
 *  and opening out again, brightening as its face comes round. It bobs, a
 *  little faster than it turns, which is the whole difference between a coin
 *  spinning and a coin pleased with itself.
 *
 *  Drawn on one canvas rather than four hundred spans, for the same reason the
 *  gateway fields are one SVG. It costs 104 x 104 and about 300 circles a
 *  frame, and it stops the moment it leaves the document — this app rebuilds
 *  its whole tree on every change, so a loop that does not check that is a loop
 *  that runs for the life of the tab.
 */

/** Cells across. Odd, so there is a middle column for the coin to stand on. */
const N = 19
const CELL = 5
const SIZE = N * CELL

/** A turn every 2.4 seconds, and a bob at not quite twice that. The two being
 *  out of phase is what stops it reading as a mechanism. */
const SPIN = 2.6
const BOB = 4.3

const still = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function tones(): { dim: string; mid: string; lit: string; hot: string } {
  const s = getComputedStyle(document.documentElement)
  const at = (n: string, f: string) => s.getPropertyValue(n).trim() || f
  return {
    dim: at('--dot-dim', '#65656c'),
    mid: at('--dot-mid', '#a6a6ad'),
    lit: at('--dot-lit', '#dcdce0'),
    hot: at('--positive', '#3fd99b'),
  }
}

export function spinCoin(): HTMLElement {
  const box = document.createElement('div')
  box.className = 'coin'
  box.setAttribute('aria-hidden', 'true')
  const canvas = document.createElement('canvas')
  box.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) return box
  const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1
  canvas.width = SIZE * dpr
  canvas.height = SIZE * dpr
  canvas.style.width = SIZE + 'px'
  canvas.style.height = SIZE + 'px'
  ctx.scale(dpr, dpr)

  const T = tones()
  const R = (N - 3) / 2          // the coin's radius in cells, leaving a margin
  const mid = (N - 1) / 2

  function frame(theta: number, lift: number): void {
    ctx!.clearRect(0, 0, SIZE, SIZE)
    // How wide the disc reads, and how much light its face is catching. Both
    // come off the same angle, so the coin brightens as it opens out — which
    // is the part the eye reads as rotation rather than as a pulsing ellipse.
    const squash = Math.abs(Math.cos(theta))
    const a = Math.max(squash, 0.075)
    const face = 0.45 + 0.55 * squash

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const u = (i - mid) / R
        const v = (j - mid) / R
        const r2 = (u / a) ** 2 + v ** 2
        if (r2 > 1) continue

        // Where this cell sits on the coin's own face, un-squashed. Meaningless
        // when the coin is near enough edge on that the division blows up.
        const fu = squash > 0.2 ? u / a : 0
        const edge = r2 > 0.82              // the rim, one cell of it
        const ring = r2 > 0.38 && r2 <= 0.56 // a band inside it, so it reads as struck
        const mark = squash > 0.2 && (
          (Math.abs(fu) < 0.1 && Math.abs(v) < 0.4) ||
          (Math.abs(fu) < 0.34 && (Math.abs(v - 0.24) < 0.09 || Math.abs(v + 0.24) < 0.09)))

        let tone = T.dim
        let weight = 0.4
        if (edge) { tone = T.lit; weight = 0.86 }
        else if (mark) { tone = T.hot; weight = 0.84 }
        else if (ring) { tone = T.mid; weight = 0.58 }

        // Edge on, the rim is all there is and it should look like metal.
        if (squash < 0.14) { tone = T.lit; weight = 0.8 }

        // The side turning towards you catches the light and the far side
        // falls away. Without it the disc is a flat ellipse that changes
        // width, which reads as breathing rather than as turning.
        const near = 0.5 + 0.5 * fu * (Math.sin(theta) >= 0 ? 1 : -1)
        const shade = 0.6 + 0.4 * near

        const rad = (CELL / 2) * weight * (0.55 + 0.45 * face) * (0.78 + 0.22 * near)
        if (rad < 0.35) continue
        ctx!.globalAlpha = (0.35 + 0.65 * face) * shade
        ctx!.fillStyle = tone
        ctx!.beginPath()
        ctx!.arc(i * CELL + CELL / 2, j * CELL + CELL / 2 + lift, rad, 0, Math.PI * 2)
        ctx!.fill()
      }
    }
    ctx!.globalAlpha = 1
  }

  // A still coin is a coin, not a still of an animation: three quarters on,
  // where both the rim and the face read.
  if (still()) {
    frame(0.62, 0)
    return box
  }

  const start = performance.now()
  const tick = (now: number): void => {
    // The tree is rebuilt on every state change, so the canvas this loop is
    // drawing into is routinely no longer on the page.
    if (!canvas.isConnected) return
    const t = (now - start) / 1000
    frame(t * SPIN, Math.sin(t * BOB) * 2.4)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
  return box
}
