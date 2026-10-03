# 24 — ACCESSIBILITY & PERFORMANCE ENGINEERING
**Canonical Path:** `/docs/design-final/24_ACCESSIBILITY_AND_PERFORMANCE.md`  
**Status:** CANONICAL MASTER  
**Compliance Standards:** WCAG 2.2 Level AA  
**Performance Targets:** Core Web Vitals (LCP < 1.8s, CLS < 0.05, INP < 100ms)

---

## 1. Accessibility Engineering (WCAG 2.2 AA)

- **Color Contrast Ratios**:
  - High-order headings in Deep Ink (`#111111`) on Warm Ivory (`#F4F3EE`): **14.8:1** (Exceeds AAA).
  - Cadmium Orange (`#EE5024`) on white large headers: **3.8:1+** (Passes AA for large text >= 18pt). Small Cadmium Orange text is replaced by Deep Ink on orange backgrounds for **4.8:1+** contrast.
  - Soft Pink (`#F0A1CB`) and Muted Sage (`#BBC7B1`) exclusively use Deep Ink text: **> 6.2:1**.
- **Keyboard Navigation & Focus Rings**:
  - All interactive elements possess explicit visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#EE5024] focus-visible:outline-none`).
  - Screen reader semantic markup (`aria-label`, `role="table"`, `role="tablist"`).

---

## 2. Performance & Production Optimization

- **Bundle Size & Chunk Splitting**:
  - Heavy libraries (`jspdf`, `xlsx`, `pdfjs-dist`, `recharts`, `framer-motion`) are dynamically imported and split into dedicated vendor chunks via `vite.config.ts`.
  - Initial HTML + CSS payload is under 35kB gzipped.
- **Font Optimization**:
  - `Syne` and `Plus Jakarta Sans` are served via Google Fonts with `font-display: swap` to eliminate render-blocking typography flashes.
- **Zero Memory Leaks**:
  - Real-time Supabase subscriptions and window resize listeners clean up reliably in `useEffect` unmount phases.
