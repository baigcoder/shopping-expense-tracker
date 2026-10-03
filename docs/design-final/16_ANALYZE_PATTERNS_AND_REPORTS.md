# 16 — ANALYZE: SPENDING PATTERNS & STATEMENTS
**Canonical Path:** `/docs/design-final/16_ANALYZE_PATTERNS_AND_REPORTS.md`  
**Status:** CANONICAL MASTER  
**Routes:** `/analytics` (Spending Patterns), `/reports` (Statements & Tax Exports)  
**Components:** `AnalyticsPage.tsx`, `ReportsPage.tsx`, `AnalyzeNavigationTabs.tsx`

---

## 1. Spending Patterns (`/analytics`)

- **Sub-Navigation**: Seamless integration of `AnalyzeNavigationTabs.tsx` (`Patterns`, `Money Twin`, `Statements`).
- **Benchmark Dual-Bar Chart**:
  - Soft Candy Pink accenting (`#F0A1CB`) for discretionary monthly comparison bars.
  - Active period halo highlighting (e.g. September focus).
- **Categorical Breakdown**:
  - Donut/bar distribution of capital outflows with tabular percentages.
  - Directional momentum badges (`↗ +12%` food vs. 30-day baseline).

---

## 2. Statements & Reporting (`/reports`)

- **Printable Formal Layouts**: Sovereign layout formatted for accounting audits, mortgage verifications, and tax filings.
- **Export Engines**: Instant PDF generation via `jspdf` and Excel/CSV spreadsheets via `xlsx`.
- **Tax Deductible Ledger**: Filtered view displaying validated business expenses with receipt OCR attachments and verified audit trails.
