# CASHLY — TACTICAL IMPLEMENTATION PLAN (V5)

**Classification:** Tactical Execution Plan (Authority #39)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Phased Execution Roadmap

```
PHASE 0: Forensic Audit & Baseline Evaluation (Completed)
PHASE 1: Visual & Ergonomic Research (Completed)
PHASE 2: Master Art Direction Charter (Completed)
PHASE 3: Design Tokens & CSS Harmonization (Active)
PHASE 4: Global UI Primitives & Residual Cleanup
PHASE 5: Application Shell (Sidebar, TopBar, MobileBottomNav, CommandPalette)
PHASE 6: Home (Command Center, Safe Headroom, Attention Rail)
PHASE 7: Activity (Canonical Ledger & Side-Sheet)
PHASE 8: Review Workflow (Inbox Triage, Rules Engine)
PHASE 9: Plan (Commitments, Budgets, Goals, Calendar)
PHASE 10: Analyze (Spending Patterns, Donut Charts, Reports)
PHASE 11: Money Twin (Burn Velocity, Predictive Run)
PHASE 12: Assist (Embedded Co-Pilot, Weekly Coach)
PHASE 13: Cards & Accounts (Payment Instruments)
PHASE 14: Extension Companion (Telemetry)
PHASE 15: Settings & Profile (Preferences, Danger Zone)
PHASE 16: Public Landing (Editorial Narrative)
PHASE 17: Authentication (Login, Signup, Verify)
PHASE 18: Mobile Ergonomics & Breakpoints (390px, 430px, 768px, 1024px)
PHASE 19: Accessibility & WCAG 2.2 AA Audit
PHASE 20: Performance & Bundle Verification
PHASE 21: Full Regression Testing Suite
PHASE 22: Final Visual Audit & Adversarial Review
```

---

## 2. Immediate Tactical Targets

1. **Token Harmonization:** Refine `index.css` with the validated V5 tokens (`--color-canvas: #F6F5F1`, `--color-ink: #171719`, `--color-brand: #D92F57`, etc.).
2. **Clean Dead Imports in `App.tsx`:** Remove unused lazy imports (`ExpenseDetailsPage`, `BillsPage`, `RecurringPage`, `AccountsPage`, `BillRemindersPage`, `AITestPage`, `ExtensionGate`).
3. **Refactor `ShoppingActivityPage.tsx`:** Eliminate legacy neobrutalist module styles and integrate Calm Finance `Surface`, `Badge`, and tabular typography.
4. **Compile Gate:** Validate with `npm run build` at every single milestone.
