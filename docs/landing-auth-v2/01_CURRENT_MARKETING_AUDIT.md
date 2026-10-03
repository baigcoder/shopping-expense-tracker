# CASHLY — CURRENT MARKETING AUDIT

**Document:** `01_CURRENT_MARKETING_AUDIT.md`  
**Classification:** Forensic Marketing Experience Audit  
**Date:** October 2026  
**Status:** Complete  

---

## 1. Executive Summary

While the authenticated product has been rebuilt into a cohesive **5-Pillar Financial Operating System** (`Home`, `Activity`, `Plan`, `Analyze`, `Assist`), the current public landing page (`/`, `LandingPage.tsx`) presents an outdated, static "feature catalog" narrative rather than an interactive software demonstration of Cashly's core operating model:

$$\text{CAPTURE} \longrightarrow \text{REVIEW} \longrightarrow \text{UNDERSTAND} \longrightarrow \text{PLAN} \longrightarrow \text{PREDICT} \longrightarrow \text{ACT}$$

The visitor experiences static text cards and simple bullet points rather than feeling the interconnected flow of an executive-grade financial operating system.

---

## 2. Component-by-Component Forensic Audit

### 2.1 Navigation (`MarketingChrome.tsx`)
- **Current State:** Basic sticky header with logo, 4 anchor links (`#how-it-works`, `#features`, `#analyze`, `#extension`), and buttons for `Sign in` and `Get started`.
- **Gaps:**
  - Lacks smooth background opacity transitions on scroll.
  - Links do not reflect the new 5-Pillar Operating System (`Home`, `Activity`, `Plan`, `Analyze`, `Assist`).
  - Mobile menu is an abrupt dropdown toggle without touch gestures, backdrop blur, or safe-area consideration.

### 2.2 Hero Section (`Hero.tsx`)
- **Current State:** Standard 2-column layout (Headline + paragraph + 2 buttons on left; static card on right with 3 mocked rows: Foodpanda, Netflix, Statement import).
- **Gaps:**
  - **No Live Interaction:** The right card is purely decorative static HTML. It does not demonstrate the approval flow, ledger ingestion, or downstream impact.
  - **Copy Disconnect:** Uses a generic headline without highlighting Cashly's core value: *capturing real purchases before they become budget leaks, holding them in a quiet inbox, and turning them into predictive intelligence.*
  - **Missing Connection:** Fails to demonstrate how approving a Foodpanda checkout immediately shifts the monthly Dining Budget and Money Twin burn velocity.

### 2.3 How It Works (`HowItWorks.tsx`)
- **Current State:** 4 static numbered cards (`Capture in the browser`, `Review before it posts`, `Plan the month`, `Analyze what happened`).
- **Gaps:**
  - Static, text-heavy cards that look like a generic SaaS template.
  - No interactive visual progression or synchronized demonstration.
  - Leaves out `Predict` (Money Twin) and `Act` (Contextual AI).

### 2.4 Feature Grid (`Features.tsx` & `featureCatalog.ts`)
- **Current State:** Long list of 20+ feature cards grouped under `capture`, `planning`, `analyze`, `system`.
- **Gaps:**
  - Overwhelming wall of text that reads like an internal developer spec or release notes.
  - Visually repetitive: every card has an identical pink icon box, bold title, and 2 lines of text.
  - Does not communicate the cohesive 5-Pillar hierarchy.

### 2.5 Analysis Section (`Analyze.tsx`)
- **Current State:** Hardcoded CSS bar chart (`MOCK_BARS`) comparing "This week vs Last week" with 3 highlight boxes.
- **Gaps:**
  - Does not demonstrate real Cashly analytical depth: category breakdowns, burn rate velocity, channel split (Online vs In-Store), or top merchant leaderboards.
  - Missing the standout **Money Twin** visual forecasting story ("If nothing changes, this is where your month ends").

### 2.6 Extension Banner & Footer (`Footer.tsx`, `MarketingFooter`)
- **Current State:** Dark box banner with 3 bullet steps and download link, followed by a plain footer.
- **Gaps:**
  - The extension is treated as an afterthought download link rather than a first-class companion accelerator.
  - Misses trust and architecture foundations (Supabase Auth, RLS, client-side encryption, zero bank credential storage).

---

## 3. Public UX Gaps & Critical Flaws

| Dimension | Current Implementation | Target Public Experience |
|:---|:---|:---|
| **Storytelling Model** | Disconnected feature checklist. | **Connected System Lifecycle:** Capture → Review → Understand → Plan → Predict → Act. |
| **Hero Demonstration** | Static 3-row mock card. | **Interactive State Engine:** Step-through demonstration of a real checkout becoming real. |
| **Architecture Reflection** | Legacy 4-group catalog. | **The 5 Pillars:** Home, Activity, Plan, Analyze, Assist. |
| **Forecasting** | Mentioned in text only. | **Interactive Money Twin Simulation:** Interactive velocity & headroom calculator. |
| **AI Story** | Text bullet points. | **Contextual Intelligence:** Grounded pattern detection with structured action chips. |
| **Trust & Security** | Absent from page. | **Verified Credibility:** Row-Level Security, JWT validation, local-first extension. |
