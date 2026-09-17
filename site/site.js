/* Tokkenly marketing site. Four small jobs: the bar knows when the page has
   moved, the Products menu opens and closes, the phone menu does the same,
   and sections arrive rather than appear. Nothing here is load-bearing — with
   the script blocked the page is still a readable document. */
;(function () {
  'use strict'

  var nav = document.getElementById('nav')

  /* -------------------------------------------------- the bar on scroll -- */
  /* The bar is clear over the hero and solid once the hero has passed. Two
     numbers rather than one: the glass leads and the white follows, so the
     order the design asks for — transparent, then blur, then white — is what
     actually happens rather than both arriving together.
     
     The ramps overlap on purpose. Blur is fully in by 62% of the hero and
     white only starts at 38%, so there is a stretch where the bar is real
     glass over moving colour, which is the part worth having. */
  var hero = document.querySelector('.hero')
  var ticking = false

  function ease(t) { return t * t * (3 - 2 * t) }          // smoothstep
  function span(v, a, b) { return Math.min(Math.max((v - a) / (b - a), 0), 1) }

  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(function () {
      ticking = false
      /* The hero is as tall as the composition, which on a 34 inch screen is
       over 2000px — a ramp that long leaves the bar clear for a screen and a
       half. Capped, it finishes about where a normal window's hero would. */
    var run = Math.min(hero ? hero.offsetHeight - nav.offsetHeight : 320, 760)
      var p = span(window.scrollY, 0, Math.max(run, 1))
      var blur = ease(span(p, 0, 0.62))
      var solid = ease(span(p, 0.38, 1))
      nav.style.setProperty('--nav-blur', blur.toFixed(4))
      nav.style.setProperty('--nav-solid', solid.toFixed(4))
      /* Only paint the backdrop filter once there is something to blur. */
      nav.setAttribute('data-glass', blur > 0.01 ? 'true' : 'false')
      nav.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false')
    })
  }
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', onScroll, { passive: true })
  onScroll()

  /* ------------------------------------------------------ Products menu -- */
  var dropBtn = document.querySelector('.drop-btn')
  var dropMenu = document.getElementById('products-menu')

  function setDrop(open) {
    dropBtn.setAttribute('aria-expanded', String(open))
    dropMenu.hidden = !open
  }

  dropBtn.addEventListener('click', function (e) {
    e.stopPropagation()
    setDrop(dropMenu.hidden)
  })
  dropMenu.addEventListener('click', function () { setDrop(false) })
  document.addEventListener('click', function (e) {
    if (!dropMenu.hidden && !dropMenu.contains(e.target)) setDrop(false)
  })
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return
    if (!dropMenu.hidden) { setDrop(false); dropBtn.focus() }
    if (!mobileMenu.hidden) { setBurger(false); burger.focus() }
  })

  /* -------------------------------------------------------- phone menu -- */
  var burger = document.querySelector('.burger')
  var mobileMenu = document.getElementById('mobile-menu')

  function setBurger(open) {
    burger.setAttribute('aria-expanded', String(open))
    mobileMenu.hidden = !open
  }

  burger.addEventListener('click', function () { setBurger(mobileMenu.hidden) })
  mobileMenu.addEventListener('click', function (e) {
    if (e.target.closest('a')) setBurger(false)
  })
  /* A menu that is open at 640px and still open at 1200px is a menu nobody
     can close, because the button that closes it is gone by then. */
  var wide = matchMedia('(min-width: 1041px)')
  var onWide = function (m) { if (m.matches) setBurger(false) }
  if (wide.addEventListener) wide.addEventListener('change', onWide)
  else wide.addListener(onWide)

  /* --------------------------------------------- links with no page yet -- */
  document.querySelectorAll('[data-soon]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault() })
  })

  /* ------------------------------------------------------------ reveal -- */
  var io = null
  var items = document.querySelectorAll('.reveal')

  /* Put an element in its final position immediately, with no transition.
   *
   *  This exists because a reveal and an anchor jump fight each other. Half
   *  the anchor targets on this page — every product card — are themselves
   *  `.reveal`, so at the moment the browser works out where to scroll they
   *  are still translated 50px down. It scrolls to that position, honouring
   *  scroll-padding-top against it, and then the reveal runs and lifts the
   *  element 50px — landing it under the fixed bar, 42px from the top of a
   *  73px bar. Settling the target before the jump is measured means the
   *  browser measures the place the element is actually going to be. */
  function settle(el) {
    var list = []
    if (el.classList.contains('reveal')) list.push(el)
    var up = el.closest('.reveal')
    if (up && list.indexOf(up) < 0) list.push(up)
    Array.prototype.push.apply(list, el.querySelectorAll('.reveal'))

    var pending = list.filter(function (t) { return !t.classList.contains('in') })
    if (!pending.length) return
    pending.forEach(function (t) {
      t.style.transition = 'none'
      t.classList.add('in')
      if (io) io.unobserve(t)
    })
    void el.getBoundingClientRect()          // force the layout before restoring
    pending.forEach(function (t) { t.style.transition = '' })
  }

  function settleHash(hash) {
    if (!hash || hash === '#') return
    var el = null
    try { el = document.querySelector(hash) } catch (e) { return }
    if (el) settle(el)
  }

  /* Every same-page link, including the ones inside the two menus. Capture,
     so this runs before the menus' own handlers close anything. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]')
    if (!a || a.hasAttribute('data-soon')) return
    settleHash(a.getAttribute('href'))
  }, true)

  if (!('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(function (el) { el.classList.add('in') })
    return
  }

  io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return
      entry.target.classList.add('in')
      io.unobserve(entry.target)
    })
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 })

  items.forEach(function (el, i) {
    /* Cards in the same row arrive one after another rather than all at once.
       120ms against a 1s travel: far enough apart to read as a sequence, close
       enough that the last one is not still arriving after the eye has moved
       on. The hero does not come through here — it animates on load, from CSS,
       because it is already in view when the page opens. */
    el.style.transitionDelay = (i % 3) * 120 + 'ms'
    io.observe(el)
  })

  /* A page opened straight onto an anchor has the same problem. */
  settleHash(location.hash)
})()

