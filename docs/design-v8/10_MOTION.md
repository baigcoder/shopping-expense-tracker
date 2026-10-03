# CASHLY V8 — MOTION SYSTEM & INTERACTION PHYSICS

## 1. Functional Motion Philosophy

In Cashly V8, motion is used strictly to **explain cause and effect**, establish spatial continuity, and clarify data transitions.

**Banned:**
- Decorative endless floating animations.
- Bouncy cartoon spring dynamics.
- Full-page jarring disorientations.
- Parallax scrolls that distract from numerical data.

---

## 2. Timing & Easing Curves

```css
--motion-instant: 100ms cubic-bezier(0.16, 1, 0.3, 1);  /* Button presses, toggle states */
--motion-fast:    180ms cubic-bezier(0.16, 1, 0.3, 1);  /* Tooltips, dropdowns, checkmarks */
--motion-normal:  280ms cubic-bezier(0.16, 1, 0.3, 1);  /* Side sheets, drawer slide-overs */
--motion-slow:    450ms cubic-bezier(0.16, 1, 0.3, 1);  /* Chart curve morphs, trajectory simulations */
```

---

## 3. Accessible Reduced Motion Guarantee

All motion respects user system accessibility settings:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
All Framer Motion primitives check `useReducedMotion()` and degrade gracefully to instant opacity cutaways.
