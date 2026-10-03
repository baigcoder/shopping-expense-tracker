# CASHLY RECON — COMPONENT ARCHITECTURE MAP

**Repository:** `baigcoder/shopping-expense-tracker`  
**Date of Audit:** October 2026  
**Status:** Complete Component Audit  

---

## 1. Component Architecture Overview

The frontend repository contains **118 React components** organized under `frontend/src/`:

```
frontend/src/
├── components/          # 86 domain components, modals, widgets, and subdirectories
│   ├── dashboard/       # Dashboard sub-widgets (MoneyTwinPulse)
│   ├── landing/         # Marketing site sections (Hero, HowItWorks, Features, etc.)
│   ├── profile/         # Profile sub-components (Achievements, ActivityTimeline)
│   └── ui/              # 21 shadcn/ui inspired primitives (Button, Dialog, Card, etc.)
├── layouts/             # 2 structural layouts (DashboardLayout, AuthLayout)
└── pages/               # 26 page-level components with matching CSS modules
```

---

## 2. Structural & Layout Components

| Component | Path | Key Dependencies | Primary Role | Styling Approach | Issues / Observations |
|:---|:---|:---|:---|:---|:---|
| **DashboardLayout** | `layouts/DashboardLayout.tsx` | `Sidebar`, `MobileBottomNav`, `ExtensionWall`, `AIChatbot`, `AddCardModal`, `TransactionModal` | Global shell for all 21 authenticated views | CSS Modules (`DashboardLayout.module.css`) | Mounts 4 persistent overlays/modals into root DOM; idle-loads `AIChatbot` |
| **AuthLayout** | `layouts/AuthLayout.tsx` | `branding.ts`, `react-router-dom` | Card container for Login, Signup, Forgot Password | Tailwind utility classes | Clean cream canvas (`#FAF8F5`) with centered white card (`#FFFFFF`) |
| **MarketingChrome** | `components/landing/MarketingChrome.tsx` | `lucide-react`, `react-router-dom` | Header navigation and footer for public landing pages | Tailwind utility classes | Sticky desktop header with mobile hamburger drawer |

---

## 3. Navigation Components

| Component | Path | Items / Structure | Responsive Behavior | State / Trigger | Issues |
|:---|:---|:---|:---|:---|:---|
| **Sidebar** | `components/Sidebar.tsx` | 5 Groups (Overview, Finance, Planning, Insights, System) + Settings & Profile | Desktop only (`hidden max-lg`); animated width (68px collapsed, 248px expanded) | `useUIStore` (`sidebarOpen`, `sidebarHovered`) | Hover expansion timer can feel jittery; mislabels `/insights` as "AI Assistant" |
| **MobileBottomNav** | `components/MobileBottomNav.tsx` | 4 Bottom tabs (Home, Transactions, Analytics, Cards) + 1 Menu button (opens sheet of 10 items) | Mobile/tablet only (`lg:hidden`); fixed bottom bar with safe-area padding | Local menu drawer toggle + real-time badge counters | Menu drawer contains 10 stacked items; forces excessive scrolling on small screens |
| **MobileHelpButton** | `components/MobileHelpButton.tsx` | Floating question-mark button | Mobile only (`lg:hidden`) | Triggers support / FAQ dialog | Overlaps with bottom nav if viewport height is small |

---

## 4. UI Primitives (`components/ui/`)

Cashly maintains 21 standardized primitive controls built with Radix UI / Tailwind CSS:

