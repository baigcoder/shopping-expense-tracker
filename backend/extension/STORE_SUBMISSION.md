# 🦊 Firefox Add-ons Submission Guide (FREE)

## ✅ Your Extension is Ready!

**ZIP File Location:** `extension/vibetracker-firefox.zip` (17.9 KB)

---

## 📋 Step-by-Step Submission

### Step 1: Create Firefox Developer Account (FREE)

1. Go to: **https://addons.mozilla.org/developers/**
2. Click **"Submit Your First Add-on"** or **"Register"**
3. Create account with your email (or use existing Firefox account)
4. Verify your email

### Step 2: Submit Your Extension

1. Go to: **https://addons.mozilla.org/developers/addon/submit/agreement**
2. Read and accept the Developer Agreement
3. Click **"Submit a New Add-on"**
4. Choose **"On this site"** (for listed add-on)
5. Upload: `vibetracker-firefox.zip`
6. Wait for validation (should pass!)

### Step 3: Fill in Add-on Details

**Name:** 
```
Vibe Tracker - Expense Tracker
```

**Add-on URL (slug):**
```
vibetracker
```

**Summary (250 chars max):**
```
Auto-track your online purchases from Amazon, eBay, Walmart & more. Sync with web dashboard, get spending insights, and manage budgets. The Gen Z way to manage money!
```

**Description:**
```
🛒 Vibe Tracker - Your Personal Shopping Expense Tracker

Tired of losing track of your online spending? Vibe Tracker automatically detects and logs your purchases from 100+ online stores.

✨ KEY FEATURES:

📊 Auto-Track Purchases
Automatically detects when you buy on Amazon, eBay, Walmart, Best Buy, Target & more. No manual data entry required!

🔄 Real-Time Sync  
Syncs instantly with the Vibe Tracker web dashboard. One account = everything connected.

💰 Smart Budgeting
Set spending limits by category and get alerts before you overspend.

📈 Spending Insights
See where your money goes with AI-powered spending analysis.

📌 Clip Any Product
Manually clip products from any page. Works on any e-commerce site!

🔒 Privacy First
Your data is encrypted and secure. We never sell your information.

Get started FREE at vibetracker.app
```

**Category:** Shopping

**Tags:** expense tracker, shopping, budget, money, finance, purchases

### Step 4: Upload Screenshots

You need at least 1 screenshot (PNG or JPG, max 3MB each)

**Recommended screenshots:**
1. Extension popup showing dashboard
2. Auto-tracking notification on Amazon
3. Web dashboard with synced data

### Step 5: Privacy Policy

Add privacy policy statement:
```
Vibe Tracker collects purchase data (store name, product, price) only when you explicitly track purchases or enable auto-tracking. Data is synced to your personal account and never shared with third parties. You can delete your data anytime from the web dashboard.
```

### Step 6: License & Source Code

**Do you need to submit source code?**
- Select **No** (Since you are not using minifiers or webpack)

**License:**
- Select **All Rights Reserved** (Custom License)
- This protects your code from being copied or modified by others.

### Step 7: Submit for Review

1. Review all information
2. Click **"Submit Version"**
3. Wait 1-2 days for review

---

## 🎉 After Approval

Once approved, you'll get a URL like:
```
https://addons.mozilla.org/firefox/addon/vibetracker/
```

Update `LandingPage.tsx` with this URL:
```typescript
const EXTENSION_URLS = {
    chrome: 'https://chrome.google.com/webstore',
    firefox: 'https://addons.mozilla.org/firefox/addon/vibetracker/', // YOUR URL
    edge: 'https://microsoftedge.microsoft.com/addons',
    isPublished: true // Change to true!
};
```

---

# 🔵 Chrome Web Store Submission ($5 one-time)

## Your Extension is Ready!

**ZIP File Location:** `extension/vibetracker-chrome.zip` (17.9 KB)

---

## Step-by-Step Submission

### Step 1: Create Chrome Developer Account ($5)

1. Go to: **https://chrome.google.com/webstore/devconsole**
2. Sign in with Google account
3. Pay $5 one-time registration fee
4. Accept Developer Agreement

### Step 2: Create New Item

1. Click **"New Item"**
2. Upload: `vibetracker-chrome.zip`
3. Wait for validation

### Step 3: Fill in Store Listing

**Name:**
```
Vibe Tracker - Expense Tracker
```

**Description:** (Same as Firefox - see above)

**Category:** Shopping

**Language:** English

### Step 4: Upload Assets

**Store Icon:** 128x128 PNG (use `icons/icon128.png`)

**Screenshots:** Upload at least 1 (1280x800 or 640x400)

**Promotional Image (optional):** 440x280 PNG

### Step 5: Privacy Practices

- Select what data you collect
- Add privacy policy URL
- Confirm permissions usage

### Step 6: Submit for Review

1. Click **"Submit for Review"**
2. Wait 1-3 days for review

---

## 📅 Timeline

| Step | Time |
|------|------|
| Firefox submission | 10 min |
| Firefox review | 1-2 days |
| Chrome submission | 15 min |
| Chrome review | 1-3 days |

---

## 🚀 Quick Reference

| File | Purpose |
|------|---------|
| `vibetracker-firefox.zip` | Upload to Firefox Add-ons |
| `vibetracker-chrome.zip` | Upload to Chrome Web Store |
| `icons/icon128.png` | Store icon for Chrome |
| `icons/icon48.png` | Toolbar icon |

**Good luck! 🎉**
