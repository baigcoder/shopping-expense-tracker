# Shopping Expense Tracker

A full-stack ecosystem to master your online shopping expenses, featuring a **Chrome Extension** for automatic purchase tracking and a **Premium Dashboard** for analytics.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Dashboard+Preview)

## ✨ Key Features

### 🛍️ Automated Tracking (Chrome Extension)
Automatically detects and records purchases from major e-commerce platforms:
- **Amazon**
- **eBay**
- **Walmart**
- **Best Buy**
- **Target**
- **Etsy**
- **AliExpress**
- **Daraz & Foodpanda** (pk)
- **Shopify Stores**

### 📊 Intelligent Dashboard
- **Real-time Analytics**: Visual spending breakdowns by category and platform.
- **Budget Management**: Set monthly limits and get specific alerts.
- **Transaction History**: Searchable, filterable history of all your purchases.
- **Manual Entry**: Easily add cash or offline expenses.
- **Goal Tracking**: visuals to keep you on target.

## 🛠️ Technology Stack

### Frontend & Extension
- **React 18** with **TypeScript** for robust component logic.
- **Vite** for lightning-fast builds.
- **Zustand** for lightweight global state management.
- **Framer Motion** for premium, smooth UI animations.
- **Recharts** for beautiful data visualization.
- **TailwindCSS** (or Custom CSS Modules) for styling.

### Backend
- **Node.js** & **Express** for a scalable API.
- **Prisma ORM** for type-safe database interactions.
- **PostgreSQL** (via Supabase) for reliable data storage.
- **Firebase Auth** for secure, multi-provider authentication.

## 📁 Project Structure

```
shopping-expense-tracker/
├── extension/               # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js
│   ├── content.js           # Purchase detection logic
│   └── popup.html           # Extension UI
│
├── frontend/                # React Web Dashboard
│   ├── src/
│   │   ├── components/      # UI components & Charts
│   │   ├── pages/           # Dashboard, Analytics, Settings
│   │   ├── services/        # API clients
│   │   └── store/           # State management
│   └── package.json
│
├── backend/                 # API Server
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # Endpoints
│   │   └── prisma/          # DB Schema definitions
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase Project
- Firebase Project

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/shopping-expense-tracker.git
cd shopping-expense-tracker

# Install Backend Deps
cd backend
npm install

# Install Frontend Deps
cd ../frontend
npm install
```

### 2. Configuration

Create `.env` files in both `backend` and `frontend` directories based on the `.env.example` templates.
- **Backend**: Needs Database URL and Firebase Admin keys.
- **Frontend**: Needs Firebase parameters and Backend API URL.

### 3. Running Locally

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Extension Setup
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right).
3. Click "Load unpacked".
4. Select the `shopping-expense-tracker/extension` folder.

## 🎨 Design Philosophy

The application features a **Premium Dark Theme** designed for clarity and aesthetics:
- **Glassmorphism**: Subtle translucency for depth.
- **Gradient Accents**: Modern, vibrant touches to highlight key data.
- **Micro-Interactions**: Smooth hover and click effects using Framer Motion.
- **Responsive**: Flawless experience on Desktop, Tablet, and Mobile.

## 🔒 Security

- **Secure Auth**: Powered by Firebase (Google & Email/Password).
- **Data Privacy**: Validation with Zod and sanitized inputs.
- **Rate Limiting**: Protected API endpoints.

## 📄 License
MIT License. Built for the community.
