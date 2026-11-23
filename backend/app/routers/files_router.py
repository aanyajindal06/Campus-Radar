from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import StoredFile, Item
from ..qr_service import render_qr_png

router = APIRouter(tags=["Files"])
CACHE = {"Cache-Control": "public, max-age=31536000, immutable"}


@router.get("/files/{file_id}")
def get_file(file_id: int, db: Session = Depends(get_db)):
    f = db.query(StoredFile).filter(StoredFile.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=f.data, media_type=f.content_type, headers=CACHE)


@router.get("/qr/{tracking_code}/{token}.png")
def get_qr(tracking_code: str, token: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.tracking_code == tracking_code, Item.qr_token == token).first()
    if not item:
        raise HTTPException(status_code=404, detail="QR code not found")
    return Response(content=render_qr_png(tracking_code, token), media_type="image/png", headers=CACHE)
