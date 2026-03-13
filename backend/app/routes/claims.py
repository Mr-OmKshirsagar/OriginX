from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.claims_service import insert_claim
from app.utils.text_processing import preprocess_claim_text

router = APIRouter()


class VerifyClaimRequest(BaseModel):
    text: str = Field(min_length=1)


@router.post("/verify-claim")
def verify_claim(payload: VerifyClaimRequest) -> dict[str, str]:
    processed_text = preprocess_claim_text(payload.text)

    if not processed_text:
        raise HTTPException(status_code=422, detail="Claim text cannot be empty after normalization.")

    try:
        insert_claim(processed_text)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"message": "Claim received", "claim": processed_text}
