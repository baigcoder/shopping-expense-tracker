# CASHLY SETTINGS V7 — RESPONSIVE & MOBILE DESIGN SPECIFICATION

**Document:** `/docs/design-v7/settings/07_RESPONSIVE_MODEL.md`  
**Classification:** Responsive Layout Architecture & Mobile UX  
**Target:** Cashly Settings Surface (`/settings`)  
**Date:** October 3, 2026  

---

## 1. Breakpoint Breakdown

| Viewport Range | Devices | Settings Layout Strategy |
|---|---|---|
| **Mobile (320px – 639px)** | iPhone 14/15 (390x844), Pro Max (430x932), Android | Single-column stacked. Horizontal touch-scrollable pill navigation at top. Sticky action footer. Touch targets >= 44px. Desktop sidebar hidden. |
| **Tablet Portrait (640px – 767px)** | iPad Mini, Small Tablets | Single-column with compact segmented control for section switching. Form grids collapse to 1 column. |
| **Tablet Landscape (768px – 1023px)** | iPad (1024x768), Tablets | Compact navigation rail (64px icon-only or 180px narrow text) + responsive content canvas. |
| **Desktop (1024px – 1439px)** | Laptops (1280x800) | Two-Zone Layout: 240px sticky left navigation rail + 800px content canvas. |
| **Large Desktop (1440px – 2560px)** | MacBook Pro 16", 1080p, Ultrawide | Two-Zone Layout: 260px sticky left navigation rail + 920px content canvas, cleanly centered in workspace without awkward horizontal stretch. |

---

## 2. Mobile Touch Architecture (< 768px)

1. **Section Switcher:**
   - Positioned directly beneath the page header as a horizontal scrollable pill bar (`overflow-x-auto no-scrollbar`).
   - Active pill uses `--color-surface` with shadow-xs and border, inactive pills use subtle hover states.
   - Snaps to selection smoothly on tap.
2. **Settings Rows on Mobile:**
   - Stack labels and controls cleanly: on narrow screens (390px), switches stay aligned right while descriptions wrap with readable line-height (1.4).
   - Dropdowns expand into touch-friendly bottom sheets or native-styled Radix menus with 48px row heights.
3. **Safe Area & Bottom Navigation Isolation:**
   - Extra bottom padding (`pb-28`) ensures content is completely clear of the `MobileBottomNav` bar and floating action buttons.
