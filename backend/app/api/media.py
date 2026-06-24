import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.models.event_image import EventImage
from app.api.deps import get_current_user, require_organizer_or_admin

router = APIRouter(prefix="/api/events", tags=["Event Media"])


@router.post("/{event_id}/banner", response_model=dict)
async def upload_banner(
    event_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "events")
    os.makedirs(upload_dir, exist_ok=True)

    file_extension = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    banner_url = f"/uploads/events/{filename}"
    event.banner_url = banner_url

    # Also save as EventImage record
    image = EventImage(event_id=event_id, image_url=banner_url, image_type="banner")
    db.add(image)
    db.commit()

    return {"message": "Banner uploaded", "banner_url": banner_url}


@router.post("/{event_id}/gallery", response_model=dict)
async def upload_gallery_image(
    event_id: int,
    file: UploadFile = File(...),
    image_type: str = "gallery",
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed")

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "events")
    os.makedirs(upload_dir, exist_ok=True)

    file_extension = file.filename.split(".")[-1] if file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    image_url = f"/uploads/events/{filename}"
    image = EventImage(event_id=event_id, image_url=image_url, image_type=image_type)
    db.add(image)
    db.commit()

    return {"message": "Image uploaded", "image_url": image_url, "image_type": image_type}


@router.get("/{event_id}/images")
def get_event_images(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    images = db.query(EventImage).filter(EventImage.event_id == event_id).all()
    return [
        {"id": img.id, "image_url": img.image_url, "image_type": img.image_type, "created_at": img.created_at.isoformat() if img.created_at else None}
        for img in images
    ]


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    image_id: int,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    image = db.query(EventImage).filter(EventImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    event = db.query(Event).filter(Event.id == image.event_id).first()
    if event.organizer_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")

    # If it's the banner, clear the event banner_url
    if image.image_type == "banner":
        event.banner_url = None

    db.delete(image)
    db.commit()
