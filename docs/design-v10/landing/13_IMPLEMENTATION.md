# 13 — Implementation Architecture (V10)

## 1. Directory Structure
```
frontend/src/
├── components/landing/
│   ├── ArchitecturalBlocksScene.tsx  # Isometric 3D SVG blocks scene
│   ├── EditorialHero.tsx             # 01 Hero with monumental type & 3 teaser cards
│   ├── ProductTriptych.tsx           # 02 3-canvas showcase (Desktop, Mobile, Extension)
│   ├── LifecycleStory.tsx            # 03 6-stage interactive transformation
│   ├── ReviewFirstDifference.tsx     # 04 Sovereign review vs bank scrapers
│   ├── DesktopShowcase.tsx           # 05/06 Full desktop financial console
│   ├── MobileShowcase.tsx            # 07 Touch-native smartphone showcase
│   ├── PillarSystem.tsx              # 08 5-Pillar synchronized selector
│   ├── MoneyTwinShowcase.tsx         # 09 Dark data field with restraint slider
│   ├── AIShowcase.tsx                # 10 Financial anomaly decision surface
│   ├── ExtensionShowcase.tsx         # 11 Checkout HUD with supported stores
│   ├── TrustArchitecture.tsx         # 12 Architectural flow & security layers
│   ├── FinalCampaignCTA.tsx          # 13 Full-bleed Cadmium Orange climax block
│   ├── MarketingChrome.tsx           # 14 Minimal nav and brand footer
│   └── landing.css                   # Complete V10 design system tokens & rules
└── pages/
    └── LandingPage.tsx               # Orchestration of all 14 stages
```

## 2. Integration with Cashly Platform
- **Zero Regression**: Preserves Supabase authentication (`/login`, `/signup`), protected routes, transaction store contracts, and existing backend endpoints.
- **Anchor Linking**: Synchronized header navigation links (`#triptych`, `#lifecycle`, `#desktop-showcase`, `#mobile-showcase`, `#pillars`, `#money-twin`, `#extension`, `#trust`) provide instantaneous smooth scrolling to respective stages.
