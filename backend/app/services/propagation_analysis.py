from __future__ import annotations

from collections import defaultdict
from datetime import datetime
import re
from typing import Any

import networkx as nx


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def _jaccard_similarity(a: str, b: str) -> float:
    a_tokens = _tokenize(a)
    b_tokens = _tokenize(b)
    if not a_tokens or not b_tokens:
        return 0.0
    intersection = len(a_tokens.intersection(b_tokens))
    union = len(a_tokens.union(b_tokens))
    return intersection / union if union else 0.0


def _parse_timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.min


def cluster_narratives(events: list[dict[str, Any]], threshold: float = 0.35) -> list[dict[str, Any]]:
    clusters: list[dict[str, Any]] = []
    for event in events:
        claim_text = str(event.get("claim_text", "")).strip()
        if not claim_text:
            continue

        assigned = False
        for cluster in clusters:
            if _jaccard_similarity(claim_text, cluster["prototype_text"]) >= threshold:
                cluster["events"].append(event)
                assigned = True
                break

        if not assigned:
            clusters.append(
                {
                    "cluster_id": f"cluster_{len(clusters) + 1}",
                    "prototype_text": claim_text,
                    "events": [event],
                }
            )

    return clusters


def generate_propagation_graph(events: list[dict[str, Any]]) -> nx.DiGraph:
    graph = nx.DiGraph()
    sorted_events = sorted(events, key=lambda item: _parse_timestamp(item.get("timestamp")))

    by_narrative: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for event in sorted_events:
        user_id = str(event.get("user_id", "")).strip()
        if not user_id:
            continue

        graph.add_node(user_id)
        narrative_key = str(event.get("narrative_key", "")).strip() or str(event.get("claim_text", "")).strip().lower()
        by_narrative[narrative_key].append(event)

    for narrative_events in by_narrative.values():
        for i in range(1, len(narrative_events)):
            src = str(narrative_events[i - 1].get("user_id", "")).strip()
            dst = str(narrative_events[i].get("user_id", "")).strip()
            if src and dst and src != dst:
                weight = graph.get_edge_data(src, dst, {}).get("weight", 0) + 1
                graph.add_edge(src, dst, weight=weight)

    return graph


def estimate_patient_zero(events: list[dict[str, Any]]) -> str | None:
    if not events:
        return None

    first_event = min(events, key=lambda item: _parse_timestamp(item.get("timestamp")))
    user_id = str(first_event.get("user_id", "")).strip()
    return user_id or None


def _timeline_colors(index: int) -> tuple[str, str]:
    palette = [
        ("#FF4500", "#FF4500"),
        ("#FFB366", "#FFB366"),
        ("#FF8A5B", "#FF8A5B"),
        ("#FBBF24", "#FBBF24"),
    ]
    return palette[min(index, len(palette) - 1)]


def build_timeline(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    sorted_events = sorted(events, key=lambda item: _parse_timestamp(item.get("timestamp")))
    if not sorted_events:
        return []

    unique_accounts = 0
    seen_accounts: set[str] = set()
    timeline: list[dict[str, Any]] = []

    for index, event in enumerate(sorted_events):
        user_id = str(event.get("user_id", "")).strip() or "unknown"
        claim_text = str(event.get("claim_text", "")).strip() or "Propagation event recorded"
        timestamp = event.get("timestamp")
        if user_id not in seen_accounts:
            seen_accounts.add(user_id)
            unique_accounts += 1

        dot_color, line_color = _timeline_colors(index)
        timeline.append(
            {
                "title": user_id,
                "detail": claim_text,
                "time": timestamp,
                "metric": f"{unique_accounts} node{'s' if unique_accounts != 1 else ''} tracked",
                "dot_color": dot_color,
                "line_color": line_color,
            }
        )

    return timeline


def analyze_propagation(events: list[dict[str, Any]]) -> dict[str, Any]:
    graph = generate_propagation_graph(events)
    patient_zero = estimate_patient_zero(events)

    top_amplifier: str | None = None
    if graph.number_of_nodes() > 0:
        top_amplifier = max(graph.out_degree, key=lambda item: item[1])[0]

    clusters = cluster_narratives(events)
    nodes = [
        {
            "id": str(node),
            "label": str(node),
            "event_count": sum(1 for event in events if str(event.get("user_id", "")).strip() == str(node)),
            "is_patient_zero": str(node) == patient_zero,
            "is_top_amplifier": str(node) == top_amplifier,
        }
        for node in graph.nodes()
    ]
    edges = [
        {"source": src, "target": dst, "weight": attrs.get("weight", 1)}
        for src, dst, attrs in graph.edges(data=True)
    ]
    timeline = build_timeline(events)

    return {
        "patient_zero": patient_zero,
        "top_amplifier": top_amplifier,
        "events_captured": len(events),
        "nodes": nodes,
        "edges": edges,
        "timeline": timeline,
        "spread_nodes": graph.number_of_nodes(),
        "super_spreader": top_amplifier,
        "clusters": [{"cluster_id": c["cluster_id"], "event_count": len(c["events"])} for c in clusters],
        "graph": {
            "nodes": list(graph.nodes()),
            "edges": edges,
        },
    }
