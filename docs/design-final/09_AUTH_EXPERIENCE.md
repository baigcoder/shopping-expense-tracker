# 09 — AUTHENTICATION & ONBOARDING EXPERIENCE
**Canonical Path:** `/docs/design-final/09_AUTH_EXPERIENCE.md`  
**Status:** CANONICAL MASTER  
**Routes:** `/login`, `/signup`, `/forgot-password`, `/verify-email`  
**Components:** `AuthLayout.tsx`, `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPasswordPage.tsx`, `VerifyEmailPage.tsx`

---

## 1. Architectural Philosophy

Authentication is not treated as a discarded modal dialog or a sterile white form. It is the operator’s formal entry into the sovereign financial terminal.

### The Split-Screen Editorial Layout:
- **Left Panel (50% Desktop)**:
  - Deep Matte Ink ground (`#111111`) with subtle radial illumination.
  - Monumental Syne display heading:  
    `"KNOW WHAT HAPPENED. KNOW WHAT COMES NEXT."`
  - Pill Tag: `SOVEREIGN ACCESS TERMINAL` in Cadmium Orange.
  - Interactive Pre-Purchase Intercept Card: Floating white card demonstrating the real-time extension companion intercepting an Amazon $189 purchase with the mathematical impact on monthly runway.
  - Bottom Trust Proof: SOC2 Type II compliance, 256-bit AES cryptographic vault status.
- **Right Panel (50% Desktop / 100% Mobile)**:
  - Architectural Warm Ivory canvas (`#F4F3EE`).
  - High-contrast input fields with crisp 1px hairline borders (`border-ink/15`).
  - Focus state: Electric Cadmium Orange hairline outline (`focus:border-[#EE5024] focus:ring-1 focus:ring-[#EE5024]`).
  - Full-width Cadmium Orange rounded-full submit button (`editorial-pill-btn-orange w-full py-4 text-sm font-bold`).
  - One-click biometric / OAuth provider buttons in crisp white capsules.

---

## 2. Functional & Security Continuity

- **Supabase PKCE OAuth Flow**: Complete preservation of email/password authentication, magic link recovery, and session persistence.
- **Form Validation Hygiene**: Instant inline validation feedback with high-contrast error banners (`bg-red-50 text-red-900 border border-red-200`).
- **Responsive Stacking**: On mobile viewports (`<= 768px`), the left panel collapses into a compact editorial top header, allowing the login credentials form to take immediate focus.
