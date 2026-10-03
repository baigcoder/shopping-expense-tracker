# CASHLY — LANDING & AUTH V2 IMPLEMENTATION PLAN

**Document:** `12_IMPLEMENTATION_PLAN.md`  
**Classification:** Tactical Implementation Plan & Step-by-Step Roadmap  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Execution Order

```
STEP 1: REUSABLE PUBLIC SHELL & NAVIGATION
 ├── Upgrade MarketingNav with scroll-driven backdrop blur, polished mobile drawer, and active links.
 └── Upgrade MarketingFooter with 4 structured columns (Product, Resources, Support, Legal).

STEP 2: HERO & INTERACTIVE PRODUCT DEMONSTRATION ENGINE
 ├── Build ProductLifecycleDemo.tsx: stateful demonstration engine (Capture → Review → Ledger → Budget → Twin).
 └── Re-architect Hero.tsx: compelling value proposition copy + interactive product lifecycle engine.

STEP 3: DEEP PRODUCT STORY SECTIONS
 ├── Build WhyCashlySection.tsx: elegant comparison of traditional apps vs Cashly Financial OS.
 ├── Build PillarEcosystem.tsx: interactive 5-pillar tabs (Home, Activity, Plan, Analyze, Assist).
 ├── Build PlanningSection.tsx: unified commitments, spending velocity, and savings goals.
 ├── Build MoneyTwinSection.tsx: interactive forecasting and burn-rate simulation.
 ├── Build AssistAISection.tsx: contextual AI pattern detection with structured action chips.
 ├── Build ExtensionCompanionSection.tsx: browser extension capture showcase (Amazon, Foodpanda, Shopify).
 ├── Build TrustSection.tsx: verified technical credibility (Supabase RLS, zero credential storage).
 └── Build FinalCTA.tsx: high-conversion closing banner with subtle product visual.

STEP 4: EDITORIAL SPLIT-SCREEN AUTHENTICATION SHELL
 ├── Rebuild AuthLayout.tsx: split-screen layout on desktop (Brand story left, auth card right), single-column on mobile.
 ├── Refactor LoginPage.tsx: Calm Finance styling, official Google OAuth button, accessible focus states.
 ├── Refactor SignupPage.tsx: real-time password requirement checklist, lightweight registration form.
 ├── Refactor ForgotPasswordPage.tsx: calm reset link dispatch with resend and email correction controls.
 └── Refactor VerifyEmailPage.tsx: tactile 6-digit OTP cells with auto-advance and timer.

STEP 5: INTEGRATION & ASSEMBLE
 ├── Assemble sections into LandingPage.tsx.
 └── Verify responsive breakpoints and navigation anchor scrolling.

STEP 6: VALIDATION & QUALITY GATES
 ├── Run npm run build (tsc -b && vite build).
 ├── Run npm run lint (eslint .).
 ├── Run npm run test:run (vitest).
 └── Perform multi-viewport responsive check (Desktop, Tablet, Mobile).
```
