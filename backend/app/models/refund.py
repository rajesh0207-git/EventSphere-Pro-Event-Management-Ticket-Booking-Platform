import enum
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class RefundStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(String(500), nullable=True)
    status = Column(Enum(RefundStatus), default=RefundStatus.PENDING, nullable=False)
    admin_notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    booking = relationship("Booking", back_populates="refund")
    user = relationship("User", backref="refunds")
