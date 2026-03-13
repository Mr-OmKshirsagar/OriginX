from tests.conftest import create_test_client


def test_verify_claim_success(monkeypatch) -> None:
    from app.routes import claims as route_module

    captured: dict[str, str] = {}

    def _fake_insert_claim(claim_text: str):
        captured["claim_text"] = claim_text
        return {"id": "1", "claim_text": claim_text}

    monkeypatch.setattr(route_module, "insert_claim", _fake_insert_claim)

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "  The CITY   Water Supply  "})

    assert response.status_code == 200
    assert response.json() == {
        "message": "Claim received",
        "claim": "the city water supply",
    }
    assert captured["claim_text"] == "the city water supply"


def test_verify_claim_empty_after_normalization(monkeypatch) -> None:
    from app.routes import claims as route_module

    monkeypatch.setattr(route_module, "insert_claim", lambda claim_text: {"id": "1", "claim_text": claim_text})

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "   \n\t   "})

    assert response.status_code == 422
    assert "empty after normalization" in response.json()["detail"].lower()


def test_verify_claim_timeout(monkeypatch) -> None:
    from app.routes import claims as route_module

    def _raise_timeout(_claim_text: str):
        raise TimeoutError("timeout")

    monkeypatch.setattr(route_module, "insert_claim", _raise_timeout)

    client = create_test_client()
    response = client.post("/verify-claim", json={"text": "hello"})

    assert response.status_code == 504
    assert "timeout" in response.json()["detail"].lower()
