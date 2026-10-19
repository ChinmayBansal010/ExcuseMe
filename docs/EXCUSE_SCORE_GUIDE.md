# Excuse-language score: interpretation guide

## What the score means

ExcuseMoi evaluates linguistic patterns that may occur in excuses or justifications. A model score is a model output, not a calibrated probability unless a calibration model has been fitted and validated on representative labelled examples.

The output does not establish whether a statement is true, whether the speaker is honest, or why a person wrote it. A factual sentence can be an excuse in one context and a neutral report in another.

## How to use the result

1. Read the original text before interpreting any score.
2. Treat the score as a prompt for closer reading, not a verdict.
3. Consider context and alternative explanations separately.
4. Do not use the output alone to make consequential decisions about a person.
5. When the output is surprising, compare it with neutral and excuse-like examples and record the error for evaluation.

## Why neutral texts can score highly

Zero-shot classification compares text against candidate descriptions. It may respond to explanations, causal phrases, future commitments, or references to a problem even when the text is simply reporting facts. Label wording and model domain can materially affect the score.

## Calibration

A defensible probability requires labelled examples sampled from the intended use case, a held-out evaluation set, and calibration metrics. Avoid tuning and evaluating on the same examples. Report class balance, Brier score, log loss, expected calibration error, and ROC AUC where appropriate. Calibration cannot fix an unrepresentative dataset or ambiguous labels.

See the backend calibration guide for the repository workflow.
