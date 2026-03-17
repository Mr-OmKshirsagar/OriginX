from tests.conftest import create_test_client


def test_verify_claim_no_history(monkeypatch) -> None:
    from app.routes import claims as route_module

    captured: dict[str, str] = {}
    saved_payload: dict[str, object] = {}

    def _fake_insert_claim(claim_text: str):
        captured["claim_text"] = claim_text
        return {"id": "1", "claim_text": claim_text}

    monkeypatch.setattr(route_module, "check_verification_history", lambda _claim_text: None)
    monkeypatch.setattr(route_module, "insert_claim", _fake_insert_claim)
    monkeypatch.setattr(
        route_module,
        "search_news_sources",
        lambda _claim_text: {
            "articles_found": 1,
            "articles": [
                {
                    "source": "Reuters",
                    "title": "City water supply update",
                    "url": "https://example.com/1",
                    "description": "desc",
                    "similarity_score": 80,
                }
            ],
        },
    )
    monkeypatch.setattr(
        route_module,
        "generate_verification_result",
        lambda _claim_text, _articles: {
            "claim": "the city water supply",
            "verification_result": "true",
            "verdict": "Likely true",
            "credibility_score": 87,
            "top_credible_articles": [
                {
                    "source": "Reuters",
                    "title": "City water supply update",
                    "description": "desc",
                    "similarity_score": 80,
                }
            ],
        },
    )
    monkeypatch.setattr(
        route_module,
        "generate_evidence_summary",
        lambda _claim_text, _articles, output_language="en": "Reuters reports city officials said the water supply remains safe.",
    )

    def _fake_insert_verification_history(**kwargs):
        saved_payload.update(kwargs)
        return {"id": "vh_1", **kwargs}

    monkeypatch.setattr(route_module, "insert_verification_history", _fake_insert_verification_history)

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "  The CITY   Water Supply  "})

    assert response.status_code == 200
    assert response.json() == {
        "status": "generated",
        "message": "No history found. Generated and stored a new verification result.",
        "claim": "the city water supply",
        "verification_result": "true",
        "verdict": "Likely true",
        "credibility_score": 87,
        "summary": "Reuters reports city officials said the water supply remains safe.",
        "articles_found": 1,
        "sources": [
            {
                "source": "Reuters",
                "title": "City water supply update",
                "url": "https://example.com/1",
                "description": "desc",
                "similarity_score": 80,
            }
        ],
    }
    assert captured["claim_text"] == "the city water supply"
    assert saved_payload["claim_text"] == "the city water supply"
    assert saved_payload["verification_result"] == "true"
    assert saved_payload["verdict"] == "Likely true"
    assert saved_payload["credibility_score"] == 87


def test_verify_claim_history_found(monkeypatch) -> None:
    from app.routes import claims as route_module

    def _should_not_call(_claim_text: str):
        raise AssertionError("search_news_sources should not be called when history exists")

    monkeypatch.setattr(
        route_module,
        "check_verification_history",
        lambda _claim_text: {
            "verification_result": "false",
            "verdict": "Likely false or unsupported",
            "credibility_score": 22,
            "summary": "Authorities confirmed the water supply is safe.",
        },
    )
    monkeypatch.setattr(route_module, "insert_claim", lambda claim_text: {"id": "1", "claim_text": claim_text})
    monkeypatch.setattr(route_module, "search_news_sources", _should_not_call)
    monkeypatch.setattr(
        route_module,
        "generate_evidence_summary",
        lambda _claim_text, _articles, output_language="en": "Authorities confirmed the water supply is safe.",
    )

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "The city water supply has been poisoned"})

    assert response.status_code == 200
    assert response.json() == {
        "status": "found",
        "verification_result": "false",
        "verdict": "Likely false or unsupported",
        "credibility_score": 22,
        "summary": "Authorities confirmed the water supply is safe.",
    }


def test_verify_claim_empty_after_normalization(monkeypatch) -> None:
    from app.routes import claims as route_module

    monkeypatch.setattr(route_module, "check_verification_history", lambda _claim_text: None)
    monkeypatch.setattr(route_module, "insert_claim", lambda claim_text: {"id": "1", "claim_text": claim_text})
    monkeypatch.setattr(
        route_module,
        "generate_verification_result",
        lambda _claim_text, _articles: {
            "claim": "hello",
            "verification_result": "false",
            "verdict": "Likely false or unsupported",
            "credibility_score": 20,
            "top_credible_articles": [],
        },
    )
    monkeypatch.setattr(
        route_module,
        "generate_evidence_summary",
        lambda _claim_text, _articles, output_language="en": "No matching high-credibility reports were found.",
    )
    monkeypatch.setattr(route_module, "insert_verification_history", lambda **_kwargs: {"id": "vh_1"})
    monkeypatch.setattr(route_module, "search_news_sources", lambda _claim_text: {"articles_found": 0, "articles": []})

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "   \n\t   "})

    assert response.status_code == 422
    assert "empty after normalization" in response.json()["detail"].lower()


def test_verify_claim_timeout(monkeypatch) -> None:
    from app.routes import claims as route_module

    def _raise_timeout(_claim_text: str):
        raise TimeoutError("timeout")

    monkeypatch.setattr(route_module, "check_verification_history", lambda _claim_text: None)
    monkeypatch.setattr(route_module, "insert_claim", _raise_timeout)
    monkeypatch.setattr(route_module, "generate_verification_result", lambda _claim_text, _articles: {})
    monkeypatch.setattr(route_module, "insert_verification_history", lambda **_kwargs: {"id": "vh_1"})
    monkeypatch.setattr(route_module, "search_news_sources", lambda _claim_text: {"articles_found": 0, "articles": []})

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "hello"})

    assert response.status_code == 504
    assert "timeout" in response.json()["detail"].lower()


def test_verify_claim_no_history_newsapi_unavailable(monkeypatch) -> None:
    from app.routes import claims as route_module

    monkeypatch.setattr(route_module, "check_verification_history", lambda _claim_text: None)
    monkeypatch.setattr(route_module, "insert_claim", lambda claim_text: {"id": "1", "claim_text": claim_text})
    monkeypatch.setattr(
        route_module,
        "generate_verification_result",
        lambda _claim_text, _articles: {
            "claim": "hello",
            "verification_result": "false",
            "verdict": "Likely false or unsupported",
            "credibility_score": 20,
            "top_credible_articles": [],
        },
    )
    monkeypatch.setattr(
        route_module,
        "generate_evidence_summary",
        lambda _claim_text, _articles, output_language="en": "No matching high-credibility reports were found.",
    )
    monkeypatch.setattr(route_module, "insert_verification_history", lambda **_kwargs: {"id": "vh_1"})

    def _raise_no_key(_claim_text: str):
        raise ValueError("NEWSAPI_KEY is not configured.")

    monkeypatch.setattr(route_module, "search_news_sources", _raise_no_key)

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "hello"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "generated"
    assert payload["articles_found"] == 0
    assert "warning" in payload
