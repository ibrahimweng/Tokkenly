/* Everything on the site that moves when you touch it.
   ---------------------------------------------------------------------------
   The Products menu, the phone menu, the accordion, the blog's chips and the
   two forms, driven the way a person would drive them. The site is read from
   SITE_URL (see _sitelib.mjs); every FAIL sets a non-zero exit.

     npx serve site -l 4321 &
     node app/scripts/_siteinteract.mjs

   The forms post to /api/contact, which needs a Resend key to send anything.
   So the function is stood in for here with page.route: once answering as it
   does with a key (200), once as it does without one (503), so both of the
   states a visitor can see are checked without mail leaving the building. */
import { launch, open, ok, summary, BASE } from './_sitelib.mjs'

const browser = await launch()
const t = (name, cond) => ok(cond, name)

/* ---- desktop: the Products menu, the accordion, the anchors ---- */
let p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await open(p, '/', { waitUntil: 'networkidle' })

t('menu starts closed', await p.locator('#products-menu').isHidden())
await p.locator('.drop-btn').click()
t('menu opens on click', await p.locator('#products-menu').isVisible())
t('menu sets aria-expanded', (await p.locator('.drop-btn').getAttribute('aria-expanded')) === 'true')
await p.keyboard.press('Escape')
t('Escape closes menu', await p.locator('#products-menu').isHidden())
t('and puts focus back on its button', await p.evaluate(() => document.activeElement === document.querySelector('.drop-btn')))
await p.locator('.drop-btn').click()
await p.locator('body').click({ position: { x: 5, y: 500 } })
t('outside click closes menu', await p.locator('#products-menu').isHidden())

/* Tabbing past the last item leaves the menu, and a menu left open behind the
   focus is a panel over the page that nobody is using. */
await p.locator('.drop-btn').focus()
await p.keyboard.press('Enter')
const items = await p.locator('#products-menu a').count()
for (let i = 0; i <= items; i++) await p.keyboard.press('Tab')
t(`tabbing out of the menu closes it (${items} items)`, await p.locator('#products-menu').isHidden())

/* A menu item goes to that product's own page, at its extensionless address. */
await p.locator('.drop-btn').click()
await p.locator('#products-menu a[href="/products/borrow-and-earn"]').click()
await p.waitForLoadState('load')
t(`menu item opens its page (${new URL(p.url()).pathname})`, new URL(p.url()).pathname === '/products/borrow-and-earn')
t('and the page says which one it is', ((await p.locator('h1').textContent()) || '').includes('borrow against it'))
t('the row for the page you are on is marked',
  (await p.locator('#products-menu a[href="/products/borrow-and-earn"]').getAttribute('aria-current')) === 'page')
/* "See how it works" is an anchor into the page it is on. */
const how = await p.locator('.p2-hero .btn', { hasText: 'See how it works' }).getAttribute('href')
t(`its "See how it works" lands somewhere (${how})`, await p.evaluate((h) => !!document.querySelector(h), how))
await p.goBack()
await p.waitForLoadState('load')
t('menu closed after coming back', await p.locator('#products-menu').isHidden())

const d = p.locator('.faq details').first()
t('answer starts closed', !(await d.evaluate((e) => e.open)))
await d.locator('summary').click()
t('answer opens', await d.evaluate((e) => e.open))
t('answer has text', ((await d.locator('.answer p').textContent()) || '').includes('money app'))

/* Nothing in the bar, and nothing anywhere, is a link to nowhere. The footer
   used to carry three social icons pointing at "#"; they are gone until the
   accounts exist. */
const navHrefs = await p.$$eval('.nav-links a', (as) => as.map((a) => a.getAttribute('href')))
t(`every link in the bar goes somewhere (${navHrefs.length})`, navHrefs.length > 0 && navHrefs.every((h) => h && h !== '#'))
t('no link on the page is "#" or data-soon', (await p.$$eval('a[href="#"], [data-soon]', (e) => e.length)) === 0)
t('the products are four cards', (await p.locator('.pr-card').count()) === 4)
await p.close()

