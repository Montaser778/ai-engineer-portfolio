"""One-time seed of the three featured project cards currently hand-written
in projects.html, so switching that page to fetch-render from /content/
projects doesn't blank it out on first deploy. Runs once on startup, only
when the projects table is empty -- never overwrites anything an admin has
since edited or added.
"""
from app.db import SessionLocal
from app.models import Project

SEED_PROJECTS = [
    {
        "title": "Muhawir — voice interview practice",
        "description": (
            "A bilingual real-time voice agent that runs mock interviews end to end and "
            "scores them after the call, keeping evaluation out of the conversation loop."
        ),
        "category": "voice,agents",
        "metrics": [
            {"value": "800", "suffix": "ms", "label": "Turn latency"},
            {"value": "2", "suffix": "", "label": "Languages"},
        ],
        "tags": ["Pipecat", "WebRTC", "FastAPI"],
        "ctas": [
            {"label": "Case study", "href": "project-muhawir.html", "external": False},
            {"label": "Live demo", "href": "https://muhawir.fly.dev/", "external": True},
        ],
        "sort_order": 0,
    },
    {
        "title": "Exam Integrity System",
        "description": (
            "An original Moodle plugin that watches an online exam attempt through four "
            "independent, locally-analysed signals — camera never leaves the student's "
            "browser, no video ever uploaded — merged into one 0–100 review score for a "
            "human reviewer, never an automated verdict."
        ),
        "category": "agents,backend",
        "metrics": [
            {"value": "4", "suffix": "", "label": "Independent signals"},
            {"value": "0", "suffix": "", "label": "Video uploaded"},
        ],
        "tags": ["Moodle plugin (PHP)", "FastAPI", "scikit-learn"],
        "ctas": [
            {"label": "Live demo", "href": "https://exam-integrity-ai-service.onrender.com", "external": True},
            {
                "label": "Request a full live walkthrough",
                "href": "mailto:eng.7montaser@gmail.com?subject=Exam%20Integrity%20System%20—%20live%20demo%20request",
                "external": True,
            },
        ],
        "sort_order": 1,
    },
    {
        "title": "Multi-agent business idea analyst",
        "description": (
            "Four specialised agents — research, analysis, risk, writing — run in "
            "parallel and reconcile conflicting findings into a single recommendation."
        ),
        "category": "agents",
        "metrics": [
            {"value": "4", "suffix": "", "label": "Agents"},
            {"value": "1", "suffix": "", "label": "Synthesis pass"},
        ],
        "tags": ["LangChain", "Python"],
        "ctas": [{"label": "Read the case study", "href": "project-agents.html", "external": False}],
        "sort_order": 2,
    },
]


def seed_projects_if_empty():
    db = SessionLocal()
    try:
        if db.query(Project).count() > 0:
            return
        for data in SEED_PROJECTS:
            db.add(Project(**data, image_path="", published=True))
        db.commit()
    finally:
        db.close()
