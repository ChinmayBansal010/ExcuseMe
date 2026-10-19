from app.services.explanation_quality import ExplanationQualityService
from app.services import explanation_quality as quality_module
from app.services.nlp_service import nlp_service


class FakeZeroShotModel:
    def __init__(self, score=0.73):
        self.score = score
        self.calls = []

    def __call__(self, text, candidate_labels, **kwargs):
        self.calls.append({"text": text, "labels": candidate_labels, "kwargs": kwargs})
        return {
            "labels": [candidate_labels[0], candidate_labels[1], candidate_labels[2]],
            "scores": [self.score, 0.2, 0.07],
        }


def test_raw_score_uses_three_explicit_candidate_labels(monkeypatch):
    service = ExplanationQualityService()
    model = FakeZeroShotModel()
    monkeypatch.setattr(nlp_service, "_get_pipeline", lambda *args, **kwargs: model)

    score = service.raw_score("My laptop broke before the deadline.")

    assert score == 0.73
    assert len(model.calls) == 1
    call = model.calls[0]
    assert len(call["labels"]) == 3
    assert call["kwargs"]["multi_label"] is False
    assert call["kwargs"]["hypothesis_template"] == "This text is {}."
    assert call["kwargs"]["truncation"] is True


def test_raw_score_is_clamped_to_valid_range(monkeypatch):
    service = ExplanationQualityService()
    model = FakeZeroShotModel(score=1.5)
    monkeypatch.setattr(nlp_service, "_get_pipeline", lambda *args, **kwargs: model)
    assert service.raw_score("A reason was provided.") == 1.0


def test_raw_score_rejects_empty_model_output(monkeypatch):
    service = ExplanationQualityService()
    monkeypatch.setattr(
        nlp_service, "_get_pipeline",
        lambda *args, **kwargs: lambda *a, **k: {"labels": [], "scores": []},
    )
    try:
        service.raw_score("A statement.")
    except RuntimeError as error:
        assert "no assessment" in str(error)
    else:
        raise AssertionError("An empty model output should fail clearly")


def test_analyze_marks_raw_score_as_uncalibrated(monkeypatch):
    service = ExplanationQualityService()
    monkeypatch.setattr(service, "raw_score", lambda _text: 0.62)
    monkeypatch.setattr(service, "_get_calibrator", lambda: None)

    result = service.analyze("The train was delayed.")

    assert result["title"] == "Excuse likelihood"
    assert result["score"] == 62
    assert result["calibrated"] is False
    assert "not a reliable probability" in result["notice"]
    assert "calibration not fitted" in result["score_label"]


def test_analyze_uses_calibrator_when_available(monkeypatch):
    class FakeCalibrator:
        def predict(self, scores):
            assert scores == [0.62]
            return [0.81]

    service = ExplanationQualityService()
    monkeypatch.setattr(service, "raw_score", lambda _text: 0.62)
    monkeypatch.setattr(service, "_get_calibrator", lambda: FakeCalibrator())

    result = service.analyze("The train was delayed.")

    assert result["score"] == 81
    assert result["calibrated"] is True
    assert "estimated probability" in result["score_label"]
    assert "held-out set" in result["notice"]


def test_calibrator_load_failure_falls_back_to_raw_score(monkeypatch, tmp_path):
    service = ExplanationQualityService()
    service.CALIBRATOR_PATH = tmp_path / "missing.joblib"
    assert service._get_calibrator() is None
    assert service._calibrator_loaded is True

def test_corrupt_calibrator_falls_back_without_crashing(monkeypatch, tmp_path):
    import pickle
    from app.services import explanation_quality as quality_module

    service = ExplanationQualityService()
    service.CALIBRATOR_PATH = tmp_path / "broken.joblib"
    service.CALIBRATOR_PATH.write_bytes(b"not a valid joblib artifact")
    monkeypatch.setattr(quality_module.joblib, "load", lambda _path: (_ for _ in ()).throw(pickle.UnpicklingError("broken file")))

    assert service._get_calibrator() is None
    assert service._calibrator_loaded is True
