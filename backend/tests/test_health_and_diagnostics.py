from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_is_lightweight_and_stable():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_diagnostics_exposes_expected_runtime_fields():
    response = client.get("/api/v1/diagnostics")
    assert response.status_code == 200
    payload = response.json()
    expected = {"status", "python_version", "torch_version", "cuda_build", "gpu_available", "gpu_name", "inference_device", "corpus_database_configured", "corpus_database_exists"}
    assert expected <= payload.keys()
    assert payload["status"] == "ok"
    assert payload["inference_device"] in {"cpu", "cuda:0"}
    assert isinstance(payload["gpu_available"], bool)
