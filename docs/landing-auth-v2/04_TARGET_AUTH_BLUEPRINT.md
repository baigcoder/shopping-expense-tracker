# CASHLY — TARGET AUTH BLUEPRINT

**Document:** `04_TARGET_AUTH_BLUEPRINT.md`  
**Classification:** Authentication System Blueprint & Visual Specification  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Architectural Strategy: Split-Screen Editorial Shell

The target authentication experience elevates Cashly from a generic centered form into an **editorial split-screen experience** on desktop (1024px+), while maintaining an ergonomic, focused single-column form on mobile:

```
┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
│ LEFT COLUMN: EDITORIAL BRAND & PRODUCT STORY  │ RIGHT COLUMN: AUTHENTICATION SURFACE          │
│ (Desktop only, 50% width)                     │ (50% desktop, 100% mobile)                    │
│                                               │                                               │
│ Cashly Logo (C badge + Wordmark)              │ Top Right: "Need an account? Sign up"         │
│                                               │                                               │
│ "A financial operating system                 │ Form Header:                                  │
│ that puts you in control."                    │ Title: "Welcome back"                         │
│                                               │ Subtitle: "Sign in to review your inbox"      │
│ Interactive / Live Visual Feature Preview:    │                                               │
│ - Live Needs Review card                      │ [ Continue with Google ]                      │
│ - Spending Velocity Indicator                 │ ─────── or continue with email ───────        │
│ - Money Twin Runway Headroom                  │                                               │
│                                               │ [ Email Address Input ]                       │
│ Security Footnote:                            │ [ Password Input + Show/Hide ]                │
│ Protected by Supabase Row-Level Security.     │ Forgot password?                              │
│ Your bank credentials are never stored.       │                                               │
│                                               │ [ Sign In Button (Rose #E11D48) ]             │
│                                               │                                               │
│                                               │ Legal disclaimer: Terms & Privacy links       │
└───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. Screen Specifications

### 2.1 Login (`LoginPage.tsx`)
- **Fields:**
  - `Email`: Validated on blur, accessible mail icon.
  - `Password`: Show/hide toggle with `Eye` / `EyeOff` icons, "Forgot password?" right-aligned link.
- **Actions:**
  - Google Social Sign-In button with official multi-color Google SVG icon.
  - Primary Submit: "Sign in" with tactile loading spinner state.
- **States:**
  - Invalid email format indicator.
  - Email not confirmed: redirect with state to `/verify-email`.
  - Wrong credentials: clear toast error message formatted via `formatSupabaseError`.
  - Success: sound effect (`soundManager.play('success')`) + smooth redirect to `/dashboard`.

### 2.2 Signup (`SignupPage.tsx`)
- **Fields:**
  - `Full Name`: Personalizes the workspace and dashboard greeting.
  - `Email`: Format validated.
  - `Password` + `Confirm Password`: Matches validation.
- **Dynamic Password Strength Checklist:**
  - Replaces the 4-bar colored block with a clear, calm checklist:
    - `✓ At least 8 characters`
    - `✓ Uppercase letter`
    - `✓ Number (0-9)`
    - `✓ Special character (!@#$)`
- **Actions:**
  - Google Social Sign-in.
  - Primary Submit: "Create account" → dispatches 6-digit OTP via `sendSignupOTP()` and navigates to `/verify-email`.

### 2.3 Forgot Password (`ForgotPasswordPage.tsx`)
- **Flow:**
  - User submits email → dispatches password reset via `sendPasswordResetEmail()`.
  - Displays calm confirmation state: *"Check your inbox. We've sent password reset instructions to user@domain.com."*
  - Action buttons: "Try another email" or "Return to sign in".

### 2.4 Verify Email OTP (`VerifyEmailPage.tsx`)
- **Flow:**
  - 6 individual numeric OTP cells with automatic focus advance and backspace regression.
  - Supports clipboard paste of 6-digit code.
  - Resend countdown timer (60s) preventing abuse.
  - Success animation and immediate redirect to `/dashboard`.

---

## 3. Preserved Authentication Logic & APIs

Under Rule 1 and Rule 6, **zero authentication business logic is altered**:
- `signInWithEmail(email, password)`
- `signInWithGoogle()`
- `sendSignupOTP(email, password, name)`
- `verifyOTP(email, code)`
- `resendOTP(email)`
- `sendPasswordResetEmail(email)`
- Client-side sounds (`soundManager.play('click')`, `'success'`, `'error'`).
