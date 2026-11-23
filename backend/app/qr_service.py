import os
import uuid
import qrcode
from .config import settings

def generate_qr_for_item(item_tracking_code: str, secure_token: str) -> str:
    """
    Generates a high-resolution QR code containing a secure lookup payload/URL.
    Saves it to the QR directory and returns the relative URL path.
    """
    os.makedirs(settings.QR_DIR, exist_ok=True)
    
    qr_data = f"CAMPUSFIND-ITEM:{item_tracking_code}:{secure_token}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1E3A8A", back_color="white")  # Royal blue QR on white
    file_name = f"qr_{item_tracking_code}_{secure_token[:8]}.png"
    file_path = os.path.join(settings.QR_DIR, file_name)
    img.save(file_path)
    
    return f"/static/qrcodes/{file_name}"
