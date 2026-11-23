from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import User, Item, Claim, Location, RewardLedger, AuditLog
from ..schemas import AdminStats, UserResponse
from ..auth import require_admin, require_staff

router = APIRouter(prefix="/admin", tags=["Admin & Analytics"])

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(current_user: User = Depends(require_staff), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_lost = db.query(Item).filter(Item.type == "lost").count()
    total_found = db.query(Item).filter(Item.type == "found").count()
    successful_recoveries = db.query(Item).filter(Item.status == "returned").count()
    pending_claims = db.query(Claim).filter(Claim.status == "pending").count()
    active_reports = db.query(Item).filter(Item.status.in_(["reported", "stored", "claim_pending"])).count()
    
    reward_points_sum = db.query(func.sum(RewardLedger.points)).scalar() or 0
    recovery_rate = round((successful_recoveries / total_lost * 100.0), 1) if total_lost > 0 else 0.0
    
    cat_counts = db.query(Item.category, func.count(Item.id)).group_by(Item.category).all()
    category_distribution = {cat: count for cat, count in cat_counts if cat}
    
    loc_counts = db.query(Location.name, func.count(Item.id)).join(Item, Item.location_id == Location.id).group_by(Location.name).all()
    location_distribution = {loc: count for loc, count in loc_counts if loc}
    
    return AdminStats(
        total_users=total_users,
        total_lost_reports=total_lost,
        total_found_reports=total_found,
        successful_recoveries=successful_recoveries,
        pending_claims=pending_claims,
        active_reports=active_reports,
        reward_points_issued=int(reward_points_sum),
        recovery_rate=recovery_rate,
        category_distribution=category_distribution,
        location_distribution=location_distribution
    )

@router.get("/heatmap")
def get_heatmap_data(db: Session = Depends(get_db)):
    """
    Returns geographical coordinates and weighted item frequency
    for rendering the Campus Lost & Found Heatmap layer on Leaflet.
    """
    locations = db.query(Location).filter(Location.is_active == True).all()
    heatmap_points = []
    
    for loc in locations:
        lost_count = db.query(Item).filter(
            Item.location_id == loc.id,
            Item.type == "lost"
        ).count()
        found_count = db.query(Item).filter(
            Item.location_id == loc.id,
            Item.type == "found"
        ).count()
        total = lost_count + found_count
        
        intensity = min(1.0, max(0.2, total * 0.15))
        heatmap_points.append({
            "location_id": loc.id,
            "name": loc.name,
            "building": loc.building,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "lost_count": lost_count,
            "found_count": found_count,
            "total_items": total,
            "intensity": intensity
        })
        
    return heatmap_points

@router.get("/users", response_model=List[UserResponse])
def get_all_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.asc()).all()

@router.get("/audit-logs")
def get_audit_logs(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
