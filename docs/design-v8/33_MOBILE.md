# CASHLY V8 — MOBILE ERGONOMICS & RESPONSIVE GEOMETRY

## 1. First-Class Mobile Design

Mobile is not a responsive afterthought or stacked desktop desktop dump. Every screen is designed intentionally for one-handed operation.

### Viewport Targets Validated:
- **390x844** (iPhone 12 / 13 / 14 / 15)
- **430x932** (iPhone 14 / 15 / 16 Pro Max)
- **768x1024** (iPad Mini / Portrait Tablets)
- **1024x768** (Tablet Landscape)
- **1440x900** (Standard Desktop Workspace)
- **1920x1080** (Full HD Executive Displays)

---

## 2. Touch & Reach Zone Specifications

1. **Bottom Navigation Bar:**
   - 5 canonical pillars (`Home`, `Activity`, `Plan`, `Analyze`, `Assist`) + Quick Action Trigger.
   - Pinned to bottom with safe-area bottom margin.
   - Active indicator dot centered below label.
   - Touch targets >= 48px x 44px.
2. **Horizontal Tab Navigation:**
   - All sub-navigation tabs (`PlanNavigationTabs`, `AnalyzeNavigationTabs`) use `shrink-0` to avoid text collisions.
3. **Floating Controls:**
   - AI Chatbot FAB positioned at `bottom: 5.25rem; right: 1rem` on mobile, safely clear of the bottom navigation bar.
   - Mobile platform guide positioned at `bottom: 5rem; left: 1rem` with a subtle, non-intrusive circular icon.
