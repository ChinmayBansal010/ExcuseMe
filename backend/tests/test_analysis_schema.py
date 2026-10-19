import pytest
from pydantic import ValidationError
from app.schemas.analysis import AnalyzeRequest, CorpusSearchRequest, SimilarityRequest

def test_analysis_trims_text_and_deduplicates_operations():
    request = AnalyzeRequest(text="  deadline explanation  ", operations=["stats", "stats", "sentiment"])
    assert request.text == "deadline explanation"
    assert request.operations == ["stats", "sentiment"]

@pytest.mark.parametrize("text", ["", " ", "\n\t"])
def test_analysis_rejects_blank_text(text):
    with pytest.raises(ValidationError):
        AnalyzeRequest(text=text)

def test_analysis_rejects_text_over_limit():
    with pytest.raises(ValidationError):
        AnalyzeRequest(text="x" * 20001, operations=["stats"])

def test_analysis_rejects_empty_operation_list():
    with pytest.raises(ValidationError):
        AnalyzeRequest(text="hello", operations=[])

def test_labels_are_trimmed_and_deduplicated():
    request = AnalyzeRequest(text="hello", operations=["zero_shot"], labels=[" excuse ", "excuse", "neutral"])
    assert request.labels == ["excuse", "neutral"]

def test_labels_reject_oversized_values():
    with pytest.raises(ValidationError):
        AnalyzeRequest(text="hello", labels=["x" * 81])

@pytest.mark.parametrize("top_k", [0, -1, 21])
def test_corpus_search_bounds_top_k(top_k):
    with pytest.raises(ValidationError):
        CorpusSearchRequest(query="query", top_k=top_k)

def test_similarity_rejects_blank_side():
    with pytest.raises(ValidationError):
        SimilarityRequest(text_a="first", text_b="  ")
