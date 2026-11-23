from sqlalchemy.orm import Session
from .models import User, RewardLedger
from .config import settings

def award_points(db: Session, user_id: int, reason: str, reference_id: str = None, custom_points: int = None, description: str = None) -> int:
    """
    Safely awards points to a user using an immutable ledger entry.
    Prevents duplicate awards for the same action and reference_id.
    Updates the user's total points and badge tier.
    """
    points_map = {
        "report_found": settings.POINTS_REPORT_FOUND,
        "item_returned": settings.POINTS_RETURN_ITEM,
        "verify_match": settings.POINTS_VERIFY_MATCH,
        "report_duplicate": settings.POINTS_REPORT_DUPLICATE
    }
    
    amount = custom_points if custom_points is not None else points_map.get(reason, 10)
    
    if reference_id:
        existing = db.query(RewardLedger).filter(
            RewardLedger.user_id == user_id,
            RewardLedger.reason == reason,
            RewardLedger.reference_id == reference_id
        ).first()
        if existing:
            return 0  # Already awarded
            
    ledger_entry = RewardLedger(
        user_id=user_id,
        points=amount,
        reason=reason,
        description=description or f"Earned {amount} pts for {reason.replace('_', ' ')}",
        reference_id=reference_id
    )
    db.add(ledger_entry)
    
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.total_points += amount
        if user.total_points >= 150:
            user.badge_tier = "Gold"
        elif user.total_points >= 50:
            user.badge_tier = "Silver"
        else:
            user.badge_tier = "Bronze"
        db.add(user)
        
    db.commit()
    return amount
