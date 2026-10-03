# CASHLY SETTINGS V7 — ART DIRECTION & VISUAL MANIFESTO

**Document:** `/docs/design-v7/settings/03_ART_DIRECTION.md`  
**Classification:** Art Direction & Visual Aesthetics  
**Target:** Cashly Settings Surface (`/settings`)  
**Date:** October 3, 2026  

---

## 1. Visual Manifesto: Quiet Confidence

Cashly Settings V7 moves decisively away from generic SaaS "admin forms". In a professional financial OS, settings represent the command bridge—the place where the user configures privacy, ledger currency, intelligence behavior, and access rights.

```
       LEGACY (V5/V6)                       TARGET (V7)
┌───────────────────────────┐      ┌────────────┬─────────────────────────────┐
│ [Card 1: Profile Form]    │      │ SETTINGS   │  Profile & Identity         │
│                           │      │            │  Avatar + Editable Fields   │
│ [Card 2: Preferences Form]│  ──> │ • Account  ├─────────────────────────────┤
│                           │      │ • Prefs    │  Base Financial Currency    │
│ [Card 3: AI Form]         │      │ • AI       │  Large Tabular Preview ($)  │
│                           │      │ • Security ├─────────────────────────────┤
│ [Card 4: Danger Card]     │      │ • Data     │  Settings Rows (Icon+Label) │
└───────────────────────────┘      │ • Danger   │  [ON] [OFF] [Select]        │
                                   └────────────┴─────────────────────────────┘
  (Monotonous Card Stack)             (Structured Two-Zone Control Center)
```

### 1.1 Four Cornerstones of the Aesthetic:
1. **Calm Finance Canvas:** Warm off-white background (`#FAF8F5`) creates a welcoming, editorial feel rather than sterile cold blue-gray or intimidating deep dark mode.
2. **Editorial Surface Hierarchy:** Instead of wrapping every 2 inputs in a card container with heavy borders, surfaces breathe through open sections, hair-line dividers (`#E7E5E4`), and subtle tinted callout zones.
3. **Tabular Numerals & Monospace Accents:** All currency codes (`USD`, `EUR`, `PKR`), session IPs, timestamps, and model latency metrics use `font-mono tabular-nums tracking-tight`.
4. **Restrained Semantic Accents:**
   - **Cashly Brand Rose (`#E11D48`):** Restricted to primary commit actions (Save Profile, active nav indicator).
   - **Positive Emerald (`#10B981`):** Active verified badges, successful save indicators, low-latency AI response.
   - **Warning Amber (`#F59E0B`):** Chat memory warnings, moderate latency.
   - **Danger Crimson (`#EF4444`):** Restricted solely to destructive operations in the Danger Zone.
   - **AI Violet (`#8B5CF6`):** Restricted to AI telemetry, model status, and Co-Pilot toggles.

---

## 2. Visual Rhythm & Compositional Treatments

Rather than applying the same visual template to every setting, each domain receives a tailored visual treatment:
- **Account:** Identity header with circular avatar, initials badge, verified email pill, and inline editable input grid.
- **Currency:** High-contrast financial highlight card with prominent currency symbol, currency name, and tabular numerical preview (`$1,234.56`).
- **Preferences:** Clean, compact row list with micro-icons, clear descriptive subtext, and switches aligned right.
- **AI Intelligence:** Technical telemetry card showing live Groq/OpenRouter connection status, engine model pill, and diagnostic ping trigger.
- **Security:** Credential panel with password recovery trigger and active session audit telemetry.
- **Danger Zone:** Subtle crimson-tinted warning surface (`bg-red-500/5 border-red-500/20`), distinct destructive styling, and modal OTP barrier.
