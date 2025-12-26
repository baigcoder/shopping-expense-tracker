# Cashly - Browser Extension v5.0

A Chrome extension that automatically tracks your online shopping expenses using smart behavior-based detection.

## Features

- 🛍️ **Smart Detection**: Analyzes sites for payment capabilities before monitoring
- 🎯 **Behavior Tracking**: State machine tracks checkout → payment → confirmation flow
- 📊 **Quick Stats**: View spending right from the popup
- 🔔 **Notifications**: Get notified when a purchase is tracked
- 💾 **Offline Support**: Works offline and syncs when online
- 🔗 **Dashboard Integration**: One-click access to the full dashboard
- 🔒 **Security**: CSP, rate limiting, secure credential storage

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `backend/extension` folder

## File Structure

```
backend/extension/
├── manifest.json      # Extension configuration (with CSP)
├── background.js      # Service worker (rate limiting, sync)
├── content.js         # Smart site analyzer + transaction tracker
├── content-website.js # Dashboard communication script
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── popup.css          # Popup styles
├── config.js          # Centralized configuration
├── constants.js       # Shared constants (NEW)
├── utils.js           # Helper utilities (NEW)
├── content.css        # On-page notification styles
└── icons/             # Extension icons
```

## How It Works

### Smart Site Analysis (v5.0)
1. **SiteAnalyzer** scores each page (0-100+ points):
   - Credit card forms: +40 points
   - Payment iframes (Stripe, PayPal): +35 points
   - Checkout URLs: +30 points
   - Product pages: +25 points
   - E-commerce elements: +20 points
   - Payment buttons: +15 points
   
2. Sites with **15+ points** activate monitoring

### State Machine Flow
```
IDLE → MONITORING → CHECKOUT_ENTERED → PAYMENT_FORM_ACTIVE → PAYMENT_SUBMITTED → TRANSACTION_CONFIRMED
```

### Transaction Detection
1. **Content Script** runs on payment sites
2. **State Machine** tracks user behavior
3. On confirmation, extracts purchase details
4. Sends to **Background Worker** for sync
5. Data synced with dashboard in real-time

## Supported Sites

### Major E-commerce
- Amazon, eBay, Walmart, Best Buy, Target
- Etsy, AliExpress, Shopify stores
- Daraz, Foodpanda (Regional)

### SaaS & Subscriptions
- GitHub, Vercel, Adobe, Figma
- Netflix, Spotify, Disney+
- ChatGPT, Notion, Slack

### Payment Processors
- Stripe, PayPal, Gumroad
- BuyMeACoffee, Paddle

## Configuration

Edit `config.js` to update:
```javascript
const CONFIG = {
    SUPABASE_URL: 'your_supabase_url',
    SUPABASE_ANON_KEY: 'your_anon_key',
    WEBSITE_URL: 'http://localhost:5173'
};
```

## Security Features

- **Content Security Policy** in manifest.json
- **Rate Limiting** (60 req/min, 10 transactions/min)
- **Secure Storage** via chrome.storage.sync
- **Origin Validation** for external messages

## Notes

- Login via web app for syncing
- Purchases stored locally first, then synced
- Privacy-focused: data only sent to your own backend
