# CASHLY SETTINGS V7 — COMPONENT MODEL & ARCHITECTURE

**Document:** `/docs/design-v7/settings/05_COMPONENT_MODEL.md`  
**Classification:** React Component Architecture & Modular Hierarchy  
**Target:** Cashly Settings Surface (`/settings`)  
**Date:** October 3, 2026  

---

## 1. Component Hierarchy

```tsx
<SettingsPage>
  ├── <SettingsHeader>
  │     ├── Title ("Settings")
  │     ├── Subtitle ("Workspace configuration and security")
  │     └── SignOutButton (quiet, neutral hover)
  │
  ├── <SettingsLayout> (Two-Zone Grid)
  │     ├── <SettingsNavRail> (Left Zone: Desktop Rail / Mobile Horizontal Tabs)
  │     │     ├── NavItem (Account)
  │     │     ├── NavItem (Preferences)
  │     │     ├── NavItem (AI Intelligence)
  │     │     ├── NavItem (Security)
  │     │     ├── NavItem (Data)
  │     │     └── NavItem (Danger Zone)
  │     │
  │     └── <SettingsContentCanvas> (Right Zone)
  │           ├── <AccountSection>
  │           │     ├── AvatarIdentityBadge
  │           │     ├── ProfileForm (Name, Email, Account ID)
  │           │     └── SaveProfileButton
  │           │
  │           ├── <PreferencesSection>
  │           │     ├── <CurrencyHighlightCard> (Base currency, symbol, tabular preview)
  │           │     ├── <SettingsRow> (Sound Effects + Volume Slider + Test Sound)
  │           │     ├── <SettingsRow> (Reduced Motion)
  │           │     ├── <SettingsRow> (Interface Theme)
  │           │     └── <NotificationPreferencesGroup> (Email, Push, Weekly, Monthly)
  │           │
  │           ├── <AISection>
  │           │     ├── <AITelemetryCard> (Active Model, Groq/OpenRouter, Latency Ping)
  │           │     ├── <SettingsRow> (Live Context Grounding)
  │           │     ├── <SettingsRow> (Auto-Refresh Memory)
  │           │     ├── <SettingsRow> (Include Staged Candidates)
  │           │     └── <AIChatMemoryResetAction>
  │           │
  │           ├── <SecuritySection>
  │           │     ├── <PasswordRecoveryRow> ("Send Password Reset Link")
  │           │     ├── <ActiveSessionAuditCard> (IP Address, User Agent, TLS badges)
  │           │     └── <EncryptionPostureBadge>
  │           │
  │           ├── <DataSection>
  │           │     ├── <LedgerExportRow> (CSV, Excel XLSX, PDF Statement)
  │           │     └── <DatabaseSyncStatusRow> (Supabase Postgres RLS)
  │           │
  │           └── <DangerZoneSection>
  │                 ├── WarningCalloutSurface
  │                 ├── TargetCategorySelect (Transactions, Budgets, Subscriptions, Goals)
  │                 └── <DangerPurgeModalTrigger>
  │
  └── <DangerPurgeModal> (Accessible Radix Dialog with 2-step verification)
```

---

## 2. Reusable Primitive: `<SettingsRow>`

```tsx
interface SettingsRowProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  control: React.ReactNode;
  badge?: string;
  isAi?: boolean;
  disabled?: boolean;
}
```
- Standardized layout: Left icon in a 32x32 neutral or semantic box, center text stack (title + description), right control element (Switch, Select, Button, Slider).
- Hover effect: Subtle background change to `--color-surface-subtle` with 150ms transition.

---

## 3. Reusable Primitive: `<CurrencyHighlightCard>`

- Prominent fintech card giving Base Currency primary visual presence.
- Displays:
  - Active Currency Code (e.g. `USD ($)`)
  - Live formatted preview string (`$ 2,450.00`) in `font-mono text-2xl font-bold`
  - Dropdown selector for all 12 supported currencies with fast search/filter.
  - Explanatory note: "All cashflow projections, category budgets, and ledger transactions are normalized to this currency."
