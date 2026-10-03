# CASHLY — ACCESSIBILITY SPECIFICATION (WCAG 2.2 AA)

**Document:** `10_ACCESSIBILITY.md`  
**Classification:** WCAG 2.2 AA Compliance Audit & Standards  
**Date:** October 2026  
**Status:** Canonical & Enforced  

---

## 1. Compliance Requirements

All public landing pages, interactive product demos, and authentication flows must comply with **WCAG 2.2 Level AA**:

### 1.1 Contrast Ratios
- **Body Text (`#57534E` on `#FAF8F5`):** Ratio $> 4.8:1$ (exceeds 4.5:1 minimum).
- **Headings (`#1C1917` on `#FAF8F5`):** Ratio $> 11.2:1$ (exceeds 7:1 AAA standard).
- **Brand Rose (`#E11D48` on white):** Ratio $> 4.6:1$ for large text and buttons with bold text.
- **Form Inputs:** Hairline border (`#E7E5E4`) with clear 2px focus ring (`#E11D48`) and visible label associations.

### 1.2 Keyboard Navigation & Focus Management
- Logical Tab order through all navigation items, demo controls, and form inputs.
- Visible, high-contrast focus rings: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D48] focus-visible:ring-offset-2`.
- Modal drawers and mobile menus trap keyboard focus when active and close on `Escape`.

### 1.3 Screen Reader Semantics & ARIA
- Clear landmark roles: `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`.
- Single `<h1>` per page with semantic `<h2>`, `<h3>` hierarchy.
- Interactive demo buttons carry descriptive `aria-label` tags (e.g. `aria-label="Step 1: Capture transaction"`).
- Screen-reader text (`.sr-only`) provided for icon-only buttons.
