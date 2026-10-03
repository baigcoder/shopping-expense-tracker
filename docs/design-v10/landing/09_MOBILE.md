# 09 — Mobile Experience & Responsive Architecture (V10)

## 1. Principles
The mobile landing experience is not a squished desktop dashboard. It is an intentionally art-directed, touch-native presentation:
1. **Typographic Hierarchy**:
   - `clamp(40px, 7vw, 96px)` for monumental display titles.
   - Text wraps naturally without awkward orphan breaks or horizontal scrollbars.
2. **Color Blocking Integrity**:
   - Mobile preserves full-width saturated color blocks (Cadmium Orange `#EE5024`, Candy Pink `#F0A1CB`, Deep Ink `#111111`) rather than dissolving into pale generic cards.
3. **Dedicated Interactive Phone Mockup (`MobileShowcase.tsx`)**:
   - Features a realistic smartphone chassis with dynamic island, status bar (9:41), notification bell, and bottom home bar.
   - Provides 5 tabbed sub-screens for instant inspection:
     - `Home`: Safe to Spend indicator, Quick action buttons, and review pending alerts.
     - `Activity`: Clean review queue approval workflow and chronological ledger.
     - `Plan`: Real-time commitment timeline and category envelope balances.
     - `Analyze`: Monthly spending velocity dual-bars and category breakdowns.
     - `Assist`: Live AI co-pilot warning chips with executable action buttons.

## 2. Breakpoint Matrix
- **Mobile Standard (390x844)**: 1-column flow, stacked actions, full-width touch targets.
- **Mobile Large (430x932)**: Expanded padding, high-density typographic scale.
- **Tablet (768x1024)**: 2-column balanced layouts with graceful fallback for horizontal grids.
- **Desktop (1280–1920px)**: 12-column asymmetric grid with sticky transforms and generous negative space.
