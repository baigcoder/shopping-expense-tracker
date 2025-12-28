# AI Server Deployment on Railway

## Quick Deploy

1. Push this folder to a monorepo on GitHub
2. In Railway, click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Set the **Root Directory** to: `ai-server`
5. Add environment variables in Railway dashboard

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key for AI parsing |

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/parse-document` | POST | Parse PDF/CSV → transactions |
| `/tts` | POST | Text-to-speech (FREE) |
| `/voices` | GET | List available TTS voices |

## Files

- `railway.json` - Railway deployment config  
- `railway.toml` - Alternative TOML config
- `Procfile` - Process definition
- `nixpacks.toml` - Nixpacks build config (Python 3.11 + tesseract)
- `requirements.txt` - Python dependencies

## Local Development

```bash
cd ai-server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Usage

### Parse Document
```bash
curl -X POST https://your-railway-url/parse-document \
  -F "file=@statement.pdf"
```

### Text-to-Speech
```bash
curl -X POST https://your-railway-url/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "voice": "jenny"}'
```
