<p align="center">
  <img src="https://img.shields.io/badge/Cashly-Finance%20Tracker-2563EB?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMnYyMG02LjM2NCAxLjY0bC0xLjQxNC0xLjQxNE0yMSAxMmgyTTIuMDY0IDEySDRNNS42MzYgNS42MzZsMS40MTQgMS40MTRNNi4zNjQgMTguMzY0bDEuNDE0LTEuNDE0Ii8+PC9zdmc+" alt="Cashly Logo">
</p>

<h1 align="center">💰 Cashly</h1>

<p align="center">
  <strong>Your AI-Powered Financial Companion</strong><br>
  Automated expense tracking with intelligent insights, voice AI, and real-time analytics.
</p>

<p align="center">
  <a href="https://shopping-expense-tracker.vercel.app"><img src="https://img.shields.io/badge/🚀_Live_Demo-Visit_App-2563EB?style=for-the-badge" alt="Live Demo"></a>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-View-2563EB?style=flat-square" alt="Features"></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Quick%20Start-Guide-10B981?style=flat-square" alt="Quick Start"></a>
  <a href="#-api-reference"><img src="https://img.shields.io/badge/API-Reference-F59E0B?style=flat-square" alt="API Reference"></a>
  <a href="#-contributing"><img src="https://img.shields.io/badge/Contribute-Welcome-7C3AED?style=flat-square" alt="Contributing"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/Groq-LLM-FF6B35?logo=openai&logoColor=white" alt="Groq">
</p>

---

## ⚡ Highlights

| Feature | Description |
|:--------|:------------|
| 🛍️ **Smart Extension** | Auto-tracks purchases from Amazon, Daraz, eBay, Shopify, and 20+ platforms |
| 🤖 **AI Assistant** | Groq-powered chatbot with full financial context awareness |
| 🎙️ **Voice AI** | Add transactions, goals, and reminders using natural voice commands |
| 📊 **Real-time Sync** | Supabase Realtime for instant updates across all devices |
| 🏦 **Bank Integration** | Connect accounts via Plaid for automatic transaction import |
| 📱 **PWA Ready** | Mobile-optimized with touch gestures and haptic feedback |

---

## ✨ Features

### 🛍️ Browser Extension - Smart Purchase Tracking

Automatically detects and records purchases using intelligent DOM parsing:

```
✅ Amazon, eBay, Walmart, Target, Best Buy
✅ Shopify stores (universal), Etsy, AliExpress  
✅ Daraz, Foodpanda (regional)
✅ Stripe, PayPal, Gumroad, BuyMeACoffee
```

**Extension Features:**
- 🔄 Offline queue with auto-sync
- 🛡️ Rate limiting & JWT validation
- 📡 Real-time broadcasting to dashboard
- 🧪 Test mode for development

### 🤖 Cashly AI - Intelligent Financial Assistant

| Capability | Description |
|:-----------|:------------|
| **Smart Chat** | Context-aware conversations with full access to your financial data |
| **AI Insights** | Personalized tips cached via Redis for instant delivery |
| **Forecasting** | Predictive analytics for future spending patterns |
| **Risk Alerts** | Proactive warnings about overspending or anomalies |
| **Voice Actions** | "Add a goal to save Rs 50,000 for iPhone by December" |

### 📊 Premium Dashboard

- **Real-time Analytics**: Interactive Recharts visualizations
- **30-Day Streak Tracker**: Gamified daily engagement
- **Financial Health Score**: AI-calculated score based on habits
- **Quick Add FAB**: Tap to add transactions in seconds
- **Extension Status Widget**: Monitor tracking in real-time

### 💳 Digital Vault

- Multi-card support with beautiful gradient themes
- Auto-detection of Visa, Mastercard, Amex, Discover
- Secure encrypted storage with masking

### 🎯 Goals & Budgets

- Savings goals with progress tracking
- Category & overall budget limits
- Smart alerts at 80% and 100% usage
- Visual progress with animations

### 📅 Subscriptions & Bills

- Track all recurring payments
- Trial-to-paid conversion alerts
- Due date notifications
- Monthly cost analysis

### 📱 Mobile-First Experience

- **Touch Optimization**: 44px minimum touch targets
- **Haptic Feedback**: Vibration patterns for actions
- **PWA Support**: Standalone mode with safe-area insets
- **Landscape Mode**: Adaptive layouts

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|:-----------|:--------|:--------|
| React | 18.3 | UI framework with concurrent features |
| TypeScript | 5.6 | Type-safe development |
| Vite | 5.4 | Lightning-fast bundler |
| Tailwind CSS | 4.0 | Utility-first styling |
| Framer Motion | 11.11 | Premium animations |
| Zustand | 5.0 | Lightweight state management |
| React Query | 5.60 | Data fetching & caching |
| Recharts | 2.13 | Data visualization |
| Tesseract.js | 6.0 | OCR for PDF bank statements |

