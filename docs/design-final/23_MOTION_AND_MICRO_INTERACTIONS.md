# 23 — MOTION & MICRO-INTERACTION PHYSICS
**Canonical Path:** `/docs/design-final/23_MOTION_AND_MICRO_INTERACTIONS.md`  
**Status:** CANONICAL MASTER  
**Motion Library:** Framer Motion 11.x, CSS Transitions  
**Physics Curves:** Spring Physics, Cubic-Bezier Easings

---

## 1. Motion Philosophy: Subtle Architectural Authority

Cashly’s motion language is intentional, crisp, and weighted. Interfaces feel like precision mechanical instruments rather than bouncy cartoons.

### Standard Timing Tokens:
- **Instant Response (Hover & Focus)**: `120ms – 160ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Surface Transitions (Tabs, Sliders)**: `200ms – 240ms ease-out`
- **Modal Dialog Enters**: `300ms cubic-bezier(0.16, 1, 0.3, 1)` (spring-like scale from 0.98 to 1.0 with subtle alpha fade)
- **Reduced Motion Support**: All motion responds to `prefers-reduced-motion: reduce` by degrading gracefully to instant opacity fades.

---

## 2. Micro-Interaction Highlights

1. **Button Hover States**:
   - Subtle vertical translation (`transform: translateY(-1px)`) paired with shadow deepening.
   - Zero aggressive scaling or glow pulsations.
2. **Tabular Number Rollers (`react-countup`)**:
   - Numbers ease smoothly on mount without jitter or layout shifting.
3. **Review Inbox Swipe & Triage**:
   - Dismissing an item from the review queue triggers a smooth collapse of the row (`opacity: 0, height: 0`), promoting the next transaction to the top of the stack.
