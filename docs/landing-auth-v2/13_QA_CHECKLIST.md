# CASHLY — LANDING & AUTH V2 QA CHECKLIST

**Document:** `13_QA_CHECKLIST.md`  
**Classification:** Quality Assurance & Verification Protocols  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Visual & Editorial QA
- [ ] Calm Finance canvas (`#FAF8F5`) is consistent across all public views.
- [ ] No generic AI neon gradients or floating random 3D shapes.
- [ ] Tabular numerals (`.tabular-nums`) applied to all currency metrics.
- [ ] Hairline borders (`#E7E5E4`) and ambient multi-stop shadows match app aesthetic.
- [ ] Typography adheres to Plus Jakarta Sans headings and Inter body.

## 2. Interactive Product Demonstration QA
- [ ] Hero demo engine transitions smoothly between `Capture`, `Review`, `Ledger`, `Budget`, and `Twin`.
- [ ] Clicking `[Approve]` in the demo shows immediate visual update to ledger and budget bar.
- [ ] Money Twin simulation slider dynamically recalculates projected runway headroom.
- [ ] Interactive 5-pillar tabs accurately preview `Home`, `Activity`, `Plan`, `Analyze`, and `Assist`.

## 3. Authentication QA
- [ ] Split-screen layout displays properly on desktop (1024px+) with brand story on left.
- [ ] Single-column card displays with safe-area padding on mobile viewports (390px/430px).
- [ ] Google OAuth button triggers `signInWithGoogle()`.
- [ ] Email/password login triggers `signInWithEmail()` and navigates to `/dashboard`.
- [ ] Signup displays dynamic password requirement checks and dispatches OTP.
- [ ] OTP verification auto-advances through all 6 digits and handles backspace/paste.
- [ ] Forgot password link triggers reset email and displays confirmation state.

## 4. Technical & Accessibility QA
- [ ] `npm run build` passes with code 0 and zero TypeScript errors.
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm run test:run` passes with 100% test success.
- [ ] Keyboard navigation: Tab order is logical; focus rings are visible (`#E11D48`).
- [ ] Mobile navigation drawer opens and traps focus, closes on `Escape` or backdrop click.
- [ ] Safe-area insets respected on iOS (`env(safe-area-inset-bottom)`).
