# CASHLY — MASTER COMPONENT SYSTEM (V5)

**Classification:** Component Architecture & Contract Specification (Authority #8)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Component Architecture Overview

Cashly enforces a strict separation between **Universal UI Primitives** (stateless, design-system governed) and **Domain Components** (context-aware, connected to Zustand stores and Supabase services).

```
┌────────────────────────────────────────────────────────┐
│                   CASHLY COMPONENT STACK               │
├────────────────────────────────────────────────────────┤
│ 1. DOMAIN EXPERIENCES                                  │
│    TransactionSideSheet | ReviewItem | BudgetVelocity  │
│    CommitmentRow | MoneyTwinHero | AIActionChip        │
├────────────────────────────────────────────────────────┤
│ 2. APPLICATION SHELL                                   │
│    Sidebar | TopBar | MobileBottomNav | CommandPalette │
├────────────────────────────────────────────────────────┤
│ 3. GLOBAL UI PRIMITIVES                                │
│    Button | Surface | Input | Dialog | Badge | Tabs    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Universal UI Primitives

### 2.1 Button (`@/components/ui/button`)
- **Variants:**
  - `primary`: Background `--color-brand` (`#D92F57`), text white, hover `--color-brand-hover` (`#B92246`), shadow `--shadow-sm`.
  - `secondary`: Background `--color-surface-2` (`#EFEEE9`), border `--color-border`, text `--color-ink`.
  - `outline`: Background transparent, border `--color-border`, hover background `--color-surface-2`.
  - `ghost`: Zero border, hover background `--color-surface-2`.
  - `danger`: Background `--color-danger` (`#C73A3A`), text white.
- **Sizes:**
  - `sm`: 32px height, 12px text, 8px radius.
  - `md`: 40px height, 14px text, 8px radius.
  - `lg`: 48px height, 15px text, 10px radius.
- **Accessibility:** Mandatory visible focus ring `outline: 2px solid var(--color-brand)`.

### 2.2 Surface (`@/components/ui/Surface`)
- Universal wrapper replacing ad-hoc `div` card markup.
- Accepts `tone='canvas' | 'surface' | 'subtle' | 'elevated'`.
- Default: `bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--r-lg)]`.

### 2.3 Contextual Side-Sheet (`TransactionSideSheet.tsx`)
- Standard desktop slide-over replacing disruptive modal dialogs.
- Width: `480px` on desktop (≥1024px); converts to full-screen bottom sheet on mobile (<768px).
- Traps keyboard focus, listens for `Escape` to close, maintains scroll position of the underlying table.

---

## 3. Domain Component Contracts

1. **`TransactionRow`:**
   - Visual: Merchant avatar, clean merchant name, source badge (`[Chrome Extension]` or `[Statement OCR]`), category badge, payment instrument, right-aligned amount in `tabular-nums`.
   - Action: Single-click opens `TransactionSideSheet`.
2. **`ReviewItem`:**
   - Visual: Unposted purchase candidate with confidence score badge, merchant name, category selector, payment tag.
   - Immediate Actions: `[Approve ✓]` (primary rose), `[Edit ✎]`, `[Merge ⇄]`, `[Dismiss ✕]`.
3. **`BudgetVelocityCard`:**
   - Visual: Category icon, monthly spending limit, actual spend, velocity comparison bar (`% month elapsed vs % budget consumed`), projected month-end overrun warning.
