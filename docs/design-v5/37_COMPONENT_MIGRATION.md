# CASHLY — COMPONENT MIGRATION MATRIX (V5)

**Classification:** Component Refactoring & Migration Specification (Authority #37)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Migration Inventory

| Component File | Prior Architecture | Target V5 Architecture | Status |
| :--- | :--- | :--- | :--- |
| `TransactionSideSheet.tsx` | Stacked modal dialogs on `/transactions` | Fluid 480px slide-over drawer with receipt inspection & edit controls | **Deployed** |
| `PlanNavigationTabs.tsx` | Disconnected sub-pages for budgets, bills, goals | Unified pill bar with sliding active indicator across all Plan views | **Deployed** |
| `AnalyzeNavigationTabs.tsx` | Isolated analytics, money-twin, and reports | Synchronized sub-navigation across all Analyze views | **Deployed** |
| `ExtensionStatusPill.tsx` | Full-screen blocking `ExtensionWall.tsx` | Quiet, non-blocking telemetry indicator in universal TopBar | **Deployed** |
| `ShoppingActivityPage.tsx` | Stark brutalist CSS module (`ShoppingActivityPage.module.css`) | Refactored with Calm Finance `Surface`, `Badge`, and tabular typography | **In Progress** |
| `AIChatbot.tsx` | Floating chat bubble with generic text trivia | Contextual Co-Pilot generating deep-linked structured action buttons | **Deployed** |
| `TopBar.tsx` | Minimal header | High-utility topbar with page context, headroom, and command palette | **Deployed** |
| `Sidebar.tsx` | 15-item flat navigation list | 5-pillar hierarchical sidebar with hover-expand and live badges | **Deployed** |
| `MobileBottomNav.tsx` | 10-item overflow drawer | 5-pillar native thumb-bar with 52px tap targets and safe areas | **Deployed** |
