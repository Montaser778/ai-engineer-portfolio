"""Small FastAPI backend for the portfolio's chat widget. Answers visitor
questions about Montaser Hussam's work using Groq's LLM API, grounded in a
fixed system prompt (see SYSTEM_PROMPT) so it doesn't hallucinate claims
about him. Deployed separately from the static site (GitHub Pages can't run
Python) -- see README.md in this folder for deployment steps.
"""
import os

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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

app = FastAPI(title="Portfolio Chat API")

if ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_methods=["POST"],
        allow_headers=["Content-Type"],
    )


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    # Short rolling history from the widget: [{"role": "user"|"assistant", "content": "..."}]
    history: list[dict] = Field(default_factory=list, max_length=20)


class ChatResponse(BaseModel):
    reply: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/debug/groq-models")
async def debug_groq_models():
    """Temporary diagnostic endpoint -- lists the models this deployment's
    GROQ_API_KEY can actually see, to debug the model_not_found errors seen
    with llama-3.3-70b-versatile / llama-3.1-8b-instant. Never returns the
    key itself. Remove once the chat is confirmed working."""
    if not GROQ_API_KEY:
        return {"configured": False}
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            "https://api.groq.com/openai/v1/models",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
        )
    return {"configured": True, "status_code": resp.status_code, "body": resp.json()}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Chat is not configured (no GROQ_API_KEY set).")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in req.history:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and isinstance(content, str):
            messages.append({"role": role, "content": content[:2000]})
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

    return ChatResponse(reply=reply)
