# CASHLY — SEO & METADATA ARCHITECTURE

**Document:** `11_SEO.md`  
**Classification:** Search Optimization, Social Graph, and Metadata Specification  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Title & Meta Descriptions

| Route | Page Title | Meta Description |
|:---|:---|:---|
| `/` | `Cashly — AI-Powered Personal Finance Operating System` | `See what your money is doing before it becomes a problem. Capture checkouts, review unposted charges, track budgets, and forecast cash with Money Twin.` |
| `/login` | `Sign In — Cashly` | `Sign in to Cashly to review your transaction inbox, manage commitments, and inspect your financial forecast.` |
| `/signup` | `Create Account — Cashly` | `Get started with Cashly. Review-first personal finance with browser capture, budgets, and predictive AI.` |
| `/forgot-password` | `Reset Password — Cashly` | `Recover your Cashly account securely.` |
| `/verify-email` | `Verify Email — Cashly` | `Enter your 6-digit confirmation code to verify your Cashly account.` |

---

## 2. OpenGraph & Social Cards

- `og:site_name`: `Cashly`
- `og:type`: `website`
- `og:title`: `Cashly — AI-Powered Personal Finance Operating System`
- `og:description`: `Capture checkouts, review what becomes real, track budgets, and forecast cash.`
- `twitter:card`: `summary_large_image`
- `twitter:title`: `Cashly — Financial Operating System`

---

## 3. Structured Data (JSON-LD)

Implemented in `index.html` or dynamic page heads:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Cashly",
  "operatingSystem": "Web, Chrome Browser Extension",
  "applicationCategory": "FinanceApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "AI-powered personal finance operating system that captures purchases, lets you review before posting, and forecasts monthly cashflow."
}
```
