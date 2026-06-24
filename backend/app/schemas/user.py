from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserProfileResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
