# CASHLY — ACCESSIBILITY & WCAG 2.2 AA SPECIFICATION (V5)

**Classification:** Compliance & Accessibility Specification (Authority #33)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Compliance Standards

Cashly is engineered to meet **WCAG 2.2 Level AA** criteria across all public and authenticated surfaces:
1. **Contrast Ratios:**
   - Standard body text $\ge 4.5:1$ against surface background.
   - Large headings ($\ge 24\text{px}$) and essential icons $\ge 3.0:1$.
2. **Keyboard Focus & Traps:**
   - Every interactive control (button, input, select, row) possesses an unambiguous visible focus ring:
     ```css
     :focus-visible {
       outline: 2px solid var(--color-brand);
       outline-offset: 2px;
     }
     ```
   - Modals and side-sheets implement focus trapping and release focus back to the triggering element upon exit.
3. **Screen Reader Semantics:**
   - Semantic HTML5 landmark tags (`<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`, `<article>`).
   - Tables include proper `<caption>`, `<th scope="col">`, and `aria-sort` attributes.
   - Dynamic balance updates utilize `aria-live="polite"` to announce changes to assistive technologies.
