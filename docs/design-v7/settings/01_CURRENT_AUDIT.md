# CASHLY SETTINGS V7 — FORENSIC SCREEN AUDIT & TRANSFORMATION DIRECTIVE

**Document:** `/docs/design-v7/settings/01_CURRENT_AUDIT.md`  
**Classification:** Critical Visual Forensic Audit  
**Target:** Cashly Settings Surface (`/settings`)  
**Auditor:** Principal Product Designer, UX Architect & Design Systems Lead  
**Evidence Artifact:** Captured Rendered UI  
**Date:** October 3, 2026  

---

## 1. Visual Evidence Analysis

A strict visual audit of the rendered settings surface reveals the fundamental flaw of the legacy implementation:

> **The page is "A FORM INSIDE A DASHBOARD" rather than a "PROFESSIONAL FINANCIAL CONTROL CENTER."**

### 1.1 The Specific Flaws Identified:

1. **Card Overuse & Container Traps:**
   - Every grouping was boxed into a thick white card with a border and shadow (`bg-white border rounded-xl shadow-2xs`).
   - Rather than creating an architectural workspace, the layout resembled a generic dashboard widget grid.
   - Sections felt repetitive: header + icon box + form elements trapped inside separate containers.

2. **Navigation Packaged as a Box:**
   - The settings navigation rail was encapsulated in an artificial gray background box (`bg-stone-100/70 border rounded-xl`), giving it a heavy, cramped feel instead of an open, airy, editorial navigation system.

3. **Weak Visual Rhythm:**
   - The repetition of `[Card 1] → [Card 2] → [Card 3]` created visual monotony.
   - No section felt more important than any other. Base Currency—the foundational financial setting—was visually equivalent to a generic sensory toggle.

4. **Cluttered Header Elements:**
   - Arbitrary badges like "C7" added noise to the title.
   - The header must be clean, quiet, and authoritative: "Settings", one concise description, and an understated Sign Out control.

5. **Viewport Distribution:**
   - On 1440px and 1920px viewports, centering everything in a single column wastes the horizontal dimension, while stretching cards across the whole screen ruins readability.
   - The correct fintech pattern is an anchored Two-Zone workspace: a compact, unboxed left navigation rail (220px) paired with an open, left-aligned content canvas (max ~760px).

---

## 2. The V7 Art-Direction Standard

To achieve **Quiet Confidence × Editorial Precision**:

```
-------------------------------------------------------------------------------------
Settings
Workspace configuration, financial baseline, and intelligence boundaries.     Sign Out
-------------------------------------------------------------------------------------

Navigation Rail (Open, unboxed)          Active Settings Canvas (Open sections)
-------------------------------          --------------------------------------------

• Profile & Identity                     Profile & Identity
  Interface & Currency                   Your personal account identity across devices.
  AI Intelligence                        --------------------------------------------
  Security & Sessions                    [Avatar]  Name: [ Alex Morgan              ]
  Data & Exports                                   Email: [ alex.morgan@cashly.ai  ] (Verified)
  Danger Zone                                      Account ID: usr_... [Copy]
                                                   [ Save Changes ]

                                         Financial Baseline
                                         Authoritative currency for all ledgers.
                                         --------------------------------------------
                                         $ 12,450.00          [ USD ($) — US Dollar ▼ ]

                                         Sensory & System
                                         --------------------------------------------
                                         Auditory Feedback                     [ ON ]
                                         Reduced Motion                        [ OFF ]
                                         Theme                                 [ Light ]
```

### Core Execution Rules:
- **No Cards on Cards:** Use open sections with crisp, 1px hairline dividers (`border-b border-stone-200/60`).
- **No Heavy Navigation Boxes:** The navigation rail is unboxed, pure typography with a subtle 2px brand indicator or soft tinted pill on the active item.
- **Financial Gravity:** Base Currency is highlighted with large monospace tabular numbers (`font-mono tabular-nums text-3xl font-bold`).
- **Semantic Restraint:** Cashly Brand Rose (`#E11D48`) is reserved for primary commits. AI violet is reserved for model telemetry. Crimson Red is reserved for Danger Zone.
- **Accessible Danger Modal:** Eliminates blocking `window.prompt()`, replacing it with an accessible, high-gravity confirmation dialog requiring phrase entry and 6-digit email OTP verification.
