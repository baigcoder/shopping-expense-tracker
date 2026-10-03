# CASHLY — MASTER SURFACE & ELEVATION SYSTEM (V5)

**Classification:** Architectural Surface Specification (Authority #7)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Surface Philosophy: Eradicating "Card Fatigue"

Cards are designed for discrete, moveable, or clickable objects. Wrapping every title, table, button, and paragraph into an isolated drop-shadow box creates visual noise and fragmentation.

Cashly establishes a **5-tier surface hierarchy**:

```
TIER 5: CRITICAL OVERLAY (Dialogs & Confirmations)
        └── Elevated z-index (50), backdrop blur, 18px radius, shadow-xl

TIER 4: CONTEXTUAL SIDE-SHEET (Transaction Inspection & Drawers)
        └── Slide-over drawer, fixed right 480px, 0 radius on edge, shadow-lg

TIER 3: INTERACTIVE OBJECTS (Payment Cards, Goal Milestones, Review Items)
        └── Surface fill, 1px hairline border, 12px-16px radius, shadow-sm

TIER 2: ARCHITECTURAL PANELS (Ledger Table Container, Pulse Region, Chart Canvas)
        └── Unified background, 1px hairline border, 16px radius, no floating shadow

TIER 1: OPEN CANVAS (Workspace Stage)
        └── Warm neutral canvas (--color-canvas: #F6F5F1), zero border, natural flow
```

---

## 2. Radii Specification

Excessive pill shapes and oversized bubble corners look childish in financial contexts. Cashly uses restrained, geometric radii:

- **Controls (Buttons, Inputs, Selects):** `8px` (`--r-sm`)
- **Small Surfaces (Tags, Filter Pills, Tooltips):** `10px`
- **Standard Surfaces (Table rows, Action cards):** `12px` (`--r-md`)
- **Large Surfaces (Panels, Bento modules):** `16px` (`--r-lg`)
- **Dialogs & Modals:** `18px` (`--r-xl`)

---

## 3. Elevation & Ambient Shadow Tokens

Shadows must never look like solid dark smudges. Cashly uses soft, multi-layered natural light ambient diffusion:

```css
:root {
  /* Level 0: Pure Hairline */
  --elevation-flat: 0 0 0 1px var(--color-border);

  /* Level 1: Micro Surface (Table headers, buttons) */
  --shadow-sm: 0 1px 2px rgba(23, 23, 25, 0.04);

  /* Level 2: Standard Surface (Panels, modules) */
  --shadow-md: 0 1px 2px rgba(23, 23, 25, 0.04), 
               0 8px 24px rgba(23, 23, 25, 0.04);

  /* Level 3: Elevated Drawer / Popover */
  --shadow-lg: 0 2px 4px rgba(23, 23, 25, 0.04), 
               0 16px 40px rgba(23, 23, 25, 0.08);

  /* Level 4: Modal Climax / Critical Overlay */
  --shadow-xl: 0 8px 32px rgba(23, 23, 25, 0.12);
}
```
