from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.event import Event, EventStatus
from app.models.booking import Booking, BookingStatus
from app.schemas.event import (
    EventCreate, EventUpdate, EventResponse, EventListResponse,
)
from app.api.deps import get_current_user, require_organizer_or_admin, require_admin
from app.utils.audit import log_audit

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(Event.status == EventStatus.PUBLISHED)
    total = query.count()
    events = query.offset((page - 1) * per_page).limit(per_page).all()
    return EventListResponse(items=events, total=total, page=page, per_page=per_page)


@router.get("/organizer/my-events", response_model=list[EventResponse])
def list_my_events(current_user: User = Depends(require_organizer_or_admin), db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.organizer_id == current_user.id).all()
    return events


@router.get("/featured", response_model=EventListResponse)
def featured_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(6, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Event).filter(Event.status == EventStatus.PUBLISHED, Event.is_featured == True)
    total = query.count()
    events = query.order_by(Event.start_time.asc()).offset((page - 1) * per_page).limit(per_page).all()
    return EventListResponse(items=events, total=total, page=page, per_page=per_page)


@router.get("/trending", response_model=EventListResponse)
def trending_events(
    limit: int = Query(6, ge=1, le=50),
    db: Session = Depends(get_db),
):
    # Trending = published events with the most confirmed bookings
    events = (
        db.query(Event, func.count(Booking.id).label("booking_count"))
        .join(Booking, Event.id == Booking.event_id, isouter=True)
        .filter(
            Event.status == EventStatus.PUBLISHED,
            Booking.status != BookingStatus.CANCELLED,
        )
        .group_by(Event.id)
        .order_by(func.count(Booking.id).desc())
        .limit(limit)
        .all()
    )
    event_list = [e for e, _ in events]
    return EventListResponse(items=event_list, total=len(event_list), page=1, per_page=limit)


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    data: EventCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = Event(
        title=data.title,
        description=data.description,
        organizer_id=current_user.id,
        category_id=data.category_id,
        event_type=data.event_type,
        location=data.location,
        virtual_link=data.virtual_link,
        stream_url=data.stream_url,
        stream_platform=data.stream_platform,
        start_time=data.start_time,
        end_time=data.end_time,
        capacity=data.capacity,
        status=data.status,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    log_audit(db, action="CREATE_EVENT", user_id=current_user.id, resource_type="EVENT", resource_id=event.id, details=f"Created event {event.title}")

    return event


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    data: EventUpdate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to update this event")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")

    db.delete(event)
    db.commit()


@router.post("/{event_id}/publish", response_model=EventResponse)
def publish_event(
    event_id: int,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    event.status = EventStatus.PUBLISHED
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}/toggle-featured")
def toggle_featured(
    event_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.is_featured = not event.is_featured
    db.commit()
    return {"message": f"Event featured: {event.is_featured}"}


@router.put("/{event_id}/toggle-stream", response_model=EventResponse)
def toggle_stream(
    event_id: int,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    event.is_streaming_live = not event.is_streaming_live
    db.commit()
    db.refresh(event)
    return event
