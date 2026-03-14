import concurrent.futures
import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any
import psycopg

from app.config import settings
from app.services.news_verification import fetch_trending_daily_news
from app.services.supabase_client import supabase


_DASHBOARD_TOPIC_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Politics": ("election", "parliament", "minister", "government", "policy", "senate", "congress"),
    "Economy": ("economy", "inflation", "gdp", "fiscal", "budget", "jobs", "trade", "recession"),
    "Business": ("market", "stocks", "company", "earnings", "startup", "merger", "acquisition"),
    "Technology": ("ai", "software", "chip", "cyber", "tech", "digital", "internet", "startup"),
    "Health": ("health", "hospital", "disease", "vaccine", "medical", "public health"),
    "Climate": ("climate", "weather", "carbon", "emissions", "wildfire", "flood", "heatwave"),
    "Energy": ("energy", "oil", "gas", "renewable", "solar", "wind", "power grid"),
    "Sports": ("sports", "league", "match", "tournament", "coach", "player", "championship"),
    "Security": ("war", "conflict", "defense", "attack", "security", "military", "missile"),
}


def _run_with_timeout(func: Any, timeout_seconds: int = 10) -> Any:
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(func)
        try:
            return future.result(timeout=timeout_seconds)
        except concurrent.futures.TimeoutError as exc:
            raise TimeoutError("Supabase query timed out. Check network or Supabase status.") from exc


def _insert_claim_direct(claim_text: str) -> dict[str, Any]:
    with psycopg.connect(settings.SUPABASE_DIRECT_DB_URL, connect_timeout=8) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "insert into public.claims (claim_text) values (%s) returning id, claim_text, created_at",
                (claim_text,),
            )
            row = cur.fetchone()
        conn.commit()

    if not row:
        raise ValueError("Direct PostgreSQL insert returned no row.")

    return {
        "id": row[0],
        "claim_text": row[1],
        "created_at": row[2],
    }


def _get_claim_history_direct(claim_text: str) -> list[dict[str, Any]]:
    with psycopg.connect(settings.SUPABASE_DIRECT_DB_URL, connect_timeout=8) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id, claim_text, verification_result, verdict, credibility_score, summary, sources, created_at
                from public.verification_history
                where claim_text = %s
                order by created_at desc
                """,
                (claim_text,),
            )
            rows = cur.fetchall()

    return [
        {
            "id": row[0],
            "claim_text": row[1],
            "verification_result": row[2],
            "verdict": row[3],
            "credibility_score": row[4],
            "summary": row[5],
            "sources": row[6],
            "created_at": row[7],
        }
        for row in rows
    ]


def _check_verification_history_direct(claim_text: str) -> dict[str, Any] | None:
    with psycopg.connect(settings.SUPABASE_DIRECT_DB_URL, connect_timeout=8) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select verification_result, verdict, credibility_score, summary, sources
                from public.verification_history
                where claim_text = %s
                order by created_at desc
                limit 1
                """,
                (claim_text,),
            )
            row = cur.fetchone()

    if not row:
        return None

    return {
        "verification_result": row[0],
        "verdict": row[1],
        "credibility_score": row[2],
        "summary": row[3],
        "sources": row[4],
    }


