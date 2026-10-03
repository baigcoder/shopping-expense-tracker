# 22 — MOBILE & RESPONSIVE SPECIFICATIONS
**Canonical Path:** `/docs/design-final/22_MOBILE_AND_RESPONSIVE_SPEC.md`  
**Status:** CANONICAL MASTER  
**Viewports Tested:** 390x844 (iPhone 13/14), 430x932 (iPhone 14/15 Pro Max), 768x1024 (iPad), 1024x768 (iPad Pro), 1440x900 (MacBook), 1920x1080 (Desktop)

---

## 1. Mobile First-Class Philosophy

Cashly on mobile is not a degraded desktop afterthought; it is an optimized handheld financial remote.

### Key Mobile Interaction Standards:
1. **Touch Target Sizing**: All interactive buttons, navigation items, and action triggers have a minimum clickable area of 44px × 44px.
2. **Floating Bottom Capsule Dock**:
   - Anchored at `fixed bottom-4 left-4 right-4 z-50`.
   - Elevated with `backdrop-blur-md bg-[#111111]/95 text-white shadow-2xl rounded-full`.
   - Provides instant 1-tap thumb navigation between Home, Activity, Plan, Analyze, and Assist.
3. **Safe Clearance Padding**:
   - All page views enforce `pb-28 md:pb-8` to ensure no floating dock elements occlude content, bottom submit buttons, or footer rows.
4. **Horizontal Scroll Hygiene**:
   - Sub-navigation bars (`PlanNavigationTabs`, `AnalyzeNavigationTabs`, `SettingsTabs`) scroll smoothly without displaying ugly system scrollbars (`scrollbar-none` or custom thin styling).
   - Zero horizontal overflow on the root document (`overflow-x-hidden`).
