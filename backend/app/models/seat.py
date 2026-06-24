from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship      
from app.database import Base             

class Seat(Base):                                     
    __tablename__ = "seats"        

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    row = Column(String(50), nullable=False)
    number = Column(Integer, nullable=False)
    label = Column(String(50), nullable=False)
    type = Column(String(50), default="GENERAL", nullable=False) # GENERAL, VIP, PREMIUM
    status = Column(String(50), default="AVAILABLE", nullable=False) # AVAILABLE, RESERVED, BOOKED
    price = Column(Float, default=0.0, nullable=False)
    reserved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reserved_until = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    event = relationship("Event", back_populates="seats")
    reserved_by = relationship("User")
    bookings = relationship("Booking", back_populates="seat")
