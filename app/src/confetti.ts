/** A small burst of paper, from the button that earned it.
 *
 *  Deliberately not on a trade. Robinhood put confetti on executed orders and
 *  took it off again in 2021 after a securities regulator called it out for
 *  gamifying investing, and the objection was right: an animation that rewards
 *  you for spending money is an animation working for the product against the
 *  person. This product spent a whole tier putting the disclosures under the
 *  buy button; a party on top of them would undo it.
 *
 *  Putting something in a bucket is a different act. Nothing has been bought,
 *  nothing has left the account, and it can be taken out again with one press.
 *  It is choosing, and choosing is the thing worth feeling good about.
 *
 *  No library. Everything here is thirty lines of canvas: a library for this
 *  would be a dependency the whole product carries for one moment, in an app
 *  that self-hosts its own font to keep a third party out of the way. */

interface Bit {
  x: number; y: number
  vx: number; vy: number
  spin: number; turn: number
  w: number; h: number
  tone: string
  life: number
}

const COUNT = 14
const LIFE = 900
const GRAVITY = 0.0012

const still = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** The product's own palette, not a party pack. Green, the accent violet and
 *  two rungs of the ink ramp — the same four colours the dot fields use, so a
 *  burst reads as this product being pleased rather than as a plugin. */
function palette(): string[] {
  const style = getComputedStyle(document.documentElement)
  const at = (name: string) => style.getPropertyValue(name).trim()
  return [at('--positive'), at('--data-2'), at('--dot-lit'), at('--dot-mid')]
    .filter(Boolean)
}

/** Burst from the middle of whatever was pressed. */
export function celebrate(from: Element): void {
  if (still()) return
  const box = from.getBoundingClientRect()
  if (!box.width) return

  const canvas = document.createElement('canvas')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  // A square of room around the button, fixed so it does not join the layout
  // or move the thing it is celebrating.
  const R = 120
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  canvas.style.cssText =
    `position:fixed;left:${cx - R}px;top:${cy - R}px;width:${R * 2}px;height:${R * 2}px;` +
    'pointer-events:none;z-index:80'
  canvas.width = R * 2 * dpr
  canvas.height = R * 2 * dpr
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) { canvas.remove(); return }
  ctx.scale(dpr, dpr)

  const tones = palette()
  const bits: Bit[] = []
  for (let i = 0; i < COUNT; i++) {
    // Upward and outward, in a fan rather than a full circle: paper thrown
    // from a hand, not an explosion.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6
    const speed = 0.18 + Math.random() * 0.22
    bits.push({
      x: R, y: R,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: Math.random() * Math.PI,
      turn: (Math.random() - 0.5) * 0.02,
      w: 3 + Math.random() * 3,
      h: 5 + Math.random() * 4,
      tone: tones[i % tones.length] || '#3fd99b',
      life: LIFE * (0.7 + Math.random() * 0.3),
    })
  }

  let started = 0
  const step = (now: number): void => {
    if (!started) started = now
    const t = now - started
    ctx.clearRect(0, 0, R * 2, R * 2)
    let alive = false
    for (const b of bits) {
      if (t > b.life) continue
      alive = true
      const x = b.x + b.vx * t
      const y = b.y + b.vy * t + GRAVITY * t * t * 0.5
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(b.spin + b.turn * t)
      // Fading over the last third, so nothing vanishes mid-air.
      ctx.globalAlpha = Math.max(0, Math.min(1, (1 - t / b.life) * 3))
      ctx.fillStyle = b.tone
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
      ctx.restore()
    }
    if (alive) requestAnimationFrame(step)
    else canvas.remove()
  }
  requestAnimationFrame(step)
}
