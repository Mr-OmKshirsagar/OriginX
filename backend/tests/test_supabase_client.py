from app.config import settings
from app.services.supabase_client import check_supabase_connection


class _Resp:
    def __init__(self, ok: bool, status_code: int) -> None:
        self.ok = ok
        self.status_code = status_code


def test_check_supabase_connection_success(monkeypatch) -> None:
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_KEY", "example-key")

    def _fake_get(*args, **kwargs):
        return _Resp(ok=True, status_code=200)

    monkeypatch.setattr("app.services.supabase_client.requests.get", _fake_get)

    ok, message = check_supabase_connection()
    assert ok is True
    assert "reachable" in message.lower()


def test_check_supabase_connection_missing_env(monkeypatch) -> None:
    monkeypatch.setattr(settings, "SUPABASE_URL", "")
    monkeypatch.setattr(settings, "SUPABASE_KEY", "")

    ok, message = check_supabase_connection()
    assert ok is False
    assert "missing" in message.lower()
