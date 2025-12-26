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
- **AI Insights**: Get personalized spending tips powered by AI.
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
- **Zod** (Form validation)

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM**
- **PostgreSQL** (via Supabase)
- **Supabase Auth** (Secure authentication)
- **Vitest** (Unit testing)

## 📁 Project Structure

```
spendsync/
├── frontend/                # React Web Dashboard
│   ├── src/
│   │   ├── components/      # UI components (Tailwind + shadcn/ui)
│   │   ├── pages/           # Dashboard, Analytics, Settings
│   │   ├── services/        # Supabase clients
│   │   ├── validation/      # Zod schemas
│   │   ├── constants/       # Centralized configuration
│   │   ├── utils/           # Error handling & helpers
│   │   └── store/           # Zustand stores
│   └── package.json
│
└── backend/                 # API Server + Extension
    ├── src/
    │   ├── controllers/     # Route handlers
    │   ├── routes/          # API routes
    │   ├── middleware/      # Auth, error handling
    │   ├── services/        # Business logic
    │   ├── constants/       # Configuration values
    │   └── utils/           # Response helpers
    ├── extension/           # Browser Extension (Manifest V3)
    │   ├── manifest.json    # Extension config with CSP
    │   ├── background.js    # Service worker (rate limiting)
    │   ├── content.js       # Smart transaction detector
    │   ├── popup.html/js    # Extension popup
    │   ├── constants.js     # Shared constants
    │   └── utils.js         # Helper functions
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/spendsync.git
cd spendsync
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
DATABASE_URL="postgresql://user:password@localhost:5432/spendsync"
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
PORT=3001
NODE_ENV=development
```

Initialize database:
```bash
npm run prisma:push
npm run prisma:generate
```

Start backend:
```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001/api
```

Start frontend:
```bash
npm run dev
```

### 4. Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right).
3. Click "Load unpacked".
4. Select the `spendsync/extension` folder.

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
```

### Backend Tests
```bash
cd backend
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # With coverage
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update profile

### Transactions
- `GET /api/transactions` - List transactions (paginated)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/recent` - Get recent transactions

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `PATCH /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

## 🎨 Design Philosophy
**Modern SaaS with Premium Fintech Aesthetics**:
- **Blue (#2563EB) + Purple (#6366F1)**: Professional, trustworthy colors
- **Tailwind CSS + shadcn/ui**: Industry-standard component system
- **Motion**: Smooth transitions and micro-interactions
- **Clarity**: Bold typography (Plus Jakarta Sans + Inter)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License
MIT License. Built with ❤️ for smart money management.
