from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.claims_service import get_claim_history, insert_claim
from app.services.supabase_client import check_supabase_connection

router = APIRouter()


class ClaimRequest(BaseModel):
    claim_text: str = Field(min_length=1)


@router.get("/test-db/status")
def db_status() -> dict[str, str | bool]:
    ok, message = check_supabase_connection()
    if not ok:
        raise HTTPException(status_code=503, detail=message)

    return {"connected": True, "message": message}


@router.post("/test-db")
def db_insert(payload: ClaimRequest) -> dict:
    try:
        return insert_claim(payload.claim_text)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/test-db/history")
def db_history(claim_text: str) -> list[dict]:
    try:
        return get_claim_history(claim_text)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
