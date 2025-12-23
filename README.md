# SpendSync 💸

Every transaction, perfectly tracked. Automated expense tracking with real-time insights and AI-powered financial intelligence.

Features a powerful **Browser Extension** for automatic purchase detection and a **Premium Dashboard** with real-time analytics powered by Modern SaaS design.

![SpendSync Dashboard](https://via.placeholder.com/800x400?text=SpendSync+Dashboard+Preview)

## ✨ Key Features

### 🛍️ Automated Tracking (Browser Extension)

Automatically detects and records purchases from major e-commerce platforms using our smart DOM parsing engine:
- **Global**: Amazon, eBay, Shopify, Etsy, AliExpress
- **Retail**: Walmart, Best Buy, Target
- **Regional**: Daraz, Foodpanda
- **Payments**: Stripe, PayPal, Gumroad, BuyMeACoffee

### 📊 Intelligent Dashboard
- **Real-time Analytics**: Visual spending breakdowns by category and merchant.
- **Budget Alerts**: Set monthly limits and get notified before you overspend.
- **Gamification**: Earn badges and achievements for smart financial habits.
- **Goal Tracking**: Set savings goals and visualize your progress.
- **Data Privacy**: Export your data or delete your account at any time.

## 🛠️ Technology Stack

### Frontend & Extension
- **React 18** + **TypeScript**
- **Vite** (Lightning-fast builds)
- **Tailwind CSS** (Modern utility-first styling)
- **shadcn/ui** (Premium component library)
- **Zustand** (State management)
- **Framer Motion** (Premium animations)
- **Recharts** (Data visualization)

### Backend
- **Node.js** + **Express**
- **Prisma ORM**
- **PostgreSQL** (via Supabase)
- **Supabase Auth** (Secure authentication)

## 📁 Project Structure

```
spendsync/
├── extension/               # Browser Extension (Manifest V3)
│   ├── manifest.json        # "SpendSync" branding
│   ├── popup.html           # Modern SaaS UI
│   └── content.js           # Smart transaction scrapers
│
├── frontend/                # React Web Dashboard
│   ├── src/
│   │   ├── components/      # UI components (Tailwind + shadcn/ui)
│   │   ├── pages/           # Dashboard, Analytics, Settings
│   │   ├── services/        # Supabase clients
│   │   ├── lib/             # Utilities, sounds
│   │   └── store/           # Zustand stores
│   └── package.json
│
└── backend/                 # API Server
    └── ...
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Project

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/spendsync.git
cd spendsync

# Install Frontend Deps
cd frontend
npm install
```

### 2. Configuration

Create `.env` in `frontend`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Running Locally

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev
```

### 4. Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right).
3. Click "Load unpacked".
4. Select the `spendsync/extension` folder.

## 🎨 Design Philosophy
**Modern SaaS with Premium Fintech Aesthetics**:
- **Blue (#2563EB) + Red (#DC2626)**: Professional, trustworthy colors
- **Tailwind CSS + shadcn/ui**: Industry-standard component system
- **Motion**: Smooth transitions and micro-interactions
- **Clarity**: Bold typography (Plus Jakarta Sans + Inter)

## 📄 License
MIT License. Built with ❤️ for smart money management.
