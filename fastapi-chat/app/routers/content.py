"""Public, unauthenticated read endpoints the static site's JS fetches to
render project cards and pricing tiers -- the other half of the admin CRUD
in routers/admin.py. No auth: this is the same data the plain HTML used to
contain, just moved out of hand-edited markup and into the database.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import PricingTier, Project

router = APIRouter(prefix="/content", tags=["content"])


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
