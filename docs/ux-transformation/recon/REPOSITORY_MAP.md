# CASHLY RECON — REPOSITORY ARCHITECTURE MAP

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Audit:** October 2026 (Forensic Reconstruction Mode)  
**Status:** Completed Analysis — Zero Code Changes  

---

## 1. High-Level System Architecture

Cashly is built as a multi-tier, AI-augmented personal finance operating system composed of five interconnected sub-systems:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CASHLY SYSTEM TOPOLOGY                         │
└────────────────────────────────────────────────────────────────────────┘

    [ Browser Extension (MV3 Chrome / MV2 Firefox) ]
         │ (DOM Scraper / Checkout Interceptor)
         ▼ (postMessage / window event / local storage bridge)
    [ React 18 SPA Frontend (Vite + TS + Tailwind + Zustand) ]
         │                                       ▲
         │ (REST / JWT)                          │ (Supabase Realtime WebSockets)
         ▼                                       ▼
    [ Express API Backend (Node.js + Prisma) ] ──► [ Supabase PostgreSQL (Postgres 15 + RLS) ]
         │                      │                               ▲
         │ (FastAPI Proxy / OCR)│ (OpenRouter / Groq LLMs)      │
         ▼                      ▼                               │
    [ AI Microservice ]    [ Redis Cloud Cache ]                │
    (FastAPI + Python)     (Insights / Forecasts)               │
         │                                                      │
         └──────────────────────────────────────────────────────┘
