# Interest Rate Calculator

A simple, dependency-free web app that calculates **simple** and **compound**
interest and visualizes the growth difference between the two on a small
line chart.

## Files

- `index.html` — markup, SEO meta tags, favicon, references `styles.css` and `script.js`
- `styles.css` — "Ledger & Line" visual theme
- `script.js` — calculation logic + DOM wiring (also unit-testable in Node)
- `spec/script.spec.js` — Jasmine unit tests for the calculation functions
- `webpack.config.js` — bundles `script.js` into `dist/bundle.js` for distribution

## Running locally

Just open `index.html` in a browser — no build step required to use the app.

## Running the test suite

```bash
npm install
npx jasmine
```

Expected output: `2 specs, 0 failures`.

## Building for distribution

```bash
npx webpack
```

This produces an optimized `dist/bundle.js`.
