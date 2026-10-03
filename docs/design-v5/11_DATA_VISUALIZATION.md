# CASHLY — DATA VISUALIZATION SPECIFICATION (V5)

**Classification:** Charting & Quantitative Visualization Specification (Authority #11)  
**System:** Cashly Financial Operating System  
**Status:** Canonical & Enforced  

---

## 1. Charting Philosophy

Financial charts must answer unambiguous user questions, not serve as visual filler. Every chart in Cashly must include:
1. **Clear Header:** The exact question answered (*"Am I spending faster than last month?"*).
2. **Current Metric:** Bold, tabular numeral indicating total value.
3. **Period Indicator:** Explicit date range or comparative timeframe.
4. **Interactive Precision:** Calibrated hover tooltips displaying date, exact currency, and percentage delta.

---

## 2. Visualization Archetypes

### 2.1 The 14-Day Trajectory Curve (Area / Line Chart)
- **Question:** How does my current spend trajectory compare to the prior month?
- **Actual Line:** Solid warm ink (`#171719`), stroke width 2.5px.
- **Prior Month Comparison:** Dashed muted line (`#77777D`), stroke width 1.5px.
- **Projected Run:** Cashly Rose dashed curve (`#D92F57`) projecting month-end balance.
- **Surface Fill:** Subtle gradient fading from 8% opacity to 0%.

### 2.2 Category Distribution (Donut Chart)
- **Question:** Which life categories are consuming my cash?
- **Inner Radius:** 72%, **Outer Radius:** 90%.
- **Center Telemetry:** Displays total spend or currently hovered category value.
- **Category Hues:** Strict adherence to the Category Color Matrix (`04_COLOR_SYSTEM.md`).

### 2.3 Velocity Pace Bar (Linear Comparative Gauge)
- **Question:** Am I consuming my category budget faster than the days of the month are passing?
- **Background Track:** Neutral container (`#EFEEE9`), height 8px, rounded 4px.
- **Elapsed Month Marker:** Hairline vertical indicator line representing today's expected progress percentage.
- **Actual Spend Fill:** Color-coded by state (Emerald if under pace, Amber if ahead of calendar pace, Red if exceeded).

### 2.4 Cashflow Heatmap Calendar
- **Question:** On which days do cash inflows and bill obligations hit?
- **Intensity Grid:** 7×6 monthly calendar cells with color saturation indicating daily spending volume.
- **Markers:** Inflow dots (Emerald for salary), Outflow pills (Amber for bills, Rose for shopping spikes).
