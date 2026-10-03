# CASHLY V8 — COLOR SYSTEM & SEMANTIC SPECIFICATION

## 1. Philosophical Baseline: The End of Cream & Pink
Cashly V8 transitions from the whimsical consumer cream/pink palette to an authoritative, editorial, high-trust fintech palette.
The primary accent is **Pine Teal** (`#0F766E`), reflecting precision, enduring capital management, and institutional clarity.

## 2. Palette Specification

### Canvas & Surfaces
| Token | Hex | Role | Contrast Ratio vs Ink |
| :--- | :--- | :--- | :--- |
| `--color-canvas` | `#F5F7F6` | Primary background canvas | 16.8 : 1 |
| `--color-surface` | `#FFFFFF` | Primary elevated surfaces (cards, sheets, modals) | 18.2 : 1 |
| `--color-surface-2` | `#EEF2F1` | Secondary containers, inputs, table headers | 15.5 : 1 |
| `--color-muted-surface` | `#E2E8E5` | Active pills, badges, borders | 13.2 : 1 |

### Ink & Typography
| Token | Hex | Role | WCAG 2.2 AA Compliance |
| :--- | :--- | :--- | :--- |
| `--color-ink` | `#0B1620` | Obsidian deep black for primary headings, tabular values | PASS (AAA) |
| `--color-ink-secondary` | `#47545D` | Deep slate for body copy and labels | PASS (AAA) |
| `--color-muted` | `#71808A` | Cool grey for captions, timestamps, and secondary metadata | PASS (AA, > 4.5:1) |
| `--color-border` | `#D8DFDC` | 1px hairline border separating sections | Structural |
| `--color-border-strong` | `#BDC7C3` | Emphasized interactive borders | Interactive |

### Primary Brand Accent
| Token | Hex | Role |
| :--- | :--- | :--- |
| `--color-brand` | `#0F766E` | Deep Pine Teal: Primary action buttons, selected nav indicators |
| `--color-brand-hover` | `#0B5E59` | Hover state for primary buttons |
| `--color-brand-soft` | `#E2F3F0` | Soft pine badge backgrounds and active rail tint |

### Strict Financial Semantics
Color must communicate meaning, never decoration:
- **Income & Positive Headroom:** `#15803D` (Forest Green) / `#E7F6EC` (Soft Green)
- **Warning & Pacing Alerts:** `#B45309` (Warm Amber) / `#FFF3DF` (Soft Amber)
- **Danger & Over-Budget:** `#C24141` (Crimson Red) / `#FCEAEA` (Soft Red)
- **System Information:** `#2563EB` (Cobalt Blue) / `#EAF1FF` (Soft Blue)
- **AI Intelligence:** `#6D28D9` (Deep Violet) / `#F1EBFF` (Soft Violet)
