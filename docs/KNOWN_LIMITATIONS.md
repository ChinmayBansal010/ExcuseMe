# Known limitations

## Model behavior

- Pretrained NLP models may misclassify ambiguous, short, multilingual, sarcastic, or domain-specific text.
- Zero-shot scores depend on label phrasing and the model's training distribution.
- Without a fitted and validated calibrator, the excuse score is an uncalibrated model score, not a probability.
- A calibrated score is only as reliable as its labels, split strategy, sample size, and match to the intended deployment domain.
- Semantic similarity measures embedding proximity; it does not prove that two passages are equivalent.

## Product behavior

- The recent-analysis list currently exists in component state and resets when the app is restarted.
- The API may take time on the first request while model weights download and initialize.
- The local corpus index is optional and must be populated separately before corpus search can return useful results.
- The frontend API URL must match the current runtime: browser, Android emulator, physical device, or deployment.

## Responsible use

ExcuseMoi analyzes text patterns. It cannot determine whether a person is lying, whether a stated reason is true, or what the writer intended. Do not use its output as the sole basis for consequential decisions.
