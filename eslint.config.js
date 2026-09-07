import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

// Three environments live in this repo and they don't share globals:
// the React app (browser), the Worker/API handlers (worker runtime, which
// for linting purposes is close enough to Node's globals plus fetch), and
// the test files (node:test). Split so a `document` reference in a Worker
// handler, or a `window` in a test, gets caught rather than passing.
export default [
  { ignores: ["dist/**", "node_modules/**"] },

  js.configs.recommended,

  {
    rules: {
      // `try { ... } catch {}` is a deliberate, commented pattern throughout
      // (storage access that can throw, best-effort logging) — an empty
      // catch is the intent, not an oversight. Every other empty block
      // still gets flagged.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  // React app
  {
    files: ["src/**/*.{js,jsx,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      // Without this, a component referenced only from JSX reads as an
      // unused variable to the base no-unused-vars rule.
      "react/jsx-uses-vars": "error",
      // The two long-standing hook rules, enabled explicitly rather than
      // via the plugin's `recommended` preset: that preset now also turns
      // on a batch of much more opinionated style rules (set-state-in-effect,
      // refs-during-render, ...) which flag hundreds of places in this
      // codebase that work correctly today. Those are worth revisiting
      // deliberately, not as the price of having any linting at all.
      "react-hooks/rules-of-hooks": "error",
      // Warn, not error: several effects here intentionally leave deps out
      // (documented at each site), so this is a prompt to look rather than
      // a build-breaker.
      "react-hooks/exhaustive-deps": "warn",
      // Let an underscore mark a deliberately unused binding.
      "no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
    },
  },

  // Worker + API handlers
  {
    files: ["functions/**/*.mjs", "worker/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node, ...globals.worker },
    },
  },

  // Tests
  {
    files: ["test/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
  },
];
