# CASHLY — MASTER EXECUTION PROTOCOL (V5)

**Classification:** Master Operational Charter (Authority #0)  
**System:** Cashly Financial Operating System  
**Status:** Canonical, Active & Enforced  

---

## 1. Principles of Engagement

This protocol governs the complete visual, UX, interaction, responsive, and design-system transformation of Cashly into an executive-grade, world-class personal financial operating system.

### 1.1 The Golden Constraints
1. **Preserve All Working Business Logic:** Never alter or break database schemas, Supabase Row-Level Security (RLS) policies, REST API endpoints, WebSockets real-time sync, Plaid / OCR integrations, or the MV3 browser extension DOM interceptors.
2. **One Cohesive System:** The product must feel like a single unified instrument. An action performed in one pillar (e.g., approving a charge in Activity) must cascade visually and contextually across Home, Plan, Analyze, and Assist.
3. **No Decorative Crutches:** Eliminate generic SaaS templates, card-inside-card syndrome, gratuitous AI glow gradients, and repetitive layouts.
4. **Color Economy:** Maintain an 80–90% neutral foundation. Color is strictly functional and semantic.
5. **Continuous Verification:** Every phase is validated with `npm run build` and end-to-end inspection to guarantee zero compile errors and zero runtime regressions.

---

## 2. Phase Roadmap (Phases 0 through 22)

```
[ PHASE 0 ] Forensic Audit (Complete)
      ↓
[ PHASE 1 ] Visual Research (docs/design-v5/01_VISUAL_RESEARCH.md)
      ↓
[ PHASE 2 ] Art Direction Charter (docs/design-v5/02_ART_DIRECTION.md)
      ↓
[ PHASE 3 ] Design Tokens & Architecture (tokens, index.css, semantic states)
      ↓
[ PHASE 4 ] Global UI Primitives (Button, Surface, Dialog, SideSheet, Badge, Input)
      ↓
[ PHASE 5 ] Application Shell (Responsive Desktop Sidebar, Universal TopBar, MobileBottomNav, Command Palette)
      ↓
[ PHASE 6 ] Pillar 1: Home (Command Center, Financial Pulse, Attention Rail, Trajectory Curve)
      ↓
[ PHASE 7 ] Pillar 2: Activity (Canonical Ledger, Deep Filtering, Contextual Inspection Side-Sheet)
      ↓
[ PHASE 8 ] Review Workflow (Needs Review Triage, Batch Actions, Merchant Rules Engine)
      ↓
[ PHASE 9 ] Pillar 3: Plan (Unified Commitments Manager, Velocity Budgets, Savings Goals, Cashflow Calendar)
      ↓
[ PHASE 10 ] Pillar 4: Analyze (Decision Analytics, Category Donut, Channel Splits, Merchant Leaderboard)
      ↓
[ PHASE 11 ] Money Twin (Daily Burn Velocity, Runway Headroom, End-of-Month Predictive Trajectory)
      ↓
[ PHASE 12 ] Pillar 5: Assist (Live Context Hub, Grounded Action Cards, Weekly Coach Plan, Voice Actions)
      ↓
[ PHASE 13 ] Payment Instruments & Net Worth (Card Visualizer, Bank Accounts, Asset/Liability Ledger)
      ↓
[ PHASE 14 ] Extension Companion (Non-blocking Telemetry, Active Site Detection Status, Capture Queue)
      ↓
[ PHASE 15 ] Settings & Profile (Segmented Preferences, Currency System, Danger Zone Account Controls)
      ↓
[ PHASE 16 ] Landing & Public Presence (Editorial Visual Storytelling, Interactive Lifecycle Engine)
      ↓
[ PHASE 17 ] Authentication Surfaces (Login, Signup, Password Reset, Verification with Inline Validation)
      ↓
[ PHASE 18 ] Mobile Refinement (390px, 430px Native Mobile Ergonomics, Safe Areas, Touch Targets ≥ 44px)
      ↓
[ PHASE 19 ] Accessibility & Contrast (WCAG 2.2 AA Compliance, Focus Rings, Screen-Reader Labels)
      ↓
[ PHASE 20 ] Performance & Bundle Optimization (Dynamic Imports, Zero Render Loops, Code Splitting)
      ↓
[ PHASE 21 ] Regression QA & Integration Testing
      ↓
[ PHASE 22 ] Final Visual Audit & Adversarial Critique
```

---

## 3. Definition of Done

A phase is complete only when:
- **Code Integrity:** `tsc -b && vite build` completes with 0 errors.
- **Hierarchy:** Primary financial data (`tabular-nums`) dominates; secondary data provides immediate context.
- **Semantic Fidelity:** Emerald = positive/income, Amber = warning/attention, Red = true danger/overdue, Rose = Cashly primary CTA/brand, Purple = Assist AI only.
- **Responsive Geometry:** Flawless rendering from 390px mobile to 1920px ultrawide without horizontal overflow or clipped text.
- **Zero Placeholder Syndrome:** All views render real data or actionable, motivating empty states.