### Backend
| Technology | Version | Purpose |
|:-----------|:--------|:--------|
| Node.js | 18+ | JavaScript runtime |
| Express | 4.21 | Web framework |
| Prisma | 5.22 | Database ORM |
| PostgreSQL | - | Primary database (Supabase) |
| Groq SDK | 0.37 | LLM integration |
| ioredis | 5.8 | Redis caching |
| Plaid | 40.0 | Bank connectivity |
| Helmet | 7.1 | Security headers |
| Zod | 3.23 | Schema validation |

### Infrastructure
| Service | Purpose |
|:--------|:--------|
| Supabase | Database + Auth + Realtime |
| Redis Cloud | AI response caching |
| Vercel | Frontend & API hosting |
| Sentry | Error tracking |

---

## 📁 Project Structure

```
cashly/
├── frontend/                 # React Dashboard
│   ├── src/
│   │   ├── components/       # 118+ UI components
│   │   ├── pages/            # 26 page components
│   │   ├── services/         # 40+ service modules
│   │   ├── hooks/            # 13+ custom hooks
│   │   ├── store/            # Zustand stores
│   │   └── styles/           # CSS modules
│   └── public/               # Static assets & sounds
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, caching, errors
│   │   └── validators/       # Zod schemas
│   ├── extension/            # Chrome Extension v6.0
│   └── prisma/               # Database schema
│
├── ai-server/                # AI microservice (optional)
└── supabase/                 # Database migrations
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL (or free Supabase project)
- Redis (or free Redis Cloud)
- Groq API key (free at console.groq.com)

### 1. Clone & Install

```bash
git clone https://github.com/baigcoder/shopping-expense-tracker.git
cd shopping-expense-tracker

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Setup

**Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"

# Supabase
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI
GROQ_API_KEY=gsk_xxxxxxxxxxxx

# Cache
REDIS_URL=redis://default:password@host:port

# Security
JWT_SECRET=your_secure_random_secret_min_32_chars
FRONTEND_URL=http://localhost:5173
```

**Frontend (`frontend/.env`):**
```env
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:5000/api
```

### 3. Database Setup

```bash
cd backend
npm run prisma:push
npm run prisma:generate
```

### 4. Run Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 🎉

### 5. Install Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `backend/extension`
4. Pin the extension and log in

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |

### Transactions
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/transactions` | List (paginated) |
| POST | `/api/transactions` | Create transaction |
| PATCH | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |

### AI & Insights
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/ai/insights` | AI-generated insights (cached) |
| POST | `/api/ai/chat` | Chat with Cashly AI |
| POST | `/api/ai/voice-action` | Execute voice commands |
| GET | `/api/ai/forecast` | Spending predictions |

### Plaid (Bank Integration)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/api/plaid/create-link-token` | Create Plaid Link |
| POST | `/api/plaid/exchange-token` | Exchange token |
| POST | `/api/plaid/sync-transactions` | Sync transactions |

---

## 🎨 Design System

| Element | Value |
|:--------|:------|
| **Primary** | Blue `#2563EB` → Purple `#7C3AED` gradient |
| **Success** | Emerald `#10B981` |
| **Warning** | Amber `#F59E0B` |
| **Typography** | Space Grotesk (headings) + Inter (body) |
| **Radius** | `16px` cards, `12px` buttons |
| **Animations** | Framer Motion spring physics |
| **Dark Mode** | Full support via Tailwind |

---

## 🔒 Security

- **Supabase RLS**: Row-Level Security on all tables
- **JWT Verification**: Backend validates all tokens
- **Rate Limiting**: 100 req/15min per IP
- **Helmet.js**: XSS, clickjacking protection
- **Zod Validation**: Input sanitization
- **CORS**: Origin restriction configured

---

## 🧪 Testing

```bash
# Frontend
cd frontend
npm run test          # Watch mode
npm run test:coverage # Coverage report

# Backend
cd backend
npm run test
npm run test:coverage
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Frontend
cd frontend && vercel --prod

# Backend
cd backend && vercel --prod
```

### Environment Variables
Configure in Vercel dashboard or `.env.production` files.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing`
5. Open Pull Request

---

## 📄 License

MIT License. Built with ❤️ for smarter money management.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [Groq](https://groq.com) - Ultra-fast LLM inference
- [Plaid](https://plaid.com) - Bank connectivity
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Framer Motion](https://framer.com/motion) - Animations

---

<p align="center">
  <strong>Cashly</strong> — Every Transaction, Perfectly Tracked 💸
</p>
