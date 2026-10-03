# CASHLY — MASTER TYPOGRAPHY SYSTEM (V5)

**Classification:** Typographic & Numeric Precision Specification (Authority #5)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Font Family Architecture

1. **Display & Editorial Typography:** `'Plus Jakarta Sans', system-ui, sans-serif`
   - Weight: `600 (SemiBold)`, `700 (Bold)`, `800 (ExtraBold)`
   - Used for: Primary balance displays, hero headings, major KPI statistics, page titles.
   - Character: Geometric yet warm, authoritative, contemporary.
2. **Body, Data & Tabular Typography:** `'Inter', system-ui, sans-serif`
   - Weight: `400 (Regular)`, `500 (Medium)`, `600 (SemiBold)`
   - Used for: Transaction rows, table headers, form inputs, metadata, narrative text.
   - Character: Highly legible at compact sizes, neutral, transparent.

---

## 2. Typographic Scale Specification

| Level | Size Range | Line Height | Tracking | Standard Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 64px – 80px (4.0 – 5.0rem) | 1.05 | -0.035em | Public Landing hero climax, monolithic marketing headlines. |
| **Hero** | 56px – 72px (3.5 – 4.5rem) | 1.10 | -0.030em | Landing value proposition, major financial milestone splash. |
| **Page Heading** | 36px – 48px (2.25 – 3.0rem) | 1.15 | -0.025em | Dashboard Net Headroom, primary screen H1 headers. |
| **Section Title** | 26px – 32px (1.625 – 2.0rem) | 1.25 | -0.020em | Major pillar section titles, modal headers, chart headers. |
| **Card / Module** | 18px – 22px (1.125 – 1.375rem) | 1.30 | -0.015em | Module headers, merchant names in detail side-sheet. |
| **Body Large** | 15px – 17px (0.9375 – 1.0625rem) | 1.50 | -0.010em | Primary explanatory copy, conversational AI responses. |
| **Body Standard** | 13px – 14px (0.8125 – 0.875rem) | 1.45 | 0.000em | Canonical ledger rows, form labels, table cells, buttons. |
| **Caption / Micro** | 10px – 12px (0.625 – 0.75rem) | 1.40 | +0.015em | Dates, transaction tags, source indicators, helper text. |

---

## 3. Financial Number & Tabular Rules

All monetary values and numerical figures must strictly comply with the following rules:

1. **Tabular Figures:**
   ```css
   .tabular-nums, [data-numeric], .stat-value {
     font-variant-numeric: tabular-nums;
   }
   ```
   Every decimal and digit must have identical horizontal width to prevent ragged, misaligned columns in ledger tables and charts.
2. **Monetary Decimal Hierarchy:**
   - On primary summary metrics (e.g., Net Headroom `Rs 42,870`), cents are omitted or styled with secondary opacity when `.00` to prevent visual clutter.
   - On transactional ledger rows, exact cents are always displayed (`Rs 1,240.50`).
3. **Currency Alignment:**
   - In financial tables, amounts are strictly **right-aligned**.
   - Currency symbol is placed immediately preceding the number with no breaking space (`$1,240` or `Rs 4,500`).