```

---

## 2. Directory Breakdown & Subsystem Inventory

### 2.1 Workspace Structure

| Subsystem / Path | Primary Tech Stack | Purpose & Runtime Role | Key Files |
|:---|:---|:---|:---|
| `/frontend` | React 18.3, Vite 5.4, TypeScript 5.6, Tailwind CSS 4.0, Zustand 5.0, Framer Motion 11 | Single Page Web App (Dashboard, Ledger, Inbox, Analytics, Planners) | `src/App.tsx`, `src/index.css`, `src/store/useStore.ts`, `src/layouts/DashboardLayout.tsx` |
| `/backend` | Node.js (v18+), Express 4.21, Prisma 5.22, Zod 3.23, ioredis 5.8, Plaid SDK 40.0 | Core REST API, transaction ingestion, rule evaluation, Plaid banking, AI grounding | `src/server.ts`, `src/app.ts`, `src/routes/index.ts`, `prisma/schema.prisma` |
| `/ai-server` | Python 3.10+, FastAPI, PyMuPDF (fitz), pdfplumber, edge-tts (Microsoft Neural Voices) | Bank statement PDF OCR & table extraction, local neural text-to-speech engine | `main.py`, `Dockerfile`, `requirements.txt` |
| `/backend/extension` & `/frontend/public/extension` | Chrome Manifest V3, Firefox Manifest V2, Vanilla JS, Chrome Storage API | Browser purchase detection (Amazon, Daraz, Shopify, Stripe, etc.), offline queue, sync bridge | `background.js`, `content.js`, `content-website.js`, `popup.html`, `popup.js` |
| `/supabase` | PostgreSQL 15, Supabase Auth (GoTrue), Supabase Storage, Realtime Engine | Primary transactional database, Row Level Security policies, database triggers, migrations | `migrations/complete_schema.sql`, `migrations/20260430_feature_expansion.sql` |
| `/Models` | Machine Learning artifacts / reference configs | Categorization weights & legacy reference models | Model binary / metadata configs |
| `/scripts` | Node.js / Bash scripts | Database seeding, schema sync, test utilities | Database maintenance scripts |

---

## 3. Frontend Architecture Map

### 3.1 Routing & Code Splitting (`frontend/src/App.tsx`)

The frontend uses `react-router-dom` v6 with lazy-loaded page chunks (`lazy` + `Suspense`):

- **Auth Chunks:** `LoginPage`, `SignupPage`, `ForgotPasswordPage`, `VerifyEmailPage`, `AuthCallback`
- **Dashboard Shell:** Wrapped in `<ExtensionGate>` and `<DashboardLayout>`
- **Page Inventory (26 pages):**
  - `/dashboard` → `DashboardPage`
  - `/transactions` → `TransactionsPage`
  - `/transaction-inbox` → `TransactionInboxPage`
  - `/analytics` → `AnalyticsPage`
  - `/cards` → `CardsPage`
  - `/expenses` → `ExpenseDetailsPage` *(Orphan / duplicate view)*
  - `/profile` → `ProfilePage`
  - `/settings` & `/setting` → `SettingsPage`
  - `/budgets` → `BudgetsPage`
  - `/bills` → `BillsPage`
  - `/subscriptions` → `SubscriptionsPage`
  - `/goals` → `GoalsPage`
  - `/insights` → `InsightsPage` *(Sidebar label: "AI Assistant")*
  - `/reports` → `ReportsPage`
  - `/cashflow-calendar` → `CashflowCalendarPage`
  - `/extension-health` → `ExtensionHealthPage`
  - `/recurring` → `RecurringPage` *(Placeholder static dummy)*
  - `/accounts` → `AccountsPage`
  - `/money-twin` → `MoneyTwinPage`
  - `/ai-test` → `AITestPage` *(Exposed test harness)*
  - `/shopping-activity` → `ShoppingActivityPage`
  - `/reminders` → `BillRemindersPage` *(Duplicate of /bills)*
- **Public / Marketing Chunks:** `LandingPage`, `FeaturesPage`, `PrivacyPolicyPage`, `TermsOfServicePage`, `FAQPage`, `ContactPage`

### 3.2 State Ownership Architecture

Cashly utilizes a hybrid state management model across four tiers:

```
 Tier 1: Zustand Global Stores (`frontend/src/store/useStore.ts`)
 ├── useAuthStore (user profile, auth token status, localStorage 'auth-storage')
 ├── useUIStore (sidebarOpen, sidebarHovered, theme, currency, isChatOpen, soundEnabled, reducedMotion)
 ├── useModalStore (isAddTransactionOpen, isAddCardOpen, isQuickAddOpen, editingTransaction)
 └── useCardStore (cards array, currentUserId, card CRUD via cardService)

 Tier 2: Custom Event Bus (`frontend/src/services/financialDataEvents.ts`)
 ├── Events: 'cashly-data-updated', 'transaction-added', 'transaction-candidate-added', 
 │           'analytics-data-changed', 'card-added', 'subscription-changed'
 └── Purpose: Cross-component synchronizer decoupling sidebar, navbar badges, charts, and lists.

 Tier 3: Supabase Realtime Channels (`frontend/src/hooks/useRealtimeSync.ts`, `useRealtime.ts`)
 ├── postgres_changes: transactions, transaction_candidates, budgets, goals, cards, notifications
 └── Purpose: Instant UI sync upon background capture from the browser extension or webhook.

 Tier 4: Component-Local State (`useState` / `useCallback`)
 └── Found in almost every page for filtering, sorting, tab indices, dialog toggles, and form drafts.
