# Portfolio chat API

Small FastAPI backend that powers the chat widget on the portfolio site. Answers
visitor questions about Montaser Hussam using Groq's LLM API. GitHub Pages
(where the static site is hosted) can't run Python, so this runs as a
separate service.

## Local run

```bash
cd fastapi-chat
pip install -r requirements.txt
cp .env.example .env   # then fill in GROQ_API_KEY
set -a; source .env; set +a
uvicorn app.main:app --reload --port 8000
```

## Deploy on Render

1. New Web Service on Render, pointed at this repo, root directory `fastapi-chat`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment variables:
   - `GROQ_API_KEY` — from console.groq.com
   - `ALLOWED_ORIGINS` — `https://montaser778.github.io` (and any custom domain
     the site is served from, comma-separated). Left empty, the API refuses
     all cross-origin requests, so the widget will fail with a CORS error
     until this is set.
5. Once deployed, copy the Render URL into `assets/js/chat-widget.js`'s
   `CHAT_API_URL` constant.

Free-tier Render services spin down on idle (same caveat as the
exam-integrity-system ai-service) — the first message after a period of
inactivity will be slow while it wakes up. Upgrade to a paid tier to avoid
that if this becomes a page visitors rely on.
