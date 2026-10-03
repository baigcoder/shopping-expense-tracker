# CASHLY SETTINGS V7 — VISUAL SYSTEM SPECIFICATION

**Document:** `/docs/design-v7/settings/04_VISUAL_SYSTEM.md`  
**Classification:** Visual Design Tokens & Component Specs  
**Target:** Cashly Settings Surface (`/settings`)  
**Date:** October 3, 2026  

---

## 1. Color System

| Token | CSS Variable | Hex / Tailwind Value | Application in Settings |
|---|---|---|---|
| **Canvas** | `--color-surface-subtle` | `#FAF8F5` | Main workspace background canvas |
| **Surface** | `--color-surface` | `#FFFFFF` | Settings panels, active nav item, cards |
| **Surface Subtle** | `--color-surface-subtle` | `#F5F3EF` | Disabled inputs, inactive row hovers |
| **Border Subtle** | `--color-border-subtle` | `#E7E5E4` (Stone 200) | Structural dividers, hairline panel borders |
| **Border Strong** | `--color-border` | `#D6D3D1` (Stone 300) | Input borders, dropdown triggers |
| **Text Primary** | `--color-text-primary` | `#1C1917` (Stone 900) | Section titles, input values, active labels |
| **Text Secondary** | `--color-text-secondary` | `#57534E` (Stone 600) | Setting row descriptions, navigation items |
| **Text Muted** | `--color-text-muted` | `#78716C` (Stone 500) | Metadata, helper notes, timestamps |
| **Brand Primary** | `--color-brand` | `#E11D48` (Rose 600) | Primary Save button, active nav pill accent |
| **Brand Subtle** | `--color-brand-subtle` | `#FFF1F2` (Rose 50) | Selected currency highlight |
| **Positive Emerald**| `--color-success` | `#10B981` (Emerald 500)| Verified email badge, saved status, live status |
| **AI Violet** | `--color-ai` | `#8B5CF6` (Violet 500) | AI Co-Pilot status, AI toggles, test ping |
| **Danger Crimson** | `--color-danger` | `#EF4444` (Red 500) | Danger Zone title, purge buttons, reset OTP |

---

## 2. Typography Scale

- **Page Title:** Plus Jakarta Sans, `text-2xl font-bold tracking-tight text-stone-900`
- **Page Subtitle:** Inter, `text-sm text-stone-500 font-normal`
- **Section Heading:** Plus Jakarta Sans, `text-lg font-bold text-stone-900 tracking-tight`
- **Section Description:** Inter, `text-xs text-stone-500`
- **Setting Title:** Inter, `text-sm font-semibold text-stone-900`
- **Setting Description:** Inter, `text-xs text-stone-500 leading-relaxed`
- **Financial Preview / Currency:** JetBrains Mono, `text-2xl font-bold tabular-nums text-stone-900`
- **Technical Telemetry / IP / Latency:** JetBrains Mono, `text-xs tabular-nums text-stone-600`

---

## 3. Spacing & Dimensional Rhythms

- **Scale:** 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px
- **Layout Margins:**
  - Desktop: 32px horizontal padding, 32px gap between nav rail and content canvas.
  - Mobile: 16px horizontal padding, 16px gap between sections.
- **Settings Rows:** `py-3.5 px-4` with flex alignment between label group and control.
- **Touch Target Minimum:** 44px on all interactive mobile buttons, switches, and tabs.

---

## 4. Radii & Surface Rules

- **Controls & Buttons:** `rounded-lg` (8px)
- **Form Inputs:** `rounded-lg` (8px)
- **Settings Panels & Dividers:** `rounded-xl` (12px)
- **Dialogs & Modals:** `rounded-2xl` (16px)
- **Strict Rule:** Avoid full pill borders (`rounded-full`) on structural boxes. Restrict pills solely to badges and tag indicators.
