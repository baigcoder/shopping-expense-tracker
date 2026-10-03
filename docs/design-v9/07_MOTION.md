# CASHLY V9 — 07 MOTION SYSTEM
## Purposeful Physics, Causality & Micro-Interactions

### 1. Motion Principles

Motion in Cashly V9 serves an explanatory purpose: **Motion explains causality**. It is never applied for ornamental or whimsical distraction.

1. **Transaction Lifecycle Causality**:
   When a user clicks "Approve" on an unverified transaction:
   - The queue item shifts into a verified badge with a 140ms crisp spring.
   - The verified balance immediately increments on the Safe-to-Spend counter.
   - The budget progress bar recalculates in real time.
2. **Speed & Physical Weight**:
   - Micro-interactions (hover, button press, toggle): `120ms – 160ms` with ease-out curve.
   - Layout transitions & side sheets: `260ms – 340ms` with spring damping (`stiffness: 380, damping: 32`).
   - Complex chart expansions: `400ms` with cubic bezier `(0.16, 1, 0.3, 1)`.
3. **Respect for Accessibility**:
   - Strictly obeys `prefers-reduced-motion: reduce`. All transforms and animated transitions collapse to instantaneous opacity swaps or static views.
