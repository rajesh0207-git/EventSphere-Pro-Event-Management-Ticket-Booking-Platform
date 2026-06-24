from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    discount_percentage = Column(Float, nullable=False) # e.g., 10 for 10%
    max_uses = Column(Integer, nullable=True) # None means unlimited
    current_uses = Column(Integer, default=0, nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True) # None means global coupon
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("Event", backref="coupons")
