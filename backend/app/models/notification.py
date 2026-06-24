import enum
from sqlalchemy import (
    Column, Integer, String, Enum, DateTime, ForeignKey, Boolean, Text
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    BOOKING = "BOOKING"
    REMINDER = "REMINDER"
    UPDATE = "UPDATE"
    SYSTEM = "SYSTEM"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.SYSTEM, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")
