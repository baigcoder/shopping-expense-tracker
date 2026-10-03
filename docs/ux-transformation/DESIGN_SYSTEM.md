# CASHLY — CANONICAL DESIGN SYSTEM SPECIFICATION

**System Name:** Cashly Calm Finance Design System  
**Document Classification:** Technical Design Specification (Authority #2)  
**Status:** Canonical & Enforced  

---

## 1. Aesthetic Foundations

The Cashly Design System replaces the obsolete Neobrutalist styling with an **executive-grade, calm, and intelligent aesthetic**.

- **Personality:** Calm financial co-pilot, precise, trustworthy, human, modern.
- **Visual Tenets:**
  1. **Refined Surfaces:** Warm canvas with soft card surfaces and hairline borders.
  2. **Subtle Elevation:** Soft, layered ambient shadows; zero harsh solid black offsets.
  3. **Deliberate Accent:** Cashly Rose used intentionally for primary CTAs and brand identity, with semantic emerald for income/savings and amber for upcoming bills.
  4. **Data Clarity:** Financial numbers formatted with `tabular-nums` and strong typographic scale.
  5. **Purposeful Motion:** Micro-animations for feedback, state transitions, and progressive disclosure; full `prefers-reduced-motion` compliance.

---

## 2. Token Definitions

### 2.1 Color Tokens

```css
:root {
  /* Canvas & Surfaces */
  --cashly-bg-canvas:       #FAF8F5; /* Warm off-white background */
  --cashly-bg-surface:      #FFFFFF; /* Pure white card surface */
  --cashly-bg-subtle:       #F5F2EB; /* Soft container fill */
  --cashly-bg-muted:        #EDE8DF; /* Muted chip/badge background */
  --cashly-bg-overlay:      rgba(28, 25, 23, 0.46);

  /* Hairline Borders */
  --cashly-border:          #E7E5E4; /* Stone 200 */
  --cashly-border-strong:   #D6D3D1; /* Stone 300 */
  --cashly-border-focus:    #E11D48; /* Rose 600 */

  /* Text & Ink */
  --cashly-text-primary:    #1C1917; /* Stone 900 (Warm Deep Ink) */
  --cashly-text-secondary:  #57534E; /* Stone 600 (Balanced Secondary) */
  --cashly-text-muted:      #78716C; /* Stone 500 (Captions & Meta) */
  --cashly-text-inverse:    #FAF8F5;

  /* Brand Rose Accent */
  --cashly-brand:           #E11D48; /* Rose 600 */
  --cashly-brand-hover:     #BE123C; /* Rose 700 */
  --cashly-brand-light:     #FFF1F2; /* Rose 50 */
  --cashly-brand-muted:     rgba(225, 29, 72, 0.08);

  /* Semantic Intent */
  --cashly-success:         #059669; /* Emerald 600 (Income / Goal Progress) */
  --cashly-success-light:   #ECFDF5; /* Emerald 50 */
  --cashly-warning:         #D97706; /* Amber 600 (Impending Bills / 80% Budget) */
  --cashly-warning-light:   #FFFBEB; /* Amber 50 */
  --cashly-danger:          #DC2626; /* Red 600 (Errors / Overdue) */
  --cashly-danger-light:    #FEF2F2; /* Red 50 */
  --cashly-info:            #2563EB; /* Blue 600 (System Info) */
  --cashly-info-light:      #EFF6FF; /* Blue 50 */
}

/* Dark Theme Tokens */
[data-theme='dark'], .dark {
  --cashly-bg-canvas:       #121110;
  --cashly-bg-surface:      #1C1917;
  --cashly-bg-subtle:       #24211E;
  --cashly-bg-muted:        #2E2A27;
  --cashly-border:          #332E2A;
  --cashly-border-strong:   #443E38;
  --cashly-text-primary:    #FAF8F5;
  --cashly-text-secondary:  #D6D3D1;
  --cashly-text-muted:      #A8A29E;
  --cashly-brand-light:     rgba(225, 29, 72, 0.15);
  --cashly-success-light:   rgba(5, 150, 105, 0.15);
  --cashly-warning-light:   rgba(217, 119, 6, 0.15);
  --cashly-danger-light:    rgba(220, 38, 38, 0.15);
}
```

### 2.2 Typography Scale

- **Display Typography:** `'Plus Jakarta Sans', system-ui, sans-serif`
  - Used for Page titles, Hero headings, KPI metrics (`letter-spacing: -0.025em`)
- **Body & Data Typography:** `'Inter', system-ui, sans-serif`
  - Used for body paragraphs, buttons, labels, and table content
- **Tabular Figures:** All monetary values must use `tabular-nums` for precise visual alignment across columns.

| Scale Token | Font Size | Line Height | Letter Spacing | Standard Use |
|:---|:---|:---|:---|:---|
| `display-lg` | 36px (2.25rem) | 1.15 | -0.03em | Primary Dashboard Balance, Hero H1 |
| `display-md` | 28px (1.75rem) | 1.2 | -0.025em | Page Headers, Section H1 |
| `heading-lg` | 22px (1.375rem) | 1.25 | -0.02em | Card Headers, Module Titles |
| `heading-md` | 18px (1.125rem) | 1.3 | -0.015em | Subsections, Modal Headers |
| `body-lg` | 16px (1rem) | 1.5 | -0.01em | Primary body, large inputs |
| `body-md` | 14px (0.875rem) | 1.45 | 0 | Standard table cells, control labels |
| `caption` | 12px (0.75rem) | 1.4 | 0 | Metadata, helper text, badges |
| `micro` | 11px (0.6875rem) | 1.3 | +0.02em | Currency codes, uppercase tags |

### 2.3 Radius Tokens

- Small controls (inputs, badges, chips): **8px–10px** (`--r-sm` / `--r-md`)
- Cards & standard surfaces: **14px–16px** (`--r-lg`)
- Large surface containers & side-sheets: **18px–20px** (`--r-xl`)
- Centered dialogs: **20px** (`--r-2xl`)

### 2.4 Shadows & Elevation

```css
--shadow-sm:  0 1px 2px rgba(28, 25, 23, 0.04);
--shadow-md:  0 1px 2px rgba(28, 25, 23, 0.05), 0 8px 24px rgba(28, 25, 23, 0.05);
--shadow-lg:  0 2px 4px rgba(28, 25, 23, 0.05), 0 16px 40px rgba(28, 25, 23, 0.08);
--shadow-pop: 0 12px 36px -4px rgba(28, 25, 23, 0.12);
```

---

## 3. Motion System

```typescript
export const MOTION_TOKENS = {
    instant: { duration: 0.1 },
    fast: { duration: 0.18, ease: [0.32, 0.72, 0, 1] },
    normal: { duration: 0.26, ease: [0.32, 0.72, 0, 1] },
    spring: { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 },
    smoothSpring: { type: 'spring', stiffness: 280, damping: 28 },
};
```

---

## 4. UI Primitive Modernization Guidelines

1. **Buttons (`components/ui/button.tsx`):**
   - High-contrast primary: Brand rose `#E11D48` background, white text, soft hover `#BE123C`.
   - Secondary: Subtle background `#F5F2EB`, ink text `#1C1917`, border `#E7E5E4`.
   - Accessible focus ring: `0 0 0 3px rgba(225, 29, 72, 0.18)`.
2. **Contextual Side-Sheet (Desktop) / Bottom Sheet (Mobile):**
   - Built to replace stacked full-page modal dialogs for transaction detail inspection and quick editing.
3. **Command Palette (`CommandPalette.tsx`):**
   - Standard ⌘K / Ctrl+K keyboard shortcut opening universal search across merchants, categories, and quick actions.
4. **Universal Category Palette:**
   - Single canonical color assignment across all views:
     - *Food & Dining:* `#D97706` (Amber)
     - *Shopping:* `#E11D48` (Rose)
     - *Subscriptions & Software:* `#6366F1` (Indigo)
     - *Transport & Travel:* `#0284C7` (Sky Blue)
     - *Bills & Utilities:* `#4B5563` (Slate)
     - *Health & Wellness:* `#059669` (Emerald)
     - *Entertainment:* `#9333EA` (Purple)
     - *Income / Salary:* `#10B981` (Bright Emerald)
     - *Other:* `#78716C` (Stone)
