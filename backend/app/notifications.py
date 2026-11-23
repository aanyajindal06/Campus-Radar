from sqlalchemy.orm import Session
from .models import Notification, User

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str = "system",
    link: str = None
) -> Notification:
    """
    Creates an in-app notification and dispatches mock background email.
    """
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        link=link,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    
    user = db.query(User).filter(User.id == user_id).first()
    recipient_email = user.email if user else f"user_{user_id}@college.edu"
    print(f"\n📧 [CAMPUSRADAR EMAIL DISPATCH] To: {recipient_email}")
    print(f"   Subject: {title}")
    print(f"   Body: {message}")
    if link:
        print(f"   Action Link: {link}")
    print("-" * 50)
    
    return notif
