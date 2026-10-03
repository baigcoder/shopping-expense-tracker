# 10 — DASHBOARD COMMAND & CONTROL CENTER
**Canonical Path:** `/docs/design-final/10_DASHBOARD_COMMAND_CENTER.md`  
**Status:** CANONICAL MASTER  
**Route:** `/dashboard`  
**Components:** `DashboardPage.tsx`, `Sidebar.tsx`, `Header.tsx`, `TransactionModal.tsx`

---

## 1. The Command Center Philosophy

The Home Dashboard is the primary operational flight deck. It answers the fundamental financial question in less than 2 seconds: **"What is my true safe spending headroom right now, factoring in committed liabilities and forward runway?"**

---

## 2. Layout Structure & Monumental Cards

### A. Sovereign Editorial Header
- Section Title: `COMMAND & CONTROL` in Syne display extra-bold.
- Live Status Capsule: `LIVE RECONCILIATION ACTIVE` with pulsing green indicator dot.
- Quick Actions: `+ New Entry` pill in Cadmium Orange, `Export Statement` in Deep Ink.

### B. The 3 Monumental Color-Blocked Cards
1. **The Safe-to-Spend Centerpiece (Cadmium Orange `#EE5024`)**:
   - Spans full width or primary 2-column anchor.
   - Text Tag: `SAFE-TO-SPEND HEADROOM` in crisp white tracking text.
   - Numerical Hero: Large monospaced tabular balance (e.g. `$4,850.00`).
   - Ground Truth Equation:  
     `Liquid Cash ($9,120) - Committed Bills ($2,450) - Planned Savings ($1,820) = Safe to Spend`.
   - Action: `Deploy Capital →` inline capsule button.
2. **Forward Runway Card (Deep Matte Ink `#111111`)**:
   - Text Tag: `RUNWAY PROJECTION`.
   - Metric: `42.5 Days` remaining until next liquidity replenishment.
   - Mini Sparkline: Real-time burn trajectory curve indicating surplus margin.
3. **Locked Commitments Card (Architectural Pure White with Burgundy Accent)**:
   - Text Tag: `CONTRACTUAL LIABILITIES`.
   - Metric: `$2,450.00` committed across 14 active subscriptions and fixed utilities.
   - Renewal Countdown: Next renewal in 3 days (AWS Cloud Infrastructure).

### C. The Canonical Ledger & Needs-Review Intercept
- Direct integration of recent activity with tabular monospaced numbers.
- One-click access to the Sovereign Review Terminal when unprocessed transactions exist.
- Hairline cell dividers, merchant category avatars, and explicit signed values (`+$3,200.00` / `-$45.20`).
