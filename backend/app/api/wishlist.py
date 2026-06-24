from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.wishlist import Wishlist
from app.models.event import Event
from app.schemas.wishlist import WishlistCreate, WishlistResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

@router.post("", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    data: WishlistCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if event exists
    event = db.query(Event).filter(Event.id == data.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    wishlist_item = Wishlist(user_id=current_user.id, event_id=data.event_id)
    db.add(wishlist_item)
    try:
        db.commit()
        db.refresh(wishlist_item)
    except IntegrityError:
        db.rollback()
        # Item already wishlisted, just fetch it
        wishlist_item = db.query(Wishlist).filter(
            Wishlist.user_id == current_user.id,
            Wishlist.event_id == data.event_id
        ).first()
        
    return wishlist_item

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wishlist_item = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.event_id == event_id
    ).first()
    
    if not wishlist_item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
        
    db.delete(wishlist_item)
    db.commit()
    return None

@router.get("", response_model=List[WishlistResponse])
def get_my_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Wishlist).filter(Wishlist.user_id == current_user.id).all()

@router.get("/check/{event_id}")
def check_wishlist_status(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exists = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.event_id == event_id
    ).first() is not None
    
    return {"is_wishlisted": exists}
