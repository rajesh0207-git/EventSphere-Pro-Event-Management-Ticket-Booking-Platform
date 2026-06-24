from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    event_type: str = "OFFLINE"
    location: Optional[str] = None
    virtual_link: Optional[str] = None
    stream_url: Optional[str] = None
    stream_platform: Optional[str] = None
    start_time: datetime
    end_time: datetime
    capacity: Optional[int] = None
    status: str = "DRAFT"


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    event_type: Optional[str] = None
    location: Optional[str] = None
    virtual_link: Optional[str] = None
    stream_url: Optional[str] = None
    stream_platform: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    capacity: Optional[int] = None
    status: Optional[str] = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    organizer_id: int
    organizer_name: Optional[str] = None
    category_id: Optional[int] = None
    event_type: str
    location: Optional[str] = None
    virtual_link: Optional[str] = None
    stream_url: Optional[str] = None
    stream_platform: Optional[str] = None
    is_streaming_live: bool = False
    start_time: datetime
    end_time: datetime
    capacity: Optional[int] = None
    banner_url: Optional[str] = None
    status: str
    is_featured: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True



class EventListResponse(BaseModel):
    items: List[EventResponse]
    total: int
    page: int
    per_page: int
