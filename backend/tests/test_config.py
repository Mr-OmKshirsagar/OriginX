from app.config import settings, validate_required_settings


def test_validate_required_settings_success(monkeypatch) -> None:
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setattr(settings, "SUPABASE_KEY", "example-key")

    validate_required_settings()


def test_validate_required_settings_missing_values(monkeypatch) -> None:
    monkeypatch.setattr(settings, "SUPABASE_URL", "")
    monkeypatch.setattr(settings, "SUPABASE_KEY", "")

    try:
        validate_required_settings()
    except ValueError as exc:
        message = str(exc)
        assert "SUPABASE_URL" in message
        assert "SUPABASE_KEY" in message
    else:
        raise AssertionError("Expected ValueError for missing settings")
