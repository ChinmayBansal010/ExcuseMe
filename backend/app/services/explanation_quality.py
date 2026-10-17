from __future__ import annotations

from typing import Any

from app.core.config import ZERO_SHOT_MODEL
from app.services.nlp_service import nlp_service


class ExplanationQualityService:
    """Estimate whether a passage functions as an excuse, not whether it is true."""

    EXCUSE_LABEL = (
        "The text gives an excuse or justification for an action, absence, "
        "delay, mistake, or failure."
    )
    NOT_EXCUSE_LABEL = (
        "The text does not give an excuse or justification; it is ordinary "
        "information, a question, an instruction, or unrelated text."
    )

    def analyze(self, text: str) -> dict[str, Any]:
        model = nlp_service._get_pipeline(
            "zero_shot", "zero-shot-classification", ZERO_SHOT_MODEL
        )
        output = model(
            text,
            candidate_labels=[self.EXCUSE_LABEL, self.NOT_EXCUSE_LABEL],
            multi_label=False,
            truncation=True,
        )
        ranked = list(zip(output.get("labels", []), output.get("scores", [])))
        if not ranked:
            raise RuntimeError("The excuse classification model returned no assessment.")

        excuse_score = next(
            (float(score) for label, score in ranked if label == self.EXCUSE_LABEL),
            0.0,
        )
        excuse_score = max(0.0, min(1.0, excuse_score))
        percentage = round(excuse_score * 100)
        prediction = "Likely an excuse" if excuse_score >= 0.5 else "Unlikely to be an excuse"

        return {
            "title": "Excuse likelihood",
            "score": percentage,
            "score_label": f"{percentage}% likely to be an excuse",
            "overall": prediction,
            "prediction": prediction,
            "notice": (
                "This is a zero-shot model estimate of whether the text functions as an excuse. "
                "It is not a calibrated probability and does not determine whether the explanation "
                "is true, false, or intentionally deceptive."
            ),
        }


explanation_quality_service = ExplanationQualityService()
