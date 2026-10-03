# CASHLY V8 — PUBLIC LANDING & AUTHENTICATION EXPERIENCE

## 1. Public Landing Page (`LandingPage.tsx`)

The landing page communicates the true, living application rather than a collection of generic marketing cards.

### Architectural Flow:
1. **Hero Moment:** Sovereign headline, value pitch, dual CTAs ("Create a free account", "See how Cashly works"), and live interactive browser checkout simulation (`HeroProductScene.tsx`).
2. **Interactive Capture Simulation:** Demonstrates real-time checkout interception (`Foodpanda Delivery`), staging in unposted queue, and instant ledger propagation upon approval.
3. **5-Pillar Ecosystem:** In-depth interactive exploration of Home, Activity, Plan, Analyze, and Assist.
4. **Money Twin Simulator:** Interactive What-If trajectory forecasting with real-time curve rendering.
5. **Extension Companion Architecture:** Explaining the zero-password, zero-bank-credential interception mechanics.
6. **Trust & Security Architecture:** Visual explanation of Supabase Row-Level Security, AES-256 encryption, and client-side isolation.

---

## 2. Authentication Flow (`AuthLayout.tsx`, `LoginPage.tsx`, `SignupPage.tsx`)

Auth screens are first-class participants in the design system:
- Split layout: Left column presents editorial product value; right column provides a focused, high-contrast authentication form.
- Supabase authentication preserved 100% (Google OAuth PKCE and email/password).
- Sovereign Pine Teal accents (`#0F766E`), hairline borders, and semantic danger alerts.
