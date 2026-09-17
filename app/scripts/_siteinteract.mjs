import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const pass = [], fail = []
const t = (name, ok) => (ok ? pass : fail).push(name)

/* ---- desktop: the Products menu, the accordion, the anchors ---- */
let p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' })

t('menu starts closed', await p.locator('#products-menu').isHidden())
await p.locator('.drop-btn').click()
t('menu opens on click', await p.locator('#products-menu').isVisible())
t('menu sets aria-expanded', (await p.locator('.drop-btn').getAttribute('aria-expanded')) === 'true')
await p.keyboard.press('Escape')
t('Escape closes menu', await p.locator('#products-menu').isHidden())
await p.locator('.drop-btn').click()
await p.locator('body').click({ position: { x: 5, y: 500 } })
t('outside click closes menu', await p.locator('#products-menu').isHidden())

/* A menu item goes to that product's own page. It used to jump to a card on
   this page, which was the right behaviour while the products were four cards
   and no pages; there are eight pages now and the menu is a signpost. */
await p.locator('.drop-btn').click()
await p.locator('#products-menu a[href="./products/borrow.html"]').click()
await p.waitForLoadState('load')
t(`menu item opens its page (${new URL(p.url()).pathname})`, /\/products\/borrow\.html$/.test(p.url()))
t('and the page says which one it is',
  (await p.locator('h1').textContent()).includes('breathing room'))
t('the row for the page you are on is marked',
  (await p.locator('#products-menu a[href="../products/borrow.html"]').getAttribute('aria-current')) === 'page')
await p.goBack()
await p.waitForLoadState('load')
t('menu closed after coming back', await p.locator('#products-menu').isHidden())

const d = p.locator('.faq details').first()
t('answer starts closed', !(await d.evaluate((e) => e.open)))
await d.locator('summary').click()
t('answer opens', await d.evaluate((e) => e.open))
t('answer has text', ((await d.locator('.answer p').textContent()) || '').includes('money app'))

const before = p.url()
await p.locator('.nav-links a[data-soon]').click()
t('unbuilt link does not navigate', p.url() === before)
await p.close()

/* ---- phone: the burger ---- */
p = await browser.newPage({ viewport: { width: 390, height: 844 } })
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' })
t('burger is shown', await p.locator('.burger').isVisible())
t('desktop links are hidden', await p.locator('.nav-links').isHidden())
t('phone menu starts closed', await p.locator('#mobile-menu').isHidden())
await p.locator('.burger').click()
t('burger opens the menu', await p.locator('#mobile-menu').isVisible())
const btn = await p.locator('.nav-end .btn').boundingBox()
t(`bar button stays small (w=${Math.round(btn.width)})`, btn.width < 140)
await p.locator('#mobile-menu a[href="#faq"]').click()
t('choosing closes the menu', await p.locator('#mobile-menu').isHidden())
/* The hero is the globe with its orbit of portraits. This used to assert a
   colour panel with a screenshot on it, which is the hero from two rebuilds
   ago; what is worth asserting now is that the globe is drawn, that it keeps
   a real width at 390 rather than collapsing, and that the ring is populated. */
t('hero has its globe', await p.locator('#globe').isVisible())
const heroSrc = await p.locator('.globe-img').evaluate((i) => i.currentSrc)
t(`the globe is drawn (${heroSrc.split('/').pop()})`, /globe\.webp/.test(heroSrc))
const st = await p.locator('.hero-stage').boundingBox()
t(`stage holds its width at 390 (w=${Math.round(st.width)})`, st.width > 300 && st.width <= 390)
t('portraits orbit it', (await p.locator('.orbit-card').count()) === 6)

/* The bento is measured in min(Npx, Mvw), which has a ceiling and no floor,
   so at 390 the 52px chip used to render at 10 and the 36 of card padding at
   7. And the white receipt inside those cards inherited the card's pale mint
   text colour, at every width, because `.pr-card p` beats inheritance. */
t('the products are four cards', (await p.locator('.pr-card').count()) === 4)
const chip = await p.locator('.pr-chip').first().boundingBox()
t(`their chips survive a phone (${Math.round(chip.width)}px)`, chip.width >= 40)
const pad = await p.locator('.pr-narrow').first().evaluate((e) => parseFloat(getComputedStyle(e).paddingLeft))
t(`so does their padding (${Math.round(pad)}px)`, pad >= 20)
const val = await p.locator('.popup .pop-v').first().evaluate((e) => getComputedStyle(e).color)
const [vr, vg, vb] = val.match(/\d+/g).map(Number)
t(`the receipt reads (${val})`, (0.2126 * vr + 0.7152 * vg + 0.0722 * vb) / 255 < 0.35)
await p.close()

console.log('PASS (' + pass.length + ')\n  ' + pass.join('\n  '))
console.log(fail.length ? '\nFAIL (' + fail.length + ')\n  ' + fail.join('\n  ') : '\nFAIL (0)')
await browser.close()
process.exit(fail.length ? 1 : 0)
