# 03 — COMPOSITION & LAYOUT ARCHITECTURE
**Canonical Path:** `/docs/design-final/03_COMPOSITION_SYSTEM.md`  
**Status:** CANONICAL MASTER  
**Layout Models:** Asymmetric Triptych, 65/35 Operational Split, Sovereign Header Strip, Floating Capsule Dock

---

## 1. Compositional Principles

Cashly shuns symmetry for purposeful tension. Modern architectural and editorial layouts achieve high visual memorability by combining massive monolithic focal points with dense, refined data clusters.

### The 4 Canonical Page Composition Paradigms:

### Paradigm A: The Monumental Triptych (Showcases & Marketing)
- Applied across Landing hero, Feature Showcases, and Extension Hub.
- 3 distinct vertical columns, each assigned a unique color monolith, typographic weight, and hardware perspective:
  - **Left (Manifesto)**: 42% 3D geometric isometric material / 58% Cadmium Orange statement block.
  - **Center (Analytical Core)**: 55% Soft Pink statistical cockpit / 45% pure white categorical breakdown.
  - **Right (Allocation Engine)**: 48% pure white balance header / 52% Muted Sage chronological activity stack.

### Paradigm B: The 65/35 Operational Split (Dashboard & Inboxes)
- Applied across Home Dashboard (`/dashboard`) and Transaction Ledger (`/transactions`).
- **Primary Column (65%)**: Holds the dominant visual story: Safe-to-Spend centerpiece, live burn velocity chart, and transactional triage queue.
- **Secondary Column (35%)**: Holds actionable context: Forward cashflow runway, locked recurring commitments, and AI insight intercept pills.

### Paradigm C: The Sovereign Split Screen (Authentication & Onboarding)
- Applied across Login (`/login`), Signup (`/signup`), and Verification flows.
- **Left Column (50% Desktop)**: Deep Matte Ink (`#111111`) editorial monolith featuring oversized Syne headline (*"KNOW WHAT HAPPENED. KNOW WHAT COMES NEXT."*), orange indicator tag, and live transactional review preview card.
- **Right Column (50% Desktop)**: Architectural Warm Ivory (`#F4F3EE`) form canvas with high-contrast inputs and full-width Cadmium Orange rounded-full action pills.

### Paradigm D: The Dedicated Sovereign Console (Specialized Instruments)
- Applied across Money Twin (`/money-twin`), Instruments & Cards (`/cards`), Budgets (`/budgets`), and Settings (`/settings`).
- Full-width editorial header banner with category tags and live session telemetry.
- Sticky horizontal pill sub-navigation rail (`PlanNavigationTabs`, `AnalyzeNavigationTabs`, `SettingsTabs`).
- High-contrast bento cards with 24px–28px corner radii, hairline borders, and color-coded headers.

---

## 2. Geometry & Spacing Rules

- **Device Corner Geometry**: Physical device simulations use `border-radius: 40px` to `44px` with a 1px hairline ring (`ring-1 ring-ink/10` or `ring-white/10`).
- **Surface Corner Geometry**: Feature cards and data containers use `border-radius: 24px` to `28px`.
- **Control Corner Geometry**: Action buttons, search bars, filter chips, and navigation links use `border-radius: 9999px` (`rounded-full`).
- **Hairline Rules**: Section divisions and row separations utilize `border-t border-ink/10` or `border-white/10` (1px thickness, muted alpha).
