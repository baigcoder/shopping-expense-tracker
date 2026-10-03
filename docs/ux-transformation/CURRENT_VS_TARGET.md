# CASHLY — CURRENT VS TARGET ARCHITECTURAL COMPARISON

**Document Classification:** Architectural Comparison Matrix (Authority #4)  
**Status:** Canonical & Enforced  

---

## 1. High-Level Comparison Matrix

| Architectural Dimension | Current Implementation (Cashly Today) | Target Implementation (Cashly Redesigned) | Impact & Rationale |
|:---|:---|:---|:---|
| **Product Model** | 20 disconnected feature pages in a flat, overwhelming sidebar. | **Five Cohesive Pillars:** Home, Activity, Plan, Analyze, Assist. | Reduces cognitive load; organizes product around user’s mental model. |
| **Visual Language** | Stark Neobrutalist classes overridden by a fragile `!important` CSS layer in `index.css`. | **Calm Finance Design System:** Warm canvas, hairline borders, soft elevation, deliberate rose accent. | Eliminates style bleeding and visual discordance across routes. |
| **Desktop Extension Access** | `ExtensionWall` blocks desktop web users from accessing the app until extension is synced. | **Non-Blocking Companion:** Full web app functionality standalone; persistent companion status pill in header. | Eliminates #1 onboarding blocker; allows multi-device access. |
| **Transaction Review** | Staging queue lives in an isolated `/transaction-inbox` screen; approved items disappear silently. | **Integrated Activity Module:** Unified tabs (`Needs Review`, `Ledger`, `Imports`) with optimistic inline triage. | Elevates Cashly’s core differentiator into everyday transaction workflows. |
| **Recurring Commitments** | Fractured across 4 separate pages: `/subscriptions`, `/bills`, `/reminders`, and `/recurring`. | **Unified Commitments:** Single view under `Plan > Commitments` tracking monthly obligations and trial dates. | Answers *"How much is committed before I spend anything?"* in one screen. |
| **Transaction Inspection** | Clicking a transaction opens an opaque dialog modal (`TransactionDialog`) obscuring the table. | **Contextual Side-Sheet (Desktop) / Bottom-Sheet (Mobile):** 420px drawer maintaining ledger context. | Enables rapid multi-item inspection and keyboard navigation without modal fatigue. |
| **Statement Import** | 3 separate giant modals on `/transactions` (CSVImport, PDFAnalyzer, DocumentImportModal). | **Dedicated Imports Sub-View:** Structured 3-step wizard with persistent staging table and column mapping. | Prevents modal stacking and simplifies complex file uploads. |
| **AI Experience** | Disconnected floating chat bubble in bottom-right; `/insights` is static; `/ai-test` is raw dev tool. | **Embedded Co-Pilot:** Actionable assistant with structured UI buttons (deep-links, filters, budget tweaks). | Transforms AI from a chatbot novelty into a high-utility financial operator. |
| **Mobile Navigation** | 4 tabs + 1 hamburger button sliding open a vertical drawer with 10 stacked items. | **5-Pillar Bottom Bar:** Direct access to Home, Activity, Plan, Analyze, Assist + Quick Action FAB. | One-thumb ergonomics; zero hidden overflow menus. |
| **Orphan & Dead Views** | `/expenses` (582-line duplicate), `/recurring` (dummy mock), `/ai-test` (dev harness) in routing. | **Consolidated / Retired:** `/expenses` merged into ledger, `/recurring` deleted, `/ai-test` restricted to dev. | Clean production routing; zero user confusion. |

---

## 2. Deep Screen-by-Screen Transitions

```
 Screen 1: Dashboard
 [ TODAY ]   12 disparate widgets screaming for attention simultaneously.
 [ TARGET ]  Attention-first layout: 1) Available Funds & Pulse, 2) Urgent Review / Bill Alert Rail,
             3) Spending Velocity Curve, 4) Committed Upcoming Outflows, 5) Goal Milestones.

 Screen 2: Transactions & Inbox
 [ TODAY ]   Two completely separate pages. 6 stacked modal dialogs on /transactions.
 [ TARGET ]  Unified Activity surface with tabs: [Needs Review (Inbox)] | [All Transactions (Ledger)] | [Imports].
             Row inspection opens in non-modal Contextual Side-Sheet.

 Screen 3: Commitments & Subscriptions
 [ TODAY ]   User checks /subscriptions for Netflix, /bills for electricity, /reminders for due dates.
 [ TARGET ]  Unified Commitments surface combining bills, subscriptions, and trial countdowns in one table.

 Screen 4: Intelligence & AI
 [ TODAY ]   Floating chat bubble with text responses; /insights page has static cards; /ai-test in production.
 [ TARGET ]  Contextual Assist Hub: AI with live financial context that generates clickable action cards
             (e.g., "[Review 3 Dining Transactions]", "[Adjust Shopping Budget by $50]").
```
