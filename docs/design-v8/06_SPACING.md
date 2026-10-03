# CASHLY V8 — SPACING & SPATIAL CADENCE

## 1. Spatial Cadence Philosophy

In financial software, spacing is not mere breathing room; it establishes semantic grouping, cognitive hierarchy, and scanning velocity.

Arbitrary spacing creates disjointed layouts. Cashly V8 implements an 8-point geometric scale with micro 4-point adjustments:

```
4px   (0.25rem) — Sub-item spacing, icon-to-text gap
8px   (0.50rem) — Micro padding, button internal gap, badge padding
12px  (0.75rem) — Compact element separation, table cell vertical padding
16px  (1.00rem) — Standard interior card padding, form control spacing
20px  (1.25rem) — Intermediate container padding
24px  (1.50rem) — Module separation, header-to-content gap
32px  (2.00rem) — Section separation on desktop
48px  (3.00rem) — Major milestone separation
64px  (4.00rem) — Page header to main workspace baseline
96px+ (6.00rem) — Hero editorial section vertical rhythm
```

---

## 2. Anti-Repetition Spatial Rules

1. **Hierarchy Dictates Margin:** Primary financial hero metrics (Safe Headroom) receive `mb-8`, while secondary telemetry items receive `mb-4`.
2. **Dense Data Rows:** Transaction tables and ledger lists maintain dense 40px–48px row heights to maximize visible items per screen fold.
3. **No Symmetric "Card Walls":** Adjacent sections use differing column counts (e.g., 2/3 asymmetric hero on Home, followed by 3-column telemetry, followed by 1-column high-density ledger).
