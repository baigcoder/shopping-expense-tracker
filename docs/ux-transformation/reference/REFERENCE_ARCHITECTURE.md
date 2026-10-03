# CASHLY — REFERENCE ARCHITECTURE & SERVICE CATALOG

**System:** Cashly Financial Operating System  
**Document Classification:** Technical Reference & Service Catalog  
**Status:** Canonical & Enforced  

---

## 1. Domain Service Mapping

Every frontend screen and domain component maps directly to verified, operational services:

| Domain | Service / Hook | Key Methods | Live Data Source |
|:---|:---|:---|:---|
| **Transactions & Ledger** | `transactionService.ts` | `getTransactions()`, `createTransaction()`, `updateTransaction()`, `deleteTransaction()`, `splitTransaction()` | Supabase `public.expenses` |
| **Review Inbox & Triage** | `featureExpansionService.ts` | `fetchCandidates()`, `approveCandidate()`, `rejectCandidate()`, `updateCandidate()`, `mergeCandidate()`, `fetchMerchantRules()` | Supabase `public.transaction_candidates`, `public.merchant_rules` |
| **Budgets** | `budgetService.ts` | `getBudgets()`, `createBudget()`, `updateBudget()`, `deleteBudget()` | Supabase `public.budgets` |
| **Commitments & Subscriptions** | `subscriptionService.ts` | `getSubscriptions()`, `createSubscription()`, `updateSubscription()`, `deleteSubscription()` | Supabase `public.subscriptions` |
| **Bills & Reminders** | `billService.ts` | `getBills()`, `createBill()`, `updateBill()`, `deleteBill()`, `markBillAsPaid()` | Supabase `public.bills` |
| **Goals & Milestones** | `goalService.ts` | `getGoals()`, `createGoal()`, `updateGoal()`, `deleteGoal()`, `addContribution()` | Supabase `public.savings_goals` |
| **Cards & Limits** | `cardService.ts` | `getCards()`, `createCard()`, `updateCard()`, `deleteCard()`, `toggleCardFreeze()` | Supabase `public.cards` |
| **Bank Accounts & Net Worth** | `bankAccountService.ts` | `getAccounts()`, `createAccount()`, `updateAccount()`, `deleteAccount()` | Supabase `public.bank_accounts` |
| **Money Twin & Forecasting** | `moneyTwinService.ts` | `generateTwinForecast()`, `calculateDailyBurn()`, `getRunwayHeadroom()` | Client-side financial math heuristics |
| **What-If Simulations** | `whatIfService.ts` | `runScenario()`, `calculateCompoundGrowth()` | Client-side simulation engine |
| **AI Co-Pilot & Coach** | `aiService.ts`, `featureExpansionService.ts` | `getAIResponse()`, `getWeeklyCoachPlan()`, `updateCoachAction()` | Express backend `/api/ai/*`, Groq LLM |
| **Reports & Exports** | `exportService.ts` | `exportToCSV()`, `exportToExcel()`, `exportToPDF()` | Client-side document generators |
| **Statement OCR** | `pdfAnalyzerService.ts` | `analyzePDF()`, `parseStatementRows()` | FastAPI microservice `/ai-server/main.py` |
| **User Settings & OTP** | `settingsApi.ts`, `otpService.ts` | `getSettings()`, `updateSettings()`, `generateOTP()`, `verifyOTP()` | Supabase `public.user_settings` |

---

## 2. Global State Store Architecture (`useStore.ts`)

Zustand store `useStore` manages client-side caching and optimistic updates:
- **`transactions: Transaction[]`**: Local cache of posted ledger rows.
- **`subscriptions: Subscription[]`**: Active recurring SaaS and services.
- **`bills: Bill[]`**: Impending utility, rent, and one-off bills.
- **`budgets: Budget[]`**: Category spending caps.
- **`goals: Goal[]`**: Milestone savings goals.
- **`cards: Card[]`**: Payment cards with spending limits.
- **`totalBalance: number`**, **`monthlySpend: number`**, **`monthlyIncome: number`**: Reactive aggregates updated on ledger mutation.
- **`currency: string`**: User's preferred currency code (`USD`, `EUR`, `PKR`, etc.).

---

## 3. Realtime Multi-Device Event Synchronization

- **Hook:** `useRealtimeSync.ts`
- **Channel:** Supabase Realtime channel listening to table mutations on `expenses`, `transaction_candidates`, `budgets`.
- **Event Bus:** Dispatches custom DOM event `cashly-data-updated` to trigger store hydration across tabs.

---

## 4. Design System CSS Custom Properties

```css
:root {
  --cashly-bg-canvas: #FAF8F5;
  --cashly-bg-surface: #FFFFFF;
  --cashly-bg-subtle: #F5F2EB;
  --cashly-bg-muted: #EDE8DF;
  --cashly-border: #E7E5E4;
  --cashly-border-strong: #D6D3D1;
  --cashly-text-primary: #1C1917;
  --cashly-text-secondary: #57534E;
  --cashly-text-muted: #78716C;
  --cashly-brand: #E11D48;
  --cashly-brand-hover: #BE123C;
  --cashly-brand-light: #FFF1F2;
  --cashly-success: #059669;
  --cashly-warning: #D97706;
  --cashly-danger: #DC2626;
  --shadow-sm: 0 1px 2px rgba(28, 25, 23, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(28, 25, 23, 0.08), 0 2px 4px -2px rgba(28, 25, 23, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(28, 25, 23, 0.08), 0 4px 6px -4px rgba(28, 25, 23, 0.03);
  --r-sm: 6px;
  --r-md: 10px;
  --r-lg: 14px;
  --r-xl: 20px;
  --r-full: 9999px;
}
```
