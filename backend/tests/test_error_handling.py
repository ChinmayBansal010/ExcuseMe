from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_missing_text_is_rejected():
    response = client.post("/api/v1/analyze", json={"operations": ["sentiment"]})
    assert response.status_code == 422

def test_unknown_operation_is_rejected_before_inference():
    response = client.post("/api/v1/analyze", json={"text": "Example", "operations": ["made_up"]})
    assert response.status_code == 422

def test_similarity_requires_both_fields():
    response = client.post("/api/v1/compare", json={"text_a": "Only one side"})
    assert response.status_code == 422

def test_search_rejects_top_k_above_limit():
    response = client.post("/api/v1/search-corpus", json={"query": "example", "top_k": 1000})
    assert response.status_code == 422

def test_analysis_rejects_payload_over_limit():
    response = client.post("/api/v1/analyze", json={"text": "x" * 20001, "operations": ["stats"]})
    assert response.status_code == 422
