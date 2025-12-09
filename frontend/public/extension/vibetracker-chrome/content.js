// Enhanced Content Script - Detects purchases and extracts product info
(function () {
    'use strict';

    // Site-specific selectors for order confirmation pages
    const SITE_CONFIGS = {
        // TEST PAGE - for development and demo
        'test-purchase': {
            orderConfirmSelector: '.header h1',
            totalSelector: '.total-amount, .grand-total span:last-child',
            productSelector: '.product-name',
            isOrderPage: () => window.location.href.includes('test-purchase.html') ||
                document.querySelector('.extension-notice') !== null
        },
        'localhost': {
            orderConfirmSelector: '.header h1',
            totalSelector: '.total-amount, .grand-total span:last-child',
            productSelector: '.product-name',
            isOrderPage: () => window.location.href.includes('test-purchase.html') ||
                document.querySelector('.extension-notice') !== null
        },
        'amazon.com': {
            orderConfirmSelector: '.order-confirmation, #orderDetails, .a-box-title',
            totalSelector: '.grand-total-price, .order-total .value, #priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen',
            productSelector: '#productTitle, .product-title, .yohtmlc-product-title',
            isOrderPage: () => window.location.href.includes('/gp/buy/thankyou') ||
                window.location.href.includes('/order-details/') ||
                window.location.href.includes('/dp/')
        },
        'ebay.com': {
            orderConfirmSelector: '.purchase-confirmation, .vi-price',
            totalSelector: '.item-price, .x-price-primary',
            productSelector: '.item-title, .x-item-title__mainTitle',
            isOrderPage: () => window.location.href.includes('/itm/') ||
                window.location.href.includes('/checkoutconfirmation')
        },
        'walmart.com': {
            orderConfirmSelector: '.order-confirmation, [data-testid="product-title"]',
            totalSelector: '.order-total, [data-testid="price"]',
            productSelector: '.product-name, [data-testid="product-title"]',
            isOrderPage: () => window.location.href.includes('/checkout/thank-you') ||
                window.location.href.includes('/ip/')
        },
        'bestbuy.com': {
            totalSelector: '.priceView-customer-price span, .priceView-hero-price',
            productSelector: '.sku-title h1, .heading-5',
            isOrderPage: () => window.location.href.includes('/site/')
        },
        'target.com': {
            totalSelector: '[data-test="product-price"]',
            productSelector: '[data-test="product-title"]',
            isOrderPage: () => window.location.href.includes('/p/')
        }
    };

    // Get current site config
    function getSiteConfig() {
        const hostname = window.location.hostname;
        for (const site in SITE_CONFIGS) {
            if (hostname.includes(site)) {
                return { site, config: SITE_CONFIGS[site] };
            }
        }
        return null;
    }

    // Generic product extraction for any page
    function extractGenericProductData() {
        try {
            let productName = '';
            let amount = 0;

            // Try common price selectors
            const priceSelectors = [
                '[data-price]',
                '.price',
                '.product-price',
                '[class*="price"]',
                '[class*="Price"]',
                'meta[property="product:price:amount"]',
                '[itemprop="price"]'
            ];

            for (const selector of priceSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    const text = el.getAttribute('content') || el.textContent || '';
                    const match = text.match(/[\d,]+\.?\d*/);
                    if (match) {
                        amount = parseFloat(match[0].replace(',', ''));
                        if (amount > 0) break;
                    }
                }
            }

            // Try common title selectors
            const titleSelectors = [
                'h1',
                '[class*="product-title"]',
                '[class*="ProductTitle"]',
                '[itemprop="name"]',
                'meta[property="og:title"]',
                'title'
            ];

            for (const selector of titleSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    productName = (el.getAttribute('content') || el.textContent || '').trim();
                    if (productName && productName.length > 2 && productName.length < 200) break;
                }
            }

            // Get store name from domain
            const hostname = window.location.hostname;
            const storeName = hostname.replace('www.', '').split('.')[0];
            const formattedStoreName = storeName.charAt(0).toUpperCase() + storeName.slice(1);

            return {
                productName: productName.slice(0, 100) || 'Unknown Product',
                amount,
                storeName: formattedStoreName,
                storeUrl: window.location.href
            };
        } catch (error) {
            console.error('Generic extraction failed:', error);
            return null;
        }
    }

    // Extract purchase data from known site
    function extractPurchaseData(config) {
        try {
            let amount = 0;

            // Get total amount
            const totalEl = document.querySelector(config.totalSelector);
            if (totalEl) {
                const text = totalEl.getAttribute('content') || totalEl.textContent || '';
                const match = text.match(/[\d,]+\.?\d*/);
                if (match) {
                    amount = parseFloat(match[0].replace(',', ''));
                }
            }

            // Get product name
            const productEl = document.querySelector(config.productSelector);
            const productName = productEl ? productEl.textContent.trim().slice(0, 100) : 'Unknown Product';

            return {
                amount,
                productName,
                storeUrl: window.location.href
            };
        } catch (error) {
            console.error('Failed to extract purchase data:', error);
            return null;
        }
    }

    // Main detection function for auto-tracking
    function detectPurchase() {
        const siteInfo = getSiteConfig();
        if (!siteInfo) return;

        const { site, config } = siteInfo;

        // Check if we're on an order confirmation page
        if (config.isOrderPage && !config.isOrderPage()) return;

        // Check if order confirmation element exists
        if (config.orderConfirmSelector) {
            const confirmEl = document.querySelector(config.orderConfirmSelector);
            if (!confirmEl) return;
        }

        // Extract purchase data
        const purchaseData = extractPurchaseData(config);
        if (!purchaseData || purchaseData.amount <= 0) return;

        // Get store name from site
        const storeName = site.split('.')[0].charAt(0).toUpperCase() + site.split('.')[0].slice(1);

        // Send to background script
        chrome.runtime.sendMessage({
            type: 'PURCHASE_DETECTED',
            data: {
                storeName,
                productName: purchaseData.productName,
                amount: purchaseData.amount,
                storeUrl: purchaseData.storeUrl,
                detectedAt: new Date().toISOString()
            }
        });

        // Show on-page notification
        showNotification(storeName, purchaseData.amount);
    }

    // Listen for messages from popup (for manual "Clip Page")
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'EXTRACT_PRODUCT') {
            // Try site-specific extraction first
            const siteInfo = getSiteConfig();
            let data = null;

            if (siteInfo) {
                data = extractPurchaseData(siteInfo.config);
                if (data) {
                    data.storeName = siteInfo.site.split('.')[0].charAt(0).toUpperCase() + siteInfo.site.split('.')[0].slice(1);
                }
            }

            // Fall back to generic extraction
            if (!data || data.amount <= 0) {
                data = extractGenericProductData();
            }

            if (data && (data.productName || data.amount > 0)) {
                sendResponse({ success: true, data });
                showNotification(data.storeName, data.amount, true);
            } else {
                sendResponse({ success: false, error: 'Could not extract product info' });
            }
        }
        return true; // Keep message channel open for async response
    });

    // Show floating notification on page
    function showNotification(store, amount, isManual = false) {
        // Check if notification already shown
        if (document.getElementById('expense-tracker-notification')) {
            document.getElementById('expense-tracker-notification').remove();
        }

        const notification = document.createElement('div');
        notification.id = 'expense-tracker-notification';
        notification.innerHTML = `
            <div class="et-notification" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #fff;
                border: 3px solid #000;
                border-radius: 12px;
                padding: 1rem 1.5rem;
                box-shadow: 6px 6px 0px #000;
                display: flex;
                align-items: center;
                gap: 1rem;
                z-index: 999999;
                font-family: 'Space Grotesk', -apple-system, sans-serif;
                animation: slideIn 0.3s ease;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    background: ${isManual ? '#4ECDC4' : '#FFD93D'};
                    border: 2px solid #000;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                ">${isManual ? '📌' : '✓'}</div>
                <div>
                    <strong style="display: block; font-size: 0.9rem;">${isManual ? 'Clipped!' : 'Purchase Tracked!'}</strong>
                    <span style="font-size: 0.8rem; color: #666;">${store} - $${amount.toFixed(2)}</span>
                </div>
                <button class="et-close" style="
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                ">&times;</button>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 4000);

        // Close button handler
        notification.querySelector('.et-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Run detection when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', detectPurchase);
    } else {
        // Wait a bit for dynamic content
        setTimeout(detectPurchase, 1500);
    }

    // Also check on navigation (SPA support)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(detectPurchase, 1500);
        }
    }).observe(document, { subtree: true, childList: true });

})();
