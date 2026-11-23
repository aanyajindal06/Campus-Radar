import datetime
import uuid
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base

def generate_item_code():
    return f"CF-{datetime.datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student")  # "student", "staff", "admin"
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)
    student_id = Column(String(100), nullable=True)
    total_points = Column(Integer, default=0)
    badge_tier = Column(String(50), default="Bronze")  # "Bronze", "Silver", "Gold"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    items = relationship("Item", back_populates="owner", foreign_keys="Item.owner_id")
    claims = relationship("Claim", back_populates="claimant", foreign_keys="Claim.claimant_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    rewards = relationship("RewardLedger", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    code = Column(String(50), nullable=True)
    building = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    floors = Column(String(255), default="Ground Floor, 1st Floor, 2nd Floor")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    items = relationship("Item", back_populates="location")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    tracking_code = Column(String(50), unique=True, index=True, default=generate_item_code)
    type = Column(String(20), index=True, nullable=False)  # "lost" or "found"
    name = Column(String(255), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    description = Column(Text, nullable=False)
    
    color = Column(String(100), nullable=True)
    brand = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    weight = Column(String(50), nullable=True)
    material = Column(String(100), nullable=True)
    distinguishing_features = Column(Text, nullable=True)
    
    private_details = Column(Text, nullable=True)
    
    status = Column(String(50), index=True, default="reported")
    
    date_event = Column(String(50), nullable=False)  # YYYY-MM-DD
    time_event = Column(String(50), nullable=True)   # HH:MM
    
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    building_room = Column(String(255), nullable=True)
    storage_location = Column(String(255), nullable=True) # e.g. "Storage Locker B-14, Security Office"
    
    contact_preference = Column(String(50), default="in_app") # in_app, email, phone
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    qr_token = Column(String(100), unique=True, index=True, nullable=True)
    qr_image_url = Column(String(500), nullable=True)
    
    image_embedding = Column(Text, nullable=True)
    text_embedding = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="items", foreign_keys=[owner_id])
    location = relationship("Location", back_populates="items")
    images = relationship("ItemImage", back_populates="item", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="item", cascade="all, delete-orphan")
    qr_info = relationship("QRCode", back_populates="item", uselist=False, cascade="all, delete-orphan")


class ItemImage(Base):
    __tablename__ = "item_images"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_url = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    embedding_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    item = relationship("Item", back_populates="images")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    lost_item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    found_item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    overall_similarity = Column(Float, nullable=False)  # 0 to 100
    image_score = Column(Float, default=0.0)
    description_score = Column(Float, default=0.0)
    attribute_score = Column(Float, default=0.0)
    location_score = Column(Float, default=0.0)
    date_score = Column(Float, default=0.0)
    status = Column(String(50), default="suggested") # "suggested", "viewed", "confirmed", "dismissed"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lost_item = relationship("Item", foreign_keys=[lost_item_id])
    found_item = relationship("Item", foreign_keys=[found_item_id])


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    claimant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    proof_description = Column(Text, nullable=False)
    proof_image_url = Column(String(500), nullable=True)
    status = Column(String(50), default="pending") # "pending", "approved", "rejected", "returned"
    staff_notes = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    item = relationship("Item", back_populates="claims")
    claimant = relationship("User", back_populates="claims", foreign_keys=[claimant_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="match") # "match", "claim", "reward", "status", "system"
    link = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class RewardLedger(Base):
    __tablename__ = "rewards_ledger"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points = Column(Integer, nullable=False)
    reason = Column(String(100), nullable=False) # "report_found", "item_returned", "verify_match", "report_duplicate"
    description = Column(String(255), nullable=True)
    reference_id = Column(String(100), nullable=True) # Item tracking_code or Claim id
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="rewards")


class QRCode(Base):
    __tablename__ = "qr_codes"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    secure_token = Column(String(100), unique=True, index=True, nullable=False)
    qr_image_url = Column(String(500), nullable=False)
    scan_count = Column(Integer, default=0)
    last_scanned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    item = relationship("Item", back_populates="qr_info")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
