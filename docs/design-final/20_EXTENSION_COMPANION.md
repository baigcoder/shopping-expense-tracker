# 20 — EXTENSION COMPANION & TELEMETRY
**Canonical Path:** `/docs/design-final/20_EXTENSION_COMPANION.md`  
**Status:** CANONICAL MASTER — 100% UNIFIED WITH V10 DESIGN SYSTEM  
**Routes / Entry Points:** 
- In-Page Checkout Intercept HUD: `content.js` + `content.css`
- Extension Browser Action Popup: `popup.html` + `popup.css` + `popup.js`
- Web Companion Hub: `/extension-health`, `ExtensionShowcase.tsx`

---

## 1. Extension Visual DNA Unification

The Cashly Browser Extension has been completely redesigned to inherit the exact aesthetic, typographic hierarchy, and interaction design of the V10 Editorial Cinematic Fintech design system:

| Design Dimension | Web Application Benchmark | Extension Implementation |
| :--- | :--- | :--- |
| **Display Typography** | `Syne` (Bold / ExtraBold 700/800) | Google Fonts `Syne` loaded with system font fallbacks |
| **Body Typography** | `Inter` (Regular, Medium, Semibold) | `Inter` with 13px base scale tailored for 380px popup width |
| **Telemetry Typography** | `JetBrains Mono` (Medium, Bold) | Tabular lining figures for balances, prices, and status counters |
| **Primary Brand Token** | Cadmium Orange (`#EE5024`) | Hero monthly spent card, primary CTA buttons, active state chips |
| **Background / Canvas** | Warm Studio Ivory (`#FAF8F5`) | Popup shell canvas and high-contrast card backgrounds |
| **Contrast Shell** | Deep Ink (`#111111`) | Telemetry labels, dark toggle containers, status badges |
| **Accent Signals** | Emerald (`#10B981`) & Amber (`#D97706`) | Live status pulse dots, warning badges, pending transaction chips |

---

## 2. Popup Architecture (380px × 590px Compact Viewport)

### A. Login & Session Pairing View (`#loginView`)
- **Brand Hero:** Cadmium Orange companion dot badge (`● SOVEREIGN COMPANION`).
- **Monumental Display:** `"INTERCEPT BEFORE CAPITAL DEPARTS."` in high-impact Syne font.
- **Pairing Matrix:** One-click pairing with existing web session, plus fallback email/password authentication inputs styled with crisp hairline borders (`--c-border: #E7E5E4`).
- **Direct Web Handoff:** Dedicated link to open the full web dashboard in a new tab.

### B. Operating Companion View (`#mainView`)
1. **Hero Ledger Burn Card:** Cadmium Orange container displaying the user's current month spend (`#monthlySpent`), burn rate warning indicator, and quick refresh trigger.
2. **Architectural Telemetry Rail:** 3-column micro-counter (`#pendingCount`, `#queuedCount`, `#failedCount`) replacing traditional card clutter with clean, tabular information architecture.
3. **Observation Matrix:** Domain monitoring card showing active e-commerce merchant (`#siteName`), tracking status, and last detected purchase event (`#lastDetection`).
4. **Flagship Action Pill:** High-prominence review triage CTA directing the user straight to `/transaction-inbox` for pending purchase classification.
5. **Quick Action Grid:** 3 micro-action buttons for manual spend logging, deep synchronization, and quick settings toggling.
6. **Floating Capsule Dock:** Segmented floating pill bar toggling between Live Terminal, Add Expense, and System Governance views.
7. **Settled Ledger Stream:** Scrollable card feed of recent purchases with category icons, timestamps, and formatted monetary values.

### C. System Governance View (`#settingsView`)
- **iOS-Style Toggle Switches:** Custom smooth-sliding toggle switches with Cadmium Orange active states.
- **Monitoring Preferences:** Checkout interception toggle, receipt auto-tagging, and high-velocity alerts.
- **Diagnostics Panel:** Live API latency metric, build signature (`v9.1.2`), and storage reset utility.

---

## 3. In-Page Checkout Interception HUD (`content.css` & `content.js`)

When a user visits a supported merchant checkout confirmation page (e.g. Amazon, Shopify, Apple):
1. **Floating Glassmorphic Toast:** Fixed position bottom-right HUD featuring 18px blur backdrop (`backdrop-filter: blur(18px)`), subtle hairline border, and deep ink typography.
2. **Pulsing Intercept Badge:** Cadmium Orange icon badge with live pulsating dot confirming real-time telemetry capture.
3. **Headroom Telemetry:** Monospaced price display alongside calculated forward runway impact (e.g., `-3.2 Days Runway`).
4. **Instant Action Pair:** Direct `[ Post to Ledger ]` and `[ Review in Inbox ]` actions providing frictionless capital governance without leaving the store.

---

## 4. Multi-Target Distribution Sync

All compiled styles and templates are synchronized across all extension bundles:
- Master Development Source: `backend/extension/`
- Production Multi-Browser Dist: `backend/extension/dist/{chrome,firefox,edge}`
- Static Web Showcase Assets: `frontend/public/extension/`
- Zip Release Packages: `backend/extension/dist/*.zip`

