// Cashly - Smart Universal Transaction Detector v9.0
// Analyzes sites for payment features before activating monitoring
// Only tracks sites with actual transaction/payment capabilities
// v9.0: Shadow DOM support, deep iFrame traversal, enhanced detection

(function () {
    'use strict';

    // ================================
    // DEBUG FLAG - Set to false in production
    // ================================
    const DEBUG = false;
    const log = (...args) => DEBUG && console.log('💸', ...args);

    // ================================
    // 🕳️ SHADOW DOM TRAVERSAL
    // Detects payments inside Shadow DOM elements
    // ================================
    const ShadowDOMTraversal = {
        // Find all shadow roots in a node
        findShadowRoots(root = document) {
            const shadowRoots = [];
            const walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_ELEMENT,
                null,
                false
            );

            while (walker.nextNode()) {
                const node = walker.currentNode;
                if (node.shadowRoot) {
                    shadowRoots.push(node.shadowRoot);
                    // Recursively find nested shadows
                    shadowRoots.push(...this.findShadowRoots(node.shadowRoot));
                }
            }
            return shadowRoots;
        },

        // Query selector across all shadow DOMs
        querySelectorAllDeep(selector, root = document) {
            const results = [...root.querySelectorAll(selector)];

            // Search inside shadow roots
            for (const shadowRoot of this.findShadowRoots(root)) {
                try {
                    results.push(...shadowRoot.querySelectorAll(selector));
                } catch (e) {
                    // Some shadow roots may be closed
                }
            }
            return results;
        },

        // Get all text content including shadows
        getTextDeep(root = document.body) {
            let text = root.innerText || '';

            for (const shadowRoot of this.findShadowRoots(root)) {
                try {
                    text += ' ' + (shadowRoot.host?.innerText || '');
                } catch (e) { }
            }
            return text;
        }
    };

    // ================================
    // 🖼️ DEEP IFRAME TRAVERSAL
    // Scans nested iframes for payment elements
    // ================================
    const IFrameTraversal = {
        // Get all accessible iframes
        getAccessibleIFrames() {
            const iframes = document.querySelectorAll('iframe');
            const accessible = [];

            for (const iframe of iframes) {
                try {
                    // Check if we can access the iframe document
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (doc) {
                        accessible.push({
                            iframe,
                            document: doc,
                            src: iframe.src
                        });

                        // Recursively get nested iframes
                        const nested = doc.querySelectorAll('iframe');
                        for (const nestedFrame of nested) {
                            try {
                                const nestedDoc = nestedFrame.contentDocument;
                                if (nestedDoc) {
                                    accessible.push({
                                        iframe: nestedFrame,
                                        document: nestedDoc,
                                        src: nestedFrame.src,
                                        parent: iframe.src
                                    });
                                }
                            } catch (e) { }
                        }
                    }
                } catch (e) {
                    // Cross-origin iframe, can't access
                    // But we can still check the src attribute
                    accessible.push({
                        iframe,
                        document: null,
                        src: iframe.src,
                        crossOrigin: true
                    });
                }
            }
            return accessible;
        },

        // Check if any iframe contains payment elements
        hasPaymentIFrame() {
            const paymentPatterns = [
                /stripe/i, /paypal/i, /paddle/i, /braintree/i,
                /razorpay/i, /square/i, /adyen/i, /checkout/i,
                /klarna/i, /afterpay/i, /affirm/i, /gocardless/i
            ];

            for (const { src, crossOrigin, document: doc } of this.getAccessibleIFrames()) {
                // Check src URL
                if (src && paymentPatterns.some(p => p.test(src))) {
                    log('Payment iframe detected:', src);
                    return { found: true, src, type: 'payment_iframe' };
                }

                // If we can access the document, check its content
                if (doc && !crossOrigin) {
                    try {
                        const forms = doc.querySelectorAll('form');
                        for (const form of forms) {
                            if (/credit|card|payment|checkout/i.test(form.innerHTML)) {
                                return { found: true, type: 'payment_form_in_iframe' };
                            }
                        }
                    } catch (e) { }
                }
            }
            return { found: false };
        }
    };

    /**
     * 🎹 AUDIO & HAPTIC FEEDBACK
     * Provides immediate positive reinforcement for detections
     */
    function playFeedback(type = 'success') {
        try {
            // 1. Haptic (Vibration)
            if ('vibrate' in navigator) {
                if (type === 'success') {
                    navigator.vibrate([10, 30, 10]); // Multi-pulse for success
                } else if (type === 'alert') {
                    navigator.vibrate([50, 50, 50]); // Stronger for alerts
                }
            }

            // 2. Audio (Synthesized "Ping")
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                // Happy high-pitched double "ping"
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            } else if (type === 'alert') {
                // Warning low-pitched "boop"
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            }

            osc.start();
            osc.stop(ctx.currentTime + 0.5);

            // Cleanup
            setTimeout(() => {
                ctx.close().catch(() => { });
            }, 1000);
        } catch (error) {
            // Fail silently if AudioContext blocked
        }
    }
    const warn = (...args) => DEBUG && console.warn('💸', ...args);

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    // Debounce function to limit execution rate
    function debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // Generate transaction hash for deduplication
    // The shopper's calendar day, not UTC: in Pakistan a 2 am purchase on 1 December belongs to December.
    function localDay(d = new Date()) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function generateTransactionHash(data) {
        const detectedDay = data.date || localDay(data.detectedAt ? new Date(data.detectedAt) : new Date());
        const merchant = (data.merchantName || data.storeName || data.name || data.hostname || '').toLowerCase().trim();
        const amount = Number(data.amount ?? data.price ?? 0).toFixed(2);
        const str = `${data.hostname || ''}-${merchant}-${amount}-${data.type || 'purchase'}-${detectedDay}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return 'txn_' + Math.abs(hash).toString(36);
    }

    // Check if transaction was already saved (deduplication)
    async function isTransactionDuplicate(hash) {
        try {
            const result = await chrome.storage.local.get(['savedTransactionHashes']);
            const hashes = result.savedTransactionHashes || [];
            return hashes.includes(hash);
        } catch (e) {
            return false;
        }
    }

    async function unmarkTransactionSaved(hash) {
        try {
            const result = await chrome.storage.local.get(['savedTransactionHashes']);
            await chrome.storage.local.set({ savedTransactionHashes: (result.savedTransactionHashes || []).filter((h) => h !== hash) });
        } catch (e) { /* storage unavailable */ }
    }

    // Mark transaction as saved
    async function markTransactionSaved(hash) {
        try {
            const result = await chrome.storage.local.get(['savedTransactionHashes']);
            const hashes = result.savedTransactionHashes || [];
            hashes.push(hash);
            // Keep only last 100 hashes to prevent unbounded growth
            const trimmedHashes = hashes.slice(-100);
            await chrome.storage.local.set({ savedTransactionHashes: trimmedHashes });
        } catch (e) {
            warn('Failed to save transaction hash:', e);
        }
    }

    // ================================
    // PENDING CHECKOUT (survives page redirects)
    // Real checkouts redirect to a thank-you / processor page, which reloads this script with fresh state.
    // The pay click is stored here so the next page can finish the capture.
    // ================================
    const PENDING_KEY = 'cashlyPendingCheckout';
    const PENDING_TTL_MS = 15 * 60 * 1000;
    const PAYMENT_PROCESSOR_HOSTS = /stripe\.com|paypal\.com|paddle\.com|razorpay\.com|2checkout|checkout\.com|adyen|squareup|klarna|payfast|easypaisa|jazzcash|safepay|mollie|lemonsqueezy|gumroad/i;

    async function loadPendingCheckout() {
        try {
            const stored = (await chrome.storage.local.get([PENDING_KEY]))[PENDING_KEY];
            if (stored && Date.now() - stored.startedAt < PENDING_TTL_MS) return stored;
        } catch (e) { /* storage unavailable */ }
        return null;
    }

    async function savePendingCheckout(next) {
        // Only processor pages read before writing; merchant pages write at once because the page may unload right after the click.
        const previous = PAYMENT_PROCESSOR_HOSTS.test(next.hostname) ? await loadPendingCheckout() : null;
        // Paying on a processor page keeps the merchant the user started from.
        const keepMerchant = !!previous;
        const merged = keepMerchant
            ? { ...next, siteName: previous.siteName, hostname: previous.hostname, productName: previous.productName || next.productName, amount: next.amount || previous.amount, category: previous.category || next.category }
            : next;
        try {
            await chrome.storage.local.set({ [PENDING_KEY]: { ...merged, startedAt: Date.now() } });
        } catch (e) { /* storage unavailable */ }
        return merged;
    }

    function clearPendingCheckout() {
        try { chrome.storage.local.remove(PENDING_KEY); } catch (e) { /* ignore */ }
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // Site analysis cache (per domain)
    const analysisCache = {};
    function getCachedAnalysis(domain) {
        const cached = analysisCache[domain];
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
            log('Using cached analysis for', domain);
            return cached.result;
        }
        return null;
    }
    function setCachedAnalysis(domain, result) {
        analysisCache[domain] = { result, timestamp: Date.now() };
    }

    // ================================
    // CONFIGURATION
    // ================================
    const CONFIG = {
        CONFIRMATION_TIMEOUT_MS: 90000,
        STATE_HISTORY_LIMIT: 20,         // Limit state history
        DEBOUNCE_MS: 300,                // Debounce for mutation observer
        ANALYSIS_CACHE_MS: 300000        // 5 minutes
    };

    // ================================
    // EXCLUDED DOMAINS (own app only)
    // ================================
    const EXCLUDED_DOMAINS = [
        'localhost', '127.0.0.1', 'vibe-tracker', 'vibetracker',
        'shopping-expense-tracker', 'cashly.app', 'cashly'
    ];

    // ================================
    // CLOUD PLATFORM BILLING DOMAINS
    // These are allowed to track billing/invoices
    // ================================
    const CLOUD_PLATFORMS = {
        'vercel.com': {
            name: 'Vercel',
            billingPaths: ['/~/usage', '/account/billing', '/teams?tab=billing', '/settings/billing'],
            priceSelectors: ['[data-testid="usage-total"]', '.billing-amount', '[class*="price"]', '[class*="total"]'],
            category: 'Cloud Hosting'
        },
        'railway.app': {
            name: 'Railway',
            billingPaths: ['/billing', '/account/billing', '/settings/billing'],
            priceSelectors: ['[class*="amount"]', '[class*="price"]', '[class*="total"]'],
            category: 'Cloud Hosting'
        },
        'heroku.com': {
            name: 'Heroku',
            billingPaths: ['/account/billing', '/account-billing', '/bills'],
            priceSelectors: ['[class*="billing"]', '[class*="amount"]', '.total'],
            category: 'Cloud Hosting'
        },
        'digitalocean.com': {
            name: 'DigitalOcean',
            billingPaths: ['/account/billing', '/billing', '/settings/billing'],
            priceSelectors: ['[class*="billing"]', '[class*="amount"]', '[class*="total"]'],
            category: 'Cloud Hosting'
        },
        'netlify.com': {
            name: 'Netlify',
            billingPaths: ['/billing', '/account/billing', '/settings/billing'],
            priceSelectors: ['[class*="price"]', '[class*="amount"]', '[class*="total"]'],
            category: 'Cloud Hosting'
        },
        'render.com': {
            name: 'Render',
            billingPaths: ['/billing', '/account/billing'],
            priceSelectors: ['[class*="price"]', '[class*="amount"]'],
            category: 'Cloud Hosting'
        },
        'fly.io': {
            name: 'Fly.io',
            billingPaths: ['/billing', '/organizations', '/dashboard/billing'],
            priceSelectors: ['[class*="price"]', '[class*="amount"]'],
            category: 'Cloud Hosting'
        },
        'supabase.com': {
            name: 'Supabase',
            billingPaths: ['/project/', '/account/billing', '/org/'],
            priceSelectors: ['[class*="price"]', '[class*="cost"]'],
            category: 'Database'
        },
        'planetscale.com': {
            name: 'PlanetScale',
            billingPaths: ['/billing', '/settings/billing'],
            priceSelectors: ['[class*="price"]', '[class*="amount"]'],
            category: 'Database'
        },
        'aws.amazon.com': {
            name: 'AWS',
            billingPaths: ['/billing', '/cost-management', '/bills'],
            priceSelectors: ['[class*="amount"]', '[class*="total"]', '[class*="cost"]'],
            category: 'Cloud Hosting'
        }
    };

    // ================================
    // USER BLACKLIST (sites to never track)
    // ================================
    let userBlacklist = [];
    async function loadBlacklist() {
        try {
            const result = await chrome.storage.sync.get(['cashlyBlacklist']);
            userBlacklist = result.cashlyBlacklist || [];
        } catch (e) {
            userBlacklist = [];
        }
    }
    loadBlacklist();

    function isBlacklisted(domain) {
        return userBlacklist.some(d => domain.includes(d));
    }

    const hostname = window.location.hostname.toLowerCase();

    // Check excluded domains and blacklist
    if (EXCLUDED_DOMAINS.some(d => hostname.includes(d))) {
        log('Skipping own app');
        return;
    }

    if (window.__cashlyTracker) return;
    window.__cashlyTracker = true;

    log('Cashly v6.0: Smart Universal Detection');


    // ================================
    // SMART SITE ANALYZER
    // Detects if page has payment/transaction features
    // ================================
    class SiteAnalyzer {
        constructor() {
            this.signals = [];
            this.score = 0;
        }

        analyze() {
            this.score = 0;
            this.signals = [];

            // 1. Credit Card Forms (+40 points)
            this.checkCreditCardForms();

            // 2. Payment Iframes - Stripe, PayPal, Braintree (+35 points)
            this.checkPaymentIframes();

            // 3. Checkout/Payment URL (+30 points)
            this.checkPaymentURL();

            // 4. Cart/Price Elements (+20 points)
            this.checkEcommerceElements();

            // 5. Buy/Subscribe Buttons (+15 points)
            this.checkPaymentButtons();

            // 6. E-commerce Meta Tags (+10 points)
            this.checkMetaTags();

            // 7. Subscription/SaaS Keywords (+15 points)
            this.checkSubscriptionIndicators();

            // 8. Product Page Detection (+25 points) - NEW!
            this.checkProductPage();

            // Lower threshold from 30 to 15 for better e-commerce detection
            const isPaymentSite = this.score >= 15;

            console.log(`💸 Site Analysis: ${this.score} points`, {
                isPaymentSite,
                signals: this.signals
            });

            return {
                isPaymentSite,
                score: this.score,
                signals: this.signals,
                category: this.detectCategory()
            };
        }

        addSignal(name, points) {
            this.signals.push(name);
            this.score += points;
        }

        checkCreditCardForms() {
            const ccSelectors = [
                'input[autocomplete="cc-number"]',
                'input[autocomplete="cc-csc"]',
                'input[autocomplete="cc-exp"]',
                'input[autocomplete="cc-name"]',
                'input[name*="card"][name*="number"]',
                'input[name*="credit"]',
                'input[data-stripe]',
                'input[data-braintree]',
                '[class*="card-number"]',
                '[class*="cc-number"]',
                '[class*="credit-card"]',
                'input[placeholder*="card number"]',
                'input[placeholder*="1234"]'
            ];

            for (const sel of ccSelectors) {
                if (document.querySelector(sel)) {
                    this.addSignal('credit_card_form', 40);
                    return;
                }
            }
        }

        checkPaymentIframes() {
            const iframes = document.querySelectorAll('iframe');
            for (const iframe of iframes) {
                const src = (iframe.src || '').toLowerCase();
                if (/stripe|paypal|braintree|checkout|razorpay|paddle|square|adyen/.test(src)) {
                    this.addSignal('payment_iframe', 35);
                    return;
                }
            }

            // Also check for Stripe Elements (div-based)
            if (document.querySelector('.StripeElement, [class*="stripe"], #card-element')) {
                this.addSignal('stripe_elements', 35);
            }
        }

        checkPaymentURL() {
            const url = window.location.href.toLowerCase();
            const path = window.location.pathname.toLowerCase();

            const paymentPatterns = [
                /\/checkout/i, /\/payment/i, /\/billing/i, /\/subscribe/i,
                /\/pay\//i, /\/cart/i, /\/order/i, /\/purchase/i,
                /\/pricing/i, /\/plans/i, /\/upgrade/i, /\/pro/i,
                /step=payment/i, /step=checkout/i, /action=checkout/i
            ];

            if (paymentPatterns.some(p => p.test(url) || p.test(path))) {
                this.addSignal('payment_url', 30);
            }
        }

        checkEcommerceElements() {
            const ecomSelectors = [
                '[class*="cart"]', '[id*="cart"]',
                '[class*="basket"]', '[id*="basket"]',
                '[class*="price"]', '[data-price]',
                '[class*="add-to-cart"]', '.buy-now',
                '[class*="product-price"]', '[class*="item-price"]',
                '[class*="checkout"]', '[class*="shopping"]'
            ];

            let found = 0;
            for (const sel of ecomSelectors) {
                if (document.querySelector(sel)) found++;
            }

            if (found >= 2) {
                this.addSignal('ecommerce_elements', 20);
            } else if (found >= 1) {
                this.addSignal('ecommerce_single', 10);
            }
        }

        // NEW: Product Page Detection for e-commerce sites
        checkProductPage() {
            let productScore = 0;

            // 1. URL-based detection (very reliable)
            const url = window.location.href.toLowerCase();
            const path = window.location.pathname.toLowerCase();

            // Product page URL patterns
            const productUrlPatterns = [
                /\/products?\//i,     // /product/ or /products/
                /\/item\//i,          // /item/
                /\/p\//i,             // /p/ (common shorthand)
                /\/pd\//i,            // /pd/ (product detail)
                /\/detail\//i,        // /detail/
                /product_id=/i,       // ?product_id=
                /item_id=/i,          // ?item_id=
                /\/collections\/[^/]+\/products\//i  // Shopify collection product
            ];

            if (productUrlPatterns.some(p => p.test(url) || p.test(path))) {
                productScore += 3;
                console.log('💸 Product URL detected');
            }

            // 2. Check for product-related elements
            const productSelectors = [
                '[class*="product"]', '[id*="product"]',
                '[class*="item-detail"]', '[class*="product-detail"]',
                '[class*="pdp"]', // Product Detail Page
                '[class*="buy"]', '[class*="purchase"]',
                '[data-product]', '[data-item]', '[data-product-id]',
                '.product-image', '.product-title', '.product-price',
                '[itemtype*="Product"]', // Schema.org Product
                '.shopify-section' // Shopify stores
            ];

            for (const sel of productSelectors) {
                if (document.querySelector(sel)) productScore++;
            }

            // 3. Check for price indicators (Rs, $, €, ₹)
            const priceRegex = /(?:Rs\.?|PKR|USD|EUR|\$|€|₹|£)\s*[\d,]+(?:\.\d{2})?/gi;
            const bodyText = document.body?.innerText?.slice(0, 8000) || '';
            const priceMatches = bodyText.match(priceRegex);
            if (priceMatches && priceMatches.length >= 1) {
                productScore += 2;
            }

            // 4. Check for sizing/variant selectors (common in clothing stores)
            const sizeSelectors = [
                '[class*="size"]', '[class*="variant"]',
                'select[name*="size"]', '[class*="color-option"]',
                '[class*="variant-option"]', '[class*="option-selector"]',
                'input[name*="Size"]', '[data-option]'
            ];
            for (const sel of sizeSelectors) {
                if (document.querySelector(sel)) {
                    productScore++;
                    break;
                }
            }

            // 5. Check for quantity selectors
            if (document.querySelector('input[name*="quantity"], input[type="number"], [class*="quantity"], [class*="qty"]')) {
                productScore++;
            }

            // 6. Check for Add to Cart / Buy buttons
            const buttons = document.querySelectorAll('button, [role="button"], a.btn, input[type="submit"]');
            for (const btn of buttons) {
                const text = (btn.innerText || btn.value || btn.getAttribute('aria-label') || '').toLowerCase();
                if (/add\s*to\s*(cart|bag|basket)|buy\s*now|add\s*to\s*wishlist|notify\s*me/i.test(text)) {
                    productScore += 2;
                    break;
                }
            }

            // 7. Check for image gallery (common on product pages)
            const imageGallery = document.querySelectorAll('[class*="gallery"], [class*="slider"], [class*="carousel"], [class*="thumbnail"]');
            if (imageGallery.length > 0) {
                productScore++;
            }

            // 8. Shopify-specific detection
            if (window.Shopify || document.querySelector('[data-shopify]') || /cdn\.shopify\.com/i.test(document.documentElement.innerHTML.slice(0, 5000))) {
                productScore += 3;
                console.log('💸 Shopify store detected');
            }

            console.log('💸 Product page score:', productScore);

            if (productScore >= 3) {
                this.addSignal('product_page', 25);
            } else if (productScore >= 1) {
                this.addSignal('product_page_weak', 10);
            }
        }

        checkPaymentButtons() {
            const buttons = document.querySelectorAll('button, [role="button"], a, input[type="submit"]');
            const paymentPatterns = [
                /^pay$/i, /pay\s*now/i, /^checkout$/i,
                /^subscribe$/i, /start\s*(free\s*)?trial/i,
                /buy\s*now/i, /purchase/i, /complete\s*order/i,
                /place\s*order/i, /confirm\s*order/i,
                /add\s*to\s*cart/i, /get\s*started/i,
                /upgrade/i, /go\s*pro/i, /get\s*premium/i
            ];

            for (const btn of buttons) {
                const text = (btn.innerText || btn.value || '').trim();
                if (paymentPatterns.some(p => p.test(text))) {
                    this.addSignal('payment_button', 15);
                    return;
                }
            }
        }

        checkMetaTags() {
            // Check Open Graph and Schema.org
            const ogType = document.querySelector('meta[property="og:type"]');
            if (ogType && /product|shop|store/.test(ogType.content)) {
                this.addSignal('og_product', 10);
            }

            // Check for JSON-LD schema
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of scripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    if (data['@type'] && /Product|Offer|Order|CheckoutPage/.test(data['@type'])) {
                        this.addSignal('schema_product', 10);
                        return;
                    }
                } catch (e) { }
            }
        }

        checkSubscriptionIndicators() {
            const pageText = (document.body?.innerText || '').toLowerCase().slice(0, 15000);
            let subscriptionScore = 0;

            // 1. Subscription keywords (+10 each, max 2)
            const subscriptionKeywords = [
                'subscription', 'subscribe now', 'recurring billing',
                'billed monthly', 'billed annually', 'per month', '/month',
                'per year', '/year', '/mo', '/yr',
                'free trial', 'cancel anytime', 'premium plan',
                'pro plan', 'enterprise', 'team plan', 'starter plan',
                'basic plan', 'professional', 'business plan'
            ];

            let keywordCount = 0;
            for (const kw of subscriptionKeywords) {
                if (pageText.includes(kw)) {
                    keywordCount++;
                    if (keywordCount >= 2) break;
                }
            }
            if (keywordCount >= 2) subscriptionScore += 15;
            else if (keywordCount >= 1) subscriptionScore += 8;

            // 2. Pricing tier detection (+15 points)
            const tierPatterns = [
                /basic|starter|free/i,
                /pro|professional|plus/i,
                /enterprise|business|team/i,
                /premium|ultimate|unlimited/i
            ];
            let tiersFound = 0;
            for (const pattern of tierPatterns) {
                if (pattern.test(pageText)) tiersFound++;
            }
            if (tiersFound >= 2) {
                subscriptionScore += 15;
                console.log('💸 Pricing tiers detected:', tiersFound);
            }

            // 3. Price with period indicator (+12 points)
            const priceWithPeriod = /(?:rs\.?|pkr|\$|€|£|₹)\s*[\d,]+(?:\.\d{2})?\s*\/?\s*(?:mo|month|year|yr|annually|monthly)/i;
            if (priceWithPeriod.test(pageText)) {
                subscriptionScore += 12;
                console.log('💸 Price with period detected');
            }

            // 4. Pricing page URL patterns (+10 points)
            const url = window.location.href.toLowerCase();
            if (/pricing|plans|subscription|upgrade|billing/i.test(url)) {
                subscriptionScore += 10;
            }

            // 5. CTA buttons for subscriptions (+10 points)
            const buttons = document.querySelectorAll('button, a, [role="button"]');
            for (const btn of buttons) {
                const text = (btn.innerText || '').toLowerCase();
                if (/get\s*started|choose\s*plan|select\s*plan|upgrade\s*now|start\s*trial|try\s*free|buy\s*now|subscribe/i.test(text)) {
                    subscriptionScore += 10;
                    break;
                }
            }

            // 6. Pricing card elements (+8 points)
            const pricingCards = document.querySelectorAll('[class*="pricing"], [class*="plan-card"], [class*="subscription"], [class*="tier"]');
            if (pricingCards.length >= 2) {
                subscriptionScore += 8;
                console.log('💸 Pricing cards detected:', pricingCards.length);
            }

            // Add signal based on total score
            if (subscriptionScore >= 20) {
                this.addSignal('subscription_saas', 25);
                console.log('💸 SaaS subscription page detected! Score:', subscriptionScore);
            } else if (subscriptionScore >= 10) {
                this.addSignal('subscription_keywords', 15);
            } else if (subscriptionScore >= 5) {
                this.addSignal('subscription_weak', 8);
            }
        }

        detectCategory() {
            const text = (document.title + ' ' + hostname).toLowerCase();

            // Cloud Hosting & DevOps
            if (/vercel|railway|heroku|digitalocean|netlify|render|fly\.io|aws|azure|gcp|cloudflare/.test(text)) return 'Cloud Hosting';

            // Database Services
            if (/supabase|planetscale|mongodb|neon|upstash|fauna|firebase/.test(text)) return 'Database';

            // Entertainment
            if (/netflix|hulu|disney|hbo|spotify|youtube|twitch|prime video/.test(text)) return 'Entertainment';

            // Creative
            if (/adobe|figma|canva|sketch|framer/.test(text)) return 'Creative';

            // Productivity
            if (/notion|slack|trello|asana|monday|linear|clickup/.test(text)) return 'Productivity';

            // Development Tools
            if (/github|gitlab|bitbucket|jira|sentry|datadog|logdna/.test(text)) return 'Development';

            // Storage
            if (/dropbox|google.*drive|icloud|box|backblaze/.test(text)) return 'Storage';

            // Shopping
            if (/amazon|ebay|walmart|target|aliexpress|daraz|shopify/.test(text)) return 'Shopping';

            // Food Delivery
            if (/uber.*eat|doordash|grubhub|foodpanda|deliveroo/.test(text)) return 'Food Delivery';

            // AI Services
            if (/chatgpt|openai|claude|gemini|midjourney|replicate|huggingface/.test(text)) return 'AI Services';

            // Health & Fitness
            if (/gym|fitness|peloton|headspace|calm/.test(text)) return 'Health & Fitness';

            // Education
            if (/coursera|udemy|skillshare|masterclass|pluralsight/.test(text)) return 'Education';

            return 'Other';
        }

        // NEW: Check if current page is a cloud platform billing page
        isCloudPlatformBillingPage() {
            const platform = CLOUD_PLATFORMS[hostname] ||
                Object.entries(CLOUD_PLATFORMS).find(([domain]) => hostname.includes(domain))?.[1];

            if (!platform) return null;

            const path = window.location.pathname.toLowerCase();
            const isBillingPage = platform.billingPaths.some(bp => path.includes(bp.toLowerCase()));

            if (isBillingPage) {
                log(`☁️ Cloud platform billing detected: ${platform.name}`);
                return platform;
            }
            return null;
        }

        // NEW: Extract cloud platform subscription amount
        extractCloudPlatformAmount(platform) {
            for (const selector of platform.priceSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    const text = el.innerText || el.textContent || '';
                    const match = text.match(/\$([\d,]+\.?\d*)/i);
                    if (match) {
                        return parseFloat(match[1].replace(/,/g, ''));
                    }
                }
            }
            return 0;
        }
    }

    // ================================
    // STATE MACHINE FOR TRANSACTION FLOW
    // ================================
    const STATES = {
        IDLE: 'idle',
        MONITORING: 'monitoring',
        CHECKOUT_ENTERED: 'checkout_entered',
        PAYMENT_FORM_ACTIVE: 'payment_form_active',
        PAYMENT_SUBMITTED: 'payment_submitted',
        TRANSACTION_CONFIRMED: 'transaction_confirmed',
        CANCELLATION_FLOW: 'cancellation_flow',
        CANCELLATION_CONFIRMED: 'cancellation_confirmed'
    };

    // ================================
    // TRANSACTION TRACKER
    // ================================
    class TransactionTracker {
        constructor() {
            this.currentState = STATES.IDLE;
            this.siteInfo = {
                name: this.getSiteName(),
                hostname: hostname,
                category: 'Other',
                favicon: this.getFavicon()
            };
            this.transactionData = {};
            this.hasTriggered = false;
            this.stateHistory = [];
        }

        getSiteName() {
            const ogSite = document.querySelector('meta[property="og:site_name"]');
            if (ogSite?.content) return ogSite.content;

            const appName = document.querySelector('meta[name="application-name"]');
            if (appName?.content) return appName.content;

            const title = document.title;
            const separators = ['|', ' - ', ' – ', ' — '];
            for (const sep of separators) {
                if (title.includes(sep)) {
                    const parts = title.split(sep);
                    const brand = parts[parts.length - 1].trim();
                    if (brand.length > 2 && brand.length < 30) return brand;
                }
            }

            return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
        }

        getFavicon() {
            // First choice: Clearbit Logo API for crisp, high-quality brand logos
            try {
                return `https://logo.clearbit.com/${hostname}`;
            } catch (e) {
                // Second choice: Standard favicon
                const link = document.querySelector('link[rel*="icon"]');
                return link?.href || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
            }
        }

        transition(newState, data = {}) {
            // Cancellation states rank below checkout so a stray "unsubscribe" link can never block a purchase.
            const stateOrder = [
                STATES.IDLE, STATES.MONITORING, STATES.CANCELLATION_FLOW, STATES.CANCELLATION_CONFIRMED,
                STATES.CHECKOUT_ENTERED, STATES.PAYMENT_FORM_ACTIVE, STATES.PAYMENT_SUBMITTED,
                STATES.TRANSACTION_CONFIRMED
            ];
            const currentIndex = stateOrder.indexOf(this.currentState);
            const newIndex = stateOrder.indexOf(newState);

            if (newIndex > currentIndex || newState === STATES.MONITORING) {
                log(`State: ${this.currentState} → ${newState}`, data);
                this.stateHistory.push({ from: this.currentState, to: newState, at: Date.now() });
                // Limit state history to prevent memory growth
                if (this.stateHistory.length > CONFIG.STATE_HISTORY_LIMIT) {
                    this.stateHistory = this.stateHistory.slice(-CONFIG.STATE_HISTORY_LIMIT);
                }
                this.currentState = newState;
                Object.assign(this.transactionData, data);

                // Perform effects based on new state
                if (this.currentState === STATES.PAYMENT_SUBMITTED) {
                    log('🎯 State effect: PAYMENT_SUBMITTED');
                    playFeedback('success');
                } else if (this.currentState === STATES.CANCELLATION_CONFIRMED) {
                    log('🎯 State effect: CANCELLATION_CONFIRMED');
                    playFeedback('alert');
                }

                this.notifyBackground();

                if (newState === STATES.TRANSACTION_CONFIRMED && !this.hasTriggered) {
                    this.hasTriggered = true;
                    this.extractAndSave();
                }
            }
        }

        notifyBackground() {
            try {
                chrome.runtime.sendMessage({
                    type: 'TRACKING_STATE_UPDATE',
                    data: {
                        state: this.currentState,
                        siteName: this.siteInfo.name,
                        hostname: this.siteInfo.hostname,
                        category: this.siteInfo.category,
                        favicon: this.siteInfo.favicon,
                        url: window.location.href
                    }
                });
            } catch (e) { /* Extension context may be invalidated */ }
        }

        async extractAndSave() {
            log('🎉 TRANSACTION CONFIRMED! Extracting data...');

            const prices = this.extractPrices();
            const rawPageText = document.body?.innerText || '';
            const pageText = rawPageText.toLowerCase();

            const pending = this.pending || {};
            // A trial needs the pay click to say so or the confirmation page to say it started; "free trial" ad copy is not enough.
            const isTrial = !!(this.transactionData.isTrial || pending.isTrial
                || /trial\s*(has\s*)?(started|begun|is\s*active|activated|confirmed)|enjoy\s*your\s*(free\s*)?trial|no\s*charge\s*today/i.test(pageText));
            const trialDays = isTrial ? this.extractTrialDays(pageText) : 0;
            // A date printed on the page ("trial ends on 4 December") beats a length; a length beats the 7-day guess.
            const trialEndDate = isTrial ? (this.extractTrialEndDate(rawPageText) || (trialDays ? localDay(new Date(Date.now() + trialDays * 86400000)) : null)) : null;
            const isSubscription = !!(this.transactionData.isSubscription || pending.isSubscription || this.detectSubscription(pageText));
            const billingCycle = this.transactionData.billingCycle || this.detectBillingCycle(pageText);
            const planTier = this.detectPlanTier(pageText);  // NEW
            // The total read at the moment of paying beats whatever number the thank-you page shows first.
            // A trial charges nothing today; the price on the page is what it renews at.
            const recurringAmount = isTrial ? (this.extractRecurringAmount(pageText) || pending.amount || prices[0] || 0) : 0;
            const amount = isTrial ? 0 : (pending.amount || prices[0] || 0);
            const currency = (pending.amount && pending.currency) || this.detectCurrency(rawPageText);
            const productName = this.extractProductName() || pending.productName;
            const merchantName = pending.siteName || this.siteInfo.name;
            const merchantHost = pending.hostname || this.siteInfo.hostname;
            const detectionSignals = this.getDetectionSignals(pageText, amount, isSubscription, isTrial);
            const confidence = this.calculateDetectionConfidence({
                amount,
                pageText,
                isSubscription,
                isTrial,
                detectionSignals
            });

            if (amount <= 0 && !isTrial) {
                // Totals often render late; retry, then queue with amount 0 so the purchase still reaches the inbox for review.
                this.extractAttempts = (this.extractAttempts || 0) + 1;
                if (this.extractAttempts <= 4) {
                    setTimeout(() => this.extractAndSave(), 2000);
                    return;
                }
                detectionSignals.push('amount_missing');
            }

            const transaction = {
                name: merchantName,
                merchantName,
                storeName: merchantName,
                productName,
                hostname: merchantHost,
                type: isTrial ? 'trial' : (isSubscription ? 'subscription' : 'purchase'),
                label: isTrial ? 'Trial Started' : (isSubscription ? 'Subscription' : 'Purchase'),
                icon: isTrial ? '🎁' : (isSubscription ? '💳' : '🛒'),
                price: amount,
                amount,
                currency,
                isTrial,
                trialDays: trialDays || (isTrial ? 7 : 0),
                trialEndDate: trialEndDate || undefined,
                recurringAmount: recurringAmount || undefined,
                category: this.siteInfo.category,
                billingCycle,
                isSubscription,
                planTier,  // NEW: Plan tier (starter, pro, enterprise)
                confidence,
                detectionConfidence: confidence,
                detectionSignals,
                sourceUrl: window.location.href,
                favicon: this.siteInfo.favicon,
                detectedAt: new Date().toISOString(),
                date: localDay(),
                behaviorFlow: this.stateHistory,
                rawPayload: {
                    title: document.title,
                    url: window.location.href,
                    signals: detectionSignals,
                    priceCandidates: prices.slice(0, 5)
                },
                autoAddTransaction: true
            };

            log('Transaction extracted:', transaction);

            // Check for duplicate transaction
            const txHash = generateTransactionHash(transaction);
            transaction.transactionHash = txHash;
            transaction.idempotencyKey = txHash;
            clearPendingCheckout();
            const isDuplicate = await isTransactionDuplicate(txHash);
            if (isDuplicate) {
                log('Duplicate transaction detected, skipping:', txHash);
                return;
            }

            // Mark as saved
            await markTransactionSaved(txHash);

            // Send to background for storage + sync, then tell the user what actually happened.
            this.showNotification(transaction, 'saving');
            try {
                chrome.runtime.sendMessage({ type: 'BEHAVIOR_TRANSACTION_DETECTED', data: transaction }, (result) => {
                    void chrome.runtime.lastError;
                    const status = result?.autoApproved ? 'saved'
                        : result?.pendingReview ? 'inbox'
                        : result?.success ? 'saved'
                        : result?.reason === 'not_authenticated' ? 'signin' : 'retry';
                    this.showNotification(transaction, status);
                    // Neither saved nor queued: forget the hash so reloading the confirmation page can capture it again.
                    if (!result?.success && !result?.pending) unmarkTransactionSaved(txHash);
                });
            } catch (e) { this.showNotification(transaction, 'retry'); }

            // Also send subscription if applicable
            if (isSubscription || isTrial) {
                chrome.runtime.sendMessage({
                    type: 'SUBSCRIPTION_DETECTED',
                    data: {
                        name: transaction.name,
                        serviceName: transaction.name,
                        hostname: transaction.hostname,
                        price: transaction.price,
                        amount: transaction.amount,
                        currency: transaction.currency,
                        category: transaction.category,
                        billingCycle,
                        isTrial,
                        is_trial: isTrial,
                        trialDays,
                        trial_days: trialDays,
                        trialEndDate: trialEndDate || undefined,
                        recurringAmount: transaction.recurringAmount,
                        productName: transaction.productName,
                        planTier: transaction.planTier,
                        confidence: transaction.confidence,
                        detectionConfidence: transaction.detectionConfidence,
                        detectionSignals: transaction.detectionSignals,
                        transactionHash: transaction.transactionHash,
                        idempotencyKey: transaction.idempotencyKey,
                        sourceUrl: transaction.sourceUrl,
                        favicon: transaction.favicon,
                        icon: transaction.icon,
                        detectedAt: transaction.detectedAt
                    }
                });
            }
        }

        extractPrices() {
            const prices = [];

            // PRIORITY 1: Order total selectors (most accurate)
            const prioritySelectors = [
                '[class*="order-total"] [class*="price"]',
                '[class*="order-total"]',
                '[class*="grand-total"]',
                '[class*="final-price"]',
                '[class*="total-amount"]',
                '[class*="checkout-total"]',
                '[class*="summary-total"]',
                '[class*="cart-total"]',
                '[data-testid*="total"]',
                '[id*="order-total"]',
                '[id*="grand-total"]',
                '.order-summary-total',
                '.payment-total',
                '.amount-due',
                // Pakistani site specific
                '[class*="payable"]',
                '[class*="grand_total"]',
                '.total-payable',
                '.checkout-summary .price',
                // Daraz specific
                '.checkout-summary .total',
                '[class*="order-summary"] [class*="total"]'
            ];

            for (const selector of prioritySelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    const text = el.innerText || el.textContent || '';
                    const price = this.extractPriceFromText(text);
                    if (price > 0) {
                        log('Priority price found:', price, 'from', selector);
                        return [price]; // Return immediately - most reliable
                    }
                }
            }

            // PRIORITY 2: Look for prices near "Total", "Grand Total", "Amount Due"
            const allElements = document.querySelectorAll('*');
            for (const el of allElements) {
                // textContent avoids a forced layout per element (innerText on every node froze large checkouts).
                const text = el.textContent || '';
                if (text.length < 100 && /total|amount due|payable|grand total/i.test(text)) {
                    const price = this.extractPriceFromText(text);
                    if (price > 0 && price < 1000000) {
                        log('Context price found:', price, 'near "total"');
                        prices.push({ price, confidence: 0.8 });
                    }
                }
            }

            // PRIORITY 3: General price patterns from page text
            const pageText = document.body?.innerText || '';
            const patterns = [
                /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/gi,    // PKR (prioritize local)
                /PKR\s*([\d,]+(?:\.\d{1,2})?)/gi,
                /\$\s*([\d,]+(?:\.\d{1,2})?)/g,       // USD
                /USD\s*([\d,]+(?:\.\d{1,2})?)/gi,
                /€\s*([\d,]+(?:\.\d{1,2})?)/g,        // EUR
                /£\s*([\d,]+(?:\.\d{1,2})?)/g,        // GBP
                /₹\s*([\d,]+(?:\.\d{1,2})?)/g,        // INR
                /INR\s*([\d,]+(?:\.\d{1,2})?)/gi
            ];

            for (const pattern of patterns) {
                pattern.lastIndex = 0;
                let match;
                while ((match = pattern.exec(pageText)) !== null) {
                    const price = parseFloat(match[1].replace(/,/g, ''));
                    if (price > 0 && price < 1000000) {
                        prices.push({ price, confidence: 0.5 });
                    }
                }
            }

            // Sort by confidence, then by price (prefer higher confidence, then higher price for totals)
            const sortedPrices = prices
                .sort((a, b) => b.confidence - a.confidence || b.price - a.price)
                .map(p => p.price);

            return [...new Set(sortedPrices)];
        }

        detectCurrency(text) {
            if (/PKR|Rs\.?|₨/i.test(text)) return 'PKR';
            if (/USD|\$/i.test(text)) return 'USD';
            if (/EUR|€/i.test(text)) return 'EUR';
            if (/GBP|£/i.test(text)) return 'GBP';
            if (/INR|₹/i.test(text)) return 'INR';
            return undefined; // unknown: let the backend treat it as the user's own currency
        }

        extractProductName() {
            const selectors = [
                '[data-testid*="product-title"]',
                '[class*="product-title"]',
                '[class*="product_name"]',
                '[class*="plan-name"]',
                '[class*="subscription-name"]',
                'h1'
            ];

            for (const selector of selectors) {
                const el = document.querySelector(selector);
                const text = (el?.innerText || el?.textContent || '').trim();
                if (text && text.length >= 3 && text.length <= 160) {
                    return text.replace(/\s+/g, ' ');
                }
            }

            const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
            if (ogTitle) return ogTitle.trim().slice(0, 160);
            return undefined;
        }

        getDetectionSignals(pageText, amount, isSubscription, isTrial) {
            const signals = this.stateHistory.map((state) => state.to);
            if (amount > 0) signals.push('amount_detected');
            if (isSubscription) signals.push('subscription_terms_detected');
            if (isTrial) signals.push('trial_terms_detected');
            if (SUCCESS_URL_PATTERNS.some((pattern) => pattern.test(window.location.href))) signals.push('success_url');
            if (/receipt|confirmation|thank\s*you|payment\s*(was\s*)?successful|order\s*(has\s*)?been\s*placed/i.test(pageText)) {
                signals.push('success_copy');
            }
            if (CHECKOUT_URL_PATTERNS.some((pattern) => pattern.test(window.location.href))) signals.push('checkout_url');
            return [...new Set(signals)].slice(0, 12);
        }

        calculateDetectionConfidence({ amount, pageText, isSubscription, isTrial, detectionSignals }) {
            let confidence = 0.55;
            if (amount > 0) confidence += 0.18;
            if (detectionSignals.includes('payment_submitted')) confidence += 0.08;
            if (detectionSignals.includes('transaction_confirmed')) confidence += 0.12;
            if (detectionSignals.includes('success_copy') || detectionSignals.includes('success_url')) confidence += 0.08;
            if (isSubscription || isTrial) confidence += 0.04;
            if (/receipt|invoice|order number|confirmation/i.test(pageText)) confidence += 0.05;
            return Math.min(0.98, Number(confidence.toFixed(2)));
        }

        // Helper to extract price from a text string
        extractPriceFromText(text) {
            const patterns = [
                /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
                /PKR\s*([\d,]+(?:\.\d{1,2})?)/i,
                /\$\s*([\d,]+(?:\.\d{1,2})?)/,
                /€\s*([\d,]+(?:\.\d{1,2})?)/,
                /£\s*([\d,]+(?:\.\d{1,2})?)/,
                /₹\s*([\d,]+(?:\.\d{1,2})?)/,
                /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs|PKR|USD|\$|€|£|₹)/i,
                // Fallback: just large numbers
                /\b([\d,]{3,}(?:\.\d{1,2})?)\b/
            ];

            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    const price = parseFloat(match[1].replace(/,/g, ''));
                    if (price > 0 && price < 1000000) return price;
                }
            }
            return 0;
        }

        // "then $9.99/month", "after your trial, Rs 999" — what a trial will actually cost.
        extractRecurringAmount(pageText) {
            const match = pageText.match(/(?:then|after\s+(?:the|your)?\s*(?:free\s*)?trial|thereafter|renews?\s+at)[^\d$€£₹]{0,25}(?:rs\.?|pkr|usd|inr|\$|€|£|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
            const price = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
            return price > 0 && price < 1000000 ? price : 0;
        }

        extractTrialDays(pageText) {
            const text = pageText.replace(/\bone\b/g, '1').replace(/\btwo\b/g, '2').replace(/\bthree\b/g, '3').replace(/\bfirst\b/g, '1');
            // Months and weeks count too: "1 month free" used to fall back to 7 days and end three weeks early.
            const units = { day: 1, days: 1, week: 7, weeks: 7, month: 30, months: 30 };
            const patterns = [
                /(\d+)\s*[-–]?\s*(days?|weeks?|months?)\s*(free\s*)?trial/i,
                /free\s*for\s*(\d+)\s*(days?|weeks?|months?)/i,
                /(\d+)\s*(days?|weeks?|months?)\s*(for\s*)?free/i,
                /try\s*(it\s*)?free\s*for\s*(\d+)\s*(days?|weeks?|months?)/i,
                /trial\s*(period\s*)?(of\s*)?(\d+)\s*(days?|weeks?|months?)/i
            ];
            for (const p of patterns) {
                const m = text.match(p);
                if (!m) continue;
                const n = parseInt(m.find((g, i) => i > 0 && /^\d+$/.test(g || '')), 10);
                const unit = m.find((g, i) => i > 0 && /^(days?|weeks?|months?)$/i.test(g || ''));
                if (n > 0 && n <= 366 && unit) return n * units[unit.toLowerCase()];
            }
            if (/free\s*trial|start\s*trial|try\s*(it\s*)?free|no\s*charge\s*today/i.test(text)) {
                return 7;
            }
            return 0;
        }

        // "Your trial ends on December 4, 2026", "you'll be charged on 04/12/2026", "renews 4 Dec": the real end date, as YYYY-MM-DD.
        extractTrialEndDate(rawText) {
            const lead = /(trial\s*(ends|expires|will\s*end)|(first\s*)?(charge|bill|payment)\s*(will\s*be\s*)?(on|date)|charged\s*on|billed\s*on|renews?\s*(on)?|starts?\s*charging(\s*on)?)\s*[:\-]?\s*/i;
            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const m = rawText.match(new RegExp(lead.source + '([^\n]{0,40})', 'i'));
            if (!m) return null;
            const tail = m[m.length - 1];
            let y, mo, d;
            let r;
            if ((r = tail.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) [y, mo, d] = [+r[1], +r[2], +r[3]];
            else if ((r = tail.match(/(\d{1,2})\s+([a-z]{3})[a-z]*\.?,?\s+(\d{4})/i))) [d, mo, y] = [+r[1], months.indexOf(r[2].toLowerCase()) + 1, +r[3]];
            else if ((r = tail.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2})(st|nd|rd|th)?,?\s+(\d{4})/i))) [mo, d, y] = [months.indexOf(r[1].toLowerCase()) + 1, +r[2], +r[4]];
            // Numeric dates are read day-first, as in Pakistan and most of the world.
            else if ((r = tail.match(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/))) [d, mo, y] = [+r[1], +r[2], +r[3]];
            else if ((r = tail.match(/(\d{1,2})\s+([a-z]{3})[a-z]*/i)) && months.includes(r[2].toLowerCase())) {
                [d, mo] = [+r[1], months.indexOf(r[2].toLowerCase()) + 1];
                const now = new Date();
                y = now.getFullYear() + (mo - 1 < now.getMonth() ? 1 : 0);
            } else return null;
            const date = new Date(y, mo - 1, d);
            const days = (date - new Date()) / 86400000;
            // Only a date a few days to a year ahead is a believable trial end.
            if (Number.isNaN(days) || mo < 1 || date.getDate() !== d || days < -1 || days > 400) return null;
            return localDay(date);
        }

        detectSubscription(pageText) {
            // "premium"/"renew" alone match ordinary shop copy, so only billing-cycle wording counts.
            const keywords = [
                'subscription', 'recurring', 'auto-renew', 'renews',
                'membership', 'billed monthly',
                'billed yearly', 'billed annually', 'per month', '/mo', '/year', 'free trial'
            ];
            return keywords.filter(kw => pageText.includes(kw)).length >= 1;
        }

        detectBillingCycle(pageText) {
            if (/yearly|annual|per year|\/year|\/yr|billed annually/i.test(pageText)) return 'yearly';
            if (/weekly|per week|\/week/i.test(pageText)) return 'weekly';
            if (/quarterly|every 3 months/i.test(pageText)) return 'quarterly';
            return 'monthly';
        }

        // NEW: Detect plan tier (Basic, Pro, Enterprise, etc.)
        detectPlanTier(pageText) {
            const tierPatterns = [
                { tier: 'enterprise', pattern: /enterprise|business|team|organization/i },
                { tier: 'pro', pattern: /\bpro\b|professional|plus|premium/i },
                { tier: 'starter', pattern: /starter|basic|free|lite/i },
                { tier: 'standard', pattern: /standard|regular|personal/i }
            ];

            for (const { tier, pattern } of tierPatterns) {
                if (pattern.test(pageText)) {
                    log('Plan tier detected:', tier);
                    return tier;
                }
            }
            return 'standard';
        }

        // NEW: Detect cancellation flow
        detectCancellation() {
            const url = window.location.href.toLowerCase();
            const pageText = (document.body?.innerText || '').toLowerCase();

            // No bare "unsubscribe"/"downgrade": newsletter footers contain them on almost every shop.
            const cancelPatterns = [
                /cancel[-_/]?(subscription|plan|membership|renewal)/i,
                /subscription.*cancel/i
            ];

            const cancelKeywords = [
                'cancel subscription', 'cancel my plan', 'cancel my subscription',
                'end membership', 'stop subscription',
                'cancel renewal', 'don\'t renew'
            ];

            const urlMatch = cancelPatterns.some(p => p.test(url));
            const textMatch = cancelKeywords.some(kw => pageText.includes(kw));

            if (urlMatch || textMatch) {
                log('Cancellation flow detected');
                return true;
            }
            return false;
        }

        showNotification(data, status = 'inbox') {
            const copy = {
                saving: ['Saving to Cashly…', `${data.label} detected`],
                saved: ['Added to your Cashly dashboard', `${data.label} recorded`],
                inbox: ['Queued in Cashly inbox', `${data.label} captured for review`],
                signin: ['Sign in to Cashly to save this', `${data.label} is stored and will sync once you sign in`],
                retry: ['Cashly will retry this sync', `${data.label} is stored on this device`]
            }[status];
            const existing = document.getElementById('cashly-notification');
            if (existing) existing.remove();

            const el = document.createElement('div');
            el.id = 'cashly-notification';
            el.innerHTML = `
                <div class="cashly-toast">
                    <div class="cashly-toast-head">
                        <span class="cashly-toast-icon">${data.icon || 'C'}</span>
                        <div>
                            <strong class="cashly-toast-title">${escapeHtml(copy[0])}</strong>
                            <span class="cashly-toast-sub">${escapeHtml(copy[1])}</span>
                        </div>
                        <button class="cashly-toast-close" type="button" aria-label="Dismiss">×</button>
                    </div>
                    <div class="cashly-toast-body">
                        <div class="cashly-toast-row">
                            <span>Service</span>
                            <strong>${escapeHtml(data.name)}</strong>
                        </div>
                        ${data.amount > 0 ? `
                        <div class="cashly-toast-row">
                            <span>Amount</span>
                            <strong>${escapeHtml(data.currency || '')} ${data.amount.toFixed(2)}</strong>
                        </div>` : ''}
                        ${data.isTrial ? `
                        <div class="cashly-toast-row">
                            <span>Trial</span>
                            <strong>${data.trialDays} days</strong>
                        </div>` : ''}
                    </div>
                </div>
            `;
            el.querySelector('.cashly-toast-close')?.addEventListener('click', () => el.remove());
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 8000);
        }
    }

    // ================================
    // BEHAVIORAL DETECTORS
    // ================================
    const CHECKOUT_URL_PATTERNS = [
        /\/checkout/i, /\/payment/i, /\/billing/i, /\/subscribe/i,
        /\/pay\//i, /\/cart/i, /\/order/i, /\/purchase/i,
        /\/bag\b/i, /\/basket/i, /securecheckout/i, /checkouts\//i,
        /\/paynow/i, /\/place-?order/i, /\/complete-?order/i,
        /checkout\.shopify/i, /\/express-checkout/i,
        /step=payment/i, /step=checkout/i
    ];

    const PAYMENT_FORM_SELECTORS = [
        'input[autocomplete="cc-number"]', 'input[autocomplete="cc-csc"]',
        'input[name*="card"]', 'input[data-stripe]',
        '[class*="card-number"]', 'iframe[src*="stripe"]',
        'iframe[src*="braintree"]', 'iframe[src*="paypal"]',
        'iframe[src*="razorpay"]', 'iframe[src*="adyen"]',
        'iframe[src*="square"]', 'iframe[src*="paddle"]',
        '.StripeElement'
    ];

    const STRONG_PAYMENT_BUTTON_PATTERNS = [
        /\bpay\s*now\b/i, /submit\s*(payment|order)/i,
        /complete\s*(order|purchase|payment)/i, /place\s*order/i,
        /confirm\s*(order|payment|purchase)/i,
        /start\s*(your\s*)?(free\s*)?trial/i, /no\s*charge\s*today/i
    ];

    const PRODUCT_BUY_BUTTON_PATTERNS = [
        /buy\s*now/i, /order\s*now/i
    ];

    const WEAK_PAYMENT_BUTTON_PATTERNS = [
        /\bpay\b/i, /pay\s*with/i, /continue/i, /checkout/i,
        /get\s*(started|premium|pro)/i, /upgrade/i,
        /try\s*(it\s*)?(free|now)/i, /\bsubscribe\b/i
    ];

    const SUCCESS_URL_PATTERNS = [
        /\/thank/i, /\/success/i, /\/confirm/i, /\/complete/i,
        /\/receipt/i, /\?success/i, /\?confirmed/i
    ];

    const SUCCESS_ELEMENT_SELECTORS = [
        '[class*="success"]', '[class*="confirm"]', '[class*="thank"]',
        '[class*="complete"]', '.order-confirmation', '.payment-success'
    ];

    // ================================
    // MAIN INITIALIZATION
    // ================================
    const analyzer = new SiteAnalyzer();
    const tracker = new TransactionTracker();
    let siteAnalysisResult = null;
    let captureStarted = false;

    function isInPaymentFlow() {
        return [
            STATES.CHECKOUT_ENTERED,
            STATES.PAYMENT_FORM_ACTIVE,
            STATES.PAYMENT_SUBMITTED
        ].includes(tracker.currentState) || CHECKOUT_URL_PATTERNS.some((pattern) => pattern.test(window.location.href));
    }

    function refreshCaptureFromPage(fullAnalyze = false) {
        if (fullAnalyze) {
            siteAnalysisResult = analyzer.analyze();
            tracker.siteInfo.category = siteAnalysisResult.category;
            if (siteAnalysisResult.score > 0 && tracker.currentState === STATES.IDLE) {
                tracker.transition(STATES.MONITORING, { analysisScore: siteAnalysisResult.score });
            }
        }
        checkCheckoutURL();
        checkPaymentForms();
        checkCancellation();
    }

    function initialize() {
        if (isBlacklisted(hostname)) {
            log('Site is blacklisted, skipping');
            return;
        }

        siteAnalysisResult = analyzer.analyze();
        setCachedAnalysis(hostname, siteAnalysisResult);
        tracker.siteInfo.category = siteAnalysisResult.category;

        if (siteAnalysisResult.score > 0) {
            log('Payment/trial signals detected, starting monitoring...', {
                score: siteAnalysisResult.score,
                signals: siteAnalysisResult.signals
            });
            tracker.transition(STATES.MONITORING, { analysisScore: siteAnalysisResult.score });
        } else {
            log('No payment signals yet — watching this page dynamically');
            tracker.notifyBackground();
        }

        startBehaviorDetection();
    }

    function startBehaviorDetection() {
        if (captureStarted) {
            refreshCaptureFromPage(true);
            return;
        }
        captureStarted = true;

        refreshCaptureFromPage(true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('submit', handleSubmit, true);
        restorePendingCheckout();

        const debouncedCheckoutWatch = debounce(() => refreshCaptureFromPage(false), CONFIG.DEBOUNCE_MS);
        const observer = new MutationObserver(debouncedCheckoutWatch);
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        }

        const wrapHistory = (method) => {
            const original = history[method];
            history[method] = function dynamicCaptureHistory() {
                const result = original.apply(this, arguments);
                setTimeout(() => refreshCaptureFromPage(true), 200);
                return result;
            };
        };
        wrapHistory('pushState');
        wrapHistory('replaceState');
        window.addEventListener('popstate', () => setTimeout(() => refreshCaptureFromPage(true), 200));
    }

    function checkCheckoutURL() {
        const url = window.location.href.toLowerCase();
        if (CHECKOUT_URL_PATTERNS.some(p => p.test(url))) {
            tracker.transition(STATES.CHECKOUT_ENTERED, { enteredCheckoutAt: Date.now() });
        }
    }

    function checkCancellation() {
        if (tracker.currentState === STATES.CANCELLATION_CONFIRMED) return;

        if (tracker.detectCancellation()) {
            tracker.transition(STATES.CANCELLATION_FLOW, { cancellationDetectedAt: Date.now() });
        }
    }

    function checkPaymentForms() {
        for (const selector of PAYMENT_FORM_SELECTORS) {
            const element = document.querySelector(selector);
            if (element) {
                if (element.tagName === 'INPUT') {
                    element.addEventListener('input', () => {
                        tracker.transition(STATES.PAYMENT_FORM_ACTIVE, { filledPaymentAt: Date.now() });
                    }, { once: true });
                } else {
                    tracker.transition(STATES.PAYMENT_FORM_ACTIVE, { filledPaymentAt: Date.now() });
                }
                return;
            }
        }
    }

    // Snapshot the total now, persist it for redirect flows, and start watching for the confirmation.
    function markPaymentSubmitted(extra = {}) {
        tracker.transition(STATES.PAYMENT_SUBMITTED, { submittedAt: Date.now(), ...extra });
        const snapshot = {
            siteName: tracker.siteInfo.name,
            hostname: tracker.siteInfo.hostname,
            category: tracker.siteInfo.category,
            amount: tracker.extractPrices()[0] || 0,
            currency: tracker.detectCurrency(document.body?.innerText || ''),
            productName: tracker.extractProductName(),
            isTrial: !!extra.isTrial,
            isSubscription: !!extra.isSubscription
        };
        tracker.pending = snapshot;
        savePendingCheckout(snapshot).then((saved) => { tracker.pending = saved; });
        startConfirmationWatcher();
    }

    // Enter-key / form submits never click a button, so catch card forms being submitted too.
    function handleSubmit(e) {
        const form = e.target;
        if (!form?.querySelector || tracker.currentState === STATES.TRANSACTION_CONFIRMED) return;
        const hasCardField = PAYMENT_FORM_SELECTORS.some((sel) => form.querySelector(sel));
        if (hasCardField) markPaymentSubmitted({});
    }

    async function restorePendingCheckout() {
        const pending = await loadPendingCheckout();
        if (!pending || tracker.currentState === STATES.TRANSACTION_CONFIRMED) return;
        // Resume only on the merchant itself or a payment processor, never on unrelated browsing.
        const related = hostname.endsWith(pending.hostname) || pending.hostname.endsWith(hostname)
            || PAYMENT_PROCESSOR_HOSTS.test(hostname) || PAYMENT_PROCESSOR_HOSTS.test(pending.hostname);
        if (!related) return;
        tracker.pending = pending;
        tracker.transition(STATES.PAYMENT_SUBMITTED, {
            submittedAt: pending.startedAt,
            isTrial: pending.isTrial,
            isSubscription: pending.isSubscription
        });
        startConfirmationWatcher();
    }

    function handleClick(e) {
        const target = e.target.closest('button, [role="button"], a, input[type="submit"]');
        if (!target) return;

        const text = (target.innerText || target.value || '').trim();
        const isContinueShopping = /continue\s*(shopping|browsing)|keep\s*shopping/i.test(text);
        const veryStrongPay = STRONG_PAYMENT_BUTTON_PATTERNS.some(p => p.test(text));
        const productBuy = PRODUCT_BUY_BUTTON_PATTERNS.some(p => p.test(text))
            && tracker.currentState === STATES.MONITORING;
        const weakPay = WEAK_PAYMENT_BUTTON_PATTERNS.some(p => p.test(text));
        const isPayButton = !isContinueShopping && (veryStrongPay || productBuy || (weakPay && isInPaymentFlow()));

        if (isPayButton) {
            log('Payment button clicked:', text);

            markPaymentSubmitted({
                isTrial: /trial/i.test(text),
                isSubscription: /subscribe/i.test(text)
            });
        }

        // NEW: Check for cancellation confirmation buttons
        if (tracker.currentState === STATES.CANCELLATION_FLOW) {
            const cancelConfirmPatterns = [
                /confirm\s*cancel/i, /end\s*subscription/i, /stop\s*auto-renew/i,
                /cancel\s*anyway/i, /yes,\s*cancel/i, /finish\s*cancellation/i
            ];

            if (cancelConfirmPatterns.some(p => p.test(text))) {
                log('Cancellation confirmation button clicked:', text);
                tracker.transition(STATES.CANCELLATION_CONFIRMED, { cancellationConfirmedAt: Date.now() });

                // Notify background immediately
                chrome.runtime.sendMessage({
                    type: 'CANCELLATION_DETECTED',
                    data: {
                        name: tracker.siteInfo.name,
                        hostname: tracker.siteInfo.hostname,
                        url: window.location.href,
                        timestamp: Date.now()
                    }
                });
            }
        }
    }

    let confirmationWatcherActive = false;

    function checkConfirmation() {
        const url = window.location.href.toLowerCase();
        if (SUCCESS_URL_PATTERNS.some(p => p.test(url))) {
            checkSuccessElements();
        }
    }

    function patchHistoryForCheckout() {
        if (window.__cashlyHistoryPatched) return;
        window.__cashlyHistoryPatched = true;
        ['pushState', 'replaceState'].forEach((method) => {
            const original = history[method];
            history[method] = function patchedHistory() {
                const result = original.apply(this, arguments);
                if (confirmationWatcherActive) {
                    checkConfirmation();
                    checkSuccessElements();
                }
                return result;
            };
        });
    }

    function startConfirmationWatcher() {
        if (confirmationWatcherActive) return;
        confirmationWatcherActive = true;
        patchHistoryForCheckout();

        log('Started confirmation watcher');

        checkConfirmation();
        window.addEventListener('popstate', checkConfirmation);

        const observer = new MutationObserver(() => {
            checkSuccessElements();
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });

        const pollId = setInterval(() => {
            checkConfirmation();
            checkSuccessElements();
        }, 1500);

        setTimeout(() => {
            observer.disconnect();
            clearInterval(pollId);
            confirmationWatcherActive = false;
        }, CONFIG.CONFIRMATION_TIMEOUT_MS);
    }

    function checkSuccessElements() {
        if (tracker.currentState === STATES.TRANSACTION_CONFIRMED) return;

        // 1. Check entire page text for success patterns (catches modals)
        const pageText = (document.body?.innerText || '').toLowerCase();
        const successTextPatterns = [
            /transaction\s*(has\s*been\s*)?completed\s*successfully/i,
            /payment\s*(was\s*)?successful/i,
            /order\s*(has\s*been\s*)?placed/i,
            /thank\s*you\s*for\s*(your\s*)?(purchase|order|payment|subscription)/i,
            /subscription\s*(activated|started|confirmed)/i,
            /you(\u2019|')?re\s*(now\s*)?subscribed/i,
            /welcome\s*to\s*(your\s*)?(premium|pro|subscription)/i,
            /(your\s*)?(free\s*)?trial\s*(has\s*)?(started|begun|is\s*active)/i,
            /enjoy\s*your\s*(free\s*)?trial/i,
            /no\s*charge\s*today/i,
            /trial\s*(activated|started|confirmed)/i,
            /receipt\s*(sent|emailed)/i,
            /confirmation\s*(email\s*)?(sent|emailed)/i,
            /we(\u2019|')?ve\s*emailed\s*(you\s*)?(the|your)\s*(details|receipt|confirmation)/i
        ];

        for (const pattern of successTextPatterns) {
            if (pattern.test(pageText)) {
                log('🎉 Success text detected:', pattern);
                tracker.transition(STATES.TRANSACTION_CONFIRMED, { confirmedAt: Date.now() });
                return;
            }
        }

        // 2. Check for success modals/dialogs
        const modalSelectors = [
            '[role="dialog"]', '[role="alertdialog"]', '.modal', '[class*="modal"]',
            '[class*="dialog"]', '[class*="popup"]', '[class*="overlay"]',
            '[class*="success"]', '[class*="complete"]', '[class*="confirm"]'
        ];

        for (const selector of modalSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 50 && rect.height > 50) {
                    const text = (el.innerText || '').toLowerCase();
                    if (/success|complete|confirmed|thank\s*you|congratulation|welcome/i.test(text)) {
                        // Check for checkmark icons as additional confirmation
                        const hasCheckmark = el.querySelector('svg, [class*="check"], [class*="success"], [class*="tick"]');
                        if (hasCheckmark || /success|complete|confirmed/i.test(text)) {
                            log('🎉 Success modal detected!');
                            tracker.transition(STATES.TRANSACTION_CONFIRMED, { confirmedAt: Date.now() });
                            return;
                        }
                    }
                }
            }
        }

        // 3. Check for success icons (green checkmarks, etc)
        const successIcons = document.querySelectorAll(
            '[class*="success"] svg, [class*="check"] svg, [class*="complete"] svg, ' +
            'svg[class*="success"], svg[class*="check"], svg.text-green, .text-green-500'
        );
        for (const icon of successIcons) {
            const rect = icon.getBoundingClientRect();
            if (rect.width > 20 && rect.height > 20) {
                // Icon is visible, check nearby text
                const parent = icon.closest('div, section, [role="dialog"], .modal');
                if (parent) {
                    const text = (parent.innerText || '').toLowerCase();
                    if (/success|complete|confirm|thank|emailed|receipt/i.test(text)) {
                        log('🎉 Success icon with confirmation text detected!');
                        tracker.transition(STATES.TRANSACTION_CONFIRMED, { confirmedAt: Date.now() });
                        return;
                    }
                }
            }
        }
    }

    // Communication with popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'GET_CURRENT_SITE') {
            // Use analysis result if available, otherwise use current state
            const isPaymentSite = siteAnalysisResult
                ? (siteAnalysisResult.isPaymentSite || siteAnalysisResult.score > 0)
                : (tracker.currentState !== STATES.IDLE);

            sendResponse({
                siteName: tracker.siteInfo.name,
                hostname: tracker.siteInfo.hostname,
                category: tracker.siteInfo.category || (siteAnalysisResult?.category) || 'Shopping',
                currentState: tracker.currentState,
                url: window.location.href,
                favicon: tracker.siteInfo.favicon,
                isPaymentSite: isPaymentSite,
                analysisScore: siteAnalysisResult?.score || 0,
                signals: siteAnalysisResult?.signals || []
            });
            return true;
        }
    });

    // Run initialization
    if (document.body) {
        setTimeout(initialize, 500); // Wait for page to render
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 500));
    }

    console.log('💸 Cashly v5.0: Smart Universal Detection Ready');

})();
