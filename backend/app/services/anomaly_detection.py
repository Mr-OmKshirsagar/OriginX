from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime
import re
from statistics import median
from typing import Any
from urllib.parse import urlparse


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


def _extract_first_url(text: str) -> str | None:
    match = re.search(r"https?://[^\s]+", text)
    if not match:
        return None
    return match.group(0)


def _normalize_domain(event: dict[str, Any]) -> str | None:
    domain = str(event.get("domain") or "").strip().lower()
    if domain:
        return domain

    url = str(event.get("url") or "").strip()
    if not url:
        url = _extract_first_url(str(event.get("claim_text") or ""))
        if not url:
            return None

    parsed = urlparse(url)
    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        return None
    return hostname.removeprefix("www.")


def detect_anomalies(events: list[dict[str, Any]]) -> dict[str, Any]:
    if not events:
        return {"events_count": 0, "anomalies": []}

    anomalies: list[dict[str, Any]] = []
    sorted_events = sorted(events, key=lambda item: _parse_timestamp(item.get("timestamp")))

    bucket_counts: Counter[str] = Counter()
    bucket_accounts: defaultdict[str, set[str]] = defaultdict(set)
    for event in sorted_events:
        ts = _parse_timestamp(event.get("timestamp"))
        if ts == datetime.min:
            continue
        bucket_key = ts.strftime("%Y-%m-%dT%H:%M")
        user_id = str(event.get("user_id", "")).strip()
        bucket_counts[bucket_key] += 1
        if user_id:
            bucket_accounts[bucket_key].add(user_id)

    if bucket_counts:
        volumes = list(bucket_counts.values())
        baseline = median(volumes)
        spike_bucket, spike_count = max(bucket_counts.items(), key=lambda item: item[1])
        if spike_count >= max(4, int(baseline * 2) if baseline else 4):
            score = min(100, int((spike_count / max(baseline or 1, 1)) * 35))
            anomalies.append(
                {
                    "type": "burst_posting",
                    "severity": "high" if score >= 80 else "medium",
                    "score": score,
                    "accounts": sorted(bucket_accounts.get(spike_bucket, set()))[:6],
                    "explanation": "Unusual spike in posts detected for this narrative.",
                    "narrative_key": None,
                }
            )

    text_groups: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for event in sorted_events:
        fingerprint = _normalize_text(event.get("claim_text"))
        narrative_key = _normalize_text(event.get("narrative_key")) or fingerprint
        if fingerprint:
            text_groups[f"{narrative_key}::{fingerprint}"].append(event)

    best_sync: dict[str, Any] | None = None
    for grouped_events in text_groups.values():
        if len(grouped_events) < 3:
            continue

        for start_index, event in enumerate(grouped_events):
            start_time = _parse_timestamp(event.get("timestamp"))
            if start_time == datetime.min:
                continue

            accounts: set[str] = set()
            window_events = 0
            for candidate in grouped_events[start_index:]:
                candidate_time = _parse_timestamp(candidate.get("timestamp"))
                if candidate_time == datetime.min:
                    continue
                if (candidate_time - start_time).total_seconds() > 120:
                    break
                user_id = str(candidate.get("user_id", "")).strip()
                if user_id:
                    accounts.add(user_id)
                window_events += 1

            if len(accounts) >= 3:
                score = min(100, 45 + (len(accounts) * 10) + max(0, window_events - len(accounts)) * 4)
                finding = {
                    "type": "synchronized_activity",
                    "severity": "high" if score >= 80 else "medium",
                    "score": score,
                    "accounts": sorted(accounts),
                    "explanation": "Multiple accounts posted similar content within a short time window.",
                    "narrative_key": str(event.get("narrative_key") or "").strip() or None,
                }
                if best_sync is None or finding["score"] > best_sync["score"]:
                    best_sync = finding

    if best_sync:
        anomalies.append(best_sync)

    domain_accounts: defaultdict[str, set[str]] = defaultdict(set)
    domain_counts: Counter[str] = Counter()
    for event in sorted_events:
        domain = _normalize_domain(event)
        if not domain:
            continue
        if domain.endswith("reddit.com"):
            continue
        user_id = str(event.get("user_id", "")).strip()
        domain_counts[domain] += 1
        if user_id:
            domain_accounts[domain].add(user_id)

    if domain_counts:
        top_domain, top_domain_count = domain_counts.most_common(1)[0]
        unique_accounts = domain_accounts.get(top_domain, set())
        if top_domain_count >= 3 and len(unique_accounts) >= 2:
            score = min(100, 40 + (top_domain_count * 8) + (len(unique_accounts) * 6))
            anomalies.append(
                {
                    "type": "domain_amplification",
                    "severity": "high" if score >= 80 else "medium",
                    "score": score,
                    "accounts": sorted(unique_accounts),
                    "explanation": "Repeated sharing of the same suspicious domain.",
                    "domain": top_domain,
                    "narrative_key": None,
                }
            )

    return {
        "events_count": len(events),
        "anomalies": anomalies,
    }