/* The orbit is its own unit. The block above returns early when the reader
   asks for reduced motion, and the ring still has to be laid out in that
   case — six cards left at the top-left corner of the globe is not a
   degraded experience, it is a broken one. */
;(function () {
  'use strict'

  /* --------------------------------------------------------- the orbit -- */
  /* Six portraits on a tilted ring around the globe. The ring is an ellipse
     in the globe's own box: wide on x, short on y, which is what reads as a
     ring seen from slightly above. Depth is sin(angle) — positive is the near
     half, so those cards scale up and sit in front of the sphere; negative is
     the far half, which scales down and drops behind it.

     The resting angles are measured off the Figma placement, so with no
     rotation applied the six sit where they were drawn.

     It is a ring rather than a sphere because the globe is a flat render: a
     real 3D globe is not what this is. Dragging spins the ring, lets go with
     momentum, and the idle drift picks back up. */
  var globe = document.getElementById('globe')
  var orbit = document.getElementById('orbit')

  if (globe && orbit) {
    var cards = [].slice.call(orbit.querySelectorAll('.orbit-card'))
    var CX = 50
    var CY = 50
    var DEPTH = 0.12     /* how much nearer cards grow */
    var DRIFT = 0.02     /* degrees per ms when nobody is touching it */

    /* Shape comes from CSS so the breakpoints own it. */
    var RX = 53.8, RY = 25.3, CARD = 1
    function readShape() {
      var cs = getComputedStyle(globe)
      RX = parseFloat(cs.getPropertyValue('--rx')) || RX
      RY = parseFloat(cs.getPropertyValue('--ry')) || RY
      CARD = parseFloat(cs.getPropertyValue('--card')) || 1
    }

    var spin = 0
    var velocity = DRIFT
    var dragging = false
    var lastX = 0
    var lastT = 0
    var raf = null
    var still = matchMedia('(prefers-reduced-motion: reduce)').matches

    function layout() {
      var box = globe.clientWidth || 1
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i]
        var a = (parseFloat(card.dataset.a) + spin) * Math.PI / 180
        var depth = Math.sin(a)
        var scale = 1 + depth * DEPTH
        /* The card's own width is a share of the globe box, so it scales with
           the page exactly like the sphere does. */
        var w = parseFloat(card.dataset.w) / 873 * box * CARD
        var x = CX + RX * Math.cos(a)
        var y = CY + RY * depth

        card.style.width = w + 'px'
        card.style.transform =
          'translate(' + (x / 100 * box - w / 2) + 'px,' +
          (y / 100 * globe.clientHeight - w * 256 / parseFloat(card.dataset.w) / 2) + 'px)' +
          ' scale(' + scale.toFixed(4) + ')'
        card.style.zIndex = depth >= 0 ? 4 : 1
        card.style.opacity = depth >= 0 ? 1 : (0.82 + depth * 0.1).toFixed(3)
      }
    }

    function frame(now) {
      if (!dragging) {
        spin += velocity * 16
        /* Ease the flick back down to the idle drift rather than to a stop. */
        velocity += (DRIFT - velocity) * 0.035
      }
      layout()
      raf = requestAnimationFrame(frame)
    }

    function onDown(e) {
      dragging = true
      lastX = e.clientX
      lastT = e.timeStamp
      globe.setPointerCapture && globe.setPointerCapture(e.pointerId)
    }
    function onMove(e) {
      if (!dragging) return
      var dx = e.clientX - lastX
      var dt = Math.max(e.timeStamp - lastT, 1)
      /* A drag across the whole globe is about half a turn. */
      var deg = dx / (globe.clientWidth || 1) * 180
      spin += deg
      velocity = deg / dt
      lastX = e.clientX
      lastT = e.timeStamp
      layout()
    }
    function onUp(e) {
      if (!dragging) return
      dragging = false
      globe.releasePointerCapture && globe.releasePointerCapture(e.pointerId)
    }

    globe.addEventListener('pointerdown', onDown)
    addEventListener('pointermove', onMove)
    addEventListener('pointerup', onUp)
    addEventListener('pointercancel', onUp)

    /* Keyboard gets the same control the pointer has. */
    globe.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { spin -= 8; layout(); e.preventDefault() }
      if (e.key === 'ArrowRight') { spin += 8; layout(); e.preventDefault() }
    })

    addEventListener('resize', function () { readShape(); layout() }, { passive: true })

    readShape()
    layout()
    if (!still) {
      /* Only run the loop while the hero is actually on screen. */
      var heroIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && raf === null) raf = requestAnimationFrame(frame)
          else if (!entry.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null }
        })
      }, { threshold: 0 })
      heroIO.observe(globe)
    }
  }
})()

