from __future__ import annotations

from typing import Any

from app.core.config import ZERO_SHOT_MODEL
from app.services.nlp_service import nlp_service


class ExplanationQualityService:
    """Consumer-facing AI assessment of clarity, specificity, completeness and consistency."""

    DIMENSIONS = [
        {
            "key": "clarity",
            "title": "Clarity",
            "positive": "The explanation is clear and easy to understand.",
            "negative": "The explanation is unclear or ambiguous.",
            "terms": {"because", "reason", "mean", "unclear", "something", "problem"},
            "good": "The main point is understandable.",
            "review": "Some wording may be unclear or open to interpretation.",
        },
        {
            "key": "specificity",
            "title": "Specificity",
            "positive": "The explanation gives concrete, specific details about what happened.",
            "negative": "The explanation is vague and lacks concrete details about what happened.",
            "terms": {"when", "where", "which", "after", "before", "laptop", "meeting", "deadline", "bus", "doctor", "sick", "broken", "crashed"},
            "good": "The text includes concrete details.",
            "review": "The reason may be too general to understand what happened.",
        },
        {
            "key": "completeness",
            "title": "Completeness",
            "positive": "The explanation covers the reason, impact, and a next step where appropriate.",
            "negative": "The explanation is incomplete and leaves important context or a next step unclear.",
            "terms": {"because", "so", "therefore", "couldn't", "unable", "missed", "will", "send", "submit", "reschedule", "tomorrow", "later", "sorry"},
            "good": "The text gives context or explains what happens next.",
            "review": "The impact or next step may be unclear.",
        },
        {
            "key": "consistency",
            "title": "Internal consistency",
            "positive": "The details in the explanation are internally consistent and do not conflict.",
            "negative": "The explanation contains conflicting or contradictory details.",
            "terms": {"but", "however", "although", "yet", "instead", "never", "always", "already", "not"},
            "good": "The model did not flag a clear conflict in the wording.",
            "review": "The model detected a possible conflict worth reviewing.",
        },
    ]

    def analyze(self, text: str) -> dict[str, Any]:
        model = nlp_service._get_pipeline(
            "zero_shot", "zero-shot-classification", ZERO_SHOT_MODEL
        )
        doc = nlp_service._get_spacy()(text)
        sentences = [sentence.text.strip() for sentence in doc.sents if sentence.text.strip()]
        findings = []

        for dimension in self.DIMENSIONS:
            positive = dimension["positive"]
            negative = dimension["negative"]
            output = model(
                text,
                candidate_labels=[positive, negative],
                multi_label=False,
                truncation=True,
            )
            ranked = list(zip(output.get("labels", []), output.get("scores", [])))
            if not ranked:
                raise RuntimeError("The explanation quality model returned no assessment.")
            label, _ = max(ranked, key=lambda item: float(item[1]))
            positive_score = next(
                (float(score) for candidate, score in ranked if candidate == positive),
                0.0,
            )
            positive_signal = label == positive
            evidence = [
                sentence for sentence in sentences
                if any(term in sentence.lower() for term in dimension["terms"])
            ]
            if not evidence and dimension["key"] != "consistency":
                evidence = sentences[:2]
            if dimension["key"] == "consistency" and positive_signal:
                evidence = []

            findings.append({
                "key": dimension["key"],
                "title": dimension["title"],
                "assessment": (
                    ("No clear conflict flagged" if positive_signal else "Possible conflict") if dimension["key"] == "consistency" else
                    ("Looks good" if positive_signal else "May need more detail")
                ),
                "status": "positive" if positive_signal else "review",
                "score": round(max(0.0, min(1.0, positive_score)), 4),
                "explanation": dimension["good"] if positive_signal else dimension["review"],
                "evidence": evidence[:2],
            })

        quality_score = round(
            sum(item["score"] for item in findings) / len(findings) * 100
        ) if findings else 0

        return {
            "title": "Explanation quality",
            "score": quality_score,
            "score_label": (
                "Strong writing signals" if quality_score >= 70
                else "Mixed writing signals" if quality_score >= 50
                else "More detail recommended"
            ),
            "overall": (
                "Well explained" if quality_score >= 70
                else "Partly explained" if quality_score >= 50
                else "Could be clearer"
            ),
            "dimensions": findings,
            "notice": (
                "AI writing feedback is not proof about what happened. The consistency check "
                "can miss contradictions or flag wording incorrectly. This feature cannot "
                "determine whether an explanation is true or whether someone is lying."
            ),
        }


explanation_quality_service = ExplanationQualityService()
