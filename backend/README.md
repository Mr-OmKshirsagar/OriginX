# TruthSeeker Backend

Backend foundation for the TruthSeeker project using FastAPI.

## Setup

1. Create and activate a Python virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server:

```bash
uvicorn app.main:app --reload
```

## Supabase Credentials

Put your Supabase credentials in `backend/.env`.

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-key
```

You can use `backend/.env.example` as the template.

Value mapping from Supabase dashboard:

- Project URL -> `SUPABASE_URL`
- API Key (`anon public`) -> `SUPABASE_KEY`

Optional direct PostgreSQL connection (bypasses anon RLS path):

- `SUPABASE_USE_DIRECT_DB=true` -> explicitly enable direct DB mode.
- `SUPABASE_DIRECT_DB_URL` -> use the Connection String from Supabase Database settings.
- If your password contains special characters like `#`, `+`, `$`, URL-encode it in the URI.
- If `db.<project-ref>.supabase.co` does not resolve on your network, use the Supabase Connection Pooler URI (IPv4-friendly) instead.

If `SUPABASE_USE_DIRECT_DB` is not set to `true`, the backend uses the Supabase REST API path by default.

## Database Schema Setup (Supabase)

Run `backend/sql/init_supabase.sql` in Supabase SQL Editor to create required tables:

- `claims`
- `verification_history`

## Test Database Connection

1. Start server:

```bash
uvicorn app.main:app --reload
```

2. Verify API is alive:

```text
GET http://127.0.0.1:8000/health
```

3. Verify Supabase connectivity:

```text
GET http://127.0.0.1:8000/test-db/status
```

Expected success:

```json
{
  "connected": true,
  "message": "Supabase REST endpoint reachable"
}
```

4. Verify Supabase insert connection:

```text
POST http://127.0.0.1:8000/test-db
Content-Type: application/json

{
  "claim_text": "Test claim"
}
```

If connection is successful, response returns inserted record from `claims` table.
If not, response includes Supabase error details.

5. Verify claim history lookup:

```text
GET http://127.0.0.1:8000/test-db/history?claim_text=Test%20claim
```

Expected success: array of matching rows from `verification_history` (may be empty).

## Health Check

Visit:

```text
http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "TruthSeeker backend running"
}
```
