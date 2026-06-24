import enum
from sqlalchemy import (
    Column, Integer, String, Enum, DateTime, ForeignKey, Float
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class BookingStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    ATTENDED = "ATTENDED"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)
    payment_status = Column(String(50), default="PENDING", nullable=False)
    qr_code = Column(String(1000), nullable=True)
    checked_in_at = Column(DateTime(timezone=True), nullable=True)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=True)
    booked_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")
    ticket = relationship("Ticket", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    seat = relationship("Seat", back_populates="bookings")
    refund = relationship("Refund", back_populates="booking", uselist=False, cascade="all, delete-orphan")

    @property
    def has_pending_refund(self):
        return self.refund is not None and self.refund.status.value == "PENDING"
