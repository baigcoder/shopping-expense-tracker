# Cashly redesign v2: audit and plan

Date: 2026-11-03. Branch: `claude/redesign-v2` (from `main` at c25e065).

## 1. What exists today

Three visual languages are live at once:

| Layer | Where | Look |
|---|---|---|
| Antigravity editorial | Landing, login/signup, Demo OS, Inbox, Insights, Money Twin headers | Orange/pink/sage/wine on ivory, ALL-CAPS display headlines, mono numbers, pill labels |
| Calm Finance (older) | Most app page CSS modules (Bills, Budgets, Subscriptions, Settings, Accounts, Money Twin body, Insights body) | Rose `#E11D48` accent, cream canvas, rounded white cards |
| Jade dark mode | `index.css` dark theme | Brand switches to `#16A394` |

Routes: 26 real pages (+ 14 redirects). 20 pages carry their own 250-950 line CSS module, so the theme is re-declared page by page.

## 2. Measured problems (inspector, before)

| Page | FAIL | WARN | Worst findings |
|---|---|---|---|
| Landing | 19 | 15 | 9 headlines wrap to 3 lines; 26 pill/eyebrow labels; 57 tiny uppercase labels; body text at 12px; 217 text blocks under 13px; 23 resting shadows; 28 hairlines; 31 outlined boxes; emoji; mono numbers; the floating "Try live demo" dock covers headlines on every screen; 26 font sizes; 3 typefaces |
| Login | 12 | 7 | Eyebrow pill, 3-line headline, uppercase micro labels, outlined form card, footer jargon ("Enterprise 256-bit TLS") |
| Signup | 12 | 6 | Same as login |
| Features | 16 | 8 | Icon-topped card rows, eyebrow labels, tiny text |
| FAQ | 13 | 11 | Outlined boxes, micro labels |
| Demo OS (dashboard proxy) | 16 | 10 | 4 KPI tiles with mono numbers, emoji merchant icons, "Sovereign Review Queue", 3 currency switchers, toolbar crowding |

## 3. What a visitor and a user actually feel

1. **Too loud to read.** Every section shouts in capitals, and every number is in a code font. Nothing stands out because everything is emphasised.
2. **Jargon over meaning.** "Sovereign", "canonical ledger", "financial nervous system", "deficit collision averted". The product is simple: catch a purchase, ask you, then count it.
3. **The same story told six times.** Desktop, mobile and extension each appear as a hero card, a triptych and their own showcase section.
4. **Invented proof.** "David Daniels", "Pro Account", "Zero Deficit Risk", "+12d buffer" sit next to real features.
5. **App pages feel like different products.** Rose buttons on one page, orange on the next, jade in dark mode.
6. **Small text everywhere.** Most running text is 12px; labels are 9-11px.

## 4. Direction

### Marketing pages: "The product performs"
- **Idea:** the purchase held for approval becomes the working fragment the visitor approves.
- **Live thing:** a real checkout card on the landing hero. Approve, Hold or change its category, and "Safe to spend this month" plus "Runway" recalculate in place.
- **Hero:** a split ground (ink left, one step lighter right). Left: a plain one-line headline and one sentence plus one button, bottom-left. Right: the live card.
- **Sections:**
  1. Showcase: what Cashly produces (review card, monthly statement, runway, AI answer) as a list of names beside one true-size sheet.
  2. How it works: three call-and-response steps (shop, approve, see the forecast).
  3. Features: one paragraph with inline interface pieces.
  4. FAQ: filled-tile accordion.
  5. Closing sentence with the email field inside it.
  6. Footer of tiles.
- **Dropped:** the logo/proof strip, because there are no real customers to show.

### App screens: "Pastel consumer" mapped onto the brand
- **Shell:** an open plane. Labelled sidebar on the page ground, no top bar, a neutral grey pill for the active item, the user at the bottom.
- **Colour on data, not chrome:**
  - orange only on the primary action and today's mark;
  - pink, sage and wine as pale category tiles with the dark of their own hue as ink;
  - income green with a plus sign;
  - spending in ink, never red.
- **Money as the face:** sums in Plus Jakarta Sans tabular figures, 30-36px at 600, paise smaller and grey. No monospace.
- **Dashboard answers one question first:** "How much can I safely spend, and what needs my approval?" The review queue sits on the first screen with Approve one click away.
- **One element only Cashly has:** the approval rail. Every pending purchase shows where it will land (budget, runway) before you press Approve.

### Kept
- Palette: ivory `#F4F3EE`, ink `#111111`, cadmium `#EE5024`, pink `#F0A1CB`, sage `#BBC7B1`, wine `#80383D`.
- Fonts: Plus Jakarta Sans (display), Inter (text).
- Every route, form, data call and behaviour.

### Removed everywhere
ALL-CAPS headlines, pill eyebrows, monospace numbers, emoji, resting shadows, hairline boxes, 9-12px text, the floating demo dock, the jade dark brand, the rose accent.

## 5. Phases

1. **Foundation:** one token file (colour roles, 5-step type scale, radii, spacing); remove rose/jade; shared components (Button, Panel, Tile, Money, Row, EmptyState); the new app shell (sidebar + phone top bar).
2. **Public:** landing, login, signup, forgot/verify, features, FAQ, legal pages, contact.
3. **Core app:** dashboard, transaction inbox, transactions, money twin, insights/assist (AI chat).
4. **Plan and analyze:** budgets, goals, subscriptions/bills, cashflow calendar, analytics, reports.
5. **Account:** cards/accounts, settings, profile, extension health, shopping activity, demo OS.

Each phase ends with the inspector on 1440/768/390, before/after screenshots and a PR.
