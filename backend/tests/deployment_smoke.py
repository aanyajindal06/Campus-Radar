"""Run from backend: python tests/deployment_smoke.py (requires httpx)."""
import os
import sys
import tempfile
from io import BytesIO
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def main():
    from PIL import Image
    from fastapi.testclient import TestClient

    with tempfile.TemporaryDirectory(prefix="campusradar-deploy-test-") as temp:
        os.environ.update(
            DATABASE_URL="sqlite:///" + (Path(temp) / "test.db").as_posix(),
            UPLOAD_DIR=str(Path(temp) / "uploads"),
            QR_DIR=str(Path(temp) / "qrcodes"),
            SECRET_KEY="test-only-secret-with-at-least-32-characters",
            CORS_ORIGINS="https://test-campus.vercel.app",
        )
        from app.main import app
        with TestClient(app) as client:
            assert client.get("/health").json()["database"] == "connected"
            for origin, expected in [("https://test-campus.vercel.app", 200), ("https://untrusted.example", 400)]:
                response = client.options("/api/v1/items/", headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type"})
                assert response.status_code == expected, response.text
            login = client.post("/api/v1/auth/demo-login/admin")
            assert login.status_code == 200, login.text
            headers = {"Authorization": "Bearer " + login.json()["access_token"]}
            loc = client.post("/api/v1/locations/", headers=headers, json={"name": "Deployment Test", "building": "Test", "latitude": 28.6, "longitude": 77.4})
            assert loc.status_code == 200, loc.text
            image = BytesIO()
            Image.new("RGB", (10, 10), "blue").save(image, format="PNG")
            item = client.post("/api/v1/items/", headers=headers, data={"type": "found", "name": "Deployment check", "category": "Electronics", "description": "Deployment test image", "date_event": "2026-11-23"}, files={"images": ("test.png", image.getvalue(), "image/png")})
            assert item.status_code in (200, 201), item.text
            data = item.json()
            assert client.get(data["qr_image_url"]).status_code == 200
            assert client.get(data["images"][0]["file_url"]).status_code == 200
            item_id = data["id"]
        with TestClient(app) as client:
            assert client.get(f"/api/v1/items/{item_id}").status_code == 200
            assert client.get(data["qr_image_url"]).status_code == 200
            assert client.get(data["images"][0]["file_url"]).status_code == 200
        print("PASS: startup, DB health, allowed/blocked CORS, demo login, admin location, upload, QR, restart persistence")


if __name__ == "__main__":
    main()
