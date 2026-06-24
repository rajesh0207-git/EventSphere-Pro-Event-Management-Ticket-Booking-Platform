from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.event import Event
from app.models.coupon import Coupon
from app.api.deps import require_organizer_or_admin

router = APIRouter(prefix="/api/coupons", tags=["Coupons"])

class CouponCreate(BaseModel):
    code: str
    discount_percentage: float
    max_uses: Optional[int] = None
    valid_until: Optional[datetime] = None
    event_id: Optional[int] = None

class CouponUpdate(BaseModel):
    is_active: bool

@router.get("")
def list_coupons(
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    if current_user.role == "ADMIN":
        coupons = db.query(Coupon).all()
    else:
        # Organizers can only see their event's coupons
        event_ids = [e.id for e in db.query(Event.id).filter(Event.organizer_id == current_user.id).all()]
        coupons = db.query(Coupon).filter(Coupon.event_id.in_(event_ids)).all()
        
    return [
        {
            "id": c.id,
            "code": c.code,
            "discount_percentage": c.discount_percentage,
            "max_uses": c.max_uses,
            "current_uses": c.current_uses,
            "valid_until": c.valid_until.isoformat() if c.valid_until else None,
            "event_id": c.event_id,
            "event_title": c.event.title if c.event else None,
            "is_active": c.is_active,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in coupons
    ]

@router.post("")
def create_coupon(
    data: CouponCreate,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    if data.event_id:
        event = db.query(Event).filter(Event.id == data.event_id).first()
        if not event or (event.organizer_id != current_user.id and current_user.role != "ADMIN"):
            raise HTTPException(status_code=403, detail="Cannot create coupon for this event")
            
    existing = db.query(Coupon).filter(Coupon.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(
        code=data.code,
        discount_percentage=data.discount_percentage,
        max_uses=data.max_uses,
        valid_until=data.valid_until,
        event_id=data.event_id,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon

@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    current_user: User = Depends(require_organizer_or_admin),
    db: Session = Depends(get_db),
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    if current_user.role != "ADMIN" and coupon.event_id:
        event = db.query(Event).filter(Event.id == coupon.event_id).first()
        if not event or event.organizer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    db.delete(coupon)
    db.commit()
    return {"message": "Coupon deleted successfully"}

@router.get("/validate/{code}/{event_id}")
def validate_coupon(
    code: str,
    event_id: int,
    db: Session = Depends(get_db),
):
    coupon = db.query(Coupon).filter(Coupon.code == code).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="Coupon is no longer active")
        
    if coupon.event_id and coupon.event_id != event_id:
        raise HTTPException(status_code=400, detail="Coupon is not valid for this event")
        
    if coupon.max_uses and coupon.current_uses >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
        
    if coupon.valid_until and coupon.valid_until.replace(tzinfo=None) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Coupon has expired")

    return {
        "id": coupon.id,
        "discount_percentage": coupon.discount_percentage
    }
