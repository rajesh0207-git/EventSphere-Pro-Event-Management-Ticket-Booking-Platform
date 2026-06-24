from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.models.booking import Booking, BookingStatus
from app.api.deps import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

@router.get("/dashboard")
def admin_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Overall metrics
    total_users = db.query(User).count()
    total_events = db.query(Event).count()
    
    total_bookings = db.query(Booking).filter(
        Booking.status != BookingStatus.CANCELLED
    ).count()

    total_revenue = db.query(func.coalesce(func.sum(Booking.total_amount), 0)).filter(
        Booking.status != BookingStatus.CANCELLED
    ).scalar()

    # Recent bookings
    recent_bookings = []
    bookings = (
        db.query(Booking)
        .filter(Booking.status != BookingStatus.CANCELLED)
        .order_by(Booking.booked_at.desc())
        .limit(5)
        .all()
    )
    for b in bookings:
        recent_bookings.append({
            "id": b.id,
            "event_id": b.event_id,
            "user_id": b.user_id,
            "quantity": b.quantity,
            "total_amount": float(b.total_amount),
            "booked_at": b.booked_at.isoformat() if b.booked_at else None,
        })

    # Users breakdown by role
    roles_breakdown = (
        db.query(User.role, func.count(User.id))
        .group_by(User.role)
        .all()
    )
    roles = {str(getattr(role, 'value', role)): count for role, count in roles_breakdown}

    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_bookings": total_bookings,
        "total_revenue": float(total_revenue or 0),
        "recent_bookings": recent_bookings,
        "roles_breakdown": roles,
    }

@router.get("/bi-dashboard")
def admin_bi_dashboard(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # Top 5 Popular Events by Booking Count
    popular_events = (
        db.query(Event.title, func.count(Booking.id).label("booking_count"))
        .join(Booking, Booking.event_id == Event.id)
        .filter(Booking.status != BookingStatus.CANCELLED)
        .group_by(Event.id, Event.title)
        .order_by(func.count(Booking.id).desc())
        .limit(5)
        .all()
    )
    popular_events_data = [{"name": title, "bookings": count} for title, count in popular_events]

    # Top 5 Organizers by Revenue
    top_organizers = (
        db.query(User.email, func.coalesce(func.sum(Booking.total_amount), 0).label("revenue"))
        .join(Event, Event.organizer_id == User.id)
        .join(Booking, Booking.event_id == Event.id)
        .filter(Booking.status != BookingStatus.CANCELLED)
        .group_by(User.id, User.email)
        .order_by(func.coalesce(func.sum(Booking.total_amount), 0).desc())
        .limit(5)
        .all()
    )
    top_organizers_data = [{"name": email, "revenue": float(rev)} for email, rev in top_organizers]

    # Booking & Revenue Trends (Group by date)
    # Using SQLite date function for simplicity, works with Postgres date() too usually
    trends = (
        db.query(
            func.date(Booking.booked_at).label("date"),
            func.count(Booking.id).label("bookings"),
            func.sum(Booking.total_amount).label("revenue")
        )
        .filter(Booking.status != BookingStatus.CANCELLED)
        .group_by(func.date(Booking.booked_at))
        .order_by(func.date(Booking.booked_at).asc())
        .limit(30)
        .all()
    )
    
    trends_data = [
        {"date": str(date), "bookings": bookings, "revenue": float(revenue or 0)} 
        for date, bookings, revenue in trends
    ]

    return {
        "popular_events": popular_events_data,
        "top_organizers": top_organizers_data,
        "trends": trends_data
    }
