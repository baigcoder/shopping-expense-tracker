# 05 — TYPOGRAPHY & TABULAR DATA ARCHITECTURE
**Canonical Path:** `/docs/design-final/05_TYPOGRAPHY.md`  
**Status:** CANONICAL MASTER  
**Type Families:** Syne (Display Editorial), Plus Jakarta Sans (Interface & Meta), JetBrains Mono (Financial Tabular)

---

## 1. Type Family Hierarchy

| Hierarchy Level | Font Family | Weights | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Editorial** | `Syne`, sans-serif | 800 (ExtraBold), 700 (Bold) | `-0.03em` to `-0.04em` | Page hero declarations, section banners, uppercase category badges, monumental statements. |
| **Interface & Body** | `Plus Jakarta Sans`, sans-serif | 600 (SemiBold), 500 (Medium), 400 (Regular) | `-0.01em` | Form labels, navigation links, descriptive explanations, modal instructions. |
| **Financial Figures** | `JetBrains Mono` / `Geist Mono` | 700 (Bold), 600 (SemiBold), 500 (Medium) | `0em` (`tabular-nums`) | Monetary amounts, ledger rows, timestamps, percentages, card numbers, transaction IDs. |

---

## 2. Typographic Scale & Utility System

### The `editorial-title` Class:
```css
.editorial-title {
  font-family: 'Syne', sans-serif;
  letter-spacing: -0.035em;
  font-weight: 800;
  text-transform: uppercase;
  line-height: 0.95;
}
```

### Typographic Hierarchy Matrix:
- **Display XXL (Page Statement)**: `text-4xl md:text-6xl font-black uppercase tracking-tight` (e.g., *"COMMAND & CONTROL"*, *"KNOW WHAT HAPPENED. KNOW WHAT COMES NEXT."*).
- **Section Heading XL**: `text-2xl md:text-3xl font-bold uppercase tracking-tight` (e.g., *"SOVEREIGN REVIEW TERMINAL"*).
- **Sub-heading L**: `text-lg md:text-xl font-bold` for card headers and modal dialog titles.
- **Editorial Tag / Category Badge**: `text-[10px] md:text-xs font-black tracking-widest uppercase` (e.g., `LIQUID HEADROOM`, `SYSTEM GOVERNANCE`, `AI TELEMETRY`).
- **Financial Balance Hero**: `text-3xl md:text-5xl font-mono font-black tracking-tight tabular-nums`.
- **Ledger Row Amount**: `text-sm md:text-base font-mono font-bold tabular-nums`.

---

## 3. Formatting Laws for Numbers & Currencies

1. **Tabular Numerals Everywhere**: Any element rendering a currency balance, percentage, date, or metric MUST use `tabular-nums font-mono`. This prevents layout shifts when counts animate and ensures decimal points line up vertically in tables.
2. **Explicit Signage**:
   - Inflows & Income: Explicit `+` prefix in green (`text-emerald-500 font-mono font-bold`).
   - Outflows & Debits: Standard format or `-` prefix in neutral ink / red (`text-ink font-mono font-bold`).
3. **Decimals & Cents**:
   - Primary balances render cents clearly formatted (e.g., `$24,850.00` or benchmark European format `2.768,71 USD`).
   - Zero truncation is strictly prohibited for ledger reconciliation views.
