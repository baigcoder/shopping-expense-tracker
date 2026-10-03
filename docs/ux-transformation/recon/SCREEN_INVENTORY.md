# CASHLY RECON — COMPREHENSIVE SCREEN INVENTORY

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Audit:** October 2026  
**Status:** Complete Screen-by-Screen Forensic Inventory  

---

## 1. Public & Marketing Screens

### Screen 1: Public Landing Page
- **Route:** `/`
- **Component:** `LandingPage.tsx`
- **Visual Evidence:** Supplied Screenshots 1, 2, 3, 4, 5
- **Purpose:** Introduce Cashly’s review-first philosophy, explain the browser extension capture lifecycle, show feature breadth, and convert visitors.
- **Primary Action:** "Create a free account ->" (`/signup`)
- **Secondary Actions:** "See every feature" (`/features`), "Download the extension", "Sign in" (`/login`), FAQ accordion expansion.
- **Information Hierarchy:**
  1. Sticky top marketing navigation (`MarketingNav`)
  2. Hero with value proposition: *"See a charge before it hits your ledger"* + interactive preview card of review inbox.
  3. "How it works" 4-step process cards (Capture, Review, Plan, Analyze).
  4. Feature catalog grid (Dashboard, Calendar, Budgets, Goals, Accounts, Subscriptions, Bills).
  5. Analysis showcase (Week vs Last week bar chart, Money Twin cards).
  6. FAQ accordion and footer.
- **Navigation Context:** Standalone public layout.
- **Density:** Low / Editorial.
- **Interaction Patterns:** Accordion expand/collapse, smooth scroll hash anchors (`#how-it-works`).
- **Responsive Behavior:** Header collapses to mobile sheet menu; 4-column feature grids collapse to 1-column on mobile.
- **Accessibility Issues:** Color contrast between subtle gray text (`#78716C`) and cream canvas (`#FAF8F5`) reaches ~3.8:1, borderline on small body text.

---

### Screen 2: Features Directory Page
- **Route:** `/features`
- **Component:** `FeaturesPage.tsx`
- **Purpose:** Deep dive into each subsystem (Extension, Review Inbox, Intelligence, Planning, Security).
- **Primary Action:** "Get started"
- **Secondary Actions:** Deep links into specific feature anchors.
- **Information Hierarchy:** Sectioned breakdown with feature badges and detail bullets.
- **Density:** Medium.
- **Responsive Behavior:** Reflows from 3-column feature cards to single-column stack.

---

### Screen 3: Authentication Suite (`/login`, `/signup`, `/verify-email`, `/forgot-password`)
- **Components:** `LoginPage.tsx`, `SignupPage.tsx`, `VerifyEmailPage.tsx`, `ForgotPasswordPage.tsx`
- **Layout:** `AuthLayout.tsx`
- **Purpose:** User registration, password authentication, email confirmation via OTP, and Google OAuth.
- **Primary Action:** "Sign in" / "Create account" / "Verify Email"
- **Secondary Actions:** "Continue with Google", "Forgot password?", "Already have an account? Sign in".
- **Information Hierarchy:**
  1. Cashly brand mark ("C Cashly").
  2. Centered white card (`rounded-2xl border border-[#E7E5E4]`).
  3. Contextual title and subtitle.
  4. Form inputs (Email, Password with toggle visibility, Name).
  5. Primary CTA button.
  6. OAuth divider + Google sign-in button.
  7. Terms and privacy links.
- **Density:** Low / Focused.
- **Interaction Patterns:** Inline error validation, password visibility eye toggle, sound effects (`soundManager.play('click')`).
- **Responsive Behavior:** Full viewport height on desktop and mobile (`min-h-dvh`), card centered with horizontal padding.
- **Accessibility Issues:** Password toggle button requires explicit `aria-label`; error messages need `aria-live="polite"`.

---

## 2. Core Dashboard & Ledger Screens

