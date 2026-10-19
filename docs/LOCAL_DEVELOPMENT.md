# Local development workflow

## Start the backend

Create and activate a Python virtual environment, install backend/requirements.txt, then run:

```bash
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Start the frontend

In a second terminal:

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 npm run web
```

Use http://10.0.2.2:8000 for the Android emulator and the computer's LAN IP for a physical device.

## Validate changes

```bash
cd backend
python -m pytest tests -q
cd ../mobile
npm run typecheck
```

These commands describe checks to run; they are not evidence that checks passed in a given change. Keep model-download-heavy integration checks separate from fast unit tests where possible.
