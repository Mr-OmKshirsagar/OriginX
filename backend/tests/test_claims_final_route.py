from tests.conftest import create_test_client


def test_verify_claim_final_history_hit(monkeypatch) -> None:
    from app.routes import claims as route_module

    monkeypatch.setattr(
        route_module,
        "get_claim_history",
        lambda _claim_text: [
            {
                "verification_result": "false",
                "credibility_score": 18,
                "summary": "Authorities confirmed that the water supply is safe.",
                "sources": [
                    {"source": "Reuters"},
                    {"source": "BBC"},
                ],
            },
            {"verification_result": "false"},
        ],
    )
    monkeypatch.setattr(
        route_module,
        "generate_evidence_summary",
        lambda _claim_text, _articles, output_language="en": "Authorities confirmed that the water supply is safe.",
    )

    client = create_test_client()
    response = client.post(
        "/verify-claim/final",
        json={"text": "City water supply poisoned"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "claim": "city water supply poisoned",
        "verification_result": "false",
        "credibility_score": 18,
        "summary": "Authorities confirmed that the water supply is safe.",
        "sources": ["Reuters", "BBC"],
        "history_count": 2,
    }


def test_verify_claim_final_generates_and_stores(monkeypatch) -> None:
    from app.routes import claims as route_module

    calls = {"history": 0}

    def _fake_get_history(_claim_text: str):
        calls["history"] += 1
        if calls["history"] == 1:
            return []
        return [
            {
                "verification_result": "false",
                "credibility_score": 18,
                "summary": "Authorities confirmed that the water supply is safe.",
                "sources": [{"source": "Reuters"}, {"source": "BBC"}],
            }
        ]

    monkeypatch.setattr(route_module, "get_claim_history", _fake_get_history)
    monkeypatch.setattr(route_module, "insert_claim", lambda _claim_text: {"id": "1"})
    monkeypatch.setattr(
        route_module,
        "search_news_sources",
        lambda _claim_text: {
            "articles_found": 2,
            "articles": [
                {"source": "Reuters", "title": "t1", "description": "d1", "similarity_score": 80},
                {"source": "BBC", "title": "t2", "description": "d2", "similarity_score": 79},
            ],
        },
    )
    monkeypatch.setattr(
        route_module,
        "generate_verification_result",
        lambda _claim_text, _articles: {
            "verification_result": "false",
            "verdict": "Likely false or unsupported",
            "credibility_score": 18,
            "top_credible_articles": _articles,
        },
    )
    monkeypatch.setattr(
        route_module,
        "generate_evidence_summary",
        lambda _claim_text, _articles, output_language="en": "Authorities confirmed that the water supply is safe.",
    )

    saved = {}

    def _fake_insert_verification_history(**kwargs):
        saved.update(kwargs)
        return {"id": "vh_1", **kwargs}

    monkeypatch.setattr(route_module, "insert_verification_history", _fake_insert_verification_history)

    client = create_test_client()
    response = client.post(
        "/verify-claim/final",
        json={"text": "City water supply poisoned"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["claim"] == "city water supply poisoned"
    assert payload["verification_result"] == "false"
    assert payload["credibility_score"] == 18
    assert payload["summary"] == "Authorities confirmed that the water supply is safe."
    assert payload["sources"] == ["Reuters", "BBC"]
    assert payload["history_count"] == 1
    assert saved["summary"] == "Authorities confirmed that the water supply is safe."


def test_verify_claim_final_with_propagation(monkeypatch) -> None:
    from app.routes import claims as route_module

    monkeypatch.setattr(
        route_module,
        "get_claim_history",
        lambda _claim_text: [
            {
                "verification_result": "false",
                "credibility_score": 18,
                "summary": "Authorities confirmed that the water supply is safe.",
                "sources": [{"source": "Reuters"}],
            }
        ],
    )
    monkeypatch.setattr(
        route_module,
        "generate_evidence_summary",
        lambda _claim_text, _articles, output_language="en": "Authorities confirmed that the water supply is safe.",
    )
    monkeypatch.setattr(
        route_module,
        "analyze_reddit_propagation",
        lambda **_kwargs: {
            "source": "reddit",
            "query": "city water supply poisoned",
            "events_count": 10,
            "analysis": {"patient_zero": "user_102", "spread_nodes": 7, "super_spreader": "user_84"},
        },
    )

    client = create_test_client()
    response = client.post(
        "/verify-claim/final",
        json={
            "text": "City water supply poisoned",
            "include_propagation": True,
            "reddit_limit": 5,
            "include_reddit_comments": False,
            "reddit_comments_per_post": 0,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert "propagation" in payload
    assert payload["propagation"]["source"] == "reddit"
