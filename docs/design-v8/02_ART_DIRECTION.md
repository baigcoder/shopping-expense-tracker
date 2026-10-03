# CASHLY V8 — ART DIRECTION SPECIFICATION

## 1. Aesthetic Thesis: Sovereign Financial Clarity

Cashly V8 represents a comprehensive design reset: moving decisively away from the early neo-brutalist experiments and pastels toward **Sovereign Financial Clarity**.

```
    PREMIUM FINTECH 
          × 
  EDITORIAL PRECISION 
          × 
MODERN FINANCIAL WORKSPACE 
          × 
 INTELLIGENT SOFTWARE 
          × 
   QUIET CONFIDENCE
```

The user feels they are stepping into an executive trading desk engineered with the elegance of a Swiss time-tracking system and the intelligence of modern agentic computing.

---

## 2. Core Pillars of Art Direction

### 2.1 Proportion over Decoration
- Interfaces derive beauty from **scale ratios**, intentional negative space, and disciplined baseline alignment—never from arbitrary drop shadows, neon borders, or floating plastic badges.
- Every viewport features a single **Dominant Hero Anchor** (e.g., Safe Headroom on Home, Ledger Summary Ribbon on Activity, Predictive Curve on Money Twin, live observation cards on Assist).

### 2.2 Strict Chromatic Economy
- 90% of the canvas consists of calibrated slate neutrals (`#F5F7F6` canvas, `#FFFFFF` surfaces, `#0B1620` deep ink typography).
- Color is treated as a high-value currency:
  - **Pine Teal (`#0F766E` / `#2DD4BF`):** Reserved exclusively for active navigation states, primary product actions, and brand identity.
  - **Financial Green (`#15803D`):** Strictly income and surplus balances.
  - **Attention Amber (`#B45309`):** Threshold warnings and burn velocity pacing.
  - **Risk Crimson (`#C24141`):** Debt, negative cashflow, and exceeded budgets.
  - **Agentic Violet (`#6D28D9`):** Exclusively for AI co-pilot insights and autonomous recommendations.

### 2.3 Fluid Responsive Typography
- Font Families:
  - **Headings & Brand:** Modern geometric sans with high x-height (`var(--font-heading)`).
  - **Financial Data & Ledger Numbers:** Monospaced tabular figures (`font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, monospace;`).
  - **Body Copy:** Legible system sans (`Inter, -apple-system, BlinkMacSystemFont, sans-serif`).

---

## 3. Surface & Elevation Hierarchy

```
Level 0: Canvas (#F5F7F6 light / #0B1620 dark)
  └── Level 1: Elevated Panels (#FFFFFF light / #15222E dark, border: 1px solid var(--color-border))
        └── Level 2: Interactive Controls & Table Headers (var(--color-surface-2))
              └── Level 3: Contextual Slide-Over Sheets & Universal Command Palette (z-50, shadow-2xl)
```

No card-on-card stacking. No nested cards inside cards. Spacing communicates grouping; hairline dividers communicate partition.