### Screen 4: Main Financial Dashboard
- **Route:** `/dashboard`
- **Component:** `DashboardPage.tsx`
- **Purpose:** Unified financial command center showing real-time balance, spending velocity, review alerts, cards, and recent transactions.
- **Primary Action:** Review pending inbox purchases / Add transaction (`+` button).
- **Secondary Actions:** Toggle balance privacy (eye icon), click card to preview details, navigate to analytics, open budgets.
- **Information Hierarchy:**
  1. Welcome greeting + protected session pill.
  2. Live capture banner (`usePaymentCaptureSync`) & Pending Inbox banner.
  3. 4-stat KPI grid (Total Balance, Money In, Money Out, Streak Days).
  4. 2-column main layout:
     - Left: 14-day spending chart (Recharts) + category distribution + circular budget usage gauge + financial health score + top merchants.
     - Right: Extension status widget + horizontal card carousel + recent activity (5 rows) + quick access grid.
  5. Bottom: `MoneyTwinPulse` widget.
- **Density:** High / Overloaded (12 widgets).
- **Interaction Patterns:** Hover micro-animations on icons, SVG circle dash-array animations, horizontal scroll snap on cards, click-to-open card detail dialog.
- **Responsive Behavior:** Collapses from 2-column desktop grid to single-column priority stack on mobile.
- **Accessibility Issues:** SVG gauge values lack screen-reader text alternatives; color-only trend indicators (red/green) need supporting text.

---

### Screen 5: Transaction Ledger
- **Route:** `/transactions`
- **Component:** `TransactionsPage.tsx`
- **Purpose:** Authoritative financial ledger of all approved income and expense items.
- **Primary Action:** Search / filter transactions; add transaction.
- **Secondary Actions:** Import CSV, Import PDF statement, Export statement, Delete transaction, View transaction detail dialog.
- **Information Hierarchy:**
  1. Page header with search bar, category filter pills, date range tabs.
  2. Transaction table showing: Date, Description, Category icon, Amount (colored by type), Source badge, Actions (edit/delete).
  3. Pagination controls.
  4. Multiple modal mounts (CSVImport, PDFAnalyzer, DocumentImportModal, ExportModal, ResetConfirmModal).
- **Density:** High.
- **Interaction Patterns:** Search input with 300ms debounce, row click to open dialog, real-time table row insertion.
- **Responsive Behavior:** Table forces `min-width: 680px`, requiring horizontal scrolling on screens under 768px.
- **Accessibility Issues:** Table headers lack sort direction ARIA attributes; modal stacking can trap focus.

---

### Screen 6: Transaction Inbox (Review Queue)
- **Route:** `/transaction-inbox`
- **Component:** `TransactionInboxPage.tsx`
- **Purpose:** Triage staging ground for incoming unapproved purchases detected by the browser extension or uploaded via statements.
- **Primary Action:** Approve transaction (`[✓]`).
- **Secondary Actions:** Inline edit draft (pencil), merge duplicate candidate, reject candidate (`[✕]`), batch approve selected, create merchant matching rule.
- **Information Hierarchy:**
  1. Header with triage count badge and status tabs (Pending, Approved, Rejected).
  2. Batch action bar (Approve All Safe, Batch Reject).
  3. Candidate cards displaying: Merchant title, Capture source (`extension`, `csv`, `pdf`), Confidence meter, Category selector, Action buttons.
  4. Merchant rules side panel / creation form.
- **Density:** Medium / Workflow-focused.
- **Interaction Patterns:** Inline form editing within candidate cards, instant optimistic removal upon approval, toast confirmation.
- **Responsive Behavior:** Cards stack vertically on mobile.
- **Accessibility Issues:** Action buttons use icon-only representations without persistent visible labels.

---

## 3. Planning & Liability Screens

### Screen 7: Budgets Page
- **Route:** `/budgets`
- **Component:** `BudgetsPage.tsx`
- **Purpose:** Set monthly category spending caps and monitor burn rate.
- **Primary Action:** "Create Budget"
- **Secondary Actions:** Delete budget, view category expense history.
- **Information Hierarchy:**
  1. Total budget summary meter (Total Allocated vs Total Spent).
  2. Grid of category budget cards with progress bars and percentage consumed.
  3. Warning states at 80% and 100% capacity.
- **Density:** Medium.
- **Responsive Behavior:** 3-column grid collapses to 1-column mobile stack.

---

