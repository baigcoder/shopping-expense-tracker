// Cashly - Smart Universal Transaction Detector v6.0
// Analyzes sites for payment features before activating monitoring
// Only tracks sites with actual transaction/payment capabilities
// v6.0: Added deduplication, debounce, caching, blacklist, debug flag

(function () {
    'use strict';

    // ================================
    // DEBUG FLAG - Set to false in production
    // ================================
    const DEBUG = false;
    const log = (...args) => DEBUG && console.log('💸', ...args);

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
    function generateTransactionHash(data) {
        const str = `${data.hostname || ''}-${data.name || ''}-${data.amount || data.price || 0}-${new Date().toDateString()}`;
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
        CONFIRMATION_TIMEOUT_MS: 60000,  // Extended from 30s to 60s
        STATE_HISTORY_LIMIT: 20,         // Limit state history
        DEBOUNCE_MS: 300,                // Debounce for mutation observer
        ANALYSIS_CACHE_MS: 300000        // 5 minutes
    };

    // ================================
    // EXCLUDED DOMAINS (own app)
    // ================================
    const EXCLUDED_DOMAINS = [
        'localhost', '127.0.0.1', 'vibe-tracker', 'vibetracker',
        'shopping-expense-tracker', 'vercel.app', 'netlify.app', 'cashly'
    ];

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
            const pageText = (document.body?.innerText || '').toLowerCase().slice(0, 10000);
            const subscriptionKeywords = [
                'subscription', 'subscribe now', 'recurring billing',
                'billed monthly', 'billed annually', 'per month', '/mo',
                'free trial', 'cancel anytime', 'premium plan',
                'pro plan', 'enterprise', 'team plan', 'starter plan'
            ];

            const found = subscriptionKeywords.filter(kw => pageText.includes(kw));
            if (found.length >= 2) {
                this.addSignal('subscription_keywords', 15);
            }
        }

        detectCategory() {
            const text = (document.title + ' ' + hostname).toLowerCase();

            if (/netflix|hulu|disney|hbo|spotify|youtube|twitch|prime video/.test(text)) return 'Entertainment';
            if (/adobe|figma|canva|sketch/.test(text)) return 'Creative';
            if (/notion|slack|trello|asana|monday/.test(text)) return 'Productivity';
            if (/github|vercel|aws|azure|digitalocean|heroku/.test(text)) return 'Development';
            if (/dropbox|google.*drive|icloud|box/.test(text)) return 'Storage';
            if (/amazon|ebay|walmart|target|aliexpress|daraz|shopify/.test(text)) return 'Shopping';
            if (/uber.*eat|doordash|grubhub|foodpanda|deliveroo/.test(text)) return 'Food Delivery';
            if (/chatgpt|openai|claude|gemini|midjourney/.test(text)) return 'AI Services';
            if (/gym|fitness|peloton|headspace|calm/.test(text)) return 'Health & Fitness';
            if (/coursera|udemy|skillshare|masterclass/.test(text)) return 'Education';

            return 'Other';
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
            const stateOrder = Object.values(STATES);
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
            const pageText = (document.body?.innerText || '').toLowerCase();

            const trialDays = this.extractTrialDays(pageText);
            const isTrial = trialDays > 0 || this.transactionData.isTrial;
            const isSubscription = this.transactionData.isSubscription || this.detectSubscription(pageText);
            const billingCycle = this.transactionData.billingCycle || this.detectBillingCycle(pageText);
            const planTier = this.detectPlanTier(pageText);  // NEW

            const transaction = {
                name: this.siteInfo.name,
                hostname: this.siteInfo.hostname,
                type: isTrial ? 'trial' : (isSubscription ? 'subscription' : 'purchase'),
                label: isTrial ? 'Trial Started' : (isSubscription ? 'Subscription' : 'Purchase'),
                icon: isTrial ? '🎁' : (isSubscription ? '💳' : '🛒'),
                price: prices[0] || 0,
                amount: prices[0] || 0,
                isTrial,
                trialDays: trialDays || (isTrial ? 7 : 0),
                category: this.siteInfo.category,
                billingCycle,
                isSubscription,
                planTier,  // NEW: Plan tier (starter, pro, enterprise)
                sourceUrl: window.location.href,
                favicon: this.siteInfo.favicon,
                detectedAt: new Date().toISOString(),
                behaviorFlow: this.stateHistory,
                autoAddTransaction: true
            };

            log('Transaction extracted:', transaction);

            // Check for duplicate transaction
            const txHash = generateTransactionHash(transaction);
            const isDuplicate = await isTransactionDuplicate(txHash);
            if (isDuplicate) {
                log('Duplicate transaction detected, skipping:', txHash);
                return;
            }

            // Mark as saved
            await markTransactionSaved(txHash);

            // Show notification
            this.showNotification(transaction);

            // Send to background for storage + sync
            chrome.runtime.sendMessage({
                type: 'BEHAVIOR_TRANSACTION_DETECTED',
                data: transaction
            });

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
                        category: transaction.category,
                        billingCycle,
                        isTrial,
                        is_trial: isTrial,
                        trialDays,
                        trial_days: trialDays,
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
                const text = (el.innerText || '').toLowerCase();
                if (/total|amount due|payable|grand total/i.test(text) && text.length < 100) {
                    const price = this.extractPriceFromText(el.innerText);
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

        extractTrialDays(pageText) {
            const patterns = [
                /(\d+)\s*[-–]?\s*day\s*(free\s*)?trial/i,
                /free\s*for\s*(\d+)\s*days?/i,
                /(\d+)\s*days?\s*free/i,
                /try\s*free\s*for\s*(\d+)/i
            ];

            for (const p of patterns) {
                const match = pageText.match(p);
                if (match && match[1]) return parseInt(match[1], 10);
            }
            return 0;
        }

        detectSubscription(pageText) {
            const keywords = [
                'subscription', 'recurring', 'renew', 'auto-renew',
                'membership', 'premium', 'pro plan', 'billed monthly',
                'billed yearly', 'per month', '/mo', '/year'
            ];
            return keywords.filter(kw => pageText.includes(kw)).length >= 2;
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

            const cancelPatterns = [
                /\/cancel/i, /\/unsubscribe/i, /\/downgrade/i,
                /cancel.*(subscription|plan|membership)/i,
                /subscription.*cancel/i
            ];

            const cancelKeywords = [
                'cancel subscription', 'cancel my plan', 'unsubscribe',
                'end membership', 'stop subscription', 'downgrade',
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

        showNotification(data) {
            const existing = document.getElementById('cashly-notification');
            if (existing) existing.remove();

            const el = document.createElement('div');
            el.id = 'cashly-notification';
            el.innerHTML = `
                <div style="
                    position: fixed; top: 20px; right: 20px;
                    background: linear-gradient(135deg, #10B981 0%, #8B5CF6 100%);
                    color: white; padding: 16px 20px; border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 2147483647; max-width: 320px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    animation: cashlySlide 0.4s ease-out;
                ">
                    <style>
                        @keyframes cashlySlide { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                    </style>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 28px;">${data.icon}</span>
                        <div style="flex: 1;">
                            <strong style="display: block; font-size: 14px;">✓ Saved to Cashly!</strong>
                            <span style="font-size: 12px; opacity: 0.9;">${data.label}</span>
                        </div>
                        <button onclick="this.closest('#cashly-notification').remove()" 
                            style="background: rgba(255,255,255,0.2); border: none; 
                            width: 24px; height: 24px; border-radius: 50%; cursor: pointer; color: white;">×</button>
                    </div>
                    <div style="background: rgba(0,0,0,0.15); border-radius: 8px; padding: 10px; font-size: 13px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="opacity: 0.8;">Service</span>
                            <strong>${data.name}</strong>
                        </div>
                        ${data.amount > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="opacity: 0.8;">Amount</span>
                            <strong>$${data.amount.toFixed(2)}</strong>
                        </div>` : ''}
                        ${data.isTrial ? `
                        <div style="display: flex; justify-content: space-between;">
                            <span style="opacity: 0.8;">Trial</span>
                            <strong>${data.trialDays} days</strong>
                        </div>` : ''}
                    </div>
                </div>
            `;
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
        /step=payment/i, /step=checkout/i
    ];

    const PAYMENT_FORM_SELECTORS = [
        'input[autocomplete="cc-number"]', 'input[autocomplete="cc-csc"]',
        'input[name*="card"]', 'input[data-stripe]',
        '[class*="card-number"]', 'iframe[src*="stripe"]',
        'iframe[src*="braintree"]', 'iframe[src*="paypal"]',
        '.StripeElement'
    ];

    const PAYMENT_BUTTON_PATTERNS = [
        /^pay$/i, /^pay\s*now$/i, /^submit\s*(payment|order)?$/i,
        /^complete\s*(order|purchase)?$/i, /^place\s*order$/i,
        /^confirm\s*(order|payment)?$/i, /^subscribe$/i,
        /^start\s*(free\s*)?trial$/i, /^buy\s*now$/i
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
    let siteAnalysisResult = null; // Store analysis result for popup queries

    function initialize() {
        // Check blacklist first
        if (isBlacklisted(hostname)) {
            log('Site is blacklisted, skipping');
            return;
        }

        // Try cached analysis first
        const cachedResult = getCachedAnalysis(hostname);
        if (cachedResult) {
            siteAnalysisResult = cachedResult;
        } else {
            siteAnalysisResult = analyzer.analyze();
            setCachedAnalysis(hostname, siteAnalysisResult);
        }

        tracker.siteInfo.category = siteAnalysisResult.category;

        if (siteAnalysisResult.isPaymentSite) {
            log('Payment site detected! Starting monitoring...', {
                score: siteAnalysisResult.score,
                signals: siteAnalysisResult.signals
            });
            tracker.transition(STATES.MONITORING, { analysisScore: siteAnalysisResult.score });

            // Start behavioral detection
            startBehaviorDetection();
        } else {
            log('Not a payment site, staying idle', {
                score: siteAnalysisResult.score,
                signals: siteAnalysisResult.signals
            });
            // Still set state to MONITORING if score is > 0 (some signals detected)
            if (siteAnalysisResult.score > 0) {
                tracker.transition(STATES.MONITORING, { analysisScore: siteAnalysisResult.score });
            }
            tracker.notifyBackground(); // Still notify with status
        }
    }

    function startBehaviorDetection() {
        // Check checkout URL
        checkCheckoutURL();
        checkPaymentForms();
        checkCancellation();

        // Listen for payment button clicks
        document.addEventListener('click', handleClick, true);

        // Debounced payment form checker for performance
        const debouncedCheckPaymentForms = debounce(checkPaymentForms, CONFIG.DEBOUNCE_MS);

        // Watch for DOM changes (SPA support) - DEBOUNCED for performance
        const observer = new MutationObserver(debouncedCheckPaymentForms);
        observer.observe(document.body, { childList: true, subtree: true });

        // Intercept history changes (SPA navigation)
        const originalPushState = history.pushState;
        history.pushState = function () {
            originalPushState.apply(this, arguments);
            setTimeout(() => {
                checkCheckoutURL();
                checkPaymentForms();
                checkCancellation();
            }, 300);
        };
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

    function handleClick(e) {
        const target = e.target.closest('button, [role="button"], a, input[type="submit"]');
        if (!target) return;

        const text = (target.innerText || target.value || '').trim();
        const isPayButton = PAYMENT_BUTTON_PATTERNS.some(p => p.test(text));

        if (isPayButton) {
            log('Payment button clicked:', text);

            tracker.transition(STATES.PAYMENT_SUBMITTED, {
                submittedAt: Date.now(),
                isTrial: /trial/i.test(text),
                isSubscription: /subscribe/i.test(text)
            });

            startConfirmationWatcher();
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

    function startConfirmationWatcher() {
        if (confirmationWatcherActive) return;
        confirmationWatcherActive = true;

        log('Started confirmation watcher');

        const checkConfirmation = () => {
            const url = window.location.href.toLowerCase();
            if (SUCCESS_URL_PATTERNS.some(p => p.test(url))) {
                checkSuccessElements();
            }
        };

        checkConfirmation();
        window.addEventListener('popstate', checkConfirmation);

        const observer = new MutationObserver(checkConfirmation);
        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            confirmationWatcherActive = false;
        }, CONFIG.CONFIRMATION_TIMEOUT_MS);  // Extended to 60s
    }

    function checkSuccessElements() {
        if (tracker.currentState === STATES.TRANSACTION_CONFIRMED) return;

        for (const selector of SUCCESS_ELEMENT_SELECTORS) {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    const text = el.innerText.toLowerCase();
                    if (/thank|success|confirm|complete|order.*placed|payment.*received/i.test(text)) {
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
