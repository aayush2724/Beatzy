import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def client():
    from app.main import app
    app.state.yamnet = MagicMock()
    app.state.yamnet.classify = AsyncMock(return_value={"labels": ["Music"], "confidence_scores": [0.9]})
    return TestClient(app)


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
