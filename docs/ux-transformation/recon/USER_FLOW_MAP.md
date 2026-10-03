# CASHLY RECON — CRITICAL USER FLOW MAP

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Audit:** October 2026  
**Status:** Forensic Step-by-Step Flow Reconstruction Complete  

---

## 1. Authentication & Onboarding Flows

### Flow 1: New User Signup (Email + OTP)
```
[ User on /signup ] 
       │
       ▼
 1. User enters: Full Name, Email, Password
 2. Client-side Zod validation (`validation/schemas.ts`)
 3. Click "Create account"
       │
       ▼ (POST /api/otp/send)
 4. Backend generates 6-digit OTP, stores in `EmailOTP` table, dispatches email via Resend/Nodemailer
 5. Frontend redirects: `navigate('/verify-email', { state: { email, name, password } })`
       │
       ▼ (User on /verify-email)
 6. User enters 6-digit OTP
 7. Click "Verify Email" ──► (POST /api/otp/verify)
 8. Upon OTP match: calls `supabase.auth.signUp()` or `/api/auth/register` to create Supabase session
 9. Session tokens saved in localStorage (`auth-storage`)
10. User redirected to `/dashboard`
       │
       ▼ (Desktop UX Friction!)
11. Desktop user immediately hits <ExtensionWall />:
    "Cashly works through your browser extension. Download and install to continue."
    User cannot access their new empty dashboard without installing unpacked extension!
```
- **UX Friction:** The mandatory desktop ExtensionWall kills onboarding momentum immediately after email verification.

### Flow 2: Returning User Login (Email + Password)
```
[ User on /login ]
       │
       ▼
 1. User enters Email and Password
 2. Click "Sign in" ──► `signInWithEmail(email, password)` via Supabase GoTrue
 3. Success: Session stored in `useAuthStore`
 4. Redirect to `/dashboard`
 5. If desktop: ExtensionWall checks `cashly_extension_synced` or sends `CHECK_STATUS` postMessage
 6. If extension is connected with matching email: ExtensionWall unblocks; dashboard mounts
```

### Flow 3: Google OAuth Login
```
[ User on /login or /signup ]
       │
       ▼
 1. Click "Continue with Google" ──► `signInWithGoogle()` via `supabase.auth.signInWithOAuth()`
 2. Browser redirects to Google Account Selector
 3. Google authorizes and redirects back to `https://.../auth/callback?code=...`
 4. `AuthCallback.tsx` catches PKCE authorization code in URL query string
 5. `supabase.auth.exchangeCodeForSession(code)` executes
 6. User profile hydrated into `useAuthStore`
 7. Redirect to `/dashboard`
```

---

## 2. Transaction Ingestion & Review Flows

### Flow 4: Automatic Purchase Capture (Extension → Inbox)
```
[ User browsing e.g. Amazon / Daraz / Shopify checkout page ]
       │
       ▼
 1. Order confirmation page loads (e.g., `/checkout/thank-you` or `order-placed`)
 2. `content.js` mutation observer triggers; parses DOM elements matching order selectors
 3. Extracts: merchant name, total price, currency, order items, checkout time
 4. `content.js` sends `chrome.runtime.sendMessage({ action: 'PURCHASE_DETECTED', payload })`
 5. `background.js` verifies user JWT token:
    ├── If online: POST to `/api/transaction-inbox/candidates`
    │   └── Backend inserts record into `public.transaction_candidates` with status='pending'
    │   └── Evaluates active `merchant_rules`:
    │       ├── Match found with auto-approve: updates status='approved', inserts into `transactions`
    │       └── No match: remains status='pending'
    └── If offline: writes to IndexedDB offline queue; syncs upon reconnection
 6. Backend emits Supabase Realtime broadcast on `transaction_candidates`
 7. React web app receives broadcast:
    └── `usePaymentCaptureSync` triggers live payment banner on `/dashboard`
    └── Sidebar and MobileBottomNav update inbox badge count (+1)
