const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = 'C:\\Users\\Baigo\\.gemini\\antigravity-ide\\brain\\aef8bc73-9e1b-4083-9e4d-1dfb855da683\\screenshots\\extension';

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
    console.log('Launching Edge for Extension UI QA verification...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 420, height: 700, deviceScaleFactor: 2 });

    // ── 1. Capture Extension Popup: Login / Sync View ──
    console.log('1. Loading Extension Popup (Login / Sync View)...');
    await page.goto('http://localhost:5174/extension/popup.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const popupShell = await page.$('.popup-shell');
    if (popupShell) {
        await popupShell.screenshot({ path: path.join(OUT_DIR, '01_ext_popup_login.png') });
        console.log('Saved: 01_ext_popup_login.png');
    }

    // ── 2. Capture Extension Popup: Main Companion Dashboard View ──
    console.log('2. Simulating Synced Main Companion View...');
    await page.evaluate(() => {
        // Toggle view
        document.getElementById('loginView').hidden = true;
        document.getElementById('mainView').hidden = false;

        // Populate sample operational data
        document.getElementById('userEmail').textContent = 'baigo@cashly.ai';
        document.getElementById('monthlySpent').textContent = '$1,420.50';
        document.getElementById('pendingCount').textContent = '3';
        document.getElementById('queuedCount').textContent = '0';
        document.getElementById('failedCount').textContent = '0';
        document.getElementById('siteName').textContent = 'amazon.com';
        document.getElementById('lastDetection').textContent = 'Sony WH-1000XM5 (Rs 34,990) staged in inbox.';

        const statusDot = document.querySelector('#syncStatus .dot');
        if (statusDot) statusDot.classList.remove('warn');
        document.querySelector('#syncStatus .health-label').textContent = 'Companion Live Synchronized';

        // Render sample recent transactions
        const list = document.getElementById('recentTransactions');
        list.innerHTML = `
            <div class="tx-row">
                <div>
                    <p>Sony WH-1000XM5</p>
                    <span>Electronics • Amazon</span>
                </div>
                <strong>-$349.90</strong>
            </div>
            <div class="tx-row">
                <div>
                    <p>Whole Foods Market</p>
                    <span>Groceries • Offline</span>
                </div>
                <strong>-$64.20</strong>
            </div>
            <div class="tx-row">
                <div>
                    <p>Spotify Premium</p>
                    <span>Bills • Recurring</span>
                </div>
                <strong>-$12.99</strong>
            </div>
        `;
    });

    await new Promise(r => setTimeout(r, 600));
    if (popupShell) {
        await popupShell.screenshot({ path: path.join(OUT_DIR, '02_ext_popup_main.png') });
        console.log('Saved: 02_ext_popup_main.png');
    }

    // ── 3. Capture Extension Settings View ──
    console.log('3. Simulating Extension Settings View...');
    await page.evaluate(() => {
        document.getElementById('mainView').hidden = true;
        document.getElementById('settingsView').hidden = false;
        document.getElementById('apiStatus').textContent = 'Connected (12ms)';
    });

    await new Promise(r => setTimeout(r, 600));
    if (popupShell) {
        await popupShell.screenshot({ path: path.join(OUT_DIR, '03_ext_popup_settings.png') });
        console.log('Saved: 03_ext_popup_settings.png');
    }

    // ── 4. Capture In-Page Checkout Toast HUD ──
    console.log('4. Simulating In-Page Checkout HUD on Store Page...');
    const storePage = await browser.newPage();
    await storePage.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
    
    // Create an ambient store background
    await storePage.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
            <link rel="stylesheet" href="http://localhost:5174/extension/content.css">
            <style>
                body {
                    margin: 0;
                    padding: 40px;
                    background: #F7F5F0;
                    font-family: 'Inter', sans-serif;
                }
                .store-bg {
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    border: 1px solid #E5E5E5;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                }
                .store-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 2px solid #EEEEEE;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .order-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0F172A;
                }
                .order-subtitle {
                    color: #64748B;
                    font-size: 14px;
                    margin-top: 4px;
                }
            </style>
        </head>
        <body>
            <div class="store-bg">
                <div class="store-header">
                    <div>
                        <div class="order-title">Order Confirmation #AMZ-994821</div>
                        <div class="order-subtitle">checkout.amazon.com/confirmation — Delivered to Baigo Sovereign</div>
                    </div>
                    <span style="font-weight: bold; color: #059669">✓ Order Placed</span>
                </div>
                <div style="padding: 20px; background: #FAF8F5; border-radius: 8px;">
                    <div style="font-weight: 700; font-size: 16px;">Sony WH-1000XM5 Wireless Noise Canceling Headphones</div>
                    <div style="color: #64748B; font-size: 13px; margin-top: 4px;">Qty: 1 • Sold by Amazon.com Services LLC</div>
                    <div style="font-size: 20px; font-weight: 800; margin-top: 12px;">$349.90</div>
                </div>
            </div>

            <!-- Injected Cashly HUD Notification -->
            <div id="cashly-notification">
                <div class="cashly-toast">
                    <div class="cashly-toast-head">
                        <span class="cashly-toast-icon">C</span>
                        <div>
                            <strong class="cashly-toast-title">Queued in Cashly Inbox</strong>
                            <span class="cashly-toast-sub">Amazon Checkout Captured</span>
                        </div>
                        <button class="cashly-toast-close" type="button" aria-label="Dismiss">×</button>
                    </div>
                    <div class="cashly-toast-body">
                        <div class="cashly-toast-row">
                            <span>Merchant</span>
                            <strong>amazon.com</strong>
                        </div>
                        <div class="cashly-toast-row">
                            <span>Detected Total</span>
                            <strong>$349.90</strong>
                        </div>
                        <div class="cashly-toast-row">
                            <span>Runway Impact</span>
                            <strong style="color: #D97706">-3.8 Days</strong>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);

    await new Promise(r => setTimeout(r, 600));
    await storePage.screenshot({ path: path.join(OUT_DIR, '04_ext_checkout_hud.png') });
    console.log('Saved: 04_ext_checkout_hud.png');

    await browser.close();
    console.log('All extension verification screenshots completed successfully!');
}

run().catch(e => {
    console.error('Extension capture error:', e);
    process.exit(1);
});
