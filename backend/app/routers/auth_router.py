from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, UserResponse, UserUpdate, Token
from ..auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this college email already exists.")
    
    hashed_pwd = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role or "student",
        hashed_password=hashed_pwd,
        department=user_data.department,
        student_id=user_data.student_id,
        phone=user_data.phone,
        badge_tier="Bronze",
        total_points=0
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/demo-login/{role}", response_model=Token)
def demo_login(role: str, db: Session = Depends(get_db)):
    """
    Convenience endpoint for fast evaluation: switch instantly between demo Student, Staff, and Admin
    """
    role_email_map = {
        "student": "aarav.sharma@abes.ac.in",
        "staff": "vikram.security@abes.ac.in",
        "admin": "admin.director@abes.ac.in"
    }
    target_email = role_email_map.get(role.lower())
    if not target_email:
        raise HTTPException(status_code=400, detail="Invalid demo role. Choose student, staff, or admin.")
        
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        user = db.query(User).filter(User.role == role.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user not found. Please ensure database is seeded.")
        
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_me(update_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.phone is not None:
        current_user.phone = update_data.phone
    if update_data.department is not None:
        current_user.department = update_data.department
    if update_data.student_id is not None:
        current_user.student_id = update_data.student_id
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user
