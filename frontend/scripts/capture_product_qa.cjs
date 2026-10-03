const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_DIR = 'C:\\Users\\Baigo\\.gemini\\antigravity-ide\\brain\\aef8bc73-9e1b-4083-9e4d-1dfb855da683\\screenshots\\product';

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

const routes = [
    { path: '/dashboard', name: 'app_dashboard' },
    { path: '/transaction-inbox', name: 'app_review_inbox' },
    { path: '/money-twin', name: 'app_money_twin' },
    { path: '/insights', name: 'app_insights' },
    { path: '/budgets', name: 'app_budgets' },
    { path: '/cards', name: 'app_cards' },
    { path: '/extension-health', name: 'app_extension' },
    { path: '/settings', name: 'app_settings' }
];

async function run() {
    console.log('Launching Edge for authenticated product UI verification...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    // First go to origin to allow setting localStorage
    await page.goto('http://localhost:5174/login', { waitUntil: 'domcontentloaded' });
    
    // Inject both Supabase auth token and Zustand auth store
    await page.evaluate(() => {
        const mockUser = {
            id: 'usr_demo_777',
            email: 'baigo@cashly.ai',
            aud: 'authenticated',
            role: 'authenticated',
            user_metadata: {
                full_name: 'Baigo Sovereign',
                name: 'Baigo Sovereign'
            },
            created_at: '2026-01-01T00:00:00.000Z'
        };

        const mockSession = {
            access_token: 'mock_access_token_ey1234567890',
            token_type: 'bearer',
            expires_in: 360000,
            expires_at: Math.floor(Date.now() / 1000) + 360000,
            refresh_token: 'mock_refresh_token_123',
            user: mockUser
        };

        localStorage.setItem('cashly_demo_session', 'true');
        localStorage.setItem('sb-ynmvjnsdygimhjxcjvzp-auth-token', JSON.stringify(mockSession));
        localStorage.setItem('auth-storage', JSON.stringify({
            state: {
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    name: 'Baigo Sovereign',
                    currency: 'USD',
                    createdAt: mockUser.created_at
                },
                isAuthenticated: true
            },
            version: 0
        }));
    });

    // 1. Desktop captures (1440x900)
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    for (const r of routes) {
        try {
            console.log(`Loading http://localhost:5174${r.path} (desktop)...`);
            await page.goto(`http://localhost:5174${r.path}`, { waitUntil: 'networkidle0', timeout: 15000 });
            await new Promise(res => setTimeout(res, 1500));
            const outPath = path.join(OUT_DIR, `${r.name}_1440.png`);
            await page.screenshot({ path: outPath, fullPage: false });
            console.log(`Saved: ${outPath}`);
        } catch (e) {
            console.error(`Error capturing ${r.name} desktop:`, e.message);
        }
    }

    // 2. Mobile captures (390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    for (const r of routes) {
        try {
            console.log(`Loading http://localhost:5174${r.path} (mobile)...`);
            await page.goto(`http://localhost:5174${r.path}`, { waitUntil: 'networkidle0', timeout: 15000 });
            await new Promise(res => setTimeout(res, 1500));
            const outPath = path.join(OUT_DIR, `${r.name}_390.png`);
            await page.screenshot({ path: outPath, fullPage: false });
            console.log(`Saved: ${outPath}`);
        } catch (e) {
            console.error(`Error capturing ${r.name} mobile:`, e.message);
        }
    }

    await browser.close();
    console.log('All authenticated product screenshots captured successfully!');
}

run().catch(console.error);
