# API error response contract

The FastAPI service uses standard HTTP status codes and JSON response bodies.

| Status | Meaning | Client behavior |
|---|---|---|
| 200 | Request completed | Render returned result |
| 422 | Request validation failed or input is invalid | Show detail and preserve input |
| 503 | Required model or retrieval service is unavailable | Explain temporary unavailability |
| 500 | Unexpected processing failure | Show a generic message; keep stack traces in server logs |

FastAPI validation errors may return detail as an array of objects, while application errors commonly return a string. Clients should support both shapes and must not assume every response is valid JSON.

Do not expose tracebacks, environment variables, local filesystem paths, or secrets in user-facing error messages. Error details should help users recover without revealing deployment internals.
