# OriginX

OriginX is a full-stack misinformation analysis platform:

- Backend: FastAPI services for claim verification, domain security checks, and propagation analysis.
- Frontend: React + Vite dashboard connected directly to backend APIs.

The frontend and backend are now connected and running with live data flow:

- Verify Claim page calls backend claim-verification APIs.
- URL Investigation page calls backend domain + Reddit propagation APIs.
- URL Investigation auto-refreshes backend results every 30 seconds for real-time monitoring.

## Project Structure

- backend/: FastAPI application, services, tests, SQL setup scripts.
- backend/app/: API routes, business logic, and configuration.
- backend/sql/: Supabase schema and policy setup.
- backend/tests/: Automated backend test suite.
- frontend/: React/Vite application.
- frontend/src/app/pages/: Main user pages, including Verify Claim and URL Investigation.

## Prerequisites

- Python 3.11+
- Node.js 18+ (Node.js 20 LTS recommended)
- npm 9+
- Supabase project credentials (for database-backed features)

## 1) Backend Setup

From the repository root:

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create backend/.env from backend/.env.example and set required values:

- SUPABASE_URL
- SUPABASE_KEY

Optional but recommended for frontend integration:

- BACKEND_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

Run backend:

```bash
uvicorn app.main:app --reload
```

Backend URL: http://127.0.0.1:8000

## 2) Frontend Setup

Open another terminal from repository root:

```bash
cd frontend
npm install
```

Create frontend/.env from frontend/.env.example:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Run frontend:

```bash
npm run dev
```

Frontend URL (default): http://localhost:5173

## Real-Time Integration Behavior

- Verify Claim (frontend -> POST /verify-claim)
  - Sends claim text to backend.
  - Receives verdict, credibility score, summary, and evidence sources.
  - Displays backend warnings/errors in UI.

- URL Investigation (frontend -> POST /analysis/domain-security and /analysis/reddit-propagation)
  - Runs live domain security and propagation checks.
  - Renders backend propagation graph data.
  - Automatically refreshes every 30 seconds while page is active.

## Health Check

```text
GET http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "OriginX backend running"
}
```

## Database Setup (Supabase)

Run SQL in Supabase SQL Editor:

- backend/sql/init_supabase.sql

## Running Tests

Backend tests:

```bash
cd backend
pytest -q
```

## API Docs

When backend is running:

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
