import json
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from ..database import get_db
from ..models import Item
from ..schemas import ItemResponse, MatchResult, ScoreBreakdown
from ..ai_matcher import extract_image_vector, cosine_similarity, compute_text_similarity

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/text", response_model=List[ItemResponse])
def search_items(
    q: Optional[str] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    color: Optional[str] = None,
    brand: Optional[str] = None,
    location_id: Optional[int] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "recent",  # recent, location, category
    db: Session = Depends(get_db)
):
    query = db.query(Item).options(
        joinedload(Item.images),
        joinedload(Item.location),
        joinedload(Item.owner)
    )
    
    if type and type != "all":
        query = query.filter(Item.type == type.lower())
    if category and category != "all":
        query = query.filter(Item.category == category)
    if status and status != "all":
        query = query.filter(Item.status == status)
    if location_id:
        query = query.filter(Item.location_id == location_id)
    if color and color != "all":
        query = query.filter(Item.color.ilike(f"%{color}%"))
    if brand and brand != "all":
        query = query.filter(Item.brand.ilike(f"%{brand}%"))
        
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Item.name.ilike(term),
                Item.description.ilike(term),
                Item.category.ilike(term),
                Item.brand.ilike(term),
                Item.model.ilike(term),
                Item.distinguishing_features.ilike(term),
                Item.building_room.ilike(term)
            )
        )
        
    if sort_by == "recent":
        query = query.order_by(Item.created_at.desc())
    elif sort_by == "location":
        query = query.order_by(Item.location_id.asc(), Item.created_at.desc())
        
    return query.limit(50).all()

@router.post("/image", response_model=List[MatchResult])
async def search_by_image(
    image: UploadFile = File(...),
    type: Optional[str] = Form("found"),
    category: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    AI-Powered Visual Search:
    Takes an uploaded image (drag-and-drop, camera photo, device gallery),
    extracts the 128-dimensional perceptual feature vector,
    and runs cosine similarity against stored found items in the database.
    Ranks items with visual similarity scores and percentages.
    """
    content = await image.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty image uploaded")
        
    query_vector = extract_image_vector(content)
    
    target_type = type.lower() if type else "found"
    items_query = db.query(Item).options(
        joinedload(Item.images),
        joinedload(Item.location),
        joinedload(Item.owner)
    ).filter(Item.type == target_type)
    
    if category and category.lower() != "all":
        items_query = items_query.filter(Item.category == category)
        
    candidates = items_query.all()
    results = []
    
    for item in candidates:
        if not item.image_embedding:
            continue
        try:
            item_vec = json.loads(item.image_embedding)
            sim = cosine_similarity(query_vector, item_vec)
            
            image_pct = round(sim * 100.0, 1)
            
            results.append({
                "item": item,
                "scores": ScoreBreakdown(
                    image_score=image_pct,
                    description_score=70.0, # baseline
                    attribute_score=75.0,
                    location_score=70.0,
                    date_score=80.0,
                    overall_similarity=image_pct
                ),
                "status": "visual_match"
            })
        except Exception:
            continue
            
    results.sort(key=lambda r: r["scores"].image_score, reverse=True)
    return results[:20]
