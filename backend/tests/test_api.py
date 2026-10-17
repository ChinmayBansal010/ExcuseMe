import numpy as np
from fastapi.testclient import TestClient

from app.api.routes import corpus_service, nlp_service
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_diagnostics_reports_runtime_without_loading_models():
    response = client.get("/api/v1/diagnostics")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["inference_device"] in {"cpu", "cuda:0"}
    assert isinstance(payload["gpu_available"], bool)
    assert "corpus_database_exists" in payload


def test_tools():
    response = client.get("/api/v1/tools")
    assert response.status_code == 200
    ids = {tool["id"] for tool in response.json()["tools"]}
    assert {"stats", "sentiment", "entities", "excuse", "similarity"} <= ids


def test_rejects_blank_text():
    response = client.post("/api/v1/analyze", json={"text": "   ", "operations": ["stats"]})
    assert response.status_code == 422


def test_rejects_blank_comparison_text():
    response = client.post(
        "/api/v1/compare",
        json={"text_a": "a useful passage", "text_b": "   "},
    )
    assert response.status_code == 422


def test_compare_returns_similarity_and_metric_differences(monkeypatch):
    class FakeEmbeddingModel:
        def encode(self, texts, **kwargs):
            return np.array([[1.0, 0.0], [0.8, 0.6]], dtype=np.float32)

    def fake_stats(text):
        return {
            "characters": len(text),
            "words": len(text.split()),
            "sentences": 1,
            "paragraphs": 1,
            "flesch_reading_ease": 70.0 if text == "first text" else 60.0,
        }

    monkeypatch.setattr(corpus_service, "_get_model", lambda: FakeEmbeddingModel())
    monkeypatch.setattr(nlp_service, "stats", fake_stats)

    response = client.post(
        "/api/v1/compare",
        json={"text_a": "first text", "text_b": "second longer text"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["similarity"] == 0.8
    assert payload["percentage"] == 80.0
    assert payload["similarity_label"] == "High semantic similarity"
    assert payload["stats_a"]["words"] == 2
    assert payload["stats_b"]["words"] == 3
    assert payload["differences_b_minus_a"]["words"] == 1
    assert payload["differences_b_minus_a"]["flesch_reading_ease"] == -10.0
