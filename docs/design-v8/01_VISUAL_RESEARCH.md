# CASHLY V8 — VISUAL RESEARCH & BENCHMARKS

## 1. Executive Summary

This document synthesizes visual and interaction patterns extracted from premier financial operating systems, wealth intelligence tools, and modern high-trust SaaS environments (Linear, Ramp, Mercury, Stripe, Wealthfront, Robinhood). 

Cashly V8 rejects generic "fintech template" aesthetics:
- No neon cyan/magenta cyberpunk glows.
- No pastel candy colors or childish bubbly cards.
- No gratuitous 3D floating crypto coins.
- No homogeneous 3-column card walls repeated indefinitely.

Instead, Cashly V8 implements **Quiet Authority**:
- **Canvas:** Crisp Slate Light `#F5F7F6` / Obsidian Deep Space `#0B1620`.
- **Primary Brand:** Sovereign Pine Teal `#0F766E` (Active: `#2DD4BF` dark).
- **Semantics:** Strict separation between brand action, financial gain (Emerald `#15803D`), burn pacing (Amber `#B45309`), balance deficit (Crimson `#C24141`), and intelligent automation (Violet `#6D28D9`).

---

## 2. Competitive & Benchmark Deconstruction

### 2.1 Ramp & Mercury: The Modern Commercial Ledger
- **Visual Tenet:** Monospaced tabular numerals (`font-feature-settings: "tnum" 1`) with crisp right alignment.
- **Rhythm:** Dense, low-friction list rows with inline category badges, clear merchant icons, and immediate slide-over detail drawers rather than heavy full-page modal disruptions.
- **Application in Cashly V8:**
  - `TransactionsPage.tsx` implements a high-density summary ribbon showing total ledger value, pending review count, and search filters with zero layout shift.
  - Transactions slide open in an accessible side sheet (`TransactionSideSheet.tsx`) on desktop and an intuitive bottom sheet on mobile.

### 2.2 Linear: Precision Tooling & Spatial Hierarchy
- **Visual Tenet:** Sub-pixel hairline borders (`border: 1px solid var(--color-border)`), subdued surfaces with subtle 1px elevation deltas, keyboard command palette integration (⌘K).
- **Rhythm:** Information grouped by mental model rather than decorative card boundaries.
- **Application in Cashly V8:**
  - Replaced arbitrary card grids with section surfaces and dividers (`bg-[var(--color-surface)]`, `border border-[var(--color-border)]`).
  - Implemented universal Command Palette (`CommandPalette.tsx`) accessible anywhere via `⌘K` / `Ctrl+K`.

### 2.3 Wealthfront & Copilot: Predictive Trajectory & Safe Headroom
- **Visual Tenet:** Hero data is not an arbitrary net balance; it is forward-looking financial runway and safe spending limits.
- **Rhythm:** Bold financial typography (40px–56px) paired with immediate contextual subtitles ("through month-end", "42% burn rate").
- **Application in Cashly V8:**
  - `DashboardPage.tsx` establishes **Safe Headroom** (`SAFE_TO_SPEND`) as the primary hero moment, breaking down the exact formula (`Liquid Cash - Committed Bills - Planned Savings = Rs 42,870 Safe Headroom`).
  - `MoneyTwinPage.tsx` leads with the authoritative editorial directive: *"If nothing changes, this is where your month ends."*

---

## 3. Financial Data Visualization Standards

| Data Type | Primary Representation | Semantics & Colors | Key Micro-Interaction |
| :--- | :--- | :--- | :--- |
| **Safe Headroom** | Hero Stat + Formula Breakdown | Pine Teal `#0F766E` / Emerald `#15803D` | Hover reveals liquid vs reserved breakdown |
| **Category Pace** | Linear Progress Bar + Burn Velocity | Amber `#B45309` if > 80% pace, Crimson if exceeded | Dynamic tooltip showing projected month-end overage |
| **Cashflow Projections** | Multi-Band Area & Spline Curves | Deep Ink actuals, Teal forecast, Crimson risk floor | Cursor scrub with crosshair date snapping |
| **Merchant Distribution** | Ranked Horizontal Proportional Bars | Monochromatic Ink gradients with Brand accent | Click navigates directly to filtered Activity |

---

## 4. Mobile Ergonomics & Touch Geometry

Mobile financial applications demand strict adherence to single-thumb reach zones:
- **Bottom Navigation Bar:** Height >= 64px, touch target >= 48px, 5 canonical pillars (`Home`, `Activity`, `Plan`, `Analyze`, `Assist`).
- **Sheet Architecture:** Drawer swipe gestures, spring physics (`stiffness: 300, damping: 28`), background overlay with slight blur.
- **Quick Action Trigger:** Central elevated FAB or top action button triggering instant ledger entry without navigation friction.
