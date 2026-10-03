# CASHLY — MARKETING COMPONENT ARCHITECTURE

**Document:** `06_MARKETING_COMPONENT_ARCHITECTURE.md`  
**Classification:** Frontend Component Hierarchy & Modular Composition  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Composition Hierarchy

To ensure high performance, code maintainability, and clean code-splitting, the public marketing and authentication surface follows a modular component architecture:

```
frontend/src/
├── components/landing/
│   ├── MarketingNav.tsx           # Sticky Calm Finance header with scroll elevation & responsive drawer
│   ├── MarketingFooter.tsx        # Multi-column editorial footer with legal & product links
│   ├── Hero.tsx                   # Conversion hero with category eyebrow & split layout
│   ├── ProductLifecycleDemo.tsx   # Interactive software demonstration engine (Capture → Review → Ledger → Budget → Twin)
│   ├── WhyCashlySection.tsx       # Traditional finance vs Cashly Financial OS comparison
│   ├── PillarEcosystem.tsx        # 5-Pillar interactive tabs (Home, Activity, Plan, Analyze, Assist)
│   ├── CaptureReviewSection.tsx   # Deep dive into Browser Extension + Needs Review inbox
│   ├── PlanningSection.tsx        # Unified Commitments, Budget velocity, and Goals showcase
│   ├── MoneyTwinSection.tsx       # Interactive Money Twin forecasting & burn rate simulator
│   ├── AssistAISection.tsx        # Contextual AI insights with clickable action chips + Weekly Coach
│   ├── ExtensionCompanionSection.tsx # First-class Chrome companion feature spotlight
│   ├── TrustSection.tsx           # Verified security architecture (RLS, JWT, local sandbox)
│   └── FinalCTA.tsx               # High-conversion closing banner with subtle product visual
│
├── layouts/
│   └── AuthLayout.tsx             # Editorial split-screen auth shell (Brand story left, form right)
│
└── pages/
    ├── LandingPage.tsx            # Main landing page orchestrator assembling all sections
    ├── LoginPage.tsx              # Calm Finance login view with Google OAuth
    ├── SignupPage.tsx             # Streamlined signup view with password strength checklist
    ├── ForgotPasswordPage.tsx     # Calm password reset request view
    └── VerifyEmailPage.tsx        # 6-digit OTP verification view with auto-advance
```

---

## 2. Reusable Primitives & Token Consumption

All landing and auth components consume the established **Calm Finance** design tokens directly from `index.css`:
- Canvas: `bg-[#FAF8F5]`
- Card Surface: `bg-white` with hairline border `border-[#E7E5E4]`
- Typography: `text-[#1C1917]` (primary), `text-[#57534E]` (secondary), `text-[#78716C]` (muted)
- Brand Accent: `bg-[#E11D48] text-white hover:bg-[#BE123C]`
- Elevation: `shadow-[var(--shadow-sm)]`, `shadow-[var(--shadow-md)]`, `shadow-[var(--shadow-lg)]`
- Numeric Clarity: `.tabular-nums` applied to all monetary metrics.

---

## 3. Code Splitting & Performance Rules

1. **Lazy Loading:** `LandingPage.tsx` and auth pages are already lazily loaded via `React.lazy()` in `App.tsx`.
2. **Bundle Budget:** Marketing components rely strictly on lightweight SVGs (via `lucide-react`) and CSS transitions.
3. **No Heavy Animation Libraries:** Zero reliance on Three.js, Lottie, or massive third-party canvas engines. All motion is orchestrated via lightweight Framer Motion and native CSS transforms.
