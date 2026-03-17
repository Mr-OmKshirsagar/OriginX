from typing import Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.claims_service import (
    check_verification_history,
    get_dashboard_summary,
    get_claim_history,
    get_monthly_verification_count,
    get_recent_verifications,
    insert_claim,
    insert_verification_history,
)
from app.services.credibility_engine import generate_verification_result
from app.services.gemini_summary import generate_evidence_summary, localize_evidence_articles
from app.services.news_verification import search_news_sources
from app.services.reddit_propagation import analyze_reddit_propagation
from app.utils.text_processing import preprocess_claim_text

router = APIRouter()


def _raise_internal_server_error() -> None:
    raise HTTPException(status_code=500, detail="Unexpected server error.")


def _raise_operation_failed() -> None:
    raise HTTPException(status_code=500, detail="Operation failed.")


class VerifyClaimRequest(BaseModel):
    text: str = Field(min_length=1)
    language: str | None = None


class FinalVerifyRequest(BaseModel):
    text: str = Field(min_length=1)
    language: str | None = None
    include_propagation: bool = False
    propagation_query: str | None = None
    reddit_limit: int = 10
    include_reddit_comments: bool = True
    reddit_comments_per_post: int = 5


def _verdict_from_result(verification_result: str) -> str:
    normalized = verification_result.strip().lower()
    if normalized == "true":
        return "Likely true"
    if normalized == "false":
        return "Likely false or unsupported"
    return "Verdict unavailable"


def _extract_source_names(sources: Any) -> list[str]:
    if not isinstance(sources, list):
        return []

    names: list[str] = []
    for source in sources:
        if isinstance(source, dict):
            source_name = str(source.get("source", "")).strip()
            if source_name and source_name not in names:
                names.append(source_name)
    return names


@router.post("/verify-claim")
def verify_claim(payload: VerifyClaimRequest) -> dict:
    processed_text = preprocess_claim_text(payload.text)
    requested_language = (payload.language or "en").strip().lower()

    if not processed_text:
        raise HTTPException(status_code=422, detail="Claim text cannot be empty after normalization.")

    try:
        previous_result = check_verification_history(processed_text)
        if previous_result:
            previous_verification_result = str(previous_result.get("verification_result", ""))
            previous_verdict = previous_result.get("verdict") or _verdict_from_result(previous_verification_result)
            previous_sources = previous_result.get("sources") if isinstance(previous_result.get("sources"), list) else []
            previous_summary = generate_evidence_summary(
                processed_text,
                previous_sources,
                output_language=requested_language,
            )
            localized_sources = localize_evidence_articles(previous_sources, output_language=requested_language)
            found_response = {
                "status": "found",
                "verification_result": previous_verification_result,
                "verdict": previous_verdict,
                "credibility_score": previous_result.get("credibility_score"),
                "summary": previous_summary,
            }

            if localized_sources:
                found_response["articles_found"] = len(localized_sources)
                found_response["sources"] = localized_sources

            return found_response

        insert_claim(processed_text)
        try:
            news_lookup = search_news_sources(processed_text)
        except (ValueError, RuntimeError) as exc:
            news_lookup = {
                "articles_found": 0,
                "articles": [],
                "warning": str(exc),
            }

        verification_result = generate_verification_result(processed_text, news_lookup.get("articles", []))
        summary = generate_evidence_summary(
            processed_text,
            verification_result.get("top_credible_articles", []),
            output_language=requested_language,
        )

        insert_verification_history(
            claim_text=processed_text,
            verification_result=verification_result["verification_result"],
            verdict=verification_result["verdict"],
            credibility_score=verification_result["credibility_score"],
            summary=summary,
            sources=news_lookup.get("articles", []),
        )
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        _raise_operation_failed()
    except Exception as exc:
        _raise_internal_server_error()

    localized_sources = localize_evidence_articles(news_lookup.get("articles", []), output_language=requested_language)

    response_payload = {
        "status": "generated",
        "message": "No history found. Generated and stored a new verification result.",
        "claim": processed_text,
        "verification_result": verification_result["verification_result"],
        "verdict": verification_result["verdict"],
        "credibility_score": verification_result["credibility_score"],
        "summary": summary,
        "articles_found": len(localized_sources),
        "sources": localized_sources,
    }

    if "warning" in news_lookup:
        response_payload["warning"] = news_lookup["warning"]

    return response_payload


