"""Public, unauthenticated read endpoints the static site's JS fetches to
render project cards and pricing tiers -- the other half of the admin CRUD
in routers/admin.py. No auth: this is the same data the plain HTML used to
contain, just moved out of hand-edited markup and into the database.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import PricingTier, Project, SiteSetting

router = APIRouter(prefix="/content", tags=["content"])

# Every toggle the public site knows how to check, with its default when
# never explicitly set. Keep this list in sync with the checkboxes on the
# admin Site text page.
SETTING_DEFAULTS = {
    "show_hero_chip": True,
    "show_availability_banner": True,
}


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    rows = {s.key: s.value for s in db.query(SiteSetting).all()}
    return {key: rows.get(key, default) for key, default in SETTING_DEFAULTS.items()}


@router.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    items = (
        db.query(Project)
        .filter(Project.published.is_(True))
        .order_by(Project.sort_order, Project.id)
        .all()
    )
    return [
        {
            "id": i.id,
            "title": i.title,
            "description": i.description,
            "category": i.category,
            "image": i.image_path,
            "metrics": i.metrics,
            "tags": i.tags,
            "ctas": i.ctas,
        }
        for i in items
    ]


@router.get("/pricing")
def get_pricing(db: Session = Depends(get_db)):
    items = db.query(PricingTier).order_by(PricingTier.sort_order, PricingTier.id).all()
    return [
        {"id": t.id, "name": t.name, "price_usd": t.price_usd, "duration": t.duration, "features": t.features}
        for t in items
    ]
