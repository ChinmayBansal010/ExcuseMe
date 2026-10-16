from __future__ import annotations

import re
import threading
from collections import Counter
from typing import Any

import numpy as np
import spacy
import textstat
from sklearn.feature_extraction.text import TfidfVectorizer
from transformers import pipeline

from app.core.config import (
    EMOTION_MODEL,
    SENTIMENT_MODEL,
    SPACY_MODEL,
    SUMMARIZATION_MODEL,
    ZERO_SHOT_MODEL,
)

class NLPService:
    """Lazy-loaded NLP operations. Models are loaded only when first requested."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._nlp = None
        self._pipelines: dict[str, Any] = {}

    def _get_spacy(self):
        with self._lock:
            if self._nlp is None:
                try:
                    self._nlp = spacy.load(SPACY_MODEL)
                except OSError as exc:
                    raise RuntimeError(
                        f"spaCy model '{SPACY_MODEL}' is missing. Run: "
                        f"python -m spacy download {SPACY_MODEL}"
                    ) from exc
            return self._nlp

    def _get_pipeline(self, key: str, task: str, model: str):
        with self._lock:
            if key not in self._pipelines:
                self._pipelines[key] = pipeline(task, model=model)
            return self._pipelines[key]

    @staticmethod
    def _sentences(text: str) -> list[str]:
        return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

    def stats(self, text: str) -> dict[str, Any]:
        doc = self._get_spacy()(text)
        words = [t for t in doc if not t.is_space and not t.is_punct]
        sentences = [s for s in doc.sents if s.text.strip()]
        word_count = len(words)
        return {
            "characters": len(text),
            "words": word_count,
            "sentences": len(sentences),
            "paragraphs": len([p for p in text.splitlines() if p.strip()]),
            "average_word_length": round(
                sum(len(t.text) for t in words) / max(word_count, 1), 2
            ),
            "average_sentence_length": round(word_count / max(len(sentences), 1), 2),
            "unique_word_ratio": round(
                len({t.lemma_.lower() for t in words if t.is_alpha}) /
                max(len([t for t in words if t.is_alpha]), 1), 3
            ),
            "flesch_reading_ease": round(textstat.flesch_reading_ease(text), 2),
            "flesch_kincaid_grade": round(textstat.flesch_kincaid_grade(text), 2),
            "sentence_list": [s.text.strip() for s in sentences],
        }

    def sentiment(self, text: str) -> dict[str, Any]:
        model = self._get_pipeline("sentiment", "sentiment-analysis", SENTIMENT_MODEL)
        output = model(text[:5000], truncation=True, max_length=512)
        return {"model": SENTIMENT_MODEL, "prediction": output[0]["label"], "score": round(float(output[0]["score"]), 4)}

    def emotion(self, text: str) -> dict[str, Any]:
        model = self._get_pipeline("emotion", "text-classification", EMOTION_MODEL)
        output = model(text[:5000], top_k=None, truncation=True, max_length=512)
        scores = output[0] if output and isinstance(output[0], list) else output
        scores = sorted(scores, key=lambda x: x["score"], reverse=True)
        return {
            "model": EMOTION_MODEL,
            "predictions": [
                {"label": item["label"], "score": round(float(item["score"]), 4)}
                for item in scores[:6]
            ],
        }

    def entities(self, text: str) -> dict[str, Any]:
        doc = self._get_spacy()(text)
        return {
            "entities": [
                {
                    "text": ent.text,
                    "label": ent.label_,
                    "description": spacy.explain(ent.label_) or ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char,
                }
                for ent in doc.ents
            ]
        }

    def pos(self, text: str) -> dict[str, Any]:
        doc = self._get_spacy()(text)
        return {
            "tokens": [
                {
                    "text": token.text,
                    "lemma": token.lemma_,
                    "pos": token.pos_,
                    "tag": token.tag_,
                    "dependency": token.dep_,
                    "head": token.head.text,
                    "is_stopword": token.is_stop,
                    "is_punctuation": token.is_punct,
                }
                for token in doc
                if not token.is_space
            ]
        }

    def syntax(self, text: str) -> dict[str, Any]:
        doc = self._get_spacy()(text)
        return {
            "sentences": [
                {
                    "text": sent.text,
                    "root": next((t.text for t in sent if t.head == t), ""),
                    "tokens": [
                        {
                            "text": t.text,
                            "dependency": t.dep_,
                            "head": t.head.text,
                            "children": [c.text for c in t.children],
                        }
                        for t in sent
                    ],
                }
                for sent in doc.sents
            ]
        }

    def keywords(self, text: str, top_k: int = 10) -> dict[str, Any]:
        doc = self._get_spacy()(text)
        candidates = [
            token.lemma_.lower()
            for token in doc
            if token.is_alpha and not token.is_stop and len(token.lemma_) > 2
        ]
        if not candidates:
            return {"keywords": []}
        counts = Counter(candidates)
        # TF-IDF is calculated across sentence-sized documents, then combined with frequency.
        sentences = [s.text for s in doc.sents if s.text.strip()]
        try:
            vectorizer = TfidfVectorizer(
                stop_words="english", ngram_range=(1, 2), max_features=3000
            )
            matrix = vectorizer.fit_transform(sentences if len(sentences) > 1 else [text])
            scores = np.asarray(matrix.mean(axis=0)).ravel()
            terms = vectorizer.get_feature_names_out()
            ranked = sorted(
                [(str(term), float(score)) for term, score in zip(terms, scores)],
                key=lambda item: item[1],
                reverse=True,
            )
        except ValueError:
            ranked = []
        chosen = []
        used = set()
        for term, score in ranked:
            if term not in used:
                chosen.append({"term": term, "score": round(score, 4), "frequency": counts.get(term, 0)})
                used.add(term)
            if len(chosen) >= top_k:
                break
        if not chosen:
            chosen = [
                {"term": term, "score": float(count), "frequency": int(count)}
                for term, count in counts.most_common(top_k)
            ]
        return {"keywords": chosen}

    def summary(self, text: str) -> dict[str, Any]:
        if len(text.split()) < 45:
            return {
                "summary": text,
                "note": "Text is short; returned unchanged rather than forcing an abstractive summary.",
            }
        model = self._get_pipeline("summary", "summarization", SUMMARIZATION_MODEL)
        output = model(text[:12000], max_length=120, min_length=25, do_sample=False, truncation=True)
        return {"model": SUMMARIZATION_MODEL, "summary": output[0]["summary_text"]}

    def zero_shot(self, text: str, labels: list[str]) -> dict[str, Any]:
        if not labels:
            raise ValueError("Provide at least one label for zero-shot classification.")
        if len(labels) < 2:
            raise ValueError("Provide at least two candidate labels.")
        model = self._get_pipeline("zero_shot", "zero-shot-classification", ZERO_SHOT_MODEL)
        output = model(text[:5000], candidate_labels=labels, multi_label=True)
        return {
            "model": ZERO_SHOT_MODEL,
            "predictions": [
                {"label": label, "score": round(float(score), 4)}
                for label, score in zip(output["labels"], output["scores"])
            ],
        }


    def language(self, text: str) -> dict[str, Any]:
        from langdetect import DetectorFactory, detect, detect_langs
        DetectorFactory.seed = 0
        try:
            detected = detect(text)
            alternatives = [
                {"language": item.lang, "probability": round(float(item.prob), 4)}
                for item in detect_langs(text)[:5]
            ]
        except Exception:
            detected = "unknown"
            alternatives = []
        return {
            "language_code": detected,
            "alternatives": alternatives,
            "note": "Language identification is less reliable for very short text, names, and mixed-language input.",
        }

    def excuse(self, text: str) -> dict[str, Any]:
        doc = self._get_spacy()(text)
        cue_groups = {
            "uncertainty": {"maybe", "perhaps", "possibly", "probably", "might", "could", "guess"},
            "time_reference": {"today", "yesterday", "tomorrow", "later", "soon", "morning", "evening"},
            "explanation": {"because", "since", "therefore", "due", "reason"},
            "apology": {"sorry", "apologize", "apologies", "regret"},
            "commitment": {"will", "promise", "ensure", "guarantee", "definitely"},
        }
        words = {token.lemma_.lower() for token in doc if token.is_alpha}
        cues = {
            category: sorted(words.intersection(terms))
            for category, terms in cue_groups.items()
        }
        sentence_count = len(list(doc.sents))
        hedges = cues["uncertainty"]

        # Transparent structure score, not a truth/lie probability.
        # Points are awarded for common components of a complete explanation.
        score = 0
        score += 25 if cues["explanation"] else 0
        score += 20 if cues["time_reference"] else 0
        score += 20 if cues["commitment"] else 0
        score += 10 if cues["apology"] else 0
        score += 15 if len([t for t in doc if t.is_alpha]) >= 18 else 0
        score += 10 if sentence_count >= 2 else 0

        return {
            "notice": (
                "The score measures how many structural components appear in the text. "
                "It is not a truth score, credibility probability, or lie detector."
            ),
            "excuse_structure_score": score,
            "score_label": (
                "More structurally complete" if score >= 60
                else "Partially specified" if score >= 30
                else "Sparse explanation"
            ),
            "linguistic_cues": cues,
            "cue_counts": {key: len(value) for key, value in cues.items()},
            "hedging_level": "present" if hedges else "not detected",
            "sentence_count": sentence_count,
            "questions_to_consider": [
                "Is the explanation specific enough to be checked?",
                "Does the speaker state a clear next step or commitment?",
                "Are important details missing or ambiguous?",
            ],
        }

    def analyze(self, text: str, operations: list[str], labels: list[str]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        dispatch = {
            "stats": self.stats,
            "sentiment": self.sentiment,
            "emotion": self.emotion,
            "entities": self.entities,
            "keywords": self.keywords,
            "pos": self.pos,
            "summary": self.summary,
            "excuse": self.excuse,
            "syntax": self.syntax,
            "language": self.language,
        }
        for operation in operations:
            if operation == "zero_shot":
                result[operation] = self.zero_shot(text, labels)
            elif operation in dispatch:
                result[operation] = dispatch[operation](text)
            else:
                raise ValueError(f"Unsupported operation: {operation}")
        return result


nlp_service = NLPService()
