# CASHLY — PUBLIC DESIGN SYSTEM SPECIFICATION

**Document:** `07_PUBLIC_DESIGN_SYSTEM.md`  
**Classification:** Visual Guidelines & Design Tokens for Public & Auth Surfaces  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Aesthetic Tenets: Editorial Calm Finance

The public website adopts the same executive design foundation as the authenticated product:
- **Warm Canvas:** Soft, non-glare off-white (`#FAF8F5`) creating high contrast with crisp white product cards.
- **Hairline Borders:** Subtle 1px borders (`#E7E5E4` / Stone 200) defining clear information modules without heavy box outlines.
- **Tactile Depth:** Ambient multi-stop shadows (`--shadow-sm` through `--shadow-lg`) providing soft elevation.
- **Intentional Rose Accent:** `#E11D48` used sparingly for primary conversion actions, active states, and brand marks.
- **Tabular Precision:** `.tabular-nums` enforced on every displayed currency amount to prevent horizontal shifting during animations.

---

## 2. Typography Hierarchy

| Style Token | Font Family | Size | Weight | Line Height | Usage |
|:---|:---|:---|:---|:---|:---|
| **Display XL** | Plus Jakarta Sans | 3.5rem (56px) | 700 | 1.1 | Hero Main Headline |
| **Display LG** | Plus Jakarta Sans | 2.5rem (40px) | 600 | 1.15 | Section H2 Headings |
| **Display MD** | Plus Jakarta Sans | 1.75rem (28px) | 600 | 1.25 | Card & Feature Titles |
| **Body LG** | Inter | 1.125rem (18px) | 400 | 1.6 | Hero Subheadings & Intro Leads |
| **Body MD** | Inter | 0.9375rem (15px) | 400 | 1.5 | Feature explanations, Body text |
| **Body SM** | Inter | 0.8125rem (13px) | 500 | 1.4 | Badges, Table cells, Metadata |
| **Eyebrow** | Inter | 0.75rem (12px) | 600 | 1.2 | Uppercase section markers (`tracking-wider`) |

---

## 3. Surface & Elevation Tokens

```css
/* Core Marketing Tokens */
--mkt-canvas: #FAF8F5;
--mkt-surface: #FFFFFF;
--mkt-surface-subtle: #F5F2EB;
--mkt-border: #E7E5E4;
--mkt-text-heading: #1C1917;
--mkt-text-body: #57534E;
--mkt-text-muted: #78716C;
--mkt-accent: #E11D48;
--mkt-accent-hover: #BE123C;
--mkt-accent-subtle: #FFF1F2;
```

---

## 4. Visual Anti-Patterns (Explicitly Forbidden)

1. ❌ **No Purple/Cyan Neon Gradients:** Avoid generic "crypto/AI" aesthetics.
2. ❌ **No Floating Random 3D Blobs:** Zero floating spheres, glass rings, or non-functional shapes.
3. ❌ **No Stock Photography:** No smiling business people in suits holding credit cards.
4. ❌ **No Fake Dashboard Screenshots:** Every product visualization must be assembled from real design-system DOM primitives.
