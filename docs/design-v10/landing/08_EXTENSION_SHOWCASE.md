# 08 — Extension Companion Showcase (V10)

## 1. Editorial Presentation
Conventional SaaS websites hide extensions in generic feature bullet points. In Cashly V10, the Browser Companion is elevated to a flagship editorial moment (`ExtensionShowcase.tsx`):
- **Headline**: "SHOP WITHOUT LOSING TRACK."
- **Visual Composition**:
  - Left column: 100% Private & Local statement with architectural proof points (Silent Background Interception, Zero-Password Architecture, Direct Review Staging).
  - Right column: High-fidelity browser simulator rendering an Amazon order confirmation page with a floating, high-contrast dark Cashly Companion HUD:
    - Detected Order Total: `Rs 34,990`
    - Estimated Runway Impact: `-3.8 days`
    - Staging Status: `Awaiting Approval in Review Queue`
    - Direct link: `Inspect in Cashly ->`
- **Supported Stores Ribbon**:
  - Visually showcases native integrations for Amazon, Shopify Stores, Foodpanda, Daraz, and eBay.

## 2. Technical Privacy Guarantees
1. No banking login or 2FA credentials requested.
2. DOM parsing occurs strictly within the user's isolated local browser tab.
3. Transferred payload is end-to-end encrypted and quarantined in an unapproved staging queue until approved.
