# Production Deployment URLs

## Services

| Service | URL |
|---------|-----|
| **Frontend** | https://shopping-expense-tracker.vercel.app |
| **Backend API** | https://shopping-expense-tracker-svas.vercel.app |
| **AI Service** | https://shopping-expense-tracker-production.up.railway.app |

## Environment Variables Needed

### Frontend (Vercel)
```bash
VITE_API_URL=https://shopping-expense-tracker-svas.vercel.app
VITE_AI_SERVER_URL=https://shopping-expense-tracker-production.up.railway.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (Vercel)
```bash
FRONTEND_URL=https://shopping-expense-tracker.vercel.app
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
GROQ_API_KEY=your_groq_api_key
```

### AI Service (Railway)
```bash
GROQ_API_KEY=your_groq_api_key
```

## API Endpoints

### Backend API
- `GET /api/health` - Health check
- `POST /api/ai/chat` - AI chat
- `POST /api/voice/*` - Voice endpoints

### AI Service
- `GET /health` - Health check
- `POST /parse-document` - Parse PDF/CSV
- `POST /tts` - Text-to-speech
- `GET /voices` - List TTS voices
