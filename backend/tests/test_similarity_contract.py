import numpy as np
from fastapi.testclient import TestClient
from app.api.routes import corpus_service
from app.main import app

client = TestClient(app)

class SameVectorModel:
    def encode(self, texts, **kwargs):
        return np.array([[1.0, 0.0] for _ in texts], dtype=np.float32)

def test_identical_embedding_vectors_return_unit_similarity(monkeypatch):
    monkeypatch.setattr(corpus_service, "_get_model", lambda: SameVectorModel())
    response = client.post("/api/v1/similarity", json={"text_a": "same", "text_b": "same"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["similarity"] == 1.0
    assert payload["percentage"] == 100.0
    assert "not a probability" in payload["interpretation"]

def test_similarity_response_has_model_metadata(monkeypatch):
    monkeypatch.setattr(corpus_service, "_get_model", lambda: SameVectorModel())
    response = client.post("/api/v1/similarity", json={"text_a": "first", "text_b": "second"})
    assert response.status_code == 200
    assert response.json()["model"]