| Primitive Component | Source File | Radix Primitive Wrapped | Styling Tokens Used | Quality & Consistency |
|:---|:---|:---|:---|:---|
| `Button` | `components/ui/button.tsx` | None (cva variants) | `default`, `destructive`, `outline`, `secondary`, `ghost`, `link` | High consistency; standard control |
| `Dialog` | `components/ui/dialog.tsx` | `@radix-ui/react-dialog` | Radix Dialog with backdrop overlay | Standard modal wrapper; heavily overused |
| `Select` | `components/ui/select.tsx` | `@radix-ui/react-select` | Radix Select with custom trigger/popover | Well-styled; handles custom categories |
| `Tabs` | `components/ui/tabs.tsx` | `@radix-ui/react-tabs` | Radix Tabs with active pills | Good consistency |
| `Card` | `components/ui/card.tsx` | None (pure div) | `rounded-lg border bg-card shadow-sm` | Used in newer pages; clashes with `.card` in `index.css` |
| `Input` | `components/ui/input.tsx` | Native HTML input | `rounded-md border border-input` | Consistent 16px mobile text to prevent iOS zoom |
| `Switch` | `components/ui/switch.tsx` | `@radix-ui/react-switch` | Radix Switch with sliding thumb | Consistent toggles |
| `Badge` | `components/ui/badge.tsx` | None (cva variants) | `default`, `secondary`, `destructive`, `outline` | Compact indicator tags |
| `Progress` | `components/ui/progress.tsx` | `@radix-ui/react-progress` | Progress bar with animated indicator | Standard linear meter |
| `Table` | `components/ui/table.tsx` | Native HTML table elements | Table, TableHeader, TableBody, TableRow, TableCell | Used in inbox and accounts; requires horizontal scroll wrap |
| `DropdownMenu` | `components/ui/dropdown-menu.tsx`| `@radix-ui/react-dropdown-menu`| Contextual menu popups | Consistent dropdowns |
| `Checkbox` | `components/ui/checkbox.tsx` | `@radix-ui/react-checkbox` | Checkbox box with checked icon | Used in batch candidate selection |
| `Avatar` | `components/ui/avatar.tsx` | `@radix-ui/react-avatar` | Circular image fallback | Consistent profile avatars |
| `Separator` | `components/ui/separator.tsx` | `@radix-ui/react-separator` | Horizontal / vertical hairline rule | Good divider utility |
| `Sonner` | `components/ui/sonner.tsx` | `sonner` Toaster | Top-right toast notification mount | Standard modern toast container |
| `Surface` | `components/ui/Surface.tsx` | None | Container with border and soft background | Standard card container in newer pages |
| `StatTile` | `components/ui/StatTile.tsx` | None | Metric display tile with icon and label | Clean modern stat primitive |
| `PageHeader` | `components/ui/PageHeader.tsx` | None | Standard title, description, and action bar | High consistency header |
| `SoftButton` | `components/ui/SoftButton.tsx` | None | Low-contrast secondary button | Clean utility |
| `EmptyState` | `components/ui/EmptyState.tsx` | None | Centered icon, title, and description | Modern empty placeholder |

---

## 5. Domain Components & Modals

