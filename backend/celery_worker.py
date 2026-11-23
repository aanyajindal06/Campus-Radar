import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "campusfind_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="tasks.generate_image_embedding_background")
def generate_image_embedding_background(item_id: int, image_path: str):
    print(f"[CELERY BG TASK] Processing visual embedding for Item #{item_id} from {image_path}...")
    return {"status": "success", "item_id": item_id}

@celery_app.task(name="tasks.send_match_email_notification")
def send_match_email_notification(user_email: str, item_name: str, similarity_pct: float, match_url: str):
    print(f"[CELERY BG TASK] Sending email notification to {user_email}: '{item_name}' matched ({similarity_pct}%)")
    return {"sent_to": user_email, "status": "delivered"}
