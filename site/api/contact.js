/* The site's one serverless function: the contact form and the newsletter
   sign-up both post here, and it sends each on as an email through Resend.
   ---------------------------------------------------------------------------
   Vercel deploys any file in site/api as a function even though the site has
   no build step, so this needs no install and has no dependencies: Node's own
   fetch talks to Resend's HTTP API.

   Configuration, on the site's Vercel project (Settings → Environment
   Variables):

     RESEND_API_KEY   required. Without it nothing can be sent, and the
                      function says so with a 503 rather than pretending.
     CONTACT_TO       where messages are delivered. Defaults to
                      ibrahimweng0@gmail.com, the mailbox mail actually
                      reaches. It is configuration, never page copy: the
                      address a visitor sees is support@tokkenly.com.

   Mail goes out from support@tokkenly.com, so tokkenly.com has to be a
   verified sending domain in Resend before the first message will leave.
   The visitor's own address is the Reply-To, so answering is one click.

   Two ways in, one function:
     - fetch from site.js, asking for JSON. It gets { ok, message } back and
       the page writes the message into the form's status line.
     - a plain form post with no script. It gets a 303 back to the page it
       came from, at #cf-sent or #cf-failed (#bl-… for the newsletter), and
       the page shows the matching note because it is the :target.

   The rate limit is deliberately naive: a count per address, held in this
   instance's memory. A cold start forgets it and two instances do not share
   it, so it stops one script hammering the form, not a determined attacker.
   The honeypot does more of the work. */

const TO = process.env.CONTACT_TO || 'ibrahimweng0@gmail.com'
const FROM = 'Tokkenly website <support@tokkenly.com>'
const SUPPORT = 'support@tokkenly.com'

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map()

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/
const KINDS = {
  contact: { page: '/contact', anchor: 'cf' },
  newsletter: { page: '/blog', anchor: 'bl' },
}

function limited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  /* Keep the map from growing without end on a long-lived instance. */
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k)
  return recent.length > MAX_PER_WINDOW
}

/* Vercel's Node runtime parses the body itself when it is read as req.body;
   anywhere else (the local test server) the stream is read here. */
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body
    return parse(String(req.body), req.headers['content-type'])
  }
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 20000) throw Object.assign(new Error('too large'), { status: 413 })
  }
  return parse(raw, req.headers['content-type'])
}

function parse(raw, type = '') {
  if (type.includes('application/json')) {
    try { return JSON.parse(raw || '{}') } catch { return {} }
  }
  return Object.fromEntries(new URLSearchParams(raw))
}

const clean = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max)

function validate(b) {
  const kind = KINDS[b.kind] ? b.kind : 'contact'
  const email = clean(b.email, 254)
  const errors = []
  const out = { kind, email }
  if (kind === 'contact') {
    out.name = clean(b.name, 200).replace(/\n/g, ' ')
    out.about = clean(b.about, 200).replace(/\n/g, ' ')
    out.message = clean(b.message, 5000)
    if (!out.name) errors.push('your name')
  }
  if (!EMAIL_RE.test(email)) errors.push('an email address we can reply to')
  if (kind === 'contact' && out.message.length < 2) errors.push('a message')
  return { out, errors }
}

function compose(v) {
  if (v.kind === 'newsletter') {
    return {
      subject: 'Newsletter sign-up: ' + v.email,
      text: `${v.email} asked for the monthly newsletter from the blog page.\n`,
    }
  }
  return {
    subject: `Website message${v.about ? ': ' + v.about : ''} (from ${v.name})`,
    text: `From: ${v.name} <${v.email}>\nAbout: ${v.about || '(not given)'}\n\n${v.message}\n`,
  }
}

function reply(req, res, status, ok, message, kind) {
  const wantsJson = /application\/json/.test(req.headers.accept || '') ||
    /application\/json/.test(req.headers['content-type'] || '')
  if (wantsJson) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    return res.end(JSON.stringify({ ok, message }))
  }
  const k = KINDS[kind] || KINDS.contact
  res.statusCode = 303
  res.setHeader('Location', `${k.page}#${k.anchor}-${ok ? 'sent' : 'failed'}`)
  res.setHeader('Cache-Control', 'no-store')
  return res.end()
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Allow', 'POST')
    return res.end('Method not allowed')
  }

  let body
  try { body = await readBody(req) } catch (e) {
    return reply(req, res, e.status || 400, false, 'That message was too long to send.', 'contact')
  }
  const kind = KINDS[body.kind] ? body.kind : 'contact'

  /* A filled honeypot is a bot. Tell it everything went well. */
  if (clean(body.website, 200)) return reply(req, res, 200, true, 'Thank you.', kind)

  const { out, errors } = validate(body)
  if (errors.length) {
    const list = errors.length > 1 ? errors.slice(0, -1).join(', ') + ' and ' + errors.at(-1) : errors[0]
    return reply(req, res, 400, false, 'Please add ' + list + '.', kind)
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  if (limited(ip)) {
    return reply(req, res, 429, false,
      `That is a lot of messages in a few minutes. Please wait a little, or email ${SUPPORT}.`, kind)
  }

  const key = process.env.RESEND_API_KEY
  if (!key) {
    return reply(req, res, 503, false,
      `Our form is not connected yet. Please email us at ${SUPPORT} and we will reply from there.`, kind)
  }

  const { subject, text } = compose(out)
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: out.email, subject, text }),
    })
    if (!r.ok) {
      console.error('resend refused', r.status, (await r.text()).slice(0, 300))
      return reply(req, res, 502, false, `That did not go through. Please email us at ${SUPPORT}.`, kind)
    }
  } catch (e) {
    console.error('resend unreachable', e && e.message)
    return reply(req, res, 502, false, `That did not go through. Please email us at ${SUPPORT}.`, kind)
  }

  return reply(req, res, 200, true, out.kind === 'newsletter'
    ? 'You are on the list. The first one arrives when there is something worth sending.'
    : 'Thank you. Your message is with us, and we reply within one working day.', kind)
}
