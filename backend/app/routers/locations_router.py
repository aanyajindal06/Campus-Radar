from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Location
from ..schemas import LocationResponse, LocationCreate
from ..auth import require_admin

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("/", response_model=List[LocationResponse])
def get_locations(db: Session = Depends(get_db)):
    return db.query(Location).filter(Location.is_active == True).order_by(Location.name.asc()).all()

@router.post("/", response_model=LocationResponse)
def create_location(
    loc_data: LocationCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    loc = Location(
        name=loc_data.name,
        code=loc_data.code,
        building=loc_data.building,
        latitude=loc_data.latitude,
        longitude=loc_data.longitude,
        description=loc_data.description,
        floors=loc_data.floors
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc

@router.put("/{id}", response_model=LocationResponse)
def update_location(
    id: int,
    loc_data: LocationCreate,
    current_user = Depends(require_admin),
    db: Session = Depends(get_db)
):
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
        
    loc.name = loc_data.name
    loc.code = loc_data.code
    loc.building = loc_data.building
    loc.latitude = loc_data.latitude
    loc.longitude = loc_data.longitude
    loc.description = loc_data.description
    loc.floors = loc_data.floors
    db.commit()
    db.refresh(loc)
    return loc
