from __future__ import annotations

import argparse
import sys
from pathlib import Path

from datasets import load_dataset

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.services.corpus_service import corpus_service

DATASET_ID = "HuggingFaceFW/fineweb"

def main():
    parser = argparse.ArgumentParser(
        description="Stream and index a configurable sample of FineWeb passages."
    )
    parser.add_argument("--max-docs", type=int, default=5000)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--min-chars", type=int, default=120)
    parser.add_argument("--max-chars", type=int, default=1600)
    args = parser.parse_args()

    if args.max_docs < 1:
        parser.error("--max-docs must be at least 1")

    print(f"Streaming dataset: {DATASET_ID}")
    print(f"Maximum passages to index: {args.max_docs:,}")
    print("This streams records; it does not download the full FineWeb release.")

    try:
        dataset = load_dataset(DATASET_ID, "sample-10BT", split="train", streaming=True)
        batch = []
        indexed = 0
        seen = 0

        for row in dataset:
            seen += 1
            text = str(row.get("text", "")).strip()
            if len(text) < args.min_chars:
                continue

            # Index excerpts rather than arbitrarily long pages.
            text = text[:args.max_chars]
            source_id = str(row.get("id", row.get("url", seen)))
            batch.append({"source_id": source_id, "text": text})

            if len(batch) >= args.batch_size:
                remaining = args.max_docs - indexed
                batch_to_add = batch[:remaining]
                indexed += corpus_service.add_passages(batch_to_add, batch_size=args.batch_size)
                print(f"Indexed {indexed:,}/{args.max_docs:,} passages (streamed {seen:,} records)")
                batch = []
                if indexed >= args.max_docs:
                    break

        if batch and indexed < args.max_docs:
            batch = batch[: args.max_docs - indexed]
            indexed += corpus_service.add_passages(batch, batch_size=args.batch_size)

        print(f"Done. Indexed {indexed:,} passages from {seen:,} streamed records.")
        print("Indexing a sample is not equivalent to training on the full corpus.")
    except Exception as exc:
        print(f"Indexing failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
