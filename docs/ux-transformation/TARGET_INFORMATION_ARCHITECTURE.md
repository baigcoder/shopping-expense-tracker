# CASHLY — TARGET INFORMATION ARCHITECTURE

**System:** Cashly Financial Operating System  
**Document Classification:** IA & Navigation Architecture (Authority #3)  
**Status:** Canonical & Enforced  

---

## 1. Top-Level Hierarchy

Cashly reorganizes from 20 scattered pages into **Five Cohesive Product Pillars** supported by a utility management tier:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TARGET APPLICATION ARCHITECTURE                      │
└────────────────────────────────────────────────────────────────────────┘

 [ 1. HOME ]        [ 2. ACTIVITY ]     [ 3. PLAN ]       [ 4. ANALYZE ]    [ 5. ASSIST ]
 Financial Snapshot   Needs Review Inbox  Budgets & Caps    Spending Trends   Contextual AI
 Attention Center     Canonical Ledger    Commitments &     Money Twin        Weekly Coach
 Spending Pulse       Statement Imports   Due Dates         What-If Sim       Voice Center
 Upcoming Cash        Recurring Stream    Savings Goals     Reports Engine    Action Center
                                          Cashflow Timeline
```

---

## 2. Pillar Breakdown & View Composition

### Pillar 1: HOME (Command Center)
- **Primary URL:** `/dashboard` (or `/home`)
- **Mental Model:** *"What is happening right now, and what matters today?"*
- **Composition Hierarchy:**
  1. **Financial Pulse Header:**
     - Available unencumbered cash balance.
     - Monthly spending total with trend comparison.
     - Remaining discretionary plan.
  2. **Attention & Action Rail:**
     - Unposted captures count (direct jump to Review Inbox).
     - Bills due within the next 48 hours.
     - Budgets exceeding 80% pace threshold.
  3. **Spending Pulse Chart:**
     - 14-day cumulative spending curve vs previous period.
  4. **Committed Cash Module:**
     - Upcoming 7 days of fixed charges (rent, utilities, subscriptions).
  5. **Goal Progress & Contextual AI Recommendation:**
     - Top savings milestone status + one actionable high-confidence AI insight.

---

### Pillar 2: ACTIVITY (The Money Stream)
- **Primary URL:** `/transactions` (with unified sub-views)
- **Sub-Tabs / Views:**
  - `[ Needs Review ]` (`/transactions?tab=inbox` or `/transaction-inbox`)
    - The review queue for unposted captures from extension and bank imports.
    - Inline triage: Approve, Inline Edit, Merge Duplicate, Reject, Create Rule.
  - `[ Ledger ]` (`/transactions?tab=ledger`)
    - The authoritative posted ledger with deep search (merchant, amount, category, date, card).
    - Contextual side-sheet on row click (inspect details, notes, receipts without leaving table).
  - `[ Statement Imports ]` (`/transactions?tab=imports`)
    - Upload bank statements (PDF with OCR, CSV column mapping, staging verification).
  - `[ Recurring Activity ]` (`/transactions?tab=recurring`)
    - Filtered history of detected recurring charges.

---

### Pillar 3: PLAN (Commitments, Limits & Future Cash)
- **Primary URL:** `/plan` (defaulting to `/budgets`)
- **Sub-Tabs / Views:**
  - `[ Budgets ]` (`/budgets` or `/plan/budgets`)
    - Category spending caps with live burn rate pace and projected month-end overrun warnings.
  - `[ Commitments ]` (`/subscriptions` or `/plan/commitments`)
    - **UNIFIED COMMITMENT MANAGER:** Combines SaaS subscriptions, utility bills, rent, and free trials into a single prioritized list.
    - Shows: Monthly committed total, next due date, trial expiration countdowns.
  - `[ Goals ]` (`/goals` or `/plan/goals`)
    - Milestone savings targets with target dates, required monthly contribution, and funding progress.
  - `[ Cashflow Timeline ]` (`/cashflow-calendar` or `/plan/calendar`)
    - Interactive monthly calendar showing payday inflows, bill outflows, and daily spending intensity heatmaps.

---

### Pillar 4: ANALYZE (Financial Intelligence)
- **Primary URL:** `/analytics` (defaulting to trends)
- **Sub-Tabs / Views:**
  - `[ Spending Patterns ]` (`/analytics`)
    - Question-oriented analytics: Where is money going? Which merchants increased? Online vs in-store.
  - `[ Money Twin & Forecast ]` (`/money-twin`)
    - Daily burn rate, month-end cash projection, runway headroom, and risk alerts.
    - Integrated What-If simulator (test canceling a subscription or receiving a salary increase).
  - `[ Reports & Exports ]` (`/reports`)
    - Clean downloadable statements (CSV, Excel, PDF) with custom date ranges.

---

### Pillar 5: ASSIST (Embedded Co-Pilot)
- **Primary URL:** `/insights` (or `/assist`)
- **Composition:**
  - **Live Co-Pilot Conversation:**
    - AI grounded in real ledger numbers with interactive structured action cards.
  - **Weekly Coach Plan:**
    - 3 concrete financial habit tasks generated each week with progress checkboxes.
  - **Voice Action Center:**
    - Hands-free natural speech interface for hands-free queries and quick transaction logging.

---

### System Utilities (Manage Tier)
- **Accounts & Cards:** `/cards` & `/accounts` (unified payment instruments and Plaid bank sync).
- **Extension Companion:** `/extension-health` (status, site telemetry, troubleshooting).
- **Settings & Profile:** `/settings` & `/profile` (preferences, currency, dark mode, danger zone data reset).

---

## 3. Desktop vs Mobile Navigation Model

### Desktop Shell:
- **Left Sidebar:** Slim 68px collapsed / 248px expanded menu displaying the 5 Pillars + Utilities.
- **Top Utility Bar:**
  - Quick Search / Command Palette shortcut (`⌘K` / `Ctrl+K`).
  - Companion Extension Status pill (`Synced` / `Capturing` / `Install`).
  - Global Quick Add button (`+`).
  - Notification Bell dropdown.
  - User Avatar dropdown.

### Mobile Shell:
- **Bottom Navigation Bar (5 Items):**
  1. `Home` (Dashboard command center)
  2. `Activity` (Inbox & Ledger)
  3. `Plan` (Budgets, Commitments & Goals)
  4. `Analyze` (Analytics & Money Twin)
  5. `Assist` (AI Co-Pilot & Voice)
- **Quick Action FAB:** Floating `+` button opening contextual bottom action sheet.
- **Account & System:** Accessible via clean top-right avatar menu (no 10-item overflow menu).
