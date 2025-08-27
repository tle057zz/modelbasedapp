# AI Chat App (Flask + React)

Modern chat UI built with React, served by a Flask backend. The backend exposes a simple `/api/send` endpoint that can call a local LLM when enabled.

## Project structure

```
modelbasedapp/
├─ app.py                   # Flask app (serves React build from dist/ when present)
├─ requirements.txt         # Python deps (pinned for deployment)
├─ package.json             # Frontend scripts and deps
├─ webpack.config.js        # Builds React into dist/
├─ public/
│  └─ index.html            # HTML template used by webpack
├─ src/                     # React app source
│  ├─ App.js
│  ├─ index.js
│  └─ components/
│     ├─ ChatInterface.js
│     ├─ LoadingIndicator.js
│     └─ MessageBubble.js
├─ templates/               # Flask fallback (no React build)
│  ├─ html/index.html
│  ├─ css/style.css
│  └─ js/app.js
└─ py_functions/
   └─ api_llm.py            # Optional local LLM helper (heavy to load)
```

## Quick start (local)

Prereqs:
- Python 3.9+
- Node.js 18+ (only needed if you edit the React app)

1) Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2) Install Python dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

3a) Run with the prebuilt React bundle (recommended)

```bash
# If you plan to edit React, build it once:
npm install
npm run build   # outputs to dist/

# Start Flask
source .venv/bin/activate
python app.py

# Open http://127.0.0.1:5000
```

3b) React dev mode with hot reload (optional)

```bash
# Terminal A - backend
source .venv/bin/activate
python app.py

# Terminal B - frontend dev server on http://localhost:3000
npm install
npm run dev
# Requests to /api are proxied to http://127.0.0.1:5000
```

## Model loading toggle

By default the heavy local LLM is disabled to keep startup fast.

```bash
# Enable model (may take time and memory):
export LOAD_LLM=1
python app.py
```

When disabled (`LOAD_LLM` unset or `0`), the API returns a small demo reply so the UI remains responsive.

## Common issues

- Port 5000 already in use:
```bash
lsof -nP -iTCP:5000 -sTCP:LISTEN -t | xargs -r kill -9
```
- npm not found (macOS): `brew install node`

## Deploy (Render/Heroku-like)

- Start command:
```
gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120
```
- Build command (builds React bundle):
```
pip install --upgrade pip && pip install -r requirements.txt && npm ci && npm run build
```
- Recommended env vars:
```
PYTHONUNBUFFERED=1
LOAD_LLM=0
```

## API

- `POST /api/send` with JSON `{ "text": "..." }` → `{ "you": "...", "answer": "..." }`


