# 18 — ASSIST: CONTEXTUAL AI & INTELLIGENCE
**Canonical Path:** `/docs/design-final/18_ASSIST_AND_AI_INTELLIGENCE.md`  
**Status:** CANONICAL MASTER  
**Route:** `/insights`  
**Components:** `InsightsPage.tsx`, `AIChatbot.tsx`, `VoiceCallModal.tsx`

---

## 1. Contextual Intelligence Architecture

AI in Cashly does not generate hallucinated generic financial advice ("cook at home to save money"). Instead, it operates on strictly grounded financial telemetry extracted from the operator's actual ledger.

---

## 2. Interface Surfaces

### A. Contextual Intelligence Terminal (`/insights`)
- **Header**: `CONTEXTUAL INTELLIGENCE` in Syne display sans.
- **Deep Ink Banner**:
  - `OBSERVATION FEED`: "Weekend dining velocity expanded by 34% over prior 60-day moving average."
- **4 Color-Blocked KPI Bento Cards**:
  1. Orange: Burn acceleration factor (`1.18x`).
  2. Sage: Unclaimed tax deductions identified (`$420.00`).
  3. Pink: Discretionary headroom surplus (`$680.00`).
  4. Burgundy: Zombie subscription drain (`$54.00/mo`).

### B. Streaming AI Copilot (`AIChatbot.tsx`)
- Floating circular launch trigger elevated safely above mobile navigation.
- Expandable chat terminal with real-time markdown streaming, tabular responses, and one-tap action chips (`Execute Transfer`, `Re-categorize`, `Adjust Budget`).

### C. Voice Telemetry Modal (`VoiceCallModal.tsx`)
- Architectural full-screen dark dialog with real-time animated audio waveforms (`howler.js` + Web Audio API).
- Hands-free conversational balance inquiries and expense logging.
