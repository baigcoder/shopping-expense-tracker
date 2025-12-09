# Shopping Expense Tracker - Browser Extension

A Chrome extension that automatically tracks your online shopping expenses.

## Features

- 🛍️ **Auto-Detection**: Automatically detects purchases on Amazon, eBay, Walmart, and more
- 📊 **Quick Stats**: View your monthly spending right from the popup
- 🔔 **Notifications**: Get notified when a purchase is tracked
- 💾 **Offline Support**: Works offline and syncs when online
- 🔗 **Dashboard Integration**: One-click access to the full dashboard

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project

### Files Structure

```
extension/
├── manifest.json      # Extension configuration
├── popup.html         # Popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic
├── background.js      # Service worker for tracking
├── content.js         # Page content script
├── content.css        # On-page notification styles
└── icons/             # Extension icons
```

## How It Works

1. **Content Script** runs on supported e-commerce sites
2. When you complete a purchase, it detects the order confirmation page
3. Extracts the purchase amount and product details
4. Sends data to the **Background Service Worker**
5. Data is saved locally and synced with your dashboard

## Supported Sites

- Amazon
- eBay
- Walmart
- Best Buy
- Target
- Etsy
- AliExpress
- Shopify stores

## Configuration

To add more sites, edit the `SITE_CONFIGS` object in `content.js`:

```javascript
'example.com': {
    orderConfirmSelector: '.order-success',
    totalSelector: '.total-price',
    productSelector: '.product-name',
    isOrderPage: () => window.location.href.includes('/thank-you')
}
```

## Notes

- You need to be logged into the web app for syncing to work
- Purchases are stored locally first, then synced
- The extension respects your privacy - data is only sent to your own backend
