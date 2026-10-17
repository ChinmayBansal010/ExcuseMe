# ExcuseMoi — NLP Text Studio

**ExcuseMoi** is a full-stack text-analysis workbench built with **React Native, Expo, TypeScript, FastAPI, and Python**. It combines pretrained language models with classical linguistic analysis to help users inspect text structure, sentiment, and semantic similarity.

> **Important limitation:** ExcuseMoi does not detect lies or determine whether a person is telling the truth. The excuse-structure score reflects selected linguistic components only; it is not a credibility score or probability.

## Contents
- [Project overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Windows setup](#windows-setup)
- [Linux setup](#linux-setup)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Optional FineWeb corpus index](#optional-fineweb-corpus-index)
- [Testing and validation](#testing-and-validation)
- [Models and data](#models-and-data)
- [Troubleshooting](#troubleshooting)
- [Limitations and responsible use](#limitations-and-responsible-use)
- [Project documentation](#project-documentation)

## Project overview

The app provides an interactive interface for running one or more NLP operations, viewing structured results, comparing passages, and optionally searching a local semantic index. The frontend communicates with a JSON API served by FastAPI.

Transformer models are pretrained public models; they are not all trained by this repository. The first request for an operation may take longer while model files download and initialize.

## Features

### Linguistic analysis
- Text metrics: character, word, sentence, and paragraph counts; average word and sentence lengths; vocabulary ratio; readability.
- Tokenization, part-of-speech (POS) tagging, lemmas, grammatical tags, stopword flags, and dependency relations.
- Syntax exploration with sentence roots and token dependencies.
- Language identification with alternative language estimates.
- Named-entity recognition.

### Classification and generation
- Sentiment analysis.
- Emotion classification with ranked labels.
- Zero-shot classification using user-provided candidate labels.
- Abstractive summarization for longer passages.
- Keyword extraction using TF-IDF and term frequency.
- Excuse-language cues and a transparent structural completeness score.

### Comparison and retrieval
- Semantic similarity between two passages.
- Side-by-side text metrics and B-minus-A differences.
- Optional semantic search over a locally indexed sample of FineWeb passages.
- Responsive result cards, visual scores, and loading skeletons in the frontend.

## Architecture

```text
mobile/ React Native + Expo + TypeScript
    | HTTP requests / JSON responses
    v
backend/ FastAPI
    ├── spaCy linguistic processing
    ├── Hugging Face Transformers pipelines
    ├── Sentence Transformers embeddings
    ├── TF-IDF / scikit-learn utilities
    └── SQLite semantic passage index
             ^
             | optional streaming/indexing
        FineWeb sample
```

Supported PyTorch transformer pipelines and sentence embeddings use an NVIDIA CUDA GPU when available; otherwise, they fall back to CPU. spaCy, TF-IDF, and basic text-statistics operations remain CPU-based.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React Native, Expo, Expo Router, TypeScript, lucide-react-native |
| API | Python, FastAPI, Uvicorn, Pydantic |
| NLP | spaCy, Hugging Face Transformers, Sentence Transformers, NLTK, langdetect, textstat |
| Data and retrieval | NumPy, scikit-learn, SQLite, Hugging Face Datasets |
| Testing | pytest, FastAPI TestClient, HTTPX |

## Repository layout

```text
.
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Configuration
│   │   ├── schemas/          # Request validation
│   │   └── services/         # NLP and corpus operations
│   ├── scripts/              # Optional corpus indexing
│   ├── tests/                # Backend tests
│   └── requirements.txt      # Python dependencies
├── mobile/
│   ├── app/                  # Expo Router screens
│   ├── src/lib/              # API client
│   └── package.json
├── docs/                     # Additional project documentation
└── README.md
```

Generated files such as the SQLite index, Python virtual environments, and Node dependencies are local artifacts and do not need to be committed.

## Prerequisites

- Git.
- Python **3.11** recommended.
- Node.js LTS and npm.
- Internet access for initial dependency and pretrained-model downloads.
- Optional: compatible NVIDIA GPU and current NVIDIA driver for CUDA acceleration.

Keep backend Python dependencies in a dedicated virtual environment.

## Windows setup

Commands below use **PowerShell** from the repository root.

### 1. Clone the repository

```powershell
git clone https://github.com/ChinmayBansal010/ExcuseMe.git
cd ExcuseMe
```

### 2. Install backend dependencies

```powershell
py -3.11 -m venv backend/.venv
.\backend\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python -m spacy download en_core_web_sm
```

If PowerShell blocks activation, allow it for the current session and activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\backend\.venv\Scripts\Activate.ps1
```

### 3. Run the backend

With the virtual environment active:

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify:
- Health check: http://127.0.0.1:8000/health
- Interactive API docs: http://127.0.0.1:8000/docs
- OpenAPI schema: http://127.0.0.1:8000/openapi.json

Keep the backend terminal open.

### 4. Install and run the frontend

Open a second PowerShell terminal from the repository root:

```powershell
cd mobile
npm install
$env:EXPO_PUBLIC_API_URL="http://127.0.0.1:8000"
npx expo start
```

Press `w` to open web, or run `npm run web`. For Android emulator, set the URL to `http://10.0.2.2:8000`. For a physical phone, use the computer's LAN IP (for example `http://192.168.1.10:8000`); both devices must share a network and the firewall must allow port 8000.

### 5. Verify optional GPU support

Run in the activated backend environment:

```powershell
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA build:', torch.version.cuda); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU fallback')"
nvidia-smi
```

If CUDA is unavailable, check the active Python environment, NVIDIA driver, and compatible GPU. CPU fallback is supported.

## Linux setup

The steps below apply to Fedora and most Linux distributions. Install Python 3.11, Git, Node.js LTS, and npm through your distribution's supported package manager. Package names vary by distribution.

### 1. Clone the repository

```bash
git clone https://github.com/ChinmayBansal010/ExcuseMe.git
cd ExcuseMe
```

### 2. Install backend dependencies

```bash
python3.11 -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt
python -m spacy download en_core_web_sm
```

If `python3.11` is not installed, install a supported Python version compatible with the dependency set. Keep pip installations inside the virtual environment, not system Python.

### 3. Run the backend

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify http://127.0.0.1:8000/health and http://127.0.0.1:8000/docs. Keep this terminal running.

### 4. Install and run the frontend

In a second terminal, from the repository root:

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 npx expo start
```

Press `w` for web or run `npm run web`. For Android emulator, use `http://10.0.2.2:8000`. For a physical phone, use the computer's LAN IP and ensure both devices share a network.

### 5. Verify optional GPU support

```bash
nvidia-smi
python -c "import torch; print('PyTorch:', torch.__version__); print('CUDA build:', torch.version.cuda); print('CUDA available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU fallback')"
```

If CUDA is unavailable, check the NVIDIA driver, compatible GPU, and active virtual environment. CPU fallback remains supported.

## Configuration

### Frontend API URL

The frontend reads `EXPO_PUBLIC_API_URL`. If unset, the API client defaults to `http://10.0.2.2:8000`, which is intended for Android emulators and is usually incorrect for web or physical phones.

| Frontend environment | Example URL |
|---|---|
| Web on the same computer | `http://127.0.0.1:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical phone | `http://<computer-LAN-IP>:8000` |
| Remote deployment | Deployed HTTPS API base URL |

Set the variable before starting Expo. Restart Expo after changing it.

### Backend environment variables

Defaults are defined in `backend/app/core/config.py`.

| Variable | Default / purpose |
|---|---|
| `SENTIMENT_MODEL` | `distilbert/distilbert-base-uncased-finetuned-sst-2-english` |
| `EMOTION_MODEL` | `j-hartmann/emotion-english-distilroberta-base` |
| `ZERO_SHOT_MODEL` | `facebook/bart-large-mnli` |
| `SUMMARIZATION_MODEL` | `sshleifer/distilbart-cnn-12-6` |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` |
| `SPACY_MODEL` | `en_core_web_sm` |
| `DATABASE_PATH` | Defaults to `backend/data/corpus.sqlite3` |
| `MAX_TEXT_CHARS` | `20000` |

Use compatible model identifiers and verify each model's licence, input constraints, and output format before changing defaults.

## API reference

Base URL for local development: `http://127.0.0.1:8000`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Health check |
| GET | `/api/v1/tools` | List supported tools |
| POST | `/api/v1/analyze` | Run one or more NLP operations |
| POST | `/api/v1/similarity` | Semantic similarity for two passages |
| POST | `/api/v1/compare` | Similarity and text-metric differences |
| POST | `/api/v1/search-corpus` | Search the optional local corpus index |

Use Swagger UI at `/docs` to inspect request schemas and try endpoints.

Example analysis request:

```json
{
  "text": "I couldn't submit the assignment because my laptop crashed.",
  "operations": ["stats", "sentiment", "emotion", "entities", "keywords", "pos", "excuse"],
  "labels": []
}
```

Zero-shot classification requires at least two candidate labels. The exact request schema is available through the API docs.

## Optional FineWeb corpus index

Corpus search uses a **local sample index**, not the full FineWeb dataset. It is optional and is not required for core analysis or comparison.

Run from the `backend` directory with the virtual environment active.

Windows PowerShell:
```powershell
python scripts/index_fineweb.py --max-docs 5000
```

Linux:
```bash
python scripts/index_fineweb.py --max-docs 5000
```

Start with a small sample such as `--max-docs 200` to test the workflow. The script streams records, creates embeddings, and stores passages in SQLite. It needs internet access and may take time and disk space. Re-running adds to the local database; back up or remove the local database first if a clean re-index is required.

- Dataset: [HuggingFaceFW/fineweb](https://huggingface.co/datasets/HuggingFaceFW/fineweb)
- Streaming guide: [Hugging Face Datasets streaming](https://huggingface.co/docs/datasets/stream)

FineWeb is general web text, not a labelled deception dataset.

## Testing and validation

Backend tests, from `backend` with the virtual environment active:

```bash
python -m pytest
```

Frontend TypeScript check, from `mobile`:

```bash
npm run typecheck
```

For manual validation, check `/health` and `/docs`, then test a short request before trying larger models. The first model request may need internet access and additional initialization time.

## Models and data

| Component | Default model / dataset | Purpose |
|---|---|---|
| Sentiment | DistilBERT SST-2 | Positive/negative sentiment |
| Emotion | Emotion English DistilRoBERTa | Ranked emotion labels |
| Zero-shot | BART MNLI | Scores candidate labels |
| Summarization | DistilBART CNN | Summarizes longer text |
| Embeddings | all-MiniLM-L6-v2 | Similarity and retrieval |
| Linguistic pipeline | spaCy English small model | POS, syntax, entities, metrics |
| Optional corpus | FineWeb streamed sample | Local semantic retrieval |

Check all model and dataset licence terms before redistribution, commercial use, or publication. These models are not presented as models trained specifically for deception detection.

## Troubleshooting

- **Frontend cannot reach the backend:** Confirm the API is running and check `EXPO_PUBLIC_API_URL` for the current device or browser.
- **Phone cannot connect:** Use the computer's LAN IP, keep both devices on the same network, and allow port 8000 through the firewall.
- **spaCy model missing:** Activate the backend environment and run `python -m spacy download en_core_web_sm`.
- **First request is slow:** Models may download and initialize on first use; start with a short input and a lightweight operation.
- **CUDA unavailable:** Check `nvidia-smi`, the driver, `torch.cuda.is_available()`, and the active Python executable. CPU fallback is expected without a supported GPU.
- **Dependency installation fails:** Confirm Python and virtual environment versions, upgrade pip, and inspect the complete error before changing dependency constraints.
- **Corpus search returns no passages:** Run the optional indexing script and confirm the app is using the database you indexed.

## Limitations and responsible use

- Model outputs and confidence scores can be wrong and are not verified facts.
- Sentiment, emotion, language identification, zero-shot classification, summarization, and entity extraction can fail on short, ambiguous, multilingual, or domain-specific text.
- The excuse-structure score counts selected textual components; it does not estimate honesty, deception, intent, or credibility.
- FineWeb may contain bias, low-quality pages, and harmful content.
- Do not use these outputs alone to make consequential decisions about a person.
- Preserve model and dataset licence notices when redistributing.

## Project documentation

- [Roadmap](docs/ROADMAP.md) — implementation phases and planned work.
- [Interactive API documentation](http://127.0.0.1:8000/docs) — available after starting the backend.
- [Source repository](https://github.com/ChinmayBansal010/ExcuseMe).

## License

No project-level licence file is specified in this repository documentation. Unless a licence is added to the repository, do not assume unrestricted reuse rights.
