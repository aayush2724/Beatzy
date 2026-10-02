from fastapi.testclient import TestClient


def _client(monkeypatch, token):
    if token is None:
        monkeypatch.delenv("ML_SERVICE_TOKEN", raising=False)
    else:
        monkeypatch.setenv("ML_SERVICE_TOKEN", token)
    from app.main import app
    return TestClient(app)


def test_health_is_public(monkeypatch):
    res = _client(monkeypatch, "s3cret").get("/health")
    assert res.status_code == 200


def test_protected_route_rejects_missing_token(monkeypatch):
    res = _client(monkeypatch, "s3cret").get("/spotify/search", params={"q": "x"})
    assert res.status_code == 401


def test_protected_route_rejects_wrong_token(monkeypatch):
    res = _client(monkeypatch, "s3cret").get(
        "/spotify/search", params={"q": "x"}, headers={"X-Service-Token": "nope"}
    )
    assert res.status_code == 401
