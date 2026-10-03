# CASHLY — RESPONSIVE DESIGN STRATEGY

**Document:** `09_RESPONSIVE_STRATEGY.md`  
**Classification:** Breakpoint Matrix & Device Adaptation Guidelines  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Breakpoint Grid

The public landing and authentication screens are engineered to adapt seamlessly across 4 core viewport classes:

| Class | Viewport Range | Device Examples | Key Layout Behavior |
|:---|:---|:---|:---|
| **Mobile** | $320\text{px} - 639\text{px}$ | iPhone 14/15/16, Pixel, Galaxy | Single-column stack, full-bleed cards, touch targets $\ge 44\text{px}$, bottom safe areas. |
| **Tablet** | $640\text{px} - 1023\text{px}$ | iPad, iPad Mini, Surface Go | 2-column bento grids, collapsed nav with drawer, compact demo states. |
| **Desktop** | $1024\text{px} - 1439\text{px}$ | MacBook Air/Pro, 1080p displays | 2-column split hero, full horizontal nav, side-by-side interactive demo. |
| **Wide / Ultra** | $1440\text{px}+$ | 1440p, 4K monitors | Centered max-width container (`max-w-6xl` / `max-w-7xl`), generous editorial spacing. |

---

## 2. Intentional Mobile Adaptations

Rather than shrinking desktop views, mobile receives purpose-built ergonomics:
1. **Interactive Demo on Mobile:** Re-architected into a swipeable/steppable card deck with clear next/prev pills so mobile users can step through `Capture` → `Review` → `Ledger` → `Budget` without horizontal scroll clipping.
2. **Thumb-Zone Navigation:** Mobile navigation drawer drops down cleanly with large tappable rows and prominent `Sign in` and `Get started` CTAs.
3. **Auth Mobile Layout:** `AuthLayout.tsx` switches gracefully from split-screen to a streamlined single-column card with safe-area bottom padding (`env(safe-area-inset-bottom)`).
4. **Touch Targets:** All interactive buttons, chips, and links enforce `min-height: 44px` and `min-width: 44px`.
