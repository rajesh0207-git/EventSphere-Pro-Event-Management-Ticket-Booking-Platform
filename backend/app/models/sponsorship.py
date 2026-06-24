from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Linked user account
    company_name = Column(String(255), nullable=False)
    logo_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
    sponsorships = relationship("Sponsorship", back_populates="sponsor", cascade="all, delete-orphan")


class SponsorPackage(Base):
    __tablename__ = "sponsor_packages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String(255), nullable=False) # e.g., Gold, Silver, Platinum
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    max_sponsors = Column(Integer, nullable=True) # None means unlimited
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("Event")
    sponsorships = relationship("Sponsorship", back_populates="package", cascade="all, delete-orphan")


class Sponsorship(Base):
    __tablename__ = "sponsorships"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    package_id = Column(Integer, ForeignKey("sponsor_packages.id"), nullable=False)
    sponsor_id = Column(Integer, ForeignKey("sponsors.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    payment_status = Column(String(50), default="PENDING", nullable=False) # PENDING, PAID
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    package = relationship("SponsorPackage", back_populates="sponsorships")
    sponsor = relationship("Sponsor", back_populates="sponsorships")
    event = relationship("Event")
