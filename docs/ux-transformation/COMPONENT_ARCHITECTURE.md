# CASHLY — COMPONENT ARCHITECTURE & COMPOSITION MODEL

**Document Classification:** Component Architecture Specification (Authority #6)  
**Status:** Canonical & Enforced  

---

## 1. Composition Hierarchy

To prevent monolithic, 800+ line page components, Cashly enforces a strict **4-tier composition model**:

```
 Tier 1: Page Shell (`pages/*.tsx`)
 └── Pure layout orchestrator; manages top-level query parameters and document titles.

 Tier 2: Section / View Container (`components/*/`)
 └── Manages sub-tab views (e.g., Ledger view vs Review Inbox view).

 Tier 3: Domain Components (`components/*/`)
 └── Encapsulates business domain entities (TransactionCard, BudgetProgress, CommitmentRow, StatTile).

 Tier 4: Primitives (`components/ui/*`)
 └── Reusable, unopinionated UI controls (Button, Input, Sheet, Dialog, Badge, Select, Surface).
```

---

## 2. Core Primitives Architecture (`components/ui/`)

| Primitive Component | Location | Role in Redesign |
|:---|:---|:---|
| `Button` | `components/ui/button.tsx` | Standardized with primary Rose `#E11D48`, subtle secondary, and accessible focus states. |
| `Sheet` | `components/ui/sheet.tsx` | Slide-over drawer (Radix UI) for desktop side-sheets and mobile bottom-sheets (replaces stacked modals). |
| `Surface` | `components/ui/Surface.tsx` | Standard card container with hairline border (`#E7E5E4`), soft radius (`--r-lg`), and subtle shadow. |
| `StatTile` | `components/ui/StatTile.tsx` | Metric tile displaying value with `tabular-nums`, label, trend badge, and optional icon. |
| `Badge` | `components/ui/badge.tsx` | Compact status tags (`Pending`, `Approved`, `Trial`, `Overdue`, `Upcoming`). |
| `Dialog` | `components/ui/dialog.tsx` | Reserved exclusively for critical confirmations (e.g. Delete, Data Reset). |
| `Command` | `components/ui/command.tsx` | Universal command menu container powered by `cmdk`. |
| `Table` | `components/ui/table.tsx` | Responsive data table with sticky headers and scrollable row container. |
| `EmptyState` | `components/ui/EmptyState.tsx` | Actionable empty container (Icon + Title + Explanatory Body + Primary CTA button). |

---

## 3. Key Domain Components

```
 Application Shell Domain
 ├── Sidebar.tsx                # Left navigation bar (5 Pillars + System Utilities)
 ├── TopBar.tsx                 # Universal header (Command Palette, Extension Pill, Quick Add, Avatar)
 ├── MobileBottomNav.tsx        # Ergonomic 5-pillar bottom bar (Home, Activity, Plan, Analyze, Assist)
 ├── CommandPalette.tsx         # ⌘K / Ctrl+K universal quick search and action executor
 └── ExtensionStatusPill.tsx    # Non-blocking companion indicator (Synced, Capturing, Install)

 Activity Domain
 ├── TransactionSideSheet.tsx   # Contextual side drawer for inspecting and editing transactions
 ├── ReviewCandidateCard.tsx    # Inbox triage card (Approve, Edit Draft, Merge, Reject)
 ├── TransactionTable.tsx       # Ledger table with category icons, tabular currency, and inline filters
 └── StatementImportWizard.tsx  # 3-step file upload, column mapping, and OCR staging verification

 Planning Domain
 ├── CommitmentTable.tsx        # Unified table of subscriptions, utility bills, and trial countdowns
 ├── BudgetPaceCard.tsx         # Category limit card showing spending pace and projected month-end overrun
 ├── GoalMilestoneCard.tsx      # Target savings card with deadline countdown and funding progress
 └── CashflowHeatmap.tsx        # Monthly calendar timeline of inflows, outflows, and spending velocity

 Assist Domain
 ├── EmbeddedAICoPilot.tsx      # Grounded AI conversation panel with clickable action cards
 ├── WeeklyCoachModule.tsx      # 3 weekly savings tasks with completion checkboxes
 └── VoiceActionModal.tsx       # Hands-free speech visualizer and transaction logger
```

---

## 4. Deprecated Components Retirement Matrix

| Component | Path | Action | Replacement |
|:---|:---|:---|:---|
| `ExtensionWall.tsx` | `components/ExtensionWall.tsx` | **DELETE** | Replaced by non-blocking `ExtensionStatusPill.tsx` in header. |
| `ExpenseDetailsPage.tsx` | `pages/ExpenseDetailsPage.tsx` | **MERGE & RETIRE** | All features merged into canonical `TransactionsPage.tsx` (Activity). |
| `RecurringPage.tsx` | `pages/RecurringPage.tsx` | **DELETE** | Merged into `CommitmentsManager` under Plan. |
| `AITestPage.tsx` | `pages/AITestPage.tsx` | **RETIRE FROM PROD** | Removed from production routes. |
| `BillRemindersPage.tsx` | `pages/BillRemindersPage.tsx` | **MERGE** | Merged with `BillsPage.tsx` into unified `CommitmentsManager`. |
| `GlassCard.tsx` / `BentoCard.tsx` | `components/` | **DELETE** | Replaced by canonical `Surface.tsx`. |
| `StatusOverlay.tsx` | `components/StatusOverlay.tsx` | **DELETE** | Replaced by clean sonner toasts. |
