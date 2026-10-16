# ExcuseMoi — Text Studio

**Project:** *ExcuseMoi: Computational Analysis of Linguistic Deception and Excuse Plausibility*

A full-stack React Native (Expo) + FastAPI application for exploring text through multiple NLP operations. The app combines pretrained models and classical linguistic analysis. It does **not** claim to determine whether a real person is lying.

## Capabilities

- Language identification
- Text statistics and readability
- Sentence splitting and tokenization
- Part-of-speech tagging and dependency parsing
- Named-entity recognition
- Keyword extraction with TF-IDF
- Sentiment analysis
- Emotion classification
- Zero-shot classification using user-supplied labels
- Abstractive summarization
- Semantic similarity between two texts
- Side-by-side text metrics, including word, sentence, character and readability differences
- Shareable JSON analysis results
- Text embeddings
- Excuse structure score based on explicit linguistic components (not a truth/lie probability)
- Excuse analysis: linguistic cues, not a truth verdict
- Optional large-corpus semantic retrieval using streamed FineWeb samples

The transformer operations use public pretrained models. They are not all trained by this project. The optional FineWeb component retrieves related passages from a local sampled index; it does not train the NLP models.

## Architecture

```text
React Native / Expo
        |
        | HTTP JSON
        v
FastAPI backend
  ├── spaCy linguistic pipeline
  ├── Transformers pipelines (lazy-loaded)
  ├── Sentence Transformers embeddings
  ├── SQLite retrieval store
  └── FineWeb streaming/indexing script
```

## Dataset and corpus

FineWeb is a very large public web-text corpus. Its full release is on the order of 15 trillion tokens, so downloading or training on all of it locally is not realistic for a one-week project. The ingestion script uses Hugging Face streaming and indexes a configurable sample. Hugging Face documents streaming specifically for datasets too large to download in full: https://huggingface.co/docs/datasets/stream

Dataset: https://huggingface.co/datasets/HuggingFaceFW/fineweb

Important: FineWeb is general web text, not a labelled deception corpus. It is used for semantic retrieval/context examples, not as labels for honesty/deception. If you need a supervised credibility model, it requires task-appropriate labelled data and a separate evaluation.

## GPU acceleration and cross-platform setup

Transformer inference and semantic embeddings automatically use the first NVIDIA CUDA GPU when PyTorch detects one; otherwise they safely fall back to CPU. The API reports the selected device in transformer-operation results. spaCy parsing and TF-IDF/statistics operations are CPU-based; GPU acceleration applies to the Transformer and Sentence Transformer models.

### NVIDIA GPU setup (Windows or Fedora Linux)

1. Install a current NVIDIA driver for your operating system and reboot if required.
2. Create and activate the backend virtual environment, then install a CUDA-enabled PyTorch build **before** installing the remaining requirements.

Windows PowerShell, from the repository root:

```powershell
py -3.11 -m venv backend/.venv
.\backend\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cu128
python -m pip install -r backend/requirements.txt
python -m spacy download en_core_web_sm
```

Fedora Linux, from the repository root:

```bash
python3.11 -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install torch --index-url https://download.pytorch.org/whl/cu128
python -m pip install -r backend/requirements.txt
python -m spacy download en_core_web_sm
```

Verify GPU access in the same activated environment:

```bash
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU fallback')"
```

If `CUDA available` is `False`, check the NVIDIA driver, Python environment, and installed PyTorch build. Do not install the full CUDA Toolkit solely for PyTorch pip wheels; install it only if another workflow specifically requires it. CUDA support requires a compatible NVIDIA GPU and driver. AMD GPUs and systems without a supported CUDA device use CPU automatically.

For CPU-only machines, skip the CUDA PyTorch command and install the regular requirements. The application remains usable, but transformer inference can be slower.

### Fedora Linux notes

Install Python 3.11, Node.js LTS, and Git using Fedora's package manager or approved repositories. Keep the backend virtual environment separate from the Expo frontend's Node dependencies. If Fedora's system Python is externally managed, always install Python packages inside the virtual environment rather than using system-wide pip.

## Windows setup

### 1. Backend

Use Python 3.11 or 3.12. Open PowerShell in `backend`:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger API docs: http://127.0.0.1:8000/docs

The first model operation may download pretrained model files. Start with the smaller operations before trying summarization.

### 2. Mobile app

Install Node.js LTS. In a second terminal, open `mobile`:

```powershell
npm install
```

Set `EXPO_PUBLIC_API_URL` to the backend address:
- Android emulator: `http://10.0.2.2:8000`
- iOS simulator: `http://127.0.0.1:8000`
- Physical phone: use your computer's LAN IP, e.g. `http://192.168.1.10:8000`

For PowerShell:
```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.10:8000"
npx expo start
```

Ensure the phone and computer are on the same network and Windows Firewall allows port 8000.

### 3. Optional corpus indexing

In the backend virtual environment:

```powershell
python scripts/index_fineweb.py --max-docs 5000
```

This streams a sample of FineWeb, embeds the documents, and stores them in SQLite. It needs internet access and may take time. Increase `--max-docs` gradually. This is not required to run the core NLP tools.

### 4. Tests

```powershell
pytest
```

## API

- `GET /health`
- `GET /api/v1/tools`
- `POST /api/v1/analyze`
- `POST /api/v1/similarity` — cosine similarity between two passages
- `POST /api/v1/compare` — similarity plus side-by-side text metrics and B-minus-A differences
- `POST /api/v1/search-corpus`

Example request:

```json
{
  "text": "I couldn't submit the assignment because my laptop crashed.",
  "operations": ["stats", "sentiment", "emotion", "entities", "keywords", "pos", "excuse"]
}
```

## Scientific limitations

- Model confidence is not the same as real-world certainty.
- Emotion, sentiment, zero-shot labels, and summarization can be wrong.
- The excuse analysis endpoint reports linguistic signals and ambiguity only; it does not assign a reliable lie probability.
- FineWeb is a general corpus and may contain bias, low-quality pages, and harmful material.
- Verify model and dataset licences before redistribution or publication.
