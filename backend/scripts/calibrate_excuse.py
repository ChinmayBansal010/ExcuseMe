from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.isotonic import IsotonicRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score

from app.services.explanation_quality import ExplanationQualityService


def expected_calibration_error(y_true: np.ndarray, probabilities: np.ndarray, bins: int = 10) -> float:
    edges = np.linspace(0.0, 1.0, bins + 1)
    ece = 0.0
    for index in range(bins):
        if index == bins - 1:
            mask = (probabilities >= edges[index]) & (probabilities <= edges[index + 1])
        else:
            mask = (probabilities >= edges[index]) & (probabilities < edges[index + 1])
        if mask.any():
            ece += float(mask.mean()) * abs(float(y_true[mask].mean()) - float(probabilities[mask].mean()))
    return ece


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fit and evaluate an isotonic calibrator for ExcuseMoi's excuse score."
    )
    parser.add_argument("--csv", required=True, help="CSV with text and label columns")
    parser.add_argument("--text-column", default="text")
    parser.add_argument("--label-column", default="label", help="Labels must be 1=excuse, 0=not excuse")
    parser.add_argument("--test-size", type=float, default=0.25)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--output",
        default=str(ExplanationQualityService.CALIBRATOR_PATH),
        help="Where to save the fitted calibrator",
    )
    args = parser.parse_args()
    if not 0.1 <= args.test_size <= 0.5:
        raise SystemExit("--test-size must be between 0.1 and 0.5.")
    if args.bins if hasattr(args, "bins") else False:
        raise SystemExit("Unexpected calibration argument.")

    frame = pd.read_csv(args.csv)
    if args.text_column not in frame or args.label_column not in frame:
        raise SystemExit(
            f"CSV must contain columns {args.text_column!r} and {args.label_column!r}."
        )
    frame = frame[[args.text_column, args.label_column]].dropna().copy()
    frame[args.text_column] = frame[args.text_column].astype(str).str.strip()
    frame = frame.drop_duplicates(subset=[args.text_column], keep="first")
    frame = frame[frame[args.text_column].str.len() > 0]
    try:
        numeric_labels = pd.to_numeric(frame[args.label_column], errors="raise")
    except (TypeError, ValueError) as exc:
        raise SystemExit("Labels must be numeric binary values: 1=excuse and 0=not excuse.") from exc
    if not np.all(np.equal(numeric_labels, np.floor(numeric_labels))):
        raise SystemExit("Labels must be integers: 1=excuse and 0=not excuse.")
    frame[args.label_column] = numeric_labels.astype(int)
    if not set(frame[args.label_column].unique()).issubset({0, 1}):
        raise SystemExit("Labels must be binary: 1=excuse and 0=not excuse.")
    if frame[args.label_column].nunique() != 2 or frame[args.label_column].value_counts().min() < 4:
        raise SystemExit("Provide at least four examples of each class; more labelled examples are strongly recommended.")
    if len(frame) < 40:
        raise SystemExit("At least 40 labelled examples are required for this script; 200+ diverse examples are recommended.")

    if frame[args.text_column].nunique() < 10:
        raise SystemExit("Provide at least 10 distinct text examples after removing duplicates.")
    texts = frame[args.text_column].tolist()
    labels = frame[args.label_column].to_numpy()
    train_indices, test_indices = train_test_split(
        np.arange(len(frame)),
        test_size=args.test_size,
        random_state=args.seed,
        stratify=labels,
    )

    print(f"Scoring {len(texts)} labelled examples with {__import__('app.core.config', fromlist=['ZERO_SHOT_MODEL']).ZERO_SHOT_MODEL}...")
    raw_scores = np.array([ExplanationQualityService.raw_score(text) for text in texts])
    calibrator = IsotonicRegression(y_min=0.0, y_max=1.0, out_of_bounds="clip")
    calibrator.fit(raw_scores[train_indices], labels[train_indices])
    probabilities = np.clip(calibrator.predict(raw_scores[test_indices]), 1e-7, 1 - 1e-7)
    y_test = labels[test_indices]

    metrics = {
        "train_examples": int(len(train_indices)),
        "test_examples": int(len(test_indices)),
        "test_positive_rate": round(float(y_test.mean()), 4),
        "brier_score": round(float(brier_score_loss(y_test, probabilities)), 4),
        "log_loss": round(float(log_loss(y_test, probabilities, labels=[0, 1])), 4),
        "expected_calibration_error_10_bins": round(expected_calibration_error(y_test, probabilities), 4),
        "roc_auc": round(float(roc_auc_score(y_test, raw_scores[test_indices])), 4),
        "warning": "Metrics are meaningful only when labels are reliable and the test set is representative. A small test set yields noisy estimates.",
    }
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(calibrator, output_path)
    metrics_path = output_path.with_suffix(".metrics.json")
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"calibrator": str(output_path), "metrics_file": str(metrics_path), "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()
