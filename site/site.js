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
      var run = hero ? hero.offsetHeight - nav.offsetHeight : 320
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
