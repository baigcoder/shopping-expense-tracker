# CASHLY — VISUAL & INTERACTION RESEARCH (V5)

**Classification:** Competitive & Ergonomic Research Specification (Authority #1)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Executive Research Mandate

Financial software bears a distinct psychological burden: users do not view money interfaces casually. They view them with anxiety, urgency, or critical scrutiny. The objective of this research is to deconstruct how the world's most acclaimed financial platforms (Mercury, Ramp, Copilot Money, Apple Card, Stripe, and Linear) establish unconditional trust, cognitive calm, and tactical speed.

---

## 2. Competitive Deconstruction & Architectural Extraction

### 2.1 Mercury Bank (Quiet Luxury & Institutional Confidence)
- **What they do right:**
  - Neutral canvas warmth: Replaces harsh sterile white (`#FFFFFF`) with warm stone neutrals (`#FAF9F7`), eliminating eye fatigue during prolonged financial auditing.
  - Hairline dividers: Uses 1px borders (`#E5E5E0`) with muted contrast rather than drop-shadow card stacks. Information feels etched into the canvas.
  - Tabular typography: Strict font-variant numeric tabular figures ensure cents and decimals align vertically across hundreds of transaction rows.
- **Cashly Application:** Cashly's ledger, header bar, and balances adopt Mercury’s quiet warm neutral canvas and precision tabular alignment.

### 2.2 Ramp & Brex (Operational Velocity & Review Workflows)
- **What they do right:**
  - Attention-first triage: Expense approval queues are isolated from the main ledger. Users have an inbox of pending items with clear, unambiguous decision controls (`Approve`, `Flag`, `Request Receipt`).
  - Contextual Side-Sheets: Clicking a transaction opens a slide-over panel on the right margin without navigating away, allowing users to rapidly arrow through rows (`J`/`K` navigation) while inspecting receipts.
- **Cashly Application:** The Review Inbox (`/transaction-inbox`) and Canonical Ledger (`/transactions`) employ the Contextual Side-Sheet (`TransactionSideSheet.tsx`), retiring disruptive modal stacks.

### 2.3 Copilot Money (Human Finance & Emotional Intelligence)
- **What they do right:**
  - Calibrated category hues: Instead of 20 conflicting neon colors, categories use muted, harmonious tones that preserve semantic meaning without visual noise.
  - Velocity pacing: Compares month-to-date spending directly against expected daily calendar progress, visually highlighting if the user is spending faster than the calendar days are passing.
- **Cashly Application:** The Budgets engine and Cashflow Calendar adopt Copilot’s velocity pace bar, warning users when category burn rate outpaces elapsed days.

### 2.4 Stripe Dashboard (Data Density & Hierarchy Precision)
- **What they do right:**
  - Information density: Dense data tables that maximize rows per viewport while maintaining generous row padding and instant visual hierarchy (bold merchant names, subdued dates, right-aligned monetary values).
  - Progressive disclosure: Secondary metadata (e.g., raw card tokens, authorization codes) is tucked into expandable accordions or side-sheets.
- **Cashly Application:** High-density activity views prioritize the monetary amount, primary merchant title, and approval state, tucking JSON metadata and raw transaction candidate strings into the inspection drawer.

---

## 3. Financial UI Core Tenets for Cashly

| Principle | Anti-Pattern | Cashly V5 Standard |
| :--- | :--- | :--- |
| **Number Hierarchy** | Centered small numbers with floating currency symbols. | Bold, left- or right-aligned figures with `font-variant-numeric: tabular-nums` and consistent currency code prefixes. |
| **Color Semantics** | Using red for warnings, pink for expense, green for arbitrary charts. | Emerald strictly for income/positive progress; Amber for attention/impending bills; Red exclusively for overdraft/actual danger; Rose for Cashly identity/CTAs. |
| **Surface Architecture** | Wrapping every statistic, chart, and button inside its own card with shadows. | Open canvas architecture with grouped panels, subtle hairline borders, and elevation reserved for interactive overlays and drawers. |
| **State Communication** | Relying on color alone to indicate status (e.g., green dot). | Triad communication: Color + Semantic Icon + Explicit Text Tag (e.g., `[✓ Approved]`, `[▲ At Risk]`). |
| **AI Ergonomics** | Floating chat window spewing generic financial text trivia. | Grounded co-pilot action cards embedded in-line with direct deep-linked navigation buttons to executable workflows. |
