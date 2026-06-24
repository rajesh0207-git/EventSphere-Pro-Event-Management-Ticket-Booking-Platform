from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

# --- Sponsor Schemas ---
class SponsorBase(BaseModel):
    company_name: str
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class SponsorCreate(SponsorBase):
    pass

class SponsorUpdate(BaseModel):
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class SponsorResponse(SponsorBase):
    id: int
    user_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Sponsor Package Schemas ---
class SponsorPackageBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    max_sponsors: Optional[int] = None

class SponsorPackageCreate(SponsorPackageBase):
    event_id: int

class SponsorPackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    max_sponsors: Optional[int] = None

class SponsorPackageResponse(SponsorPackageBase):
    id: int
    event_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Sponsorship Schemas ---
class SponsorshipBase(BaseModel):
    status: str = "PENDING"
    payment_status: str = "PENDING"

class SponsorshipCreate(BaseModel):
    package_id: int
    sponsor_id: int
    event_id: int

class SponsorshipUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None

class SponsorshipResponse(SponsorshipBase):
    id: int
    package_id: int
    sponsor_id: int
    event_id: int
    created_at: datetime
    
    # Optional nested details
    sponsor: Optional[SponsorResponse] = None
    package: Optional[SponsorPackageResponse] = None

    class Config:
        from_attributes = True
