# CASHLY V9 — 03 VISUAL SYSTEM
## Design Tokens, Surface Hierarchy & Depth Engine

### 1. Unified Surface & Depth Architecture

Cashly V9 replaces arbitrary background fills with an architectural layer stack designed for optical clarity:

```
[Layer 0] Canvas Base        : #09141B (Dark) / #F4F3EE (Light)
[Layer 1] Structural Bed     : #101E25 (Dark) / #E9ECE8 (Light)
[Layer 2] Operational Plate  : #142832 (Dark) / #FFFFFF (Light)
[Layer 3] Floating Command   : #1A3442 (Dark) / #FFFFFF (Light) [Border 1px #224354 / #D8DFDC]
```

### 2. Physical Elevation & Shadows (Non-Card Approach)

Unlike generic SaaS cards that rely on heavy blurred drop shadows to create boundaries, Cashly V9 relies on **hairline borders (precision stroke)** and subtle ambient occlusion:

* `--v9-border-hairline`: `1px solid rgba(255, 255, 255, 0.08)` (Dark) / `1px solid rgba(20, 33, 39, 0.09)` (Light)
* `--v9-border-strong`: `1px solid rgba(255, 255, 255, 0.16)` (Dark) / `1px solid rgba(20, 33, 39, 0.18)` (Light)
* `--v9-border-focus`: `1px solid #16A394` with `0 0 0 3px rgba(22, 163, 148, 0.22)`
* `--v9-shadow-ambient`: `0 2px 8px -2px rgba(9, 20, 27, 0.12), 0 1px 2px -1px rgba(9, 20, 27, 0.08)`
* `--v9-shadow-floating`: `0 20px 48px -12px rgba(9, 20, 27, 0.35), 0 0 1px 1px rgba(255, 255, 255, 0.06)`

### 3. Corner Geometry & Radii

* `--radius-xs`: `4px` (Tags, micro-chips, code pills)
* `--radius-sm`: `8px` (Buttons, table cell actions, badges)
* `--radius-md`: `12px` (Inputs, dropdowns, contextual control bars)
* `--radius-lg`: `16px` (Panels, modal dialogs, drawers)
* `--radius-xl`: `24px` (Signature hero containers, mobile sheets)

Sharpness conveys financial rigor. Over-rounded pill shapes (9999px) are strictly eliminated except for small circular status dots.
