# CASHLY — RECOMMENDED UX / UI TRANSFORMATION SCOPE

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Recommendation:** October 2026  
**Status:** Architecture Blueprint — Zero Code Changes Executed  

---

## 1. Product Vision & UX North Star

### 1.1 The Fundamental Shift
Cashly will be transformed from an assortment of 20 disconnected feature pages into a **unified Financial Operating System**.

The user must never have to wonder:
> *"Which Cashly feature do I need to open?"*

Instead, the interface must directly answer the user's natural financial questions:
- **What is happening right now?** *(Today / Attention Items)*
- **What needs my decision?** *(Review Inbox / Unposted Charges)*
- **What is already committed?** *(Upcoming Bills & Subscriptions)*
- **How am I tracking against my plan?** *(Budgets & Goals)*
- **Where am I heading?** *(Money Twin Forecast & Headroom)*

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE FINANCIAL OPERATING SYSTEM MODEL                 │
└────────────────────────────────────────────────────────────────────────┘

    [ CAPTURE ] ──► [ REVIEW ] ──► [ TRACK ] ──► [ PLAN ] ──► [ PREDICT ]
     Browser DOM      Quiet Inbox     Approved     Budgets &    Money Twin
     & Statement      Human Triage     Ledger      Fixed Bills   Forecasts
         ▲                                                           │
         └───────────────── [ ACT / ASSIST ] ◄───────────────────────┘
                                Contextual AI
```

---

## 2. Target Information Architecture (IA)

The proposed architecture replaces the fragmented 5-group sidebar and 10-item mobile drawer with a **5-Pillar Core Architecture**:

```
CASHLY FINANCIAL OPERATING SYSTEM
│
├── 1. HOME (Command Center)
│   ├── Financial Snapshot (Total Available, Monthly Spend, Remaining Plan)
│   ├── Attention & Action Center (Inbox triage badge, bills due tomorrow, budget risk alerts)
│   ├── Spending Pulse (14-day income vs expense curve)
│   ├── Committed Upcoming Cash (Next 7 days of fixed charges)
│   ├── Goal Milestones (Visual progress toward targets)
│   └── Contextual AI Recommendations
│
├── 2. ACTIVITY (The Money Stream)
│   ├── Needs Review (Inbox — Unposted captures from extension & statements)
│   ├── All Transactions (The canonical ledger with full filters & search)
│   ├── Statement Imports (PDF OCR, CSV mapping, staging sessions)
│   └── Recurring Activity (Detected recurring charge history)
│
├── 3. PLAN (Future Commitments & Limits)
│   ├── Budgets (Active category caps, pace indicators, projected overruns)
│   ├── Commitments (Unified Subscriptions, Bills, and Trial Alerts)
│   ├── Goals (Savings milestones, contribution schedules, funding history)
│   └── Cashflow Timeline (Calendar heatmap of commitments and income)
│
├── 4. ANALYZE (Financial Intelligence)
│   ├── Spending Analytics (Multi-dimensional trends: Categories, Merchants, Channels)
│   ├── Money Twin (Financial forecast, daily burn rate, runway headroom)
│   ├── What-If Simulator (Scenario modeling for subscriptions, raises, large purchases)
│   └── Reports & Exports (Tax, category, and monthly summary exports)
│
├── 5. ASSIST (Embedded Co-Pilot)
│   ├── Contextual Assistant (AI grounded in live financial context with structured CTAs)
│   ├── Weekly Coach Plan (3 actionable weekly savings tasks)
│   └── Voice Center (Hands-free natural language transactions and queries)
│
└── UTILITIES (System Management)
    ├── Accounts & Cards (Bank sync via Plaid, digital cards, spending caps)
    ├── Extension Companion (Live connection health, capture telemetry, settings)
    └── Settings & Profile (Preferences, currency, security, danger zone)
