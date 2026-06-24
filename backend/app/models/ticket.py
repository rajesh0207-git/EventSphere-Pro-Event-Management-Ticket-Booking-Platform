import enum
from sqlalchemy import (
    Column, Integer, String, Enum, DateTime, ForeignKey, Float
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class TicketType(str, enum.Enum):
    FREE = "FREE"
    PAID = "PAID"
    VIP = "VIP"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(Enum(TicketType), default=TicketType.FREE, nullable=False)
    price = Column(Float, default=0.0, nullable=False)
    quantity = Column(Integer, nullable=False)
    sold_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("Event", back_populates="tickets")
    bookings = relationship("Booking", back_populates="ticket")
