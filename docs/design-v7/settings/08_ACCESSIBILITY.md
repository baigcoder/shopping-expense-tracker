# CASHLY SETTINGS V7 — ACCESSIBILITY & INCLUSION SPECIFICATION

**Document:** `/docs/design-v7/settings/08_ACCESSIBILITY.md`  
**Classification:** Accessibility & WCAG 2.2 AA Compliance  
**Target:** Cashly Settings Surface (`/settings`)  
**Date:** October 3, 2026  

---

## 1. Compliance Matrix

| Requirement | WCAG 2.2 AA Criteria | Implementation in Settings V7 |
|---|---|---|
| **Keyboard Navigation** | 2.1.1 Keyboard | All navigation items, switches, inputs, buttons, and modals are fully reachable via `Tab` and operable via `Enter` / `Space`. |
| **Focus Visibility** | 2.4.7 Focus Visible | High-contrast dual focus rings (`focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2`). |
| **Color Contrast** | 1.4.3 Contrast (Minimum) | All text tokens maintain >= 4.5:1 against canvas and card surfaces. Input placeholders maintain >= 3.0:1. |
| **Non-Text Contrast** | 1.4.11 Non-text Contrast | Switch boundaries, checkboxes, and input borders maintain >= 3.0:1 against adjacent surfaces. |
| **ARIA Semantics** | 4.1.2 Name, Role, Value | Two-zone settings rail uses `role="tablist"`, `role="tab"`, `aria-selected`, and `role="tabpanel"`. Every switch has a bound `<Label>` or `aria-label`. |
| **Reduced Motion** | 2.3.3 Animation from Interactions | All framer-motion transitions respect `prefers-reduced-motion` and the internal `reducedMotion` toggle. |
| **Error Identification** | 3.3.1 Error Identification | Validation failures on forms and OTP inputs display text labels alongside red border states. |

---

## 2. ARIA Hierarchy for Two-Zone Settings

```html
<nav role="tablist" aria-label="Settings Categories">
  <button role="tab" id="tab-account" aria-selected="true" aria-controls="panel-account">
    Account & Identity
  </button>
  <button role="tab" id="tab-preferences" aria-selected="false" aria-controls="panel-preferences">
    Interface & Preferences
  </button>
  ...
</nav>

<section role="tabpanel" id="panel-account" aria-labelledby="tab-account">
  <!-- Account Settings Content -->
</section>
```