```

---

## 3. Route Consolidation & Migration Strategy

Below is the definitive route migration mapping:

| Current Route | Current State | Target Route | Target Role & Form Factor | Rationale |
|:---|:---|:---|:---|:---|
| `/dashboard` | Overloaded (12 widgets) | `/dashboard` (or `/home`) | **Pillar 1: Home** | Rebuilt around progressive disclosure and attention items |
| `/transaction-inbox` | Isolated view | `/activity/inbox` | **Pillar 2: Activity (Tab 1)** | Elevates the review queue to the primary Activity default |
| `/transactions` | Modal-heavy table | `/activity/ledger` | **Pillar 2: Activity (Tab 2)** | Canonical ledger with inline filters and side-sheet details |
| `/expenses` | Orphan duplicate | **MERGE & RETIRE** | Integrated into `/activity/ledger` | Eliminates redundant 582-line polling duplicate |
| `/budgets` | Standalone page | `/plan/budgets` | **Pillar 3: Plan (Tab 1)** | Connected to projected end-of-month spending pace |
| `/subscriptions` | Standalone brutalist | `/plan/commitments` | **Pillar 3: Plan (Tab 2)** | Unified with bills and trial tracking |
| `/bills` | Standalone page | `/plan/commitments` | **Pillar 3: Plan (Tab 2)** | Merged into unified Commitments |
| `/reminders` | Duplicate brutalist | **MERGE & RETIRE** | Integrated into `/plan/commitments` | Eliminates confusing "Liability Audit" duplicate |
| `/recurring` | Dead dummy view | **DELETE** | Replaced by unified Commitments | Removes 40 lines of static placeholder code |
| `/goals` | Standalone page | `/plan/goals` | **Pillar 3: Plan (Tab 3)** | Integrated with budget funding contributions |
| `/cashflow-calendar` | Standalone brutalist | `/plan/calendar` | **Pillar 3: Plan (Tab 4)** | Timeline view of commitments and projected cash |
| `/analytics` | Static charts | `/analyze/trends` | **Pillar 4: Analyze (Tab 1)** | Question-oriented analytics with drill-downs |
| `/money-twin` | Standalone brutalist | `/analyze/forecast` | **Pillar 4: Analyze (Tab 2)** | Forward-looking twin and What-If simulator |
| `/reports` | Standalone brutalist | `/analyze/reports` | **Pillar 4: Analyze (Tab 3)** | Clean report generation and history |
| `/shopping-activity` | Standalone brutalist | `/manage/extension/telemetry` | **Manage: Extension Companion** | Moved to extension settings utility |
| `/insights` | Static text cards | `/assist` | **Pillar 5: Assist** | Rebuilt as unified Co-Pilot (Chat + Coach Plan) |
| `/ai-test` | Dev test harness | **RETIRE FROM PROD** | Relocated to internal dev tools | Removes leaked engineering playground from production |
| `/cards` | Standalone vault | `/manage/instruments` | **Manage: Accounts & Cards** | Rebalanced toward card limits, balances, and payment methods |
| `/accounts` | Standalone page | `/manage/instruments` | **Manage: Accounts & Cards** | Unified with digital cards |
| `/extension-health` | Standalone page | `/manage/extension` | **Manage: Extension Companion** | Diagnostic and status surface |
| `/settings` | Standalone brutalist | `/manage/settings` | **Manage: Settings** | System preferences and currency |
| `/profile` | Semi-hidden page | `/manage/profile` | **Manage: Profile** | Account identity and preferences |

---

## 4. Design System Architecture (Cashly Design System)

### 4.1 Aesthetic Direction
The new visual language retains Cashly’s trust and financial seriousness while delivering a state-of-the-art, human, and calm feel:
- **Tone:** Calm, premium, financial, intelligent, modern, human, precise, warm, confident.
- **Canvas:** Refined warm neutral (`#FAF8F5`).
- **Primary Accent:** Cashly Rose (`#E11D48` / hover `#BE123C`).
- **Secondary Semantics:** Emerald (`#059669` for income & goals), Amber (`#D97706` for impending bills), Slate Stone (`#57534E` for metadata).
- **Elevation:** Subtle hairlines (`#E7E5E4`), soft multi-layered shadows (`0 1px 2px rgba(28,25,23,0.06), 0 8px 24px rgba(28,25,23,0.06)`), zero harsh brutalist solid drop shadows.

### 4.2 Standard Radius Scale
- Small controls (inputs, badges, small buttons): **8px–10px**
- Standard cards & surfaces: **14px–16px**
- Large modals, panels, and side-sheets: **18px–20px**
- Dialogs: **20px**
- *Strictly prohibit arbitrary 0px corners or excessive pill-shaped bloat.*

### 4.3 Typography Rules
- **Display Headings:** Plus Jakarta Sans (`letter-spacing: -0.025em`)
- **Body & Controls:** Inter (`letter-spacing: -0.01em`)
- **Financial Numerics:** Tabular figures (`tabular-nums`) with clear currency symbol hierarchy.

---

## 5. Desktop & Mobile Interaction Model

