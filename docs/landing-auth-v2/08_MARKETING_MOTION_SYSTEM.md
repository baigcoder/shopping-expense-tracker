# CASHLY — MARKETING MOTION SYSTEM

**Document:** `08_MARKETING_MOTION_SYSTEM.md`  
**Classification:** Motion Principles, Transitions, and Animation Tokens  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Core Motion Philosophy

Motion on the Cashly landing and authentication experience must be **purposeful, physical, and discreet**.

Motion must communicate:
1. **State:** A transaction moving from unreviewed to approved.
2. **Transition:** Navigating between product pillars or demo steps.
3. **Feedback:** Micro-interaction confirmation when buttons are clicked.
4. **Continuity:** Connecting purchase capture directly to budget shifts.

---

## 2. Motion Tokens & Timings

```css
/* Standard Timings */
--duration-fast: 150ms;   /* Button clicks, micro-toggles */
--duration-normal: 250ms; /* Card reveals, tab switches */
--duration-slow: 400ms;   /* Full section transitions, modal sheets */

/* Easing Curves */
--ease-out-calm: cubic-bezier(0.16, 1, 0.3, 1);  /* Natural decelerating entry */
--ease-in-out-calm: cubic-bezier(0.4, 0, 0.2, 1); /* Smooth bidirectional transitions */
```

---

## 3. Product Demonstration Engine Motion Specifications

In `ProductLifecycleDemo.tsx`:
- Step 1 (Capture): Floating simulated checkout badge scales from `0.95` to `1` with opacity fade (`duration: 0.3s`).
- Step 2 (Review): Needs Review card appears in review queue with subtle pulse on the `[Approve]` action button.
- Step 3 (Ledger Post): Card slides into the ledger row (`x: -12px` to `0px`, `opacity: 1`), and the Dining Budget bar increments smoothly from `64%` to `78%` width.
- Step 4 (Money Twin & AI): Runway headroom metric updates, and contextual AI card fades in with highlighted action chips.

---

## 4. Accessibility & Reduced Motion

In compliance with WCAG 2.2 and Rule 9:
- Every animation must respect `prefers-reduced-motion: reduce`.
- When reduced motion is preferred, transitions fallback to instant opacity swaps (`opacity: 1`) without position translations or scale transforms.
