# CASHLY — PILLAR 4: ANALYZE (DECISION INTELLIGENCE) (V5)

**Classification:** Pillar Architecture & Screen Specifications (Authority #21)  
**Primary Route:** `/analytics` (Sub-tabs: `trends`, `money-twin`, `reports`)  
**Core Purpose:** Answer *"Where did my money go, why did it happen, and which merchants matter most?"*  

---

## 1. Decision Quadrants (`AnalyticsPage.tsx`)

1. **Where did it go?** Interactive Category breakdown donut chart with share percentages and center total spend telemetry.
2. **Am I spending faster?** Velocity comparison line chart tracking cumulative spend day-by-day vs the prior month.
3. **Channel Split:** Breakdown between online e-commerce checkouts (captured via companion) and physical in-store POS charges.
4. **Merchant Leaderboard:** Top 10 merchants ranked by total spend volume and transaction frequency.

Shared sub-navigation is anchored via `AnalyzeNavigationTabs.tsx`.