| Component | Path | Domain | Interaction Pattern | UI / Design Style | Issues |
|:---|:---|:---|:---|:---|:---|
| **TransactionDialog** | `components/TransactionDialog.tsx` | Transactions | Dialog Modal | Tailwind + CSS Module | Stacked inside TransactionsPage; handles category, receipt, tags, split |
| **TransactionModal** | `components/TransactionModal.tsx` | Global Quick Add | Dialog Modal | CSS Modules | Root-mounted add transaction form; duplicates TransactionDialog inputs |
| **AddCardModal** | `components/AddCardModal.tsx` | Cards | Dialog Modal | CSS Modules | Interactive card flip animation; credit card number formatter |
| **PremiumCard** | `components/PremiumCard.tsx` | Cards | Interactive Widget | CSS Modules + Gradients | Renders photorealistic credit card with gradients, chips, and brand logos |
| **ExtensionWall** | `components/ExtensionWall.tsx` | Extension Gating | Full-Screen Overlay | CSS Modules | Desktop-only blocker preventing app usage until extension syncs |
| **ExtensionGate** | `components/ExtensionGate.tsx` | Extension Gating | Toast Nudge / Shell | Tailwind + CSS | Evaluates mobile vs desktop; passes through children |
| **ExtensionStatsCard** | `components/ExtensionStatsCard.tsx` | Extension | Dashboard Widget | CSS Modules | Shows extension status, queued syncs, and download link |
| **MoneyTwinPulse** | `components/dashboard/MoneyTwinPulse.tsx` | Forecasting | Dashboard Widget | Tailwind + CSS | Compact teaser of daily burn rate and projected end-of-month cash |
| **UpcomingBills** | `components/UpcomingBills.tsx` | Liabilities | Dashboard Widget | CSS Modules | List of next 3 bills due with days remaining |
| **AIChatbot** | `components/AIChatbot.tsx` | AI Assistant | Floating Bottom-Right Panel | CSS Modules + Neobrutalist classes | Draggable/expandable chat window with streaming text and voice links |
| **VoiceCallModal** | `components/VoiceCallModal.tsx` | Voice AI | Dialog Modal | Framer Motion + Canvas | Voice audio visualizer, live transcription, edge-tts speaker |
| **VoiceSetupModal** | `components/VoiceSetupModal.tsx` | Voice AI | Dialog Modal | Tailwind + Radix | ElevenLabs / Edge-TTS voice actor picker and mic tester |
| **CSVImport** | `components/CSVImport.tsx` | Imports | Giant Dialog Modal | CSS Modules | 3-step CSV upload, column mapping dropdowns, preview table |
| **PDFAnalyzer** | `components/PDFAnalyzer.tsx` | Imports | Giant Dialog Modal | CSS Modules | Bank statement PDF drag-and-drop, OCR progress meter, parsed rows |
| **DocumentImportModal** | `components/DocumentImportModal.tsx` | Imports | Giant Dialog Modal | CSS Modules | Multi-format (PDF/CSV/Excel) document parser |
| **ReceiptScanner** | `components/ReceiptScanner.tsx` | Imports | Dialog Modal | CSS Modules | Web camera feed or file upload with Tesseract OCR bounding boxes |
| **ResetConfirmModal** | `components/ResetConfirmModal.tsx` | Security / Danger Zone | Dialog Modal | CSS Modules | 2-step data reset verification with 6-digit email OTP input |
| **PlaidLinkButton** | `components/PlaidLinkButton.tsx` | Banking | Interactive Button | CSS Modules | Initializes Plaid Link SDK handler and exchanges public token |
| **SpendingChart** | `components/SpendingChart.tsx` | Analytics | Recharts Area/Bar | Recharts wrapper | Responsive 14-day spending curve with dual income/expense series |
| **SpendingStreak** | `components/SpendingStreak.tsx` | Gamification | Dashboard Card | CSS Modules | 30-day streak tracker with fire badges and encouragement text |
| **NotificationsPanel**| `components/NotificationsPanel.tsx` | System | Floating Dropdown | CSS Modules | List of in-app trial alerts, budget warnings, and capture confirmations |
| **OfflineIndicator** | `components/OfflineIndicator.tsx` | Infrastructure | Floating Banner | CSS Modules | Yellow/Amber alert bar displayed when navigator is offline |

---

## 6. Deprecated, Orphan, and Redundant Components

1. **`ExpenseDetailsPage.tsx` (`pages/ExpenseDetailsPage.tsx`):**
   - 582 lines. Completely unreferenced in navigation. Duplicates `TransactionsPage`. Has its own add expense dialog and polling timer.
   - **Recommendation:** Merge any unique analytics filters into `TransactionsPage` / `Activity` and delete.

2. **`RecurringPage.tsx` (`pages/RecurringPage.tsx`):**
   - 40 lines of static hardcoded dummy data ("Gym Membership", "Car Insurance").
   - **Recommendation:** Delete immediately.

3. **`AITestPage.tsx` (`pages/AITestPage.tsx`):**
   - Internal test harness for OpenAI/Groq prompt engineering.
   - **Recommendation:** Remove from production routes; keep in `/test` or dev-only tools.

4. **`BillRemindersPage.tsx` (`pages/BillRemindersPage.tsx`) vs `BillsPage.tsx`:**
   - Both pages display impending liabilities and due dates. `BillsPage` uses `bills` table; `BillRemindersPage` uses `bill_reminders` table.
   - **Recommendation:** Unify into one authoritative "Commitments & Bills" view.

5. **`GlassCard.tsx` & `BentoCard.tsx` (`components/`):**
   - Leftover experiment components from previous theme iterations. Rarely used across core pages.
   - **Recommendation:** Replace with standard `Surface` or `Card` primitive.

6. **`StatusOverlay.tsx` & `SyncStatusIndicator.tsx` (`components/`):**
   - Duplicates `SyncStatus.tsx` and `ExtensionStatsCard.tsx`.
   - **Recommendation:** Consolidate into unified connection status indicator.
