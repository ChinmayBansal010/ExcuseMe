from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_cors_middleware_returns_allow_origin_for_configured_request():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:8081",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in {200, 204}
    assert response.headers.get("access-control-allow-origin") in {"*", "http://localhost:8081"}

def test_cors_does_not_enable_credentials_with_wildcard_default():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:8081",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-credentials") != "true"
