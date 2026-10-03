# CASHLY — SCREEN-SPECIFIC BLUEPRINTS

**System:** Cashly Financial Operating System  
**Document Classification:** Screen Blueprints & Wireframe Specifications (Authority #6)  
**Status:** Canonical & Enforced  

---

## 1. Pillar 1: Home (Dashboard Command Center)
**Primary Route:** `/dashboard` (or `/home`)  
**Core Purpose:** Answer *"What is happening right now, and what matters today?"* within 5 seconds.

### 1.1 Visual & Component Hierarchy
```
┌────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: Brand | Net Headroom | Extension Pill | ⌘K Search | Profile   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. FINANCIAL PULSE (3-Tile Bento)                                      │
│    [ Total Balance ]      [ Monthly Spend ]      [ Net Headroom ]      │
│    $12,450.00             $3,210.40              $2,840.00             │
│    +4.2% vs last month    72% of monthly cap     Discretionary buffer  │
├────────────────────────────────────────────────────────────────────────┤
│ 2. ATTENTION & ACTION RAIL (High-Priority Alert Banner)                │
│    [!] 3 transactions waiting in Review Inbox  --> [Review Now]        │
│    [*] Electric Bill ($142.50) due in 2 days   --> [Mark Paid]         │
│    [#] Dining budget at 88% velocity pace      --> [View Spend]        │
├────────────────────────────────────────────────────────────────────────┤
│ 3. MAIN DASHBOARD GRID (2-Column Responsive Bento)                     │
│    COLUMN A (60% width)               │ COLUMN B (40% width)           │
│    ┌────────────────────────────────┐ ┌──────────────────────────────┐ │
│    │ Spending Pulse (14-Day Curve)  │ │ Next 7 Days Commitments      │ │
│    │ Cumulative spend vs last month │ │ Oct 5 - Netflix ($17.99)     │ │
│    │ Projected end-of-month line    │ │ Oct 7 - Electric ($142.50)   │ │
│    └────────────────────────────────┘ │ Oct 9 - Spotify ($10.99)    │ │
│    ┌────────────────────────────────┐ └──────────────────────────────┘ │
│    │ Active Goals Progress          │ ┌──────────────────────────────┐ │
│    │ Emergency Fund: 68% ($6,800)   │ │ Linked Cards & Limits        │ │
│    │ Vacation 2027:  42% ($2,100)   │ │ Sapphire: $1,420 / $5,000    │ │
│    └────────────────────────────────┘ │ Gold Amex: $850 / $3,000     │ │
│                                       └──────────────────────────────┘ │
│                                       ┌──────────────────────────────┐ │
│                                       │ Grounded AI Advice Card      │ │
│                                       │ "Cut 2 subscriptions to save │ │
│                                       │ $34/mo toward your Goal"     │ │
│                                       └──────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.2 State Requirements
- **Loading:** Skeleton pulses for 3 KPI tiles, trajectory chart container, and commitments list.
- **Empty:** Welcome onboarding card prompting user to connect bank, upload first statement, or install extension.
- **Error:** Non-blocking error banner with retry trigger for failed queries.
- **Real Data Binding:** Uses live `useStore` data (`transactions`, `subscriptions`, `bills`, `budgets`, `goals`, `cards`).

---

## 2. Pillar 2: Activity (The Money Stream)
**Primary Route:** `/transactions`  
**Sub-Views:** `[ Ledger ]` (`?tab=ledger`), `[ Needs Review ]` (`?tab=review`), `[ Imports ]` (`?tab=imports`).  
**Core Purpose:** Fast, low-friction transaction triage, auditing, and document parsing.

### 2.1 Tab 1: Needs Review (Review Inbox)
- **Triage Queue:** Unposted captures from extension and bank imports.
- **Row Anatomy:**
  - Merchant logo/avatar, merchant raw name vs clean name, date, source tag (`[Chrome Extension]`, `[PDF Import]`).
  - Category picker dropdown, payment card tag.
  - Amount in `tabular-nums`.
  - Action buttons: `[Approve ✓]` (primary rose), `[Edit ✎]`, `[Merge ⇄]`, `[Dismiss ✕]`.
- **Batch Operations:** Sticky selection bar when rows are checked (`Approve All (N)`, `Categorize Selected`, `Dismiss Selected`).

### 2.2 Tab 2: Canonical Ledger
- **Deep Search & Filters:**
  - Search input with debounce (merchant name, notes).
  - Quick filter pills: `[All]`, `[Online]`, `[In-Store]`, `[Recurring]`, `[Flagged]`.
  - Date range picker dropdown + Category multiselect.
- **Row Interaction:**
  - Clicking any row opens the **Contextual Side-Sheet** drawer (`TransactionSideSheet.tsx`) from the right without navigating away or losing filter state.

### 2.3 Contextual Side-Sheet (`TransactionSideSheet.tsx`)
- Width: `460px` on desktop, `100vw` bottom-sheet on mobile.
- Focus trap and Escape key listener.
- Sections:
  1. Header with merchant name, category badge, and formatted amount.
  2. Date, payment instrument card, and channel (online URL or POS).
  3. Notes and tags editor.
  4. Receipt preview / image attachment thumbnail.
  5. Action buttons: `[Save Changes]`, `[Split Transaction]`, `[Create Merchant Rule]`, `[Delete]`.

### 2.4 Tab 3: Statement Imports
- 3-step import wizard:
  1. Dropzone: Drag-and-drop CSV, Excel (.xlsx), or PDF bank statement.
  2. Column Mapping (CSV) or AI OCR Text Extractor (PDF).
  3. Staging Review: Preview parsed transactions with confidence score before committing to ledger.

---

## 3. Pillar 3: Plan (Commitments, Limits & Future Cash)
**Primary Route:** `/plan` (sub-tabs: `Budgets`, `Commitments`, `Goals`, `Calendar`)  
**Core Purpose:** Answer *"What is already spoken for, and how am I pacing against my limits?"*

### 3.1 Sub-Tab 1: Budgets
- **Velocity Pace Engine:**
  - Compares `% of month elapsed` vs `% of budget spent`.
  - Pace status: `On Track` (Emerald), `At Risk` (Amber, spending faster than calendar), `Over Budget` (Rose).
  - Projected end-of-month total based on daily velocity.
- **Category Grid:**
  - Progress bar with marker indicating today's expected pace point.
  - Remaining spendable headroom in `tabular-nums`.

### 3.2 Sub-Tab 2: Commitments Manager (`SubscriptionsPage.tsx`)
- **Unified Surface:** Merges SaaS subscriptions, utility bills, rent, and free trials.
- **Summary Header:**
  - Total Monthly Committed Outflow.
  - Active Subscriptions count & average cost.
  - Free Trials expiring in next 14 days (with auto-cancel reminders).
- **Commitments Table:**
  - Name, Type badge (`SaaS`, `Utility`, `Rent`, `Insurance`, `Trial`).
  - Next Due Date, Billing Frequency (Monthly/Annual).
  - Amount in `tabular-nums`.
  - Quick toggles: Mark as paid, Pause/Cancel link, Set Reminder.

### 3.3 Sub-Tab 3: Goals
- **Milestone Cards:**
  - Target amount, current saved amount, deadline date.
  - Pace calculator: `"$X / month needed to hit target by date"`.
  - Visual progress bar with milestone checkpoints (25%, 50%, 75%, 100%).
  - Deposit modal: Add funds toward goal.

### 3.4 Sub-Tab 4: Cashflow Calendar (`CashflowCalendarPage.tsx`)
- Monthly visual calendar grid:
  - Day cells colored with spending intensity heatmap.
  - Inflow markers (Payday, freelance income).
  - Outflow markers (Committed bills and subscriptions on their due date).
  - Click day cell to open date schedule drawer detailing all transactions and scheduled charges.

---

## 4. Pillar 4: Analyze (Financial Intelligence)
**Primary Route:** `/analyze` (sub-tabs: `Spending Patterns`, `Money Twin`, `Reports`)  
**Core Purpose:** Answer *"What happened?", "Why did it happen?", and "Where am I heading?"*

### 4.1 Sub-Tab 1: Spending Patterns (`AnalyticsPage.tsx`)
- 4 Decision-Oriented Quadrants:
  1. **Where did it go?** Interactive Category breakdown donut chart with percentage share.
  2. **Am I spending faster?** Velocity comparison line chart (Current month vs Prior month).
  3. **Channel Split:** Online e-commerce checkouts vs Physical In-Store POS charges.
  4. **Top Merchants:** Leaderboard of top 10 merchants by volume and visit frequency.

### 4.2 Sub-Tab 2: Money Twin & Forecast (`MoneyTwinPage.tsx`)
- **Twin Telemetry:**
  - Daily Burn Velocity: Real average burn rate ($/day).
  - Runway Headroom: Number of days before cash reserves dip below safety threshold.
  - Month-End Predicted Balance with risk confidence intervals.
- **What-If Scenario Simulator:**
  - Interactive sliders: Adjust dining out spend, cancel a recurring subscription, model a salary change.
  - Real-time calculation of compound savings over 1, 3, and 5 years.

### 4.3 Sub-Tab 3: Reports & Exports (`ReportsPage.tsx`)
- Custom date range selector (Month, Quarter, Year, Custom range).
- Audit summaries: Category totals, Tax deductible items, Merchant breakdown.
- Export formats: One-click CSV, Excel (.xlsx), and PDF printable report.

---

## 5. Pillar 5: Assist (Embedded AI Co-Pilot)
**Primary Route:** `/assist` (`/insights`)  
**Core Purpose:** Actionable financial co-pilot that executes decisions rather than reciting chat trivia.

### 5.1 Assist Hub Layout
- **Live Financial Context Telemetry:**
  - Live Net Headroom, Unreviewed Transactions count, Top spending category.
- **Weekly Coach Plan:**
  - 3 concrete financial tasks tailored to current week (e.g., *"Reduce Food Delivery by $20"*, *"Review 3 Uncategorized Charges"*, *"Fund Emergency Goal"*).
  - Interactive checkboxes with persistent completion state via `featureExpansionApi.updateCoachAction`.
- **High-Confidence Action Cards:**
  - Cards containing direct deep-link buttons (`[Review 3 Items]`, `[Adjust Budget]`, `[Inspect Commitments]`).
- **Embedded Operator Chat:**
  - Grounded in live database numbers.
  - Returns clickable navigation chips inside conversational responses.
- **Voice Assistant Launcher:**
  - Hands-free voice modal for spoken queries and expense logging.

---

## 6. System Utilities
- **Payment Instruments & Net Worth (`/cards`):**
  - Sub-tab for Payment Cards: Card visualizer, billing cycle dates, spending limits, active/frozen toggle.
  - Sub-tab for Bank Accounts: Checking, savings, investments, total Net Worth tally via `bankAccountService`.
- **Extension Companion (`/extension`):**
  - Live extension connection badge, sync status, 6 monitored checkout domains, recent capture event logs.
- **Settings & Profile (`/settings`):**
  - Profile preferences, regional currency formatting, audio effects toggle, AI engine selection.
  - Danger Zone: OTP-confirmed account reset and purge with multi-step confirmation.
