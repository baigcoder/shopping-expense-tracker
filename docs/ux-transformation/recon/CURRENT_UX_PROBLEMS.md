# CASHLY RECON — CURRENT UX & INTERACTION DEFECTS

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Audit:** October 2026  
**Status:** Forensic Interaction & Experience Audit Complete  

---

## 1. Executive UX Audit

Cashly contains substantial working engineering logic, real-time sync, and intelligent heuristics. However, its current user experience is characterized by **feature fragmentation**, **high cognitive friction**, **isolated workflows**, and **modal overload**.

Instead of feeling like one cohesive **Financial Operating System**, Cashly currently feels like a loose collection of 20 unrelated feature pages.

---

## 2. Forensic UX Defect Inventory

### Defect 1: The Hard Desktop Gate (`ExtensionWall`)
- **Location:** `frontend/src/components/ExtensionWall.tsx`
- **Forensic Diagnosis:**
  - On desktop browsers (> 768px), `ExtensionWall` actively checks if the browser extension is installed, logged in, and session-synced with the matching user email.
  - If any condition fails, an **opaque, un-dismissible full-screen wall** blocks the entire application.
  - A user who signs up or logs in from Chrome on a work laptop, Safari on macOS, or Edge cannot view their financial dashboard, past transactions, or budget limits without downloading a `.zip` file, enabling developer mode, loading an unpacked extension, and synchronizing keys.
- **Severity:** **CRITICAL / BLOCKER**
- **UX Impact:** Extremely high bounce rate. Violates the core principle that a web application should be accessible independently, with the extension acting as a powerful companion capture tool rather than a strict prerequisite gate.

---

### Defect 2: The Recurring Spending Fragmentation (4 Competing Pages)
- **Location:** `/subscriptions`, `/bills`, `/reminders`, `/recurring`, `/cashflow-calendar`
- **Forensic Diagnosis:**
  - Cashly forces the user to navigate four completely separate screens to understand their recurring commitments:
    1. `/subscriptions`: For streaming, SaaS, and trials (`public.subscriptions` table).
    2. `/bills`: For rent, electricity, and insurance (`public.bills` table).
    3. `/reminders`: For "Liability Audits" and bill alerts (`public.bill_reminders` table).
    4. `/recurring`: A dead placeholder view (`RecurringPage.tsx`).
    5. `/cashflow-calendar`: A calendar heatmap of these obligations.
  - The user's mental model is simple: *"How much money is already spoken for every month?"*
  - In Cashly today, the user must manually remember which bucket they filed a charge under.
- **Severity:** **HIGH / ARCHITECTURAL**

---

### Defect 3: Modal Overload ("Modal Hell" on `/transactions`)
- **Location:** `frontend/src/pages/TransactionsPage.tsx`
- **Forensic Diagnosis:**
  - `TransactionsPage` imports and conditionally renders **six massive modal dialogs**:
    1. `TransactionDialog.tsx` (Transaction view/edit)
    2. `CSVImport.tsx` (CSV file upload & column mapping)
    3. `PDFAnalyzer.tsx` (PDF statement OCR parser)
    4. `DocumentImportModal.tsx` (Multi-format document parser)
    5. `ExportModal.tsx` (CSV/Excel/PDF export options)
    6. `ResetConfirmModal.tsx` (Account data wipe OTP verification)
  - Every secondary workflow forces the user into an opaque modal overlay that obliterates page context and cannot be bookmarked, deeply linked, or easily resized.
- **Severity:** **HIGH**

---

### Defect 4: Disconnected & Non-Actionable AI Architecture
- **Location:** `AIChatbot.tsx` vs `InsightsPage.tsx` vs `AITestPage.tsx`
- **Forensic Diagnosis:**
  - AI in Cashly is treated as a conversational novelty rather than an integrated operational capability:
    - **Floating Widget:** `AIChatbot.tsx` is an isolated chat bubble in the bottom right corner. It answers queries about spending, but cannot execute actions (e.g., if the user asks *"Show me my dining expenses"*, the bot textually lists amounts but cannot filter the ledger).
    - **Sidebar Disconnect:** The sidebar link "AI Assistant" actually opens `InsightsPage.tsx`, which is a static list of tips and cards—NOT the chatbot!
    - **Leaked Test Page:** `/ai-test` is exposed in routing as an internal dev testing lab.
- **Severity:** **HIGH**

---

### Defect 5: Inbox vs Ledger Triage Disconnect
- **Location:** `/transaction-inbox` vs `/transactions`
- **Forensic Diagnosis:**
  - The review queue (`TransactionInboxPage`) is Cashly's single strongest product differentiator.
  - However, it lives as an isolated screen on `/transaction-inbox`.
  - When candidates are approved, they disappear into `/transactions` without an inline transition, audit summary, or undo capability.
  - On mobile, `TransactionInboxPage` is hidden inside the secondary "Menu" drawer behind a hamburger click.
- **Severity:** **HIGH**

---

### Defect 6: Orphan & Abandoned Duplicate Views
- **Location:** `/expenses` (`ExpenseDetailsPage.tsx`) & `/recurring` (`RecurringPage.tsx`)
- **Forensic Diagnosis:**
  - `/expenses` contains 582 lines of functional code, including a 15-second polling timer, add expense dialog, and OCR bank parser, yet it is completely absent from navigation.
  - `/recurring` contains 40 lines of static hardcoded data ("Gym Membership $50").
  - Having dead and duplicate routes in production degrades code maintainability and confuses URL routing.
- **Severity:** **MEDIUM**

---

### Defect 7: Mobile Navigation Friction (The "10-Item Menu Drawer")
- **Location:** `frontend/src/components/MobileBottomNav.tsx`
- **Forensic Diagnosis:**
  - The mobile tab bar exposes 4 icons: `Home`, `Transactions`, `Analytics`, `Cards`.
  - The 5th icon is a hamburger `Menu` button that slides open a vertical drawer containing **10 stacked options**: AI Insights, Inbox, Reports, Calendar, Budgets, Goals, Subscriptions, Reminders, Extension Health, Settings.
  - Important everyday actions (like checking the Inbox or viewing Budgets) require two taps and vertical drawer scrolling on mobile.
- **Severity:** **HIGH**

---

### Defect 8: Non-Contextual Empty States
- **Location:** Across all domain pages (`DashboardPage`, `BudgetsPage`, `GoalsPage`, etc.)
- **Forensic Diagnosis:**
  - When a user has zero data, components display generic placeholders such as:
    - *"No spending to show yet"*
    - *"No budget set yet"*
    - *"No cards yet"*
    - *"Quiet so far"*
  - These empty states fail to explain:
    1. What this surface does.
    2. Why it is currently empty.
    3. How the user can activate it (e.g., *"Connect your account"* or *"Import a statement"*).
- **Severity:** **MEDIUM**

---

### Defect 9: Card Vault Security & Cognitive Friction
- **Location:** `frontend/src/pages/CardsPage.tsx`
- **Forensic Diagnosis:**
  - The Cards feature attempts to act as a 1Password-like wallet vault: storing cardholder names, expiration dates, encrypted CVVs, and optional CVV reveal passwords.
  - However, Cashly is an expense tracker, not an encrypted password vault.
  - Users are confused by having to enter a "CVV reveal password" in a personal finance dashboard.
  - Legitimate card tracking should focus on: linked payment methods, spending limits, card balances, and card billing cycles.
- **Severity:** **MEDIUM**