```

### 3.3 Service Layer Inventory (`frontend/src/services/`)

The application contains **45 service modules** encapsulating Supabase direct queries, backend REST client calls, and local heuristic engines:

1. **Transaction & Ledger Domain:**
   - `supabaseTransactionService.ts`: Direct Supabase CRUD for `public.transactions` with in-memory caching.
   - `transactionService.ts`: Secondary transaction client querying `/api/transactions`.
   - `featureExpansionApi.ts`: Ingestion and approval client for `/api/transaction-inbox` and `/api/merchant-rules`.
   - `merchantCategorizationService.ts`: Heuristic rule-based categorization.
   - `csvImportService.ts` & `pdfAnalyzerService.ts`: Client-side parsing, OCR text parsing, staging table converters.
   - `exportService.ts`: Client-side CSV/Excel/PDF export generator.

2. **Planning & Liabilities Domain:**
   - `budgetService.ts`: Direct Supabase CRUD for `public.budgets`.
   - `goalService.ts`: Direct Supabase CRUD for `public.goals`.
   - `billService.ts`: Direct Supabase CRUD for `public.bills`.
   - `reminderService.ts`: CRUD for `public.bill_reminders`.
   - `recurringService.ts`: CRUD for `public.recurring_transactions`.
   - `recurringPredictionService.ts`: Algorithmic recurring pattern detector.
   - `subscriptionService.ts`: CRUD for `public.subscriptions` with trial expiration calculation.

3. **Intelligence & AI Domain:**
   - `aiService.ts`: Client to `/api/ai` endpoints (`/insights`, `/forecast`, `/risks`, `/chat`, `/voice-action`).
   - `smartInsightsService.ts`: Client-side heuristic fallback for financial advice.
   - `aiTipCacheService.ts`: LocalStorage caching for AI tip banners.
   - `aiDataCacheService.ts`: In-memory context cache sent to AI to minimize database queries.
   - `moneyTwinService.ts`: 32KB service calculating daily burn rate, headroom, runway, and financial twin state.
   - `whatIfService.ts`: Scenario simulation engine (e.g., cancel subscription, salary increase).
   - `parallelUniverseService.ts`: Alternate timeline projection engine.
   - `voiceTts.ts`: Edge-TTS audio stream consumer.

4. **Hardware & Extension Domain:**
   - `extensionService.ts`: Browser extension presence detection and window message bridge.
   - `bankAccountService.ts` & `plaidService.ts`: Plaid link token generation and account sync.
   - `cardService.ts`: Encrypted CVV, card validation, and theme mapping.
   - `soundService.ts` & `notificationSoundService.ts`: Audio synthesis and UI sound effects (`/public/sounds/`).

---

## 4. Backend Architecture Map (`/backend`)

### 4.1 Server Pipeline (`backend/src/app.ts`)

- **Server Stack:** Express 4.21, TypeScript, Helmet security headers, CORS with credentials.
- **Middleware Chain:**
  1. `helmet()` with tailored CSP for extension bridges.
  2. `cors()` with origin reflection for localhost, production Vercel domains, and Chrome extension IDs.
  3. `express.json({ limit: '10mb' })` & `express.urlencoded()`.
  4. Custom request sanitization (`middleware/security.js`).
  5. Route mounting under root `/api` and `/` via `routes/index.ts`.
  6. Centralized `errorHandler` converting Zod and database exceptions to structured JSON.

### 4.2 API Route Map & Mount Points

| Route Prefix | Source File | Responsibilities | Key Middlewares |
|:---|:---|:---|:---|
| `/api/auth` | `routes/auth.routes.ts` | Supabase auth profile synchronization, user bootstrap | `authMiddleware` |
| `/api/otp` | `routes/otp.routes.ts` | Email OTP verification for signups and critical actions | Rate limit |
| `/api/transactions` | `routes/transaction.routes.ts` | Approved ledger CRUD, detected purchase endpoint (`/detected`) | `authMiddleware`, `validate` |
| `/api/transaction-inbox` | `routes/transactionInbox.routes.ts` | Staging queue for candidate purchases, bulk approve, reject, merge | `authMiddleware`, `validate` |
| `/api/merchant-rules` | `routes/merchantRules.routes.ts` | Auto-approval and auto-categorization rule engine | `authMiddleware`, `validate` |
| `/api/imports` | `routes/imports.routes.ts` | Bank statement session staging, row parsing, batch commit | `authMiddleware`, `validate` |
| `/api/dashboard` | `routes/dashboard.routes.ts` | Aggregated financial snapshot (balances, burn rates, counts) | `authMiddleware` |
| `/api/money-twin` | `routes/moneyTwin.routes.ts` | Forecast generation and risk indicators | `authMiddleware` |
| `/api/analytics` | `routes/analytics.routes.ts` | Monthly trends, store rankings, category distribution | `cacheControl('dynamic')` |
| `/api/cards` | `routes/card.routes.ts` | Multi-card storage, CVV encryption, spending caps | `authMiddleware` |
| `/api/plaid` | `routes/plaid.routes.ts` | Plaid Link token exchange, account balances, transaction sync | `authMiddleware` |
| `/api/ai` | `routes/ai.ts` | LLM streaming/chat (`/chat`, `/chat/fast`), insights, voice actions | `aiChatLimiter`, Redis cache |
| `/api/voice` | `routes/voice.routes.ts` | Voice preferences, ElevenLabs signed URLs, Edge-TTS proxy | `ttsLimiter` |
| `/api/settings` | `routes/settings.routes.ts` | User preferences, AI memory toggles, data reset OTP | `authMiddleware` |
| `/api` (Root) | `routes/featureExpansion.routes.ts` | Extension health logs, cashflow calendar, subscription command center, reports, coach plans | `authMiddleware` |

---

## 5. AI Server Architecture (`/ai-server`)

- **Tech Stack:** Python 3.10+, FastAPI, Uvicorn, PyMuPDF, pdfplumber, edge-tts.
- **Port:** 8000 (configurable via `PORT` environment variable).
- **Primary Capabilities:**
  - **`POST /api/extract-text`**: Multipart upload handling PDF bank statements using `pdfplumber` or `fitz`. Extracts raw text, table structures, and potential transaction rows.
  - **`POST /api/parse-document`**: Uses heuristics or Groq/OpenRouter LLM prompts to extract structured transaction JSON (`date`, `description`, `amount`, `category`, `type`).
  - **`POST /api/tts`**: Microsoft edge-tts neural voice synthesizer delivering low-latency audio streams (`StreamingResponse` with audio/mpeg).
  - **Fallback System:** Automatically falls back to local regex extraction if Groq/OpenRouter API keys are missing or exhausted.

---

## 6. Browser Extension Architecture (`/backend/extension`)

The extension enables Cashly's core value proposition: **automatic purchase capture directly from web checkouts**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   BROWSER EXTENSION ARCHITECTURE                       │
└────────────────────────────────────────────────────────────────────────┘

 [ Content Script: content.js ] 
  ├── Active on: 25+ e-commerce platforms (Amazon, Daraz, Shopify, Stripe, etc.)
  ├── Interception: DOM mutation observers + form submit listeners + URL pattern matching
  └── Extraction: Merchant, price, currency, order items, checkout timestamp

       │ (chrome.runtime.sendMessage)
       ▼
 [ Background Service Worker: background.js ]
  ├── Offline Queue: IndexedDB / chrome.storage.local holds pending captures
  ├── Token Store: Holds user's Supabase JWT passed from web app
  ├── Sync Engine: Dispatches POST to `/api/transaction-inbox/candidates` or `/api/transactions/detected`
  └── Heartbeat: Pings `/api/health` and logs telemetry to `/api/extension-health/events`

       │ (window.postMessage / CustomEvents)
       ▼
 [ Web App Bridge: content-website.js ]
  ├── Injected on Cashly web application pages
  ├── Bridges auth tokens between React app and extension (`CASHLY_EXTENSION_SYNC`)
  └── Notifies React app of active capture events (`transaction-candidate-added`)
```

