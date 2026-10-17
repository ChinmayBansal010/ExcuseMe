from app.services.nlp_service import NLPService


class FakeSentimentPipeline:
    def __call__(self, text, **kwargs):
        if "negative" in text:
            return [[{"label": "NEGATIVE", "score": 0.9}, {"label": "POSITIVE", "score": 0.1}]]
        return [[{"label": "POSITIVE", "score": 0.8}, {"label": "NEGATIVE", "score": 0.2}]]


class FakeEmotionPipeline:
    def __call__(self, text, **kwargs):
        if "sad" in text:
            return [[{"label": "sadness", "score": 0.8}, {"label": "joy", "score": 0.2}]]
        return [[{"label": "joy", "score": 0.7}, {"label": "sadness", "score": 0.3}]]


def test_text_chunks_preserve_late_sentences():
    text = ("word " * 320) + ". The final distinctive sentence must remain included."
    chunks = NLPService._text_chunks(text)
    assert len(chunks) >= 2
    assert any("final distinctive sentence" in chunk for chunk in chunks)


def test_sentiment_aggregates_all_labels_across_chunks(monkeypatch):
    service = NLPService()
    monkeypatch.setattr(service, "_get_pipeline", lambda *args, **kwargs: FakeSentimentPipeline())
    text = ("positive " * 280) + ". " + ("negative " * 280) + "."
    result = service.sentiment(text)
    assert result["chunks_analyzed"] >= 2
    assert result["prediction"] in {"POSITIVE", "NEGATIVE"}
    assert 0 <= result["score"] <= 1


def test_emotion_aggregates_scores_across_chunks(monkeypatch):
    service = NLPService()
    monkeypatch.setattr(service, "_get_pipeline", lambda *args, **kwargs: FakeEmotionPipeline())
    text = ("joy " * 280) + ". " + ("sad " * 280) + "."
    result = service.emotion(text)
    assert result["chunks_analyzed"] >= 2
    assert {item["label"] for item in result["predictions"]} == {"joy", "sadness"}
    assert all(0 <= item["score"] <= 1 for item in result["predictions"])



class FakeZeroShotPipeline:
    def __call__(self, text, candidate_labels, **kwargs):
        if "apology" in text:
            scores = [0.9 if label == "apology" else 0.1 for label in candidate_labels]
        else:
            scores = [0.8 if label == "promise" else 0.2 for label in candidate_labels]
        ranked = sorted(zip(candidate_labels, scores), key=lambda item: item[1], reverse=True)
        return {"labels": [item[0] for item in ranked], "scores": [item[1] for item in ranked]}


def test_zero_shot_aggregates_custom_labels_across_chunks(monkeypatch):
    service = NLPService()
    monkeypatch.setattr(service, "_get_pipeline", lambda *args, **kwargs: FakeZeroShotPipeline())
    text = ("apology " * 280) + ". " + ("promise " * 280) + "."
    result = service.zero_shot(text, ["apology", "promise"])
    assert result["chunks_analyzed"] >= 2
    assert {item["label"] for item in result["predictions"]} == {"apology", "promise"}
    assert all(0 <= item["score"] <= 1 for item in result["predictions"])
