import logging

import numpy as np
from fastapi import APIRouter, HTTPException

from app.core.config import EMBEDDING_MODEL
from app.schemas.analysis import AnalyzeRequest, SimilarityRequest, CorpusSearchRequest
from app.services.nlp_service import nlp_service
from app.services.corpus_service import corpus_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["NLP"])

TOOLS = [
    {"id": "language", "name": "Language detection", "description": "Identifies likely language and alternative language probabilities.", "category": "linguistics"},
    {"id": "stats", "name": "Text metrics", "description": "Word counts, sentence segmentation, vocabulary ratio and readability.", "category": "linguistics"},
    {"id": "pos", "name": "Tokenization & POS", "description": "Tokens, lemmas, part-of-speech tags, stopwords and dependencies.", "category": "linguistics"},
    {"id": "syntax", "name": "Syntax explorer", "description": "Sentence roots, dependency relations and parse structure.", "category": "linguistics"},
    {"id": "entities", "name": "Named entities", "description": "People, organizations, locations, dates and other entity spans.", "category": "extraction"},
    {"id": "keywords", "name": "Keyword extraction", "description": "Ranks salient terms and phrases using TF-IDF and frequency.", "category": "extraction"},
    {"id": "sentiment", "name": "Sentiment", "description": "Predicts broad positive/negative sentiment.", "category": "classification"},
    {"id": "emotion", "name": "Emotion", "description": "Ranks emotion labels using a pretrained text classifier.", "category": "classification"},
    {"id": "zero_shot", "name": "Custom classification", "description": "Classifies text against labels supplied by the user.", "category": "classification"},
    {"id": "summary", "name": "Summarization", "description": "Produces a concise summary for longer passages.", "category": "generation"},
    {"id": "excuse", "name": "Excuse language cues", "description": "Surfaces hedging, explanations, time references, apologies and commitments without claiming to detect lies.", "category": "excuse"},
    {"id": "similarity", "name": "Semantic comparison", "description": "Compares meaning and measurable text differences between two passages.", "category": "embeddings"},
    {"id": "search", "name": "Corpus search", "description": "Retrieves semantically related passages from the optional local corpus index.", "category": "retrieval"},
]


@router.get("/tools")
def get_tools():
    return {"tools": TOOLS}


@router.post("/analyze")
def analyze(request: AnalyzeRequest):
    try:
        results = nlp_service.analyze(request.text, request.operations, request.labels)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception("Required NLP model unavailable")
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("NLP analysis failed")
        raise HTTPException(
            status_code=500,
            detail="Analysis failed while processing this request. Check the backend logs for details.",
        ) from exc

    return {
        "text_length": len(request.text),
        "results": results,
        "warnings": [
            "Model outputs are predictions, not ground truth.",
            "Excuse language cues cannot determine whether a person is lying.",
        ],
    }


@router.post("/similarity")
def similarity(request: SimilarityRequest):
    try:
        model = corpus_service._get_model()
        embeddings = model.encode(
            [request.text_a, request.text_b],
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        score = float(np.dot(embeddings[0], embeddings[1]))
        return {
            "similarity": round(score, 4),
            "percentage": round(max(0.0, min(1.0, score)) * 100, 2),
            "model": EMBEDDING_MODEL,
            "interpretation": (
                "Cosine similarity between text embeddings; it is not a probability "
                "that the texts mean the same thing."
            ),
        }
    except Exception as exc:
        logger.exception("Semantic similarity failed")
        raise HTTPException(
            status_code=503,
            detail="Semantic comparison is temporarily unavailable. Check model availability and backend logs.",
        ) from exc


@router.post("/compare")
def compare(request: SimilarityRequest):
    semantic = similarity(request)
    try:
        stats_a = nlp_service.stats(request.text_a)
        stats_b = nlp_service.stats(request.text_b)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.exception("Required NLP model unavailable for text comparison")
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Text comparison metrics failed")
        raise HTTPException(
            status_code=503,
            detail="Text metrics are temporarily unavailable. Check the backend logs for details.",
        ) from exc

    score = semantic["similarity"]
    label = (
        "High semantic similarity" if score >= 0.75
        else "Moderate semantic similarity" if score >= 0.45
        else "Low semantic similarity"
    )
    fields = ("characters", "words", "sentences", "paragraphs", "flesch_reading_ease")
    return {
        **semantic,
        "similarity_label": label,
        "stats_a": {key: stats_a[key] for key in fields},
        "stats_b": {key: stats_b[key] for key in fields},
        "differences_b_minus_a": {
            key: round(stats_b[key] - stats_a[key], 2)
            for key in fields
        },
        "interpretation": (
            semantic["interpretation"]
            + " Text metric differences are descriptive and do not imply quality or intent."
        ),
    }


@router.post("/search-corpus")
def search_corpus(request: CorpusSearchRequest):
    try:
        return corpus_service.search(request.query, request.top_k)
    except Exception as exc:
        logger.exception("Corpus search failed")
        raise HTTPException(
            status_code=503,
            detail="Corpus search is temporarily unavailable. Ensure the corpus index and embedding model are available.",
        ) from exc
