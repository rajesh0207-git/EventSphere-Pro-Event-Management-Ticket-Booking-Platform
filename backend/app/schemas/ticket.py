from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TicketCreate(BaseModel):
    name: str
    type: str = "FREE"
    price: float = 0.0
    quantity: int


class TicketUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None


class TicketResponse(BaseModel):
    id: int
    event_id: int
    name: str
    type: str
    price: float
    quantity: int
    sold_count: int
    created_at: datetime

    class Config:
        from_attributes = True
