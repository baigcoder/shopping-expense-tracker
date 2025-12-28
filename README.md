# Cashly 💰

**Your AI-Powered Financial Companion** — Automated expense tracking with intelligent insights, voice actions, and real-time analytics.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

![Cashly Dashboard Preview](https://via.placeholder.com/900x450?text=Cashly+Dashboard+Preview)

---

## ✨ Key Features

### 🛍️ Smart Purchase Detection (Browser Extension)

Automatically detects and records purchases from major e-commerce platforms using our intelligent DOM parsing engine:

| Platform Type | Supported Sites |
|--------------|-----------------|
| **Global Marketplaces** | Amazon, eBay, Shopify, Etsy, AliExpress |
| **Retail Giants** | Walmart, Best Buy, Target |
| **Regional Favorites** | Daraz, Foodpanda |
| **Payment Processors** | Stripe, PayPal, Gumroad, BuyMeACoffee |

### 🤖 AI-Powered Intelligence (Cashly AI)

Powered by **Groq LLM** for instant, intelligent financial assistance:

- **Smart Chatbot**: Context-aware conversations about your spending with full financial data access
- **AI Insights**: Personalized tips based on your spending patterns (cached via Redis for speed)
- **Spending Forecasts**: Predictive analytics for future months
- **Risk Alerts**: Proactive warnings about overspending or unusual patterns
- **Voice Actions**: Add goals, reminders, or transactions using natural voice commands

### 📊 Premium Dashboard

Modern SaaS design with premium fintech aesthetics:

- **Real-time Analytics**: Interactive charts (Recharts) for spending breakdowns
- **Category Visualization**: Visual spending by category with custom icons
- **Trend Analysis**: Weekly/monthly spending trends and comparisons
- **Financial Health Score**: AI-calculated score based on your habits

### 💳 Card Management

Secure digital wallet for tracking your payment methods:

- **Multi-card Support**: Add unlimited credit/debit cards
- **Card Theming**: Beautiful gradient card designs
- **Auto-detection**: Detects Visa, Mastercard, Amex, Discover, etc.
- **Encrypted Storage**: Secure token-based storage

### 🎯 Goals & Budgets

Complete financial planning toolkit:

- **Savings Goals**: Set targets with deadlines and track progress
- **Budget Limits**: Set category or overall monthly budgets
- **Progress Visualization**: Animated progress bars and charts
- **Smart Alerts**: Notifications at 80% and 100% budget usage

### 📅 Subscriptions & Bills

Never miss a payment again:

- **Subscription Tracker**: Track all recurring subscriptions
- **Trial Detection**: Alerts before free trials convert to paid
- **Bill Reminders**: Due date notifications with amount tracking
- **Monthly Cost Analysis**: Total subscription cost breakdown

### 🏦 Bank Integration (Plaid)

Seamless bank account connectivity:

- **Secure OAuth**: Industry-standard Plaid integration
- **Auto-sync Transactions**: Automatic import from linked accounts
- **Multi-bank Support**: Link multiple financial institutions
- **Real-time Updates**: Transactions sync automatically

### 📱 Smart Imports

Multiple ways to add transactions:

- **PDF Bank Statements**: OCR-powered parsing via Tesseract.js
- **CSV Import**: Support for various bank export formats
- **Manual Entry**: Quick add with smart categorization
- **Extension Auto-capture**: Automatic from browser shopping

### 💬 Voice & Notifications

Interactive features for power users:

- **Voice Commands**: "Add a goal to save Rs 50,000 for iPhone"
- **Smart Notifications**: Real-time alerts via Supabase Realtime
- **Sound Effects**: Satisfying audio feedback for actions
- **Gen-Z Toast Notifications**: Fun, playful notification style

### 📈 Reports & Exports

Comprehensive reporting capabilities:

- **PDF Reports**: Download beautiful expense reports
- **Excel/CSV Export**: Export transactions for external analysis
- **Analytics Dashboard**: Detailed spending insights page
- **Data Portability**: Full data export/delete options

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks & concurrent features |
| **TypeScript 5.6** | Type-safe development |
| **Vite 5** | Lightning-fast dev server & builds |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui + Radix** | Accessible component primitives |
| **Framer Motion** | Premium animations & transitions |
| **Zustand** | Lightweight state management |
| **React Query** | Data fetching & caching |
| **Recharts** | Data visualization |
| **Zod 4** | Schema validation |
| **Tesseract.js** | OCR for PDF parsing |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js 18+** | JavaScript runtime |
| **Express 4** | Web framework |
| **TypeScript** | Type-safe backend |
| **Prisma ORM** | Database toolkit |
| **PostgreSQL** | Primary database (Supabase) |
| **Supabase Auth** | Authentication & RLS |
| **Redis (ioredis)** | Caching layer |
| **Groq SDK** | AI/LLM integration |
| **Plaid SDK** | Bank connections |
| **Helmet** | Security headers |
| **Vitest** | Unit testing |

### Deployment
| Platform | Component |
|----------|-----------|
| **Vercel** | Frontend hosting |
| **Vercel/Railway** | Backend API |
| **Supabase** | Database + Auth |
| **Redis Cloud** | Caching |

---

## 📁 Project Structure

```
cashly/
├── frontend/                    # React Web Dashboard
│   ├── src/
│   │   ├── components/          # 118+ UI components
│   │   │   ├── AIChatbot.tsx    # AI chat interface
│   │   │   ├── VoiceCallModal.tsx # Voice interaction
│   │   │   ├── NotificationsPanel.tsx
│   │   │   └── ...
│   │   ├── pages/               # 26 page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── TransactionsPage.tsx
│   │   │   ├── BudgetsPage.tsx
│   │   │   ├── GoalsPage.tsx
│   │   │   ├── SubscriptionsPage.tsx
│   │   │   ├── MoneyTwinPage.tsx # What-if scenarios
│   │   │   └── ...
│   │   ├── services/            # 40+ service modules
│   │   │   ├── aiService.ts     # AI chat & insights
│   │   │   ├── plaidService.ts  # Bank integration
│   │   │   ├── currencyService.ts
│   │   │   ├── pdfAnalyzerService.ts
│   │   │   └── ...
│   │   ├── hooks/               # 13 custom hooks
│   │   ├── store/               # Zustand stores
│   │   ├── config/              # Configuration
│   │   └── types/               # TypeScript definitions
│   ├── public/                  # Static assets & sounds
│   └── package.json
│
├── backend/                     # Express API Server
│   ├── src/
│   │   ├── controllers/         # Request handlers
│   │   │   ├── transactionController.ts
│   │   │   ├── analyticsController.ts
│   │   │   ├── plaidController.ts
│   │   │   ├── voiceController.ts
│   │   │   └── ...
│   │   ├── routes/              # API route definitions
│   │   │   ├── ai.ts            # AI endpoints (707 lines!)
│   │   │   ├── plaid.routes.ts
│   │   │   ├── voice.routes.ts
│   │   │   └── ...
│   │   ├── services/            # Business logic
│   │   │   ├── groqService.ts   # LLM integration
│   │   │   ├── redisCacheService.ts
│   │   │   └── ...
│   │   ├── middleware/          # Auth, validation, errors
│   │   └── validators/          # Zod schemas
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── extension/               # Browser Extension
│       ├── manifest.json        # Chrome Manifest V3
│       ├── background.js        # Service worker
│       ├── content.js           # DOM parser
│       ├── popup.html/js        # Extension UI
│       └── icons/               # Extension icons
│
└── supabase/                    # Database setup
    ├── migrations/
    └── supabase_realtime_tables.sql
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)
- Redis instance (local or Redis Cloud)
- Groq API key (free at console.groq.com)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cashly.git
cd cashly
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env
```

Configure `.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# Database (Supabase Postgres)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Supabase
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI (Groq - free tier available)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# Cache
REDIS_URL=redis://default:password@host:port

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your_secure_random_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

# Optional: Plaid (for bank integration)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Optional: Email (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Initialize database:
```bash
npm run prisma:push
npm run prisma:generate
```

Start backend:
```bash
npm run dev     # Development with hot reload
npm run build   # Production build
npm start       # Production server
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:
```env
VITE_SUPABASE_URL=https://[PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev     # Development
npm run build   # Production build
npm run preview # Preview production build
```

### 4. Browser Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `backend/extension` folder
5. Click the extension icon and log in with your Cashly account

---

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

### Backend Tests
```bash
cd backend
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage report
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/profile` | Get user profile |
| PATCH | `/api/auth/profile` | Update profile |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (paginated) |
| GET | `/api/transactions/:id` | Get single transaction |
| POST | `/api/transactions` | Create transaction |
| PATCH | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/recent` | Get recent transactions |

### AI & Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/insights` | Get AI-generated insights (cached) |
| GET | `/api/ai/forecast` | Get spending forecast |
| GET | `/api/ai/risks` | Get risk alerts |
| POST | `/api/ai/chat` | Chat with Cashly AI |
| POST | `/api/ai/chat/fast` | Fast chat with pre-built context |
| POST | `/api/ai/voice-action` | Execute voice commands |
| POST | `/api/ai/refresh` | Force refresh AI data |
| GET | `/api/ai/status` | Check AI service status |

### Plaid (Bank Integration)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plaid/create-link-token` | Create Plaid Link token |
| POST | `/api/plaid/exchange-token` | Exchange public token |
| GET | `/api/plaid/accounts` | Get linked accounts |
| POST | `/api/plaid/sync-transactions` | Sync bank transactions |

### Categories, Budgets & More
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create budget |
| GET | `/api/cards` | List user cards |
| POST | `/api/cards` | Add new card |
| GET | `/api/analytics/summary` | Get analytics summary |

---

## 🎨 Design System

**Premium Fintech Aesthetics with Gen-Z Energy**

| Element | Value |
|---------|-------|
| **Primary Colors** | Blue (#2563EB) + Purple (#7C3AED) |
| **Gradients** | Linear 135deg blue-to-purple |
| **Font Family** | Space Grotesk (headings) + Inter (body) |
| **Border Radius** | 16px (cards), 12px (buttons) |
| **Shadows** | Soft glow with colored edges |
| **Animations** | Framer Motion (spring physics) |
| **Dark Mode** | Full support via Tailwind |

---

## 🔒 Security Features

- **Supabase RLS**: Row-Level Security on all database tables
- **JWT Verification**: Backend validates all Supabase tokens
- **Rate Limiting**: 100 requests/15min per IP
- **Helmet.js**: Security headers (XSS, clickjacking protection)
- **Zod Validation**: Input validation on all endpoints
- **CORS Protection**: Origin restriction configured
- **Error Sanitization**: No stack traces in production

---

## 🚢 Deployment

### Vercel (Recommended)

**Frontend:**
```bash
cd frontend
vercel --prod
```

**Backend:**
```bash
cd backend
vercel --prod
```

### Railway (Alternative)
```bash
railway up
```

### Environment Variables
Set all environment variables in your deployment platform's dashboard.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License. Built with ❤️ for smart money management.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [Groq](https://groq.com) - Ultra-fast LLM inference
- [Plaid](https://plaid.com) - Bank connectivity
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Framer Motion](https://www.framer.com/motion/) - Animations

---

**Cashly** — *Every Transaction, Perfectly Tracked* 💸
