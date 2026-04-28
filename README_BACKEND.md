Backend FastAPI for WANIWA

Run locally:

python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8000

Endpoints:
POST /api/submit
GET /api/items
GET /api/export
POST /api/analyze
