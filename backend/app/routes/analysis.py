from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.domain_security import analyze_claim_urls, analyze_domain_risk
from app.services.image_ocr import extract_text_from_image_bytes
from app.services.news_verification import fetch_trending_daily_news
from app.services.anomaly_detection import detect_anomalies
from app.services.bot_detection import detect_bots
from app.services.propagation_analysis import analyze_propagation
from app.services.reddit_propagation import analyze_reddit_propagation

router = APIRouter(prefix="/analysis", tags=["analysis"])


def _raise_internal_server_error() -> None:
    raise HTTPException(status_code=500, detail="Unexpected server error.")


def _raise_operation_failed() -> None:
    raise HTTPException(status_code=502, detail="Upstream analysis service failed.")


class PropagationEvent(BaseModel):
    user_id: str = Field(min_length=1)
    claim_text: str = Field(min_length=1)
    timestamp: str | None = None
    narrative_key: str | None = None
    url: str | None = None
    domain: str | None = None


class PropagationRequest(BaseModel):
    events: list[PropagationEvent] = Field(min_length=1)


class DomainSecurityRequest(BaseModel):
    claim_text: str | None = None
    url: str | None = None


class RedditPropagationRequest(BaseModel):
    query: str = Field(min_length=1)
    limit: int = 20
    include_comments: bool = True
    comments_per_post: int = 20
    sort: str = "new"
    time_filter: str = "week"


class ImageOcrRequest(BaseModel):
    image_data: str = Field(min_length=1)
    content_type: str = Field(min_length=1)


@router.post("/ocr-image")
def ocr_image(payload: ImageOcrRequest) -> dict[str, str]:
    try:
        extracted_text = extract_text_from_image_bytes(payload.image_data, payload.content_type)
        return {"text": extracted_text}
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        _raise_internal_server_error()


@router.post("/propagation")
def propagation_analysis(payload: PropagationRequest) -> dict[str, Any]:
    try:
        events = [event.model_dump() for event in payload.events]
        return analyze_propagation(events)
    except Exception as exc:
        _raise_internal_server_error()


@router.post("/anomaly-detection")
def anomaly_detection_analysis(payload: PropagationRequest) -> dict[str, Any]:
    try:
        events = [event.model_dump() for event in payload.events]
        return detect_anomalies(events)
    except Exception as exc:
        _raise_internal_server_error()


@router.post("/bot-detection")
def bot_detection_analysis(payload: PropagationRequest) -> dict[str, Any]:
    try:
        events = [event.model_dump() for event in payload.events]
        anomalies = detect_anomalies(events)
        return detect_bots(events, anomalies=anomalies)
    except Exception as exc:
        _raise_internal_server_error()


@router.post("/domain-security")
def domain_security_analysis(payload: DomainSecurityRequest) -> dict[str, Any]:
    if payload.url:
        return {"results": [analyze_domain_risk(payload.url)]}

    if payload.claim_text:
        return {"results": analyze_claim_urls(payload.claim_text)}

    raise HTTPException(status_code=422, detail="Provide either url or claim_text.")


@router.post("/reddit-propagation")
def reddit_propagation_analysis(payload: RedditPropagationRequest) -> dict[str, Any]:
    try:
        return analyze_reddit_propagation(
            query=payload.query,
            limit=payload.limit,
            include_comments=payload.include_comments,
            comments_per_post=payload.comments_per_post,
            sort=payload.sort,
            time_filter=payload.time_filter,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        _raise_operation_failed()
    except Exception as exc:
        _raise_internal_server_error()


@router.get("/trending-news")
def trending_daily_news(
    limit: int = Query(default=12, ge=1, le=50),
    country: str = "global",
    category: str | None = None,
    local_country: str | None = None,
) -> dict[str, Any]:
    try:
        return fetch_trending_daily_news(
            limit=limit,
            country=country,
            category=category,
            local_country=local_country,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        _raise_operation_failed()
    except Exception as exc:
        _raise_internal_server_error()
