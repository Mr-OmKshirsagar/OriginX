from tests.conftest import create_test_client


def test_ocr_image_route(monkeypatch) -> None:
    from app.routes import analysis as route_module

    monkeypatch.setattr(
        route_module,
        "extract_text_from_image_bytes",
        lambda _image_bytes, _content_type: "Text from uploaded image",
    )

    client = create_test_client()
    response = client.post(
        "/analysis/ocr-image",
        json={"image_data": "ZmFrZS1pbWFnZS1ieXRlcw==", "content_type": "image/png"},
    )

    assert response.status_code == 200
    assert response.json()["text"] == "Text from uploaded image"


def test_propagation_analysis_route(monkeypatch) -> None:
    from app.routes import analysis as route_module

    monkeypatch.setattr(
        route_module,
        "analyze_propagation",
        lambda _events: {
            "patient_zero": "user_102",
            "spread_nodes": 34,
            "super_spreader": "user_84",
            "clusters": [],
            "graph": {"nodes": [], "edges": []},
        },
    )

    client = create_test_client()
    response = client.post(
        "/analysis/propagation",
        json={
            "events": [
                {
                    "user_id": "user_102",
                    "claim_text": "bridge collapse rumor",
                    "timestamp": "2026-03-14T10:00:00Z",
                }
            ]
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["patient_zero"] == "user_102"
    assert payload["spread_nodes"] == 34


def test_domain_security_route_with_url(monkeypatch) -> None:
    from app.routes import analysis as route_module

    monkeypatch.setattr(
        route_module,
        "analyze_domain_risk",
        lambda _url: {
            "url": "https://bad.example/login",
            "domain": "bad.example",
            "domain_risk": "high",
            "reason": "Newly created domain with phishing reports",
        },
    )

    client = create_test_client()
    response = client.post(
        "/analysis/domain-security",
        json={"url": "https://bad.example/login"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["results"][0]["domain_risk"] == "high"


def test_domain_security_route_requires_input() -> None:
    client = create_test_client()
    response = client.post("/analysis/domain-security", json={})
    assert response.status_code == 422


def test_reddit_propagation_route(monkeypatch) -> None:
    from app.routes import analysis as route_module

    monkeypatch.setattr(
        route_module,
        "analyze_reddit_propagation",
        lambda **_kwargs: {
            "source": "reddit",
            "query": "bridge collapse rumor",
            "events_count": 12,
            "analysis": {
                "patient_zero": "user_102",
                "spread_nodes": 7,
                "super_spreader": "user_84",
                "clusters": [],
                "graph": {"nodes": [], "edges": []},
            },
        },
    )

    client = create_test_client()
    response = client.post(
        "/analysis/reddit-propagation",
        json={
            "query": "bridge collapse rumor",
            "limit": 10,
            "include_comments": True,
            "comments_per_post": 5,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "reddit"
    assert payload["analysis"]["patient_zero"] == "user_102"
