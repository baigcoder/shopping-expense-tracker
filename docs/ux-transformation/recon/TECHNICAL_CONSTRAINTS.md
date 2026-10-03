# CASHLY RECON — TECHNICAL CONSTRAINTS & BOUNDARIES

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Audit:** October 2026  
**Status:** Complete Technical & Architecture Boundary Analysis  

---

## 1. Security & Compliance Boundaries

### 1.1 Supabase Row Level Security (RLS)
- **Constraint:** Every database table (`transactions`, `transaction_candidates`, `budgets`, `goals`, `subscriptions`, `cards`, etc.) enforces PostgreSQL RLS policies where `auth.uid() = user_id`.
- **Architectural Rule:** The frontend cannot query across users, and service-role keys must NEVER be bundled into the client Vite bundle. Client queries rely on the authenticated user’s JWT bearer token.

### 1.2 PCI-DSS & Digital Card Vault Storage
- **Constraint:** `public.cards` stores card metadata.
- **Compliance Rules:**
  - Full primary account numbers (PAN) must NEVER be persisted in plain text.
  - The database only stores `last4` (e.g., `4242`), `holder`, `expiry`, and `card_type`.
  - Client-side encryption for CVV (`cvv_encrypted`) must only decrypt transiently when prompted by the user's local password.
  - The redesign must preserve this zero-knowledge card storage architecture.

### 1.3 Strict Zod API Validation
- **Constraint:** All backend REST mutations (`POST`, `PUT`, `PATCH`) in `backend/src/validators/schemas.ts` strictly validate inputs with Zod (e.g., `createTransactionSchema`, `approveCandidateSchema`, `detectedTransactionSchema`).
- **Architectural Rule:** Frontend form payloads and state structures must strictly adhere to existing Zod schemas to prevent breaking API contracts.

---

## 2. Browser & Extension Platform Constraints

### 2.1 The Mobile Extension Reality
- **Platform Constraint:** Desktop Chrome, Edge, and Firefox support browser extensions (Manifest V3 / Manifest V2). Mobile browsers (iOS Safari, Android Chrome) do NOT support desktop unpacked extensions or Chrome Storage APIs in the same manner.
- **Architectural Implication:**
  - Cashly CANNOT make extension installation a hard requirement for mobile users.
  - Desktop also cannot be locked behind `ExtensionWall` because users frequently log in from restricted devices, secondary browsers, or before they have installed the companion extension.
  - The extension must be positioned as a **high-value capture accelerator**, while the web app must remain 100% functional standalone.

### 2.2 MV3 Service Worker Lifecycles & PostMessage Bridge
- **Platform Constraint:** In Chrome Manifest V3, `background.js` runs as an ephemeral service worker that terminates after 30 seconds of inactivity.
- **Architectural Rule:**
  - Communication between the web application and the extension relies on `window.postMessage` bridged by `content-website.js`.
  - Token synchronization must be idempotent and withstand service worker wakeup latencies.

---

## 3. AI Server, Latency & Rate Limits

### 3.1 LLM Timeout Thresholds (`backend/src/routes/ai.ts`)
- **Configured Constants:**
  - `AI_CONTEXT_TIMEOUT_MS = 3500` (3.5 seconds)
  - `AI_FEATURE_TIMEOUT_MS = 10000` (10 seconds)
- **Architectural Rule:**
  - If financial context aggregation takes longer than 3.5s, the system must gracefully fall back to local heuristics (`smartInsightsService.ts`).
  - If the external LLM (OpenRouter / Groq) takes longer than 10s, the request returns a `status: 'degraded'` payload.
  - UI components must seamlessly render degraded/cached insights without throwing unhandled exceptions or showing raw server stack traces.

### 3.2 Strict AI Chat Rate Limiting
- **Constraints:**
  - `/api/ai/chat` is capped at **20 requests per minute per IP**.
  - `/api/ai/voice-action` is capped at **10 requests per minute per IP**.
- **UX Implication:** The AI chat interface must provide immediate visual feedback (e.g., "Thinking...", streamed tokens, or disabled send buttons) to prevent impatient users from spamming the endpoint and triggering 429 rate limit errors.

---

## 4. State Synchronization & Real-time WebSockets

### 4.1 Supabase Realtime Channels
- **Constraint:** Supabase Realtime uses WebSocket connections to broadcast `postgres_changes`.
- **Architectural Rule:**
  - The application must not create redundant WebSocket subscriptions inside multiple child components.
  - Channel subscriptions are centralized in `useRealtimeSync.ts` and dispatch local CustomEvents (`cashly-data-updated`).
  - Child components should listen to the local event bus rather than opening multiple concurrent WebSocket connections.

### 4.2 Optimistic Updates vs Reconciliation
- **Constraint:** When a user approves an inbox candidate or adds an expense, the UI should update optimistically to feel instantaneous.
- **Reconciliation Rule:** If the backend mutation fails, the optimistic update must rollback and alert the user with a dismissible toast (`sonner`).

---

## 5. Front-End Performance & Bundle Constraints

### 5.1 CSS Architecture & Module Boundaries
- **Constraint:** The application uses Vite with Tailwind CSS 4 and CSS Modules (`*.module.css`).
- **Rule:** Global CSS overrides with `!important` must be systematically replaced with unified design tokens to prevent style bleeding.

### 5.2 Bundle Splitting & Lazy Loading
- **Constraint:** Heavy dependencies:
  - `recharts` (~350KB gzipped)
  - `framer-motion` (~180KB gzipped)
  - `tesseract.js` (~2.5MB engine + worker)
  - `pdfplumber` / PyMuPDF (runs on external Python server)
- **Architectural Rule:** Heavy modals (e.g., `PDFAnalyzer`, `CSVImport`, `ReceiptScanner`, `ExportModal`) must remain lazy-loaded with `Suspense` fallbacks so they do not degrade initial Dashboard load times.

---

## 6. Business Logic Preservation Directive

> [!IMPORTANT]
> **Preserve Working Business Logic:**
> Redesigning the UX and UI must NEVER involve casually rewriting working backend services, Prisma schemas, or algorithmic heuristics (such as the Money Twin runway formulas or the extension DOM parsing logic).
> All improvements must be achieved through:
> 1. Clearer Information Architecture (IA)
> 2. Unified design system tokens
> 3. Progressive disclosure UI components
> 4. Structured, contextual AI interactions
> 5. Ergonomic responsive layouts
