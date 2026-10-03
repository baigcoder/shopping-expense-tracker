const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = 'C:\\Users\\Baigo\\.gemini\\antigravity-ide\\brain\\aef8bc73-9e1b-4083-9e4d-1dfb855da683\\screenshots';

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
    console.log('Launching Edge from:', EDGE_PATH);
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    // 1. Desktop 1440x900
    console.log('1. Loading http://localhost:5174 at 1440x900...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Capture Hero
    await page.screenshot({ path: path.join(OUT_DIR, '01_hero_1440.png') });
    console.log('Saved: 01_hero_1440.png');

    // Section captures by ID
    const sections = [
        { id: 'triptych', name: '02_triptych.png' },
        { id: 'lifecycle', name: '03_lifecycle.png' },
        { id: 'review-first', name: '04_review_difference.png' },
        { id: 'desktop-showcase', name: '05_desktop_showcase.png' },
        { id: 'mobile-showcase', name: '06_mobile_showcase.png' },
        { id: 'pillars', name: '07_pillars.png' },
        { id: 'money-twin', name: '08_money_twin.png' },
        { id: 'assist', name: '09_ai_assist.png' },
        { id: 'extension', name: '10_extension.png' },
        { id: 'trust', name: '11_trust.png' },
        { id: 'final-cta', name: '12_final_cta.png' }
    ];

    for (const sec of sections) {
        try {
            const el = await page.$(`#${sec.id}`);
            if (el) {
                await el.scrollIntoView();
                await new Promise(r => setTimeout(r, 600));
                await el.screenshot({ path: path.join(OUT_DIR, sec.name) });
                console.log(`Saved element screenshot: ${sec.name}`);
            } else {
                console.warn(`Element #${sec.id} not found`);
            }
        } catch (e) {
            console.error(`Error capturing ${sec.name}:`, e.message);
        }
    }

    // 2. Full-page Desktop 1440
    console.log('Capturing full-page desktop 1440...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUT_DIR, 'full_page_1440.png'), fullPage: true });
    console.log('Saved: full_page_1440.png');

    // 3. Viewport 1920x1080 (Cinematic)
    console.log('Capturing 1920x1080 viewport...');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, 'viewport_1920.png') });

    // 4. Viewport 1280x800 (Compact laptop)
    console.log('Capturing 1280x800 viewport...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, 'viewport_1280.png') });

    // 5. Tablet 768x1024
    console.log('Capturing 768x1024 tablet...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, 'viewport_tablet_768.png') });
    await page.screenshot({ path: path.join(OUT_DIR, 'full_tablet_768.png'), fullPage: true });

    // 6. Mobile 430x932 (iPhone Pro Max)
    console.log('Capturing 430x932 mobile...');
    await page.setViewport({ width: 430, height: 932 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, 'viewport_mobile_430.png') });
    await page.screenshot({ path: path.join(OUT_DIR, 'full_mobile_430.png'), fullPage: true });

    // 7. Mobile 390x844 (iPhone standard)
    console.log('Capturing 390x844 mobile...');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, 'viewport_mobile_390.png') });

    console.log('All screenshots completed successfully!');
    await browser.close();
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