```

### Flow 5: Review & Triage Transaction Candidate (Inbox Workflow)
```
[ User navigates to /transaction-inbox ]
       │
       ▼
 1. `TransactionInboxPage` fetches `list({ status: 'pending' })`
 2. Displays candidate cards showing: Merchant, Date, Amount, Confidence Score, Category badge
 3. User evaluates candidate:
    ├── Path A: Approve Directly
    │   └── Click checkmark [✓] button
    │   └── POST `/api/transaction-inbox/:id/approve`
    │   └── Backend updates candidate status='approved', creates row in `public.transactions`
    │   └── Emits `cashly-data-updated` event; candidate animates out of view
    ├── Path B: Inline Edit then Approve
    │   └── Click pencil [✎] button
    │   └── Input fields open inline for merchant description, amount, category select
    │   └── Click checkmark [✓] to commit edited payload
    ├── Path C: Duplicate Merge
    │   └── Candidate flagged with "Duplicate warning" linking existing transaction ID
    │   └── Click [Merge] button ──► POST `/api/transaction-inbox/:id/merge`
    │   └── Discards duplicate candidate, retains existing transaction row
    └── Path D: Reject
        └── Click [✕] button ──► POST `/api/transaction-inbox/:id/reject`
        └── Candidate marked status='rejected'
```

### Flow 6: Manual Transaction Entry
```
[ User on any authenticated view ]
       │
       ▼
 1. User clicks "+" button in Sidebar or Mobile QuickAdd FAB
 2. `TransactionModal.tsx` opens
 3. User fills: Description, Amount, Type (Income/Expense), Category, Date, Account/Card
 4. Click "Add transaction"
 5. Direct Supabase insert: `supabaseTransactionService.create(payload)`
 6. Row written to `public.transactions`
 7. Supabase Realtime notifies all active clients
 8. Modal closes; toast notification plays sound; dashboard balances increment immediately
```

---

## 3. Planning & Liability Flows

### Flow 7: Budget Creation & Monitoring
```
[ User on /budgets ]
       │
       ▼
 1. Click "Create Budget"
 2. Select Category (e.g., "Food & Dining"), Period ("Monthly"), Amount limit (e.g., "$500")
 3. Click "Save budget" ──► `budgetService.create()` writes to `public.budgets`
 4. `BudgetsPage` recalculates `spendingMap` by filtering current month's expenses from `transactions`
 5. Circular progress gauge animates: `(spent / total) * 100`
 6. If spending exceeds 80%: card changes tone to warning Amber
 7. If spending exceeds 100%: card changes tone to alert Rose/Red; notification added to `public.notifications`
```

### Flow 8: Goal Creation & Funding
```
[ User on /goals ]
       │
       ▼
 1. Click "New Goal"
 2. Enters: Goal name (e.g., "Emergency Fund"), Target amount ($10,000), Target deadline date, Icon picker
 3. Click "Create Goal" ──► Inserts into `public.goals`
 4. To contribute savings:
    └── Click "Add Funds" on goal card
    └── Enters amount (e.g., $250)
    └── Updates `saved = saved + 250` in `public.goals`
    └── Optional: creates matching transfer expense in `transactions`
 5. Confetti animation triggers if goal reaches 100%
```

### Flow 9: Subscription Management & Trial Expiration
```
[ User on /subscriptions ]
       │
       ▼
 1. Click "Add Subscription"
 2. Enters: Service name (e.g., "Figma"), Billing cycle (Monthly/Yearly), Price ($15/mo), Color, Start date
 3. Optional Trial Toggle:
    └── Toggle "Is this a free trial?" to ON
    └── Set Trial duration: 7 days, 14 days, 30 days
 4. Inserts row into `public.subscriptions` with `status='trial'` and `trial_end_date`
 5. On page load: `subscriptionService.checkAndUpdateExpired()` compares `trial_end_date` against `now()`
 6. If trial ends in <= 3 days:
    └── Visual alert banner appears at top of Subscriptions page
    └── In-app notification created in `public.notifications`
