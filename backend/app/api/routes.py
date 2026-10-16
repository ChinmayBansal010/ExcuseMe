from fastapi import APIRouter, HTTPException

from app.schemas.analysis import AnalyzeRequest, SimilarityRequest, CorpusSearchRequest
from app.services.nlp_service import nlp_service
from app.services.corpus_service import corpus_service

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
    {"id": "similarity", "name": "Semantic similarity", "description": "Compares the meaning of two text passages.", "category": "embeddings"},
    {"id": "search", "name": "Corpus search", "description": "Retrieves semantically related passages from the optional local corpus index.", "category": "retrieval"},
]

@router.get("/tools")
def get_tools():
    return {"tools": TOOLS}

@router.post("/analyze")
def analyze(request: AnalyzeRequest):
    try:
        results = nlp_service.analyze(request.text, request.operations, request.labels)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"NLP operation failed: {type(exc).__name__}: {exc}") from exc

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
        from sentence_transformers import SentenceTransformer
        import numpy as np
        from app.core.config import EMBEDDING_MODEL
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
            "interpretation": "Cosine similarity between text embeddings; not a probability that the texts mean the same thing.",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Similarity failed: {type(exc).__name__}: {exc}") from exc

@router.post("/search-corpus")
def search_corpus(request: CorpusSearchRequest):
    try:
        return corpus_service.search(request.query, request.top_k)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Corpus search failed: {type(exc).__name__}: {exc}") from exc
