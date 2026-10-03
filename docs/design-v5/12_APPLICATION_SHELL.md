# CASHLY — APPLICATION SHELL SPECIFICATION (V5)

**Classification:** Shell & Global Navigation Specification (Authority #12)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Application Shell Structure

The Cashly application workspace operates on a responsive tripartite frame:
1. **Sidebar Navigation (Desktop):** Collapsible/hover-expandable 5-pillar navigation anchor on the left viewport margin.
2. **Universal TopBar (Header):** Contextual screen title, Global Command Palette trigger (`⌘K`), Extension Status Pill, Notification drawer, Theme toggle, and Profile avatar.
3. **Responsive Mobile Navigation (Mobile < 1024px):** Fixed bottom navigation bar with 5 primary touch tabs + Quick Action Floating Button.

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOPBAR: Contextual Page Title | Net Headroom | Extension Pill | ⌘K Search │
├───────────┬────────────────────────────────────────────────────────────┤
│ SIDEBAR   │ MAIN APPLICATION WORKSPACE                                 │
│ [Home]    │                                                            │
│ [Activity]│ (Pillar-Specific Content Canvas)                           │
│ [Plan]    │                                                            │
│ [Analyze] │                                                            │
│ [Assist]  │                                                            │
│           │                                                            │
│ Utilities │                                                            │
│ [Cards]   │                                                            │
│ [Settings]│                                                            │
└───────────┴────────────────────────────────────────────────────────────┘
```

---

## 2. Global Command Palette (`CommandPalette.tsx`)

Triggered via `Cmd+K` (macOS) or `Ctrl+K` (Windows):
- **Search Group:** Deep search across transactions, merchants, and categories.
- **Navigation Group:** Direct jumps to `/dashboard`, `/transactions`, `/transaction-inbox`, `/budgets`, `/subscriptions`, `/money-twin`, `/insights`, `/cards`, `/settings`.
- **Action Group:** `[Add Expense]`, `[Import Bank Statement]`, `[Create Budget]`, `[Set Savings Goal]`, `[Sync Extension]`.
