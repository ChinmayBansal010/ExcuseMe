from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_includes_truthfulness_limitation():
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["name"]
    assert "warning" in payload
    assert "lying" in payload["warning"]

def test_tool_catalog_has_unique_ids_and_required_fields():
    response = client.get("/api/v1/tools")
    assert response.status_code == 200
    tools = response.json()["tools"]
    ids = [tool["id"] for tool in tools]
    assert len(ids) == len(set(ids))
    assert all({"id", "name", "description", "category"} <= set(tool) for tool in tools)

def test_analyze_response_rejects_unknown_operation():
    response = client.post("/api/v1/analyze", json={"text": "sample", "operations": ["not_a_tool"]})
    assert response.status_code == 422

def test_similarity_rejects_blank_text():
    response = client.post("/api/v1/similarity", json={"text_a": "meaning", "text_b": " "})
    assert response.status_code == 422

def test_corpus_search_rejects_blank_query():
    response = client.post("/api/v1/search-corpus", json={"query": " "})
    assert response.status_code == 422