/* ---- phone: the burger ---- */
p = await browser.newPage({ viewport: { width: 390, height: 844 } })
await open(p, '/', { waitUntil: 'networkidle' })
t('burger is shown', await p.locator('.burger').isVisible())
t('desktop links are hidden', await p.locator('.nav-links').isHidden())
t('phone menu starts closed', await p.locator('#mobile-menu').isHidden())
await p.locator('.burger').click()
t('burger opens the menu', await p.locator('#mobile-menu').isVisible())
t('focus moves into it', await p.evaluate(() => !!document.activeElement.closest('#mobile-menu')))
t('the page behind stops scrolling', await p.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden'))
/* Tab from the last stop wraps to the button; Shift-Tab from the button wraps
   to the last stop. Focus never reaches the page the menu is covering. */
const stops = await p.locator('#mobile-menu a').count() + 1
let escaped = false
for (let i = 0; i < stops + 2; i++) {
  await p.keyboard.press('Tab')
  if (!(await p.evaluate(() => !!(document.activeElement.closest('#mobile-menu') || document.activeElement.classList.contains('burger'))))) escaped = true
}
t(`Tab stays inside the open menu (${stops} stops)`, !escaped)
await p.keyboard.press('Escape')
t('Escape closes it', await p.locator('#mobile-menu').isHidden())
t('and hands focus back to the button', await p.evaluate(() => document.activeElement.classList.contains('burger')))
t('and the page scrolls again', await p.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'))
const btn = await p.locator('.nav-end .btn').boundingBox()
t(`bar button stays small (w=${Math.round(btn.width)})`, btn.width < 140)
await p.locator('.burger').click()
await p.locator('#mobile-menu a[href="/contact"]').click()
await p.waitForLoadState('load')
t(`choosing takes you there (${new URL(p.url()).pathname})`, new URL(p.url()).pathname === '/contact')
await p.goBack()
await p.waitForLoadState('load')
t('and the menu is closed when you come back', await p.locator('#mobile-menu').isHidden())
/* The hero is the globe with its orbit of portraits. */
t('hero has its globe', await p.locator('#globe').isVisible())
const heroSrc = await p.locator('.globe-img').evaluate((i) => i.currentSrc)
t(`the globe is drawn (${heroSrc.split('/').pop()})`, /globe(-\d+)?\.webp/.test(heroSrc))
const st = await p.locator('.hero-stage').boundingBox()
t(`stage holds its width at 390 (w=${Math.round(st.width)})`, st.width > 300 && st.width <= 390)
t('twelve portraits orbit it', (await p.locator('.orbit-card').count()) === 12)
const chip = await p.locator('.pr-chip').first().boundingBox()
t(`the product chips survive a phone (${Math.round(chip.width)}px)`, chip.width >= 40)
await p.close()

/* ---- the blog's chips ---- */
p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await open(p, '/blog')
const all = await p.locator('.bl-post').count()
await p.locator('.bl-chip', { hasText: 'Product' }).click()
const shown = await p.locator('.bl-post:visible').count()
const cats = await p.$$eval('.bl-post:not([hidden]) .bl-cat', (e) => e.map((x) => x.textContent.trim()))
t(`a chip filters the posts (${shown} of ${all} for Product)`, shown > 0 && shown < all && cats.every((c) => c === 'Product'))
t('and is the one pressed', (await p.locator('.bl-chip', { hasText: 'Product' }).getAttribute('aria-pressed')) === 'true' &&
  (await p.locator('.bl-chip[aria-pressed="true"]').count()) === 1)
await p.locator('.bl-chip', { hasText: 'All' }).click()
t('All brings every post back', (await p.locator('.bl-post:visible').count()) === all)
t('no post pretends to a date', !(await p.locator('.bl-meta').allTextContents()).some((m) => /\d{4}|min read/.test(m)))
await p.close()

/* ---- the forms ---- */
async function formRun(path, status, body, fill) {
  const pg = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  let sent = null
  await pg.route('**/api/contact', async (r) => {
    sent = r.request().postDataJSON()
    await new Promise((res) => setTimeout(res, 300))
    await r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await open(pg, path)
  await fill(pg)
  const form = pg.locator('form[data-form]')
  await form.locator('[type="submit"]').click()
  await pg.waitForTimeout(80)
  const busy = await form.locator('[type="submit"]').isDisabled()
  await pg.waitForFunction(() => /is-(ok|error)/.test(document.querySelector('form[data-form] .form-status').className))
  const out = {
    sent, busy,
    status: await form.locator('.form-status').textContent(),
    live: await form.locator('.form-status').getAttribute('aria-live'),
    mail: await form.locator('.form-status a[href^="mailto:support@tokkenly.com"]').count(),
    enabled: await form.locator('[type="submit"]').isEnabled(),
    url: pg.url(),
  }
  await pg.close()
  return out
}
const contact = async (pg) => {
  await pg.fill('#cf-name', 'Chinaza Okoro')
  await pg.fill('#cf-email', 'chinaza.okoro@example.com')
  await pg.fill('#cf-message', 'A payment has not arrived.')
}
let r = await formRun('/contact', 200, { ok: true, message: 'Thank you. Your message is with us.' }, contact)
t('contact: sends as JSON with its kind, and stays on the page', r.sent && r.sent.kind === 'contact' && r.sent.email === 'chinaza.okoro@example.com' && r.url === BASE + '/contact')
t('contact: the button is disabled while it sends', r.busy)
t(`contact: says so when it has sent ("${r.status}")`, /Thank you/.test(r.status) && r.live === 'polite' && r.enabled)
r = await formRun('/contact', 503, { ok: false, message: 'Our form is not connected yet. Please email us at support@tokkenly.com and we will reply from there.' }, contact)
t('contact: with no key, it says to email support, as a link', /not connected/.test(r.status) && r.mail === 1 && r.enabled)
r = await formRun('/blog', 200, { ok: true, message: 'You are on the list.' }, (pg) => pg.fill('#bl-email', 'you@example.com'))
t('newsletter: sends with kind=newsletter', r.sent && r.sent.kind === 'newsletter' && /on the list/.test(r.status))

/* An empty form does not send at all: the browser asks for what is missing. */
p = await browser.newPage({ viewport: { width: 1440, height: 900 } })
let posted = false
await p.route('**/api/contact', (x) => { posted = true; x.abort() })
await open(p, '/contact')
await p.locator('.cf [type="submit"]').click()
await p.waitForTimeout(200)
t('contact: an empty form is not sent', !posted)
t('contact: its fields say what they are for', (await p.$$eval('#cf-name[autocomplete="name"][required], #cf-email[type="email"][autocomplete="email"][required], #cf-message[required]', (e) => e.length)) === 3)
t('contact: the honeypot is out of reach', await p.$eval('input[name="website"]', (e) => e.tabIndex === -1 && e.closest('[aria-hidden="true"]') !== null))
await p.close()

/* With no script, the form is a plain post and the thank-you is the :target. */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })
p = await ctx.newPage()
await p.route('**/api/contact', (x) => x.fulfill({ status: 303, headers: { Location: '/contact#cf-sent' } }))
await open(p, '/contact')
await contact(p)
await p.locator('.cf [type="submit"]').click()
await p.waitForLoadState('load')
t(`no script: lands back on the page at #cf-sent (${new URL(p.url()).hash})`, p.url().endsWith('/contact#cf-sent'))
t('no script: and the thank-you shows', await p.locator('#cf-sent').isVisible())
await ctx.close()

await browser.close()
summary()
