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

// A menu item goes to its product card, and the card is not under the bar.
await p.locator('.drop-btn').click()
await p.locator('#products-menu a[href="#product-earn"]').click()
await p.waitForTimeout(900)
const earnTop = await p.locator('#product-earn').evaluate((e) => e.getBoundingClientRect().top)
const navH = await p.locator('.nav').evaluate((e) => e.getBoundingClientRect().height)
t(`anchor clears the bar (top=${Math.round(earnTop)} navH=${Math.round(navH)})`, earnTop >= navH - 1)
t('menu closed after choosing', await p.locator('#products-menu').isHidden())

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
/* The hero leads with a person and carries the product beside them. There is
   no art-directed <picture> swap any more — the phone screenshot is the phone
   screenshot at every width — so what is worth asserting is that both halves
   are present, and that they stack rather than squeeze at this one. */
t('hero has a photograph slot', await p.locator('.showcase .portrait').isVisible())
const heroSrc = await p.locator('.showcase .shot-phone img').evaluate((i) => i.currentSrc)
t(`hero carries the product too (${heroSrc.split('/').pop()})`, /p-home/.test(heroSrc))
const slot = await p.locator('.showcase .portrait').boundingBox()
const ph = await p.locator('.showcase .shot-phone').boundingBox()
t(`showcase stacks at 390 (slot y=${Math.round(slot.y)}, phone y=${Math.round(ph.y)})`,
  ph.y > slot.y + slot.height - 4)
await p.close()

console.log('PASS (' + pass.length + ')\n  ' + pass.join('\n  '))
console.log(fail.length ? '\nFAIL (' + fail.length + ')\n  ' + fail.join('\n  ') : '\nFAIL (0)')
await browser.close()
process.exit(fail.length ? 1 : 0)
