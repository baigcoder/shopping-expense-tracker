# CASHLY V9 — 17 MOBILE RESPONSIVE SYSTEM
## Tactile Ergonomics & Zero-Overflow Architecture

### 1. Viewport-Specific Engineering

Mobile is engineered intentionally for touch ergonomics rather than simply collapsing desktop containers:
- **Canonical Viewports Tested**:
  - `390x844` (iPhone 12/13/14)
  - `430x932` (iPhone 14/15/16 Pro Max)
  - `768x1024` (iPad Mini / Portrait Tablet)
  - `1024x768` (iPad Landscape)
  - `1280x800` & `1440x900` (Standard Laptop)
  - `1920x1080` (Desktop Full HD)
- **Zero Horizontal Overflow Guarantee**: Strict constraints on all tables (`overflow-x-auto` with native scroll hints), word-wrap safeguards (`overflow-wrap: anywhere`), and safe-area inset padding (`env(safe-area-inset-bottom)`).
- **Tactile Bottom Rail**: 5 canonical touch targets (Home, Activity, Plan, Analyze, Assist) plus quick transaction capture thumb action.
- **Native-Like Bottom Sheets**: Interactive filters and transaction inspections slide upward from the viewport base.
