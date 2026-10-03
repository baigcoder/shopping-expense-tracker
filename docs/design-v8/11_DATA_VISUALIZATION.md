# CASHLY V8 — DATA VISUALIZATION ARCHITECTURE

## 1. Core Principle: Question First, Chart Second

Every chart in Cashly V8 answers a distinct financial question. We strictly reject decorative "chart walls" that dump raw uninterpreted metrics.

Every visualization module implements the canonical quartet:
```
FINANCIAL QUESTION ──► VISUAL ANSWER ──► INTERPRETATION ──► RECOMMENDED ACTION
```

---

## 2. Standardized Chart Language

1. **Deterministic Spline Lines (Money Twin & Cashflow):**
   - Actuals: Solid Deep Ink (`#0B1620` / `#FFFFFF`).
   - Forward Forecast: Sovereign Pine Teal (`#0F766E` / `#2DD4BF`).
   - Risk Horizon: Subtle Crimson Zone (`#C24141`/10 fill).
2. **Category Distribution (Analytics):**
   - Donut chart with standardized high-contrast categorical palette (Housing, Dining, Transport, Shopping, Utilities, Health).
   - Centered total outflow metric; hovering any slice highlights the category and shows daily burn velocity.
3. **Ranked Horizontal Bars (Merchant Analysis):**
   - Proportional bars sorted descending.
   - Inline merchant favicon / avatar, transaction frequency, and total spent.
   - Clicking a merchant navigates directly to the filtered ledger in Activity.
4. **Pace Gauge (Budgets):**
   - Linear progress bar showing day-of-month benchmark line vs actual spending percentage.
   - Visual warning states trigger automatically when spending exceeds current day-of-month pace by >15%.
