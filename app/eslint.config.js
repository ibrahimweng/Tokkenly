// ESLint, for correctness and not for style.
//
// The code has a house style that nothing enforced until now, and reformatting
// every file to a linter's taste would be a diff nobody could review. So the
// rules on here are the ones that catch bugs — an undefined name, a name
// declared and never used, a duplicate key, unreachable code — and the
// stylistic ones are off. Formatting belongs to Prettier (.prettierrc),
// which is opt-in per file rather than run across the tree.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
  // The `_site*` scripts are the marketing site's, maintained with it (see
  // site/README.md), and are not held to this config yet.
  { ignores: ['dist/**', 'node_modules/**', 'shots/**', 'figma/**', '.icons.bundle.mjs', 'scripts/_site*.mjs'] },

  js.configs.recommended,

  // The product: TypeScript in the browser. vite.config.ts rides along for
  // the TypeScript parser; it runs in Node, hence the Node globals below.
  {
    files: ['src/**/*.ts', '*.ts'],
    extends: [tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      // tsc already reports these, with noUnusedLocals and noUnusedParameters.
      '@typescript-eslint/no-unused-vars': 'off',
      // `!` is used where the DOM guarantees an element the types cannot see.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // A few `any`s at the edges (JSON from storage) are deliberate.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Config files and the scripts that drive a browser: Node, with the
  // callbacks passed to page.evaluate running in the page.
  {
    files: ['*.js', 'scripts/**/*.{mjs,js}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // Suites deliberately leave a value unread when the read is the check
      // that the element exists; and `catch {}` around storage is the house
      // idiom for "private mode, carry on".
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  { files: ['*.ts'], languageOptions: { globals: globals.node } },

  // figma/node.js is not a module: it is pasted into a use_figma script that
  // declares the names it uses (PARTS, missing, byName, styleFor, rgb, figma).
  {
    files: ['scripts/figma/node.js'],
    languageOptions: { sourceType: 'script', globals: { PARTS: 'readonly', missing: 'readonly',
      byName: 'readonly', styleFor: 'readonly', rgb: 'readonly', figma: 'readonly' } },
    rules: { 'no-unused-vars': 'off' },
  },
)
