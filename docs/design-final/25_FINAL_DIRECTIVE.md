# 25 — FINAL CANONICAL SYSTEM DIRECTIVE
**Canonical Path:** `/docs/design-final/25_FINAL_DIRECTIVE.md`  
**Status:** CANONICAL MASTER  
**Governing Authority:** Principal Product Designer & Fintech Architect

---

## 1. The Immutable Master Directives

1. **ONE VISUAL DNA — DIFFERENT PAGE COMPOSITIONS**:
   - The visual grammar established by the V10 Landing Page is the absolute benchmark for every existing and future screen in Cashly.
   - Do NOT invent secondary design languages for internal tools or auxiliary pages.
2. **NO GENERIC SAAS REGRESSION**:
   - The creation of generic 3-card rows with white backgrounds, light gray borders, and small rounded icon squares is strictly prohibited.
   - All feature presentations must use monolithic color blocking, asymmetric split ratios, or high-density hairline tabular grids.
3. **TABULAR ACCURACY**:
   - Every numeral representing capital, percentage, time, or debt must be formatted with monospaced tabular figures (`tabular-nums font-mono`).
4. **FUNCTIONAL CONTINUITY**:
   - Visual redesigns must never compromise backend data contracts, Supabase real-time subscriptions, PKCE OAuth sessions, or export capabilities.
5. **ZERO-TOLERANCE BUILD POLICY**:
   - Any commit that introduces TypeScript strict-mode compiler errors (`tsc -b`), bundler failures (`vite build`), or test suite regressions (`vitest run`) is strictly barred from deployment.
