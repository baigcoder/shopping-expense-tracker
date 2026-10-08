const puppeteer = require('f:/CASHLY/shopping-expense-tracker/frontend/node_modules/puppeteer-core');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PREVIEW_BASE = 'http://localhost:4173';
const BACKEND_BASE = 'http://localhost:5000';

async function measureBundle() {
  const distDir = 'f:/CASHLY/shopping-expense-tracker/frontend/dist';
  const assetsDir = path.join(distDir, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  let totalJs = 0;
  let totalJsGzip = 0;
  let totalCss = 0;
  let totalCssGzip = 0;
  const chunkDetails = [];

  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const content = fs.readFileSync(filePath);
    const size = content.length;
    const gzipped = zlib.gzipSync(content).length;

    if (file.endsWith('.js')) {
      totalJs += size;
      totalJsGzip += gzipped;
      chunkDetails.push({ file, type: 'js', size, gzipped });
    } else if (file.endsWith('.css')) {
      totalCss += size;
      totalCssGzip += gzipped;
      chunkDetails.push({ file, type: 'css', size, gzipped });
    }
  }

  // Parse dist/index.html to find initial entry JS and preloaded chunks
  const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const initialScripts = [];
  const scriptRegex = /<script\s+type="module"\s+crossorigin\s+src="\/assets\/([^"]+)"/g;
  let match;
  while ((match = scriptRegex.exec(indexHtml)) !== null) {
    initialScripts.push(match[1]);
  }
  const preloadRegex = /<link\s+rel="modulepreload"\s+crossorigin\s+href="\/assets\/([^"]+)"/g;
  while ((match = preloadRegex.exec(indexHtml)) !== null) {
    initialScripts.push(match[1]);
  }
  const cssRegex = /<link\s+rel="stylesheet"\s+crossorigin\s+href="\/assets\/([^"]+)"/g;
  const initialStyles = [];
  while ((match = cssRegex.exec(indexHtml)) !== null) {
    initialStyles.push(match[1]);
  }

  let initialJsRaw = 0;
  let initialJsGzip = 0;
  for (const s of initialScripts) {
    const chunk = chunkDetails.find(c => c.file === s);
    if (chunk) {
      initialJsRaw += chunk.size;
      initialJsGzip += chunk.gzipped;
    }
  }

  let initialCssRaw = 0;
  let initialCssGzip = 0;
  for (const c of initialStyles) {
    const chunk = chunkDetails.find(ch => ch.file === c);
    if (chunk) {
      initialCssRaw += chunk.size;
      initialCssGzip += chunk.gzipped;
    }
  }

  return {
    totalJsBytes: totalJs,
    totalJsGzipBytes: totalJsGzip,
    totalCssBytes: totalCss,
    totalCssGzipBytes: totalCssGzip,
    initialJsRawBytes: initialJsRaw,
    initialJsGzipBytes: initialJsGzip,
    initialCssRawBytes: initialCssRaw,
    initialCssGzipBytes: initialCssGzip,
    initialScripts,
    initialStyles,
    chunks: chunkDetails.sort((a, b) => b.size - a.size).slice(0, 20)
  };
}

async function measureRoute(browser, route, viewport, throttle4G = false) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  if (throttle4G) {
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    // Fast 4G: 1.6 Mbps download, 750 kbps upload, 150ms RTT
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
      connectionType: 'cellular4g'
    });
    // 4x CPU throttle
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }

  const networkStats = {
    jsBytes: 0,
    cssBytes: 0,
    imgBytes: 0,
    fontBytes: 0,
    totalBytes: 0,
    requests: 0,
    apis: []
  };

  page.on('response', async (response) => {
    try {
      networkStats.requests++;
      const headers = response.headers();
      const len = parseInt(headers['content-length'] || '0', 10);
      const url = response.url();
      const ct = headers['content-type'] || '';

      let size = len;
      if (!size) {
        try {
          const buffer = await response.buffer();
          size = buffer.length;
        } catch (e) {}
      }

      networkStats.totalBytes += size;
      if (ct.includes('javascript') || url.endsWith('.js')) {
        networkStats.jsBytes += size;
      } else if (ct.includes('css') || url.endsWith('.css')) {
        networkStats.cssBytes += size;
      } else if (ct.includes('image') || /\.(png|jpg|jpeg|svg|webp|gif|ico)/i.test(url)) {
        networkStats.imgBytes += size;
      } else if (ct.includes('font') || /\.(woff2?|ttf|otf)/i.test(url) || url.includes('fonts.gstatic.com')) {
        networkStats.fontBytes += size;
      }
      if (url.includes('/api/')) {
        networkStats.apis.push({ url, status: response.status(), size });
      }
    } catch (e) {}
  });

  await page.evaluateOnNewDocument(() => {
    window.__perfData = {
      lcp: 0,
      cls: 0,
      longTasks: []
    };

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.__perfData.lcp = entry.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__perfData.cls += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.__perfData.longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime
        });
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  const start = Date.now();
  await page.goto(`${PREVIEW_BASE}${route}`, { waitUntil: 'networkidle2', timeout: 20000 });
  const navigationTime = Date.now() - start;

  // Let animations / vitals settle
  await new Promise(r => setTimeout(r, 1200));

  const clientMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paint = performance.getEntriesByType('paint') || [];
    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    const domNodes = document.querySelectorAll('*').length;

    return {
      ttfb: Math.round(nav.responseStart - nav.requestStart) || 0,
      domInteractive: Math.round(nav.domInteractive) || 0,
      domComplete: Math.round(nav.domComplete) || 0,
      fcp: Math.round(fcp),
      lcp: Math.round(window.__perfData?.lcp || 0),
      cls: Number((window.__perfData?.cls || 0).toFixed(4)),
      longTaskCount: window.__perfData?.longTasks?.length || 0,
      longTaskTotalDuration: Math.round((window.__perfData?.longTasks || []).reduce((a, b) => a + b.duration, 0)),
      domNodes,
      heapUsedMb: window.performance?.memory ? Number((window.performance.memory.usedJSHeapSize / 1048576).toFixed(2)) : null
    };
  });

  await page.close();

  return {
    route,
    viewport: `${viewport.width}x${viewport.height}`,
    throttled4G: throttle4G,
    navigationTimeMs: navigationTime,
    ...clientMetrics,
    network: {
      jsKb: Math.round(networkStats.jsBytes / 1024),
      cssKb: Math.round(networkStats.cssBytes / 1024),
      imgKb: Math.round(networkStats.imgBytes / 1024),
      fontKb: Math.round(networkStats.fontBytes / 1024),
      totalKb: Math.round(networkStats.totalBytes / 1024),
      requests: networkStats.requests,
      apiCount: networkStats.apis.length
    }
  };
}

