# CASHLY V8 — SEMANTIC STATES & FINANCIAL CHROMATICS

## 1. Strict Semantic Division

Color in Cashly V8 is functional, not decorative. It adheres strictly to financial ergonomics:

| State | Light Mode Token | Dark Mode Token | Semantic Financial Meaning | Forbidden Misuse |
| :--- | :--- | :--- | :--- | :--- |
| **Brand / Primary** | `#0F766E` (Pine Teal) | `#2DD4BF` (Bright Mint) | Navigation active tab, primary system actions, brand mark | Never use for general positive income or success alerts |
| **Success / Inflow** | `#15803D` (Forest Green)| `#22C55E` (Emerald) | Deposits, surplus cashflow, under-budget velocity | Never use for primary action buttons |
| **Warning / Pacing** | `#B45309` (Amber) | `#F59E0B` (Vibrant Amber)| Burn rate acceleration, 80%+ budget consumption, expiring free trials | Never use for critical security errors |
| **Danger / Outflow** | `#C24141` (Crimson) | `#F87171` (Coral Red) | Exceeded limits, subscription price hikes, negative cashflow floor | Never use as an aesthetic accent |
| **Agentic / Co-Pilot**| `#6D28D9` (Deep Violet) | `#A78BFA` (Lavender) | AI insights, autonomous habit generation, voice operator | Never use for standard ledger rows |

---

## 2. Interactive States Matrix

Every interactive element implements all 8 canonical states:

1. **Default:** Baseline contrast meeting WCAG AAA (`contrast >= 7:1` for text, `3:1` for controls).
2. **Hover:** 1.05x subtle micro-scale or 5% shade delta (`var(--color-brand-hover)`).
3. **Focus:** Visible 2px outline with 2px offset (`outline: 2px solid var(--color-brand); outline-offset: 2px;`).
4. **Active / Pressed:** 0.98x spring scale.
5. **Loading:** Inline spinner (`Loader2`) preserving original container width/height to avoid layout shifts.
6. **Success Feedback:** Brief check icon transition with green tint.
7. **Error / Invalid:** Hairline crimson border with inline helper explanation.
8. **Disabled:** 40% opacity, `cursor: not-allowed`, pointer events suppressed.
