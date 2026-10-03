# CASHLY RECON — COMPLETE APPLICATION ROUTE MAP

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Audit:** October 2026  
**Status:** Forensic Inventory Complete  

---

## 1. Complete Route Inventory

The application defines 32 distinct URL routes inside `frontend/src/App.tsx`. Below is the complete forensic inventory:

| Route Path | Page Component | Layout Wrapper | Auth / Gate Requirement | Primary State Owners | Backend APIs / Supabase Tables Consumed | Current Navigation Presence | Route Status / Health |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `/` | `LandingPage` | `MarketingNav` + `MarketingFooter` | Public (redirects to `/dashboard` if authenticated) | Local Component State | Public Marketing Content | Top Header Nav | Active |
| `/features` | `FeaturesPage` | `MarketingNav` + `MarketingFooter` | Public | Local Component State | Static feature catalog | Top Header Nav | Active |
| `/privacy` | `PrivacyPolicyPage` | Standalone Page | Public | None | Static policy text | Footer Links | Active |
| `/terms` | `TermsOfServicePage` | Standalone Page | Public | None | Static terms text | Footer Links | Active |
| `/faq` | `FAQPage` | Standalone Page | Public | Local accordion state | Static FAQ data | Footer Links | Active |
| `/contact` | `ContactPage` | Standalone Page | Public | Local form state | Contact submission / Supabase | Footer Links | Active |
| `/login` | `LoginPage` | `AuthLayout` | Public (redirects to `/dashboard` if authed) | `useAuthStore` | Supabase Auth (`signInWithPassword`, `signInWithOAuth`) | Public Header "Sign in" | Active |
| `/signup` | `SignupPage` | `AuthLayout` | Public (redirects to `/dashboard` if authed) | `useAuthStore` | Supabase Auth, `/api/otp/send`, `/api/auth/register` | Public Header "Get started" | Active |
| `/verify-email` | `VerifyEmailPage` | `AuthLayout` | Public / Semi-auth | Local OTP state | `/api/otp/verify`, Supabase Auth | Transition from Signup | Active |
| `/forgot-password` | `ForgotPasswordPage` | `AuthLayout` | Public | Local form state | Supabase Auth (`resetPasswordForEmail`) | Login page link | Active |
| `/auth/callback` | `AuthCallback` | Inline Spinner Shell | OAuth redirect endpoint | `useAuthStore` | Supabase PKCE token exchange (`exchangeCodeForSession`) | Browser OAuth redirect | Active |
| `/dashboard` | `DashboardPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, `useCardStore`, `useModalStore` | `public.transactions`, `budgets`, `cards`, `streakService`, `/api/transaction-inbox` | Sidebar "Overview > Dashboard" / Mobile Nav "Home" | Active (Overloaded) |
| `/transactions` | `TransactionsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | Local state + realtime hook | `public.transactions`, `supabaseTransactionService`, CSV/PDF import modals | Sidebar "Finance > Transactions" / Mobile Nav "Transactions" | Active (Modal-Heavy) |
| `/transaction-inbox` | `TransactionInboxPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | Local candidate state | `/api/transaction-inbox`, `public.transaction_candidates`, `/api/merchant-rules` | Sidebar "Finance > Inbox" / Mobile Hamburger Menu | Active (Critical Differentiator) |
| `/accounts` | `AccountsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local accounts | `bankAccountService`, `public.bank_accounts`, `/api/plaid` | Sidebar "Finance > Accounts" | Active |
| `/cashflow-calendar` | `CashflowCalendarPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | Local events state | `/api/cashflow-calendar` (via `featureExpansionApi`) | Sidebar "Finance > Calendar" / Mobile Hamburger Menu | Active |
| `/budgets` | `BudgetsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuth` hook, local budgets | `public.budgets`, `public.transactions`, `budgetService` | Sidebar "Planning > Budgets" / Mobile Hamburger Menu | Active |
| `/goals` | `GoalsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local goals | `public.goals`, Supabase direct queries | Sidebar "Planning > Goals" / Mobile Hamburger Menu | Active |
| `/bills` | `BillsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local bills | `public.bills`, `billService` | Sidebar "Planning > Bills" | Active (Fragmented with /reminders) |
| `/subscriptions` | `SubscriptionsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local subs | `public.subscriptions`, `/api/subscription-command-center` | Sidebar "Planning > Subscriptions" / Mobile Hamburger Menu | Active |
| `/analytics` | `AnalyticsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local data | `public.transactions`, `/api/analytics` endpoints | Sidebar "Insights > Analytics" / Mobile Nav "Analytics" | Active |
| `/money-twin` | `MoneyTwinPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local twin state | `moneyTwinService`, `whatIfService`, `parallelUniverseService`, `/api/money-twin` | Sidebar "Insights > Money Twin" | Active |
| `/reports` | `ReportsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local reports | `public.transactions`, `public.report_exports`, `exportService` | Sidebar "Insights > Reports" / Mobile Hamburger Menu | Active |
| `/shopping-activity` | `ShoppingActivityPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local telemetry | `localStorage['finzen_site_visits']`, `public.extension_site_stats` | Sidebar "Insights > Shopping" | Active (Brutalist remnant) |
| `/cards` | `CardsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useCardStore`, `useModalStore` | `public.cards`, `cardService`, `LinkedAccountsCard` | Sidebar "System > Cards" / Mobile Nav "Cards" | Active |
| `/extension-health` | `ExtensionHealthPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | Local health state | `/api/extension-health`, `/api/extension-health/events` | Sidebar "System > Extension" / Mobile Hamburger Menu | Active |
| `/reminders` | `BillRemindersPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | Local reminders state | `reminderService`, `recurringPredictionService`, `public.bill_reminders` | Sidebar "System > Reminders" / Mobile Hamburger Menu | Active (Duplicate of /bills) |
| `/insights` | `InsightsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local insights | `smartInsightsService`, `/api/ai/insights`, `/api/coach/current` | Sidebar "Overview > AI Assistant" / Mobile Hamburger Menu | Active (Misnamed in Sidebar) |
| `/settings` | `SettingsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, `useUIStore` | `/api/settings`, Supabase user profile | Sidebar Footer "Settings" / Mobile Hamburger Menu | Active |
| `/setting` | Redirect to `/settings` | None | N/A | N/A | None | URL alias fallback | Redirect Alias |
| `/profile` | `ProfilePage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | `useAuthStore`, local form | `useAuthStore`, Supabase user profile | Sidebar user avatar click | Semi-Hidden (No explicit link) |
| `/expenses` | `ExpenseDetailsPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | Local polling state | `public.transactions`, `public.budgets` (15s interval polling) | **NOWHERE IN NAVIGATION** | **Orphan Duplicate** |
| `/recurring` | `RecurringPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | Hardcoded static data | Static array (`[Gym Membership, Car Insurance]`) | **NOWHERE IN NAVIGATION** | **Dead Dummy View** |
| `/ai-test` | `AITestPage` | `ExtensionGate` > `DashboardLayout` | Authenticated + Extension Gated (Desktop) | Local test state | `/api/ai/chat` (via `getAIResponse`) | **NOWHERE IN NAVIGATION** | **Leaked Dev Test Harness** |

---

## 2. Structural Guard & Gate Hierarchy

All routes under `/dashboard` and its sibling views pass through three nested wrappers:

```
[ Incoming HTTP Request ]
       │
       ▼
 1. Authentication Check (`App.tsx` line 257)
    Is user authenticated in Supabase session or Zustand store?
    ├── NO  ──► Redirect to `/login`
    └── YES ──► Continue to ExtensionGate
       │
       ▼
 2. ExtensionGate (`components/ExtensionGate.tsx`)
    Checks device viewport:
    ├── Mobile Device (<= 768px):
    │   └── Bypasses hard gate, renders dismissible floating toast nudge:
    │       "Extension on mobile: Install Cashly on desktop Chrome for auto-tracking."
    └── Desktop Device (> 768px):
        └── Renders children, but mounts <ExtensionWall /> inside DashboardLayout
       │
       ▼
 3. ExtensionWall (`components/ExtensionWall.tsx`)
    Evaluates:
    `extensionStatus.installed && extensionStatus.loggedIn && sameEmail(extensionStatus.userEmail, user?.email)`
    ├── NO  ──► BLOCKS THE ENTIRE UI WITH AN OPAQUE FULL-SCREEN WALL.
    │           User cannot see or interact with any dashboard route until extension is synced!
    └── YES ──► Yields to `<DashboardLayout>`
       │
       ▼
 4. DashboardLayout (`layouts/DashboardLayout.tsx`)
    ├── Mounts Desktop Sidebar (fixed 68px/248px width)
    ├── Mounts MobileBottomNav (fixed bottom bar on <= 1024px)
    ├── Mounts AddCardModal & TransactionModal portals
    ├── Mounts MobileHelpButton
    ├── Mounts idle-loaded AIChatbot widget
    └── Renders `<Outlet />` inside `<main className="contentWrapper">`
