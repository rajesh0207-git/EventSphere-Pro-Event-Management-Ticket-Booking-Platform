import enum
from sqlalchemy import (
    Column, Integer, String, Enum, DateTime, Text, ForeignKey, Float, Boolean
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class EventType(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    HYBRID = "HYBRID"


class EventStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    event_type = Column(Enum(EventType), default=EventType.OFFLINE, nullable=False)
    location = Column(String(500), nullable=True)
    virtual_link = Column(String(500), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    capacity = Column(Integer, nullable=True)
    banner_url = Column(String(500), nullable=True)
    status = Column(Enum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    stream_url = Column(String(1000), nullable=True)
    stream_platform = Column(String(50), nullable=True) # e.g., YouTube, Zoom, Custom
    is_streaming_live = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organizer = relationship("User", back_populates="events_organized")
    category = relationship("Category", back_populates="events")
    tickets = relationship("Ticket", back_populates="event", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="event", cascade="all, delete-orphan")
    images = relationship("EventImage", back_populates="event", cascade="all, delete-orphan")
    seats = relationship("Seat", back_populates="event", cascade="all, delete-orphan")
    wishlists = relationship("Wishlist", back_populates="event", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="event", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="event", cascade="all, delete-orphan")

    @property
    def organizer_name(self) -> str:
        return self.organizer.full_name if self.organizer else "Organizer"

