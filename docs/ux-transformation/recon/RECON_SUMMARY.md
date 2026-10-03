# CASHLY RECON — EXECUTIVE FORENSIC RECONSTRUCTION SUMMARY

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Audit:** October 2026  
**Status:** Forensic Phase Complete — Zero Unplanned Code Changes  

---

## 1. Executive Summary

Cashly is positioned as an **AI-powered personal finance operating system** with a distinctive, review-first value proposition: automatically capturing financial activity from browser checkouts and bank feeds, staging charges in a quiet inbox for human review, and feeding an approved financial ledger into predictive budgets, analytics, and AI.

Our forensic investigation of the codebase reveals that **the foundational engineering is robust and functional**:
- The browser extension (MV3) reliably intercepts checkouts from 25+ e-commerce platforms.
- The Express backend and Supabase Postgres database maintain complete data models for candidate triage, rules, statements, and recurring obligations.
- Real-time synchronization across the extension, API, and frontend functions seamlessly via WebSockets.
- Client-side algorithmic services (Money Twin, What-If simulator, burn rate calculators) are fully implemented.

However, the product’s **UX/UI architecture has suffered severe fragmentation**:
- The interface is caught in a visual collision between an obsolete **Stark Neobrutalist design** and an incomplete **"Calm Finance" overlay** held together by brute-force `!important` CSS rules.
- Recurring spending is unnaturally fractured across **four separate pages** (`/subscriptions`, `/bills`, `/reminders`, `/recurring`).
- Desktop users are subjected to a **punitive full-screen blocker (`ExtensionWall`)** that forbids app usage unless the browser extension is installed.
- High-value capabilities (e.g., the review inbox, statement OCR, and AI assistant) are either hidden in sub-drawers, buried in giant modal stacks, or isolated in floating widgets.

---

## 2. Core Diagnostic Findings

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CASHLY FORENSIC DIAGNOSTIC                        │
└────────────────────────────────────────────────────────────────────────┘

  CORE STRENGTHS (ENGINEERING GEMS)
  ├── 1. Browser Extension DOM Scraper (25+ platforms captured reliably)
  ├── 2. Candidate Ingestion Pipeline (Staged review before ledger commitment)
  ├── 3. Supabase Real-Time Event Bus (Instant multi-device synchronization)
  ├── 4. Rich Mathematical Heuristics (Money Twin daily burn rate & headroom)
  └── 5. Document & Statement Ingestion (CSV mapping, PDF OCR via Python)

  CORE LIABILITIES (PRODUCT & UX BOTTLENECKS)
  ├── 1. Desktop Extension Gate (Blocks all desktop users who lack the extension)
  ├── 2. Fragmented Mental Model (Subscriptions vs Bills vs Reminders vs Recurring)
  ├── 3. The CSS Override Patch (index.css !important layer fighting brutalist JSX)
  ├── 4. Modal Overload on /transactions (6 massive stacked dialogs)
  ├── 5. Disconnected AI (Floating chatbot cannot execute structured UI actions)
  └── 6. Orphan & Ghost Routes (/expenses duplicate, /recurring dummy, /ai-test)
```

---

## 3. High-Value Assets to Preserve

Under the Master Directive's Golden Rule (**"Do not rewrite working business logic merely for visual styling"**), the following systems must be preserved and elevated in the target architecture:

1. **Browser Extension Interception Logic (`content.js`, `background.js`):**
   - The DOM scraping selectors, checkout heuristics, offline sync queue, and token bridges work well and represent Cashly's primary moat.
2. **Transaction Candidate & Merchant Rule Engine (`featureExpansionService.ts`):**
   - The database schema (`public.transaction_candidates`, `public.merchant_rules`) and REST endpoints (`/api/transaction-inbox/*`) are architecturally sound.
3. **Money Twin Math Engine (`moneyTwinService.ts`, `whatIfService.ts`):**
   - The formulas for daily velocity, headroom, runway, and scenario modeling are functional and valuable.
4. **Supabase Real-Time Sync Pipeline (`useRealtimeSync.ts`):**
   - The WebSocket channel subscriptions and local event bus (`cashly-data-updated`) ensure multi-device responsiveness.
5. **Bank Statement Import & OCR Microservice (`/ai-server/main.py`):**
   - The FastAPI PDF text extraction and Microsoft neural Edge-TTS audio stream capabilities provide strong backend utility.

---

## 4. Architectural Liabilities to Dismantle & Redesign

1. **Dismantle the Hard Desktop Gate:**
   - Remove `ExtensionWall.tsx` from blocking desktop dashboard access.
   - Replace it with a persistent, non-blocking **Extension Companion Status Indicator** in the header and settings that celebrates connection benefits without holding the product hostage.
2. **Unify Recurring Commitments:**
   - Merge `/subscriptions`, `/bills`, `/reminders`, and `/recurring` into a single, cohesive **"Commitments & Recurring"** domain inside the Plan module.
3. **Eliminate the `!important` CSS Hack:**
   - Replace the brute-force CSS override layer in `index.css` with a unified Design System Token architecture that styles primitives directly.
4. **De-Modalize the Ledger:**
   - Replace the stacked modal dialogs on `/transactions` (CSV, PDF, Export) with dedicated, full-context sub-views or side-panels.
5. **Embed AI Throughout the System:**
   - Evolve AI from an isolated floating chatbot into contextual, structured action cards embedded directly into the Dashboard, Ledger, and Plan views.
6. **Retire Ghost Routes:**
   - Consolidate `/expenses` into the canonical ledger, remove `/recurring`, and restrict `/ai-test` to development environments.

---

## 5. Transition to Transformation

With the forensic reconnaissance complete across the repository, routes, features, components, user flows, design system tokens, technical constraints, and visual evidence, the foundation is set to define the **Target Transformation Scope**.
