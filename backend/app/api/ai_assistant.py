from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.event import Event, EventStatus
from app.models.booking import Booking
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.get("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Mock AI Recommendations logic based on past bookings
    past_bookings = db.query(Booking).filter(Booking.user_id == current_user.id).all()
    past_category_ids = [b.event.category_id for b in past_bookings if b.event and b.event.category_id]
    
    # If they have history, recommend events from the same categories
    if past_category_ids:
        recommended = db.query(Event).filter(
            Event.status == EventStatus.PUBLISHED,
            Event.category_id.in_(past_category_ids)
        ).limit(6).all()
    else:
        # Otherwise recommend featured/trending
        recommended = db.query(Event).filter(
            Event.status == EventStatus.PUBLISHED,
            Event.is_featured == True
        ).limit(6).all()
        
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "banner_url": e.banner_url,
            "start_time": e.start_time.isoformat() if e.start_time else None,
            "event_type": e.event_type.value if hasattr(e.event_type, 'value') else e.event_type,
            "location": e.location
        }
        for e in recommended
    ]

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    msg = request.message.lower()
    response = "I'm your AI Event Assistant! I can help you find events, check refund policies, and more."
    
    # Basic keyword-based mock responses
    if "refund" in msg:
        response = "You can request a refund for any confirmed booking by going to 'My Bookings' and clicking 'Request Refund'. Note that it requires approval."
    elif "create event" in msg or "host" in msg:
        response = "To host an event, you need to register as an Organizer and use the Organizer Dashboard to create and manage your events."
    elif "discount" in msg or "coupon" in msg:
        response = "Organizers can create discount coupons for their events. If you have a promo code, you can apply it during checkout!"
    elif "live" in msg or "stream" in msg:
        response = "For Online and Hybrid events, you can join the live stream directly from the Event Details page once you have a confirmed ticket."
    elif "ticket" in msg:
        response = "After purchasing a ticket, you'll receive a digital QR code which you can view in 'My Bookings'."
    
    return {"response": response}
