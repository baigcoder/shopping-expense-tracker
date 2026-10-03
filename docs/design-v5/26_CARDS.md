# CASHLY — CARDS & PAYMENT INSTRUMENTS (V5)

**Classification:** Feature Specification (Authority #26)  
**Primary Route:** `/cards` (Sub-tab: `cards`)  
**Core Purpose:** Visual management of credit/debit cards, billing cycles, utilization caps, and card freeze states.  

---

## 1. Card Visualizer & Architecture

- **Card Visualizer:** Realistic payment card display showing issuing network (Visa, Mastercard, Amex, PayPak), masked account number (`•••• 4012`), cardholder name, and expiry date.
- **Utilization & Balance:**
  - Current balance vs credit limit.
  - Utilization percentage meter (Green `< 30%`, Amber `30% - 70%`, Red `> 70%`).
- **Controls:** Quick freeze/lock toggle, billing cycle due date reminder, edit credit limit modal.
