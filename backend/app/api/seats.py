from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.seat import Seat
from app.models.event import Event
from app.models.ticket import Ticket
from app.schemas.seat import SeatResponse, SeatReserveRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/seats", tags=["Seats"])

def check_and_release_expired_reservations(db: Session):
    """Releases seats that were reserved but not booked within the 15 min window."""
    expired_seats = db.query(Seat).filter(
        Seat.status == "RESERVED",
        Seat.reserved_until < datetime.utcnow()
    ).all()
    for seat in expired_seats:
        seat.status = "AVAILABLE"
        seat.reserved_by_id = None
        seat.reserved_until = None
    if expired_seats:
        db.commit()

@router.get("/event/{event_id}", response_model=List[SeatResponse])
def get_seats_for_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    check_and_release_expired_reservations(db)
    
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    seats = db.query(Seat).filter(Seat.event_id == event_id).all()
    
    # If no seats exist, let's auto-generate a sample grid of seats for this event!
    if not seats:
        # Determine base price
        base_ticket = db.query(Ticket).filter(Ticket.event_id == event_id).first()
        base_price = base_ticket.price if base_ticket else 25.0
        
        # Rows A-E, 8 seats per row
        rows = [
            ("A", "VIP", base_price * 1.5),
            ("B", "VIP", base_price * 1.5),
            ("C", "PREMIUM", base_price * 1.2),
            ("D", "GENERAL", base_price),
            ("E", "GENERAL", base_price),
        ]
        
        for row_name, seat_type, price in rows:
            for num in range(1, 9):
                seat = Seat(
                    event_id=event_id,
                    row=row_name,
                    number=num,
                    label=f"{row_name}{num}",
                    type=seat_type,
                    status="AVAILABLE",
                    price=price
                )
                db.add(seat)
        db.commit()
        seats = db.query(Seat).filter(Seat.event_id == event_id).all()
        
    return seats

@router.post("/reserve", response_model=SeatResponse)
def reserve_seat(
    data: SeatReserveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    check_and_release_expired_reservations(db)
    
    seat = db.query(Seat).filter(Seat.id == data.seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
        
    if seat.status == "BOOKED":
        raise HTTPException(status_code=400, detail="Seat is already booked")
        
    if seat.status == "RESERVED" and seat.reserved_by_id != current_user.id:
        # Check if expired
        if seat.reserved_until and seat.reserved_until > datetime.utcnow():
            raise HTTPException(status_code=400, detail="Seat is currently reserved by another user")
            
    # Reserve seat
    seat.status = "RESERVED"
    seat.reserved_by_id = current_user.id
    seat.reserved_until = datetime.utcnow() + timedelta(minutes=15)
    
    db.commit()
    db.refresh(seat)
    return seat

@router.delete("/{seat_id}/release", response_model=SeatResponse)
def release_seat_reservation(
    seat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
        
    if seat.status == "RESERVED":
        if seat.reserved_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="You do not own this reservation")
        seat.status = "AVAILABLE"
        seat.reserved_by_id = None
        seat.reserved_until = None
        db.commit()
        db.refresh(seat)
        
    return seat

@router.get("/event/{event_id}/available")
def get_available_seats_count(
    event_id: int,
    db: Session = Depends(get_db),
):
    check_and_release_expired_reservations(db)
    
    total = db.query(Seat).filter(Seat.event_id == event_id).count()
    available = db.query(Seat).filter(
        Seat.event_id == event_id,
        Seat.status == "AVAILABLE"
    ).count()
    
    return {
        "event_id": event_id,
        "total_seats": total,
        "available_seats": available
    }
