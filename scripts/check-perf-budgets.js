// scripts/check-perf-budgets.js
// Regression guard for Cashly frontend performance budgets

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BUDGETS = {
  maxInitialJsGzipKb: 200,
  maxInitialCssGzipKb: 50
};

const distDir = path.resolve(__dirname, '../frontend/dist');
const assetsDir = path.join(distDir, 'assets');
const indexHtmlPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ dist/index.html not found! Run "npm run build" first.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Find all entry and preloaded JS files
const scriptRegex = /<script\s+type="module"\s+crossorigin\s+src="\/assets\/([^"]+)"/g;
const preloadRegex = /<link\s+rel="modulepreload"\s+crossorigin\s+href="\/assets\/([^"]+)"/g;
const cssRegex = /<link\s+rel="stylesheet"\s+crossorigin\s+href="\/assets\/([^"]+)"/g;

const initialScripts = [];
let match;
while ((match = scriptRegex.exec(indexHtml)) !== null) {
  initialScripts.push(match[1]);
}
while ((match = preloadRegex.exec(indexHtml)) !== null) {
  initialScripts.push(match[1]);
}

const initialStyles = [];
while ((match = cssRegex.exec(indexHtml)) !== null) {
  initialStyles.push(match[1]);
}

let initialJsRaw = 0;
let initialJsGzip = 0;
for (const s of initialScripts) {
  const p = path.join(assetsDir, s);
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    initialJsRaw += buf.length;
    initialJsGzip += zlib.gzipSync(buf).length;
  }
}

let initialCssRaw = 0;
let initialCssGzip = 0;
for (const c of initialStyles) {
  const p = path.join(assetsDir, c);
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    initialCssRaw += buf.length;
    initialCssGzip += zlib.gzipSync(buf).length;
  }
}

const jsGzipKb = initialJsGzip / 1024;
const cssGzipKb = initialCssGzip / 1024;

console.log('=== CASHLY PERFORMANCE REGRESSION GUARD ===');
console.log(`Initial JS Gzip:  ${jsGzipKb.toFixed(2)} KB (Budget: < ${BUDGETS.maxInitialJsGzipKb} KB)`);
console.log(`Initial CSS Gzip: ${cssGzipKb.toFixed(2)} KB (Budget: < ${BUDGETS.maxInitialCssGzipKb} KB)`);

let failed = false;

if (jsGzipKb > BUDGETS.maxInitialJsGzipKb) {
  console.error(`❌ REGRESSION: Initial JS payload (${jsGzipKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.maxInitialJsGzipKb} KB!`);
  failed = true;
} else {
  console.log(`✅ Initial JS payload is well within budget (-${(BUDGETS.maxInitialJsGzipKb - jsGzipKb).toFixed(2)} KB headroom).`);
}

if (cssGzipKb > BUDGETS.maxInitialCssGzipKb) {
  console.error(`❌ REGRESSION: Initial CSS payload (${cssGzipKb.toFixed(2)} KB) exceeds budget of ${BUDGETS.maxInitialCssGzipKb} KB!`);
  failed = true;
} else {
  console.log(`✅ Initial CSS payload is well within budget (-${(BUDGETS.maxInitialCssGzipKb - cssGzipKb).toFixed(2)} KB headroom).`);
}

if (failed) {
  process.exit(1);
} else {
  console.log('✨ All performance regression guards PASSED!');
  process.exit(0);
}
