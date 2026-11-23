import io
import qrcode
from .config import settings


def render_qr_png(item_tracking_code: str, secure_token: str) -> bytes:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
    qr.add_data(f"CAMPUSFIND-ITEM:{item_tracking_code}:{secure_token}")
    qr.make(fit=True)
    buf = io.BytesIO()
    qr.make_image(fill_color="#1E3A8A", back_color="white").save(buf, format="PNG")
    return buf.getvalue()


def generate_qr_for_item(item_tracking_code: str, secure_token: str) -> str:
    """QR images are rendered on demand, so nothing is written to local disk."""
    return f"{settings.API_V1_STR}/qr/{item_tracking_code}/{secure_token}.png"
