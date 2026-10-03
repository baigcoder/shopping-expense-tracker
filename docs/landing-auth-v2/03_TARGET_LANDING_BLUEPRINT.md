# CASHLY — TARGET LANDING BLUEPRINT

**Document:** `03_TARGET_LANDING_BLUEPRINT.md`  
**Classification:** Landing Experience Architecture & Wireframe Blueprint  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Page Narrative & Visual Rhythm

The landing page moves visitors through an intuitive, narrative progression that mirrors the software lifecycle:

```
[ 1. NAVIGATION ]
Sticky Calm Finance Header with scroll blur & active states

[ 2. HERO: THE HOOK & LIVE DEMO ]
"Your money is happening all the time. Cashly makes it clear."
Interactive Lifecycle Engine: Capture → Review → Approve → Ledger → Budget → Twin

[ 3. THE FUNDAMENTAL DIFFERENCE ]
"Most apps record what happened. Cashly captures it, lets you review it, and predicts what's next."
Interactive side-by-side comparison (Traditional vs Cashly Operating System)

[ 4. THE 5-PILLAR ECOSYSTEM ]
Home • Activity • Plan • Analyze • Assist
Connected visual architecture diagram showing how data flows through the system

[ 5. CAPTURE & REVIEW (The Core Moat) ]
Real browser purchase detection (Amazon, Foodpanda, Shopify)
Quiet Inbox triage queue (Approve, Edit, Merge, Reject)

[ 6. PLAN: WHAT IS SPOKEN FOR? ]
Unified Commitments (Subscriptions + Bills + Trials)
Budget spending velocity pace and savings goal milestones

[ 7. ANALYZE & MONEY TWIN FORECAST ]
"If nothing changes, this is where your month ends."
Interactive Money Twin burn rate and runway headroom simulator

[ 8. ASSIST: CONTEXTUAL CO-PILOT ]
AI that sees patterns and executes actions with structured buttons (not a chatbot gimmick)
Weekly Coach Plan preview

[ 9. EXTENSION COMPANION ]
First-class companion spotlight: Works silently in background while shopping

[ 10. TRUST & INFRASTRUCTURE ]
Verified technical credibility: Supabase Auth, Row-Level Security, zero bank password storage

[ 11. FINAL CONVERSION CTA ]
"Know what happened. Understand what changed. Plan what comes next."
Direct registration trigger + secondary interactive demo reset

[ 12. EDITORIAL FOOTER ]
Polished multi-column footer (Product, Resources, Support, Legal)
```

---

## 2. Section Specifications

### 2.1 Navigation Bar (`MarketingNav`)
- **Desktop (1024px+):**
  - Left: Cashly Logo (C badge in `#E11D48` + Wordmark).
  - Center: Pill container with navigation links: `Product`, `How it Works`, `The 5 Pillars`, `Money Twin`, `Extension`.
  - Right: `Sign in` (Ghost button) + `Get started` (Primary rose button with hover lift).
  - Scroll Behavior: Blurs and elevates on scroll (`bg-[#FAF8F5]/85 backdrop-blur-md border-b border-[#E7E5E4]`).
- **Mobile (<1024px):**
  - Logo + Hamburger menu toggle.
  - Full-screen slide-down drawer with large touch targets, pillar links, and authentication buttons.

### 2.2 Hero & Interactive Product Lifecycle Engine
- **Left Column (Content):**
  - Category Eyebrow: `FINANCIAL OPERATING SYSTEM`
  - Headline: **"See what your money is doing before it becomes a problem."**
  - Body: *"Cashly captures purchases from your browser, holds them in a quiet inbox, and only posts what you approve. Then budgets, Analytics, Money Twin, and AI all turn your real numbers into clarity."*
  - CTA Group:
    - Primary: `[Create a free account]` with arrow icon.
    - Secondary: `[See how Cashly works]` with play/interactive badge.
  - Micro Trust Note: *"No bank passwords required. Free Chrome companion available."*
- **Right Column (Interactive Lifecycle Demonstration Engine):**
  - An interactive, stateful product demonstration component (`ProductLifecycleDemo.tsx`) that cycles through or lets the visitor step through 4 synchronized states:
    1. **`State 1: Capture`** — A simulated browser checkout appears (*Foodpanda: Rs 1,240* on *checkout.foodpanda.pk*). Extension captures it silently.
    2. **`State 2: Review`** — Transaction lands in the **Needs Review** queue with glowing attention badge. Visitor clicks `[Approve ✓]`.
    3. **`State 3: Ledger & Plan`** — Item posts immediately to the **Canonical Ledger**. Dining Budget progress bar updates smoothly from 64% to 78% velocity.
    4. **`State 4: Money Twin & AI`** — Money Twin recalculates daily burn rate; Contextual AI generates an actionable tip: *"Dining pace is high this week. 2 commitments due on Friday."*

### 2.3 The "Why Cashly" Comparison Matrix
- An elegant 2-column comparative visual:
  - **Traditional Finance Apps:** Manual spreadsheets, disconnected receipts, delayed bank syncs, passive backward-looking charts.
  - **Cashly Financial OS:** Automated background capture, human review control before posting, forward-looking commitments, live velocity pace, and predictive Money Twin.

### 2.4 The 5-Pillar Architectural Showcase
- Tabs allowing the visitor to preview the 5 core operating surfaces:
  1. **Home:** Financial Pulse, Net Headroom, Attention Rail.
  2. **Activity:** Needs Review inbox, canonical ledger, statement OCR.
  3. **Plan:** Budgets velocity pace, unified commitments, savings goals.
  4. **Analyze:** Category donut, spending velocity curve, top merchants.
  5. **Assist:** Weekly Coach Plan, contextual AI insights with action chips.

### 2.5 Money Twin Interactive Simulator
- An interactive component on the landing page:
  - Visitor can drag a slider adjusting discretionary spending (*"If I cut dining out by $50/week"*).
  - Real-time animated visualization of **Runway Headroom** expanding and **Month-End Cash** increasing.
  - Headline: *"If nothing changes, this is where your month ends. See what happens when it does."*

### 2.6 Extension Companion Section
- Visual of browser window with Cashly companion badge:
  - Works on 25+ e-commerce platforms (Amazon, Shopify, Daraz, Foodpanda, eBay).
  - Clear message: *"Never gives a third party your bank login. Captures when you buy, waits for your review."*
  - Direct CTA to download the extension zip or Chrome Web Store link.

### 2.7 Trust & Credibility Section
- 4 Pillars of Verified Architecture:
  1. **Row-Level Security (RLS):** Data isolation enforced at database engine level.
  2. **Zero Password Storage:** We never ask for or store your online banking credentials.
  3. **Local-First Extension:** Checkout detection heuristics execute locally in the browser sandbox.
  4. **Cryptographic JWT Sessions:** Protected via Supabase enterprise authentication.
