# CASHLY — FINAL UX DIRECTIVE & ARCHITECTURAL CHARTER

**Product:** Cashly  
**Positioning:** AI-Powered Personal Finance Operating System  
**Document Classification:** Master Product & UX Directive (Highest Authority)  
**Status:** Canonical & Enforced  

---

## 1. Product Vision & UX North Star

Cashly is **not** a collection of 20 disconnected financial utility screens.  
Cashly is a **single, unified Financial Operating System**.

### 1.1 The Core Promise
Automatically capture financial activity from online checkouts and bank feeds, give the user complete control over what becomes real via an attention-first inbox, and then transform that approved ledger into actionable insights, cashflow predictability, and intelligent decisions.

### 1.2 The Seven Product Pillars
1. **Capture:** Low-friction, automated background detection (browser extension & bank statements).
2. **Review:** An attention-first staging ground holding unposted charges until confirmed.
3. **Track:** An authoritative, search-optimized financial ledger.
4. **Plan:** Forward-looking commitments, category spending limits, and savings goals.
5. **Analyze:** Question-oriented financial intelligence (answering *"What happened?"* and *"Why?"*).
6. **Predict:** Forward trajectory modeling (answering *"Where am I heading at this pace?"*).
7. **Act:** Embedded AI co-pilot that executes structured user actions rather than generating chat trivia.

---

## 2. Core UX Reframe

The user’s mental model does not revolve around feature names. It revolves around their money:
- **TODAY & THIS MONTH:** What is my real, unencumbered cash balance?
- **NEEDS REVIEW:** What purchases were detected that require my approval?
- **UPCOMING:** What bills, rent, and subscriptions are committed before I spend anything else?
- **YOUR PLAN:** Am I pacing properly across dining, shopping, and savings?
- **INSIGHTS & ACTIONS:** What changed unexpectedly, and what concrete step should I take next?

---

## 3. Canonical Information Architecture (5 Pillars)

```
CASHLY OPERATING SYSTEM
│
├── 1. HOME (Command Center)
│   ├── Financial Snapshot (Available Cash, Monthly Out, Committed Cash)
│   ├── Attention & Action Center (Review queue, impending bills, budget pace risks)
│   ├── Spending Pulse (14-day spending curve vs prior period)
│   ├── Upcoming Commitments (Next 7 days of fixed obligations)
│   └── Goal Milestones
│
├── 2. ACTIVITY (The Money Stream)
│   ├── Needs Review (Inbox — Unposted transactions from extension & imports)
│   ├── All Transactions (Canonical searchable ledger with side-sheet details)
│   ├── Statement Imports (PDF OCR, CSV mapping, staged rows)
│   └── Recurring Activity (History of recurring detections)
│
├── 3. PLAN (Commitments, Limits & Future Cash)
│   ├── Budgets (Active category limits, spending pace, projected overrun warnings)
│   ├── Commitments (Unified Subscriptions, Bills, and Free Trial Alerts)
│   ├── Goals (Target funding, deadlines, automatic contribution tracking)
│   └── Cashflow Calendar (Monthly timeline of bills, paydays, and projected spend)
│
├── 4. ANALYZE (Decision-Oriented Intelligence)
│   ├── Spending Patterns (Trends by category, merchant, and channel)
│   ├── Money Twin (End-of-month cash projection, daily burn rate, runway headroom)
│   ├── What-If Simulator (Interactive scenario modeling)
│   └── Reports & Exports (Downloadable tax, merchant, and monthly summaries)
│
├── 5. ASSIST (Embedded AI Co-Pilot)
│   ├── Live Financial Context Assistant (Context-grounded advice with direct action CTAs)
│   ├── Weekly Coach Plan (3 actionable savings and habits tasks)
│   └── Voice Action Center (Hands-free transaction recording and queries)
│
└── SYSTEM & UTILITIES
    ├── Accounts & Cards (Bank feeds via Plaid, digital cards, spending caps)
    ├── Extension Companion (Connection status, capture telemetry, settings)
    └── Settings & Profile (Preferences, currency, security, danger zone)
```

---

## 4. Fundamental UX Principles & Commandments

1. **No Hard Extension Wall:**
   - Desktop and mobile web access must NEVER be blocked by `ExtensionWall`.
   - The browser extension is a powerful companion accelerator, not a punitive prerequisite.
2. **Commitment Consolidation:**
   - Subscriptions, bills, liability reminders, and recurring charges must live together under **Plan > Commitments**.
3. **No Modal Hell:**
   - Secondary workflows (viewing transaction details, receipt inspections) must open in ergonomic **Contextual Side-Sheets** on desktop and **Bottom Sheets** on mobile.
4. **Actionable AI (No Generic Chatbot):**
   - AI responses must include structured, deep-linked action buttons (e.g., `[View Dining Transactions]`, `[Adjust Budget]`, `[Approve Candidate]`).
5. **Mobile-First Ergonomics:**
   - Primary navigation lives in a 5-pillar bottom bar (`Home`, `Activity`, `Plan`, `Analyze`, `Assist`).
   - Eliminate 10-item overflow menus. Minimum tap target is 44px.
6. **Preserve Business Logic:**
   - Never rewrite working database queries, Prisma schemas, or algorithmic calculations merely for styling.