async function benchmarkApi(endpoint, iterations = 25) {
  const times = [];
  let payloadBytes = 0;
  let statusCode = 0;

  for (let i = 0; i < iterations; i++) {
    const res = await new Promise((resolve) => {
      const s = Date.now();
      const req = http.get(`${BACKEND_BASE}${endpoint}`, (response) => {
        let size = 0;
        response.on('data', chunk => size += chunk.length);
        response.on('end', () => {
          resolve({ duration: Date.now() - s, size, statusCode: response.statusCode });
        });
      });
      req.on('error', () => resolve({ duration: 9999, size: 0, statusCode: 500 }));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ duration: 5000, size: 0, statusCode: 504 });
      });
    });

    times.push(res.duration);
    payloadBytes = res.size;
    statusCode = res.statusCode;
  }

  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const min = times[0];
  const max = times[times.length - 1];

  return {
    endpoint,
    iterations,
    statusCode,
    minMs: min,
    maxMs: max,
    avgMs: avg,
    p50Ms: p50,
    p95Ms: p95,
    payloadBytes
  };
}

async function run() {
  console.log('--- STARTING COMPREHENSIVE PERFORMANCE VERIFICATION ---');

  // 1. Bundle payload
  console.log('Measuring Bundle Composition...');
  const bundle = await measureBundle();
  console.log(`Initial JS Raw: ${(bundle.initialJsRawBytes / 1024).toFixed(2)} KB, Gzip: ${(bundle.initialJsGzipBytes / 1024).toFixed(2)} KB`);
  console.log(`Initial CSS Raw: ${(bundle.initialCssRawBytes / 1024).toFixed(2)} KB, Gzip: ${(bundle.initialCssGzipBytes / 1024).toFixed(2)} KB`);

  // 2. Backend API Benchmarks
  console.log('Benchmarking Backend Endpoints...');
  const apiEndpoints = [
    '/api/health',
    '/api/ready',
    '/api/transactions',
    '/api/categories',
    '/api/analytics/summary',
    '/api/dashboard/summary',
    '/api/cards',
    '/api/settings',
    '/api/cashflow-calendar'
  ];

  const apiResults = [];
  for (const ep of apiEndpoints) {
    const res = await benchmarkApi(ep, 20);
    apiResults.push(res);
    console.log(`  ${ep}: p50=${res.p50Ms}ms, p95=${res.p95Ms}ms (status=${res.statusCode})`);
  }

  // 3. Frontend Routes Audit
  console.log('Auditing Frontend Routes via Headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const routesToTest = [
    '/',
    '/demo',
    '/login',
    '/signup',
    '/features',
    '/faq',
    '/privacy',
    '/dashboard',
    '/transactions',
    '/analytics',
    '/budgets',
    '/subscriptions',
    '/reports',
    '/cards',
    '/settings',
    '/cashflow-calendar',
    '/money-twin',
    '/shopping-activity'
  ];

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'mobile-375', width: 375, height: 812 },
    { name: 'mobile-430', width: 430, height: 932 }
  ];

  const routeResults = [];

  // Desktop run for all routes
  for (const route of routesToTest) {
    console.log(`  Measuring ${route} (Desktop 1440x900)...`);
    const r = await measureRoute(browser, route, viewports[0]);
    routeResults.push(r);
  }

  // Mobile runs on key routes
  const keyMobileRoutes = ['/', '/demo', '/login', '/dashboard', '/transactions', '/analytics', '/budgets', '/cards'];
  for (const vp of viewports.slice(1)) {
    for (const route of keyMobileRoutes) {
      console.log(`  Measuring ${route} (${vp.name})...`);
      const r = await measureRoute(browser, route, vp);
      routeResults.push(r);
    }
  }

  // 4G Throttled tests for key routes
  console.log('Running 4G Throttled Tests...');
  const throttledRoutes = ['/', '/demo', '/dashboard', '/transactions'];
  const throttledResults = [];
  for (const route of throttledRoutes) {
    console.log(`  Throttled 4G: ${route} (mobile-390)...`);
    const r = await measureRoute(browser, route, viewports[1], true);
    throttledResults.push(r);
  }

  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    bundle,
    apiResults,
    routeResults,
    throttledResults
  };

  const outputPath = 'f:/CASHLY/shopping-expense-tracker/verified_metrics.json';
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nVERIFICATION RUN COMPLETE! Output saved to ${outputPath}`);
}

run().catch(err => {
  console.error('Verification run failed:', err);
  process.exit(1);
});
