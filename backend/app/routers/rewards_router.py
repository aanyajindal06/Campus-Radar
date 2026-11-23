from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import RewardLedger, User, Item
from ..schemas import RewardLedgerResponse, LeaderboardUser
from ..auth import get_current_user

router = APIRouter(prefix="/rewards", tags=["Rewards"])

@router.get("/my-history", response_model=List[RewardLedgerResponse])
def get_my_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(RewardLedger).filter(
        RewardLedger.user_id == current_user.id
    ).order_by(RewardLedger.created_at.desc()).all()

@router.get("/leaderboard", response_model=List[LeaderboardUser])
def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(User).filter(
        User.role.in_(["student", "staff"]),
        User.total_points > 0
    ).order_by(User.total_points.desc()).limit(20).all()
    
    result = []
    for rank, u in enumerate(users, start=1):
        recovered_count = db.query(Item).filter(
            Item.owner_id == u.id,
            Item.type == "found",
            Item.status == "returned"
        ).count()
        
        result.append(LeaderboardUser(
            id=u.id,
            full_name=u.full_name,
            avatar_url=u.avatar_url,
            department=u.department or "Campus Member",
            total_points=u.total_points,
            badge_tier=u.badge_tier,
            recovered_count=recovered_count,
            rank=rank
        ))
    return result
