from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class PaymentCreate(BaseModel):
    booking_id: int
    method: str = "CARD"

class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    amount: float
    method: str
    status: str
    transaction_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
