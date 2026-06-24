from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.models.booking import Booking, BookingStatus
from app.models.refund import Refund, RefundStatus
from app.api.deps import get_current_user, require_organizer_or_admin
from app.utils.notifier import create_notification
from app.models.notification import NotificationType

router = APIRouter(prefix="/api/refunds", tags=["Refunds"])

class RefundCreate(BaseModel):
    booking_id: int
    reason: str

class RefundUpdate(BaseModel):
    status: RefundStatus
    admin_notes: Optional[str] = None


@router.get("")
def list_refunds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role.value == "ADMIN":
        # Admins see all refunds
        refunds = db.query(Refund).all()
    elif current_user.role.value == "ORGANIZER":
        # Organizers see refunds for their events
        event_ids = [e[0] for e in db.query(Event.id).filter(Event.organizer_id == current_user.id).all()]
        booking_ids = [b[0] for b in db.query(Booking.id).filter(Booking.event_id.in_(event_ids)).all()]
        if booking_ids:
            refunds = db.query(Refund).filter(Refund.booking_id.in_(booking_ids)).all()
        else:
            refunds = []
    else:
        # Regular users see their own refunds
        refunds = db.query(Refund).filter(Refund.user_id == current_user.id).all()
        
    result = []
    for r in refunds:
        event = r.booking.event if r.booking else None
        result.append({
            "id": r.id,
            "booking_id": r.booking_id,
            "user_id": r.user_id,
            "user_name": r.user.full_name if r.user else "Unknown",
            "event_id": event.id if event else None,
            "event_title": event.title if event else "Unknown",
            "amount": r.amount,
            "reason": r.reason,
            "status": r.status,
            "admin_notes": r.admin_notes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
def request_refund(
    data: RefundCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
        
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to request refund for this booking")
        
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking is already cancelled")
        
    if booking.payment_status != "PAID":
        # If payment wasn't completed, they don't need a refund, they can just cancel
        raise HTTPException(status_code=400, detail="Only paid bookings can be refunded. Please cancel the booking instead.")
        
    existing_refund = db.query(Refund).filter(Refund.booking_id == data.booking_id).first()
    if existing_refund:
        raise HTTPException(status_code=400, detail=f"A refund request already exists with status: {existing_refund.status}")

    refund = Refund(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=booking.total_amount,
        reason=data.reason,
        status=RefundStatus.PENDING
    )
    db.add(refund)
    db.commit()
    db.refresh(refund)
    
    # Notify Organizer
    event = db.query(Event).filter(Event.id == booking.event_id).first()
    if event:
        create_notification(
            db, event.organizer_id, NotificationType.UPDATE,
            "New Refund Request",
            f"User {current_user.full_name} requested a refund for '{event.title}'."
        )

    return refund

@router.put("/{refund_id}")
def process_refund(
    refund_id: int,
    data: RefundUpdate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    refund = db.query(Refund).filter(Refund.id == refund_id).first()
    if not refund:
        raise HTTPException(status_code=404, detail="Refund request not found")

    if current_user.role.value != "ADMIN":
        # Verify organizer owns the event
        booking = db.query(Booking).filter(Booking.id == refund.booking_id).first()
        event = db.query(Event).filter(Event.id == booking.event_id).first() if booking else None
        if not event or event.organizer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    refund.status = data.status
    if data.admin_notes:
        refund.admin_notes = data.admin_notes
        
    if data.status == RefundStatus.APPROVED:
        # Cancel the booking
        booking = db.query(Booking).filter(Booking.id == refund.booking_id).first()
        if booking:
            booking.status = BookingStatus.CANCELLED
            booking.payment_status = "REFUNDED"
            
            # Restore ticket availability
            if booking.ticket:
                booking.ticket.sold_count -= booking.quantity
                
            # Free up the seat if one was selected
            if booking.seat:
                booking.seat.status = "AVAILABLE"
                booking.seat.reserved_by_id = None
                booking.seat.reserved_until = None
            
    db.commit()
    db.refresh(refund)
    
    # Notify User
    event_title = refund.booking.event.title if refund.booking and refund.booking.event else "an event"
    create_notification(
        db, refund.user_id, NotificationType.UPDATE,
        f"Refund Request {data.status.name.capitalize()}",
        f"Your refund request for '{event_title}' has been {data.status.name.lower()}."
    )

    return refund
