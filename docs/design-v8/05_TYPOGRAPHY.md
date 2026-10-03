# CASHLY V8 — TYPOGRAPHY SYSTEM

## 1. Typeface Architecture

Cashly V8 enforces strict typographic hierarchy to elevate financial legibility:

- **Display & Section Headers:** High-precision geometric sans (`font-sans` / `font-display`).
- **Body & Secondary Copy:** System-native sans stack (`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) with balanced letter-spacing.
- **Financial Numerals & Ledgers:** Fixed-width tabular numerals (`font-mono`, `tabular-nums`) ensuring column decimals and signs align perfectly.

---

## 2. Scale & Hierarchy Tokens

| Level | Size Range | Weight | Line Height | Tracking | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | 56px–72px | 800 (Extrabold) | 1.05 | -0.03em | Landing page hero moments, flagship stat numbers |
| **Page Heading** | 32px–40px | 700 (Bold) | 1.15 | -0.025em | Major pillar headers (Money Activity, Money Twin) |
| **Section Heading**| 22px–28px | 600 (Semibold) | 1.25 | -0.02em | Section titles, panel headers, major card titles |
| **Subheading / Stat**| 18px–20px | 600 (Semibold) | 1.35 | -0.01em | Table section names, KPI secondary numbers |
| **Body (Default)** | 14px–15px | 400 / 500 | 1.50 | 0.00em | Transaction descriptions, explanations, form inputs |
| **Secondary / Meta**| 12px–13px | 500 (Medium) | 1.40 | +0.01em | Table column headers, dates, status badges, helper copy |
| **Micro / Mono** | 10px–11px | 600 / 700 | 1.30 | +0.03em | Uppercase table headers, compact badges, commit tags |

---

## 3. Financial Numeral Principles

1. **Tabular Numeral Alignment:** All currency values render with `tabular-nums font-mono` to prevent horizontal jitter during real-time value updates.
2. **Right-Alignment:** Numeric columns in tables (Debit, Credit, Balance, Limit) strictly right-align so integer positions align vertically.
3. **Decimals Treatment:** Minor currencies (cents/paise) may be sized down (`text-sm font-normal text-muted`) for enhanced visual scanning on larger numbers.
