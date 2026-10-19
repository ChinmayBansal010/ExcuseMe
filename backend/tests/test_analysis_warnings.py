from fastapi.testclient import TestClient
from app.api.routes import explanation_quality_service, nlp_service
from app.main import app

client = TestClient(app)

def test_analysis_response_includes_responsible_use_warnings(monkeypatch):
    monkeypatch.setattr(nlp_service, "analyze", lambda text, operations, labels: {"sentiment": {"prediction": "neutral"}})
    monkeypatch.setattr(explanation_quality_service, "analyze", lambda text: {"score": 30, "calibrated": False})
    response = client.post(
        "/api/v1/analyze",
        json={"text": "The meeting starts at noon.", "operations": ["sentiment", "excuse"]},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["text_length"] == len("The meeting starts at noon.")
    assert set(payload["results"]) == {"sentiment", "excuse"}
    assert any("ground truth" in warning.lower() for warning in payload["warnings"])
    assert any("lying" in warning.lower() for warning in payload["warnings"])

def test_analysis_without_excuse_operation_does_not_call_excuse_model(monkeypatch):
    monkeypatch.setattr(nlp_service, "analyze", lambda text, operations, labels: {"sentiment": {"prediction": "neutral"}})
    def unexpected_call(_text):
        raise AssertionError("Excuse model should not run when not selected")
    monkeypatch.setattr(explanation_quality_service, "analyze", unexpected_call)
    response = client.post("/api/v1/analyze", json={"text": "A neutral sentence.", "operations": ["sentiment"]})
    assert response.status_code == 200
    assert "excuse" not in response.json()["results"]
