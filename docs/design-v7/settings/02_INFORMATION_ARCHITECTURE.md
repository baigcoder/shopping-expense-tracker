# CASHLY SETTINGS V7 — INFORMATION ARCHITECTURE

**Document:** `/docs/design-v7/settings/02_INFORMATION_ARCHITECTURE.md`  
**Classification:** Information Architecture & Domain Organization  
**Target:** Cashly Settings Surface (`/settings`)  
**Date:** October 3, 2026  

---

## 1. Architectural Philosophy

A world-class fintech settings architecture cannot treat all user controls as flat, interchangeable checkboxes. Financial software requires clear demarcations between:
- **Identity & Tenancy:** Who owns this financial ledger.
- **Financial Baseline:** How numbers, currencies, and formats are calculated and displayed.
- **System Intelligence:** How automated models, background workers, and AI co-pilots interact with sensitive ledger data.
- **Access & Security:** Authentication credentials, active device sessions, and encryption posture.
- **Data Lifecycle:** Data portability (exports) versus permanent destruction (purges).

---

## 2. Category Taxonomy & Content Mapping

```
SETTINGS WORKSPACE
├── 1. Account & Identity (/settings?tab=account)
│   ├── User Avatar & Initials Badge
│   ├── Display Name (Editable, validated)
│   ├── Email Address (Verified, read-only)
│   ├── User Identifier (Monospace truncated ID with copy action)
│   └── Account Creation & Tenancy Metadata
│
├── 2. Interface & Preferences (/settings?tab=preferences)
│   ├── Base Financial Currency (High-priority financial selector with live symbol & tabular preview)
│   ├── Visual Theme (Light / Dark mode toggle)
│   ├── Audio Feedback (Sound effects toggle + volume slider + preview sound test)
│   ├── Motion Comfort (Reduced motion toggle)
│   └── Automated Digests & Notifications:
│       ├── Email Notifications
│       ├── Push Notifications
│       ├── Weekly Financial Digest
│       └── Monthly Ledger Report
│
├── 3. AI Co-Pilot & Automation (/settings?tab=ai)
│   ├── Engine Telemetry (Active LLM Provider: Groq / OpenRouter, Model Name, Cache Status)
│   ├── Real-time Connection Diagnostics ("Test AI Engine" with millisecond response badge)
│   ├── Context Grounding Toggle (Query approved transaction ledger)
│   ├── Context Auto-Refresh Toggle (Synchronize memory on ledger updates)
│   ├── Staged Candidate Inclusion Toggle (Factor inbox checkouts into predictions)
│   └── Memory Management ("Clear Chat History" cache purge)
│
├── 4. Security & Access (/settings?tab=security)
│   ├── Password Management ("Send Password Reset Link" with toast feedback)
│   ├── Active Device Session Inspection (Client IP, Browser User Agent, Last Checked Timestamp)
│   └── Infrastructure Security Badges (Postgres RLS, Enterprise 256-bit TLS)
│
├── 5. Data & Portability (/settings?tab=data)
│   ├── Ledger Data Export Shortcuts (CSV, Excel XLSX, PDF Statement links)
│   └── Cloud Database Sync Telemetry (Supabase Postgres connection status)
│
└── 6. Danger Zone (/settings?tab=danger)
    ├── Irreversible Purge Warning Surface
    ├── Selective Target Selector (Transactions, Budgets, Subscriptions, Goals)
    └── Accessible Two-Step Modal Confirmation (Explicit keyword typed + Email OTP verification)
```

---

## 3. Navigation Schema

- **Desktop (>= 1024px):**
  - Left column: 240px fixed-width sticky navigation rail.
  - Active indicator: Minimal brand indicator with tinted background (`bg-[var(--color-surface)]`), bold primary text, and subtle icon highlight.
  - Quick action at rail bottom: Quiet, neutral `Sign Out` button with subtle icon.
- **Tablet (768px – 1023px):**
  - Compact horizontal segmented tab bar at top of settings workspace.
  - Icons + short labels (`Account`, `Preferences`, `AI`, `Security`, `Data`, `Danger`).
- **Mobile (< 768px):**
  - Horizontal touch-scrollable pill navigation with haptic sound triggers and 44px minimum touch targets.
  - Smooth animated indicator transition.
