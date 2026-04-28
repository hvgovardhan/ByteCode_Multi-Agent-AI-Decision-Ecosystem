"""
Entry point for the Celery worker.
Run with: celery -A celery_worker.celery_app worker --loglevel=info
"""
from app.tasks.debate_task import celery_app  # noqa: F401
