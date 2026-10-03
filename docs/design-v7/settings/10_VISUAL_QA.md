# CASHLY SETTINGS V7 — SCREENSHOT QA & VISUAL VERIFICATION

**Document:** `/docs/design-v7/settings/10_VISUAL_QA.md`  
**Classification:** Visual QA, Cross-Viewport Audit & Rendering Verification  
**Target:** Cashly Settings Surface (`/settings`)  
**Auditor:** Principal Product Designer & Senior QA Architect  
**Date:** October 3, 2026  

---

## 1. Verified Viewport Matrix

All 7 required viewport dimensions were rendered using headless Chrome runtime and inspected:

| Viewport | Resolution | Category / Tab Tested | Visual Assessment | Status |
|---|---|---|---|---|
| **Mobile 1** | `390x844` (iPhone 14/15) | Preferences | Horizontal touch pill bar snaps smoothly. Base currency preview wraps with readable line-height. Desktop sidebar properly closed. | `PASSED` |
| **Mobile 2** | `430x932` (iPhone Pro Max)| Preferences | High-density rendering. Touch targets >= 44px. Bottom navigation completely clear of inputs. | `PASSED` |
| **Tablet Portrait**| `768x1024` (iPad) | Preferences | Segmented top bar with active pill indicator. Clean single-column form stacking with balanced margins. | `PASSED` |
| **Tablet Landscape**| `1024x768` (iPad Land) | Preferences | Two-zone layout activates. 240px left rail + responsive content canvas. Zero horizontal overflow. | `PASSED` |
| **Laptop** | `1280x800` (MacBook 13") | Preferences | Two-zone layout with sticky rail. Tabular numerals render crisp with `tabular-nums`. | `PASSED` |
| **Desktop** | `1440x900` (Standard) | All 6 Tabs (`account`, `preferences`, `ai`, `security`, `data`, `danger`) | Canonical two-zone control center. High information density without visual crowding. | `PASSED` |
| **HD / Ultrawide** | `1920x1080` (1080p Monitor)| Preferences | `max-w-6xl` container prevents awkward stretching. Balanced margins and strong visual rhythm. | `PASSED` |

---

## 2. Tab-by-Tab Visual QA (1440x900 Desktop)

### 2.1 Tab: Account & Identity (`v7_settings_account_1440x900.png`)
- **Identity Block:** Black avatar badge with bold monospace initials (`AM`), "Active Workspace" emerald badge, "alex.morgan@cashly.ai", and "Copy ID" button.
- **Form Controls:** Display Name input with focused hover states; Email input with green "Verified" badge.
- **Footer:** Monospace membership date and Brand Rose "Save Profile Changes" button.
- **Verdict:** Surpasses the legacy form stack; feels like an authoritative user account dashboard.

### 2.2 Tab: Interface & Currency (`v7_settings_preferences_1440x900.png`)
- **Financial Baseline:** High-contrast financial highlight card with currency dropdown (`USD ($) — US Dollar`) and live tabular preview: `$ 12,450.00`.
- **Sensory Controls:** Auditory Feedback with active switch and "Test Chime" preview button; Reduced Motion switch.
- **Scheduled Digests:** Weekly Financial Summary and Monthly Statement switches.
- **Verdict:** Elevates Base Currency to its rightful place as a central financial control.

### 2.3 Tab: AI Intelligence (`v7_settings_ai_1440x900.png`)
- **Telemetry Card:** Groq / OpenRouter provider badge, active model `llama-3.3-70b-versatile` in monospace, live "Operational" green status dot, and "Test AI Latency" button.
- **Context Boundaries:** Live Context Grounding, Automatic Context Refresh, Include Staged Review Candidates switches.
- **Cache Management:** "Clear Conversation Memory" action with "Clear Memory Cache" button.
- **Verdict:** Professional, technical, and completely free of gimmicky purple gradients.

### 2.4 Tab: Security & Sessions (`v7_settings_security_1440x900.png`)
- **Credential Recovery:** "Send Password Reset Link" with key icon.
- **Security Badges:** Postgres Row-Level Security (RLS) and TLS 1.3 / AES-256-GCM transport encryption badges.
- **Active Device Session:** Real-time IP address, verified browser environment, and last telemetry timestamp.
- **Verdict:** Establishes banking-grade confidence and operational transparency.

### 2.5 Tab: Danger Zone (`v7_settings_danger_1440x900.png`)
- **Warning Surface:** Subtle crimson-tinted card (`bg-red-50/60 border-red-200/80`) with alert triangle icon and clear irreversible warning copy.
- **Target Selection:** Category dropdown (Transactions, Budgets, Subscriptions, Goals) and "Initiate Purge Sequence" button in true Crimson Red.
- **Verdict:** Distinct, high-gravity destructive UX that cannot be triggered accidentally.
