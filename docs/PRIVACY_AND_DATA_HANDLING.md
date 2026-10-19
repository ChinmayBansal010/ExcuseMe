# Privacy and data handling

## Text submitted for analysis

Text entered into the application is sent to the configured backend for processing. Depending on the selected operation, the backend may invoke pretrained NLP models and may download model files on first use. Do not submit passwords, access tokens, private medical details, financial identifiers, or other sensitive content unless the deployment has been reviewed and approved for that data.

## Logging

Avoid logging full user passages by default. Prefer request IDs, operation names, input lengths, timings, and sanitized error summaries. If text-level logging is introduced for debugging, make it opt-in, time-limited, access-controlled, and documented.

## Local persistence

The recent-analysis list in the mobile screen is in-memory UI state and is not durable history. Any future persistent history feature should be opt-in, explain where content is stored, provide a clear-delete action, and avoid cloud synchronization by default.

## Deployment checklist

- Configure HTTPS for non-local deployments.
- Restrict CORS origins to actual frontend origins.
- Add authentication and request throttling before exposing the API publicly.
- Set payload and request-time limits at proxy and application layers.
- Keep secrets out of source control and client-side environment variables.
- Establish retention policies for logs and generated artifacts.
- Review model and dataset licences before commercial or public use.
