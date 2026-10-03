# CASHLY — IMPLEMENTATION PLAN & PHASE ROADMAP

**Document Classification:** Tactical Implementation Roadmap (Authority #5)  
**Status:** Canonical & Enforced  

---

## 1. Execution Order & Rules of Engagement

In strict compliance with Rules 1 through 12 of the Master Directive:
- **Rule 1:** Preserve all working business logic, Supabase tables, and API services.
- **Rule 2:** Design System First (tokens, typography, color, spacing, radii, shadows, motion, primitives).
- **Rule 3:** Application Shell First (navigation, sidebar, mobile navigation, top bar, command palette, global actions).
- **Rule 4:** Product-Critical Flows in priority order:
  1. Dashboard
  2. Transactions
  3. Transaction Inbox
  4. Planning (Budgets, Commitments, Goals, Calendar)
  5. Analytics & Forecasting
  6. AI Co-Pilot
  7. Accounts/Cards
  8. Extension Companion
  9. Settings
  10. Marketing
- **Rule 5:** Desktop + Tablet + Mobile responsiveness on every screen.
- **Rule 10:** Validation Gate (`npm run build`, `npm run test:run`) after each phase.

---

## 2. Phased Implementation Roadmap

```
PHASE 1: Design Tokens & Styling Architecture (Rule 2)
 ├── Eradicate the `!important` compatibility layer in `index.css`.
 ├── Establish canonical tokens in `index.css` & `tailwind.config.js`.
 └── Refactor primitive controls (`Button`, `Card`, `Surface`, `Badge`, `Input`, `Dialog`).

PHASE 2: Application Shell Overhaul (Rule 3)
 ├── Eliminate `ExtensionWall.tsx` from blocking desktop web app.
 ├── Build unified Header Bar with Command Palette (⌘K) and Extension Status Pill.
 ├── Modernize `Sidebar.tsx` with 5 Core Pillars.
 ├── Rebuild `MobileBottomNav.tsx` with 5 primary tabs (no 10-item overflow drawer).
 └── Implement universal Quick Action FAB (+).

PHASE 3: Dashboard Rebuild (Rule 4, Step 1)
 ├── Re-architect `DashboardPage.tsx` into attention-first layout.
 ├── Financial Pulse Header (Available cash, Monthly Out, Committed Cash).
 ├── Attention & Action Rail (Pending inbox items, bills due in 48h, budget pace alerts).
 ├── Spending Pulse Curve & 7-day Upcoming Commitments module.
 └── De-clutter 12 widgets into clean progressive disclosure sections.

PHASE 4: Activity & Review Inbox (Rule 4, Steps 2 & 3)
 ├── Consolidate into unified Activity module:
 │   ├── Tab 1: Needs Review (`TransactionInboxPage`)
 │   ├── Tab 2: Canonical Ledger (`TransactionsPage`)
 │   └── Tab 3: Statement Imports (PDF OCR & CSV)
 ├── Implement Contextual Side-Sheet for transaction inspection (replaces modal dialog).
 └── Cleanly retire orphan route `/expenses`.

PHASE 5: Plan & Commitments (Rule 4, Step 4)
 ├── Unify `/subscriptions`, `/bills`, `/reminders`, and `/recurring` into `CommitmentsManager`.
 ├── Upgrade `BudgetsPage.tsx` with spending velocity pace and overrun projections.
 ├── Upgrade `GoalsPage.tsx` with automated contribution progress.
 ├── Refactor `CashflowCalendarPage.tsx` to display unified commitments heatmap.
 └── Delete dead placeholder view `/recurring`.

PHASE 6: Analytics & Forecasting (Rule 4, Step 5)
 ├── Modernize `AnalyticsPage.tsx` with decision-oriented chart cards.
 ├── Modernize `MoneyTwinPage.tsx` (clean daily burn rate, runway headroom).
 └── Integrate What-If simulation directly into forecast view.

PHASE 7: Embedded AI Co-Pilot (Rule 4, Step 6)
 ├── Transform `AIChatbot.tsx` to generate interactive structured action buttons.
 ├── Rebuild `/insights` as unified Assist Co-Pilot Hub (Live context + Weekly Coach Plan).
 ├── Embed contextual AI recommendation cards on Dashboard and Ledger.
 └── Retire dev harness `/ai-test` from production routes.

PHASE 8: Instruments & System Utilities (Rule 4, Steps 7, 8, 9)
 ├── Consolidate `/accounts` and `/cards` into unified Payment Instruments surface.
 ├── Refactor `/extension-health` into clean Extension Companion with live telemetry.
 └── Modernize `/settings` and `/profile` (preferences, currency, danger zone).

PHASE 9: Marketing Storytelling (Rule 4, Step 10)
 ├── Refine `LandingPage.tsx` and marketing components with interactive product stories.
 └── Verify responsive breakpoints across public screens.

PHASE 10: Comprehensive Validation & QA (Rules 5, 8, 10, 12)
 ├── Verify WCAG 2.2 AA accessibility (keyboard focus, ARIA tags).
 ├── Run `npm run build` and test suites to verify zero regressions.
 └── Perform end-to-end responsive verification (Desktop, Tablet, Mobile).
```
