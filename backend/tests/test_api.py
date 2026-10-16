from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_tools():
    response = client.get("/api/v1/tools")
    assert response.status_code == 200
    ids = {tool["id"] for tool in response.json()["tools"]}
    assert {"stats", "sentiment", "entities", "excuse", "similarity"} <= ids

def test_rejects_blank_text():
    response = client.post("/api/v1/analyze", json={"text": "   ", "operations": ["stats"]})
    assert response.status_code == 422
