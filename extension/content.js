// Universal Content Script - FULLY AUTOMATIC Detection & Tracking
// ONLY triggers on ACTUAL confirmation pages (after purchase/trial is complete)
// Auto-saves without prompts - just shows notification
(function () {
    'use strict';

    // IMPORTANT: Don't run on our own website - it has its own handling
    const hostname = window.location.hostname;
    if (hostname.includes('vibe-tracker') ||
        hostname.includes('localhost') ||
        hostname.includes('127.0.0.1') ||
        hostname.includes('vercel.app')) {
        console.log('💸 Vibe Tracker: Skipping our own website');
        return; // Exit early
    }

    console.log('💸 Vibe Tracker: Auto-tracking loaded');

    // ================================
    // STRICT CONFIRMATION DETECTION
    // ================================

    // These indicate the transaction is COMPLETE (not just a marketing page)
    const STRONG_CONFIRMATION_KEYWORDS = [
        // Definite purchase confirmations
        'thank you for your order',
        'order confirmed',
        'order confirmation',
        'payment successful',
        'payment confirmed',
        'payment complete',
        'purchase complete',
        'purchase confirmed',
        'your order has been placed',
        'order placed successfully',
        'checkout complete',
        'thanks for your purchase',
        'order number',
        'confirmation number',
        'order #:',
        'your receipt',

        // Definite subscription/trial confirmations
        'your trial has started',
        'trial started successfully',
        'subscription confirmed',
        'subscription started',
        'subscription is now active',
        'you are now subscribed',
        'welcome to your',
        'your subscription is active',
        'plan activated',
        'upgrade complete',
        'you have successfully subscribed',
        'membership confirmed',
        'account upgraded',
        'you\'re all set',
        'get started with your',
        'enjoy your trial',
        'your free trial is active',
        'trial is now active',
        'successfully activated',
        'successfully started'
    ];

    // These are weak - marketing pages have these too
    const EXCLUDE_IF_HAS = [
        'sign up',
        'create account',
        'start your free trial',
        'try for free',
        'get started',
        'start now',
        'join now',
        'pricing',
        'choose a plan',
        'select a plan',
        'compare plans',
        'add to cart',
        'buy now',
        'subscribe now'
    ];

    // Currency patterns
    const CURRENCY_PATTERNS = [
        /\$\s*([\d,]+\.?\d*)/g,
        /USD\s*([\d,]+\.?\d*)/gi,
        /€\s*([\d,]+\.?\d*)/g,
        /£\s*([\d,]+\.?\d*)/g,
        /₹\s*([\d,]+\.?\d*)/g,
        /Rs\.?\s*([\d,]+\.?\d*)/gi,
        /PKR\s*([\d,]+\.?\d*)/gi,
        /([\d,]+\.?\d*)\s*\/\s*mo(?:nth)?/gi,
        /([\d,]+\.?\d*)\s*per\s*month/gi,
    ];

    // ================================
    // UTILITY FUNCTIONS
    // ================================

    function getPageText() {
        return document.body ? document.body.innerText.toLowerCase() : '';
    }

    function getHostname() {
        return window.location.hostname.replace('www.', '');
    }

    function getBrandName() {
        const hostname = getHostname();

        const ogSiteName = document.querySelector('meta[property="og:site_name"]');
        if (ogSiteName && ogSiteName.content) return ogSiteName.content;

        const appName = document.querySelector('meta[name="application-name"]');
        if (appName && appName.content) return appName.content;

        const title = document.title;
        if (title) {
            const separators = ['|', ' - ', ' – ', ' — '];
            for (const sep of separators) {
                if (title.includes(sep)) {
                    const parts = title.split(sep);
                    const brand = parts[parts.length - 1].trim();
                    if (brand.length > 2 && brand.length < 30) {
                        return brand;
                    }
                }
            }
        }

        const parts = hostname.split('.');
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }

    function extractPrices(text) {
        const prices = [];
        for (const pattern of CURRENCY_PATTERNS) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const price = parseFloat(match[1].replace(/,/g, ''));
                if (price > 0 && price < 50000) {
                    prices.push(price);
                }
            }
        }
        return [...new Set(prices)].sort((a, b) => b - a);
    }

    function extractTrialDays(text) {
        const patterns = [
            /(\d+)\s*[-–]?\s*day\s*(free\s*)?trial/i,
            /(\d+)\s*days?\s*free/i,
            /(\d+)\s*day\s*free\s*trial/i,
            /free\s*for\s*(\d+)\s*days?/i,
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return parseInt(match[1], 10);
        }
        return 0;
    }

    // ================================
    // STRICT CONFIRMATION DETECTION
    // ================================

    function isRealConfirmationPage() {
        const pageText = getPageText();
        const url = window.location.href.toLowerCase();

        // Check URL for confirmation indicators
        const urlConfirmIndicators = [
            'confirm', 'success', 'thank', 'complete', 'receipt',
            'order-confirm', 'checkout/success', 'payment/success',
            'subscription/confirm', 'welcome', 'activated'
        ];

        const hasConfirmUrl = urlConfirmIndicators.some(ind => url.includes(ind));

        // Check for STRONG confirmation keywords
        let strongMatchCount = 0;
        for (const keyword of STRONG_CONFIRMATION_KEYWORDS) {
            if (pageText.includes(keyword)) {
                strongMatchCount++;
                console.log('💰 Found confirmation keyword:', keyword);
            }
        }

        // Check for marketing/signup page indicators (should NOT trigger)
        let hasMarketingKeywords = false;
        for (const exclude of EXCLUDE_IF_HAS) {
            if (pageText.includes(exclude)) {
                // Check if it's a button text (marketing) vs confirmation text
                const buttons = document.querySelectorAll('button, .btn, [class*="button"], a[class*="cta"]');
                for (const btn of buttons) {
                    const btnText = btn.innerText || btn.textContent || '';
                    if (btnText.toLowerCase().includes(exclude)) {
                        hasMarketingKeywords = true;
                        break;
                    }
                }
            }
        }

        // Decision logic
        if (strongMatchCount >= 1 && !hasMarketingKeywords) {
            console.log('💰 ✓ REAL confirmation page detected!', { strongMatchCount, hasConfirmUrl });
            return true;
        }

        if (hasConfirmUrl && strongMatchCount >= 1) {
            console.log('💰 ✓ Confirmation URL + keywords detected!');
            return true;
        }

        console.log('💰 ✗ Not a confirmation page', { strongMatchCount, hasMarketingKeywords });
        return false;
    }

    function detectTransactionType() {
        const pageText = getPageText();

        const trialWords = ['trial', 'free trial', 'trial started', 'trial period'];
        for (const word of trialWords) {
            if (pageText.includes(word)) {
                return { type: 'trial', label: 'Trial Started', icon: '🎁' };
            }
        }

        const subWords = ['/month', '/mo', 'subscription', 'membership', 'recurring', 'billed'];
        for (const word of subWords) {
            if (pageText.includes(word)) {
                return { type: 'subscription', label: 'Subscription', icon: '💳' };
            }
        }

        return { type: 'purchase', label: 'Purchase', icon: '🛒' };
    }

    // Detect billing cycle from page content
    function detectBillingCycle(text) {
        const yearlyPatterns = [
            /\/year/i, /per year/i, /yearly/i, /annual/i, /billed annually/i,
            /\/yr/i, /12 months/i
        ];
        const monthlyPatterns = [
            /\/month/i, /per month/i, /monthly/i, /billed monthly/i,
            /\/mo/i, /each month/i
        ];
        const weeklyPatterns = [
            /\/week/i, /per week/i, /weekly/i, /billed weekly/i
        ];

        for (const pattern of yearlyPatterns) {
            if (pattern.test(text)) return 'yearly';
        }
        for (const weeklyPattern of weeklyPatterns) {
            if (weeklyPattern.test(text)) return 'weekly';
        }
        for (const monthlyPattern of monthlyPatterns) {
            if (monthlyPattern.test(text)) return 'monthly';
        }

        return 'monthly'; // Default
    }

    // Extract next renewal date from page
    function extractRenewalDate(text) {
        const patterns = [
            /(?:renews?|due|next billing|charged)\s*(?:on|:)?\s*(\w+ \d+,? \d{4})/i,
            /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
            /(\w+ \d+, \d{4})/
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const date = new Date(match[1]);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }
        return null;
    }

    function guessCategory(name, hostname) {
        const text = (name + ' ' + hostname).toLowerCase();

        if (/netflix|hulu|disney|hbo|prime|youtube|spotify|stream|video|music/i.test(text)) return 'Entertainment';
        if (/adobe|figma|canva|photoshop|creative|design/i.test(text)) return 'Creative';
        if (/notion|slack|trello|asana|productivity/i.test(text)) return 'Productivity';
        if (/github|vercel|netlify|aws|dev|hosting/i.test(text)) return 'Development';
        if (/hubspot|salesforce|crm|mailchimp|marketing/i.test(text)) return 'Business';
        if (/dropbox|google|icloud|storage/i.test(text)) return 'Storage';
        if (/grammarly|coursera|udemy|learn/i.test(text)) return 'Education';
        if (/amazon|ebay|shop|store|daraz/i.test(text)) return 'Shopping';
        if (/food|uber|deliveroo|restaurant/i.test(text)) return 'Food';

        return 'Other';
    }

    // ================================
    // AUTO-TRACKING (NO PROMPTS)
    // ================================

    function autoTrack() {
        const trackKey = `et_tracked_${window.location.href}`;
        if (sessionStorage.getItem(trackKey)) {
            console.log('💰 Already tracked this page');
            return;
        }

        // STRICT check - only real confirmations
        if (!isRealConfirmationPage()) {
            return;
        }

        console.log('💰 🎉 CONFIRMATION DETECTED! Auto-saving...');

        const pageText = getPageText();
        const brandName = getBrandName();
        const prices = extractPrices(pageText);
        const trialDays = extractTrialDays(pageText);
        const transactionType = detectTransactionType();
        const billingCycle = detectBillingCycle(pageText);
        const renewalDate = extractRenewalDate(pageText);
        const price = prices.length > 0 ? prices[0] : 0;

        const data = {
            name: brandName,
            serviceName: brandName,
            type: transactionType.type,
            label: transactionType.label,
            icon: transactionType.icon,
            price: price,
            amount: price,
            isTrial: transactionType.type === 'trial',
            trialDays: trialDays || (transactionType.type === 'trial' ? 7 : 0),
            category: guessCategory(brandName, getHostname()),
            // Enhanced fields
            billingCycle: billingCycle,
            cycle: billingCycle,
            renewalDate: renewalDate,
            sourceUrl: window.location.href,
            hostname: getHostname(),
            detectedAt: new Date().toISOString(),
            // Auto-add transaction flag
            autoAddTransaction: true
        };

        console.log('💰 Saving:', data);

        // Mark as tracked
        sessionStorage.setItem(trackKey, 'true');

        // Auto-save
        saveAndNotify(data);
    }

    // ================================
    // SAVE & NOTIFY
    // ================================

    function saveAndNotify(data) {
        // Show immediate "saving" notification
        showSavingNotification(data);

        chrome.runtime.sendMessage({
            type: data.type === 'purchase' ? 'PURCHASE_DETECTED' : 'SUBSCRIPTION_DETECTED',
            data: data
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.log('💰 Error:', chrome.runtime.lastError);
                showSavedNotification(data, true);
                return;
            }

            if (response && response.success) {
                showSavedNotification(data, false);
            } else {
                showSavedNotification(data, true);
            }
        });
    }

    function showSavingNotification(data) {
        removeAllNotifications();

        const el = document.createElement('div');
        el.id = 'et-notify';
        el.innerHTML = `
            <div style="
                position: fixed; top: 20px; right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; border: 3px solid #000; border-radius: 16px;
                padding: 1rem 1.25rem; box-shadow: 6px 6px 0px #000;
                z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                display: flex; align-items: center; gap: 12px;
                animation: etSlide 0.4s ease; max-width: 320px;
            ">
                <style>
                    @keyframes etSlide { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes etSpin { to { transform: rotate(360deg); } }
                </style>
                <div style="width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: etSpin 1s linear infinite;"></div>
                <div>
                    <strong style="display: block;">Auto-saving...</strong>
                    <span style="font-size: 0.85rem; opacity: 0.9;">${data.name}</span>
                </div>
            </div>
        `;
        document.body.appendChild(el);
    }

    function showSavedNotification(data, isPending) {
        removeAllNotifications();

        const el = document.createElement('div');
        el.id = 'et-notify';
        el.innerHTML = `
            <div style="
                position: fixed; top: 20px; right: 20px;
                background: ${isPending ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10B981, #059669)'};
                color: white; border: 3px solid #000; border-radius: 16px;
                padding: 1.25rem; box-shadow: 8px 8px 0px #000;
                z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                animation: etSlide 0.4s ease; max-width: 380px;
            ">
                <style>@keyframes etSlide { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
                
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">
                        ${isPending ? '⏳' : '✓'}
                    </div>
                    <div style="flex: 1;">
                        <strong style="display: block; font-size: 1.1rem;">${isPending ? 'Saved Locally!' : '✓ Auto-Tracked!'}</strong>
                        <span style="font-size: 0.85rem; opacity: 0.9;">${isPending ? 'Will sync when logged in' : 'Added to your account'}</span>
                    </div>
                    <button onclick="this.closest('#et-notify').remove()" style="background: rgba(255,255,255,0.2); border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; color: white; font-size: 1.25rem;">&times;</button>
                </div>
                
                <div style="background: rgba(0,0,0,0.15); border-radius: 10px; padding: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="opacity: 0.9; font-size: 0.85rem;">${data.icon} Type</span>
                        <strong>${data.label}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="opacity: 0.9; font-size: 0.85rem;">🏷️ Service</span>
                        <strong>${data.name}</strong>
                    </div>
                    ${data.price > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="opacity: 0.9; font-size: 0.85rem;">💰 Amount</span>
                            <strong>$${data.price.toFixed(2)}</strong>
                        </div>
                    ` : ''}
                    ${data.trialDays > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="opacity: 0.9; font-size: 0.85rem;">📅 Trial</span>
                            <strong>${data.trialDays} days</strong>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between;">
                        <span style="opacity: 0.9; font-size: 0.85rem;">📂 Category</span>
                        <strong>${data.category}</strong>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(el);

        setTimeout(() => {
            const n = document.getElementById('et-notify');
            if (n) n.remove();
        }, 10000);
    }

    function removeAllNotifications() {
        document.querySelectorAll('#et-notify').forEach(n => n.remove());
    }

    // ================================
    // MESSAGE HANDLERS
    // ================================

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'GET_SUPABASE_SESSION') {
            try {
                const keys = Object.keys(localStorage);
                const supabaseKey = keys.find(k => k.startsWith('sb-') && k.includes('auth-token'));
                if (supabaseKey) {
                    const sessionData = JSON.parse(localStorage.getItem(supabaseKey));
                    if (sessionData && sessionData.access_token) {
                        sendResponse({ success: true, session: { access_token: sessionData.access_token, user: sessionData.user } });
                        return true;
                    }
                }
                sendResponse({ success: false });
            } catch (e) {
                sendResponse({ success: false });
            }
            return true;
        }

        if (request.type === 'EXTRACT_PRODUCT') {
            const prices = extractPrices(getPageText());
            sendResponse({
                success: true,
                data: {
                    productName: document.title || getBrandName(),
                    storeName: getBrandName(),
                    amount: prices[0] || 0,
                    category: guessCategory(getBrandName(), getHostname())
                }
            });
            return true;
        }
    });

    // ================================
    // INIT
    // ================================

    function init() {
        console.log('💰 Scanning page...');
        setTimeout(autoTrack, 2500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1500);
    }

    // SPA support
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(autoTrack, 2500);
        }
    }).observe(document, { subtree: true, childList: true });

})();
