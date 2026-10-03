# CASHLY — EXTENSION COMPANION & TELEMETRY (V5)

**Classification:** System Utility Specification (Authority #28)  
**Primary Route:** `/extension-health`  
**Core Purpose:** Non-blocking telemetry manager for the browser companion, supported checkout platforms, and sync queues.  

---

## 1. Companion Philosophy: Non-Blocking Accelerator

The browser extension is an optional capture accelerator, **never** a punitive gate blocking web app usage:
- **No Blocking Walls:** Desktop web users can freely access all dashboard, planning, and ledger features without the extension.
- **TopBar Status Pill:** A persistent, quiet status pill indicates `[Companion Connected]` (Green) or `[Companion Disconnected]` (Neutral outline with download link).

---

## 2. Telemetry Dashboard Structure

1. **Connection Status Banner:** Live WebSockets ping status, last sync timestamp, and active permissions.
2. **Supported E-Commerce Matrix:** Grid of 25+ monitored shopping sites (Amazon, Daraz, Foodpanda, Walmart, eBay, AliExpress, Shopify stores) with real-time detection health.
3. **Capture Event Audit Stream:** Real-time log of background DOM extraction events and candidate transmissions to the Review Inbox.
