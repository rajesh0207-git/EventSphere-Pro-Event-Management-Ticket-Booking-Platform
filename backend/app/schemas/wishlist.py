from datetime import datetime
from pydantic import BaseModel
from app.schemas.event import EventResponse

class WishlistCreate(BaseModel):
    event_id: int

class WishlistResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    created_at: datetime
    event: EventResponse

    class Config:
        from_attributes = True
