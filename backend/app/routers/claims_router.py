from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Claim, Item, User, AuditLog
from ..schemas import ClaimCreate, ClaimReview, ClaimResponse
from ..auth import get_current_user, require_staff
from ..rewards import award_points
from ..notifications import create_notification

router = APIRouter(prefix="/claims", tags=["Claims"])

@router.post("/", response_model=ClaimResponse)
def submit_claim(
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == claim_data.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if item.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot claim an item you reported")
        
    existing = db.query(Claim).filter(
        Claim.item_id == item.id,
        Claim.claimant_id == current_user.id,
        Claim.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active pending claim for this item")
        
    claim = Claim(
        item_id=item.id,
        claimant_id=current_user.id,
        proof_description=claim_data.proof_description,
        proof_image_url=claim_data.proof_image_url,
        status="pending"
    )
    db.add(claim)
    
    if item.status in ["reported", "stored"]:
        item.status = "claim_pending"
        
    db.commit()
    db.refresh(claim)
    
    create_notification(
        db,
        user_id=item.owner_id,
        title="Claim Submitted for Your Found Report",
        message=f"A claimant has filed an ownership claim for '{item.name}'. College staff is verifying evidence.",
        notif_type="claim",
        link=f"/items/{item.id}"
    )
    
    return claim

@router.get("/", response_model=List[ClaimResponse])
def list_claims(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Students see only their own claims.
    Staff/Admin see all campus claims for review and verification.
    """
    query = db.query(Claim).options(
        joinedload(Claim.item).joinedload(Item.images),
        joinedload(Claim.claimant),
        joinedload(Claim.reviewer)
    )
    
    if current_user.role not in ["staff", "admin"]:
        query = query.filter(Claim.claimant_id == current_user.id)
    elif status and status != "all":
        query = query.filter(Claim.status == status)
        
    query = query.order_by(Claim.created_at.desc())
    return query.all()

@router.get("/{id}", response_model=ClaimResponse)
def get_claim_details(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    claim = db.query(Claim).options(
        joinedload(Claim.item),
        joinedload(Claim.claimant),
        joinedload(Claim.reviewer)
    ).filter(Claim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    if current_user.id != claim.claimant_id and current_user.role not in ["staff", "admin"]:
        raise HTTPException(status_code=403, detail="Unauthorized to view this claim")
        
    return claim

@router.post("/{id}/review", response_model=ClaimResponse)
def review_claim(
    id: int,
    review_data: ClaimReview,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """
    Staff review & ownership verification:
    - Approve or Reject claim.
    - If status is 'returned': marks item as returned,
      awards +50 points to the finder who reported it!
    """
    claim = db.query(Claim).options(
        joinedload(Claim.item),
        joinedload(Claim.claimant)
    ).filter(Claim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    claim.status = review_data.status
    claim.staff_notes = review_data.staff_notes
    claim.reviewed_by_id = current_user.id
    claim.reviewed_at = datetime.utcnow()
    
    item = claim.item
    if review_data.status == "approved":
        item.status = "verified"
        create_notification(
            db,
            user_id=claim.claimant_id,
            title="Claim Approved!",
            message=f"Your claim for '{item.name}' has been verified by staff. Please visit {item.storage_location or 'Security Office'} with your student ID to collect it.",
            notif_type="claim",
            link=f"/items/{item.id}"
        )
    elif review_data.status == "returned":
        item.status = "returned"
        award_points(
            db,
            user_id=item.owner_id,
            reason="item_returned",
            reference_id=f"RETURN_{item.tracking_code}",
            description=f"Successfully returned item '{item.name}' to verified owner"
        )
        create_notification(
            db,
            user_id=item.owner_id,
            title="Item Returned — 50 Points Earned! 🎉",
            message=f"'{item.name}' was successfully recovered by its owner. You have been awarded +50 points!",
            notif_type="reward",
            link="/dashboard"
        )
        create_notification(
            db,
            user_id=claim.claimant_id,
            title="Item Handover Complete",
            message=f"Return confirmation complete for '{item.name}'. Thank you for using CampusRadar!",
            notif_type="claim",
            link=f"/items/{item.id}"
        )
    elif review_data.status == "rejected":
        item.status = "stored" if item.storage_location else "reported"
        create_notification(
            db,
            user_id=claim.claimant_id,
            title="Claim Status: Verification Incomplete",
            message=f"Your claim for '{item.name}' could not be verified with the provided details. Staff notes: {review_data.staff_notes or 'Insufficient proof'}.",
            notif_type="claim",
            link=f"/items/{item.id}"
        )
        
    audit = AuditLog(
        user_id=current_user.id,
        action=f"CLAIM_{review_data.status.upper()}",
        details=f"Staff {current_user.full_name} reviewed claim #{claim.id} for item {item.tracking_code} as {review_data.status}"
    )
    db.add(audit)
    db.commit()
    db.refresh(claim)
    return claim
