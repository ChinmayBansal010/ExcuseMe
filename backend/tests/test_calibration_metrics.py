import numpy as np
from app.core.config import ZERO_SHOT_MODEL
from app.services.explanation_quality import ExplanationQualityService
from app.scripts.calibrate_excuse import expected_calibration_error

def test_perfectly_calibrated_single_bin_has_zero_error():
    labels = np.array([0, 0, 1, 1])
    probabilities = np.array([0.0, 0.0, 1.0, 1.0])
    assert expected_calibration_error(labels, probabilities, bins=2) == 0.0

def test_calibration_error_is_nonnegative():
    labels = np.array([0, 1, 0, 1])
    probabilities = np.array([0.2, 0.7, 0.8, 0.4])
    assert expected_calibration_error(labels, probabilities) >= 0.0

def test_excuse_model_labels_are_distinct():
    labels = {
        ExplanationQualityService.EXCUSE_LABEL,
        ExplanationQualityService.NEUTRAL_LABEL,
        ExplanationQualityService.OTHER_LABEL,
    }
    assert len(labels) == 3
    assert ZERO_SHOT_MODEL
