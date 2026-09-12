"""One-off English->Arabic translation for the dashboard's "Translate"
button, reusing the same Groq credentials already configured for the chat
widget instead of adding a second translation API/credential.
"""
import os

import httpx
from fastapi import HTTPException

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

TRANSLATE_SYSTEM_PROMPT = (
    "You translate short website copy from English to Modern Standard Arabic for a "
    "professional AI/ML engineer's portfolio site. Preserve tone (confident, concise, "
    "no filler), keep any product/technology names untranslated (e.g. FastAPI, Pipecat, "
    "WebRTC), and preserve numbers and units exactly. Reply with ONLY the Arabic "
    "translation -- no quotes, no explanation, no English."
)


async def translate_to_arabic(text: str) -> str:
    if not text.strip():
        return ""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Translation is not configured (no GROQ_API_KEY set).")

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            resp = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": TRANSLATE_SYSTEM_PROMPT},
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.2,
                    "max_tokens": 800,
                },
            )
        except httpx.RequestError:
            raise HTTPException(status_code=502, detail="Could not reach the translation provider.")

    if resp.status_code != 200:
        print(f"Groq translate error {resp.status_code}: {resp.text[:300]}")
        raise HTTPException(status_code=502, detail="The translation provider returned an error.")

    data = resp.json()
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Unexpected response from the translation provider.")
