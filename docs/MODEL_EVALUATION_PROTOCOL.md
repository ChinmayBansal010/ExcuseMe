# NLP model evaluation protocol

## Evaluation data

Create a versioned dataset with one row per example, a stable example ID, input text, intended label, source/domain, and annotation notes. Remove personal information and near-duplicates where possible. Document how examples were sampled.

## Annotation

Write a label guide before annotation. Include positive, negative, ambiguous, and out-of-domain cases. Use at least two annotators for subjective labels where practical, measure agreement, and adjudicate disagreements.

## Splits

Split by source, author, conversation, or time when related examples could otherwise leak across train and test sets. Keep the final test set untouched until the model and threshold are fixed. Do not report training-set performance as generalization.

## Metrics

For classification, report class counts, precision, recall, F1, confusion matrix, ROC AUC where appropriate, and confidence intervals when sample size permits. For probabilities, additionally report Brier score, log loss, and calibration error. Include a majority-class baseline and inspect false positives and false negatives.

## Reproducibility

Record model identifiers, library versions, preprocessing, label wording, random seeds, dataset version, thresholds, hardware, and evaluation command. Publish limitations and avoid claiming broad accuracy from a small or unrepresentative sample.
