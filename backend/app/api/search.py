from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.event import Event, EventStatus
from app.schemas.event import EventResponse

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("", response_model=list[EventResponse])
def search_events(
    q: Optional[str] = Query(None, description="Search keyword"),
    category_id: Optional[int] = Query(None, description="Category ID"),
    event_type: Optional[str] = Query(None, description="ONLINE, OFFLINE, HYBRID"),
    location: Optional[str] = Query(None, description="Location keyword"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(Event.status == EventStatus.PUBLISHED)

    if q:
        keyword = f"%{q}%"
        query = query.filter(
            or_(
                Event.title.ilike(keyword),
                Event.description.ilike(keyword),
            )
        )

    if category_id:
        query = query.filter(Event.category_id == category_id)

    if event_type:
        query = query.filter(Event.event_type == event_type.upper())

    if location:
        query = query.filter(Event.location.ilike(f"%{location}%"))

    if start_date:
        query = query.filter(Event.start_time >= start_date)

    if end_date:
        query = query.filter(Event.end_time <= end_date)

    return query.all()
