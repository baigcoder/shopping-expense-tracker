# CASHLY — SETTINGS & PREFERENCES (V5)

**Classification:** System Architecture Specification (Authority #29)  
**Primary Route:** `/settings` (and `/profile`)  
**Core Purpose:** Comprehensive, segmented user configuration across preferences, security, AI models, and account lifecycle.  

---

## 1. Segmented Settings Architecture

Settings avoids a sprawling single-form anti-pattern by grouping controls into distinct panels:
1. **Profile & Account:** Full name, email address, avatar upload with cropper.
2. **Currency & Localization:** Primary display currency (USD, PKR, EUR, GBP, CAD, AUD, INR) with real-time formatting preview.
3. **Appearance & Themes:** Light mode, Dark mode, System automatic preference.
4. **Audio & Sound Effects:** Enable/disable tactical audio chimes, volume slider.
5. **AI Engine Configuration:** Toggle real-time context streaming, memory persistence, and auto-refresh intervals.
6. **Security & Authentication:** Password update, active sessions list, Plaid bank disconnect controls.
7. **Danger Zone:** Multi-step OTP confirmation dialog for resetting transactions, purging categories, or permanent account deletion.
