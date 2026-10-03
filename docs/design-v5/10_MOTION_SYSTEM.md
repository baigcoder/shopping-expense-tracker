# CASHLY — MASTER MOTION & INTERACTION PHYSICS (V5)

**Classification:** Physics & Animation Specification (Authority #10)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Motion Philosophy: Causality & Purpose

Motion in Cashly is physical, quiet, and explanations-driven. It exists to communicate **causality and state continuity**, never as gratuitous ornament:

- **Good Motion:** A transaction is approved in the Inbox; the row shifts color to emerald, slides smoothly out of the triage queue, and the pending badge count decrements by 1.
- **Prohibited Motion:** Bouncing modals, spinning cards, continuous pulsating glowing rings, or endless marquee tickers.

---

## 2. Spring Physics Tokens

Cashly utilizes standard Framer Motion spring presets tailored for mathematical responsiveness:

```typescript
// Snappy, authoritative feedback for buttons, toggles, and drawer slides
export const SPRING_SNAPPY = {
  type: 'spring',
  stiffness: 450,
  damping: 35,
  mass: 0.8,
} as const;

// Smooth layout transitions for accordion expansion and bento shifts
export const SPRING_GENTLE = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
  mass: 1.0,
} as const;

// Instant micro-fade for tooltips and badges
export const FADE_MICRO = {
  duration: 0.15,
  ease: [0.32, 0.72, 0, 1],
} as const;
```

---

## 3. Accessibility & Reduced Motion

In strict compliance with WCAG 2.2 AA and `prefers-reduced-motion: reduce`:
- When reduced motion is detected, all transitions collapse to instant or 0.01ms duration.
- State changes occur instantaneously without sliding or zooming effects.
