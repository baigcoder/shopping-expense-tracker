# 04 — COLOR SYSTEM & PALETTE SPECIFICATION
**Canonical Path:** `/docs/design-final/04_COLOR_SYSTEM.md`  
**Status:** CANONICAL MASTER  
**Color Universe:** Cadmium Orange, Soft Candy Pink, Muted Sage Green, Deep Burgundy, Deep Matte Ink, Studio Warm Ivory

---

## 1. Primary Palette Architecture

Cashly’s color architecture is derived directly from the forensic benchmark. Each color possesses a specific functional meaning and architectural role:

| Color Token | Hex Code | Semantic Role | Psychological Effect & Usage |
| :--- | :--- | :--- | :--- |
| `--color-orange` | `#EE5024` | Primary Anchor & Headroom | Electric energy, sovereign authority, "Safe-to-Spend", primary CTAs, active dock indicators. |
| `--color-pink` | `#F0A1CB` | Discretionary Spending & Analytics | Tactile warmth, lifestyle velocity, historical statistics, dual-bar chart accents. |
| `--color-sage` | `#BBC7B1` | Allocation & Inflow Ledger | Natural stability, confirmed deposits, positive cashflow velocity, budget allocation cards. |
| `--color-wine` | `#80383D` | Locked Capital & Contracts | Deep contractual gravity, committed subscriptions, mandatory liabilities, fixed recurring debt. |
| `--color-ink` | `#111111` | Sovereign Ground & Console | Uncompromising editorial contrast, hero title panels, terminal toolbars, dark consoles. |
| `--color-ivory` | `#F4F3EE` | Architectural Ground Plane | Warm matte plaster, daylight workspace canvas, clean contrast against deep ink elements. |

---

## 2. CSS Custom Properties Definition

Defined in `frontend/src/index.css`:

```css
:root {
  /* V10 Primary Canonical Spectrum */
  --color-orange: #EE5024;
  --color-pink: #F0A1CB;
  --color-sage: #BBC7B1;
  --color-wine: #80383D;
  --color-ink: #111111;
  --color-ivory: #F4F3EE;

  /* Semantic State Overlays */
  --color-emerald-positive: #10B981;
  --color-amber-warning: #F59E0B;
  --color-crimson-destructive: #EF4444;

  /* Surface & Border Alpha Variants */
  --color-ink-90: rgba(17, 17, 17, 0.90);
  --color-ink-80: rgba(17, 17, 17, 0.80);
  --color-ink-10: rgba(17, 17, 17, 0.10);
  --color-ink-05: rgba(17, 17, 17, 0.05);

  --color-orange-15: rgba(238, 80, 36, 0.15);
  --color-pink-20: rgba(240, 161, 203, 0.20);
  --color-sage-20: rgba(187, 199, 177, 0.20);
  --color-wine-20: rgba(128, 56, 61, 0.20);
}
```

---

## 3. Surface & Contrast Conformance (WCAG 2.2 AA)

- **Cadmium Orange (`#EE5024`)**:
  - Combined with pure white text (`#FFFFFF`) for large headings (>= 18pt / 24px) achieves compliant readability.
  - Paired with Deep Ink (`#111111`) for small text and badge labels to achieve a contrast ratio > 4.5:1.
- **Deep Ink (`#111111`)**:
  - Provides a 14.8:1 contrast ratio against Warm Ivory (`#F4F3EE`), vastly exceeding AA and AAA thresholds.
- **Muted Sage (`#BBC7B1`) & Soft Pink (`#F0A1CB`)**:
  - Always used with Deep Ink typography (`#111111`), never white text, guaranteeing crisp contrast ratios exceeding 6.2:1.
- **Elimination of Legacy SaaS Clutter**:
  - No low-contrast light gray borders (`#E2E8F0`) on white backgrounds.
  - Zero fluorescent neon drop shadows. All elevation is driven by crisp 1px borders and deep architectural ambient shadows.
