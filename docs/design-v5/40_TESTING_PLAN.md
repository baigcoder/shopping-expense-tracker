# CASHLY — TESTING & REGRESSION VERIFICATION PLAN (V5)

**Classification:** Testing & Quality Assurance Plan (Authority #40)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Multi-Tier Verification Strategy

1. **TypeScript Compile Gate:**
   - Execute `tsc -b` to guarantee zero type errors or interface drift across stores, hooks, services, and components.
2. **Production Bundle Verification:**
   - Execute `npm run build` with Vite production optimizer to ensure zero dynamic chunk import collisions and valid tree-shaking.
3. **Automated Test Suite:**
   - Execute `npm run test:run` across Vitest unit tests covering store operations, currency formatting, Money Twin calculations, and candidate inbox filtering.
4. **Interactive Flow Regression Checks:**
   - Verify transaction approval updates the balance and decreases the inbox counter.
   - Verify budget limit adjustment reflects in category pace bar.
   - Verify currency switcher updates symbols across all numbers.
   - Verify theme toggle switches variables without page reload.
