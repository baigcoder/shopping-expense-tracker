# 19 — INSTRUMENTS: CAPITAL CHANNELS & CARDS
**Canonical Path:** `/docs/design-final/19_INSTRUMENTS_AND_CARDS.md`  
**Status:** CANONICAL MASTER  
**Route:** `/cards`  
**Components:** `CardsPage.tsx`, `AddCardModal.tsx`, `PremiumCard.tsx`

---

## 1. Physical Card Tokenization & Architecture

In Cashly, payment instruments and credit facilities are modeled as tactile, physical-feeling tokens.

---

## 2. Layout & Interactions

### A. Capital Infrastructure Header
- **Title**: `CAPITAL INFRASTRUCTURE` in Syne 800 display.
- **Instrument Switcher**: Rounded-full pill bar (`All Instruments (4)`, `Checking & Treasury`, `Corporate Credit`, `Crypto Rail`).
- **Primary CTA**: `+ Link Instrument` in Cadmium Orange pill.

### B. Tactile Physical Card Frames
- **Matte Deep Ink Surface**: Architectural black card with hairline micro-bevel edges, EMV chip illustration, and contactless wave glyph.
- **Cardholder Credentials**: Masked primary account number (`•••• 4829`) in monospaced tabular numerals.
- **Real-Time Channel Controls**:
  - Daily spending cap slider.
  - One-tap freeze / unfreeze toggle.
  - Linked auto-categorization rule trigger.
