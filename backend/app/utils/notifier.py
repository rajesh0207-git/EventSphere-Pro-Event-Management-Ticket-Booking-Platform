from app.models.notification import Notification, NotificationType
from sqlalchemy.orm import Session


def create_notification(db: Session, user_id: int, type: NotificationType, title: str, message: str):
    """Helper to create a notification for a user."""
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
    )
    db.add(notif)
    # caller is responsible for db.commit()
