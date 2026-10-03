# 06 — DESIGN TOKENS & SYSTEM VARIABLES
**Canonical Path:** `/docs/design-final/06_DESIGN_TOKENS.md`  
**Status:** CANONICAL MASTER  
**Token Layers:** Geometry, Radii, Shadows, Hairline Borders, Responsive Scales

---

## 1. Geometric Radii Tokens

Cashly uses extreme contrast in corner geometry to separate hardware containers from interactive controls:

```css
:root {
  /* Hardware / Viewport Shells */
  --radius-device: 44px;      /* Realistic smartphone and tablet frames */
  --radius-screen: 36px;      /* Inner viewport boundary for simulated hardware */

  /* Major Functional Surfaces */
  --radius-container-xl: 32px; /* Monumental color-block hero cards */
  --radius-container-lg: 24px; /* Standard dashboard widgets and modal windows */
  --radius-container-md: 16px; /* Inner nested list rows and secondary cards */

  /* Interactive Elements */
  --radius-pill: 9999px;      /* Buttons, badge tags, segment toggles, search inputs */
  --radius-control: 12px;     /* Form text inputs, dropdown selects */
}
```

---

## 2. Elevation & Hairline Border Tokens

Cashly replaces traditional blurry box shadows with sharp architectural hairline borders and subtle ambient ground occlusion:

```css
:root {
  /* Hairline Borders */
  --border-hairline-ink: 1px solid rgba(17, 17, 17, 0.10);
  --border-hairline-white: 1px solid rgba(255, 255, 255, 0.12);
  --border-hairline-orange: 1px solid rgba(238, 80, 36, 0.25);
  --border-active-focus: 2px solid #EE5024;

  /* Architectural Shadows */
  --shadow-architectural-sm: 0 2px 4px rgba(17, 17, 17, 0.04);
  --shadow-architectural-md: 0 8px 24px rgba(17, 17, 17, 0.06);
  --shadow-architectural-lg: 0 20px 48px rgba(17, 17, 17, 0.09);
  --shadow-monolithic-floating: 0 30px 60px -12px rgba(17, 17, 17, 0.22);
}
```

---

## 3. Utility Classes Reference

Configured in `frontend/src/index.css`:

```css
/* Editorial Button Utility */
.editorial-pill-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  padding: 0.75rem 1.75rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.editorial-pill-btn-orange {
  background-color: var(--color-orange);
  color: #ffffff;
}

.editorial-pill-btn-orange:hover {
  background-color: #d94218;
  transform: translateY(-1px);
}

.editorial-pill-btn-ink {
  background-color: var(--color-ink);
  color: #ffffff;
}

.editorial-pill-btn-ink:hover {
  background-color: #000000;
  transform: translateY(-1px);
}

/* Category Badge Utility */
.editorial-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```
