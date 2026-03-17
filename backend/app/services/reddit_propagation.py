from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from urllib.parse import quote_plus
from urllib.parse import urlparse
import re

import requests

from app.config import settings
from app.services.propagation_analysis import analyze_propagation

_REDDIT_BASE_URL = "https://www.reddit.com"


def _headers() -> dict[str, str]:
    user_agent = settings.REDDIT_USER_AGENT or "OriginX/1.0 (by /u/originx-app)"
    return {"User-Agent": user_agent}


def _iso_from_utc(ts: float | int | None) -> str:
    if ts is None:
        return datetime.now(timezone.utc).isoformat()
    return datetime.fromtimestamp(float(ts), tz=timezone.utc).isoformat()


def _extract_first_url(text: str) -> str | None:
    match = re.search(r"https?://[^\s]+", text)
    if not match:
        return None
    return match.group(0)


def _normalize_domain(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        return None
    normalized = hostname.removeprefix("www.")
    if normalized.endswith("reddit.com"):
        return None
    return normalized


def search_reddit_posts(query: str, limit: int = 20, sort: str = "new", time_filter: str = "week") -> list[dict[str, Any]]:
    if not query.strip():
        raise ValueError("Query cannot be empty.")

    url = (
        f"{_REDDIT_BASE_URL}/search.json?q={quote_plus(query)}"
        f"&limit={max(1, min(limit, 100))}&sort={sort}&t={time_filter}&restrict_sr=false"
    )

    try:
        response = requests.get(url, headers=_headers(), timeout=20)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise RuntimeError(f"Reddit search request failed: {exc}") from exc

    children = (((payload.get("data") or {}).get("children")) or [])
    posts: list[dict[str, Any]] = []
    for child in children:
        data = child.get("data") or {}
        external_url = str(data.get("url", "")).strip() or None
        posts.append(
            {
                "post_id": str(data.get("id", "")).strip(),
                "user_id": str(data.get("author", "unknown")).strip() or "unknown",
                "claim_text": f"{data.get('title', '')} {data.get('selftext', '')}".strip(),
                "timestamp": _iso_from_utc(data.get("created_utc")),
                "narrative_key": query.lower().strip(),
                "url": external_url,
                "domain": _normalize_domain(external_url),
                "subreddit": data.get("subreddit"),
                "permalink": f"https://www.reddit.com{data.get('permalink', '')}",
                "num_comments": int(data.get("num_comments") or 0),
            }
        )

    return posts


def fetch_reddit_comments(post_id: str, claim_key: str, limit: int = 20) -> list[dict[str, Any]]:
    clean_post_id = post_id.strip()
    if not clean_post_id:
        return []

    url = f"{_REDDIT_BASE_URL}/comments/{clean_post_id}.json?limit={max(1, min(limit, 100))}"

    try:
        response = requests.get(url, headers=_headers(), timeout=20)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException:
        return []

    if not isinstance(payload, list) or len(payload) < 2:
        return []

    comments_listing = ((payload[1] or {}).get("data") or {}).get("children") or []
    events: list[dict[str, Any]] = []
    for item in comments_listing:
        data = item.get("data") or {}
        body = str(data.get("body", "")).strip()
        author = str(data.get("author", "unknown")).strip() or "unknown"
        if not body or body in {"[deleted]", "[removed]"}:
            continue
        external_url = _extract_first_url(body)
        events.append(
            {
                "user_id": author,
                "claim_text": body,
                "timestamp": _iso_from_utc(data.get("created_utc")),
                "narrative_key": claim_key,
                "url": external_url,
                "domain": _normalize_domain(external_url),
            }
        )

    return events


def build_reddit_events(
    query: str,
    limit: int = 20,
    include_comments: bool = True,
    comments_per_post: int = 20,
    sort: str = "new",
    time_filter: str = "week",
) -> list[dict[str, Any]]:
    post_events = search_reddit_posts(query, limit=limit, sort=sort, time_filter=time_filter)
    events: list[dict[str, Any]] = list(post_events)

    if include_comments:
        for post in post_events:
            events.extend(
                fetch_reddit_comments(
                    post_id=str(post.get("post_id", "")),
                    claim_key=str(post.get("narrative_key", query.lower().strip())),
                    limit=comments_per_post,
                )
            )

    return events


def analyze_reddit_propagation(
    query: str,
    limit: int = 20,
    include_comments: bool = True,
    comments_per_post: int = 20,
    sort: str = "new",
    time_filter: str = "week",
) -> dict[str, Any]:
    events = build_reddit_events(
        query=query,
        limit=limit,
        include_comments=include_comments,
        comments_per_post=comments_per_post,
        sort=sort,
        time_filter=time_filter,
    )

    analysis = analyze_propagation(events)
    return {
        "source": "reddit",
        "query": query,
        "events_count": len(events),
        "events": events,
        "analysis": analysis,
    }
