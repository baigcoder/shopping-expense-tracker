# CASHLY SETTINGS V7 — IMPLEMENTATION BLUEPRINT

**Document:** `/docs/design-v7/settings/09_IMPLEMENTATION.md`  
**Classification:** Technical Architecture & Code Implementation Plan  
**Target:** Cashly Settings Surface (`/settings`)  
**Date:** October 3, 2026  

---

## 1. Architectural Strategy

The implementation replaces `frontend/src/pages/SettingsPage.tsx` with a modular, highly polished Two-Zone Financial Control Center. All backend contracts in `settingsApi.ts`, Zustand stores (`useAuthStore`, `useUIStore`), and audio systems (`useSound`) are 100% preserved and fully wired.

```
frontend/src/pages/SettingsPage.tsx
├── State Orchestration:
│   ├── activeTab ('account' | 'preferences' | 'ai' | 'security' | 'data' | 'danger')
│   ├── settingsApi data hydration (profile, preferences, ai, session)
│   ├── optimistic auto-saves for switches and selects
│   └── explicit form submission for profile identity
│
├── Left Navigation Rail (Sticky on desktop, horizontal scrollable pills on mobile)
│   ├── 6 Category Tabs with custom icons, badge counts, and active pills
│   └── Quiet Sign Out action
│
├── Right Content Panels (Modular, tailored visual rhythm per domain)
│   ├── AccountPanel: Avatar identity, Name, Verified Email, Account ID, Save trigger
│   ├── PreferencesPanel: CurrencyHighlightCard, Sound/Motion/Theme rows, Notification toggles
│   ├── AIPanel: Telemetry card, Latency Ping, Context switches, Cache Memory Wipe
│   ├── SecurityPanel: Password reset link, Active Session inspection (IP/UA), Encryption badges
│   ├── DataPanel: Export links (CSV, XLSX, PDF), Database sync telemetry
│   └── DangerPanel: Crimson warning surface, Category select, Accessible Purge Modal trigger
│
└── Accessible Radix Dialog:
    └── DangerPurgeModal (Two-step OTP email verification replacing window.prompt)
```

---

## 2. Validation & Zero-Regression Checkpoints
1. `npm run build` passes with code 0.
2. `npm run lint` passes with 0 errors.
3. `npm run test:run` passes 22/22 unit tests.
4. All 14 currencies from `SUPPORTED_CURRENCIES` selectable and hydrated across the UI.
5. All 7 viewports rendered and visually QA'd.
