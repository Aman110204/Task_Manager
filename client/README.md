# Local Task Manager - Production Deployment Guide

This project is a fully client-side Task Manager (no backend) with local authentication and local task persistence.

## Stack

- React (client-only)
- Browser storage: `IndexedDB` with `localStorage` fallback
- Web Crypto API (`SHA-256`) for password hashing

## Security Hardening Implemented

- Passwords are hashed with `SHA-256` before storage.
- Input sanitization for names, emails, task titles, and notes.
- Strict data validation before loading users/tasks/session.
- Corrupted storage payloads are auto-cleared safely.
- CSP in `public/index.html`:
  - blocks unsafe inline scripts
  - allows only same-origin scripts/styles/assets
- React rendering is used (auto-escapes output), reducing XSS injection risk.

## Reliability Hardening Implemented

- `src/storage/resilientStore.js`:
  - tries `IndexedDB` first
  - falls back to `localStorage` if IndexedDB fails/unavailable
  - mirrors writes in localStorage as backup
- Schema validation is enforced during reads in auth/task services.

## Build Output Structure

Run:

```bash
npm install
npm run build:prod
```

This creates:

```text
dist/
  index.html
  css/
  js/
  assets/
  favicon.ico
  manifest.json
  robots.txt
  sw.js
```

## Deploy Instructions

### GitHub Pages

1. Run `npm run build:prod`.
2. Push the `client/dist` contents to a `gh-pages` branch (or configure GitHub Actions to publish `client/dist`).
3. In repository settings:
   - Pages -> Source -> `gh-pages` branch, root.

### Netlify

1. Import the repository in Netlify.
2. Base directory: `client`
3. Build command: `npm run build:prod`
4. Publish directory: `dist`
5. `netlify.toml` is already included.

### Vercel

1. Import the repository in Vercel.
2. Root directory: `client`
3. Build command: `npm run build:prod`
4. Output directory: `dist`
5. `vercel.json` is already included.

## Notes

- This app is local-device scoped by design. Data is not shared across devices/browsers.
- Because there is no backend, account recovery and cross-device sync are not available.
