from app.config import settings
from app.services import claims_service


def test_insert_claim_supabase_path(monkeypatch) -> None:
    monkeypatch.setattr(settings, "SUPABASE_USE_DIRECT_DB", False)
    monkeypatch.setattr(settings, "SUPABASE_DIRECT_DB_URL", "")

    class _Resp:
        data = [{"id": "1", "claim_text": "abc"}]

    def _fake_run_with_timeout(func, timeout_seconds=10):
        return _Resp()

    monkeypatch.setattr(claims_service, "_run_with_timeout", _fake_run_with_timeout)

    result = claims_service.insert_claim("abc")
    assert result["claim_text"] == "abc"


def test_insert_claim_direct_path(monkeypatch) -> None:
    monkeypatch.setattr(settings, "SUPABASE_USE_DIRECT_DB", True)
    monkeypatch.setattr(settings, "SUPABASE_DIRECT_DB_URL", "postgresql://demo")

    def _fake_insert_direct(claim_text: str):
        return {"id": "2", "claim_text": claim_text, "created_at": "now"}

    def _fake_run_with_timeout(func, timeout_seconds=10):
        return func()

    monkeypatch.setattr(claims_service, "_insert_claim_direct", _fake_insert_direct)
    monkeypatch.setattr(claims_service, "_run_with_timeout", _fake_run_with_timeout)

    result = claims_service.insert_claim("direct")
    assert result["claim_text"] == "direct"
