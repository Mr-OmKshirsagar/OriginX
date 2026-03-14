import concurrent.futures
import json
from typing import Any
import psycopg

from app.config import settings
from app.services.supabase_client import supabase


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
