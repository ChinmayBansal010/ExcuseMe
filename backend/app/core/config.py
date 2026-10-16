import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

SENTIMENT_MODEL = os.getenv(
    "SENTIMENT_MODEL",
    "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
)
EMOTION_MODEL = os.getenv(
    "EMOTION_MODEL",
    "j-hartmann/emotion-english-distilroberta-base",
)
ZERO_SHOT_MODEL = os.getenv("ZERO_SHOT_MODEL", "facebook/bart-large-mnli")
SUMMARIZATION_MODEL = os.getenv(
    "SUMMARIZATION_MODEL", "sshleifer/distilbart-cnn-12-6"
)
EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"
)
SPACY_MODEL = os.getenv("SPACY_MODEL", "en_core_web_sm")
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DATA_DIR / "corpus.sqlite3")))
MAX_TEXT_CHARS = int(os.getenv("MAX_TEXT_CHARS", "20000"))
