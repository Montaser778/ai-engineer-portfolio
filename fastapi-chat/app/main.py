"""FastAPI backend for the portfolio site: the Groq-backed chat widget,
public read endpoints for project/demo/pricing cards, the contact-form
inbox, and (at /admin) a session-authenticated dashboard for editing all of
the above plus site copy. Deployed separately from the static site (GitHub
Pages can't run Python) -- see README.md in this folder for deployment
steps.
"""
import os
import uuid

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db, init_db_and_seed_owner
from app.models import ChatLog, ContactMessage, PageView
from app.routers import admin, content

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Comma-separated list of origins allowed to call this API, e.g.
# "https://montaser778.github.io,https://montaser778.com". Required in
# production -- an empty/missing value locks the API to same-origin only
# (i.e. unusable from the static site), which fails loudly instead of
# silently allowing every origin.
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

SYSTEM_PROMPT = """You are the AI assistant embedded on Montaser Hussam's portfolio site \
(montaser778.github.io). You answer visitor questions ABOUT Montaser -- his skills, \
projects, and how to work with him. You are not a general-purpose assistant: politely \
decline unrelated requests (coding help for the visitor's own projects, general trivia, \
etc.) and redirect to the contact page.

Facts about Montaser Hussam (do not invent anything beyond this):
- AI / ML Engineer, remote worldwide, based in Gaza, Palestine.
- Focus areas: real-time voice AI agents, multi-agent architectures, production LLM pipelines.
- Known for sub-800ms turn latency in voice AI, bilingual (English/Arabic) systems.
- Shipped production deployments on Fly.io and Pipecat Cloud.
- Public work is verifiable at github.com/montaser778.
- Site sections: Projects, Demos, Notes, About, Services, Pricing, Contact.
- To hire him or start a conversation, direct people to the Contact page/form on the site \
(response time: about one business day).

Style: concise, confident, no filler, no emoji. Answer in the same language the visitor \
used (English or Arabic). If you don't know something specific (e.g. exact rates, \
availability dates), say so plainly and point to the Contact or Pricing page instead of \
guessing."""

app = FastAPI(title="Portfolio API")


@app.on_event("startup")
def _startup():
    init_db_and_seed_owner()


if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

app.include_router(admin.router)
app.include_router(content.router)


@app.exception_handler(HTTPException)
async def admin_auth_redirect(request: Request, exc: HTTPException):
    """A logged-out visitor hitting an /admin/* HTML page should land on the
    login form, not a raw JSON 401 -- API-style routes (content/, chat,
    contact) are unaffected since they don't raise 401 in the first place."""
    if exc.status_code == 401 and request.url.path.startswith("/admin"):
        return RedirectResponse("/admin/login", status_code=303)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    # Short rolling history from the widget: [{"role": "user"|"assistant", "content": "..."}]
    history: list[dict] = Field(default_factory=list, max_length=20)
    # Persisted client-side (e.g. localStorage) so a visitor's whole
    # conversation groups into one session in the admin inbox. Optional --
    # a missing id just means that exchange won't group with earlier ones.
    session_id: str | None = Field(default=None, max_length=64)


class ChatResponse(BaseModel):
    reply: str


class ContactRequest(BaseModel):
    name: str = Field(default="", max_length=200)
    email: str = Field(default="", max_length=200)
    message: str = Field(min_length=1, max_length=5000)


class TrackRequest(BaseModel):
    path: str = Field(min_length=1, max_length=300)
    visitor_id: str = Field(min_length=1, max_length=64)
    referrer: str = Field(default="", max_length=300)


@app.get("/health")
def health():
    return {"status": "ok"}


FAVICON_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
    '<rect width="32" height="32" rx="7" fill="#05070d"/>'
    '<circle cx="16" cy="16" r="4" fill="#7c5cff"/>'
    '<circle cx="6" cy="8" r="2.4" fill="#22d3c5"/><circle cx="26" cy="8" r="2.4" fill="#22d3c5"/>'
    '<circle cx="6" cy="24" r="2.4" fill="#22d3c5"/><circle cx="26" cy="24" r="2.4" fill="#22d3c5"/>'
    '<path d="M16 16L6 8M16 16L26 8M16 16L6 24M16 16L26 24" stroke="#8892a6" stroke-width="1"/></svg>'
)


@app.get("/favicon.svg")
def favicon():
    """Same mark as the public site's favicon.svg -- this backend has no
    static file serving of its own, so it's returned inline."""
    return Response(content=FAVICON_SVG, media_type="image/svg+xml")


@app.post("/contact")
def contact(req: ContactRequest, db: Session = Depends(get_db)):
    db.add(ContactMessage(name=req.name, email=req.email, message=req.message))
    db.commit()
    return {"status": "ok"}


@app.post("/track")
def track(req: TrackRequest, db: Session = Depends(get_db)):
    """Best-effort visitor analytics beacon -- must never surface an error
    to the page that called it (a broken analytics call is not something a
    visitor should ever see or have block anything)."""
    try:
        db.add(PageView(path=req.path, visitor_id=req.visitor_id, referrer=req.referrer))
        db.commit()
    except Exception:
        db.rollback()
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Chat is not configured (no GROQ_API_KEY set).")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in req.history:
        role = turn.get("role")
        content_ = turn.get("content")
        if role in ("user", "assistant") and isinstance(content_, str):
            messages.append({"role": role, "content": content_[:2000]})
    messages.append({"role": "user", "content": req.message})

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={"model": GROQ_MODEL, "messages": messages, "temperature": 0.4, "max_tokens": 500},
            )
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Could not reach the language model provider.")

    if resp.status_code != 200:
        print(f"Groq API error {resp.status_code}: {resp.text[:500]}")
        raise HTTPException(status_code=502, detail="The language model provider returned an error.")

    data = resp.json()
    try:
        reply = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected response from the language model provider.")

    session_id = req.session_id or str(uuid.uuid4())
    try:
        db.add(ChatLog(session_id=session_id, role="user", content=req.message))
        db.add(ChatLog(session_id=session_id, role="assistant", content=reply))
        db.commit()
    except Exception:
        db.rollback()

    return ChatResponse(reply=reply)
