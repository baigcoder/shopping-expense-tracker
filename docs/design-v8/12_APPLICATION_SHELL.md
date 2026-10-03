# CASHLY V8 — APPLICATION SHELL ARCHITECTURE

## 1. Tripartite Workspace Topology

The Cashly application workspace is composed of three interconnected zones:

```
┌─────────────────┬────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR        │  TOPBAR                                                                │
│                 ├────────────────────────────────────────────────────────────────────────┤
│  Logo / Brand   │  Page Context • ⌘K Search • Companion Pill • + Quick Add • Profile     │
│  ─────────────  ├────────────────────────────────────────────────────────────────────────┤
│  5 CORE PILLARS │  MAIN WORKSPACE CANVAS                                                 │
│  • Home         │                                                                        │
│  • Activity     │  [Asymmetric Dominant Hero Moment]                                     │
│  • Plan         │                                                                        │
│  • Analyze      │  [High-Density Telemetry & Operation Surface]                          │
│  • Assist       │                                                                        │
│  ─────────────  │                                                                        │
│  UTILITIES      │                                                                        │
│  • Cards/Accts  │                                                                        │
│  • Extension    │                                                                        │
│  • Settings     │                                                                        │
│  ─────────────  │                                                                        │
│  Identity Card  │                                                                        │
└─────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Desktop Sidebar Architecture (`Sidebar.tsx`)
- **Dimensions:** Width `260px` fixed, border-r `1px solid var(--color-border)`.
- **States:** Active pillar indicator highlights in Pine Teal with `2px` left border mark.
- **Identity Block:** Pinned to bottom, displaying active user name, avatar initial, verified email, and accessible single-click sign-out.

---

## 3. Responsive Mobile Bottom Navigation (`MobileBottomNav.tsx`)
- Replaces desktop sidebar below `1024px` width.
- 5 canonical pillar tabs (`Home`, `Activity`, `Plan`, `Analyze`, `Assist`) plus central Quick Action trigger.
- Full safe-area padding for modern iOS/Android handsets (`pb-[max(0.5rem,env(safe-area-inset-bottom))]`).
- Touch targets strictly exceed 44px x 44px.
