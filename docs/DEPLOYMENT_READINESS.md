# Deployment readiness checklist

The default configuration is intended for local development. Do not expose the API publicly without a deployment review.

## Network and access

- [ ] Serve the frontend and API over HTTPS.
- [ ] Replace permissive CORS with explicit trusted origins.
- [ ] Add authentication if the service is not intentionally public.
- [ ] Add rate limits and concurrent inference limits.
- [ ] Place the service behind a reverse proxy with body-size and timeout limits.
- [ ] Confirm health checks do not trigger heavyweight model initialization.

## Runtime and reliability

- [ ] Pin and audit Python and JavaScript dependencies.
- [ ] Record model identifiers and model revisions.
- [ ] Verify model downloads and cache permissions.
- [ ] Configure CPU/GPU memory limits and worker counts for the host.
- [ ] Test startup, shutdown, and recovery after model errors.
- [ ] Monitor latency, request failures, memory use, and GPU utilization without logging raw user text.

## Data and responsible use

- [ ] Define text retention and deletion behavior.
- [ ] Review privacy requirements for the intended audience.
- [ ] Publish score limitations and known failure modes.
- [ ] Evaluate the model on representative held-out examples.
- [ ] Do not describe raw model scores as probabilities.
