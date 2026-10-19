# Environment configuration reference

## Frontend

| Variable | Purpose | Example |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL used by the Expo app | `http://127.0.0.1:8000` |

Expo public variables are bundled into the frontend and must not contain secrets.

## Backend

| Variable | Purpose |
|---|---|
| `SENTIMENT_MODEL` | Hugging Face model identifier for sentiment |
| `EMOTION_MODEL` | Hugging Face model identifier for emotion |
| `ZERO_SHOT_MODEL` | Hugging Face model identifier for zero-shot classification |
| `SUMMARIZATION_MODEL` | Hugging Face model identifier for summarization |
| `EMBEDDING_MODEL` | Sentence-transformer model identifier |
| `SPACY_MODEL` | spaCy pipeline package name |
| `DATABASE_PATH` | SQLite corpus database path |
| `MAX_TEXT_CHARS` | Configured text-length limit |

Changing model identifiers can change output labels, score distributions, memory requirements, and latency. Evaluate changes before deployment. The API request schema currently enforces its own text-size bound; changing the environment variable alone does not automatically alter every schema constraint.
