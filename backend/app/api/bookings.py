from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.event import Event, EventStatus
from app.models.ticket import Ticket
from app.models.booking import Booking, BookingStatus
from app.models.seat import Seat
from app.models.coupon import Coupon
from app.schemas.booking import BookingCreate, BookingResponse
from app.api.deps import get_current_user
from app.utils.qr_generator import generate_booking_qr
from app.utils.notifier import create_notification
from app.models.notification import NotificationType

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate event
    event = db.query(Event).filter(Event.id == data.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != EventStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Event is not available for booking")

    # Validate ticket
    ticket = db.query(Ticket).filter(Ticket.id == data.ticket_id, Ticket.event_id == data.event_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found for this event")

    # Check availability
    available = ticket.quantity - ticket.sold_count
    if data.quantity > available:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available} tickets available",
        )

    # Check capacity
    if event.capacity:
        total_booked = db.query(Booking).filter(
            Booking.event_id == data.event_id,
            Booking.status != BookingStatus.CANCELLED,
        ).count()
        if total_booked + data.quantity > event.capacity:
            raise HTTPException(status_code=400, detail="Event capacity exceeded")

    # Validate and handle seat selection
    seat = None
    if data.seat_id:
        seat = db.query(Seat).filter(Seat.id == data.seat_id, Seat.event_id == data.event_id).first()
        if not seat:
            raise HTTPException(status_code=404, detail="Seat not found for this event")
        if seat.status == "BOOKED":
            raise HTTPException(status_code=400, detail="Seat is already booked")
        if seat.status == "RESERVED" and seat.reserved_by_id != current_user.id:
            if seat.reserved_until and seat.reserved_until > datetime.utcnow():
                raise HTTPException(status_code=400, detail="Seat is reserved by another user")

    # Validate coupon if provided
    discount_amount = 0.0
    if data.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == data.coupon_code).first()
        if not coupon:
            raise HTTPException(status_code=400, detail="Invalid coupon code")
        if not coupon.is_active:
            raise HTTPException(status_code=400, detail="Coupon is inactive")
        if coupon.event_id and coupon.event_id != data.event_id:
            raise HTTPException(status_code=400, detail="Coupon not valid for this event")
        if coupon.max_uses and coupon.current_uses >= coupon.max_uses:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")
        if coupon.valid_until and coupon.valid_until.replace(tzinfo=None) < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Coupon has expired")
        
        discount_amount = (ticket.price * data.quantity) * (coupon.discount_percentage / 100.0)
        coupon.current_uses += 1

    total_amount = (ticket.price * data.quantity) - discount_amount
    if total_amount < 0:
        total_amount = 0.0

    # Create booking
    booking = Booking(
        user_id=current_user.id,
        event_id=data.event_id,
        ticket_id=data.ticket_id,
        quantity=data.quantity,
        total_amount=total_amount,
        discount_amount=discount_amount,
        seat_id=data.seat_id,
    )
    ticket.sold_count += data.quantity

    # If seat was selected, lock it down
    if seat:
        if total_amount == 0:
            seat.status = "BOOKED"
        else:
            seat.status = "RESERVED"
            seat.reserved_by_id = current_user.id
            seat.reserved_until = datetime.utcnow() + timedelta(minutes=15)

    db.add(booking)
    db.commit()
    db.refresh(booking)

    # If it is a free event, auto-confirm and generate QR code
    if total_amount == 0:
        booking.payment_status = "FREE"
        booking.status = BookingStatus.CONFIRMED
        booking.qr_code = generate_booking_qr(booking.id, booking.user_id, booking.event_id)
        db.commit()
        db.refresh(booking)
        # Notify user: booking confirmed
        create_notification(
            db, current_user.id, NotificationType.BOOKING,
            "Booking Confirmed! 🎉",
            f"Your booking for '{event.title}' has been confirmed. Enjoy the event!"
        )
        db.commit()
    else:
        booking.payment_status = "PENDING"
        db.commit()
        db.refresh(booking)
        # Notify user: payment pending
        create_notification(
            db, current_user.id, NotificationType.BOOKING,
            "Booking Created – Payment Pending",
            f"Your booking for '{event.title}' is reserved. Complete your payment to confirm."
        )
        db.commit()

    return booking


@router.get("/my-bookings", response_model=list[BookingResponse])
def list_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Booking).filter(Booking.user_id == current_user.id).all()


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking already cancelled")

    booking.status = BookingStatus.CANCELLED

    # Restore ticket count
    ticket = db.query(Ticket).filter(Ticket.id == booking.ticket_id).first()
    if ticket:
        ticket.sold_count -= booking.quantity

    # Notify user: booking cancelled
    event = db.query(Event).filter(Event.id == booking.event_id).first()
    if event:
        create_notification(
            db, current_user.id, NotificationType.UPDATE,
            "Booking Cancelled",
            f"Your booking for '{event.title}' has been cancelled."
        )

    db.commit()
