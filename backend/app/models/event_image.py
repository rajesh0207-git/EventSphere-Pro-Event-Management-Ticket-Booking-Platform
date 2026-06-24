from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class EventImage(Base):
    __tablename__ = "event_images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    image_type = Column(String(50), default="gallery")  # gallery, banner, promotional
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="images")
