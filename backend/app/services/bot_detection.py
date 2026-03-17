from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
import re
from typing import Any

from app.services.anomaly_detection import detect_anomalies


def _parse_timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.min


def _normalize_text(value: Any) -> str:
    text = str(value or "").strip().lower()
    return re.sub(r"\s+", " ", text)


def _risk_level(score: int) -> str:
    if score >= 70:
        return "high"
    if score >= 40:
        return "moderate"
    return "low"


def detect_bots(events: list[dict[str, Any]], anomalies: dict[str, Any] | None = None) -> dict[str, Any]:
    if not events:
        return {"suspicious_accounts": [], "clusters": []}

    anomaly_payload = anomalies if anomalies is not None else detect_anomalies(events)
    anomaly_findings = anomaly_payload.get("anomalies", []) if isinstance(anomaly_payload, dict) else []

    account_events: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    all_narratives: set[str] = set()
    for event in events:
        user_id = str(event.get("user_id", "")).strip()
        if not user_id:
            continue
        account_events[user_id].append(event)
        narrative = _normalize_text(event.get("narrative_key")) or _normalize_text(event.get("claim_text"))
        if narrative:
            all_narratives.add(narrative)

    sync_participation: Counter[str] = Counter()
    cluster_candidates: list[dict[str, Any]] = []
    for index, anomaly in enumerate(anomaly_findings, start=1):
        accounts = [str(account).strip() for account in anomaly.get("accounts", []) if str(account).strip()]
        for account in accounts:
            sync_participation[account] += 1
        if anomaly.get("type") == "synchronized_activity" and len(accounts) >= 2:
            cluster_candidates.append(
                {
                    "cluster_id": f"cluster_{index}",
                    "members": accounts,
                    "shared_claim": str(anomaly.get("narrative_key") or "Coordinated narrative").strip(),
                    "cluster_risk_score": min(100, int(anomaly.get("score", 0))),
                }
            )

    suspicious_accounts: list[dict[str, Any]] = []
    for user_id, user_events in account_events.items():
        sorted_events = sorted(user_events, key=lambda item: _parse_timestamp(item.get("timestamp")))
        event_count = len(sorted_events)

        first_ts = _parse_timestamp(sorted_events[0].get("timestamp")) if sorted_events else datetime.min
        last_ts = _parse_timestamp(sorted_events[-1].get("timestamp")) if sorted_events else datetime.min
        span_hours = max((last_ts - first_ts).total_seconds() / 3600, 1 / 12) if first_ts != datetime.min and last_ts != datetime.min else 1
        posting_frequency = min(1.0, (event_count / span_hours) / 6)

        text_counter = Counter(_normalize_text(event.get("claim_text")) for event in user_events if _normalize_text(event.get("claim_text")))
        top_text_count = text_counter.most_common(1)[0][1] if text_counter else 0
        duplicate_content_ratio = top_text_count / event_count if event_count else 0

        narrative_counter = {
            _normalize_text(event.get("narrative_key")) or _normalize_text(event.get("claim_text"))
            for event in user_events
            if _normalize_text(event.get("narrative_key")) or _normalize_text(event.get("claim_text"))
        }
        narrative_hopping = len(narrative_counter) / max(len(all_narratives), 1)
        sync_score = min(1.0, sync_participation[user_id] / 3)

        raw_score = (
            (posting_frequency * 0.30)
            + (duplicate_content_ratio * 0.30)
            + (sync_score * 0.25)
            + (narrative_hopping * 0.15)
        )
        bot_risk_score = min(100, round(raw_score * 100))

        signals: list[str] = []
        if posting_frequency >= 0.6:
            signals.append("high_posting_frequency")
        if duplicate_content_ratio >= 0.5:
            signals.append("duplicate_content")
        if sync_score >= 0.34:
            signals.append("high_sync")
        if narrative_hopping >= 0.5:
            signals.append("narrative_hopping")

        if bot_risk_score >= 35:
            suspicious_accounts.append(
                {
                    "user_id": user_id,
                    "bot_risk_score": bot_risk_score,
                    "risk_level": _risk_level(bot_risk_score),
                    "signals": signals or ["elevated_activity"],
                }
            )

    suspicious_accounts.sort(key=lambda item: item["bot_risk_score"], reverse=True)

    if not cluster_candidates and len(suspicious_accounts) >= 2:
        top_accounts = suspicious_accounts[:3]
        cluster_candidates.append(
            {
                "cluster_id": "cluster_1",
                "members": [account["user_id"] for account in top_accounts],
                "shared_claim": "Coordinated narrative pattern",
                "cluster_risk_score": round(
                    sum(account["bot_risk_score"] for account in top_accounts) / len(top_accounts)
                ),
            }
        )

    return {
        "suspicious_accounts": suspicious_accounts[:6],
        "clusters": cluster_candidates[:3],
    }
