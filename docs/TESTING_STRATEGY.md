# Testing strategy

## Fast unit tests

Test schema validation, text chunking, output formatting, calibration math, and error handling without downloading model weights. Use fake pipelines and deterministic vectors to isolate application behavior.

## API contract tests

Use FastAPI TestClient to verify route status codes, required response keys, input bounds, and error shapes. Mock model services for tests that should not depend on remote model repositories or GPU hardware.

## Model evaluation

Keep model quality evaluation separate from API contract tests. Use a versioned labelled dataset and a held-out split. Track false positives and false negatives, not only aggregate accuracy. Do not treat a passing test suite as evidence that the pretrained model is accurate for a new domain.

## Frontend validation

Run TypeScript checks and manually inspect web and mobile layouts. Verify light/dark themes, narrow viewport behavior, validation errors, loading states, network failures, and result rendering.

## Continuous integration

CI should install pinned or bounded dependencies, run backend tests and frontend typechecking, and report failures clearly. Model-download-heavy tests should use explicit caching or a separate workflow.