/* The pop-ups, told rather than posed.

   These two panels are the only things on the page carrying a number and a
   button, which is exactly why they read as frozen: a send screen showing a
   settled $120.00 is a screenshot, not a send. Each one plays its story once,
   when it arrives — the amount counts up, the ledger lands a row at a time,
   the button follows.

   This was going to be GSAP. It is about eighty lines of rAF instead, because
   a count, a stagger and a scrub is all that is needed and the alternative is
   a 70KB runtime dependency on a CDN for a page that otherwise has none.

   Everything here is additive: the sections still reveal on the CSS path, and
   nothing starts hidden that only this code can bring back. */
;(function () {
  'use strict'

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (!('IntersectionObserver' in window)) return

  var ease = function (t) { return 1 - Math.pow(1 - t, 3) }   // out-cubic

  /* Run fn(0..1) over ms, once. */
  function run(ms, fn, done) {
    var t0 = 0
    function frame(now) {
      if (!t0) t0 = now
      var t = Math.min((now - t0) / ms, 1)
      fn(ease(t))
      if (t < 1) requestAnimationFrame(frame)
      else if (done) done()
    }
    requestAnimationFrame(frame)
  }

  /* Fire fn the first time el is meaningfully on screen. */
  function once(el, fn, ratio) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return
        io.unobserve(e.target)
        fn(e.target)
      })
    }, { threshold: ratio || 0.25 })
    io.observe(el)
  }

  var money = function (n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  /* ------------------------------------------------------- the pop-ups -- */
  document.querySelectorAll('.popup').forEach(function (pop) {
    var amount = pop.querySelector('.pop-amount')
    var rows = [].slice.call(pop.querySelectorAll('.pop-row'))
    var tail = [].slice.call(pop.querySelectorAll('.pop-note, .pop-btn'))

    /* The figure stays in the markup — it is read off the page rather than
       repeated here, so there is one copy of it and the page still says
       $120.00 with the script switched off. */
    var target = amount ? parseFloat(amount.textContent.replace(/[^0-9.]/g, '')) : 0
    var prefix = amount ? amount.textContent.replace(/[0-9.,]/g, '').trim() : ''

    var hidden = rows.concat(tail)
    hidden.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(10px)' })

    once(pop, function () {
      if (amount && target) {
        run(1000, function (t) { amount.textContent = prefix + money(target * t) },
            function () { amount.textContent = prefix + money(target) })
      }
      hidden.forEach(function (el, i) {
        el.style.transition = 'opacity 420ms var(--ease-out) ' + (260 + i * 70) + 'ms,' +
                              'transform 420ms var(--ease-out) ' + (260 + i * 70) + 'ms'
        requestAnimationFrame(function () { el.style.opacity = ''; el.style.transform = '' })
      })
    }, 0.3)
  })

  /* ------------------------------------------- the props, on the scroll -- */
  /* A slow drift as each card crosses the viewport, so the thing on it reads
     as sitting above the card rather than printed on it. Small numbers on
     purpose: the point is depth, not movement.

     Hover sets a transform on these same elements, so the drift is written to
     a custom property and composed in CSS instead of fighting over the
     transform itself. */
  var props = [].slice.call(document.querySelectorAll('.pr-sticker, .ts-bleed, .ts-stage'))
  if (props.length) {
    var pending = false
    var drift = function () {
      pending = false
      var vh = innerHeight
      props.forEach(function (el) {
        var r = el.getBoundingClientRect()
        if (r.bottom < -200 || r.top > vh + 200) return
        /* -1 below the fold, +1 above it */
        var mid = (r.top + r.height / 2) / vh
        el.style.setProperty('--drift', (((0.5 - mid) * 26).toFixed(2)) + 'px')
      })
    }
    var onScroll = function () {
      if (pending) return
      pending = true
      requestAnimationFrame(drift)
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll, { passive: true })
    drift()
  }

  /* ------------------------------------------------ heads, part by part -- */
  /* The CSS reveal brings whole blocks in. This only splits a head into its
     pieces so the eyebrow, the line and the lead do not land on one frame. */
  document.querySelectorAll('.head, .gift-head, .why-head').forEach(function (head) {
    var parts = [].slice.call(head.children)
    if (!parts.length) return
    parts.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(16px)' })
    once(head, function () {
      parts.forEach(function (el, i) {
        el.style.transition = 'opacity 620ms var(--ease) ' + (i * 90) + 'ms,' +
                              'transform 620ms var(--ease) ' + (i * 90) + 'ms'
        requestAnimationFrame(function () { el.style.opacity = ''; el.style.transform = '' })
      })
    }, 0.2)
  })

  /* -------------------------------------------- getting started, in turn -- */
  var steps = [].slice.call(document.querySelectorAll('.gs-step'))
  if (steps.length) {
    steps.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(38px)' })
    once(steps[0].parentNode, function () {
      steps.forEach(function (el, i) {
        el.style.transition = 'opacity 700ms var(--ease) ' + (i * 130) + 'ms,' +
                              'transform 700ms var(--ease) ' + (i * 130) + 'ms'
        requestAnimationFrame(function () { el.style.opacity = ''; el.style.transform = '' })
      })
    }, 0.15)
  }
})()

