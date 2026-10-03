# CASHLY V8 — SURFACE, CONTAINER & SHADOW SYSTEM

## 1. Surface Philosophy: Open Architecture over Card Walls

In Cashly V8, **cards are not the default container**. 

Arbitrary card walls create visual fragmentation, heavy drop shadow clutter, and cognitive fatigue. 

Instead, Cashly V8 organizes information through an **Open Architectural Layout**:
- **Continuous Neutral Canvas:** `#F5F7F6` (light) / `#0B1620` (dark).
- **Primary Section Surfaces:** Clean elevated planes (`#FFFFFF` light / `#15222E` dark) bounded by hairline 1px borders (`#D8DFDC` light / `#233544` dark).
- **Interior Partitions:** Sub-pixel dividers (`border-[var(--color-border)]`) and contrasting slate backgrounds (`var(--color-surface-2)`), not nested floating cards.
- **Contextual Containment:** A card is permitted only when an entity requires discrete spatial containment (such as a credit card instrument, a staged transaction needing review, or an active modal dialog).

---

## 2. Elevation & Shadow Tiers

Cashly V8 enforces flat-to-subtle elevation:

| Elevation Level | Variable | CSS Box Shadow | Purpose |
| :--- | :--- | :--- | :--- |
| **Flat / Ground** | `none` | `none` | Tables, lists, inline form inputs |
| **Micro / Sub-surface** | `--shadow-2xs` | `0 1px 2px rgba(11,22,32, 0.04)` | Segmented tab chips, badges |
| **Panel / Standard** | `--shadow-xs` | `0 1px 3px rgba(11,22,32, 0.06), 0 1px 2px rgba(11,22,32, 0.04)` | Elevated workspace panels, hero modules |
| **Floating / Popover** | `--shadow-md` | `0 4px 12px rgba(11,22,32, 0.08)` | Dropdown menus, tooltips, command palette results |
| **Drawer / Overlay** | `--shadow-xl` | `0 12px 32px rgba(11,22,32, 0.12)` | Transaction side sheets, AI chat panel |
| **Modal / Dialog** | `--shadow-2xl`| `0 24px 48px -12px rgba(11,22,32, 0.25)`| Confirmation dialogs, voice call modal |

---

## 3. Corner Radius Standardization

- **Micro Controls (Buttons, Inputs, Badges):** `8px` (`rounded-lg`).
- **Surface Panels & Cards:** `12px` to `16px` (`rounded-xl` to `rounded-2xl`).
- **Sheets & Modals:** `18px` to `24px` (`rounded-2xl` to `rounded-3xl` top edges).
- **Prohibited:** Indiscriminate 9999px pill shapes for rectangular information panels.
