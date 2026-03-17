from dataclasses import dataclass
from typing import Callable, Awaitable

from fastapi import Request
from fastapi.responses import JSONResponse, Response

from app.config import settings
from app.utils.rate_limiter import client_identifier, rate_limiter


@dataclass(frozen=True)
class RateLimitRule:
    method: str
    path: str
    limit_per_window: int
    key_name: str


def _rules() -> tuple[RateLimitRule, ...]:
    return (
        RateLimitRule("POST", "/verify-claim", settings.RATE_LIMIT_VERIFY_PER_WINDOW, "verify"),
        RateLimitRule("POST", "/verify-claim/final", settings.RATE_LIMIT_VERIFY_PER_WINDOW, "verify-final"),
        RateLimitRule("GET", "/dashboard/summary", settings.RATE_LIMIT_DASHBOARD_PER_WINDOW, "dashboard-summary"),
        RateLimitRule("GET", "/history/verifications", settings.RATE_LIMIT_HISTORY_PER_WINDOW, "history-verifications"),
        RateLimitRule("POST", "/analysis/propagation", settings.RATE_LIMIT_ANALYSIS_PER_WINDOW, "analysis-propagation"),
        RateLimitRule("POST", "/analysis/anomaly-detection", settings.RATE_LIMIT_ANALYSIS_PER_WINDOW, "analysis-anomaly-detection"),
        RateLimitRule("POST", "/analysis/bot-detection", settings.RATE_LIMIT_ANALYSIS_PER_WINDOW, "analysis-bot-detection"),
        RateLimitRule("POST", "/analysis/domain-security", settings.RATE_LIMIT_ANALYSIS_PER_WINDOW, "analysis-domain-security"),
        RateLimitRule("POST", "/analysis/reddit-propagation", settings.RATE_LIMIT_ANALYSIS_PER_WINDOW, "analysis-reddit-propagation"),
        RateLimitRule("GET", "/analysis/trending-news", settings.RATE_LIMIT_TRENDING_PER_WINDOW, "analysis-trending-news"),
        RateLimitRule("GET", "/test-db/status", settings.RATE_LIMIT_TEST_DB_PER_WINDOW, "test-db-status"),
        RateLimitRule("POST", "/test-db", settings.RATE_LIMIT_TEST_DB_PER_WINDOW, "test-db-insert"),
        RateLimitRule("GET", "/test-db/history", settings.RATE_LIMIT_TEST_DB_PER_WINDOW, "test-db-history"),
    )


async def rate_limit_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    if not settings.RATE_LIMIT_ENABLED:
        return await call_next(request)

    request_method = request.method.upper()
    request_path = request.url.path

    matching_rule = next((rule for rule in _rules() if rule.method == request_method and rule.path == request_path), None)
    if not matching_rule:
        return await call_next(request)

    requester = client_identifier(
        remote_host=request.client.host if request.client else None,
        x_forwarded_for=request.headers.get("x-forwarded-for"),
    )

    decision = rate_limiter.check(
        key=f"{matching_rule.key_name}:{requester}",
        limit=matching_rule.limit_per_window,
        window_seconds=settings.RATE_LIMIT_WINDOW_SECONDS,
    )

    if not decision.allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Try again shortly."},
            headers={"Retry-After": str(decision.retry_after_seconds)},
        )

    return await call_next(request)
