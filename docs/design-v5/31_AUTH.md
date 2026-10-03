# CASHLY — AUTHENTICATION SURFACES (V5)

**Classification:** Authentication & Security Specification (Authority #31)  
**Routes:** `/login`, `/signup`, `/forgot-password`, `/verify-email`  
**Core Purpose:** Frictionless, secure user onboarding and authentication that visually mirrors the core operating system.  

---

## 1. Compositional Layout

- **Desktop (≥ 1024px):** Asymmetric split layout:
  - Left Column (45%): Focused authentication card with warm canvas background, hairline border, and clean typography.
  - Right Column (55%): Immersive brand showcase demonstrating live product telemetry (Net Headroom, Money Twin forecast curve, and browser companion highlights).
- **Mobile (< 1024px):** Clean single-column container centered on the viewport with safe-area spacing and 44px+ touch targets.

---

## 2. Dynamic Form Validation & Feedback

1. **Email Input:** Real-time RFC 5322 regex validation with inline helper state (zero jarring full-form error shake).
2. **Password Guidance (Signup):** Dynamic checklist showing status indicators for:
   - Minimum 8 characters.
   - At least 1 number.
   - At least 1 special character.
   - Requirements transition from neutral gray to Emerald green upon satisfaction (no aggressive red prematurely displayed).
3. **OAuth Handshake:** Prominent Google One-Click OAuth button with clean SVG branding and explicit privacy micro-copy (*"No bank credentials requested"*).
4. **OTP Email Verification:** 6-character auto-advancing input field with native paste support and countdown timer for resend requests.