/* ------------------------------------------------ the getting-started run --

   Three cards, each a light-mode rendering of a real screen, each with a
   short scripted run: a pointer arrives, presses something, a field fills, a
   sheet rises. Hover starts it; leaving resets it to frame one. A phone has
   no hover, so there it plays once when the card scrolls into view.

   Why a driver rather than CSS keyframes: a keyframe timeline that types into
   four fields, moves a pointer between six targets and opens a sheet is a
   wall of percentages that nobody can read or re-time. This is a list of
   steps with durations, which is what it is.

   Everything it touches is a class or a data attribute — no inline styles
   except the pointer's position, which is the one thing that genuinely has to
   be a number. Reset puts every one of them back, so a run that is abandoned
   half way leaves nothing behind. */
;(function () {
  'use strict'

  /* The screen's own width, which is what every measurement inside it is in:
     the CSS scales the whole thing to the glass, and this is the number that
     scaling divides by. And the glass's own height in those same pixels — it
     is 552 of the card's 600, which at 390 wide is 552 x 390/425. The CSS
     says both numbers too.

     Declared up here rather than beside the code that uses them, because the
     reduced-motion branch below calls rest(), and rest() needs the height. A
     `var` further down is hoisted but its value is not, so the first thing
     that ran got 974 minus undefined — which is what the sign-up card's pan
     came out as, and NaN does not move a page. */
  var PHONE_W = 390
  var PHONE_H = 506.5

  var mocks = [].slice.call(document.querySelectorAll('.gs-mock'))
  if (!mocks.length) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    /* The screens still have to show the product. Put each one in the state
       its run would have finished in, and never move it again. */
    mocks.forEach(function (m) { rest(m, true) })
    return
  }

  /* Where a target sits inside the card, as a percentage of the card, so the
     pointer lands on the same spot whatever size the card is drawn at.
     `shift` is how far the page is about to move underneath it: the arrow has
     to aim at where the target will be when it gets there, not where it was
     when the step started. */
  function centre(mock, sel, shift) {
    var el = mock.querySelector(sel)
    if (!el) return null
    var a = el.getBoundingClientRect(), b = mock.getBoundingClientRect()
    if (!b.width || !b.height) return null
    return {
      x: ((a.left + a.width / 2) - b.left) / b.width * 100,
      y: ((a.top + a.height / 2 + (shift || 0)) - b.top) / b.height * 100,
    }
  }

  /* --------------------------------------------------------- the scripts --
     Each step is [duration, fn]. A step that only waits has no fn. The
     longest of the three comes to about seven and a half seconds, which is
     the pace the section was tuned at: long enough to read every step, short
     enough to finish while somebody is still looking at it. The other two are
     shorter, so three of them side by side drift apart rather than beating in
     unison, which is most of what keeps the section from reading as noise. */
  function script(mock, kind) {
    var q = function (s) { return mock.querySelector(s) }
    var steps = []
    var to = function (sel, ms) {
      var d = ms || 480
      steps.push([d, function (r) { r.move(sel, d) }])
    }
    var off = function (dx, dy, hold) {
      steps.push([hold, function (r) { r.drift(dx, dy, 380) }])
    }
    var tap = function (ms) { steps.push([ms || 260, function (r) { r.tap() }]) }
    var act = function (fn, ms) { steps.push([ms || 0, fn]) }

    if (kind === 'signup') {
      ;['code', 'name', 'email', 'pass'].forEach(function (f, i) {
        // The email is the one below the fold when its turn comes, and the
        // step that brings it up carries the pan, so it gets the room.
        to('[data-f="' + f + '"]', i === 2 ? 680 : i ? 440 : 480)
        tap(240)
        act(function (r) { r.type(q('[data-f="' + f + '"]')) }, 0)
        // Typing is driven by its own timer; hold here for as long as it runs.
        steps.push([typeMs(q('[data-f="' + f + '"]')), null])
        act(function () {
          var el = q('[data-f="' + f + '"]')
          el.classList.add('is-done')
          el.classList.remove('is-caret')
        }, 120)
      })
      // The button is 200 pixels below anything seen so far. This is the move
      // the whole arrangement is for: the page comes up, and the thing the
      // four fields were for is suddenly the only thing on the screen.
      to('[data-f="go"]', 720)
      tap(240)
      act(function () { q('[data-f="go"]').textContent = 'Checking your invite…' }, 240)
      off(9, 7, 620)
    }

    if (kind === 'fund') {
      // A wallet is read before it is used: the three doors come up together,
      // and then one of them is pressed.
      steps.push([880, function (r) { r.show('.m-ways', 700) }])
      to('[data-f="add"]', 520)
      tap()
      act(function () { q('[data-f="sheet"]').setAttribute('data-on', '') }, 640)
      // A pointer that goes straight to its answer has not looked at the list.
      to('[data-f="crypto"]', 420)
      act(function () { q('[data-f="crypto"]').classList.add('is-hot') }, 300)
      act(function () { q('[data-f="crypto"]').classList.remove('is-hot') }, 0)
      to('[data-f="bank"]', 360)
      act(function () { q('[data-f="bank"]').classList.add('is-hot') }, 260)
      tap()
      act(function () {
        ;['bank', 'crypto', 'card'].forEach(function (f) {
          q('[data-f="' + f + '"]').classList.add('is-gone')
        })
        q('[data-f="acct"]').setAttribute('data-on', '')
        q('.m-sheet-h').textContent = 'Bank transfer'
      }, 620)
      to('[data-f="copy"]', 460)
      tap()
      act(function () {
        var c = q('[data-f="copy"]')
        c.classList.add('is-done')
        c.textContent = 'Copied'
      }, 220)
      off(9, 7, 620)
    }

    if (kind === 'invest') {
      to('[data-f="search"]', 620)
      tap()
      act(function (r) { r.type(q('[data-f="search"]')) }, 0)
      steps.push([typeMs(q('[data-f="search"]')), null])
      act(function () {
        q('[data-f="search"]').classList.remove('is-caret')
        mock.querySelectorAll('.m-co').forEach(function (row) {
          if (row.getAttribute('data-co') !== 'AAPL') row.classList.add('is-gone')
        })
        q('.m-count').textContent = '1 company'
      }, 700)
      // The list starts at the bottom edge of the glass, so reading the row
      // means bringing it up.
      to('.m-co[data-co="AAPL"]', 700)
      act(function () { q('.m-co[data-co="AAPL"]').classList.add('is-hot') }, 300)
      to('[data-f="add-aapl"]', 360)
      tap()
      act(function () {
        // The plus and the tick are both in the markup and the class picks
        // one. Writing a '✓' over the button, as this used to, deleted both
        // drawings — and reset cannot put back what is no longer there, so
        // the second run opened with a tick on a row nothing was added from.
        var a = q('[data-f="add-aapl"]')
        a.classList.add('is-done')
        var b = q('.m-bucket')
        b.textContent = '1'
        b.classList.add('is-on')
      }, 260)
      off(6, 8, 820)
    }

    return steps
  }

  /* How long a field takes to fill, at the one rate every field types at. */
  var PER_CHAR = 38
  function typeMs(el) {
    return el ? (el.getAttribute('data-type') || '').length * PER_CHAR + 160 : 0
  }

  /* ------------------------------------------------------------- the run -- */
  function runner(mock, kind) {
    var cursor = mock.querySelector('.gs-cursor')
    var win = mock.querySelector('.gs-win')
    var screen = mock.querySelector('.gs-scr')
    var timers = []
    var live = false
    var last = null
    var pan = 0                       // design pixels, zero or negative

    function at(ms, fn) { timers.push(setTimeout(fn, ms)) }
    function clear() { timers.forEach(clearTimeout); timers = [] }

    /* How many page pixels one design pixel is drawn at. Read rather than
       stored, because the card is a different width at every breakpoint and
       the CSS works it out with a trig call this cannot see. */
    function scale() {
      var w = win.getBoundingClientRect().width
      return w ? w / PHONE_W : 1
    }

    function setPan(px, ms) {
      pan = px
      screen.style.setProperty('--pan-ms', ms + 'ms')
      screen.style.setProperty('--pan', px + 'px')
    }

    /* One place that writes a position, so travel time and position are set
       together and the arrow can never be mid-flight when the tap lands. */
    function place(x, y, ms) {
      cursor.style.setProperty('--gs-move', ms + 'ms')
      cursor.style.left = x + '%'
      cursor.style.top = y + '%'
      last = { x: x, y: y }
    }

    var api = {
      move: function (sel, ms) {
        // Page first, in the same beat: they travel together and arrive
        // together, so the arrow never lands where the target used to be.
        var shift = api.show(sel, ms)
        var p = centre(mock, sel, shift)
        if (!p) return
        cursor.classList.add('is-on')
        place(p.x, p.y, ms)
      },
      /* After a press, the hand comes off the button. Without it the arrow
         sits on the tick it just produced, which is the one frame the whole
         step exists to show. */
      drift: function (dx, dy, ms) {
        if (!last) return
        place(last.x + dx, last.y + dy, ms)
      },
      /* Bring something into the glass, if it is not already comfortably in
         it. The screens are 850 to 1,000 design pixels tall and the glass
         shows about 506 of that, so the run moves the page the way a thumb
         would rather than the section shrinking a screen until it fits.
         Only when it has to: a page that slides at every step is a page that
         never settles, and the move is supposed to read as emphasis. */
      show: function (sel, ms) {
        var el = screen.querySelector(sel)
        if (!el) return 0                     // pinned to the glass, or absent
        var k = scale()
        var top = (el.getBoundingClientRect().top - screen.getBoundingClientRect().top) / k
        var h = el.offsetHeight
        var glass = win.getBoundingClientRect().height / k
        var seen = -pan                       // design px of screen above the glass
        // Already all the way in? Then nothing moves. A page that slides at
        // every step is a page that never settles, and the move is supposed
        // to read as emphasis rather than as fidgeting.
        if (top >= seen && top + h <= seen + glass) return 0
        var room = Math.max(0, screen.offsetHeight - glass)
        var want = -Math.min(room, Math.max(0, top + h / 2 - glass / 2))
        var shift = (want - pan) * k          // page pixels, for the arrow
        setPan(want, ms)
        return shift
      },
      tap: function () {
        cursor.classList.remove('is-tap')
        // Reflow, or a second tap on the same element never restarts.
        void cursor.offsetWidth
        cursor.classList.add('is-tap')
      },
      type: function (el) {
        if (!el) return
        var text = el.getAttribute('data-type') || ''
        var out = el.querySelector('.m-val')
        // One caret in the window, in the field the pointer just pressed.
        mock.querySelectorAll('.is-caret').forEach(function (o) { o.classList.remove('is-caret') })
        el.setAttribute('data-on', '')
        el.classList.add('is-caret')
        for (var i = 1; i <= text.length; i++) {
          ;(function (n) { at(n * PER_CHAR, function () { out.textContent = text.slice(0, n) }) })(i)
        }
      },
    }

    function play() {
      var steps = script(mock, kind)
      var t = 0
      steps.forEach(function (st) {
        var fn = st[1]
        if (fn) at(t, function () { if (live) fn(api) })
        t += st[0]
      })
      // Hold on the finished screen, then take it from the top. The pause is
      // most of what keeps three of these side by side from reading as noise.
      at(t + 2200, function () { if (live) { reset(); play() } })
    }

    function reset() {
      clear()
      rest(mock, false)
      cursor.classList.remove('is-on', 'is-tap')
      // Straight back to the corner it comes in from, and the page straight
      // back to its top. Animated, either would sail across a screen that has
      // already snapped back to frame one.
      place(92, 106, 0)
      setPan(0, 0)
    }

    return {
      start: function () { if (live) return; live = true; reset(); play() },
      stop: function () { live = false; reset() },
    }
  }

  /* Frame one, or the state the run ends in. One function for both, so the
     reduced-motion rendering and the reset can never drift apart. */
  function rest(mock, finished) {
    mock.querySelectorAll('[data-f]').forEach(function (el) {
      el.classList.remove('is-hot', 'is-gone', 'is-done', 'is-caret')
      if (el.classList.contains('m-sheet') || el.classList.contains('m-acct')) {
        el.removeAttribute('data-on')
      }
      if (el.classList.contains('m-field') || el.classList.contains('m-search')) {
        el.removeAttribute('data-on')
        var v = el.querySelector('.m-val')
        if (v) v.textContent = finished ? (el.getAttribute('data-type') || '') : ''
        if (finished) el.setAttribute('data-on', '')
      }
    })
    mock.querySelectorAll('.m-co').forEach(function (r) { r.classList.remove('is-gone', 'is-hot') })
    var copy = mock.querySelector('[data-f="copy"]')
    if (copy) copy.textContent = 'Copy'
    var go = mock.querySelector('[data-f="go"]')
    if (go) go.textContent = 'Create account'
    // Just the class: the plus and the tick are both in the markup and
    // neither side of this writes text over them. See the run's own note.
    var add = mock.querySelector('[data-f="add-aapl"]')
    if (add) add.classList.remove('is-done')
    var bucket = mock.querySelector('.m-bucket')
    if (bucket) { bucket.textContent = '0'; bucket.classList.remove('is-on') }
    var head = mock.querySelector('.m-sheet-h')
    if (head) head.textContent = 'How are you adding it?'
    var count = mock.querySelector('.m-count')
    if (count) count.textContent = '6 companies'

    /* The page itself, back to its top. */
    var screen = mock.querySelector('.gs-scr')
    if (screen) {
      screen.style.setProperty('--pan-ms', '0ms')
      screen.style.setProperty('--pan', '0px')
    }

    if (finished) {
      /* Where each run lands, for a reader who will never see it move. Not
         the literal last frame: 'Checking your invite…' and 'Copied' are
         things that are true for a second, and a still of one of them is a
         still of a product caught mid-blink. These are the frames each run
         is about. */
      var sheet = mock.querySelector('.m-sheet')
      if (sheet) sheet.setAttribute('data-on', '')
      // A filled form whose button is off the bottom of the glass is a form
      // that looks unfinished, so this one rests at its foot.
      if (screen && mock.querySelector('[data-f="go"]')) {
        screen.style.setProperty('--pan',
          -Math.max(0, screen.offsetHeight - PHONE_H) + 'px')
      }
      // A search reading 'appl' over a list with Microsoft in it is a search
      // that does not work. If the field is filled, the list matches it.
      if (mock.querySelector('[data-f="search"]')) {
        mock.querySelectorAll('.m-co').forEach(function (r) {
          if (r.getAttribute('data-co') !== 'AAPL') r.classList.add('is-gone')
        })
        if (count) count.textContent = '1 company'
      }
    }
  }

  var canHover = matchMedia('(hover: hover) and (pointer: fine)').matches

  mocks.forEach(function (mock) {
    var run = runner(mock, mock.getAttribute('data-gs'))
    rest(mock, false)

    if (canHover) {
      mock.addEventListener('pointerenter', run.start)
      /* Leaving means the pointer left, not that the card did.
         These cards move under a stationary pointer twice over — the
         section's own reveal slides all three up when it comes into view, and
         hover lifts the one you are on by another eight pixels. Either one
         fires pointerleave with the pointer exactly where it was, and the run
         it tore down did not start again until you moved. So ask where the
         pointer is rather than taking the event's word for it. */
      mock.addEventListener('pointerleave', function (e) {
        var r = mock.getBoundingClientRect()
        if (e.clientX > r.left && e.clientX < r.right &&
            e.clientY > r.top && e.clientY < r.bottom) return
        run.stop()
      })
      // And a run that was torn down while the pointer stayed on the card
      // picks itself back up on the next movement over it. start() is a
      // no-op while one is already going, so this costs a comparison.
      mock.addEventListener('pointermove', run.start)
      return
    }
    /* No hover: play it once when it arrives, and leave it on its last frame
       rather than snapping back to an empty form nobody asked to see. */
    if (!('IntersectionObserver' in window)) return
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return
        io.unobserve(e.target)
        run.start()
      })
    }, { threshold: 0.4 })
    io.observe(mock)
  })
})()
