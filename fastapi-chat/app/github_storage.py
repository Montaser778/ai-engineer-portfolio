"""Commits files into the portfolio's GitHub repo via the Contents API --
used both for image uploads and for editing assets/data/i18n.json. Chosen
over a separate object-storage service (S3/R2) because it's free, versioned,
and the site already serves everything straight out of this same repo via
GitHub Pages, so no second storage system or billing relationship is needed.

Requires GITHUB_TOKEN (a fine-grained PAT scoped to *only* this repo, with
Contents: Read and write) and GITHUB_REPO ("owner/repo") as env vars.
"""
import base64
import datetime
import json
import os

import httpx
from fastapi import HTTPException

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_REPO = os.environ.get("GITHUB_REPO")  # e.g. "Montaser778/ai-engineer-portfolio"
GITHUB_BRANCH = os.environ.get("GITHUB_BRANCH", "main")
GITHUB_API = "https://api.github.com"


def _headers() -> dict:
    if not GITHUB_TOKEN or not GITHUB_REPO:
        raise HTTPException(
            status_code=503,
            detail="File storage is not configured (GITHUB_TOKEN/GITHUB_REPO missing).",
        )
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
    }


async def read_file(path: str) -> tuple[str, str]:
    """Returns (decoded_text_content, sha) for a file at `path` in the repo,
    or ("" , "") if it doesn't exist yet."""
    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            f"{GITHUB_API}/repos/{GITHUB_REPO}/contents/{path}",
            headers=_headers(),
            params={"ref": GITHUB_BRANCH},
        )
    if resp.status_code == 404:
        return "", ""
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"GitHub read failed for {path}: {resp.status_code}")
    data = resp.json()
    content = base64.b64decode(data["content"]).decode("utf-8")
    return content, data["sha"]


async def write_file(path: str, content_bytes: bytes, commit_message: str, sha: str | None = None) -> str:
    """Creates or updates a file at `path`. Pass the current `sha` (from
    read_file) when updating an existing file -- GitHub rejects the write
    otherwise as a conflict. Returns the new sha."""
    payload = {
        "message": commit_message,
        "content": base64.b64encode(content_bytes).decode("ascii"),
        "branch": GITHUB_BRANCH,
    }
    if sha:
        payload["sha"] = sha
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.put(
            f"{GITHUB_API}/repos/{GITHUB_REPO}/contents/{path}",
            headers=_headers(),
            json=payload,
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"GitHub write failed for {path}: {resp.status_code} {resp.text[:300]}")
    return resp.json()["content"]["sha"]


STATUS_PATH = "assets/data/status.json"


async def touch_status_updated() -> None:
    """Bumps assets/data/status.json's "updated" date to today whenever a
    dashboard action changes site content (a project, pricing, site text,
    or a homepage-section toggle) -- so the public site's "Last updated"
    line reflects real edits instead of being hand-maintained. Best-effort:
    callers should not let a failure here break the actual save."""
    raw, sha = await read_file(STATUS_PATH)
    data = json.loads(raw) if raw else {}
    data["updated"] = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    await write_file(
        STATUS_PATH,
        json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"),
        "Admin: bump status.updated",
        sha=sha,
    )


def public_url_for(path: str) -> str:
    """The URL the live GitHub Pages site will serve this path at, once the
    commit above has been picked up by Pages (usually well under a minute)."""
    domain = os.environ.get("SITE_DOMAIN", "").strip()
    if domain:
        return f"https://{domain}/{path}"
    owner, _, repo = (GITHUB_REPO or "").partition("/")
    return f"https://{owner}.github.io/{repo}/{path}" if repo else f"/{path}"