def _insert_verification_history_direct(
    claim_text: str,
    verification_result: str,
    verdict: str,
    credibility_score: float,
    summary: str,
    sources: list[dict[str, Any]],
) -> dict[str, Any]:
    with psycopg.connect(settings.SUPABASE_DIRECT_DB_URL, connect_timeout=8) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into public.verification_history
                (claim_text, verification_result, verdict, credibility_score, summary, sources)
                values (%s, %s, %s, %s, %s, %s::jsonb)
                returning id, claim_text, verification_result, verdict, credibility_score, summary, sources, created_at
                """,
                (claim_text, verification_result, verdict, credibility_score, summary, json.dumps(sources)),
            )
            row = cur.fetchone()
        conn.commit()

    if not row:
        raise ValueError("Direct PostgreSQL insert into verification_history returned no row.")

    return {
        "id": row[0],
        "claim_text": row[1],
        "verification_result": row[2],
        "verdict": row[3],
        "credibility_score": row[4],
        "summary": row[5],
        "sources": row[6],
        "created_at": row[7],
    }


def insert_claim(claim_text: str) -> dict[str, Any]:
    if settings.SUPABASE_USE_DIRECT_DB and settings.SUPABASE_DIRECT_DB_URL:
        try:
            return _run_with_timeout(lambda: _insert_claim_direct(claim_text), timeout_seconds=10)
        except Exception:
            # Always fall back to REST API path when direct DB is unavailable or blocked.
            pass

    try:
        response = _run_with_timeout(
            lambda: supabase.table("claims").insert({"claim_text": claim_text}).execute(),
            timeout_seconds=10,
        )
    except Exception as exc:
        if getattr(exc, "code", "") == "PGRST205" or "PGRST205" in str(exc):
            raise RuntimeError(
                "Supabase table public.claims was not found. Run backend/sql/init_supabase.sql in Supabase SQL Editor."
            ) from exc
        if getattr(exc, "code", "") == "42501" or "row-level security policy" in str(exc).lower():
            raise RuntimeError(
                "Supabase RLS blocked insert on public.claims. Add an INSERT policy for role anon or run backend/sql/init_supabase.sql."
            ) from exc
        raise

    if not response.data:
        raise ValueError("Supabase did not return an inserted claim record.")

    return response.data[0]


def get_claim_history(claim_text: str) -> list[dict[str, Any]]:
    if settings.SUPABASE_USE_DIRECT_DB and settings.SUPABASE_DIRECT_DB_URL:
        try:
            return _run_with_timeout(lambda: _get_claim_history_direct(claim_text), timeout_seconds=10)
        except Exception:
            # Always fall back to REST API path when direct DB is unavailable or blocked.
            pass

    response = _run_with_timeout(
        lambda: (
            supabase.table("verification_history")
            .select("*")
            .eq("claim_text", claim_text)
            .order("created_at", desc=True)
            .execute()
        ),
        timeout_seconds=10,
    )

    return response.data or []


def check_verification_history(claim_text: str) -> dict[str, Any] | None:
    if settings.SUPABASE_USE_DIRECT_DB and settings.SUPABASE_DIRECT_DB_URL:
        try:
            return _run_with_timeout(lambda: _check_verification_history_direct(claim_text), timeout_seconds=10)
        except Exception:
            pass

    response = _run_with_timeout(
        lambda: (
            supabase.table("verification_history")
            .select("verification_result, verdict, credibility_score, summary, sources")
            .eq("claim_text", claim_text)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        ),
        timeout_seconds=10,
    )

    if not response.data:
        return None

    return response.data[0]


def insert_verification_history(
    claim_text: str,
    verification_result: str,
    verdict: str,
    credibility_score: float,
    summary: str,
    sources: list[dict[str, Any]],
) -> dict[str, Any]:
    if settings.SUPABASE_USE_DIRECT_DB and settings.SUPABASE_DIRECT_DB_URL:
        try:
            return _run_with_timeout(
                lambda: _insert_verification_history_direct(
                    claim_text,
                    verification_result,
                    verdict,
                    credibility_score,
                    summary,
                    sources,
                ),
                timeout_seconds=10,
            )
        except Exception:
            pass

    try:
        response = _run_with_timeout(
            lambda: (
                supabase.table("verification_history")
                .insert(
                    {
                        "claim_text": claim_text,
                        "verification_result": verification_result,
                        "verdict": verdict,
                        "credibility_score": credibility_score,
                        "summary": summary,
                        "sources": sources,
                    }
                )
                .execute()
            ),
            timeout_seconds=10,
        )
    except Exception as exc:
        if getattr(exc, "code", "") == "PGRST205" or "PGRST205" in str(exc):
            raise RuntimeError(
                "Supabase table public.verification_history was not found. Run backend/sql/init_supabase.sql in Supabase SQL Editor."
            ) from exc
        if getattr(exc, "code", "") == "42501" or "row-level security policy" in str(exc).lower():
            raise RuntimeError(
                "Supabase RLS blocked insert on public.verification_history. Add an INSERT policy for role anon or run backend/sql/init_supabase.sql."
            ) from exc
        raise

    if not response.data:
        raise ValueError("Supabase did not return an inserted verification_history record.")

    return response.data[0]


def _parse_created_at(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc)
    if isinstance(value, str) and value.strip():
        normalized = value.replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(normalized)
            if parsed.tzinfo is None:
                return parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            return None
    return None


def _to_float(value: Any, fallback: float = 50.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _format_change(current: int, previous: int) -> str:
    if previous <= 0:
        return "+100.0%" if current > 0 else "+0.0%"

    delta = ((current - previous) / previous) * 100
    return f"{delta:+.1f}%"


def _status_from_row(row: dict[str, Any], score: float) -> str:
    verdict = str(row.get("verdict") or "").strip()
    if verdict:
        return verdict

    verification_result = str(row.get("verification_result") or "").strip().lower()
    if verification_result == "true":
        return "Likely True"
    if verification_result == "false":
        return "Likely False"
    if score >= 70:
        return "Likely True"
    if score >= 40:
        return "Uncertain"
    return "Likely False"


def _extract_topic_counts(rows: list[dict[str, Any]], cutoff: datetime) -> tuple[dict[str, int], dict[str, int]]:
    stop_words = {
        "about", "after", "again", "against", "among", "because", "before", "being", "between", "claims",
        "could", "every", "first", "found", "from", "into", "latest", "might", "news", "says", "said",
        "should", "their", "there", "these", "this", "those", "under", "very", "what", "when", "where",
        "which", "while", "will", "with", "would", "that", "have", "has", "were", "been", "your", "over",
    }

    recent_counts: dict[str, int] = {}
    previous_counts: dict[str, int] = {}

    for row in rows:
        claim_text = str(row.get("claim_text") or "")
        if not claim_text:
            continue

        created_at = _parse_created_at(row.get("created_at"))
        if not created_at:
            continue

        words = re.findall(r"[A-Za-z][A-Za-z\-]{2,}", claim_text.lower())
        unique_words = {word for word in words if word not in stop_words}
        if not unique_words:
            continue

        bucket = recent_counts if created_at >= cutoff else previous_counts
        for word in unique_words:
            bucket[word] = bucket.get(word, 0) + 1

    return recent_counts, previous_counts


def _extract_news_trending_topics(limit: int = 5) -> list[dict[str, Any]]:
    try:
        news_result = fetch_trending_daily_news(limit=40, country="global", category="all", local_country="us")
    except Exception:
        return []

    articles = news_result.get("articles") if isinstance(news_result, dict) else None
    if not isinstance(articles, list) or not articles:
        return []

    stop_words = {
        "about", "after", "again", "against", "among", "because", "before", "being", "between", "claims",
        "could", "every", "first", "found", "from", "into", "latest", "might", "news", "says", "said",
        "should", "their", "there", "these", "this", "those", "under", "very", "what", "when", "where",
        "which", "while", "will", "with", "would", "that", "have", "has", "were", "been", "your", "over",
    }

    recent_counts: dict[str, int] = {}
    previous_counts: dict[str, int] = {}
    midpoint = max(1, len(articles) // 2)

    for index, article in enumerate(articles):
        if not isinstance(article, dict):
            continue

        text = f"{article.get('title', '')} {article.get('description', '')}".lower().strip()
        if not text:
            continue

        bucket = recent_counts if index < midpoint else previous_counts
        matched_topics: set[str] = set()

        for topic, keywords in _DASHBOARD_TOPIC_KEYWORDS.items():
            if any(keyword in text for keyword in keywords):
                matched_topics.add(topic)

        if not matched_topics:
            words = [word for word in re.findall(r"[A-Za-z][A-Za-z\-]{2,}", text) if word not in stop_words]
            if words:
                matched_topics.add(words[0].title())

        for topic in matched_topics:
            bucket[topic] = bucket.get(topic, 0) + 1

    merged_topics = set(recent_counts.keys()) | set(previous_counts.keys())
    ranked_topics = sorted(
        merged_topics,
        key=lambda topic: (recent_counts.get(topic, 0) + previous_counts.get(topic, 0)),
        reverse=True,
    )

    return [
        {
            "topic": topic,
            "count": recent_counts.get(topic, 0) + previous_counts.get(topic, 0),
            "trend": "up" if recent_counts.get(topic, 0) >= previous_counts.get(topic, 0) else "down",
        }
        for topic in ranked_topics[:limit]
    ]


def _build_dashboard_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    prev_24h = now - timedelta(hours=48)

    total = len(rows)
    true_count = 0
    false_count = 0
    uncertain_count = 0

    total_recent = 0
    total_previous = 0
    true_recent = 0
    true_previous = 0
    false_recent = 0
    false_previous = 0
    uncertain_recent = 0
    uncertain_previous = 0

    recent_verifications: list[dict[str, Any]] = []
    for row in rows:
        score = _to_float(row.get("credibility_score"))
        status = _status_from_row(row, score)
        normalized_status = status.lower()

        if "false" in normalized_status:
            false_count += 1
        elif "true" in normalized_status:
            true_count += 1
        else:
            uncertain_count += 1

        created_at = _parse_created_at(row.get("created_at"))
        if created_at:
            if created_at >= last_24h:
                total_recent += 1
                if "false" in normalized_status:
                    false_recent += 1
                elif "true" in normalized_status:
                    true_recent += 1
                else:
                    uncertain_recent += 1
            elif created_at >= prev_24h:
                total_previous += 1
                if "false" in normalized_status:
                    false_previous += 1
                elif "true" in normalized_status:
                    true_previous += 1
                else:
                    uncertain_previous += 1

        if len(recent_verifications) < 8:
            sources_value = row.get("sources")
            sources_count = len(sources_value) if isinstance(sources_value, list) else 0

            recent_verifications.append(
                {
                    "id": str(row.get("id") or f"row-{len(recent_verifications) + 1}"),
                    "claim": str(row.get("claim_text") or ""),
                    "score": round(score),
                    "status": status,
                    "created_at": created_at.isoformat() if created_at else str(row.get("created_at") or ""),
                    "sources": sources_count,
                }
            )

    trending_topics = _extract_news_trending_topics(limit=5)

    if not trending_topics:
        recent_topic_counts, previous_topic_counts = _extract_topic_counts(rows, cutoff=last_24h)
        top_topics = sorted(recent_topic_counts.items(), key=lambda item: item[1], reverse=True)[:5]
        trending_topics = [
            {
                "topic": topic.title(),
                "count": count,
                "trend": "up" if count >= previous_topic_counts.get(topic, 0) else "down",
            }
            for topic, count in top_topics
        ]

    return {
        "generated_at": now.isoformat(),
        "refresh_interval_seconds": 30,
        "totals": {
            "total_verifications": total,
            "true_claims": true_count,
            "false_claims": false_count,
            "uncertain_claims": uncertain_count,
        },
        "changes": {
            "total_verifications": _format_change(total_recent, total_previous),
            "true_claims": _format_change(true_recent, true_previous),
            "false_claims": _format_change(false_recent, false_previous),
            "uncertain_claims": _format_change(uncertain_recent, uncertain_previous),
        },
        "recent_verifications": recent_verifications,
        "trending_topics": trending_topics,
    }


def _get_dashboard_rows_direct(limit: int) -> list[dict[str, Any]]:
    with psycopg.connect(settings.SUPABASE_DIRECT_DB_URL, connect_timeout=8) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id, claim_text, verification_result, verdict, credibility_score, sources, created_at
                from public.verification_history
                order by created_at desc
                limit %s
                """,
                (limit,),
            )
            rows = cur.fetchall()

    return [
        {
            "id": row[0],
            "claim_text": row[1],
            "verification_result": row[2],
            "verdict": row[3],
            "credibility_score": row[4],
            "sources": row[5],
            "created_at": row[6],
        }
        for row in rows
    ]


