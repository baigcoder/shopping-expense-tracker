# 06 — Product Showcase System

## 1. Executive Summary
The V10 Product Showcase rejects the convention of miniaturized screenshots framed inside generic laptops. Instead, Cashly treats the interface as an architectural monument:
1. **Desktop Financial Console (`DesktopShowcase.tsx`)**:
   - Spans 100% of the display grid with a dark ink frame (`#111111`) and subtle border delineation.
   - Showcases real Cashly primitives: Navigation Sidebar (Home, Activity, Plan, Analyze, Assist), the Safe-to-Spend KPI cluster (`Rs 42,870`), the 30-day spending trajectory curve, upcoming commitments (`Rs 14,200`), and real attention items.
   - Includes live transaction feed items from real merchants (Daraz, Foodpanda, Netflix, Shell) with review badges.

2. **Mobile Touch Showcase (`MobileShowcase.tsx`)**:
   - Real phone frame geometry (390px width ratio) with dynamic island, status bar, and home indicator.
   - Tabbed sub-navigation allowing inspection of 5 dedicated mobile screens:
     - **Home**: Safe to Spend, Spending Trajectory, Recent Staged transactions.
     - **Activity**: Review Queue counter, approval workflow, categorized feed.
     - **Plan**: Monthly commitment progress, envelope allocations, safe runway.
     - **Analyze**: Spending velocity curve, category donut breakdown, merchant frequency.
     - **Assist**: Real-time AI anomaly detection chips, budget alerts, and instant recommendations.

3. **Five-Pillar System Integration (`PillarSystem.tsx`)**:
   - Synchronized 5-pillar selector with interactive state switching.
   - Clicking any pillar seamlessly transforms the visual canvas to display that pillar's operational interface and metric readouts.
