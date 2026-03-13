from tests.conftest import create_test_client


def test_test_db_status_success(monkeypatch) -> None:
    from app.routes import test_db as route_module

    monkeypatch.setattr(route_module, "check_supabase_connection", lambda: (True, "ok"))

    client = create_test_client()
    response = client.get("/test-db/status")

    assert response.status_code == 200
    assert response.json()["connected"] is True


def test_test_db_insert_timeout(monkeypatch) -> None:
    from app.routes import test_db as route_module

    def _raise_timeout(_claim_text: str):
        raise TimeoutError("timeout")

    monkeypatch.setattr(route_module, "insert_claim", _raise_timeout)

    client = create_test_client()
    response = client.post("/test-db", json={"claim_text": "x"})

    assert response.status_code == 504
    assert "timeout" in response.json()["detail"].lower()


def test_test_db_history_success(monkeypatch) -> None:
    from app.routes import test_db as route_module

    monkeypatch.setattr(
        route_module,
        "get_claim_history",
        lambda claim_text: [{"claim_text": claim_text, "verification_result": "ok"}],
    )

    client = create_test_client()
    response = client.get("/test-db/history", params={"claim_text": "x"})

    assert response.status_code == 200
    assert response.json()[0]["claim_text"] == "x"


def test_test_db_history_timeout(monkeypatch) -> None:
    from app.routes import test_db as route_module

    def _raise_timeout(_claim_text: str):
        raise TimeoutError("timeout")

    monkeypatch.setattr(route_module, "get_claim_history", _raise_timeout)

    client = create_test_client()
    response = client.get("/test-db/history", params={"claim_text": "x"})

    assert response.status_code == 504
    assert "timeout" in response.json()["detail"].lower()
