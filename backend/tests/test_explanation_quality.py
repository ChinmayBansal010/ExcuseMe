from types import SimpleNamespace

from app.services.explanation_quality import ExplanationQualityService
from app.services.nlp_service import nlp_service


class FakeQualityModel:
    def __call__(self, text, candidate_labels, **kwargs):
        if "contradictory" in text.lower() and "contradictory" in candidate_labels[1].lower():
            labels = list(candidate_labels)
            return {"labels": labels, "scores": [0.2, 0.8]}
        return {"labels": list(candidate_labels), "scores": [0.8, 0.2]}


def test_explanation_quality_returns_four_consumer_friendly_dimensions(monkeypatch):
    service = ExplanationQualityService()
    doc = SimpleNamespace(sents=[
        SimpleNamespace(text="My laptop broke before the deadline."),
        SimpleNamespace(text="I will submit the assignment tomorrow."),
    ])
    monkeypatch.setattr(nlp_service, "_get_pipeline", lambda *args, **kwargs: FakeQualityModel())
    monkeypatch.setattr(nlp_service, "_get_spacy", lambda: lambda _text: doc)

    result = service.analyze("My laptop broke before the deadline. I will submit the assignment tomorrow.")

    assert result["title"] == "Explanation quality"
    assert len(result["dimensions"]) == 4
    assert {item["key"] for item in result["dimensions"]} == {
        "clarity", "specificity", "completeness", "consistency"
    }
    assert all("assessment" in item and "explanation" in item and "evidence" in item for item in result["dimensions"])
    assert "cannot determine whether an explanation is true" in result["notice"]


def test_consistency_finding_does_not_claim_no_conflict_when_model_flags_one(monkeypatch):
    service = ExplanationQualityService()
    doc = SimpleNamespace(sents=[SimpleNamespace(text="The explanation has contradictory details.")])
    monkeypatch.setattr(nlp_service, "_get_pipeline", lambda *args, **kwargs: FakeQualityModel())
    monkeypatch.setattr(nlp_service, "_get_spacy", lambda: lambda _text: doc)

    result = service.analyze("The explanation has contradictory details.")
    consistency = next(item for item in result["dimensions"] if item["key"] == "consistency")

    assert consistency["assessment"] == "Possible conflict"
    assert consistency["status"] == "review"
