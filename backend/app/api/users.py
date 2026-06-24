import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserProfileResponse, UserProfileUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.bio is not None:
        current_user.bio = data.bio

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/profile-picture", response_model=dict)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are allowed",
        )

    # Create uploads directory
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "profiles")
    os.makedirs(upload_dir, exist_ok=True)

    # Save file
    file_extension = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Update user
    current_user.profile_picture_url = f"/uploads/profiles/{filename}"
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile picture uploaded successfully",
        "profile_picture_url": current_user.profile_picture_url,
    }
