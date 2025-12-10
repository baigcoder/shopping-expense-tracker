// Dark Pattern Detector - Protects users from manipulative subscription tactics
// Vibe Tracker Extension - Silent Subscriptions Shield 🛡️

(function () {
    'use strict';

    console.log('🛡️ Vibe Tracker: Dark Pattern Shield Active');

    // ================================
    // DARK PATTERN DEFINITIONS
    // ================================

    const DARK_PATTERNS = {
        // Pre-selected recurring checkboxes
        preSelectedRecurring: {
            id: 'pre-selected-recurring',
            name: 'Pre-selected Recurring Payment',
            severity: 'HIGH',
            icon: '⚠️',
            description: 'A recurring payment option was already selected for you'
        },

        // Hidden trial-to-paid conversion
        hiddenTrialCharge: {
            id: 'hidden-trial-charge',
            name: 'Hidden Trial Charge',
            severity: 'CRITICAL',
            icon: '🚨',
            description: 'This trial will automatically charge your card'
        },

        // Confirm-shaming (guilt-trip buttons)
        confirmShaming: {
            id: 'confirm-shaming',
            name: 'Guilt-Trip Button',
            severity: 'MEDIUM',
            icon: '😤',
            description: 'This button uses guilt to manipulate your choice'
        },

        // Forced continuity (no reminder before charge)
        forcedContinuity: {
            id: 'forced-continuity',
            name: 'No Cancellation Reminder',
            severity: 'HIGH',
            icon: '📧',
            description: 'You won\'t receive a reminder before being charged'
        },

        // Sneaky subscription in cart
        sneakySubscription: {
            id: 'sneaky-subscription',
            name: 'Hidden Subscription Added',
            severity: 'CRITICAL',
            icon: '🐍',
            description: 'A subscription was sneakily added to your cart'
        },

        // Difficult cancellation
        difficultCancellation: {
            id: 'difficult-cancel',
            name: 'Difficult Cancellation',
            severity: 'MEDIUM',
            icon: '🔒',
            description: 'Cancellation is intentionally made difficult'
        }
    };

    // ================================
    // DETECTION PATTERNS
    // ================================

    // Text patterns that indicate hidden charges
    const HIDDEN_CHARGE_PATTERNS = [
        /free.*trial.*then.*\$?[\d,]+/i,
        /after.*\d+.*days.*charged/i,
        /trial.*automatically.*convert/i,
        /cancel.*before.*avoid.*charge/i,
        /will.*be.*charged.*after/i,
        /subscription.*renews.*automatically/i,
        /billed.*after.*trial/i,
        /payment.*due.*after.*trial/i,
        /auto.?renew/i,
        /recurring.*billing/i,
        /continue.*unless.*cancel/i,
        /Rs\.?\s*[\d,]+\s*\/\s*month\s*after/i,
        /\$[\d,]+\s*\/\s*month\s*after/i,
        /PKR\s*[\d,]+.*after.*trial/i
    ];

    // Confirm-shaming patterns (guilt-trip text)
    const CONFIRM_SHAME_PATTERNS = [
        /no.*thanks.*i.*don't.*want/i,
        /i.*don't.*want.*save/i,
        /i.*prefer.*pay.*more/i,
        /no.*i.*hate.*savings/i,
        /i.*don't.*like.*deals/i,
        /miss.*this.*offer/i,
        /i.*prefer.*full.*price/i,
        /no.*thanks.*i'm.*rich/i,
        /i.*don't.*need.*discount/i
    ];

    // ================================
    // DETECTION FUNCTIONS
    // ================================

    function getPageText() {
        return document.body?.innerText?.toLowerCase() || '';
    }

    function detectPreSelectedCheckboxes() {
        const findings = [];

        // Find pre-checked checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                // Check if nearby text mentions subscription/recurring
                const parent = checkbox.closest('label, .form-group, div, p');
                const nearbyText = parent?.innerText?.toLowerCase() || '';

                const subscriptionKeywords = [
                    'monthly', 'yearly', 'annual', 'recurring', 'subscription',
                    'auto-renew', 'automatic', 'billing', 'charged', 'per month',
                    '/month', '/year', 'membership'
                ];

                if (subscriptionKeywords.some(kw => nearbyText.includes(kw))) {
                    findings.push({
                        ...DARK_PATTERNS.preSelectedRecurring,
                        element: checkbox,
                        context: nearbyText.slice(0, 150)
                    });
                }
            }
        });

        return findings;
    }

    function detectHiddenCharges() {
        const findings = [];
        const pageText = getPageText();

        HIDDEN_CHARGE_PATTERNS.forEach(pattern => {
            if (pattern.test(pageText)) {
                // Extract the matching text for context
                const match = pageText.match(pattern);
                if (match) {
                    findings.push({
                        ...DARK_PATTERNS.hiddenTrialCharge,
                        context: match[0]
                    });
                }
            }
        });

        // Deduplicate
        return findings.length > 0 ? [findings[0]] : [];
    }

    function detectConfirmShaming() {
        const findings = [];

        // Check buttons and links
        const clickables = document.querySelectorAll('button, a, [role="button"]');

        clickables.forEach(el => {
            const text = el.innerText?.toLowerCase() || '';

            CONFIRM_SHAME_PATTERNS.forEach(pattern => {
                if (pattern.test(text)) {
                    findings.push({
                        ...DARK_PATTERNS.confirmShaming,
                        element: el,
                        context: text.slice(0, 100)
                    });
                }
            });
        });

        return findings;
    }

    function detectForcedContinuity() {
        const findings = [];
        const pageText = getPageText();

        // Check for forced continuity indicators
        const forcedPatterns = [
            /membership.*continue.*unless.*cancel/i,
            /will.*be.*automatically.*renewed/i,
            /subscription.*continues.*until/i,
            /no.*reminder.*will.*be.*sent/i,
            /you.*will.*not.*receive.*notice/i
        ];

        forcedPatterns.forEach(pattern => {
            if (pattern.test(pageText)) {
                findings.push({
                    ...DARK_PATTERNS.forcedContinuity,
                    context: pageText.match(pattern)?.[0] || ''
                });
            }
        });

        return findings.length > 0 ? [findings[0]] : [];
    }

    function extractPriceInfo() {
        const pageText = getPageText();
        const priceInfo = {
            trialDays: null,
            monthlyPrice: null,
            yearlyPrice: null,
            currency: 'Rs'
        };

        // Extract trial days
        const trialMatch = pageText.match(/(\d+)[- ]?days?\s*(free\s*)?trial/i) ||
            pageText.match(/free\s*trial[^.]*?(\d+)\s*days?/i);
        if (trialMatch) {
            priceInfo.trialDays = parseInt(trialMatch[1]);
        }

        // Extract monthly price
        const monthlyMatch = pageText.match(/(?:rs\.?|pkr|\$|₹)\s*([\d,]+(?:\.\d{2})?)\s*(?:\/\s*)?(?:per\s*)?month/i) ||
            pageText.match(/([\d,]+(?:\.\d{2})?)\s*(?:\/\s*)?(?:per\s*)?month/i);
        if (monthlyMatch) {
            priceInfo.monthlyPrice = parseFloat(monthlyMatch[1].replace(/,/g, ''));
        }

        // Extract yearly price
        const yearlyMatch = pageText.match(/(?:rs\.?|pkr|\$|₹)\s*([\d,]+(?:\.\d{2})?)\s*(?:\/\s*)?(?:per\s*)?year/i);
        if (yearlyMatch) {
            priceInfo.yearlyPrice = parseFloat(yearlyMatch[1].replace(/,/g, ''));
        }

        // Detect currency
        if (/\$/.test(pageText)) priceInfo.currency = '$';
        else if (/€/.test(pageText)) priceInfo.currency = '€';
        else if (/₹/.test(pageText)) priceInfo.currency = '₹';
        else if (/pkr/i.test(pageText)) priceInfo.currency = 'PKR';

        return priceInfo;
    }

    // ================================
    // WARNING OVERLAY UI
    // ================================

    function createWarningOverlay(findings, priceInfo) {
        // Remove existing overlay
        removeWarningOverlay();

        if (findings.length === 0) return;

        const overlay = document.createElement('div');
        overlay.id = 'vibe-tracker-dark-pattern-warning';
        overlay.innerHTML = `
            <style>
                #vibe-tracker-dark-pattern-warning {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 2147483647;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    max-width: 380px;
                    animation: vtSlideIn 0.3s ease-out;
                }
                
                @keyframes vtSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .vt-warning-card {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 3px solid #e94560;
                    border-radius: 20px;
                    padding: 20px;
                    color: #fff;
                    box-shadow: 0 10px 40px rgba(233, 69, 96, 0.3),
                                0 0 0 1px rgba(255,255,255,0.1);
                }
                
                .vt-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                
                .vt-shield {
                    font-size: 32px;
                    filter: drop-shadow(0 0 8px rgba(233, 69, 96, 0.5));
                }
                
                .vt-title {
                    font-size: 16px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: #e94560;
                }
                
                .vt-subtitle {
                    font-size: 11px;
                    color: #8892b0;
                    margin-top: 2px;
                }
                
                .vt-patterns {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 16px;
                }
                
                .vt-pattern {
                    background: rgba(233, 69, 96, 0.15);
                    border: 1px solid rgba(233, 69, 96, 0.3);
                    border-radius: 12px;
                    padding: 12px;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                }
                
                .vt-pattern.severity-CRITICAL {
                    background: rgba(255, 0, 0, 0.2);
                    border-color: rgba(255, 0, 0, 0.5);
                }
                
                .vt-pattern.severity-HIGH {
                    background: rgba(255, 165, 0, 0.15);
                    border-color: rgba(255, 165, 0, 0.4);
                }
                
                .vt-pattern-icon {
                    font-size: 20px;
                }
                
                .vt-pattern-content {
                    flex: 1;
                }
                
                .vt-pattern-name {
                    font-weight: 700;
                    font-size: 13px;
                    margin-bottom: 4px;
                }
                
                .vt-pattern-desc {
                    font-size: 11px;
                    color: #a8b2d1;
                    line-height: 1.4;
                }
                
                .vt-cost-box {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 12px;
                    padding: 14px;
                    margin-bottom: 16px;
                }
                
                .vt-cost-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #10B981;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .vt-cost-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                
                .vt-cost-item {
                    font-size: 11px;
                    color: #a8b2d1;
                }
                
                .vt-cost-item strong {
                    color: #fff;
                    font-size: 14px;
                    display: block;
                }
                
                .vt-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .vt-btn {
                    flex: 1;
                    padding: 10px 12px;
                    border-radius: 10px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    border: 2px solid;
                    transition: all 0.2s;
                    text-align: center;
                }
                
                .vt-btn-remind {
                    background: #10B981;
                    border-color: #10B981;
                    color: #fff;
                }
                
                .vt-btn-remind:hover {
                    background: #059669;
                    transform: translateY(-2px);
                }
                
                .vt-btn-dismiss {
                    background: transparent;
                    border-color: rgba(255,255,255,0.2);
                    color: #8892b0;
                }
                
                .vt-btn-dismiss:hover {
                    border-color: #e94560;
                    color: #e94560;
                }
                
                .vt-close {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: #8892b0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                
                .vt-close:hover {
                    background: #e94560;
                    color: #fff;
                }
                
                .vt-saved-toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #10B981;
                    color: #fff;
                    padding: 16px 24px;
                    border-radius: 12px;
                    font-weight: 700;
                    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
                    z-index: 2147483647;
                    animation: vtSlideIn 0.3s ease-out;
                }
            </style>
            
            <div class="vt-warning-card">
                <button class="vt-close" onclick="document.getElementById('vibe-tracker-dark-pattern-warning').remove()">✕</button>
                
                <div class="vt-header">
                    <span class="vt-shield">🛡️</span>
                    <div>
                        <div class="vt-title">Dark Pattern Detected!</div>
                        <div class="vt-subtitle">Vibe Tracker Protection</div>
                    </div>
                </div>
                
                <div class="vt-patterns">
                    ${findings.slice(0, 3).map(f => `
                        <div class="vt-pattern severity-${f.severity}">
                            <span class="vt-pattern-icon">${f.icon}</span>
                            <div class="vt-pattern-content">
                                <div class="vt-pattern-name">${f.name}</div>
                                <div class="vt-pattern-desc">${f.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${priceInfo.monthlyPrice ? `
                    <div class="vt-cost-box">
                        <div class="vt-cost-title">💰 True Cost Analysis</div>
                        <div class="vt-cost-grid">
                            ${priceInfo.trialDays ? `
                                <div class="vt-cost-item">
                                    Trial Period
                                    <strong>${priceInfo.trialDays} days FREE</strong>
                                </div>
                            ` : ''}
                            <div class="vt-cost-item">
                                Then
                                <strong>${priceInfo.currency} ${priceInfo.monthlyPrice}/month</strong>
                            </div>
                            <div class="vt-cost-item">
                                Per Year
                                <strong>${priceInfo.currency} ${Math.round(priceInfo.monthlyPrice * 12)}</strong>
                            </div>
                            <div class="vt-cost-item">
                                In 5 Years
                                <strong>${priceInfo.currency} ${Math.round(priceInfo.monthlyPrice * 60)}</strong>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="vt-actions">
                    <button class="vt-btn vt-btn-remind" id="vt-set-reminder">
                        📅 Set Cancel Reminder
                    </button>
                    <button class="vt-btn vt-btn-dismiss" id="vt-dismiss-warning">
                        Dismiss
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('vt-dismiss-warning')?.addEventListener('click', () => {
            removeWarningOverlay();
        });

        document.getElementById('vt-set-reminder')?.addEventListener('click', () => {
            setTrialReminder(priceInfo);
        });
    }

    function removeWarningOverlay() {
        const existing = document.getElementById('vibe-tracker-dark-pattern-warning');
        if (existing) existing.remove();
    }

    function showReminderSetToast(days) {
        const toast = document.createElement('div');
        toast.className = 'vt-saved-toast';
        toast.innerHTML = `
            <style>
                .vt-saved-toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #10B981, #059669);
                    color: #fff;
                    padding: 16px 24px;
                    border-radius: 16px;
                    font-family: 'Segoe UI', system-ui, sans-serif;
                    font-weight: 700;
                    font-size: 14px;
                    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
                    z-index: 2147483647;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    animation: vtSlideIn 0.3s ease-out;
                }
                @keyframes vtSlideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
            ✅ Reminder set! We'll alert you ${days} days before trial ends.
        `;

        document.body.appendChild(toast);
        removeWarningOverlay();

        setTimeout(() => toast.remove(), 4000);
    }

    // ================================
    // REMINDER SYSTEM
    // ================================

    async function setTrialReminder(priceInfo) {
        const reminder = {
            id: 'trial_' + Date.now(),
            service: document.title.split(/[|\-–]/)[0].trim() || window.location.hostname,
            url: window.location.href,
            hostname: window.location.hostname,
            trialDays: priceInfo.trialDays || 7,
            monthlyPrice: priceInfo.monthlyPrice,
            currency: priceInfo.currency,
            createdAt: new Date().toISOString(),
            reminderDate: calculateReminderDate(priceInfo.trialDays || 7),
            status: 'active'
        };

        // Send to background script
        try {
            chrome.runtime.sendMessage({
                type: 'SET_TRIAL_REMINDER',
                data: reminder
            }, response => {
                console.log('Reminder set:', response);
            });

            showReminderSetToast(Math.max(1, (priceInfo.trialDays || 7) - 2));

            // Track the save
            trackDarkPatternBlocked(priceInfo);
        } catch (error) {
            console.error('Error setting reminder:', error);
        }
    }

    function calculateReminderDate(trialDays) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + Math.max(1, trialDays - 2));
        return reminderDate.toISOString();
    }

    // ================================
    // ANALYTICS
    // ================================

    function trackDarkPatternBlocked(priceInfo) {
        const statsKey = 'vt_dark_pattern_stats';

        chrome.storage.local.get([statsKey], (result) => {
            const stats = result[statsKey] || {
                totalBlocked: 0,
                totalSaved: 0,
                patterns: [],
                lastUpdated: null
            };

            stats.totalBlocked++;
            if (priceInfo.monthlyPrice) {
                stats.totalSaved += priceInfo.monthlyPrice * 12; // Yearly saving
            }
            stats.patterns.push({
                url: window.location.hostname,
                date: new Date().toISOString(),
                price: priceInfo.monthlyPrice
            });
            stats.lastUpdated = new Date().toISOString();

            chrome.storage.local.set({ [statsKey]: stats });
        });
    }

    // ================================
    // MAIN DETECTION
    // ================================

    function runDarkPatternDetection() {
        // Don't run on the Vibe Tracker website itself
        // Don't run on the Vibe Tracker website itself (production, preview, or local)
        const hostname = window.location.hostname;
        if (hostname.includes('vibe-tracker') ||
            hostname.includes('vibetracker') ||
            hostname.includes('localhost') ||
            hostname.includes('127.0.0.1')) {
            return;
        }

        console.log('🛡️ Scanning for dark patterns...');

        const allFindings = [
            ...detectPreSelectedCheckboxes(),
            ...detectHiddenCharges(),
            ...detectConfirmShaming(),
            ...detectForcedContinuity()
        ];

        if (allFindings.length > 0) {
            console.log('🚨 Dark patterns found:', allFindings.length);

            const priceInfo = extractPriceInfo();

            // Notify background script
            chrome.runtime.sendMessage({
                type: 'DARK_PATTERN_DETECTED',
                data: {
                    patterns: allFindings.map(f => ({
                        id: f.id,
                        name: f.name,
                        severity: f.severity
                    })),
                    url: window.location.href,
                    hostname: window.location.hostname,
                    priceInfo: priceInfo
                }
            });

            // Show warning overlay
            createWarningOverlay(allFindings, priceInfo);
        }
    }

    // ================================
    // INITIALIZATION
    // ================================

    function init() {
        // Initial scan after page load
        setTimeout(runDarkPatternDetection, 2000);

        // Re-scan on significant DOM changes
        let scanTimeout;
        const observer = new MutationObserver(() => {
            clearTimeout(scanTimeout);
            scanTimeout = setTimeout(runDarkPatternDetection, 1500);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });

        // Scan when user is about to click "submit" type buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, [type="submit"], .btn, [role="button"]');
            if (target) {
                const text = target.innerText?.toLowerCase() || '';
                const triggerWords = ['start', 'subscribe', 'trial', 'continue', 'checkout', 'pay', 'buy', 'confirm'];

                if (triggerWords.some(w => text.includes(w))) {
                    runDarkPatternDetection();
                }
            }
        }, true);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
