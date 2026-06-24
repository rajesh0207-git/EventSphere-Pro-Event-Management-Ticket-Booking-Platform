from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.event import Event
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/checkin", tags=["Event Check-In"])

class CheckInRequest(BaseModel):
    qr_code_data: str

@router.post("/scan")
def scan_qr_checkin(
    data: CheckInRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Parse QR code data format: eventsphere_booking_{booking_id}_{user_id}_{event_id}
    parts = data.qr_code_data.split("_")
    if len(parts) != 5 or parts[0] != "eventsphere" or parts[1] != "booking":
        raise HTTPException(status_code=400, detail="Invalid QR Code format")

    try:
        booking_id = int(parts[2])
        user_id = int(parts[3])
        event_id = int(parts[4])
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid data in QR Code")

    # Fetch booking
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Fetch event to check organizer permissions
    event = db.query(Event).filter(Event.id == booking.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Associated event not found")

    # Verification: Must be organizer or admin
    if event.organizer_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="You do not have permission to check-in attendees for this event")

    # Validate booking details against QR content
    if booking.user_id != user_id or booking.event_id != event_id:
        raise HTTPException(status_code=400, detail="QR Code details do not match booking records")

    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Ticket has been cancelled")

    if booking.checked_in_at is not None:
        return {
            "status": "ALREADY_CHECKED_IN",
            "message": "Attendee has already checked in",
            "attendee_name": booking.user.full_name,
            "checked_in_at": booking.checked_in_at,
            "event_title": event.title,
        }

    # Perform Check-In
    booking.checked_in_at = datetime.utcnow()
    booking.status = BookingStatus.ATTENDED
    db.commit()

    return {
        "status": "SUCCESS",
        "message": "Check-In successful",
        "attendee_name": booking.user.full_name,
        "checked_in_at": booking.checked_in_at,
        "event_title": event.title,
        "ticket_type": booking.ticket.name if booking.ticket else "General"
    }

@router.get("/event/{event_id}/attendance")
def get_event_attendance(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to view this event's attendance")

    bookings = db.query(Booking).filter(Booking.event_id == event_id).all()
    
    attendance_list = []
    for b in bookings:
        attendance_list.append({
            "booking_id": b.id,
            "attendee_name": b.user.full_name,
            "email": b.user.email,
            "ticket_name": b.ticket.name,
            "quantity": b.quantity,
            "status": b.status.value,
            "checked_in_at": b.checked_in_at,
        })
    return attendance_list

@router.get("/event/{event_id}/stats")
def get_event_attendance_stats(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    total_bookings = db.query(Booking).filter(
        Booking.event_id == event_id,
        Booking.status != BookingStatus.CANCELLED
    ).count()

    checked_in = db.query(Booking).filter(
        Booking.event_id == event_id,
        Booking.checked_in_at.isnot(None)
    ).count()

    attendance_percentage = (checked_in / total_bookings * 100) if total_bookings > 0 else 0

    return {
        "total_booked": total_bookings,
        "checked_in": checked_in,
        "attendance_percentage": round(attendance_percentage, 2)
    }
