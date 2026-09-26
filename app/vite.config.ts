import { createHash } from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'

/* The Content Security Policy, written into the built index.html.

   It lives in the page rather than in vercel.json because it has to name the
   inline script in <head> (the one that sets the theme before anything
   paints) by its hash, and a hash typed into a config file goes stale the
   first time somebody edits that script: the theme script is then refused,
   silently, and the flash it exists to stop comes back. Computed here, at
   build time, from the script as it actually is, it cannot drift.

   What it allows is what the app does: its own scripts, styles, fonts and
   images, and nothing from anywhere else. No inline styles: the app sets
   style through the CSSOM (el.style), which the policy does not govern, and a
   style="" attribute anywhere would be refused and logged, which walk.mjs and
   phone.mjs fail on. frame-ancestors cannot be set from a <meta>, so it is in
   the response headers (vercel.json) with the rest. */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'tokkenly-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
        const hashes = inline.map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`)
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')}`.trim(),
          "style-src 'self'",
          "img-src 'self' data: blob:",
          "font-src 'self'",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
        // Straight after the charset, so it governs every script that follows.
        return html.replace(
          /(<meta charset="[^"]*"\s*\/?>)/i,
          `$1\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        )
      },
    },
  }
}

export default defineConfig({
  // Absolute, not './'. The catch-all rewrite in vercel.json serves index.html
  // for any path, so a link typed without a hash, like /market/aapl, gets the
  // app rather than a 404. A relative base would look for the assets under
  // /market/ and find nothing. With no hash, the router reads the path as the
  // route it names (fromPathname in src/router.ts): /market/aapl?sheet=x
  // becomes #/market/aapl?sheet=x, and only a path with no screen behind it
  // opens at Home. So the rewrite is what makes a plain path deep-link.
  base: '/',
  plugins: [contentSecurityPolicy()],
  // localhost only. The dev server used to listen on every interface, which
  // put a work-in-progress build on whatever network the laptop was on. To
  // reach it from a phone on purpose: npm run dev -- --host
  server: { port: 5173 },
  // No sourcemaps. They shipped with every deploy and handed anyone the
  // unminified source, and there is no error reporter to give them to. If one
  // arrives, 'hidden' plus an upload step is the setting to come back to.
  build: { outDir: 'dist', sourcemap: false },
})
