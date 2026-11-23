import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text

from .config import settings
from .database import engine, Base, get_db
from .seed_data import seed_database
from .routers import (
    auth_router,
    items_router,
    search_router,
    claims_router,
    locations_router,
    rewards_router,
    notifications_router,
    admin_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    on_startup()
    try:
        yield
    finally:
        engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart Lost & Found Management System for Colleges with AI Visual Search, Hybrid Matching, Campus Location Mapping, and QR Code Staff Verification."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/static/qrcodes", StaticFiles(directory=settings.QR_DIR), name="qrcodes")

app.include_router(auth_router.router, prefix=settings.API_V1_STR)
app.include_router(items_router.router, prefix=settings.API_V1_STR)
app.include_router(search_router.router, prefix=settings.API_V1_STR)
app.include_router(claims_router.router, prefix=settings.API_V1_STR)
app.include_router(locations_router.router, prefix=settings.API_V1_STR)
app.include_router(rewards_router.router, prefix=settings.API_V1_STR)
app.include_router(notifications_router.router, prefix=settings.API_V1_STR)
app.include_router(admin_router.router, prefix=settings.API_V1_STR)

def on_startup():
    Base.metadata.create_all(bind=engine)
    
    db = Session(bind=engine)
    try:
        seed_database(db)
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health": "operational",
        "description": "Smart College Lost & Found Management Platform"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail="Database unavailable") from e
