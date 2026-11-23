from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "student"
    department: Optional[str] = None
    student_id: Optional[str] = None
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    student_id: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    student_id: Optional[str] = None
    total_points: int
    badge_tier: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    name: str
    code: Optional[str] = None
    building: str
    latitude: float
    longitude: float
    description: Optional[str] = None
    floors: Optional[str] = "Ground Floor, 1st Floor, 2nd Floor"

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ItemImageResponse(BaseModel):
    id: int
    file_url: str
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ItemBase(BaseModel):
    type: str  # "lost" or "found"
    name: str
    category: str
    description: str
    color: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    weight: Optional[str] = None
    material: Optional[str] = None
    distinguishing_features: Optional[str] = None
    date_event: str
    time_event: Optional[str] = None
    location_id: Optional[int] = None
    building_room: Optional[str] = None
    storage_location: Optional[str] = None
    contact_preference: Optional[str] = "in_app"

class ItemCreate(ItemBase):
    private_details: Optional[str] = None  # Hidden identifying proof for found items

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    status: Optional[str] = None
    storage_location: Optional[str] = None
    building_room: Optional[str] = None

class ItemResponse(ItemBase):
    id: int
    tracking_code: str
    status: str
    owner_id: int
    qr_token: Optional[str] = None
    qr_image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    images: List[ItemImageResponse] = []
    location: Optional[LocationResponse] = None
    owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class ItemDetailResponse(ItemResponse):
    private_details: Optional[str] = None  # Included only for finder or authorized staff

class ScoreBreakdown(BaseModel):
    image_score: float
    description_score: float
    attribute_score: float
    location_score: float
    date_score: float
    overall_similarity: float

class MatchResult(BaseModel):
    item: ItemResponse
    scores: ScoreBreakdown
    status: str

class ClaimCreate(BaseModel):
    item_id: int
    proof_description: str
    proof_image_url: Optional[str] = None

class ClaimReview(BaseModel):
    status: str  # "approved", "rejected", "returned"
    staff_notes: Optional[str] = None

class ClaimResponse(BaseModel):
    id: int
    item_id: int
    claimant_id: int
    proof_description: str
    proof_image_url: Optional[str] = None
    status: str
    staff_notes: Optional[str] = None
    reviewed_by_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    item: Optional[ItemResponse] = None
    claimant: Optional[UserResponse] = None
    reviewer: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class RewardLedgerResponse(BaseModel):
    id: int
    points: int
    reason: str
    description: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LeaderboardUser(BaseModel):
    id: int
    full_name: str
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    total_points: int
    badge_tier: str
    recovered_count: int = 0
    rank: int = 0

class AdminStats(BaseModel):
    total_users: int
    total_lost_reports: int
    total_found_reports: int
    successful_recoveries: int
    pending_claims: int
    active_reports: int
    reward_points_issued: int
    recovery_rate: float
    category_distribution: Dict[str, int]
    location_distribution: Dict[str, int]
