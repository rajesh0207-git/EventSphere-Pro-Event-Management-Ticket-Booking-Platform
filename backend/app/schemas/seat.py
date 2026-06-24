from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class SeatBase(BaseModel):
    row: str
    number: int
    label: str
    type: str
    price: float

class SeatResponse(SeatBase):
    id: int
    event_id: int
    status: str
    reserved_by_id: Optional[int] = None
    reserved_until: Optional[datetime] = None

    class Config:
        from_attributes = True

class SeatReserveRequest(BaseModel):
    seat_id: int