```

---

## 3. Discrepancy & Pathological Route Analysis

### 3.1 Orphan Route: `/expenses` (`ExpenseDetailsPage.tsx`)
- **Forensic Evidence:** Mounted at line 271 of `App.tsx`. Completely absent from `Sidebar.tsx` and `MobileBottomNav.tsx`.
- **Implementation:** 582 lines of duplicate code containing its own custom category palette, its own add expense dialog, its own OCR statement parser, and a 15-second background polling timer (`setInterval(fetchData, 15000)`).
- **Diagnosis:** An earlier iteration of the ledger that was abandoned when `TransactionsPage` was upgraded, but left in the routing table.

### 3.2 Dead Dummy Route: `/recurring` (`RecurringPage.tsx`)
- **Forensic Evidence:** Mounted at line 284 of `App.tsx`. Absent from navigation.
- **Implementation:** 40 lines of static mock data ("Gym Membership $50", "Car Insurance $150").
- **Diagnosis:** A temporary placeholder created before `SubscriptionsPage` and `BillsPage` were built.

### 3.3 Leaked Test Harness: `/ai-test` (`AITestPage.tsx`)
- **Forensic Evidence:** Mounted at line 287 of `App.tsx`.
- **Implementation:** A testing playground with simulated word-by-word streaming for developers to test raw prompt strings against `/api/ai`.
- **Diagnosis:** Internal engineering harness exposed in production routing.

### 3.4 Duplicate Commitment Routes: `/bills` vs `/reminders`
- **Forensic Evidence:** Both mounted in `App.tsx`, both present in `Sidebar.tsx` and `MobileBottomNav.tsx`.
- **Implementation:** `/bills` uses `billService` with table `bills`. `/reminders` uses `reminderService` with table `bill_reminders` and `recurringPredictionService`.
- **Diagnosis:** Severe feature fragmentation. The user is forced to decide whether their electric bill is a "Bill", a "Reminder", a "Subscription", or a "Cashflow event".

### 3.5 Misleading Navigation Label: `/insights` as "AI Assistant"
- **Forensic Evidence:** `Sidebar.tsx` labels `/insights` as "AI Assistant" with the `Brain` icon.
- **Implementation:** `InsightsPage.tsx` does NOT contain an AI conversational assistant. It is a static smart insights dashboard with financial health tips and weekly coach actions. The actual conversational AI is `AIChatbot.tsx`, which floats in the bottom right corner of every page!
- **Diagnosis:** Severe information architecture discordance leading to user disorientation.
