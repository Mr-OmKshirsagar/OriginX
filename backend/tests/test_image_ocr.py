from app.config import settings
from app.services.image_ocr import extract_text_from_image_bytes


class _FakeResponse:
    def __init__(self, payload: dict, status_code: int = 200):
        self._payload = payload
        self.status_code = status_code
        self.ok = status_code < 400
        self.text = str(payload)

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError("HTTP error")

    def json(self) -> dict:
        return self._payload


def test_extract_text_from_image_bytes_uses_gemini(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "demo-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")

    def _fake_post(*args, **kwargs):
        return _FakeResponse(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "Claim text from image",
                                }
                            ]
                        }
                    }
                ]
            }
        )

    monkeypatch.setattr("app.services.image_ocr.requests.post", _fake_post)

    extracted = extract_text_from_image_bytes(b"fake-image-bytes", "image/png")

    assert extracted == "Claim text from image"


def test_extract_text_from_image_bytes_falls_back_from_invalid_model(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "demo-key")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-3.0-mini")

    class _FallbackResponse:
        def __init__(self, payload: dict, status_code: int):
            self._payload = payload
            self.status_code = status_code
            self.ok = status_code < 400
            self.text = str(payload)

        def json(self) -> dict:
            return self._payload

    calls: list[str] = []

    def _fake_post(url: str, **kwargs):
        calls.append(url)
        if "gemini-3.0-mini" in url:
            return _FallbackResponse({"error": {"message": "Model not found"}}, 404)
        return _FallbackResponse(
            {
                "candidates": [
                    {
                        "content": {
                            "parts": [
                                {
                                    "text": "Claim text from image",
                                }
                            ]
                        }
                    }
                ]
            },
            200,
        )

    monkeypatch.setattr("app.services.image_ocr.requests.post", _fake_post)

    extracted = extract_text_from_image_bytes("ZmFrZS1pbWFnZS1ieXRlcw==", "image/png")

    assert extracted == "Claim text from image"
    assert any("gemini-3.0-mini" in call for call in calls)
    assert any("gemini-2.5-flash" in call for call in calls)


def test_extract_text_from_image_bytes_rejects_invalid_base64(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "demo-key")

    try:
        extract_text_from_image_bytes("not-valid-base64", "image/png")
    except ValueError as exc:
        assert "Invalid base64 image payload" in str(exc)
    else:
        raise AssertionError("Expected ValueError for invalid base64")


def test_extract_text_from_image_bytes_requires_supported_type(monkeypatch) -> None:
    monkeypatch.setattr(settings, "GOOGLE_AI_STUDIO_API_KEY", "demo-key")

    try:
        extract_text_from_image_bytes(b"fake-image-bytes", "application/pdf")
    except ValueError as exc:
        assert "Unsupported image type" in str(exc)
    else:
        raise AssertionError("Expected ValueError for unsupported image type")
