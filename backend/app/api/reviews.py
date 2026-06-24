from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, field_validator

from app.database import get_db
from app.models.user import User
from app.models.review import Review
from app.models.booking import Booking, BookingStatus
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


class ReviewCreate(BaseModel):
    rating: float
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if not (1.0 <= v <= 5.0):
            raise ValueError("Rating must be between 1 and 5")
        return round(v, 1)


@router.get("/event/{event_id}")
def get_event_reviews(
    event_id: int,
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .filter(Review.event_id == event_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.event_id == event_id).scalar()

    return {
        "average_rating": round(float(avg_rating), 2) if avg_rating else 0.0,
        "total_reviews": len(reviews),
        "reviews": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "user_name": r.user.full_name if r.user else "Anonymous",
                "profile_picture_url": r.user.profile_picture_url if r.user else None,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reviews
        ],
    }


@router.post("/event/{event_id}")
def create_review(
    event_id: int,
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check if the user has already reviewed this event
    existing = db.query(Review).filter(
        Review.event_id == event_id,
        Review.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this event")

    # Check if user attended (has a booking)
    has_booking = db.query(Booking).filter(
        Booking.event_id == event_id,
        Booking.user_id == current_user.id,
        Booking.status != BookingStatus.CANCELLED,
    ).first()
    if not has_booking:
        raise HTTPException(
            status_code=403,
            detail="Only attendees who have booked this event can leave a review"
        )

    review = Review(
        event_id=event_id,
        user_id=current_user.id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return {
        "id": review.id,
        "user_id": review.user_id,
        "event_id": review.event_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.user_id == current_user.id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found or not yours")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted"}
