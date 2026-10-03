# CASHLY — VISUAL QA & DEFECT CLASSIFICATION (V5)

**Classification:** Visual Inspection & Defect Protocol (Authority #41)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Visual Defect Severity Matrix

Every visual finding is evaluated against a 4-tier impact rating:

| Severity | Definition | Examples | SLA |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Broken hierarchy, illegible figures, horizontal layout overflow, broken navigation. | Balance obscured by navbar; text clipping on 390px; modal stuck open. | Immediate Blocker |
| **HIGH** | Inconsistent component styling, jarring spacing, improper semantic color usage. | Red used for normal expense; card padding varying between 12px and 36px randomly. | Same-Sprint Fix |
| **MEDIUM** | Minor alignment discrepancy, slight typography weight drift, non-critical sub-pixel gap. | Button icon offset by 2px; date format differing between two tables. | Polish Pass |
| **LOW** | Decorative refinement, micro-animation easing curve tuning. | Toast shadow ambient diffusion tuning; icon stroke width nuance. | Continuous Polish |

---

## 2. Breakpoint QA Inspection Points

- **390px × 844px (iPhone 14/15 Mobile):** Verify bottom navigation thumbs, no table scrollbars horizontally breaking the canvas, clean bottom-sheet drawers.
- **768px × 1024px (iPad Portrait / Tablet):** Verify sidebar collapse state, 2-column bento grids, responsive chart widths.
- **1024px × 768px (iPad Landscape / Small Laptop):** Verify sidebar expansion, 3-column financial pulse.
- **1440px × 900px (Standard Desktop):** Verify maximum container width constraint (`1280px`), balanced margins, side-sheet positioning.
- **1920px × 1080px (Ultrawide Desktop):** Verify center alignment, zero awkward stretched full-width buttons.
