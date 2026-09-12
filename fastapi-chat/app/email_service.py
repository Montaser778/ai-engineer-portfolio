"""Sends transactional email (currently just password-reset links) via
Resend's API. Best-effort: a misconfigured/unreachable email service should
never crash the request that triggered it -- the caller decides what to
tell the user (e.g. "if that account exists, a reset link was sent",
regardless of whether sending actually succeeded, to avoid leaking which
emails are registered).
"""
import os

import httpx

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
RESEND_FROM = os.environ.get("RESEND_FROM", "Portfolio Admin <onboarding@resend.dev>")


async def send_email(to: str, subject: str, html: str) -> bool:
    if not RESEND_API_KEY:
        print("RESEND_API_KEY not set -- skipping email send.")
        return False
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={"from": RESEND_FROM, "to": [to], "subject": subject, "html": html},
            )
        except httpx.RequestError as e:
            print(f"Resend request failed: {e}")
            return False
    if resp.status_code >= 300:
        print(f"Resend API error {resp.status_code}: {resp.text[:300]}")
        return False
    return True
