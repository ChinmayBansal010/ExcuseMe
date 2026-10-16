from __future__ import annotations

import json
import sqlite3
import threading
from pathlib import Path
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import DATABASE_PATH, EMBEDDING_MODEL

class CorpusService:
    def __init__(self) -> None:
        self.db_path = Path(DATABASE_PATH)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._model = None
        self._model_lock = threading.Lock()
        self._initialize()

    def _connect(self):
        connection = sqlite3.connect(self.db_path)
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    def _initialize(self) -> None:
        with self._connect() as con:
            con.execute(
                """
                CREATE TABLE IF NOT EXISTS passages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_id TEXT,
                    text TEXT NOT NULL,
                    embedding BLOB NOT NULL,
                    dimension INTEGER NOT NULL
                )
                """
            )
            con.execute("CREATE INDEX IF NOT EXISTS idx_passages_source ON passages(source_id)")

    def _get_model(self):
        if self._model is None:
            with self._model_lock:
                if self._model is None:
                    self._model = SentenceTransformer(EMBEDDING_MODEL)
        return self._model

    def add_passages(self, passages: list[dict[str, str]], batch_size: int = 64) -> int:
        if not passages:
            return 0
        model = self._get_model()
        texts = [item["text"].strip() for item in passages if item.get("text", "").strip()]
        source_ids = [item.get("source_id", "") for item in passages if item.get("text", "").strip()]
        if not texts:
            return 0
        embeddings = model.encode(
            texts, batch_size=batch_size, normalize_embeddings=True,
            show_progress_bar=True, convert_to_numpy=True
        )
        with self._connect() as con:
            con.executemany(
                "INSERT INTO passages(source_id, text, embedding, dimension) VALUES (?, ?, ?, ?)",
                [
                    (source_ids[i], texts[i], embeddings[i].astype(np.float32).tobytes(), int(embeddings.shape[1]))
                    for i in range(len(texts))
                ],
            )
        return len(texts)

    def search(self, query: str, top_k: int = 5) -> dict[str, Any]:
        model = self._get_model()
        query_embedding = model.encode([query], normalize_embeddings=True, convert_to_numpy=True)[0]
        with self._connect() as con:
            rows = con.execute(
                "SELECT id, source_id, text, embedding, dimension FROM passages"
            ).fetchall()
        if not rows:
            return {
                "results": [],
                "message": "The local corpus index is empty. Run scripts/index_fineweb.py first.",
                "indexed_passages": 0,
            }
        valid_rows = []
        vectors = []
        for row_id, source_id, text, blob, dimension in rows:
            vector = np.frombuffer(blob, dtype=np.float32)
            if dimension != query_embedding.shape[0] or vector.shape[0] != query_embedding.shape[0]:
                continue
            valid_rows.append((row_id, source_id, text))
            vectors.append(vector)

        if not vectors:
            return {
                "results": [],
                "message": "No indexed passages match the configured embedding dimension.",
                "indexed_passages": len(rows),
                "model": EMBEDDING_MODEL,
            }

        scores = np.vstack(vectors) @ query_embedding
        top_indices = np.argsort(scores)[::-1][:top_k]
        results = [
            {
                "id": valid_rows[index][0],
                "source_id": valid_rows[index][1],
                "text": valid_rows[index][2],
                "similarity": round(float(scores[index]), 4),
            }
            for index in top_indices
        ]
        return {"results": results, "indexed_passages": len(rows), "model": EMBEDDING_MODEL}


corpus_service = CorpusService()