@router.post("/verify-claim/final")
def verify_claim_final(payload: FinalVerifyRequest) -> dict[str, Any]:
    processed_text = preprocess_claim_text(payload.text)
    requested_language = (payload.language or "en").strip().lower()

    if not processed_text:
        raise HTTPException(status_code=422, detail="Claim text cannot be empty after normalization.")

    try:
        history = get_claim_history(processed_text)
        if history:
            latest = history[0]
            latest_sources = latest.get("sources") if isinstance(latest.get("sources"), list) else []
            summary = generate_evidence_summary(
                processed_text,
                latest_sources,
                output_language=requested_language,
            )
            response: dict[str, Any] = {
                "claim": processed_text,
                "verification_result": str(latest.get("verification_result", "")),
                "credibility_score": latest.get("credibility_score"),
                "summary": summary,
                "sources": _extract_source_names(latest_sources),
                "history_count": len(history),
            }
        else:
            insert_claim(processed_text)
            try:
                news_lookup = search_news_sources(processed_text)
            except (ValueError, RuntimeError) as exc:
                news_lookup = {
                    "articles_found": 0,
                    "articles": [],
                    "warning": str(exc),
                }

            verification_result = generate_verification_result(processed_text, news_lookup.get("articles", []))
            summary = generate_evidence_summary(
                processed_text,
                verification_result.get("top_credible_articles", []),
                output_language=requested_language,
            )

            insert_verification_history(
                claim_text=processed_text,
                verification_result=verification_result["verification_result"],
                verdict=verification_result["verdict"],
                credibility_score=verification_result["credibility_score"],
                summary=summary,
                sources=news_lookup.get("articles", []),
            )

            post_insert_history = get_claim_history(processed_text)
            response = {
                "claim": processed_text,
                "verification_result": verification_result["verification_result"],
                "credibility_score": verification_result["credibility_score"],
                "summary": summary,
                "sources": _extract_source_names(news_lookup.get("articles", [])),
                "history_count": len(post_insert_history),
            }

            if "warning" in news_lookup:
                response["warning"] = news_lookup["warning"]

        if payload.include_propagation:
            try:
                response["propagation"] = analyze_reddit_propagation(
                    query=payload.propagation_query or processed_text,
                    limit=payload.reddit_limit,
                    include_comments=payload.include_reddit_comments,
                    comments_per_post=payload.reddit_comments_per_post,
                )
            except Exception as exc:
                response["propagation_warning"] = str(exc)

        return response
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        _raise_operation_failed()
    except Exception as exc:
        _raise_internal_server_error()


@router.get("/dashboard/summary")
def dashboard_summary(limit: int = Query(default=500, ge=1, le=2000)) -> dict[str, Any]:
    try:
        return get_dashboard_summary(limit=limit)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        _raise_operation_failed()
    except Exception as exc:
        _raise_internal_server_error()


@router.get("/dashboard/monthly-count")
def dashboard_monthly_count() -> dict[str, Any]:
    try:
        return get_monthly_verification_count()
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except Exception as exc:
        _raise_internal_server_error()


@router.get("/history/verifications")
def history_verifications(limit: int = Query(default=200, ge=1, le=1000)) -> dict[str, Any]:
    try:
        items = get_recent_verifications(limit=limit)
        return {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "refresh_interval_seconds": 30,
            "total": len(items),
            "items": items,
        }
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except RuntimeError as exc:
        _raise_operation_failed()
    except Exception as exc:
        _raise_internal_server_error()
