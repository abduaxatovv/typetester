import fs from 'node:fs'
import path from 'node:path'

/**
 * Collapses the standalone offline build (dist-offline/) into ONE HTML file
 * (`dist/offline-app.html`): every script and stylesheet is inlined so the
 * result runs from file:// with no network. Also inlines the favicon as a
 * data URI so nothing external is referenced.
 */
const out = 'dist'
const offlineDir = 'dist-offline'

if (!fs.existsSync(offlineDir)) {
  console.log('No dist-offline build found; skipping offline bundle generation.')
  process.exit(0)
}

const htmlPath = path.join(offlineDir, 'index.html')
let html = fs.readFileSync(htmlPath, 'utf8')

// Inline favicon as data URI.
const faviconPath = path.join(offlineDir, 'favicon.svg')
if (fs.existsSync(faviconPath)) {
  const svg = fs.readFileSync(faviconPath, 'utf8')
  const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64')
  html = html.replace(/href="\.?\/?favicon\.svg"/, `href="${dataUri}"`)
}

// Inline every local stylesheet.
const cssRe = /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g
html = html.replace(cssRe, (_m, href) => {
  const file = path.join(offlineDir, href.replace(/^\.\//, ''))
  if (!fs.existsSync(file)) return _m
  const css = fs.readFileSync(file, 'utf8')
  return `<style>${css}</style>`
})

// Inline every local module script (defer irrelevant for file://).
const jsRe = /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g
html = html.replace(jsRe, (_m, src) => {
  const file = path.join(offlineDir, src.replace(/^\.\//, ''))
  if (!fs.existsSync(file)) return _m
  const js = fs.readFileSync(file, 'utf8')
  return `<script type="module">${js}</script>`
})

fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'offline-app.html'), html, 'utf8')
console.log('Wrote dist/offline-app.html', (html.length / 1024 / 1024).toFixed(2), 'MB')