def get_dashboard_summary(limit: int = 500) -> dict[str, Any]:
    safe_limit = max(50, min(limit, 2000))

    if settings.SUPABASE_USE_DIRECT_DB and settings.SUPABASE_DIRECT_DB_URL:
        try:
            rows = _run_with_timeout(lambda: _get_dashboard_rows_direct(safe_limit), timeout_seconds=10)
            return _build_dashboard_summary(rows)
        except Exception:
            pass

    response = _run_with_timeout(
        lambda: (
            supabase.table("verification_history")
            .select("id, claim_text, verification_result, verdict, credibility_score, sources, created_at")
            .order("created_at", desc=True)
            .limit(safe_limit)
            .execute()
        ),
        timeout_seconds=10,
    )

    return _build_dashboard_summary(response.data or [])


def get_recent_verifications(limit: int = 200) -> list[dict[str, Any]]:
    safe_limit = max(1, min(limit, 1000))

    if settings.SUPABASE_USE_DIRECT_DB and settings.SUPABASE_DIRECT_DB_URL:
        try:
            rows = _run_with_timeout(lambda: _get_dashboard_rows_direct(safe_limit), timeout_seconds=10)
        except Exception:
            rows = []
    else:
        response = _run_with_timeout(
            lambda: (
                supabase.table("verification_history")
                .select("id, claim_text, verification_result, verdict, credibility_score, sources, created_at")
                .order("created_at", desc=True)
                .limit(safe_limit)
                .execute()
            ),
            timeout_seconds=10,
        )
        rows = response.data or []

    shaped: list[dict[str, Any]] = []
    for row in rows:
        created = _parse_created_at(row.get("created_at")) if isinstance(row, dict) else None
        sources_value = row.get("sources") if isinstance(row, dict) else None
        shaped.append(
            {
                "id": str(row.get("id") or "") if isinstance(row, dict) else "",
                "claim_text": str(row.get("claim_text") or "") if isinstance(row, dict) else "",
                "verification_result": str(row.get("verification_result") or "") if isinstance(row, dict) else "",
                "verdict": str(row.get("verdict") or "") if isinstance(row, dict) else "",
                "credibility_score": _to_float(row.get("credibility_score")) if isinstance(row, dict) else 50.0,
                "sources_count": len(sources_value) if isinstance(sources_value, list) else 0,
                "created_at": created.isoformat() if created else str(row.get("created_at") or "") if isinstance(row, dict) else "",
            }
        )

    return shaped
