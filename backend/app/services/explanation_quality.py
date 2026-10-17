from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib

from app.core.config import DATA_DIR, ZERO_SHOT_MODEL
from app.services.nlp_service import nlp_service


class ExplanationQualityService:
    """Estimate whether a passage functions as an excuse, not whether it is true."""

    EXCUSE_LABEL = (
        "an excuse or justification for an action, absence, delay, mistake, or failure"
    )
    NEUTRAL_LABEL = "a neutral factual statement with no excuse or justification"
    OTHER_LABEL = (
        "a question, instruction, or unrelated statement that does not function as an excuse"
    )
    CALIBRATOR_PATH = DATA_DIR / "excuse_probability_calibrator.joblib"

    def __init__(self) -> None:
        self._calibrator: Any = None
        self._calibrator_loaded = False

    def _get_calibrator(self):
        if not self._calibrator_loaded:
            self._calibrator_loaded = True
            if self.CALIBRATOR_PATH.is_file():
                try:
                    self._calibrator = joblib.load(self.CALIBRATOR_PATH)
                except (OSError, ValueError, EOFError):
                    self._calibrator = None
        return self._calibrator

    @classmethod
    def raw_score(cls, text: str) -> float:
        model = nlp_service._get_pipeline(
            "zero_shot", "zero-shot-classification", ZERO_SHOT_MODEL
        )
        output = model(
            text,
            candidate_labels=[
                cls.EXCUSE_LABEL,
                cls.NEUTRAL_LABEL,
                cls.OTHER_LABEL,
            ],
            hypothesis_template="This text is {}.",
            multi_label=False,
            truncation=True,
        )
        ranked = list(zip(output.get("labels", []), output.get("scores", [])))
        if not ranked:
            raise RuntimeError("The excuse classification model returned no assessment.")
        return max(
            0.0,
            min(
                1.0,
                next(
                    (float(score) for label, score in ranked if label == cls.EXCUSE_LABEL),
                    0.0,
                ),
            ),
        )

    def analyze(self, text: str) -> dict[str, Any]:
        raw_score = self.raw_score(text)
        calibrator = self._get_calibrator()
        calibrated = calibrator.predict([raw_score])[0] if calibrator is not None else None
        score = float(calibrated) if calibrated is not None else raw_score
        score = max(0.0, min(1.0, score))
        percentage = round(score * 100)
        prediction = "Likely an excuse" if score >= 0.5 else "Unlikely to be an excuse"
        is_calibrated = calibrator is not None

        return {
            "title": "Excuse likelihood",
            "score": percentage,
            "score_label": (
                f"{percentage}% estimated probability of being an excuse"
                if is_calibrated
                else f"{percentage}% model score — calibration not fitted"
            ),
            "overall": prediction,
            "prediction": prediction,
            "calibrated": is_calibrated,
            "notice": (
                "Calibrated on a held-out set of human-labelled excuse and non-excuse examples. "
                "This estimates whether the text functions as an excuse; it does not determine "
                "whether the excuse is true or whether someone is lying."
                if is_calibrated
                else "This percentage is an uncalibrated zero-shot model score, not a reliable "
                "probability. Treat it as a rough estimate of whether the text functions as an "
                "excuse. It does not determine whether the excuse is true or whether someone is lying."
            ),
        }


explanation_quality_service = ExplanationQualityService()
