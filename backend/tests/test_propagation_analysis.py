from app.services.propagation_analysis import analyze_propagation, cluster_narratives


def test_cluster_narratives_groups_similar_claims() -> None:
    events = [
        {"user_id": "user_1", "claim_text": "Water is poisoned in city center"},
        {"user_id": "user_2", "claim_text": "City center water has been poisoned"},
        {"user_id": "user_3", "claim_text": "Airport shutdown due to weather"},
    ]

    clusters = cluster_narratives(events, threshold=0.3)

    assert len(clusters) == 2
    assert sum(cluster["event_count"] if "event_count" in cluster else len(cluster["events"]) for cluster in clusters) >= 3


def test_analyze_propagation_returns_expected_shape() -> None:
    events = [
        {
            "user_id": "user_102",
            "claim_text": "bridge collapse rumor",
            "narrative_key": "bridge collapse rumor",
            "timestamp": "2026-03-14T10:00:00Z",
        },
        {
            "user_id": "user_84",
            "claim_text": "bridge collapse rumor",
            "narrative_key": "bridge collapse rumor",
            "timestamp": "2026-03-14T10:01:00Z",
        },
        {
            "user_id": "user_55",
            "claim_text": "bridge collapse rumor",
            "narrative_key": "bridge collapse rumor",
            "timestamp": "2026-03-14T10:02:00Z",
        },
    ]

    result = analyze_propagation(events)

    assert result["patient_zero"] == "user_102"
    assert result["events_captured"] == 3
    assert result["top_amplifier"] in {"user_102", "user_84"}
    assert result["spread_nodes"] == 3
    assert result["super_spreader"] in {"user_102", "user_84"}
    assert result["nodes"][0]["id"] == "user_102"
    assert result["timeline"][0]["title"] == "user_102"
    assert "graph" in result
    assert "edges" in result["graph"]
