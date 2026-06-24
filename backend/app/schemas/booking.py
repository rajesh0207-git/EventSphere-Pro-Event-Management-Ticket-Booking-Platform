from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BookingCreate(BaseModel):
    event_id: int
    ticket_id: int
    quantity: int = 1
    seat_id: Optional[int] = None
    coupon_code: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    ticket_id: int
    quantity: int
    total_amount: float
    discount_amount: float
    status: str
    payment_status: str
    qr_code: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    seat_id: Optional[int] = None
    booked_at: datetime
    has_pending_refund: Optional[bool] = False

    class Config:
        from_attributes = True
