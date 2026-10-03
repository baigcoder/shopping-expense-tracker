# CASHLY — PERFORMANCE & BUNDLE ARCHITECTURE (V5)

**Classification:** Engineering Performance Specification (Authority #34)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Performance Targets & Budgets

- **First Contentful Paint (FCP):** $< 1.2\text{s}$ on 4G mobile.
- **Time to Interactive (TTI):** $< 2.4\text{s}$.
- **Cumulative Layout Shift (CLS):** $< 0.05$ (guaranteed by explicit skeleton dimensions).
- **Core Bundle Size:** Initial JS chunk $< 180\text{kB}$ gzipped.

---

## 2. Optimization Strategies

1. **Route-Level Code Splitting:** Every major pillar is lazy-loaded via React `lazy()` and wrapped in `<Suspense>` with custom skeleton placeholders.
2. **Chart Library Chunking:** Recharts and D3 dependencies are isolated in `vendor-charts.js` and loaded on demand when visiting Analytics or Money Twin.
3. **Heavy Service Isolation:** PDF OCR generators (`pdfAnalyzerService`), Excel export utilities (`xlsx`), and audio synthesis engines are strictly dynamically imported only when triggered by user action.
