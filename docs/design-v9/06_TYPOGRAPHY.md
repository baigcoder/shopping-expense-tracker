# CASHLY V9 — 06 TYPOGRAPHY SYSTEM
## Editorial Hierarchy, Tabular Financial Numerals & Scale

### 1. Typographic Philosophy

Financial management requires absolute optical clarity and editorial gravitas. In Cashly V9, typography is not decorative frosting; it defines the layout architecture.

```
Hero Headlines     : 64px – 96px (Clash / Plus Jakarta Sans Display, tight tracking -0.035em)
Primary Section    : 36px – 48px (Semibold / Bold, tracking -0.025em)
Financial Anchors  : 40px – 72px (Tabular Numerals, High Contrast)
Subsections/Headers: 20px – 28px (Medium / Semibold, tracking -0.015em)
Body Copy          : 15px – 17px (Inter, 1.55 line-height, optimized for reading)
Micro/Meta Data    : 11px – 13px (Inter / JetBrains Mono, uppercase tracking +0.06em)
```

### 2. Money as Hero: Tabular Numeral Discipline

All monetary values must adhere to the following strict conventions:
- Use `font-variant-numeric: tabular-nums` (`tabular-nums` class) to ensure equal width glyph alignment across all digits, preventing jitters during counting animations or table scanning.
- Currency symbols are optically balanced with the integer portion, while decimals/cents sit slightly subdued or tabular.
- Large financial hero anchors (`Rs 42,870`) are given dedicated compositional prominence rather than being shoehorned into 14px badges or standard paragraph tags.

### 3. Font Families

- **Display**: `Plus Jakarta Sans`, sans-serif (Tight, modern, architectural weight)
- **Body & Interface**: `Inter`, system-ui, sans-serif (Neutral, ultra-legible at small sizes)
- **Technical & Formulaic**: `JetBrains Mono`, monospace (Ledger IDs, timestamps, percentage deltas, formula breakdowns)
