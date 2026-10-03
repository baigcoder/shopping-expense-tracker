# CASHLY SETTINGS V7 — INTERACTION & STATE MODEL

**Document:** `/docs/design-v7/settings/06_INTERACTION_MODEL.md`  
**Classification:** Interaction Design, Save Model & Mutation Feedback  
**Target:** Cashly Settings Surface (`/settings`)  
**Date:** October 3, 2026  

---

## 1. Save Models & Mutation Architecture

| Domain | Control | Save Model | Feedback Protocol |
|---|---|---|---|
| **Account Name** | Input field | **Explicit Save** (Form submission) | "Save Changes" button state (loading spinner) → Sonner success toast + `sound.playSuccess()`. |
| **Base Currency** | Dropdown (`Select`) | **Instant Auto-Save** | Optimistic store update (`currencyService` + `useUIStore`) → API PATCH → "Currency updated to USD ($)" toast. |
| **Theme / Appearance** | Dropdown / Toggle | **Instant Auto-Save** | Optimistic HTML `dark` class toggle + store update → API PATCH. |
| **Sound / Motion** | Toggle Switch | **Instant Auto-Save** | Optimistic state update + immediate sound feedback test. |
| **Notifications** | Toggle Switches | **Instant Auto-Save** | Optimistic state update → API PATCH → Sonner toast. |
| **AI Toggles** | Toggle Switches | **Instant Auto-Save** | Optimistic state update → `settingsApi.updateAI()` → AI status update. |
| **Test AI Latency** | Action Button | **Trigger / Diagnostic** | "Pinging model..." state → Real-time response badge (e.g. `200 OK: groq (llama-3.3-70b)`). |
| **Clear Chat Cache** | Action Button | **Explicit Action** | Confirmation dialog / inline warning → `settingsApi.clearChatMemory()`. |
| **Password Reset** | Action Button | **Explicit Action** | Loading state → "Password reset link sent to email" toast. |
| **Data Purge** | Two-Step Modal | **High-Stakes Modal** | Accessible Dialog → Step 1: Type confirmation phrase → Step 2: Input Email OTP → Confirm. |

---

## 2. Eliminating `window.prompt()` for Danger Zone

### Legacy Hazard:
The V5 implementation used blocking browser `window.prompt()` calls:
```ts
const typed = window.prompt(`Type RESET to purge ${resetCategory} data.`);
const otp = window.prompt('Enter verification OTP from your email:');
```
This freezes the browser thread, triggers pop-up blocker warnings, breaks on mobile Safari/Chrome, and provides zero visual styling or error recovery.

### V7 Accessible Radix Dialog Flow:
1. User clicks **"Initiate Data Purge"** on a specific category (e.g. `Transactions`).
2. An accessible `<Dialog>` opens with `role="alertdialog"`:
   - Header: Warning icon with crimson badge + "Irreversible Ledger Purge".
   - Step 1: Prompt asking the user to type `PURGE TRANSACTIONS` to unlock.
   - User clicks **"Send Email Verification Code"**.
   - Step 2: 6-digit OTP input box appears with countdown timer.
   - User enters OTP and confirms.
   - Modal displays live deletion spinner and closes on success.