### Screen 8: Goals Page
- **Route:** `/goals`
- **Component:** `GoalsPage.tsx`
- **Purpose:** Track savings targets toward major milestones.
- **Primary Action:** "New Goal"
- **Secondary Actions:** "Add Funds" to existing goal, edit target deadline, delete goal.
- **Information Hierarchy:**
  1. Summary banner: Total Savings Target vs Accumulated Funds.
  2. Goal cards with circular progress, remaining amount, deadline date, and funding history.
- **Density:** Medium.
- **Interaction Patterns:** Confetti explosion via `canvas-confetti` upon reaching 100%.

---

### Screen 9: Subscriptions Page
- **Route:** `/subscriptions`
- **Component:** `SubscriptionsPage.tsx`
- **Purpose:** Monitor recurring SaaS, streaming, and service trials.
- **Primary Action:** "Add Subscription"
- **Secondary Actions:** Filter active vs trials vs cancelled, toggle trial reminders.
- **Information Hierarchy:**
  1. Monthly recurring cost KPI tile.
  2. Active subscriptions list with billing cadence and next payment date.
  3. Trial alert section showing impending conversions.
- **Density:** Medium.
- **Design Inconsistency:** Uses Stark Brutalist headers and hard borders.

---

### Screen 10: Bills Page (`/bills`) & Bill Reminders Page (`/reminders`)
- **Components:** `BillsPage.tsx` and `BillRemindersPage.tsx`
- **Purpose:** Track upcoming fixed obligations (utilities, rent) and overdue alerts.
- **Primary Action:** "Add Bill" / Mark as Paid.
- **Secondary Actions:** Set reminder days before due date, toggle automatic recurring creation.
- **Information Hierarchy:**
  1. Summary of total amount due this month.
  2. Status pills (Paid, Upcoming, Soon, Overdue).
  3. Card list of upcoming bills with days remaining.
- **UX Defect:** Fragmented across two separate routes with overlapping data models.

---

### Screen 11: Cashflow Calendar
- **Route:** `/cashflow-calendar`
- **Component:** `CashflowCalendarPage.tsx`
- **Purpose:** Calendar view of cash in and cash out across the current month.
- **Primary Action:** Navigate months (Previous / Next).
- **Secondary Actions:** Click day to inspect scheduled events.
- **Information Hierarchy:**
  1. Monthly net cashflow bar (Total Income, Total Expense, Net).
  2. 7-column calendar grid with color-coded spending intensity heatmaps.
- **Density:** High.
- **Responsive Behavior:** 7-column calendar becomes severely cramped on mobile screens under 640px.

---

## 4. Intelligence & Analysis Screens

### Screen 12: Spending Analytics
- **Route:** `/analytics`
- **Component:** `AnalyticsPage.tsx`
- **Purpose:** Multi-dimensional visualization of historical spending habits.
- **Primary Action:** Switch time ranges (`Week`, `Month`, `Year`) and view modes (`Online vs In-Store`).
- **Information Hierarchy:**
  1. Monthly spending curve (Recharts AreaChart).
  2. Category breakdown donut chart (Recharts PieChart) with active sector expansion.
  3. Merchant spending rankings (BarChart).
- **Density:** Medium.
- **UX Defect:** Static display lacking actionable drill-downs or recommendations.

---

### Screen 13: Money Twin (Forecasting & Simulation)
- **Route:** `/money-twin`
- **Component:** `MoneyTwinPage.tsx`
- **Purpose:** Predictive financial twin projecting month-end balances, burn rate, and scenario simulations.
- **Primary Action:** Run What-If Scenario (e.g. Cancel Subscription).
- **Information Hierarchy:**
  1. Sub-tabs: `Forecast`, `What-If`, `Parallel Universes`, `Risks`.
  2. Daily burn rate and runway headroom gauges.
  3. Projected month-end cash balance based on current spending velocity.
  4. Simulation control sliders and parameter inputs.
- **Density:** High.
- **Design Inconsistency:** Strong brutalist styling with hard black borders.

---

