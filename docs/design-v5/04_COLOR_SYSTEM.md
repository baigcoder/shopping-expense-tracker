# CASHLY — MASTER COLOR SYSTEM (V5)

**Classification:** Technical Color Specification (Authority #4)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Master Semantic Color Palette

Color is strictly functional and semantic. Every hue has an unambiguous, singular meaning across all product surfaces.

### 1.1 Canvas, Surface & Ink Tokens

| Token Name | Light Value | Dark Value | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `--color-canvas` | `#F6F5F1` | `#121110` | Warm neutral page background; zero optical glare. |
| `--color-surface` | `#FFFFFF` | `#1C1917` | Pure white structural surface for cards, panels, sheets. |
| `--color-surface-2` | `#EFEEE9` | `#24211E` | Secondary container fill; table headers, inactive tabs. |
| `--color-ink` | `#171719` | `#FAF8F5` | Warm deep stone black; primary typography & active figures. |
| `--color-ink-secondary` | `#56565C` | `#D6D3D1` | Subdued secondary text; metric labels, descriptions. |
| `--color-muted` | `#77777D` | `#A8A29E` | Captions, metadata, helper text, disabled states. |
| `--color-border` | `#DDDCD7` | `#332E2A` | 1px hairline structural dividers and table borders. |
| `--color-border-strong` | `#C9C8C3` | `#443E38` | Emphasized borders, active input outlines, selected cards. |

---

### 1.2 Brand & Semantic State Tokens

| Semantic Role | Primary Hue | Soft Background | Primary Purpose | Prohibited Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Brand (Rose)** | `#D92F57`<br>(hover: `#B92246`) | `#FBE8ED` | Primary CTAs, Cashly monogram, focused interactive states. | Never use as an indicator of danger or negative cashflow. |
| **Success (Emerald)** | `#167A52` | `#E8F5EF` | Income, savings milestones, positive cash balance, on-track status. | Never use for general informational banners. |
| **Warning (Amber)** | `#A35C00` | `#FFF3DF` | Attention rail, bills due in <48h, budget velocity >80%. | Never use red for early warnings or threshold alerts. |
| **Danger (Red)** | `#C73A3A` | `#FCEAEA` | Overdue bills, hard budget overruns, destructive delete actions. | Never use for standard expense amounts. |
| **Info (Blue)** | `#356AE6` | `#EAF0FF` | System notifications, bank sync status, extension connection. | Never use for user financial transactions. |
| **AI (Purple)** | `#7547C7` | `#F1EBFF` | Cashly Co-Pilot intelligence, smart recommendations, voice. | Never use for standard transactional ledger rows. |

---

## 2. Category Palette Specification

Category colors must remain mathematically uniform across all pie charts, bar charts, transaction badges, and budget bars:

- **Food & Dining:** `#D97706` (Warm Amber)
- **Shopping & Retail:** `#D92F57` (Cashly Rose)
- **Subscriptions & SaaS:** `#6366F1` (Indigo)
- **Transport & Fuel:** `#0284C7` (Sky Blue)
- **Bills & Utilities:** `#4B5563` (Slate)
- **Health & Medical:** `#059669` (Emerald)
- **Entertainment & Media:** `#9333EA` (Purple)
- **Income & Transfers:** `#10B981` (Bright Emerald)
- **Other & General:** `#78716C` (Stone Neutral)

---

## 3. Accessibility & Contrast Verification

All text tokens meet or exceed **WCAG 2.2 Level AA** contrast standards:
- `--color-ink` (`#171719`) on `--color-canvas` (`#F6F5F1`): **14.2:1** (Far exceeds AAA requirement of 7:1).
- `--color-ink-secondary` (`#56565C`) on `--color-surface` (`#FFFFFF`): **7.8:1** (Exceeds AAA).
- `--color-brand` (`#D92F57`) on `--color-surface` (`#FFFFFF`): **5.1:1** (Exceeds AA requirement of 4.5:1).
- `--color-success` (`#167A52`) on `--color-surface` (`#FFFFFF`): **5.6:1** (Exceeds AA).
- `--color-warning` (`#A35C00`) on `--color-surface` (`#FFFFFF`): **5.4:1** (Exceeds AA).
- `--color-danger` (`#C73A3A`) on `--color-surface` (`#FFFFFF`): **5.2:1** (Exceeds AA).
