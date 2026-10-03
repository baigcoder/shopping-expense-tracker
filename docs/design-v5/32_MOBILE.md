# CASHLY — MOBILE ERGONOMICS & NATIVE PATTERNS (V5)

**Classification:** Responsive & Mobile Architecture Specification (Authority #32)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Mobile Philosophy: No "Stacked Desktop"

Mobile interfaces must never feel like a wide desktop layout mechanically forced into a 390px column. Cashly introduces mobile-native patterns:

1. **Fixed 5-Pillar Bottom Bar (`MobileBottomNav.tsx`):**
   - Direct thumb-accessible touch targets for `Home`, `Activity`, `Plan`, `Analyze`, and `Assist`.
   - Minimum tap target height: `52px` (well exceeding Apple HIG minimum of 44px).
   - Inset safe-area support (`env(safe-area-inset-bottom, 16px)`).
2. **Contextual Bottom Sheets:**
   - On screens `< 768px`, all slide-over drawers (`TransactionSideSheet`, filter drawers) seamlessly convert to fluid bottom sheets with drag handles.
3. **Horizontal Swiping for Tabbed Sub-Views:**
   - Sub-navigation bars (`PlanNavigationTabs`, `AnalyzeNavigationTabs`) support horizontal inertia scrolling with hidden scrollbars and active tab indicator snapping.