### Screen 14: Reports Engine
- **Route:** `/reports`
- **Component:** `ReportsPage.tsx`
- **Purpose:** Generate and export structured financial summaries.
- **Primary Action:** "Export" (CSV, Excel, PDF).
- **Secondary Actions:** Select date range (Quarter, Year, All) and report type (Tax, Category, Merchant).
- **Information Hierarchy:**
  1. Report configuration bar.
  2. Live report preview table and trend chart.
  3. Export history archive.
- **Density:** Medium.

---

### Screen 15: Shopping Activity & Telemetry
- **Route:** `/shopping-activity`
- **Component:** `ShoppingActivityPage.tsx`
- **Purpose:** Audit shopping sites visited and purchases tracked by the browser extension.
- **Primary Action:** Filter sites (Shopping, Payment, Finance).
- **Information Hierarchy:**
  1. Total sites tracked metric tile.
  2. Table of merchant domains, visit counts, and last detection timestamps.
- **Density:** Medium.

---

### Screen 16: Extension Health
- **Route:** `/extension-health`
- **Component:** `ExtensionHealthPage.tsx`
- **Purpose:** Diagnostic health dashboard for the companion browser extension.
- **Primary Action:** "Refresh" diagnostics.
- **Information Hierarchy:**
  1. 4 Stat tiles (Tracked sites, Queued syncs, Failed detections, Permission status).
  2. Recent capture events log table with status badges.
- **Density:** Low / Clean.

---

## 5. System, Management & Orphan Screens

### Screen 17: Cards Management
- **Route:** `/cards`
- **Component:** `CardsPage.tsx`
- **Purpose:** Card limit management, virtual card theme selection, and CVV protection.
- **Primary Action:** "Add a Card".
- **Secondary Actions:** Freeze card, edit spending limit, set CVV reveal password.
- **Information Hierarchy:**
  1. Active cards horizontal carousel / grid.
  2. Selected card details and security actions.
  3. Linked bank accounts summary (`LinkedAccountsCard`).
- **Density:** Medium.

---

### Screen 18: Accounts Management
- **Route:** `/accounts`
- **Component:** `AccountsPage.tsx`
- **Purpose:** Manage checking, savings, credit, and cash accounts.
- **Primary Action:** "Add Account" / "Connect Bank" (Plaid).
- **Information Hierarchy:**
  1. Total Net Worth calculation tile.
  2. List of accounts grouped by institution.
- **Density:** Medium.

---

### Screen 19: Settings & Preferences
- **Route:** `/settings`
- **Component:** `SettingsPage.tsx`
- **Purpose:** System configuration, sound volume, currency, AI live toggles, and data reset.
- **Primary Action:** "Save Preferences".
- **Secondary Actions:** Test AI prompt, force refresh AI data cache, request data reset OTP.
- **Information Hierarchy:**
  1. Profile info (Name, Email).
  2. Preferences switches (Currency, Sounds, Theme, Reduced Motion).
  3. AI Intelligence controls (Live AI, Memory, Include Pending).
  4. Danger Zone (Reset account data).
- **Density:** Medium.

---

### Screen 20: Profile Page
- **Route:** `/profile`
- **Component:** `ProfilePage.tsx`
- **Purpose:** User profile, avatar management, and achievements.
- **Primary Action:** "Edit Profile".
- **Information Hierarchy:**
  1. Avatar and header banner.
  2. Name, email, location, bio inputs.
  3. Activity timeline and achievements grid.
- **Density:** Low.

---

### Screen 21: Orphan / Duplicate Screen: Expense Details
- **Route:** `/expenses`
- **Component:** `ExpenseDetailsPage.tsx`
- **Status:** **Orphan Duplicate**
- **Purpose:** Abandoned duplicate of `TransactionsPage` with 15-second polling and separate add expense dialog.

---

### Screen 22: Dead Placeholder Screen: Recurring Payments
- **Route:** `/recurring`
- **Component:** `RecurringPage.tsx`
- **Status:** **Dead View**
- **Purpose:** 40-line placeholder with two hardcoded dummy cards ("Gym Membership", "Car Insurance").

---

### Screen 23: Exposed Engineering Screen: AI Testing Lab
- **Route:** `/ai-test`
- **Component:** `AITestPage.tsx`
- **Status:** **Dev Test Harness**
- **Purpose:** Engineering sandbox for typing raw AI prompt strings.
