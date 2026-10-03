# 21 — SETTINGS, GOVERNANCE & IDENTITY
**Canonical Path:** `/docs/design-final/21_SETTINGS_AND_GOVERNANCE.md`  
**Status:** CANONICAL MASTER  
**Routes:** `/settings`, `/profile`  
**Components:** `SettingsPage.tsx`, `ProfilePage.tsx`

---

## 1. System Governance Architecture (`/settings`)

Settings in Cashly is structured as an architectural governance deck rather than a sprawling form list.

### Workspace Structure:
- **Header**: `SYSTEM GOVERNANCE` in Syne display extra-bold.
- **Vertical Navigation Rail (Desktop) / Horizontal Scroll Pills (Mobile)**:
  - Six discrete zones: Profile & Identity, Preferences & Currencies, Security & Sessions, Data & Portability, Notifications & Webhooks, Danger Zone.
- **Data Portability**: Full JSON / CSV export of user ledger with cryptographic hash verification.
- **Security & Sessions**: Active device sessions, 2FA authenticator enrollment, and API token revocation.
- **Danger Zone**: High-contrast crimson card (`#EF4444`) with double confirmation modal for account purging.

---

## 2. Identity & Credentials (`/profile`)

- **Header**: `IDENTITY & CREDENTIALS` with Deep Matte Ink cover background.
- **Avatar Capsule**: Rounded-full profile avatar with instant photo upload.
- **Verified Identity Badge**: Green verified shield indicating active encryption vault.
- **Credential Fields**: High-contrast inputs with clean inline edit triggers.