### 5.1 Desktop Experience
- **Universal Command Palette (⌘K / Ctrl+K):**
  - Universal search and actions across merchants, categories, budgets, and AI questions.
- **Contextual Side-Sheet (No Modal Hell):**
  - Clicking a transaction slides open a 420px side-sheet on the right instead of a full modal dialog.
  - User retains full view of the ledger while editing or inspecting receipt attachments.
- **Non-Blocking Extension Companion:**
  - Removal of `ExtensionWall`.
  - Replaced by a calm status pill in the header indicating extension connectivity (`Synced`, `Capturing`, or `Install`).

### 5.2 Mobile Experience (First-Class Citizen)
- **Ergonomic Bottom Navigation:**
  - 5 primary pillars: `Home`, `Activity`, `Plan`, `Analyze`, `Assist`.
  - Zero 10-item overflow hamburger drawers.
- **Quick Action Trigger (FAB):**
  - Tap `+` to open contextual bottom sheet: *Add Expense*, *Add Income*, *Scan Receipt*, *Voice Command*.
- **Touch-Optimized Lists:**
  - 44px minimum tap targets, swipe-to-approve on review items, haptic feedback integration.

---

## 6. Phased Transformation Roadmap

Following Section 49 of the Master Directive, implementation will proceed systematically across **15 distinct phases**:

```
PHASE 0: Forensic Product Audit (COMPLETED IN CURRENT DELIVERABLE)
  └── Repository map, route map, feature matrix, component map, and UX problem audit documented.

PHASE 1: Design Tokens & CSS Cleanup
  └── Eradicate index.css !important overrides; establish unified theme tokens in CSS & Tailwind.

PHASE 2: Application Shell & Root Gate Overhaul
  └── Remove ExtensionWall; rebuild DashboardLayout with seamless responsive boundaries.

PHASE 3: Navigation & Information Architecture
  └── Implement the 5-pillar navigation (Desktop Sidebar + Mobile Bottom Bar + Command Palette).

PHASE 4: Home / Dashboard Rebuild
  └── Attention-first composition (KPIs, Urgent Attention Rail, Spending Pulse, Upcoming).

PHASE 5: Activity & Review Inbox
  └── Unified Activity module; side-sheet transaction details; fluid inbox triage.

PHASE 6: Plan & Commitments
  └── Merge Subscriptions, Bills, and Reminders into unified Commitments; dynamic budget pace.

PHASE 7: Analytics & Forecasting (Money Twin)
  └── Decision-oriented charts; clean forecasting gauges; integrated What-If simulator.

PHASE 8: Contextual AI Co-Pilot
  └── Transform AI from isolated chatbot into actionable embedded co-pilot with structured CTAs.

PHASE 9: Instruments (Accounts & Digital Cards)
  └── Consolidate Plaid bank accounts and digital cards into unified payment instruments view.

PHASE 10: Extension Integration UX
  └── Companion status pill, onboarding tutorial, and capture notification toasts.

PHASE 11: Mobile UX Polish & Gestures
  └── Contextual bottom sheets, swipe gestures, and safe-area responsive refinements.

PHASE 12: Marketing Site Storytelling
  └── Interactive product previews, live workflow demonstrations, and refined editorial typography.

PHASE 13: Accessibility (WCAG 2.2 AA)
  └── Keyboard navigation, visible focus rings, ARIA labels, contrast ratio verification.

PHASE 14: Performance & Bundle Optimization
  └── Lazy loading optimization, virtualization for ledger tables, layout shift elimination.

PHASE 15: End-to-End QA & Regression Validation
  └── Comprehensive validation of all 13 critical user journeys; zero backend regressions.
```

---

## 7. Definition of Done for Transformation

The transformation will be considered complete when:
1. **Zero Brute-Force Overrides:** `index.css` contains zero `!important` compatibility overrides.
2. **Unified Navigation:** All authenticated routes map directly to the 5 Core Pillars.
3. **No Dead Routes:** `/expenses`, `/recurring`, and `/ai-test` are cleanly retired or consolidated.
4. **Desktop Freedom:** Desktop web app loads instantly without demanding an unpacked extension.
5. **Actionable AI:** AI responses generate interactive, deep-linked UI actions rather than plain text.
6. **Mobile Ergonomics:** Mobile users can triage inbox items, inspect budgets, and search the ledger with one thumb.
7. **Business Logic Integrity:** 100% of working backend endpoints, Prisma models, and Supabase RLS rules remain intact.