---

## 7. Database & Supabase Data Model

The production database is hosted on Supabase (PostgreSQL 15) with Row Level Security (RLS) enabled on all tables:

1. `public.cards`: Card metadata, encrypted CVV, brand, theme, spending limit.
2. `public.transactions`: Canonical financial ledger (approved income & expenses).
3. `public.transaction_candidates`: Inbox staging table holding unapproved captures from the extension, statement imports, and AI scrapers.
4. `public.merchant_rules`: Pattern matching rules (`exact`, `contains`, `regex`) for automated triage and categorization.
5. `public.import_sessions`: Batch metadata for uploaded CSV, PDF, and Excel statements.
6. `public.import_rows`: Parsed line items waiting for user confirmation before posting to `transaction_candidates`.
7. `public.budgets`: Category spending limits and tracking periods (monthly, weekly).
8. `public.goals`: Savings targets, deadlines, target amounts, and accumulated savings.
9. `public.subscriptions`: Recurring services with trial tracking (`trial_start_date`, `trial_end_date`, `status`).
10. `public.bills`: Recurring and one-time bills, payment status, and due dates.
11. `public.bill_reminders`: Scheduled alerts for upcoming liabilities.
12. `public.recurring_transactions`: Auto-recurring transaction generation definitions.
13. `public.bank_accounts`: Linked financial institutions (Plaid balances and accounts).
14. `public.reports` & `public.report_exports`: Generated and archived financial statements.
15. `public.extension_health_events` & `public.extension_site_stats`: Extension monitoring and telemetry.
16. `public.coach_plans` & `public.coach_actions`: Weekly AI financial coaching tasks.
17. `public.notifications`: In-app system alerts, overspending warnings, and trial conversion alerts.
18. `public.user_settings`: User configuration, AI live toggle, currency, sound settings.
