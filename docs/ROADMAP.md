# Build roadmap

## Phase 1 — Foundation (included)
- FastAPI app and API schemas
- Lazy-loaded spaCy / Transformers operations
- Semantic similarity endpoint
- FineWeb streaming ingestion and local semantic search
- Expo React Native interface with analysis, compare, and corpus tabs
- API smoke tests

## Phase 2 — Verify locally
1. Install backend dependencies on Windows.
2. Start FastAPI and check `/docs`.
3. Test `/api/v1/analyze` with a short input.
4. Start Expo and configure `EXPO_PUBLIC_API_URL`.
5. Verify API connectivity from emulator or phone.

## Phase 3 — Model evaluation
- Add dataset-specific benchmark tests for each selected model.
- Record model versions, dataset licences, precision/recall/F1 and known failure cases.
- Keep evaluation data separate from any tuning data.

## Phase 4 — Improve retrieval
- Add batched vector storage and ANN indexing (FAISS/Chroma) if local corpus grows.
- Add corpus source/date metadata and filtering.
- Add ingestion deduplication and content-quality checks.

## Phase 5 — Production hardening
- Restrict CORS for deployment.
- Add rate limits, request timeouts, background jobs, and model warmup.
- Add persisted analysis history only if explicitly desired.
- Add authentication only if deploying for multiple users.
