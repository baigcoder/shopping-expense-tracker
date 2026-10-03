# CASHLY — CURRENT AUTH AUDIT

**Document:** `02_CURRENT_AUTH_AUDIT.md`  
**Classification:** Forensic Authentication UX Audit  
**Date:** October 2026  
**Status:** Complete  

---

## 1. Executive Summary

Cashly’s authentication layer is powered by **Supabase Auth** and supports:
1. Email and Password authentication with client-side format validation.
2. Google OAuth 2.0 social sign-in.
3. 6-digit OTP email confirmation during registration.
4. Password reset link dispatch.

While the underlying security and API integration are fully functional, the visual presentation, page layout, and user feedback in `AuthLayout.tsx`, `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPasswordPage.tsx`, and `VerifyEmailPage.tsx` remain basic and utilitarian. They fail to reflect the executive Calm Finance brand aesthetic of the redesigned application.

---

## 2. Screen-by-Screen Audit

### 2.1 Auth Shell Layout (`AuthLayout.tsx`)
- **Current State:** Single centered column with a basic card (`max-w-md`) on a plain `#FAF8F5` background.
- **Gaps:**
  - On large screens (1440px+), the vast majority of the viewport is blank, empty space.
  - Lacks visual brand storytelling, trust reassurance, and product imagery that welcome the user.
  - Does not establish an emotional connection with the user entering the Calm Finance operating system.

### 2.2 Login Page (`LoginPage.tsx`)
- **Current State:** Inputs for email and password, show/hide password toggle, "Forgot password?" link, Google OAuth button.
- **Gaps:**
  - Form validation errors are rendered as harsh red text without micro-animations.
  - The Google button lacks a recognizable provider badge and refined hover states.
  - No subtle confirmation transition upon successful authentication before navigating to `/dashboard`.

### 2.3 Signup Page (`SignupPage.tsx`)
- **Current State:** 4 fields (Name, Email, Password, Confirm Password) + password strength meter + OTP trigger.
- **Gaps:**
  - Password strength indicator is a simple 4-bar colored block without clear guidance on remaining requirements.
  - The form feels dense and tall on mobile viewports.
  - Lacks reassurance that Cashly never asks for bank passwords or sells user data.

### 2.4 Forgot Password (`ForgotPasswordPage.tsx`)
- **Current State:** Email input with submit button, switching to a success message upon dispatch.
- **Gaps:**
  - Minimal visual hierarchy.
  - Does not offer easy resend or email correction controls if the user mistypes their address.

### 2.5 Verify Email (`VerifyEmailPage.tsx`)
- **Current State:** 6 individual OTP input boxes with auto-advance and backspace navigation, resend countdown.
- **Gaps:**
  - The OTP input styling is slightly cramped on narrow mobile viewports (375px/390px).
  - Error and success feedback lack the polished Calm Finance iconography and tactile motion.

---

## 3. Auth UX Gaps & Target Enhancements

| Dimension | Current Implementation | Target Auth Experience |
|:---|:---|:---|
| **Layout** | Single narrow centered card in an empty field. | **Split-Screen Editorial Shell:** Left brand & live product story preview, right focused authentication surface. |
| **Visual Brand** | Basic utilitarian form inputs. | **Executive Calm Finance Form:** Refined typography, hairline focus rings, custom Google OAuth button. |
| **Password Feedback** | Generic 4-bar indicator. | **Real-Time Requirement Checklist:** Dynamic badges for length, numbers, and symbols. |
| **Feedback Motion** | Static alert text. | **Subtle Micro-Interactions:** Smooth field transitions, tactile button states, clean error shaking. |
| **Mobile Ergonomics** | Standard inputs. | **Thumb-Zone Optimized:** Minimum 44px touch targets, safe-area padding, numeric keyboard on OTP. |
