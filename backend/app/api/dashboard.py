from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User, UserRole
from app.models.event import Event, EventStatus
from app.models.booking import Booking, BookingStatus
from app.models.ticket import Ticket
from app.api.deps import require_organizer_or_admin, require_admin, get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/organizer")
def organizer_dashboard(
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    # Total events
    total_events = db.query(Event).filter(Event.organizer_id == current_user.id).count()
    published_events = db.query(Event).filter(
        Event.organizer_id == current_user.id,
        Event.status == EventStatus.PUBLISHED,
    ).count()
    draft_events = db.query(Event).filter(
        Event.organizer_id == current_user.id,
        Event.status == EventStatus.DRAFT,
    ).count()

    # Total bookings for organizer's events
    event_ids = [e.id for e in db.query(Event.id).filter(Event.organizer_id == current_user.id).all()]
    total_bookings = db.query(Booking).filter(
        Booking.event_id.in_(event_ids),
        Booking.status != BookingStatus.CANCELLED,
    ).count() if event_ids else 0

    # Total revenue
    total_revenue = db.query(func.coalesce(func.sum(Booking.total_amount), 0)).filter(
        Booking.event_id.in_(event_ids),
        Booking.status != BookingStatus.CANCELLED,
    ).scalar() if event_ids else 0

    # Recent bookings
    recent_bookings = []
    if event_ids:
        bookings = (
            db.query(Booking)
            .filter(Booking.event_id.in_(event_ids), Booking.status != BookingStatus.CANCELLED)
            .order_by(Booking.booked_at.desc())
            .limit(5)
            .all()
        )
        recent_bookings = [
            {
                "id": b.id,
                "event_id": b.event_id,
                "user_id": b.user_id,
                "quantity": b.quantity,
                "total_amount": b.total_amount,
                "booked_at": b.booked_at.isoformat() if b.booked_at else None,
            }
            for b in bookings
        ]

    return {
        "total_events": total_events,
        "published_events": published_events,
        "draft_events": draft_events,
        "total_bookings": total_bookings,
        "total_revenue": float(total_revenue or 0),
        "recent_bookings": recent_bookings,
    }


@router.get("/admin/organizers")
def list_organizers(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    organizers = db.query(User).filter(User.role == UserRole.ORGANIZER).all()
    return [
        {
            "id": o.id,
            "full_name": o.full_name,
            "email": o.email,
            "is_verified": o.is_verified,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        }
        for o in organizers
    ]


@router.put("/admin/organizers/{user_id}/verify")
def verify_organizer(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    organizer = db.query(User).filter(User.id == user_id, User.role == UserRole.ORGANIZER).first()
    if not organizer:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Organizer not found")

    organizer.is_verified = True
    db.commit()
    return {"message": f"Organizer '{organizer.full_name}' verified successfully"}


@router.put("/admin/organizers/{user_id}/unverify")
def unverify_organizer(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    organizer = db.query(User).filter(User.id == user_id, User.role == UserRole.ORGANIZER).first()
    if not organizer:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Organizer not found")

    organizer.is_verified = False
    db.commit()
    return {"message": f"Organizer '{organizer.full_name}' verification removed"}


@router.get("/organizer/events-breakdown")
def organizer_events_breakdown(
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    """Per-event sales breakdown for the organizer dashboard charts."""
    events = db.query(Event).filter(Event.organizer_id == current_user.id).all()
    result = []
    for e in events:
        bookings = db.query(Booking).filter(
            Booking.event_id == e.id,
            Booking.status != BookingStatus.CANCELLED,
        ).all()
        revenue = sum(b.total_amount for b in bookings)
        result.append({
            "event_id": e.id,
            "title": e.title,
            "status": e.status,
            "total_bookings": len(bookings),
            "revenue": float(revenue),
        })
    return result


@router.get("/event/{event_id}/analytics")
def event_analytics(
    event_id: int,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    """Detailed analytics for a single event (for the Event Analytics page)."""
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.organizer_id == current_user.id,
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found or access denied")

    # Ticket breakdown by ticket type
    tickets = db.query(Ticket).filter(Ticket.event_id == event_id).all()
    ticket_breakdown = []
    for t in tickets:
        sold = db.query(func.coalesce(func.sum(Booking.quantity), 0)).filter(
            Booking.ticket_id == t.id,
            Booking.status != BookingStatus.CANCELLED,
        ).scalar()
        revenue = db.query(func.coalesce(func.sum(Booking.total_amount), 0)).filter(
            Booking.ticket_id == t.id,
            Booking.status != BookingStatus.CANCELLED,
        ).scalar()
        ticket_breakdown.append({
            "ticket_id": t.id,
            "name": t.name,
            "type": t.type,
            "price": t.price,
            "quantity": t.quantity,
            "sold": int(sold or 0),
            "revenue": float(revenue or 0),
            "available": t.quantity - int(sold or 0),
        })

    # Bookings over time (last 30 days grouped by date)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_bookings_raw = (
        db.query(
            func.date(Booking.booked_at).label("date"),
            func.count(Booking.id).label("bookings"),
            func.coalesce(func.sum(Booking.total_amount), 0).label("revenue"),
        )
        .filter(
            Booking.event_id == event_id,
            Booking.status != BookingStatus.CANCELLED,
            Booking.booked_at >= thirty_days_ago,
        )
        .group_by(func.date(Booking.booked_at))
        .order_by(func.date(Booking.booked_at))
        .all()
    )
    daily_bookings = [
        {"date": str(r.date), "bookings": r.bookings, "revenue": float(r.revenue)}
        for r in daily_bookings_raw
    ]

    # Totals
    total_bookings = db.query(Booking).filter(
        Booking.event_id == event_id,
        Booking.status != BookingStatus.CANCELLED,
    ).count()
    attended = db.query(Booking).filter(
        Booking.event_id == event_id,
        Booking.checked_in_at != None,
    ).count()
    total_revenue = db.query(func.coalesce(func.sum(Booking.total_amount), 0)).filter(
        Booking.event_id == event_id,
        Booking.status != BookingStatus.CANCELLED,
    ).scalar()

    return {
        "event_id": event.id,
        "title": event.title,
        "status": event.status,
        "start_time": event.start_time.isoformat() if event.start_time else None,
        "capacity": event.capacity,
        "total_bookings": total_bookings,
        "total_attended": attended,
        "total_revenue": float(total_revenue or 0),
        "ticket_breakdown": ticket_breakdown,
        "daily_bookings": daily_bookings,
    }
