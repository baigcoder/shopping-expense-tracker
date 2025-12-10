# Shopping Expense Tracker - Backend

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### 3. Setup Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > Database > Connection string
3. Copy the connection string to `DATABASE_URL` in `.env`
4. Copy API keys from Settings > API to `.env`

### 4. Setup Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Go to Project Settings > Service Accounts
4. Generate a new private key
5. Copy the values to `.env`

### 5. Initialize Database
```bash
npm run prisma:generate
npm run prisma:push
```

### 6. Run Development Server
```bash
npm run dev
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/me` - Update profile

### Transactions
- `GET /api/transactions` - List transactions (paginated)
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PATCH /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Analytics
- `GET /api/analytics/summary` - Spending summary
- `GET /api/analytics/monthly` - Monthly breakdown
- `GET /api/analytics/by-category` - Category breakdown
- `GET /api/analytics/by-store` - Store breakdown

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
# Trigger deploy
