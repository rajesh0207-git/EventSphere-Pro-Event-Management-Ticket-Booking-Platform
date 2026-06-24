from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.database import get_db
from app.models.user import User
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.api.deps import get_current_user
from app.utils.qr_generator import generate_booking_qr
from app.utils.notifier import create_notification
from app.models.notification import NotificationType
from app.models.event import Event

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/initiate", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def initiate_payment(
    data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find booking
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if booking.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="Booking already paid")

    # Create payment record
    payment = Payment(
        booking_id=booking.id,
        user_id=current_user.id,
        amount=booking.total_amount,
        method=data.method,
        status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.post("/confirm", response_model=PaymentResponse)
def confirm_payment(
    payment_id: int,
    success: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if payment.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Payment is already in status: {payment.status}")

    if success:
        payment.status = "SUCCESS"
        payment.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"
        payment.paid_at = datetime.utcnow()

        # Update associated booking
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if booking:
            booking.payment_status = "PAID"
            booking.status = BookingStatus.CONFIRMED
            # Generate QR Code
            booking.qr_code = generate_booking_qr(booking.id, booking.user_id, booking.event_id)

            # If booking is linked to a seat, mark seat as BOOKED
            if booking.seat_id:
                from app.models.seat import Seat
                seat = db.query(Seat).filter(Seat.id == booking.seat_id).first()
                if seat:
                    seat.status = "BOOKED"

            # Notify user: payment successful
            ev = db.query(Event).filter(Event.id == booking.event_id).first()
            if ev:
                create_notification(
                    db, current_user.id, NotificationType.BOOKING,
                    "Payment Successful 🎉",
                    f"Your payment for '{ev.title}' was successful. Your ticket is ready!"
                )
    else:
        payment.status = "FAILED"
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if booking:
            booking.payment_status = "FAILED"
            ev = db.query(Event).filter(Event.id == booking.event_id).first()
            if ev:
                create_notification(
                    db, current_user.id, NotificationType.UPDATE,
                    "Payment Failed",
                    f"Your payment for '{ev.title}' failed. Please try again."
                )

    db.commit()
    db.refresh(payment)
    return payment

@router.get("/history", response_model=list[PaymentResponse])
def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return payment
