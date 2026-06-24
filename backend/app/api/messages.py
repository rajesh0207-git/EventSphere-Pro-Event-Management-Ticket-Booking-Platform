from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.message import Message
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/messages", tags=["Messages"])


class MessageCreate(BaseModel):
    content: str
    event_id: Optional[int] = None


@router.get("/conversations")
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find all users the current user has messaged or received messages from
    messages = db.query(Message).filter(
        or_(Message.sender_id == current_user.id, Message.receiver_id == current_user.id)
    ).order_by(Message.created_at.desc()).all()

    conversations = {}
    for m in messages:
        other_user = m.receiver if m.sender_id == current_user.id else m.sender
        if not other_user:
            continue
        
        if other_user.id not in conversations:
            conversations[other_user.id] = {
                "user_id": other_user.id,
                "full_name": other_user.full_name,
                "email": other_user.email,
                "profile_picture_url": other_user.profile_picture_url,
                "last_message": m.content,
                "last_message_at": m.created_at.isoformat() if m.created_at else None,
                "unread_count": 0
            }

        
        if m.receiver_id == current_user.id and not m.is_read:
            conversations[other_user.id]["unread_count"] += 1

    return list(conversations.values())


@router.get("/{user_id}")
def get_chat_history(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Mark messages as read
    db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).all()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@router.post("/{user_id}")
def send_message(
    user_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    receiver = db.query(User).filter(User.id == user_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")

    new_msg = Message(
        sender_id=current_user.id,
        receiver_id=user_id,
        content=data.content,
        event_id=data.event_id
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    return {
        "id": new_msg.id,
        "sender_id": new_msg.sender_id,
        "receiver_id": new_msg.receiver_id,
        "content": new_msg.content,
        "is_read": new_msg.is_read,
        "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None,
    }
