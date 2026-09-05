import { defineConfig } from 'vite'

export default defineConfig({
  // Absolute, not './'. The catch-all rewrite makes a deep path like
  // /market/aapl serve index.html, and a relative base would look for its
  // assets under /market/ and find nothing.
  base: '/',
  server: { port: 5173, host: true },
  build: { outDir: 'dist', sourcemap: true },
})
