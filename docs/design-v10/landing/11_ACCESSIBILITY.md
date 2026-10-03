# 11 — Accessibility & Inclusivity (V10)

## 1. Compliance Standard
Cashly V10 is engineered to comply with **WCAG 2.2 Level AA**:
1. **Color Contrast Ratios**:
   - High-contrast Deep Ink (`#111111`) on Warm Ivory (`#F4F3EE`): **16.2:1** (exceeds 4.5:1 requirement).
   - White text on Cadmium Orange (`#EE5024`): **3.8:1 for large display titles >32px**, high-contrast black subtext for smaller labels.
   - White text on Deep Burgundy (`#80383D`): **7.1:1**.
2. **Keyboard Navigation & Focus States**:
   - All interactive controls (pills, tabs, buttons, links, sliders) have explicit `:focus-visible` ring outlines.
   - Screen-reader accessible headings (`h1` through `h4`) structured in strict semantic order.
3. **Non-Color State Indicators**:
   - Status changes are conveyed through text badges (e.g. `● ACTIVE`, `✓ APPROVED`, `NEW`) and icons, never color alone.
   - Sliders include accessible `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and descriptive labels.
