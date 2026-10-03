# 07 — LAYOUT GRID SYSTEM & VIEWPORT ARCHITECTURE
**Canonical Path:** `/docs/design-final/07_LAYOUT_GRID_SYSTEM.md`  
**Status:** CANONICAL MASTER  
**Viewports:** Desktop (1920/1440), Tablet (1024/768), Mobile (430/390)

---

## 1. Multi-Device Layout Matrix

Cashly uses adaptive spatial reflow to ensure that whether an operator is on a dual-monitor workstation or an iPhone 13, the visual hierarchy remains authoritative and zero layout truncation occurs.

| Viewport Width | Device Target | Navigation Shell Mode | Primary Canvas Layout | Header Height |
| :--- | :--- | :--- | :--- | :--- |
| **>= 1440px** | Ultra-wide & Desktop | Expanded Left Sidebar (260px) | 65% / 35% Asymmetric Two-Column Grid | 64px Fixed |
| **1024px – 1439px** | Small Desktop / Tablet Landscape | Collapsed Icon Sidebar (80px) | Balanced Two-Column or Single Stack | 64px Fixed |
| **768px – 1023px** | Tablet Portrait | Drawer Flyout / Top Bar | Single-column stacked with horizontal scroll pills | 56px Mobile |
| **<= 767px** | Mobile Smartphone (390–430px) | Floating Capsule Bottom Dock (64px) | 100% Full-bleed Stacked Editorial Cards | 56px Mobile |

---

## 2. Desktop 65/35 Operational Ratio

On desktop screens (`>= 1024px`), the main workspace employs a two-column distribution:
- **Left Column (`lg:col-span-8` / ~66.6% width)**:
  - Centers the primary decision surface.
  - Safe-to-Spend centerpiece or sovereign transaction inbox.
  - Real-time burn pacing curves or Money Twin simulator canvas.
- **Right Column (`lg:col-span-4` / ~33.3% width)**:
  - Houses the telemetry and forward projection rails.
  - Committed recurring bills and subscription renewals.
  - Contextual AI recommendations with one-tap action chips.
  - Rapid-action controls (Quick Transaction Add, CSV statement drag-and-drop).

---

## 3. Mobile Viewport Reflow Rules (390px & 430px)

1. **Zero Horizontal Scroll Blowout**: All containers utilize `w-full max-w-full overflow-hidden` or controlled `overflow-x-auto` with hidden scrollbars for sub-navigation pill bars.
2. **Floating Bottom Capsule Dock**: The desktop sidebar collapses into a floating bottom capsule navigation dock (`fixed bottom-4 left-4 right-4 z-50 bg-[#111111]/95 backdrop-blur-md rounded-full shadow-2xl`) with touch targets >= 44px.
3. **Stacked Hero Monoliths**: Horizontal triptychs and side-by-side columns stack vertically, preserving typographic scale while adjusting font sizes gracefully (`text-4xl` -> `text-2xl`).
4. **Dock Clearance**: All page body wrappers implement padding bottom (`pb-28 md:pb-8`) to prevent floating docks and FABs from occluding bottom content or form submit buttons.
