# CASHLY V8 — COMPONENT SYSTEM & DOMAIN PRIMITIVES

## 1. Universal UI Primitives

All UI components reside in `@/components/ui` and are built on accessible, headless primitives (Radix UI / Tailwind / Framer Motion):

- **Button / IconButton:** Strict semantic hierarchy (Primary Brand, Secondary Outline, Subtle Ghost, Destructive Danger). No bloated heights; standard 36px–40px on desktop, 44px minimum touch targets on mobile.
- **Input / Select:** Clean hairline borders (`border-[var(--color-border)]`), focused ring in Sovereign Pine Teal (`focus-visible:ring-[var(--color-brand)]`), integrated icons and error tooltips.
- **Tabs / Navigation Segment:** Rounded container (`rounded-2xl bg-[var(--color-surface-2)]`) with sliding white active indicators, tabular counts, and `shrink-0` overflow scrolling on mobile viewports.
- **SideSheet / Drawer:** Full-height slide-over drawer from right (`z-50`), with accessible backdrop blur, keyboard ESC dismissal, and focus trap.

---

## 2. Domain Financial Components

The application enforces a **Single Source of Truth** for domain entities:

### 2.1 TransactionRow & TransactionSideSheet
- Used identically in **Home**, **Activity**, **Analytics**, and **Needs Review**.
- Displays merchant icon, title, category pill, payment method, date, tabular outflow/inflow, and quick action trigger.
- Clicking any transaction opens the canonical `TransactionSideSheet` with receipt metadata, category reclassification, and split billing.

### 2.2 BudgetCard & PaceIndicator
- Used across **Home**, **Plan (Budgets)**, and **Assist**.
- Renders total cap, current burn, remaining headroom, and a velocity indicator comparing day-of-month progress with budget consumption.

### 2.3 CommandPalette (⌘K)
- Universal system launcher (`⌘K` / `Ctrl+K`) offering instant navigation to all 5 pillars, fast merchant searches, quick transaction logging, and voice assistant invocation.

### 2.4 ExtensionStatusPill
- Embedded directly in top navigation bar, giving continuous real-time telemetry on the Chrome companion connection state without obstructive warning modals.
