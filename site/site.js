/* Tokkenly marketing site. Four small jobs: the bar knows when the page has
   moved, the Products menu opens and closes, the phone menu does the same,
   and sections arrive rather than appear. Nothing here is load-bearing — with
   the script blocked the page is still a readable document. */
;(function () {
  'use strict'

  var nav = document.getElementById('nav')

  /* -------------------------------------------------- the bar on scroll -- */
  var ticking = false
  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(function () {
      nav.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false')
      ticking = false
    })
  }
  addEventListener('scroll', onScroll, { passive: true })
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