```

---

## 4. Banking & Document Import Flows

### Flow 10: Plaid Bank Account Connection
```
[ User on /accounts ]
       │
       ▼
 1. Click "Connect Bank Account" (renders `<PlaidLinkButton>`)
 2. Frontend calls POST `/api/plaid/create-link-token`
 3. Plaid Link SDK modal opens in browser
 4. User selects financial institution (Chase, Bank of America, etc.) and signs in
 5. Plaid generates `public_token` and triggers `onSuccess(public_token)`
 6. Frontend dispatches POST `/api/plaid/exchange-token` with `public_token`
 7. Backend securely stores `access_token` in `public.bank_accounts`
 8. Initial sync runs: fetches accounts, balances, and recent 30-day transactions
 9. Staged transactions post into `public.transaction_candidates` with source='plaid'
```

### Flow 11: Bank Statement Import (PDF / CSV)
```
[ User on /transactions ]
       │
       ▼
 1. Click "Import" in page action bar
 2. Chooses CSV or PDF upload:
    ├── Path A: CSV Import (`CSVImport.tsx`)
    │   └── User uploads `.csv` file
    │   └── Client parses headers; user maps CSV columns to: Date, Description, Amount, Category
    │   └── Preview table shows rows with duplicate check
    │   └── Click "Import Rows" ──► Batch inserts into `public.transaction_candidates` with source='csv'
    └── Path B: PDF Analyzer (`PDFAnalyzer.tsx`)
        └── User uploads bank statement `.pdf`
        └── Sends file to `/ai-server/main.py` (`POST /api/extract-text`)
        └── Python backend uses `pdfplumber` / PyMuPDF to extract text tables
        └── LLM or regex normalizer parses rows into transaction JSON
        └── Preview table displays detected transactions with confidence scores
        └── User selects rows and clicks "Import to Inbox"
 3. User redirected to `/transaction-inbox` to review and approve imported candidates
```

---

## 5. AI & Intelligence Flows

### Flow 12: Conversational AI Chat (`AIChatbot.tsx`)
```
[ User clicks floating AI widget in bottom-right corner ]
       │
       ▼
 1. `AIChatbot.tsx` expands from minimized pill to chat panel
 2. Component loads cached financial context via `aiDataCacheService.getCachedData(userId)`
 3. User types: "How much did I spend on dining this month?"
 4. Frontend calls POST `/api/ai/chat` (with rate limiter: 20 req/min)
 5. Backend pipeline:
    ├── Sanitizes prompt string
    ├── Queries `getFinancialSummary(userId)` for live month totals, top category, budget state
    ├── Injects grounding prompt: "You are Cashly AI. Only use numbers provided in context..."
    ├── Sends prompt to OpenRouter / Groq (e.g. `meta-llama/llama-3-70b-instruct`)
    └── Streams / returns completion response
 6. Assistant message renders in chat window
 7. AI references amounts (e.g., "$340.50 on Dining")
```
- **UX Gap:** AI mentions the spending, but cannot present an interactive button: `[View Dining Transactions]`. The user must manually navigate to `/transactions` and apply the filter.

### Flow 13: Voice Command & Voice Action
```
[ User opens Voice Modal via Chatbot ]
       │
       ▼
 1. `VoiceCallModal.tsx` opens; requests microphone permission
 2. User speaks: "Add expense 45 dollars for dinner at Foodpanda"
 3. Browser Web Speech API captures audio and transcribes to text
 4. Transcribed text sent to POST `/api/ai/voice-action`
 5. Backend `parseVoiceIntent()` uses LLM to extract structured JSON:
    `{ action: 'create_transaction', amount: 45, category: 'Food & Dining', description: 'Foodpanda' }`
 6. Backend executes action: creates transaction in `public.transactions`
 7. Backend generates confirmation text: "Added forty-five dollars for Foodpanda under Food & Dining."
 8. Audio returned via Edge-TTS stream (`POST /api/voice/tts`) and played through browser speakers
 9. UI visualizer pulses with audio waveform
```
