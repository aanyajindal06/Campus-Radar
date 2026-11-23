import os
import uuid
import json
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Item, ItemImage, Location, User, Match, QRCode
from ..schemas import ItemResponse, ItemDetailResponse, ItemCreate, ItemUpdate, MatchResult, ScoreBreakdown
from ..auth import get_current_user, get_current_user_optional, require_staff
from ..config import settings
from ..ai_matcher import extract_image_vector, calculate_hybrid_match
from ..qr_service import generate_qr_for_item
from ..rewards import award_points
from ..notifications import create_notification

router = APIRouter(prefix="/items", tags=["Items"])

@router.post("/", response_model=ItemDetailResponse)
async def create_item(
    type: str = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    color: Optional[str] = Form(None),
    brand: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    weight: Optional[str] = Form(None),
    material: Optional[str] = Form(None),
    distinguishing_features: Optional[str] = Form(None),
    private_details: Optional[str] = Form(None),
    date_event: str = Form(...),
    time_event: Optional[str] = Form(None),
    location_id: Optional[int] = Form(None),
    building_room: Optional[str] = Form(None),
    storage_location: Optional[str] = Form(None),
    contact_preference: Optional[str] = Form("in_app"),
    images: List[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Report a Lost or Found item.
    - Generates unique tracking code
    - Saves uploaded images & extracts AI visual embeddings
    - Generates secure QR code for found items
    - Awards 10 reward points to finder for found items
    - Runs hybrid similarity search against existing counterpart items & alerts users of matches!
    """
    tracking_code = f"CF-2026-{uuid.uuid4().hex[:6].upper()}"
    
    qr_token = None
    qr_image_url = None
    if type.lower() == "found":
        qr_token = f"tok_{uuid.uuid4().hex}"
        qr_image_url = generate_qr_for_item(tracking_code, qr_token)
    
    initial_status = "stored" if (type.lower() == "found" and storage_location) else "reported"
    
    new_item = Item(
        tracking_code=tracking_code,
        type=type.lower(),
        name=name,
        category=category,
        description=description,
        color=color,
        brand=brand,
        model=model,
        weight=weight,
        material=material,
        distinguishing_features=distinguishing_features,
        private_details=private_details,
        status=initial_status,
        date_event=date_event,
        time_event=time_event,
        location_id=location_id,
        building_room=building_room,
        storage_location=storage_location,
        contact_preference=contact_preference,
        owner_id=current_user.id,
        qr_token=qr_token,
        qr_image_url=qr_image_url
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    if qr_token:
        qr_obj = QRCode(
            item_id=new_item.id,
            secure_token=qr_token,
            qr_image_url=qr_image_url
        )
        db.add(qr_obj)
        db.commit()

    primary_vector = None
    for idx, img_file in enumerate(images):
        if not img_file.filename:
            continue
        content = await img_file.read()
        if len(content) == 0:
            continue
            
        ext = os.path.splitext(img_file.filename)[1].lower() or ".jpg"
        unique_filename = f"item_{new_item.id}_{idx}_{uuid.uuid4().hex[:8]}{ext}"
        save_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        with open(save_path, "wb") as f:
            f.write(content)
            
        vector = extract_image_vector(content)
        if primary_vector is None:
            primary_vector = vector
            
        file_url = f"/static/uploads/{unique_filename}"
        img_record = ItemImage(
            item_id=new_item.id,
            file_path=save_path,
            file_url=file_url,
            is_primary=(idx == 0),
            embedding_json=json.dumps(vector)
        )
        db.add(img_record)

    if primary_vector:
        new_item.image_embedding = json.dumps(primary_vector)
        db.commit()
        db.refresh(new_item)

    if type.lower() == "found":
        award_points(
            db,
            user_id=current_user.id,
            reason="report_found",
            reference_id=new_item.tracking_code,
            description=f"Reported found item '{new_item.name}'"
        )
        create_notification(
            db,
            user_id=current_user.id,
            title="Reward Points Earned!",
            message=f"You earned +10 points for reporting found item '{new_item.name}'. Thank you for helping our campus community!",
            notif_type="reward",
            link=f"/items/{new_item.id}"
        )

    target_type = "found" if new_item.type == "lost" else "lost"
    counterparts = db.query(Item).filter(
        Item.type == target_type,
        Item.status.in_(["reported", "stored", "claim_pending"])
    ).all()
    
    new_item_dict = {
        "name": new_item.name,
        "description": new_item.description,
        "category": new_item.category,
        "color": new_item.color,
        "brand": new_item.brand,
        "model": new_item.model,
        "weight": new_item.weight,
        "material": new_item.material,
        "distinguishing_features": new_item.distinguishing_features,
        "date_event": new_item.date_event,
        "image_embedding": new_item.image_embedding,
        "location": {
            "id": new_item.location.id if new_item.location else None,
            "building": new_item.location.building if new_item.location else "",
            "latitude": new_item.location.latitude if new_item.location else None,
            "longitude": new_item.location.longitude if new_item.location else None,
        } if new_item.location else None
    }
    
    for c in counterparts:
        c_dict = {
            "name": c.name,
            "description": c.description,
            "category": c.category,
            "color": c.color,
            "brand": c.brand,
            "model": c.model,
            "weight": c.weight,
            "material": c.material,
            "distinguishing_features": c.distinguishing_features,
            "date_event": c.date_event,
            "image_embedding": c.image_embedding,
            "location": {
                "id": c.location.id if c.location else None,
                "building": c.location.building if c.location else "",
                "latitude": c.location.latitude if c.location else None,
                "longitude": c.location.longitude if c.location else None,
            } if c.location else None
        }
        
        lost_d = new_item_dict if new_item.type == "lost" else c_dict
        found_d = c_dict if new_item.type == "lost" else new_item_dict
        scores = calculate_hybrid_match(lost_d, found_d)
        
        if scores["overall_similarity"] >= 50.0:
            lost_id = new_item.id if new_item.type == "lost" else c.id
            found_id = c.id if new_item.type == "lost" else new_item.id
            
            match_entry = Match(
                lost_item_id=lost_id,
                found_item_id=found_id,
                overall_similarity=scores["overall_similarity"],
                image_score=scores["image_score"],
                description_score=scores["description_score"],
                attribute_score=scores["attribute_score"],
                location_score=scores["location_score"],
                date_score=scores["date_score"],
                status="suggested"
            )
            db.add(match_entry)
            
            if scores["overall_similarity"] >= 65.0:
                owner_to_notify = new_item.owner_id if new_item.type == "lost" else c.owner_id
                matched_item_name = c.name if new_item.type == "lost" else new_item.name
                create_notification(
                    db,
                    user_id=owner_to_notify,
                    title="High-Confidence Match Discovered!",
                    message=f"A found item '{matched_item_name}' matches your lost report with {scores['overall_similarity']}% similarity. Click to review details and claim.",
                    notif_type="match",
                    link=f"/items/{found_id}"
                )
    db.commit()
    db.refresh(new_item)
    return new_item

@router.get("/", response_model=List[ItemResponse])
def get_items(
    type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    location_id: Optional[int] = None,
    color: Optional[str] = None,
    brand: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Item).options(
        joinedload(Item.images),
        joinedload(Item.location),
        joinedload(Item.owner)
    )
    if type:
        query = query.filter(Item.type == type.lower())
    if category and category != "All":
        query = query.filter(Item.category == category)
    if status and status != "All":
        query = query.filter(Item.status == status)
    if location_id:
        query = query.filter(Item.location_id == location_id)
    if color:
        query = query.filter(Item.color.ilike(f"%{color}%"))
    if brand:
        query = query.filter(Item.brand.ilike(f"%{brand}%"))
        
    query = query.order_by(Item.created_at.desc())
    items = query.offset(offset).limit(limit).all()
    return items

@router.get("/{id}", response_model=ItemDetailResponse)
def get_item(
    id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    item = db.query(Item).options(
        joinedload(Item.images),
        joinedload(Item.location),
        joinedload(Item.owner)
    ).filter(Item.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    is_authorized = current_user and (
        current_user.id == item.owner_id or current_user.role in ["staff", "admin"]
    )
    if not is_authorized:
        item.private_details = None

    return item

@router.patch("/{id}", response_model=ItemDetailResponse)
def update_item(
    id: int,
    item_update: ItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    if current_user.id != item.owner_id and current_user.role not in ["staff", "admin"]:
        raise HTTPException(status_code=403, detail="Permission denied")
        
    for key, val in item_update.model_dump(exclude_unset=True).items():
        setattr(item, key, val)
        
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id}")
def delete_item(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if current_user.id != item.owner_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    
    item.status = "archived"
    db.commit()
    return {"message": "Report archived successfully"}

@router.get("/{id}/matches", response_model=List[MatchResult])
def get_item_matches(id: int, db: Session = Depends(get_db)):
    """
    Returns dynamically computed hybrid matches with a full 5-component breakdown:
    Image similarity (40%), Description (25%), Attributes (15%), Location (10%), Date (10%)
    """
    target = db.query(Item).options(joinedload(Item.location)).filter(Item.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Item not found")
        
    counterpart_type = "found" if target.type == "lost" else "lost"
    candidates = db.query(Item).options(
        joinedload(Item.images),
        joinedload(Item.location),
        joinedload(Item.owner)
    ).filter(
        Item.type == counterpart_type,
        Item.status.in_(["reported", "stored", "claim_pending"])
    ).all()
    
    target_dict = {
        "name": target.name,
        "description": target.description,
        "category": target.category,
        "color": target.color,
        "brand": target.brand,
        "model": target.model,
        "weight": target.weight,
        "material": target.material,
        "distinguishing_features": target.distinguishing_features,
        "date_event": target.date_event,
        "image_embedding": target.image_embedding,
        "location": {
            "id": target.location.id if target.location else None,
            "building": target.location.building if target.location else "",
            "latitude": target.location.latitude if target.location else None,
            "longitude": target.location.longitude if target.location else None,
        } if target.location else None
    }
    
    results = []
    for cand in candidates:
        cand_dict = {
            "name": cand.name,
            "description": cand.description,
            "category": cand.category,
            "color": cand.color,
            "brand": cand.brand,
            "model": cand.model,
            "weight": cand.weight,
            "material": cand.material,
            "distinguishing_features": cand.distinguishing_features,
            "date_event": cand.date_event,
            "image_embedding": cand.image_embedding,
            "location": {
                "id": cand.location.id if cand.location else None,
                "building": cand.location.building if cand.location else "",
                "latitude": cand.location.latitude if cand.location else None,
                "longitude": cand.location.longitude if cand.location else None,
            } if cand.location else None
        }
        
        lost_d = target_dict if target.type == "lost" else cand_dict
        found_d = cand_dict if target.type == "lost" else target_dict
        breakdown = calculate_hybrid_match(lost_d, found_d)
        
        results.append({
            "item": cand,
            "scores": ScoreBreakdown(
                image_score=breakdown["image_score"],
                description_score=breakdown["description_score"],
                attribute_score=breakdown["attribute_score"],
                location_score=breakdown["location_score"],
                date_score=breakdown["date_score"],
                overall_similarity=breakdown["overall_similarity"]
            ),
            "status": "suggested"
        })
        
    results.sort(key=lambda r: r["scores"].overall_similarity, reverse=True)
    return results[:15]

@router.get("/qr-lookup/{token}", response_model=ItemDetailResponse)
def lookup_by_qr_token(token: str, current_user: User = Depends(require_staff), db: Session = Depends(get_db)):
    """
    Staff-authenticated lookup via scanned QR token.
    Increments scan count on the QR code.
    """
    qr_record = db.query(QRCode).filter(QRCode.secure_token == token).first()
    if not qr_record:
        item = db.query(Item).filter(Item.tracking_code == token).first()
        if not item:
            raise HTTPException(status_code=404, detail="Invalid QR code or token")
    else:
        qr_record.scan_count += 1
        qr_record.last_scanned_at = datetime.utcnow()
        db.commit()
        item = qr_record.item
        
    return item
