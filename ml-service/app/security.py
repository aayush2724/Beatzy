"""Shared-secret check for calls from the Beatzy backend.

The ML service runs on a public host (Hugging Face Spaces). Without this,
anyone could submit analysis jobs or search requests against it. When
``ML_SERVICE_TOKEN`` is unset the check is skipped so local development and
the test-suite keep working; set it (to the same value as the backend's
``ML_SERVICE_TOKEN``) in production.
"""
import os
import secrets

from fastapi import Header, HTTPException


def require_service_token(x_service_token: str | None = Header(default=None)) -> None:
    expected = os.getenv("ML_SERVICE_TOKEN", "").strip()
    if not expected:
        return
    if not x_service_token or not secrets.compare_digest(x_service_token, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")
